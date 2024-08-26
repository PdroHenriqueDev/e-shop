import {NextResponse} from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany();
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
    const {name, description, price, imageUrl} = await request.json();
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        imageUrl,
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
