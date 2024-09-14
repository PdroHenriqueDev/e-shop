import {NextResponse} from 'next/server';
import prisma from '@/lib/prisma';
import {User} from '@prisma/client';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/authOptions';

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
          upsert: {
            where: {cartId_productId: {productId, cartId: userId}},
            update: {
              quantity: {
                increment: quantity,
              },
            },
            create: {
              productId,
              quantity,
            },
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
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(cart, {status: 201});
  } catch (error) {
    console.log('Error adding product to cart:', error);
    return NextResponse.json(
      {error: 'Failed to add product to cart'},
      {status: 500},
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({error: 'Not authenticated'}, {status: 401});
    }

    const {id} = session.user as User;
    const userId = id;

    const cart = await prisma.cart.findUnique({
      where: {userId},
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json([], {status: 200});
    }

    return NextResponse.json(cart.items, {status: 200});
  } catch (error) {
    console.log('Error fetching cart items:', error);
    return NextResponse.json(
      {error: 'Failed to fetch cart items'},
      {status: 500},
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({error: 'Not authenticated'}, {status: 401});
    }

    const {cartId, productId} = await request.json();

    if (!cartId || !productId) {
      return NextResponse.json({error: 'Invalid input11'}, {status: 400});
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId,
          productId,
        },
      },
    });

    if (!cartItem) {
      return NextResponse.json({error: 'Cart item not found'}, {status: 404});
    }

    await prisma.cartItem.delete({
      where: {
        cartId_productId: {
          cartId,
          productId,
        },
      },
    });

    return NextResponse.json(
      {message: 'Cart item deleted successfully'},
      {status: 200},
    );
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json(
      {error: 'Failed to delete cart item'},
      {status: 500},
    );
  }
}
