import {NextResponse} from 'next/server';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import {validateAdminAccess} from '@/lib/adminMiddleware';
import prisma from '@/lib/prisma';

vi.mock('@/lib/adminMiddleware', () => ({
  validateAdminAccess: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      count: vi.fn(),
    },
    product: {
      count: vi.fn(),
    },
    order: {
      count: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

const mockValidateAdminAccess = validateAdminAccess as any;
const mockPrisma = prisma as any;

describe('Admin Stats API', () => {
  let GET: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const routeModule = await import('./route');
    GET = routeModule.GET;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/admin/stats', () => {
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
        expect(mockPrisma.user.count).not.toHaveBeenCalled();
        expect(mockPrisma.product.count).not.toHaveBeenCalled();
        expect(mockPrisma.order.count).not.toHaveBeenCalled();
        expect(mockPrisma.order.aggregate).not.toHaveBeenCalled();
      });

      it('proceeds when admin access validation succeeds', async () => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
        mockPrisma.user.count.mockResolvedValue(100);
        mockPrisma.product.count.mockResolvedValue(50);
        mockPrisma.order.count.mockResolvedValue(25);
        mockPrisma.order.aggregate.mockResolvedValue({
          _sum: {
            total: 5000.0,
          },
        });

        const response = await GET();

        expect(mockValidateAdminAccess).toHaveBeenCalledOnce();
        expect(mockPrisma.user.count).toHaveBeenCalledOnce();
        expect(mockPrisma.product.count).toHaveBeenCalledOnce();
        expect(mockPrisma.order.count).toHaveBeenCalledOnce();
        expect(mockPrisma.order.aggregate).toHaveBeenCalledOnce();
        expect(response.status).toBe(200);
      });
    });

    describe('Data Fetching', () => {
      beforeEach(() => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
      });

      it('fetches all stats with correct parameters', async () => {
        mockPrisma.user.count.mockResolvedValue(100);
        mockPrisma.product.count.mockResolvedValue(50);
        mockPrisma.order.count.mockResolvedValue(25);
        mockPrisma.order.aggregate.mockResolvedValue({
          _sum: {
            total: 5000.0,
          },
        });

        await GET();

        expect(mockPrisma.user.count).toHaveBeenCalledWith();
        expect(mockPrisma.product.count).toHaveBeenCalledWith();
        expect(mockPrisma.order.count).toHaveBeenCalledWith();
        expect(mockPrisma.order.aggregate).toHaveBeenCalledWith({
          _sum: {
            total: true,
          },
        });
      });

      it('returns stats data successfully with revenue', async () => {
        mockPrisma.user.count.mockResolvedValue(100);
        mockPrisma.product.count.mockResolvedValue(50);
        mockPrisma.order.count.mockResolvedValue(25);
        mockPrisma.order.aggregate.mockResolvedValue({
          _sum: {
            total: 5000.0,
          },
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          totalUsers: 100,
          totalProducts: 50,
          totalOrders: 25,
          totalRevenue: 5000.0,
        });
      });

      it('returns stats data with zero revenue when no orders exist', async () => {
        mockPrisma.user.count.mockResolvedValue(10);
        mockPrisma.product.count.mockResolvedValue(5);
        mockPrisma.order.count.mockResolvedValue(0);
        mockPrisma.order.aggregate.mockResolvedValue({
          _sum: {
            total: null,
          },
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          totalUsers: 10,
          totalProducts: 5,
          totalOrders: 0,
          totalRevenue: 0,
        });
      });

      it('returns stats data with zero values when all counts are zero', async () => {
        mockPrisma.user.count.mockResolvedValue(0);
        mockPrisma.product.count.mockResolvedValue(0);
        mockPrisma.order.count.mockResolvedValue(0);
        mockPrisma.order.aggregate.mockResolvedValue({
          _sum: {
            total: null,
          },
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          totalUsers: 0,
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
        });
      });

      it('handles large numbers correctly', async () => {
        mockPrisma.user.count.mockResolvedValue(999999);
        mockPrisma.product.count.mockResolvedValue(888888);
        mockPrisma.order.count.mockResolvedValue(777777);
        mockPrisma.order.aggregate.mockResolvedValue({
          _sum: {
            total: 1234567.89,
          },
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          totalUsers: 999999,
          totalProducts: 888888,
          totalOrders: 777777,
          totalRevenue: 1234567.89,
        });
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
      });

      it('handles user count database error and returns 500', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const dbError = new Error('User table connection failed');
        mockPrisma.user.count.mockRejectedValue(dbError);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch dashboard stats');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch dashboard stats:',
          dbError,
        );

        consoleSpy.mockRestore();
      });

      it('handles product count database error and returns 500', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const dbError = new Error('Product table connection failed');
        mockPrisma.user.count.mockResolvedValue(100);
        mockPrisma.product.count.mockRejectedValue(dbError);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch dashboard stats');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch dashboard stats:',
          dbError,
        );

        consoleSpy.mockRestore();
      });

      it('handles order count database error and returns 500', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const dbError = new Error('Order table connection failed');
        mockPrisma.user.count.mockResolvedValue(100);
        mockPrisma.product.count.mockResolvedValue(50);
        mockPrisma.order.count.mockRejectedValue(dbError);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch dashboard stats');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch dashboard stats:',
          dbError,
        );

        consoleSpy.mockRestore();
      });

      it('handles order aggregate database error and returns 500', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const dbError = new Error('Order aggregate failed');
        mockPrisma.user.count.mockResolvedValue(100);
        mockPrisma.product.count.mockResolvedValue(50);
        mockPrisma.order.count.mockResolvedValue(25);
        mockPrisma.order.aggregate.mockRejectedValue(dbError);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch dashboard stats');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch dashboard stats:',
          dbError,
        );

        consoleSpy.mockRestore();
      });

      it('handles multiple database errors and returns 500', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const dbError = new Error('Multiple database connections failed');
        mockPrisma.user.count.mockRejectedValue(dbError);
        mockPrisma.product.count.mockRejectedValue(dbError);
        mockPrisma.order.count.mockRejectedValue(dbError);
        mockPrisma.order.aggregate.mockRejectedValue(dbError);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch dashboard stats');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch dashboard stats:',
          dbError,
        );

        consoleSpy.mockRestore();
      });
    });

    describe('Edge Cases', () => {
      beforeEach(() => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
      });

      it('handles undefined aggregate result', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        mockPrisma.user.count.mockResolvedValue(10);
        mockPrisma.product.count.mockResolvedValue(5);
        mockPrisma.order.count.mockResolvedValue(0);
        mockPrisma.order.aggregate.mockResolvedValue({
          _sum: undefined,
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch dashboard stats');

        consoleSpy.mockRestore();
      });

      it('handles missing _sum property in aggregate result', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        mockPrisma.user.count.mockResolvedValue(10);
        mockPrisma.product.count.mockResolvedValue(5);
        mockPrisma.order.count.mockResolvedValue(0);
        mockPrisma.order.aggregate.mockResolvedValue({});

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch dashboard stats');

        consoleSpy.mockRestore();
      });

      it('handles decimal revenue values correctly', async () => {
        mockPrisma.user.count.mockResolvedValue(50);
        mockPrisma.product.count.mockResolvedValue(25);
        mockPrisma.order.count.mockResolvedValue(10);
        mockPrisma.order.aggregate.mockResolvedValue({
          _sum: {
            total: 123.45,
          },
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.totalRevenue).toBe(123.45);
      });

      it('handles zero revenue with existing orders', async () => {
        mockPrisma.user.count.mockResolvedValue(50);
        mockPrisma.product.count.mockResolvedValue(25);
        mockPrisma.order.count.mockResolvedValue(10);
        mockPrisma.order.aggregate.mockResolvedValue({
          _sum: {
            total: 0,
          },
        });

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.totalRevenue).toBe(0);
      });
    });
  });
});
