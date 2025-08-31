import {NextRequest, NextResponse} from 'next/server';
import {validateAdminAccess} from '@/lib/adminMiddleware';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  {params}: {params: {id: string}},
) {
  const authResult = await validateAdminAccess();
  if (authResult) {
    return authResult;
  }

  try {
    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({error: 'Invalid order ID'}, {status: 400});
    }

    const {status} = await request.json();
    if (!status) {
      return NextResponse.json({error: 'Status is required'}, {status: 400});
    }

    const validStatuses = [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({error: 'Invalid status'}, {status: 400});
    }

    const existingOrder = await prisma.order.findUnique({
      where: {id: orderId},
    });

    if (!existingOrder) {
      return NextResponse.json({error: 'Order not found'}, {status: 404});
    }

    const order = await prisma.order.update({
      where: {id: orderId},
      data: {status},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json({error: 'Failed to update order'}, {status: 500});
  }
}
