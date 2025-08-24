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
    const userId = Number(id);

    // First, verify the user exists to prevent foreign key constraint error
    const userExists = await prisma.user.findUnique({
      where: {id: userId},
    });

    if (!userExists) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    // Find or create the cart
    let cart = await prisma.cart.findUnique({
      where: {userId},
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    // Now upsert the cart item with the correct cartId
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingCartItem) {
      await prisma.cartItem.update({
        where: {
          id: existingCartItem.id,
        },
        data: {
          quantity: {
            increment: quantity,
          },
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    // Fetch the updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: {userId},
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCart, {status: 201});
  } catch (error) {
    console.error('Cart POST error:', error);
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
    const userId = Number(id);

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
    console.error('Cart GET error:', error);
    return NextResponse.json(
      {error: 'Failed to fetch cart items'},
      {status: 500},
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({error: 'Not authenticated'}, {status: 401});
    }

    const {productId, quantity} = await request.json();
    const {id} = session.user as User;
    const userId = Number(id);

    const updatedItem = await prisma.cartItem.update({
      where: {cartId_productId: {cartId: userId, productId}},
      data: {quantity},
    });

    return NextResponse.json(updatedItem, {status: 200});
  } catch (error) {
    console.error('Cart PUT error:', error);
    return NextResponse.json(
      {error: 'Failed to update cart item'},
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
    console.error('Cart DELETE error:', error);
    return NextResponse.json(
      {error: 'Failed to delete cart item'},
      {status: 500},
    );
  }
}
