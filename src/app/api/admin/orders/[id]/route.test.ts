import {describe, it, expect, vi, beforeEach} from 'vitest';
import {NextRequest, NextResponse} from 'next/server';
import {PUT} from './route';
import {validateAdminAccess} from '@/lib/adminMiddleware';
import prisma from '@/lib/prisma';
import {ORDER_STATUS} from '@/constants';

vi.mock('@/lib/adminMiddleware', () => ({
  validateAdminAccess: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn(),
  },
}));

const mockValidateAdminAccess = validateAdminAccess as any;
const mockPrisma = prisma as any;
const mockNextResponse = NextResponse as any;

describe('PUT /api/admin/orders/[id]', () => {
  const mockOrder = {
    id: 1,
    status: ORDER_STATUS.PENDING,
    userId: 1,
    total: 99.99,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
    },
    items: [
      {
        id: 1,
        orderId: 1,
        productId: 1,
        quantity: 2,
        price: 49.99,
        product: {
          id: 1,
          name: 'Test Product',
          imageUrl: 'test-image.jpg',
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

  it('should return error when admin access validation fails', async () => {
    const mockError = NextResponse.json({error: 'Unauthorized'}, {status: 401});
    mockValidateAdminAccess.mockResolvedValue({error: mockError});

    const mockRequest = {
      json: vi.fn().mockResolvedValue({status: ORDER_STATUS.PROCESSING}),
    } as any;
    const params = Promise.resolve({id: '1'});

    const result = await PUT(mockRequest, {params});

    expect(mockValidateAdminAccess).toHaveBeenCalled();
    expect(result).toBe(mockError);
  });

  it('should return 400 when order ID is invalid', async () => {
    mockValidateAdminAccess.mockResolvedValue({});

    const mockRequest = {
      json: vi.fn().mockResolvedValue({status: ORDER_STATUS.PROCESSING}),
    } as any;
    const params = Promise.resolve({id: 'invalid'});

    await PUT(mockRequest, {params});

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Invalid order ID'},
      {status: 400},
    );
  });

  it('should return 400 when status is not provided', async () => {
    mockValidateAdminAccess.mockResolvedValue({});

    const mockRequest = {
      json: vi.fn().mockResolvedValue({}),
    } as any;
    const params = Promise.resolve({id: '1'});

    await PUT(mockRequest, {params});

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Status is required'},
      {status: 400},
    );
  });

  it('should return 400 when status is empty string', async () => {
    mockValidateAdminAccess.mockResolvedValue({});

    const mockRequest = {
      json: vi.fn().mockResolvedValue({status: ''}),
    } as any;
    const params = Promise.resolve({id: '1'});

    await PUT(mockRequest, {params});

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Status is required'},
      {status: 400},
    );
  });

  it('should return 400 when status is invalid', async () => {
    mockValidateAdminAccess.mockResolvedValue({});

    const mockRequest = {
      json: vi.fn().mockResolvedValue({status: 'INVALID_STATUS'}),
    } as any;
    const params = Promise.resolve({id: '1'});

    await PUT(mockRequest, {params});

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Invalid status'},
      {status: 400},
    );
  });

  it('should return 404 when order is not found', async () => {
    mockValidateAdminAccess.mockResolvedValue({});
    mockPrisma.order.findUnique.mockResolvedValue(null);

    const mockRequest = {
      json: vi.fn().mockResolvedValue({status: ORDER_STATUS.PROCESSING}),
    } as any;
    const params = Promise.resolve({id: '1'});

    await PUT(mockRequest, {params});

    expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
      where: {id: 1},
    });
    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Order not found'},
      {status: 404},
    );
  });

  it('should successfully update order with PENDING status', async () => {
    mockValidateAdminAccess.mockResolvedValue({});
    mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
    mockPrisma.order.update.mockResolvedValue(mockOrder);

    const mockRequest = {
      json: vi.fn().mockResolvedValue({status: ORDER_STATUS.PENDING}),
    } as any;
    const params = Promise.resolve({id: '1'});

    await PUT(mockRequest, {params});

    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: {id: 1},
      data: {status: ORDER_STATUS.PENDING},
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
    expect(mockNextResponse.json).toHaveBeenCalledWith(mockOrder);
  });

  it('should successfully update order with PROCESSING status', async () => {
    mockValidateAdminAccess.mockResolvedValue({});
    mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
    mockPrisma.order.update.mockResolvedValue(mockOrder);

    const mockRequest = {
      json: vi.fn().mockResolvedValue({status: ORDER_STATUS.PROCESSING}),
    } as any;
    const params = Promise.resolve({id: '1'});

    await PUT(mockRequest, {params});

    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: {id: 1},
      data: {status: ORDER_STATUS.PROCESSING},
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
    expect(mockNextResponse.json).toHaveBeenCalledWith(mockOrder);
  });

  it('should successfully update order with SHIPPED status', async () => {
    mockValidateAdminAccess.mockResolvedValue({});
    mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
    mockPrisma.order.update.mockResolvedValue(mockOrder);

    const mockRequest = {
      json: vi.fn().mockResolvedValue({status: ORDER_STATUS.SHIPPED}),
    } as any;
    const params = Promise.resolve({id: '1'});

    await PUT(mockRequest, {params});

    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: {id: 1},
      data: {status: ORDER_STATUS.SHIPPED},
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
    expect(mockNextResponse.json).toHaveBeenCalledWith(mockOrder);
  });

  it('should successfully update order with DELIVERED status', async () => {
    mockValidateAdminAccess.mockResolvedValue({});
    mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
    mockPrisma.order.update.mockResolvedValue(mockOrder);

    const mockRequest = {
      json: vi.fn().mockResolvedValue({status: ORDER_STATUS.DELIVERED}),
    } as any;
    const params = Promise.resolve({id: '1'});

    await PUT(mockRequest, {params});

    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: {id: 1},
      data: {status: ORDER_STATUS.DELIVERED},
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
    expect(mockNextResponse.json).toHaveBeenCalledWith(mockOrder);
  });

  it('should successfully update order with CANCELLED status', async () => {
    mockValidateAdminAccess.mockResolvedValue({});
    mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
    mockPrisma.order.update.mockResolvedValue(mockOrder);

    const mockRequest = {
      json: vi.fn().mockResolvedValue({status: ORDER_STATUS.CANCELLED}),
    } as any;
    const params = Promise.resolve({id: '1'});

    await PUT(mockRequest, {params});

    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: {id: 1},
      data: {status: ORDER_STATUS.CANCELLED},
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
    expect(mockNextResponse.json).toHaveBeenCalledWith(mockOrder);
  });

  it('should return 500 when database error occurs during findUnique', async () => {
    mockValidateAdminAccess.mockResolvedValue({});
    mockPrisma.order.findUnique.mockRejectedValue(new Error('Database error'));

    const mockRequest = {
      json: vi.fn().mockResolvedValue({status: ORDER_STATUS.PROCESSING}),
    } as any;
    const params = Promise.resolve({id: '1'});

    await PUT(mockRequest, {params});

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Failed to update order'},
      {status: 500},
    );
  });

  it('should return 500 when database error occurs during update', async () => {
    mockValidateAdminAccess.mockResolvedValue({});
    mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
    mockPrisma.order.update.mockRejectedValue(new Error('Database error'));

    const mockRequest = {
      json: vi.fn().mockResolvedValue({status: ORDER_STATUS.PROCESSING}),
    } as any;
    const params = Promise.resolve({id: '1'});

    await PUT(mockRequest, {params});

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Failed to update order'},
      {status: 500},
    );
  });

  it('should return 500 when JSON parsing fails', async () => {
    mockValidateAdminAccess.mockResolvedValue({});

    const mockRequest = {
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
    } as any;
    const params = Promise.resolve({id: '1'});

    await PUT(mockRequest, {params});

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Failed to update order'},
      {status: 500},
    );
  });
});
