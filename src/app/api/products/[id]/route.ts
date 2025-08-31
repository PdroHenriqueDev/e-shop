import {NextResponse} from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _request: Request,
  {params}: {params: Promise<{id: string}>},
) {
  const resolvedParams = await params;
  const {id} = resolvedParams;

  if (!id) {
    return NextResponse.json({error: 'Invalid request'}, {status: 400});
  }

  try {
    const product = await prisma.product.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!product) {
      return NextResponse.json({error: 'Product not found'}, {status: 404});
    }

    return NextResponse.json(product, {status: 200});
  } catch (error) {
    return NextResponse.json({error: 'Failed to fetch product'}, {status: 500});
  }
}
