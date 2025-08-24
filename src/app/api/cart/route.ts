import {NextResponse} from 'next/server';
import prisma from '@/lib/prisma';
import {User} from '@prisma/client';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/authOptions';

const CART_INCLUDE = {
  items: {
    include: {
      product: true,
    },
  },
};

async function authenticate() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      error: NextResponse.json({error: 'Not authenticated'}, {status: 401}),
    };
  }
  return {userId: Number((session.user as User).id)};
}

async function findOrCreateCart(userId: number) {
  let cart = await prisma.cart.findUnique({
    where: {userId},
    include: CART_INCLUDE,
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {userId},
      include: CART_INCLUDE,
    });
  }

  return cart;
}

async function upsertCartItem(
  cartId: number,
  productId: number,
  quantity: number,
) {
  const existing = await prisma.cartItem.findUnique({
    where: {cartId_productId: {cartId, productId}},
  });

  if (existing) {
    return prisma.cartItem.update({
      where: {id: existing.id},
      data: {quantity: {increment: quantity}},
    });
  }

  return prisma.cartItem.create({
    data: {cartId, productId, quantity},
  });
}

export async function POST(request: Request) {
  try {
    const auth = await authenticate();
    if (auth.error) return auth.error;

    const {productId, quantity} = await request.json();
    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json({error: 'Invalid input'}, {status: 400});
    }

    const userExists = await prisma.user.findUnique({where: {id: auth.userId}});
    if (!userExists) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    const cart = await findOrCreateCart(auth.userId);
    await upsertCartItem(cart.id, productId, quantity);

    const updatedCart = await prisma.cart.findUnique({
      where: {userId: auth.userId},
      include: CART_INCLUDE,
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
    const auth = await authenticate();
    if (auth.error) return auth.error;

    const cart = await prisma.cart.findUnique({
      where: {userId: auth.userId},
      include: CART_INCLUDE,
    });

    const items = cart?.items || [];
    return NextResponse.json(items, {status: 200});
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
    const auth = await authenticate();
    if (auth.error) return auth.error;

    const {productId, quantity} = await request.json();
    const cart = await prisma.cart.findUnique({where: {userId: auth.userId}});

    if (!cart) {
      return NextResponse.json({error: 'Cart not found'}, {status: 404});
    }

    const updatedItem = await prisma.cartItem.update({
      where: {cartId_productId: {cartId: cart.id, productId}},
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
    const auth = await authenticate();
    if (auth.error) return auth.error;

    const {productId} = await request.json();
    if (!productId) {
      return NextResponse.json({error: 'Invalid input'}, {status: 400});
    }

    const cart = await prisma.cart.findUnique({where: {userId: auth.userId}});
    if (!cart) {
      return NextResponse.json({error: 'Cart not found'}, {status: 404});
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: {cartId_productId: {cartId: cart.id, productId}},
    });

    if (!cartItem) {
      return NextResponse.json({error: 'Cart item not found'}, {status: 404});
    }

    await prisma.cartItem.delete({
      where: {cartId_productId: {cartId: cart.id, productId}},
    });

    return NextResponse.json({message: 'Cart item deleted successfully'});
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json(
      {error: 'Failed to delete cart item'},
      {status: 500},
    );
  }
}
