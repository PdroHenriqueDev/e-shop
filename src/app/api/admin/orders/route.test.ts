import {NextResponse} from 'next/server';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import {validateAdminAccess} from '@/lib/adminMiddleware';
import prisma from '@/lib/prisma';

vi.mock('@/lib/adminMiddleware', () => ({
  validateAdminAccess: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    order: {
      findMany: vi.fn(),
    },
  },
}));

const mockValidateAdminAccess = validateAdminAccess as any;
const mockPrisma = prisma as any;

const mockOrders = [
  {
    id: 1,
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    total: 99.99,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    user: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    },
    items: [
      {
        id: 1,
        quantity: 2,
        price: 49.99,
        product: {
          id: 1,
          name: 'Test Product',
          imageUrl: 'https://example.com/image.jpg',
        },
      },
    ],
  },
  {
    id: 2,
    status: 'PENDING',
    paymentStatus: 'PENDING',
    total: 149.99,
    createdAt: new Date('2024-01-02T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    user: {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    items: [
      {
        id: 2,
        quantity: 1,
        price: 149.99,
        product: {
          id: 2,
          name: 'Another Product',
          imageUrl: 'https://example.com/image2.jpg',
        },
      },
    ],
  },
];

describe('Admin Orders API', () => {
  let GET: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const routeModule = await import('./route');
    GET = routeModule.GET;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/admin/orders', () => {
    describe('Authentication', () => {
      it('returns error when admin access validation fails', async () => {
        const mockErrorResponse = NextResponse.json(
          {error: 'Unauthorized'},
          {status: 401},
        );
        mockValidateAdminAccess.mockResolvedValue({
          error: mockErrorResponse,
        });

        const response = await GET();

        expect(mockValidateAdminAccess).toHaveBeenCalledOnce();
        expect(response).toBe(mockErrorResponse);
        expect(mockPrisma.order.findMany).not.toHaveBeenCalled();
      });

      it('proceeds when admin access validation succeeds', async () => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
        mockPrisma.order.findMany.mockResolvedValue(mockOrders);

        const response = await GET();

        expect(mockValidateAdminAccess).toHaveBeenCalledOnce();
        expect(mockPrisma.order.findMany).toHaveBeenCalledOnce();
        expect(response.status).toBe(200);
      });
    });

    describe('Data Fetching', () => {
      beforeEach(() => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
      });

      it('fetches orders with correct query parameters', async () => {
        mockPrisma.order.findMany.mockResolvedValue(mockOrders);

        await GET();

        expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
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
      });

      it('returns orders data successfully', async () => {
        mockPrisma.order.findMany.mockResolvedValue(mockOrders);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual([
          {
            ...mockOrders[0],
            createdAt: mockOrders[0].createdAt.toISOString(),
            updatedAt: mockOrders[0].updatedAt.toISOString(),
          },
          {
            ...mockOrders[1],
            createdAt: mockOrders[1].createdAt.toISOString(),
            updatedAt: mockOrders[1].updatedAt.toISOString(),
          },
        ]);
      });

      it('returns empty array when no orders exist', async () => {
        mockPrisma.order.findMany.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual([]);
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
      });

      it('handles database errors and returns 500', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const dbError = new Error('Database connection failed');
        mockPrisma.order.findMany.mockRejectedValue(dbError);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch orders');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch orders:',
          dbError,
        );

        consoleSpy.mockRestore();
      });

      it('handles prisma query errors', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const prismaError = new Error('Invalid query');
        mockPrisma.order.findMany.mockRejectedValue(prismaError);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch orders');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch orders:',
          prismaError,
        );

        consoleSpy.mockRestore();
      });

      it('handles generic errors', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const genericError = new Error('Something went wrong');
        mockPrisma.order.findMany.mockRejectedValue(genericError);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch orders');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch orders:',
          genericError,
        );

        consoleSpy.mockRestore();
      });
    });

    describe('Edge Cases', () => {
      beforeEach(() => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
      });

      it('handles orders with null user data', async () => {
        const ordersWithNullUser = [
          {
            ...mockOrders[0],
            user: null,
          },
        ];
        mockPrisma.order.findMany.mockResolvedValue(ordersWithNullUser);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual([
          {
            ...ordersWithNullUser[0],
            createdAt: ordersWithNullUser[0].createdAt.toISOString(),
            updatedAt: ordersWithNullUser[0].updatedAt.toISOString(),
          },
        ]);
      });

      it('handles orders with empty items array', async () => {
        const ordersWithEmptyItems = [
          {
            ...mockOrders[0],
            items: [],
          },
        ];
        mockPrisma.order.findMany.mockResolvedValue(ordersWithEmptyItems);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual([
          {
            ...ordersWithEmptyItems[0],
            createdAt: ordersWithEmptyItems[0].createdAt.toISOString(),
            updatedAt: ordersWithEmptyItems[0].updatedAt.toISOString(),
          },
        ]);
      });

      it('handles orders with null product data in items', async () => {
        const ordersWithNullProduct = [
          {
            ...mockOrders[0],
            items: [
              {
                ...mockOrders[0].items[0],
                product: null,
              },
            ],
          },
        ];
        mockPrisma.order.findMany.mockResolvedValue(ordersWithNullProduct);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual([
          {
            ...ordersWithNullProduct[0],
            createdAt: ordersWithNullProduct[0].createdAt.toISOString(),
            updatedAt: ordersWithNullProduct[0].updatedAt.toISOString(),
          },
        ]);
      });
    });
  });
});
