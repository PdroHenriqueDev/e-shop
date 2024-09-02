import {NextResponse} from 'next/server';
import prisma from '@/lib/prisma';
import {User} from '@prisma/client';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({error: 'Not authenticated'}, {status: 401});
    }

    const {productId, quantity} = await request.json();

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json({error: 'Invalid input'}, {status: 400});
    }

    const {id} = session.user as User;
    const userId = id;

    const cart = await prisma.cart.upsert({
      where: {userId},
      update: {
        items: {
          create: {
            productId,
            quantity,
          },
        },
      },
      create: {
        userId: userId,
        items: {
          create: {
            productId,
            quantity,
          },
        },
      },
    });

    return NextResponse.json(cart, {status: 201});
  } catch (error) {
    console.error('Error adding product to cart:', error);
    return NextResponse.json(
      {error: 'Failed to add product to cart'},
      {status: 500},
    );
  }
}
