import {NextRequest, NextResponse} from 'next/server';
import {validateAdminAccess} from '@/lib/adminMiddleware';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authResult = await validateAdminAccess();
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      {error: 'Failed to fetch products'},
      {status: 500},
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await validateAdminAccess();
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const categoryId = parseInt(formData.get('categoryId') as string);
    const image = formData.get('image') as File | null;

    if (!name || !description || !price || !categoryId) {
      return NextResponse.json(
        {error: 'Missing required fields'},
        {status: 400},
      );
    }

    let imageUrl = '';
    if (image) {
      imageUrl = '/placeholder.jpg';
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        categoryId,
        imageUrl,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product, {status: 201});
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json(
      {error: 'Failed to create product'},
      {status: 500},
    );
  }
}
