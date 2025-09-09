import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {NextResponse} from 'next/server';
import {GET, POST} from './route';
import prisma from '@/lib/prisma';
import {auth} from '../../../../auth';
import {ORDER_STATUS} from '@/constants';

vi.mock('@/lib/prisma', () => ({
  default: {
    cart: {
      findUnique: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../../../../auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn(),
  },
}));

vi.mock('@/constants', () => ({
  ORDER_STATUS: {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
  },
}));

const mockPrisma = prisma as any;
const mockAuth = auth as any;
const mockNextResponse = NextResponse as any;

describe('/api/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNextResponse.json.mockImplementation((data: any, options?: any) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
      data,
      options,
    }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST', () => {
    const mockRequest = (body: any) =>
      ({
        json: vi.fn().mockResolvedValue(body),
      }) as any;

    const mockSession = {
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      },
    };

    const mockCart = {
      id: 1,
      userId: 1,
      items: [
        {
          id: 1,
          productId: 1,
          quantity: 2,
          product: {
            id: 1,
            name: 'Test Product',
            price: 29.99,
          },
        },
      ],
    };

    it('should create order successfully', async () => {
      const requestBody = {
        shippingAddress: '123 Main St',
        paymentMethod: 'credit_card',
        total: 59.98,
      };

      const mockOrder = {
        id: 1,
        userId: 1,
        total: 59.98,
        shippingAddress: '123 Main St',
        paymentMethod: 'credit_card',
        status: ORDER_STATUS.PENDING,
        paymentStatus: 'PENDING',
        items: [
          {
            id: 1,
            productId: 1,
            quantity: 2,
            price: 29.99,
            product: {
              id: 1,
              name: 'Test Product',
              price: 29.99,
            },
          },
        ],
      };

      const request = mockRequest(requestBody);
      mockAuth.mockResolvedValue(mockSession);
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          order: {
            create: vi.fn().mockResolvedValue(mockOrder),
          },
          cartItem: {
            deleteMany: vi.fn().mockResolvedValue({count: 1}),
          },
        };
        return await callback(tx);
      });

      await POST(request);

      expect(mockAuth).toHaveBeenCalledWith();
      expect(request.json).toHaveBeenCalledWith();
      expect(mockPrisma.cart.findUnique).toHaveBeenCalledWith({
        where: {userId: 1},
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(mockOrder, {
        status: 201,
      });
    });

    it('should return 401 when not authenticated', async () => {
      const requestBody = {
        shippingAddress: '123 Main St',
        paymentMethod: 'credit_card',
        total: 59.98,
      };

      const request = mockRequest(requestBody);
      mockAuth.mockResolvedValue(null);

      await POST(request);

      expect(mockAuth).toHaveBeenCalledWith();
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Not authenticated'},
        {status: 401},
      );
    });

    it('should return 401 when session has no user', async () => {
      const requestBody = {
        shippingAddress: '123 Main St',
        paymentMethod: 'credit_card',
        total: 59.98,
      };

      const request = mockRequest(requestBody);
      mockAuth.mockResolvedValue({user: null});

      await POST(request);

      expect(mockAuth).toHaveBeenCalledWith();
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Not authenticated'},
        {status: 401},
      );
    });

    it('should return 400 when missing shippingAddress', async () => {
      const requestBody = {
        paymentMethod: 'credit_card',
        total: 59.98,
      };

      const request = mockRequest(requestBody);
      mockAuth.mockResolvedValue(mockSession);

      await POST(request);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Invalid input'},
        {status: 400},
      );
    });

    it('should return 400 when missing paymentMethod', async () => {
      const requestBody = {
        shippingAddress: '123 Main St',
        total: 59.98,
      };

      const request = mockRequest(requestBody);
      mockAuth.mockResolvedValue(mockSession);

      await POST(request);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Invalid input'},
        {status: 400},
      );
    });

    it('should return 400 when missing total', async () => {
      const requestBody = {
        shippingAddress: '123 Main St',
        paymentMethod: 'credit_card',
      };

      const request = mockRequest(requestBody);
      mockAuth.mockResolvedValue(mockSession);

      await POST(request);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Invalid input'},
        {status: 400},
      );
    });

    it('should return 400 when cart is empty', async () => {
      const requestBody = {
        shippingAddress: '123 Main St',
        paymentMethod: 'credit_card',
        total: 59.98,
      };

      const emptyCart = {
        id: 1,
        userId: 1,
        items: [],
      };

      const request = mockRequest(requestBody);
      mockAuth.mockResolvedValue(mockSession);
      mockPrisma.cart.findUnique.mockResolvedValue(emptyCart);

      await POST(request);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Cart is empty or not found'},
        {status: 400},
      );
    });

    it('should return 400 when cart is not found', async () => {
      const requestBody = {
        shippingAddress: '123 Main St',
        paymentMethod: 'credit_card',
        total: 59.98,
      };

      const request = mockRequest(requestBody);
      mockAuth.mockResolvedValue(mockSession);
      mockPrisma.cart.findUnique.mockResolvedValue(null);

      await POST(request);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Cart is empty or not found'},
        {status: 400},
      );
    });

    it('should handle database error during order creation', async () => {
      const requestBody = {
        shippingAddress: '123 Main St',
        paymentMethod: 'credit_card',
        total: 59.98,
      };

      const request = mockRequest(requestBody);
      mockAuth.mockResolvedValue(mockSession);
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);
      mockPrisma.$transaction.mockRejectedValue(
        new Error('Database transaction failed'),
      );

      await POST(request);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Failed to create order'},
        {status: 500},
      );
    });
  });

  describe('GET', () => {
    const mockSession = {
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      },
    };

    const mockOrders = [
      {
        id: 1,
        userId: 1,
        total: 59.98,
        status: ORDER_STATUS.PENDING,
        createdAt: new Date(),
        items: [
          {
            id: 1,
            productId: 1,
            quantity: 2,
            price: 29.99,
            product: {
              id: 1,
              name: 'Test Product',
              price: 29.99,
            },
          },
        ],
      },
    ];

    it('should return user orders successfully', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockPrisma.order.findMany.mockResolvedValue(mockOrders);

      await GET();

      expect(mockAuth).toHaveBeenCalledWith();
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: {userId: 1},
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
      expect(mockNextResponse.json).toHaveBeenCalledWith(mockOrders, {
        status: 200,
      });
    });

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      await GET();

      expect(mockAuth).toHaveBeenCalledWith();
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Not authenticated'},
        {status: 401},
      );
    });

    it('should return 401 when session has no user', async () => {
      mockAuth.mockResolvedValue({user: null});

      await GET();

      expect(mockAuth).toHaveBeenCalledWith();
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Not authenticated'},
        {status: 401},
      );
    });

    it('should return empty array when user has no orders', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockPrisma.order.findMany.mockResolvedValue([]);

      await GET();

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: {userId: 1},
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
      expect(mockNextResponse.json).toHaveBeenCalledWith([], {status: 200});
    });

    it('should handle database error during orders fetch', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockPrisma.order.findMany.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await GET();

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Failed to fetch orders'},
        {status: 500},
      );
    });
  });
});
