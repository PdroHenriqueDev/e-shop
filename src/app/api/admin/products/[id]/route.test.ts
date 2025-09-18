import {describe, it, expect, vi, beforeEach} from 'vitest';
import {NextRequest, NextResponse} from 'next/server';
import {GET, PUT, DELETE} from './route';
import {validateAdminAccess} from '@/lib/adminMiddleware';
import prisma from '@/lib/prisma';

vi.mock('@/lib/adminMiddleware', () => ({
  validateAdminAccess: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

describe('Admin Products API', () => {
  const mockProduct = {
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    categoryId: 1,
    imageUrl: 'test-image.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 1,
      name: 'Test Category',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNextResponse.json.mockImplementation((data: any, options?: any) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
    }));
  });

  describe('GET /api/admin/products/[id]', () => {
    it('should return error when admin access validation fails', async () => {
      const mockError = NextResponse.json(
        {error: 'Unauthorized'},
        {status: 401},
      );
      mockValidateAdminAccess.mockResolvedValue({error: mockError});

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: '1'});

      const result = await GET(mockRequest, {params});

      expect(mockValidateAdminAccess).toHaveBeenCalled();
      expect(result).toBe(mockError);
    });

    it('should return 400 when product ID is invalid', async () => {
      mockValidateAdminAccess.mockResolvedValue({});

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: 'invalid'});

      await GET(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Invalid product ID'},
        {status: 400},
      );
    });

    it('should return 404 when product is not found', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: '1'});

      await GET(mockRequest, {params});

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: {id: 1},
        include: {
          category: true,
        },
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Product not found'},
        {status: 404},
      );
    });

    it('should return product when found', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: '1'});

      await GET(mockRequest, {params});

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: {id: 1},
        include: {
          category: true,
        },
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(mockProduct);
    });

    it('should return 500 when database error occurs', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.product.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: '1'});

      await GET(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Failed to fetch product'},
        {status: 500},
      );
    });
  });

  describe('PUT /api/admin/products/[id]', () => {
    const createMockFormData = (data: Record<string, string | File | null>) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null) {
          formData.append(key, value);
        }
      });
      return formData;
    };

    it('should return error when admin access validation fails', async () => {
      const mockError = NextResponse.json(
        {error: 'Unauthorized'},
        {status: 401},
      );
      mockValidateAdminAccess.mockResolvedValue({error: mockError});

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(
          createMockFormData({
            name: 'Test Product',
            description: 'Test Description',
            price: '99.99',
            categoryId: '1',
          }),
        ),
      } as any;
      const params = Promise.resolve({id: '1'});

      const result = await PUT(mockRequest, {params});

      expect(mockValidateAdminAccess).toHaveBeenCalled();
      expect(result).toBe(mockError);
    });

    it('should return 400 when product ID is invalid', async () => {
      mockValidateAdminAccess.mockResolvedValue({});

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(
          createMockFormData({
            name: 'Test Product',
            description: 'Test Description',
            price: '99.99',
            categoryId: '1',
          }),
        ),
      } as any;
      const params = Promise.resolve({id: 'invalid'});

      await PUT(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Invalid product ID'},
        {status: 400},
      );
    });

    it('should return 400 when name is missing', async () => {
      mockValidateAdminAccess.mockResolvedValue({});

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(
          createMockFormData({
            name: null,
            description: 'Test Description',
            price: '99.99',
            categoryId: '1',
          }),
        ),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Missing required fields'},
        {status: 400},
      );
    });

    it('should return 400 when description is missing', async () => {
      mockValidateAdminAccess.mockResolvedValue({});

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(
          createMockFormData({
            name: 'Test Product',
            description: null,
            price: '99.99',
            categoryId: '1',
          }),
        ),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Missing required fields'},
        {status: 400},
      );
    });

    it('should return 400 when price is missing', async () => {
      mockValidateAdminAccess.mockResolvedValue({});

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(
          createMockFormData({
            name: 'Test Product',
            description: 'Test Description',
            price: null,
            categoryId: '1',
          }),
        ),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Missing required fields'},
        {status: 400},
      );
    });

    it('should return 400 when categoryId is missing', async () => {
      mockValidateAdminAccess.mockResolvedValue({});

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(
          createMockFormData({
            name: 'Test Product',
            description: 'Test Description',
            price: '99.99',
            categoryId: null,
          }),
        ),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Missing required fields'},
        {status: 400},
      );
    });

    it('should return 404 when product is not found', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(
          createMockFormData({
            name: 'Test Product',
            description: 'Test Description',
            price: '99.99',
            categoryId: '1',
          }),
        ),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: {id: 1},
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Product not found'},
        {status: 404},
      );
    });

    it('should successfully update product without image', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue(mockProduct);

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(
          createMockFormData({
            name: 'Updated Product',
            description: 'Updated Description',
            price: '149.99',
            categoryId: '2',
          }),
        ),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: {id: 1},
        data: {
          name: 'Updated Product',
          description: 'Updated Description',
          price: 149.99,
          categoryId: 2,
          imageUrl: 'test-image.jpg',
        },
        include: {
          category: true,
        },
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(mockProduct);
    });

    it('should successfully update product with image', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue(mockProduct);

      const mockFile = new File(['test'], 'test.jpg', {type: 'image/jpeg'});
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(
          createMockFormData({
            name: 'Updated Product',
            description: 'Updated Description',
            price: '149.99',
            categoryId: '2',
            image: mockFile,
          }),
        ),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: {id: 1},
        data: {
          name: 'Updated Product',
          description: 'Updated Description',
          price: 149.99,
          categoryId: 2,
          imageUrl: '/placeholder.jpg',
        },
        include: {
          category: true,
        },
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(mockProduct);
    });

    it('should return 500 when database error occurs during findUnique', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.product.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(
          createMockFormData({
            name: 'Test Product',
            description: 'Test Description',
            price: '99.99',
            categoryId: '1',
          }),
        ),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Failed to update product'},
        {status: 500},
      );
    });

    it('should return 500 when database error occurs during update', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockRejectedValue(new Error('Database error'));

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(
          createMockFormData({
            name: 'Test Product',
            description: 'Test Description',
            price: '99.99',
            categoryId: '1',
          }),
        ),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Failed to update product'},
        {status: 500},
      );
    });

    it('should return 500 when form data parsing fails', async () => {
      mockValidateAdminAccess.mockResolvedValue({});

      const mockRequest = {
        formData: vi.fn().mockRejectedValue(new Error('Invalid form data')),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Failed to update product'},
        {status: 500},
      );
    });
  });

  describe('DELETE /api/admin/products/[id]', () => {
    it('should return error when admin access validation fails', async () => {
      const mockError = NextResponse.json(
        {error: 'Unauthorized'},
        {status: 401},
      );
      mockValidateAdminAccess.mockResolvedValue({error: mockError});

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: '1'});

      const result = await DELETE(mockRequest, {params});

      expect(mockValidateAdminAccess).toHaveBeenCalled();
      expect(result).toBe(mockError);
    });

    it('should return 400 when product ID is invalid', async () => {
      mockValidateAdminAccess.mockResolvedValue({});

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: 'invalid'});

      await DELETE(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Invalid product ID'},
        {status: 400},
      );
    });

    it('should return 404 when product is not found', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: '1'});

      await DELETE(mockRequest, {params});

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: {id: 1},
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Product not found'},
        {status: 404},
      );
    });

    it('should successfully delete product', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.delete.mockResolvedValue(mockProduct);

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: '1'});

      await DELETE(mockRequest, {params});

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: {id: 1},
      });
      expect(mockPrisma.product.delete).toHaveBeenCalledWith({
        where: {id: 1},
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith({
        message: 'Product deleted successfully',
      });
    });

    it('should return 500 when database error occurs during findUnique', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.product.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: '1'});

      await DELETE(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Failed to delete product'},
        {status: 500},
      );
    });

    it('should return 500 when database error occurs during delete', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.delete.mockRejectedValue(new Error('Database error'));

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: '1'});

      await DELETE(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Failed to delete product'},
        {status: 500},
      );
    });
  });
});
