import {NextRequest, NextResponse} from 'next/server';
import {validateAdminAccess} from '@/lib/adminMiddleware';
import prisma from '@/lib/prisma';

// GET: Retrieve a specific product
export async function GET(
  request: NextRequest,
  {params}: {params: Promise<{id: string}>},
) {
  const authResult = await validateAdminAccess();
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    if (isNaN(productId)) {
      return NextResponse.json({error: 'Invalid product ID'}, {status: 400});
    }

    const product = await prisma.product.findUnique({
      where: {id: productId},
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({error: 'Product not found'}, {status: 404});
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json({error: 'Failed to fetch product'}, {status: 500});
  }
}

export async function PUT(
  request: NextRequest,
  {params}: {params: Promise<{id: string}>},
) {
  const authResult = await validateAdminAccess();
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    if (isNaN(productId)) {
      return NextResponse.json({error: 'Invalid product ID'}, {status: 400});
    }

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

    const existingProduct = await prisma.product.findUnique({
      where: {id: productId},
    });

    if (!existingProduct) {
      return NextResponse.json({error: 'Product not found'}, {status: 404});
    }

    let imageUrl = existingProduct.imageUrl;
    if (image) {
      imageUrl = '/placeholder.jpg';
    }

    const product = await prisma.product.update({
      where: {id: productId},
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

    return NextResponse.json(product);
  } catch (error) {
    console.error('Failed to update product:', error);
    return NextResponse.json(
      {error: 'Failed to update product'},
      {status: 500},
    );
  }
}

export async function DELETE(
  request: NextRequest,
  {params}: {params: Promise<{id: string}>},
) {
  const authResult = await validateAdminAccess();
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    if (isNaN(productId)) {
      return NextResponse.json({error: 'Invalid product ID'}, {status: 400});
    }

    const existingProduct = await prisma.product.findUnique({
      where: {id: productId},
    });

    if (!existingProduct) {
      return NextResponse.json({error: 'Product not found'}, {status: 404});
    }

    await prisma.product.delete({
      where: {id: productId},
    });

    return NextResponse.json({message: 'Product deleted successfully'});
  } catch (error) {
    console.error('Failed to delete product:', error);
    return NextResponse.json(
      {error: 'Failed to delete product'},
      {status: 500},
    );
  }
}
