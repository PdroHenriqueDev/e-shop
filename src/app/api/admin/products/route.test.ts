import {NextRequest, NextResponse} from 'next/server';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import {validateAdminAccess} from '@/lib/adminMiddleware';
import prisma from '@/lib/prisma';

vi.mock('@/lib/adminMiddleware', () => ({
  validateAdminAccess: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    product: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const mockValidateAdminAccess = validateAdminAccess as any;
const mockPrisma = prisma as any;

const mockProducts = [
  {
    id: 1,
    name: 'Test Product 1',
    description: 'Test description 1',
    price: 99.99,
    imageUrl: '/test-image-1.jpg',
    categoryId: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    category: {
      id: 1,
      name: 'Electronics',
      description: 'Electronic products',
    },
  },
  {
    id: 2,
    name: 'Test Product 2',
    description: 'Test description 2',
    price: 149.99,
    imageUrl: '/test-image-2.jpg',
    categoryId: 2,
    createdAt: new Date('2024-01-02T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    category: {
      id: 2,
      name: 'Clothing',
      description: 'Clothing items',
    },
  },
];

const mockCreatedProduct = {
  id: 3,
  name: 'New Product',
  description: 'New product description',
  price: 199.99,
  imageUrl: '/placeholder.jpg',
  categoryId: 1,
  createdAt: new Date('2024-01-03T00:00:00Z'),
  updatedAt: new Date('2024-01-03T00:00:00Z'),
  category: {
    id: 1,
    name: 'Electronics',
    description: 'Electronic products',
  },
};

describe('Admin Products API', () => {
  let GET: any;
  let POST: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const routeModule = await import('./route');
    GET = routeModule.GET;
    POST = routeModule.POST;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/admin/products', () => {
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
        expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
      });

      it('proceeds when admin access validation succeeds', async () => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
        mockPrisma.product.findMany.mockResolvedValue(mockProducts);

        const response = await GET();

        expect(mockValidateAdminAccess).toHaveBeenCalledOnce();
        expect(mockPrisma.product.findMany).toHaveBeenCalledOnce();
        expect(response.status).toBe(200);
      });
    });

    describe('Data Fetching', () => {
      beforeEach(() => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
      });

      it('fetches products with correct query parameters', async () => {
        mockPrisma.product.findMany.mockResolvedValue(mockProducts);

        await GET();

        expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
          include: {
            category: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      });

      it('returns products data successfully', async () => {
        mockPrisma.product.findMany.mockResolvedValue(mockProducts);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual([
          {
            ...mockProducts[0],
            createdAt: mockProducts[0].createdAt.toISOString(),
            updatedAt: mockProducts[0].updatedAt.toISOString(),
          },
          {
            ...mockProducts[1],
            createdAt: mockProducts[1].createdAt.toISOString(),
            updatedAt: mockProducts[1].updatedAt.toISOString(),
          },
        ]);
      });

      it('returns empty array when no products exist', async () => {
        mockPrisma.product.findMany.mockResolvedValue([]);

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
        mockPrisma.product.findMany.mockRejectedValue(dbError);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch products');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch products:',
          dbError,
        );

        consoleSpy.mockRestore();
      });
    });
  });

  describe('POST /api/admin/products', () => {
    describe('Authentication', () => {
      it('returns error when admin access validation fails', async () => {
        const mockErrorResponse = NextResponse.json(
          {error: 'Unauthorized'},
          {status: 401},
        );
        mockValidateAdminAccess.mockResolvedValue({
          error: mockErrorResponse,
        });

        const formData = new FormData();
        formData.append('name', 'Test Product');
        formData.append('description', 'Test description');
        formData.append('price', '99.99');
        formData.append('categoryId', '1');

        const request = new NextRequest(
          'http://localhost:3000/api/admin/products',
          {
            method: 'POST',
            body: formData,
          },
        );

        const response = await POST(request);

        expect(mockValidateAdminAccess).toHaveBeenCalledOnce();
        expect(response).toBe(mockErrorResponse);
        expect(mockPrisma.product.create).not.toHaveBeenCalled();
      });

      it('proceeds when admin access validation succeeds', async () => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
        mockPrisma.product.create.mockResolvedValue(mockCreatedProduct);

        const formData = new FormData();
        formData.append('name', 'New Product');
        formData.append('description', 'New product description');
        formData.append('price', '199.99');
        formData.append('categoryId', '1');

        const request = new NextRequest(
          'http://localhost:3000/api/admin/products',
          {
            method: 'POST',
            body: formData,
          },
        );

        const response = await POST(request);

        expect(mockValidateAdminAccess).toHaveBeenCalledOnce();
        expect(mockPrisma.product.create).toHaveBeenCalledOnce();
        expect(response.status).toBe(201);
      });
    });

    describe('Request Validation', () => {
      beforeEach(() => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
      });

      it('returns 400 when name is missing', async () => {
        const formData = new FormData();
        formData.append('description', 'Test description');
        formData.append('price', '99.99');
        formData.append('categoryId', '1');

        const request = new NextRequest(
          'http://localhost:3000/api/admin/products',
          {
            method: 'POST',
            body: formData,
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
        expect(mockPrisma.product.create).not.toHaveBeenCalled();
      });

      it('returns 400 when description is missing', async () => {
        const formData = new FormData();
        formData.append('name', 'Test Product');
        formData.append('price', '99.99');
        formData.append('categoryId', '1');

        const request = new NextRequest(
          'http://localhost:3000/api/admin/products',
          {
            method: 'POST',
            body: formData,
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
        expect(mockPrisma.product.create).not.toHaveBeenCalled();
      });

      it('returns 400 when price is missing', async () => {
        const formData = new FormData();
        formData.append('name', 'Test Product');
        formData.append('description', 'Test description');
        formData.append('categoryId', '1');

        const request = new NextRequest(
          'http://localhost:3000/api/admin/products',
          {
            method: 'POST',
            body: formData,
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
        expect(mockPrisma.product.create).not.toHaveBeenCalled();
      });

      it('returns 400 when categoryId is missing', async () => {
        const formData = new FormData();
        formData.append('name', 'Test Product');
        formData.append('description', 'Test description');
        formData.append('price', '99.99');

        const request = new NextRequest(
          'http://localhost:3000/api/admin/products',
          {
            method: 'POST',
            body: formData,
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
        expect(mockPrisma.product.create).not.toHaveBeenCalled();
      });

      it('returns 400 when price is not a valid number', async () => {
        const formData = new FormData();
        formData.append('name', 'Test Product');
        formData.append('description', 'Test description');
        formData.append('price', 'invalid');
        formData.append('categoryId', '1');

        const request = new NextRequest(
          'http://localhost:3000/api/admin/products',
          {
            method: 'POST',
            body: formData,
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
        expect(mockPrisma.product.create).not.toHaveBeenCalled();
      });

      it('returns 400 when categoryId is not a valid number', async () => {
        const formData = new FormData();
        formData.append('name', 'Test Product');
        formData.append('description', 'Test description');
        formData.append('price', '99.99');
        formData.append('categoryId', 'invalid');

        const request = new NextRequest(
          'http://localhost:3000/api/admin/products',
          {
            method: 'POST',
            body: formData,
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
        expect(mockPrisma.product.create).not.toHaveBeenCalled();
      });
    });

    describe('Product Creation', () => {
      beforeEach(() => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
      });

      it('creates product without image successfully', async () => {
        mockPrisma.product.create.mockResolvedValue(mockCreatedProduct);

        const formData = new FormData();
        formData.append('name', 'New Product');
        formData.append('description', 'New product description');
        formData.append('price', '199.99');
        formData.append('categoryId', '1');

        const request = new NextRequest(
          'http://localhost:3000/api/admin/products',
          {
            method: 'POST',
            body: formData,
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(mockPrisma.product.create).toHaveBeenCalledWith({
          data: {
            name: 'New Product',
            description: 'New product description',
            price: 199.99,
            categoryId: 1,
            imageUrl: '',
          },
          include: {
            category: true,
          },
        });
        expect(data).toEqual({
          ...mockCreatedProduct,
          createdAt: mockCreatedProduct.createdAt.toISOString(),
          updatedAt: mockCreatedProduct.updatedAt.toISOString(),
        });
      });

      it('creates product with image successfully', async () => {
        mockPrisma.product.create.mockResolvedValue({
          ...mockCreatedProduct,
          imageUrl: '/placeholder.jpg',
        });

        const formData = new FormData();
        formData.append('name', 'New Product');
        formData.append('description', 'New product description');
        formData.append('price', '199.99');
        formData.append('categoryId', '1');

        const request = new NextRequest(
          'http://localhost:3000/api/admin/products',
          {
            method: 'POST',
            body: formData,
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(mockPrisma.product.create).toHaveBeenCalledWith({
          data: {
            name: 'New Product',
            description: 'New product description',
            price: 199.99,
            categoryId: 1,
            imageUrl: '',
          },
          include: {
            category: true,
          },
        });
        expect(data).toEqual({
          ...mockCreatedProduct,
          imageUrl: '/placeholder.jpg',
          createdAt: mockCreatedProduct.createdAt.toISOString(),
          updatedAt: mockCreatedProduct.updatedAt.toISOString(),
        });
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
        mockPrisma.product.create.mockRejectedValue(dbError);

        const formData = new FormData();
        formData.append('name', 'New Product');
        formData.append('description', 'New product description');
        formData.append('price', '199.99');
        formData.append('categoryId', '1');

        const request = new NextRequest(
          'http://localhost:3000/api/admin/products',
          {
            method: 'POST',
            body: formData,
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to create product');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to create product:',
          dbError,
        );

        consoleSpy.mockRestore();
      });

      it('handles form data parsing errors', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        const mockRequest = {
          formData: vi.fn().mockRejectedValue(new Error('Invalid form data')),
        } as any;

        const response = await POST(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to create product');
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to create product:',
          expect.any(Error),
        );

        consoleSpy.mockRestore();
      });
    });

    describe('Edge Cases', () => {
      beforeEach(() => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
      });

      it('handles empty string values as missing fields', async () => {
        const formData = new FormData();
        formData.append('name', '');
        formData.append('description', 'Test description');
        formData.append('price', '99.99');
        formData.append('categoryId', '1');

        const request = new NextRequest(
          'http://localhost:3000/api/admin/products',
          {
            method: 'POST',
            body: formData,
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
      });

      it('handles zero price as valid', async () => {
        const formData = new FormData();
        formData.append('name', 'Free Product');
        formData.append('description', 'Free product description');
        formData.append('price', '0');
        formData.append('categoryId', '1');

        const request = new NextRequest(
          'http://localhost:3000/api/admin/products',
          {
            method: 'POST',
            body: formData,
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields');
        expect(mockPrisma.product.create).not.toHaveBeenCalled();
      });

      it('handles negative price as invalid', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        const formData = new FormData();
        formData.append('name', 'Test Product');
        formData.append('description', 'Test description');
        formData.append('price', '-10');
        formData.append('categoryId', '1');

        const request = new NextRequest(
          'http://localhost:3000/api/admin/products',
          {
            method: 'POST',
            body: formData,
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to create product');

        consoleSpy.mockRestore();
      });

      it('POST sets imageUrl to placeholder when image file is provided', async () => {
        mockValidateAdminAccess.mockResolvedValue({error: null});

        const formData = new FormData();
        formData.append('name', 'Test Product');
        formData.append('description', 'Desc');
        formData.append('price', '19.99');
        formData.append('categoryId', '7');
        formData.append('image', 'fake-image-data');

        const created = {
          id: 123,
          name: 'Test Product',
          description: 'Desc',
          price: 19.99,
          categoryId: 7,
          imageUrl: '/placeholder.jpg',
          category: {id: 7, name: 'Cat'},
        };

        mockPrisma.product.create.mockResolvedValue(created);

        const request = new NextRequest(
          'http://localhost:3000/api/admin/products',
          {
            method: 'POST',
            body: formData,
          },
        );

        const res = await POST(request);
        expect(res instanceof NextResponse).toBe(true);

        const body = await res.json();
        expect(res.status).toBe(201);
        expect(body.imageUrl).toBe('/placeholder.jpg');

        expect(mockPrisma.product.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              name: 'Test Product',
              description: 'Desc',
              price: 19.99,
              categoryId: 7,
              imageUrl: '/placeholder.jpg',
            }),
            include: expect.objectContaining({category: true}),
          }),
        );
      });
    });
  });
});
