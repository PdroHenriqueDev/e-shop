import {NextResponse} from 'next/server';
import prisma from '@/lib/prisma';
import {User} from '@prisma/client';
import {getServerSession} from 'next-auth';
import {authOptions} from '../../auth/[...nextauth]/authOptions';

export async function GET(
  request: Request,
  {params}: {params: Promise<{id: string}>},
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({error: 'Not authenticated'}, {status: 401});
    }

    const {id} = session.user as User;
    const userId = Number(id);
    const resolvedParams = await params;
    const orderId = parseInt(resolvedParams.id);

    if (isNaN(orderId)) {
      return NextResponse.json({error: 'Invalid order ID'}, {status: 400});
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({error: 'Order not found'}, {status: 404});
    }

    if (order.userId !== userId) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 403});
    }

    return NextResponse.json(order, {status: 200});
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({error: 'Failed to fetch order'}, {status: 500});
  }
}
