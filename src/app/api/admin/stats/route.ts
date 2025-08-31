import {NextResponse} from 'next/server';
import {validateAdminAccess} from '@/lib/adminMiddleware';
import prisma from '@/lib/prisma';

export async function GET() {
  const result = await validateAdminAccess();

  if (result.error) {
    return result.error;
  }

  try {
    const [totalUsers, totalProducts, totalOrders, orderTotals] =
      await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.order.aggregate({
          _sum: {
            total: true,
          },
        }),
      ]);

    const totalRevenue = orderTotals._sum.total || 0;

    return NextResponse.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      {error: 'Failed to fetch dashboard stats'},
      {status: 500},
    );
  }
}
