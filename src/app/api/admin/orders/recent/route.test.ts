import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {NextResponse} from 'next/server';
import {GET} from './route';
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

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data: any, options?: any) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
      data,
      options,
    })),
  },
}));

const mockValidateAdminAccess = validateAdminAccess as any;
const mockPrisma = prisma as any;
const mockNextResponse = NextResponse as any;

const FIXED_DATE = new Date('2024-01-15T10:30:00.000Z');

const createMockOrder = (overrides = {}) => ({
  id: 'order-123',
  total: 99.99,
  status: 'completed',
  createdAt: FIXED_DATE,
  user: {
    name: 'Alice',
    email: 'alice@example.com',
  },
  ...overrides,
});

const createMockUser = () => ({
  id: 1,
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'hashed',
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('GET /api/admin/orders/recent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when access is denied', async () => {
    const mockError = NextResponse.json({error: 'unauthorized'}, {status: 401});
    mockValidateAdminAccess.mockResolvedValue({error: mockError});

    const response = await GET();

    expect(response).toBe(mockError);
    expect(response.status).toBe(401);
    expect(mockPrisma.order.findMany).not.toHaveBeenCalled();
  });

  it('returns formatted orders with user names when access is granted', async () => {
    mockValidateAdminAccess.mockResolvedValue({user: createMockUser()});

    const mockOrders = [
      createMockOrder({
        id: 'order-1',
        total: 150.0,
        status: 'pending',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
      }),
      createMockOrder({
        id: 'order-2',
        total: 75.5,
        status: 'completed',
        createdAt: new Date('2024-01-14T15:20:00.000Z'),
      }),
    ];

    (mockPrisma.order.findMany as any).mockResolvedValue(mockOrders);

    const response = await GET();
    const data = await response.json();

    expect(mockPrisma.order.findMany).toHaveBeenCalledOnce();
    expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
      take: 10,
      orderBy: {createdAt: 'desc'},
      include: {user: {select: {name: true, email: true}}},
    });

    expect(response.status).toBe(200);
    expect(data).toEqual([
      {
        id: 'order-1',
        user: 'Alice',
        total: 150.0,
        status: 'pending',
        createdAt: '2024-01-15T10:30:00.000Z',
      },
      {
        id: 'order-2',
        user: 'Alice',
        total: 75.5,
        status: 'completed',
        createdAt: '2024-01-14T15:20:00.000Z',
      },
    ]);
  });

  it('falls back to email when user name is null', async () => {
    mockValidateAdminAccess.mockResolvedValue({user: createMockUser()});

    const mockOrder = createMockOrder({
      user: {
        name: null,
        email: 'no-name@example.com',
      },
    });

    (mockPrisma.order.findMany as any).mockResolvedValue([mockOrder]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0].user).toBe('no-name@example.com');
  });

  it('returns exact shape with no extra fields', async () => {
    mockValidateAdminAccess.mockResolvedValue({user: createMockUser()});

    const mockOrder = createMockOrder({
      extraField: 'should not appear',
      anotherField: 123,
    });

    (mockPrisma.order.findMany as any).mockResolvedValue([mockOrder]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Object.keys(data[0])).toEqual([
      'id',
      'user',
      'total',
      'status',
      'createdAt',
    ]);
    expect(data[0]).toEqual({
      id: 'order-123',
      user: 'Alice',
      total: 99.99,
      status: 'completed',
      createdAt: '2024-01-15T10:30:00.000Z',
    });
  });

  it('handles database errors and logs them', async () => {
    mockValidateAdminAccess.mockResolvedValue({user: createMockUser()});

    const dbError = new Error('db down');
    (mockPrisma.order.findMany as any).mockRejectedValue(dbError);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET();
    const data = await response.json();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch recent orders:',
      dbError,
    );
    expect(response.status).toBe(500);
    expect(data).toEqual({error: 'Failed to fetch recent orders'});

    consoleSpy.mockRestore();
  });

  it('maintains limit and ordering with larger dataset', async () => {
    mockValidateAdminAccess.mockResolvedValue({user: createMockUser()});

    const mockOrders = Array.from({length: 15}, (_, i) =>
      createMockOrder({
        id: `order-${i + 1}`,
        createdAt: new Date(
          `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`,
        ),
      }),
    );

    (mockPrisma.order.findMany as any).mockResolvedValue(
      mockOrders.slice(0, 10),
    );

    const response = await GET();

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
      take: 10,
      orderBy: {createdAt: 'desc'},
      include: {user: {select: {name: true, email: true}}},
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(10);
  });

  it('converts Date objects to ISO strings correctly', async () => {
    mockValidateAdminAccess.mockResolvedValue({user: createMockUser()});

    const specificDate = new Date('2024-03-20T14:25:30.123Z');
    const mockOrder = createMockOrder({
      createdAt: specificDate,
    });

    (mockPrisma.order.findMany as any).mockResolvedValue([mockOrder]);

    const response = await GET();
    const data = await response.json();

    expect(data[0].createdAt).toBe('2024-03-20T14:25:30.123Z');
    expect(typeof data[0].createdAt).toBe('string');
  });

  it('handles empty orders array', async () => {
    mockValidateAdminAccess.mockResolvedValue({user: createMockUser()});
    (mockPrisma.order.findMany as any).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it('handles user with empty string name falling back to email', async () => {
    mockValidateAdminAccess.mockResolvedValue({user: createMockUser()});

    const mockOrder = createMockOrder({
      user: {
        name: '',
        email: 'empty-name@example.com',
      },
    });

    (mockPrisma.order.findMany as any).mockResolvedValue([mockOrder]);

    const response = await GET();
    const data = await response.json();

    expect(data[0].user).toBe('empty-name@example.com');
  });
});
