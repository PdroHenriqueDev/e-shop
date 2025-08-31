import {NextRequest, NextResponse} from 'next/server';
import {validateAdminAccess} from '@/lib/adminMiddleware';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authResult = await validateAdminAccess();
  if (authResult) {
    return authResult;
  }

  try {
    const orders = await prisma.order.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({error: 'Failed to fetch orders'}, {status: 500});
  }
}
