import {NextResponse} from 'next/server';
import prisma from '@/lib/prisma';
import {auth} from '../../../../auth';
import {SessionUser} from '@/interfaces/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({error: 'Not authenticated'}, {status: 401});
    }

    const {id} = session.user as SessionUser;
    const userId = Number(id);

    const {shippingAddress, paymentMethod, total} = await request.json();

    if (!shippingAddress || !paymentMethod || !total) {
      return NextResponse.json({error: 'Invalid input'}, {status: 400});
    }

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
      return NextResponse.json(
        {error: 'Cart is empty or not found'},
        {status: 400},
      );
    }

    const order = await prisma.$transaction(async tx => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          total,
          shippingAddress,
          paymentMethod,
          status: 'pending',
          paymentStatus: 'PENDING',
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
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

      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      return newOrder;
    });

    return NextResponse.json(order, {status: 201});
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({error: 'Failed to create order'}, {status: 500});
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({error: 'Not authenticated'}, {status: 401});
    }

    const {id} = session.user as SessionUser;
    const userId = Number(id);

    const orders = await prisma.order.findMany({
      where: {userId},
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders, {status: 200});
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({error: 'Failed to fetch orders'}, {status: 500});
  }
}
