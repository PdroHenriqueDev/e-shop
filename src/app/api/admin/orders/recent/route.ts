import {NextResponse} from 'next/server';
import {validateAdminAccess} from '@/lib/adminMiddleware';
import prisma from '@/lib/prisma';

export async function GET() {
  const result = await validateAdminAccess();

  if (result.error) {
    return result.error;
  }

  try {
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedOrders = recentOrders.map(order => ({
      id: order.id,
      user: order.user.name || order.user.email,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Failed to fetch recent orders:', error);
    return NextResponse.json(
      {error: 'Failed to fetch recent orders'},
      {status: 500},
    );
  }
}
