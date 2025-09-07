import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {NextRequest} from 'next/server';
import {GET, POST} from './route';
import prisma from '@/lib/prisma';
import {Prisma} from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  default: {
    product: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const mockPrisma = prisma as any;

describe('/api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/products', () => {
    it('should fetch all products when no filters are provided', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          description: 'Description 1',
          price: 100,
          imageUrl: 'image1.jpg',
          categoryId: 1,
          category: {id: 1, name: 'Category 1'},
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          name: 'Product 2',
          description: 'Description 2',
          price: 200,
          imageUrl: 'image2.jpg',
          categoryId: 2,
          category: {id: 2, name: 'Category 2'},
          createdAt: '2025-01-02T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const request = new NextRequest('http://localhost:3000/api/products');
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toEqual(mockProducts);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: {category: true},
      });
    });

    it('should filter products by categoryId', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          description: 'Description 1',
          price: 100,
          imageUrl: 'image1.jpg',
          categoryId: 1,
          category: {id: 1, name: 'Category 1'},
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const request = new NextRequest(
        'http://localhost:3000/api/products?categoryId=1',
      );
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toEqual(mockProducts);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {categoryId: 1},
        include: {category: true},
      });
    });

    it('should filter products by category name', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          description: 'Description 1',
          price: 100,
          imageUrl: 'image1.jpg',
          categoryId: 1,
          category: {id: 1, name: 'Electronics'},
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const request = new NextRequest(
        'http://localhost:3000/api/products?category=Electronics',
      );
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toEqual(mockProducts);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          category: {
            is: {
              name: {
                equals: 'Electronics',
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        },
        include: {category: true},
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.product.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      const request = new NextRequest('http://localhost:3000/api/products');
      const response = await GET(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Failed to fetch products');
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product successfully', async () => {
      const productData = {
        name: 'New Product',
        description: 'New Description',
        price: 150,
        imageUrl: 'new-image.jpg',
        categoryId: 1,
      };

      const mockCreatedProduct = {
        id: 3,
        ...productData,
        createdAt: '2025-09-06T18:28:09.628Z',
        updatedAt: '2025-09-06T18:28:09.628Z',
      };

      mockPrisma.product.create.mockResolvedValue(mockCreatedProduct);

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(productData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result).toEqual(mockCreatedProduct);
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          imageUrl: productData.imageUrl,
          category: {connect: {id: productData.categoryId}},
        },
      });
    });

    it('should handle creation errors', async () => {
      const productData = {
        name: 'New Product',
        description: 'New Description',
        price: 150,
        imageUrl: 'new-image.jpg',
        categoryId: 1,
      };

      mockPrisma.product.create.mockRejectedValue(new Error('Creation failed'));

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(productData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Failed to create product');
    });
  });
});
