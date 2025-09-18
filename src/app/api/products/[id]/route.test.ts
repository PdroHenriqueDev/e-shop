import {describe, it, expect, vi, beforeEach} from 'vitest';
import {NextResponse} from 'next/server';
import {GET} from './route';
import prisma from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  default: {
    product: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn(),
  },
}));

const mockPrisma = prisma as any;
const mockNextResponse = NextResponse as any;

describe('GET /api/products/[id]', () => {
  const mockRequest = {} as Request;
  const mockProduct = {
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    image: 'test-image.jpg',
    categoryId: 1,
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNextResponse.json.mockImplementation((data: any, options?: any) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
    }));
  });

  it('should return 400 when id is not provided', async () => {
    const params = Promise.resolve({id: ''});

    await GET(mockRequest, {params});

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Invalid request'},
      {status: 400},
    );
  });

  it('should return 400 when id is null', async () => {
    const params = Promise.resolve({id: null as any});

    await GET(mockRequest, {params});

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Invalid request'},
      {status: 400},
    );
  });

  it('should return 400 when id is undefined', async () => {
    const params = Promise.resolve({id: undefined as any});

    await GET(mockRequest, {params});

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Invalid request'},
      {status: 400},
    );
  });

  it('should return 404 when product is not found', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null);
    const params = Promise.resolve({id: '1'});

    await GET(mockRequest, {params});

    expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
      where: {id: 1},
    });
    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Product not found'},
      {status: 404},
    );
  });

  it('should return product when found', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
    const params = Promise.resolve({id: '1'});

    await GET(mockRequest, {params});

    expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
      where: {id: 1},
    });
    expect(mockNextResponse.json).toHaveBeenCalledWith(mockProduct, {
      status: 200,
    });
  });

  it('should handle string id correctly', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
    const params = Promise.resolve({id: '123'});

    await GET(mockRequest, {params});

    expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
      where: {id: 123},
    });
    expect(mockNextResponse.json).toHaveBeenCalledWith(mockProduct, {
      status: 200,
    });
  });

  it('should return 500 when database error occurs', async () => {
    mockPrisma.product.findUnique.mockRejectedValue(
      new Error('Database error'),
    );
    const params = Promise.resolve({id: '1'});

    await GET(mockRequest, {params});

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Failed to fetch product'},
      {status: 500},
    );
  });

  it('should handle non-numeric id by converting to number', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null);
    const params = Promise.resolve({id: 'abc'});

    await GET(mockRequest, {params});

    expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
      where: {id: NaN},
    });
    expect(mockNextResponse.json).toHaveBeenCalledWith(
      {error: 'Product not found'},
      {status: 404},
    );
  });
});
