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
    user: {
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

describe('Admin Users API', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    createdAt: new Date(),
    _count: {
      orders: 5,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNextResponse.json.mockImplementation((data: any, options?: any) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
    }));
  });

  describe('GET /api/admin/users/[id]', () => {
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

    it('should return 400 when user ID is invalid', async () => {
      mockValidateAdminAccess.mockResolvedValue({});

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: 'invalid'});

      await GET(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Invalid user ID'},
        {status: 400},
      );
    });

    it('should return 404 when user is not found', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: '1'});

      await GET(mockRequest, {params});

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {id: 1},
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'User not found'},
        {status: 404},
      );
    });

    it('should return user when found', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: '1'});

      await GET(mockRequest, {params});

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {id: 1},
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 500 when database error occurs', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: '1'});

      await GET(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Failed to fetch user'},
        {status: 500},
      );
    });
  });

  describe('PUT /api/admin/users/[id]', () => {
    it('should return error when admin access validation fails', async () => {
      const mockError = NextResponse.json(
        {error: 'Unauthorized'},
        {status: 401},
      );
      mockValidateAdminAccess.mockResolvedValue({error: mockError});

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          name: 'Updated User',
          email: 'updated@example.com',
          role: 'admin',
        }),
      } as any;
      const params = Promise.resolve({id: '1'});

      const result = await PUT(mockRequest, {params});

      expect(mockValidateAdminAccess).toHaveBeenCalled();
      expect(result).toBe(mockError);
    });

    it('should return 400 when user ID is invalid', async () => {
      mockValidateAdminAccess.mockResolvedValue({});

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          name: 'Updated User',
          email: 'updated@example.com',
          role: 'admin',
        }),
      } as any;
      const params = Promise.resolve({id: 'invalid'});

      await PUT(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Invalid user ID'},
        {status: 400},
      );
    });

    it('should return 400 when name is missing', async () => {
      mockValidateAdminAccess.mockResolvedValue({});

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          email: 'updated@example.com',
          role: 'admin',
        }),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Name, email, and role are required'},
        {status: 400},
      );
    });

    it('should return 400 when email is missing', async () => {
      mockValidateAdminAccess.mockResolvedValue({});

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          name: 'Updated User',
          role: 'admin',
        }),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Name, email, and role are required'},
        {status: 400},
      );
    });

    it('should return 400 when role is missing', async () => {
      mockValidateAdminAccess.mockResolvedValue({});

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          name: 'Updated User',
          email: 'updated@example.com',
        }),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Name, email, and role are required'},
        {status: 400},
      );
    });

    it('should return 400 when role is invalid', async () => {
      mockValidateAdminAccess.mockResolvedValue({});

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          name: 'Updated User',
          email: 'updated@example.com',
          role: 'invalid_role',
        }),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Invalid role'},
        {status: 400},
      );
    });

    it('should return 404 when user is not found', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          name: 'Updated User',
          email: 'updated@example.com',
          role: 'admin',
        }),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {id: 1},
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'User not found'},
        {status: 404},
      );
    });

    it('should return 400 when email is already taken by another user', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({id: 2, email: 'updated@example.com'});

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          name: 'Updated User',
          email: 'updated@example.com',
          role: 'admin',
        }),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {email: 'updated@example.com'},
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Email is already taken'},
        {status: 400},
      );
    });

    it('should successfully update user with same email', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          name: 'Updated User',
          email: 'test@example.com',
          role: 'admin',
        }),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: {id: 1},
        data: {
          name: 'Updated User',
          email: 'test@example.com',
          role: 'admin',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should successfully update user with new email', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          name: 'Updated User',
          email: 'new@example.com',
          role: 'admin',
        }),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {email: 'new@example.com'},
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: {id: 1},
        data: {
          name: 'Updated User',
          email: 'new@example.com',
          role: 'admin',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should successfully update user with user role', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          name: 'Updated User',
          email: 'test@example.com',
          role: 'user',
        }),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: {id: 1},
        data: {
          name: 'Updated User',
          email: 'test@example.com',
          role: 'user',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 500 when database error occurs during findUnique', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          name: 'Updated User',
          email: 'updated@example.com',
          role: 'admin',
        }),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Failed to update user'},
        {status: 500},
      );
    });

    it('should return 500 when database error occurs during update', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockRejectedValue(new Error('Database error'));

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          name: 'Updated User',
          email: 'test@example.com',
          role: 'admin',
        }),
      } as any;
      const params = Promise.resolve({id: '1'});

      await PUT(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Failed to update user'},
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
        {error: 'Failed to update user'},
        {status: 500},
      );
    });
  });

  describe('DELETE /api/admin/users/[id]', () => {
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

    it('should return 400 when user ID is invalid', async () => {
      mockValidateAdminAccess.mockResolvedValue({});

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: 'invalid'});

      await DELETE(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Invalid user ID'},
        {status: 400},
      );
    });

    it('should return 404 when user is not found', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: '1'});

      await DELETE(mockRequest, {params});

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {id: 1},
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'User not found'},
        {status: 404},
      );
    });

    it('should successfully delete user', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.delete.mockResolvedValue(mockUser);

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: '1'});

      await DELETE(mockRequest, {params});

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {id: 1},
      });
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: {id: 1},
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith({
        message: 'User deleted successfully',
      });
    });

    it('should return 500 when database error occurs during findUnique', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: '1'});

      await DELETE(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Failed to delete user'},
        {status: 500},
      );
    });

    it('should return 500 when database error occurs during delete', async () => {
      mockValidateAdminAccess.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.delete.mockRejectedValue(new Error('Database error'));

      const mockRequest = {} as NextRequest;
      const params = Promise.resolve({id: '1'});

      await DELETE(mockRequest, {params});

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        {error: 'Failed to delete user'},
        {status: 500},
      );
    });
  });
});
