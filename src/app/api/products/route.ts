import {NextResponse} from 'next/server';
import prisma from '@/lib/prisma';
import {Prisma} from '@prisma/client';

export async function GET(request: Request) {
  try {
    const {searchParams} = new URL(request.url);
    const categoryName = searchParams.get('category');

    const whereClause = categoryName
      ? {
          category: {
            is: {
              name: {
                equals: categoryName as string,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        }
      : undefined;

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      {error: 'Failed to fetch products'},
      {status: 500},
    );
  }
}

export async function POST(request: Request) {
  try {
    const {name, description, price, imageUrl, categoryId} =
      await request.json();
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        imageUrl,
        category: {connect: {id: categoryId}},
      },
    });

    return NextResponse.json(product, {status: 201});
  } catch (error) {
    return NextResponse.json(
      {error: 'Failed to create product'},
      {status: 500},
    );
  }
}
