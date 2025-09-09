import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {NextResponse} from 'next/server';
import {GET} from './route';
import prisma from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  default: {
    category: {
      findMany: vi.fn(),
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

describe('/api/categories', () => {
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

  describe('GET', () => {
    it('should return categories ordered by name in ascending order', async () => {
      const mockCategories = [
        {id: 1, name: 'Accessories'},
        {id: 2, name: 'Clothing'},
        {id: 3, name: 'Electronics'},
      ];

      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const response = await GET();

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        orderBy: {
          name: 'asc',
        },
      });

      expect(mockNextResponse.json).toHaveBeenCalledWith(mockCategories);
    });

    it('should return empty array when no categories exist', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);

      const response = await GET();

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        orderBy: {
          name: 'asc',
        },
      });

      expect(mockNextResponse.json).toHaveBeenCalledWith([]);
    });

    it('should handle database error and return 500 status', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const dbError = new Error('Database connection failed');
      mockPrisma.category.findMany.mockRejectedValue(dbError);

      const response = await GET();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch categories:',
        dbError,
      );

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Failed to fetch categories'},
        {status: 500},
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle prisma timeout error', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const timeoutError = new Error('Query timeout');
      mockPrisma.category.findMany.mockRejectedValue(timeoutError);

      const response = await GET();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch categories:',
        timeoutError,
      );

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Failed to fetch categories'},
        {status: 500},
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle unexpected error types', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const unexpectedError = 'String error';
      mockPrisma.category.findMany.mockRejectedValue(unexpectedError);

      const response = await GET();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch categories:',
        unexpectedError,
      );

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Failed to fetch categories'},
        {status: 500},
      );

      consoleErrorSpy.mockRestore();
    });

    it('should call prisma.category.findMany exactly once', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);

      await GET();

      expect(mockPrisma.category.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return categories with correct structure', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Electronics',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 2,
          name: 'Clothing',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const response = await GET();

      expect(mockNextResponse.json).toHaveBeenCalledWith(mockCategories);
      expect(mockCategories[0]).toHaveProperty('id');
      expect(mockCategories[0]).toHaveProperty('name');
      expect(mockCategories[1]).toHaveProperty('id');
      expect(mockCategories[1]).toHaveProperty('name');
    });
  });
});
