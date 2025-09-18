import {describe, it, expect, vi, beforeEach} from 'vitest';
import {NextResponse} from 'next/server';
import {GET} from './route';
import prisma from '@/lib/prisma';
import {auth} from '../../../../../auth';

vi.mock('@/lib/prisma', () => ({
  default: {
    order: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../../../../auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn(),
  },
}));

const mockPrisma = prisma as any;
const mockAuth = auth as any;
const mockNextResponse = NextResponse as any;

describe('GET /api/orders/[id]', () => {
  const mockRequest = {} as Request;
  const mockOrder = {
    id: 1,
    userId: 123,
    total: 100,
    status: 'pending',
    items: [
      {
        id: 1,
        productId: 1,
        quantity: 2,
        price: 50,
        product: {
          id: 1,
          name: 'Test Product',
          price: 50,
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNextResponse.json.mockImplementation((data: any, options?: any) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
    }));
  });

  it('should return 401 when user is not authenticated (no session)', async () => {
    mockAuth.mockResolvedValue(null);
    const params = Promise.resolve({id: '1'});

    await GET(mockRequest, {params});

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Not authenticated'},
      {status: 401},
    );
  });

  it('should return 401 when user is not authenticated (no user in session)', async () => {
    mockAuth.mockResolvedValue({user: null} as any);
    const params = Promise.resolve({id: '1'});

    await GET(mockRequest, {params});

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Not authenticated'},
      {status: 401},
    );
  });

  it('should return 400 when order ID is invalid', async () => {
    mockAuth.mockResolvedValue({
      user: {id: '123', name: 'Test User', email: 'test@example.com'},
    } as any);
    const params = Promise.resolve({id: 'invalid'});

    await GET(mockRequest, {params});

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Invalid order ID'},
      {status: 400},
    );
  });

  it('should return 404 when order is not found', async () => {
    mockAuth.mockResolvedValue({
      user: {id: '123', name: 'Test User', email: 'test@example.com'},
    } as any);
    mockPrisma.order.findUnique.mockResolvedValue(null);
    const params = Promise.resolve({id: '1'});

    await GET(mockRequest, {params});

    expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
      where: {id: 1},
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Order not found'},
      {status: 404},
    );
  });

  it('should return 403 when user tries to access order that does not belong to them', async () => {
    mockAuth.mockResolvedValue({
      user: {id: '123', name: 'Test User', email: 'test@example.com'},
    } as any);
    mockPrisma.order.findUnique.mockResolvedValue({
      ...mockOrder,
      userId: 456,
    });
    const params = Promise.resolve({id: '1'});

    await GET(mockRequest, {params});

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Unauthorized'},
      {status: 403},
    );
  });

  it('should return order when user is authorized and order exists', async () => {
    mockAuth.mockResolvedValue({
      user: {id: '123', name: 'Test User', email: 'test@example.com'},
    } as any);
    mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
    const params = Promise.resolve({id: '1'});

    await GET(mockRequest, {params});

    expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
      where: {id: 1},
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    expect(mockNextResponse.json).toHaveBeenCalledWith(mockOrder, {
      status: 200,
    });
  });

  it('should return 500 when database error occurs', async () => {
    mockAuth.mockResolvedValue({
      user: {id: '123', name: 'Test User', email: 'test@example.com'},
    } as any);
    mockPrisma.order.findUnique.mockRejectedValue(new Error('Database error'));
    const params = Promise.resolve({id: '1'});
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

    await GET(mockRequest, {params});

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching order:',
      expect.any(Error),
    );
    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Failed to fetch order'},
      {status: 500},
    );

    consoleSpy.mockRestore();
  });

  it('should return 500 when auth throws an error', async () => {
    mockAuth.mockRejectedValue(new Error('Auth error'));
    const params = Promise.resolve({id: '1'});
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

    await GET(mockRequest, {params});

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching order:',
      expect.any(Error),
    );
    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Failed to fetch order'},
      {status: 500},
    );

    consoleSpy.mockRestore();
  });
});
