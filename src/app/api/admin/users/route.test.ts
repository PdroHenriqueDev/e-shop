import {NextRequest, NextResponse} from 'next/server';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import {GET, POST} from './route';
import {validateAdminAccess} from '@/lib/adminMiddleware';
import prisma from '@/lib/prisma';
import {hash} from 'bcrypt';

vi.mock('@/lib/adminMiddleware', () => ({
  validateAdminAccess: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
}));

const mockValidateAdminAccess = validateAdminAccess as any;
const mockPrisma = prisma as any;
const mockHash = hash as any;

describe('Admin Users API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    describe('Authentication', () => {
      it('returns error when admin access validation fails', async () => {
        const errorResponse = NextResponse.json(
          {error: 'Unauthorized'},
          {status: 401},
        );
        mockValidateAdminAccess.mockResolvedValue({error: errorResponse});

        const result = await GET();

        expect(mockValidateAdminAccess).toHaveBeenCalledTimes(1);
        expect(result).toBe(errorResponse);
        expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
      });

      it('proceeds when admin access validation succeeds', async () => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
        mockPrisma.user.findMany.mockResolvedValue([]);

        await GET();

        expect(mockValidateAdminAccess).toHaveBeenCalledTimes(1);
        expect(mockPrisma.user.findMany).toHaveBeenCalledTimes(1);
      });
    });

    describe('Data Fetching', () => {
      beforeEach(() => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
      });

      it('fetches users with correct parameters', async () => {
        mockPrisma.user.findMany.mockResolvedValue([]);

        await GET();

        expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
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
          orderBy: {
            createdAt: 'desc',
          },
        });
      });

      it('returns users data successfully', async () => {
        const mockUsers = [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'customer',
            createdAt: '2024-01-01T00:00:00.000Z',
            _count: {orders: 5},
          },
          {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'admin',
            createdAt: '2024-01-02T00:00:00.000Z',
            _count: {orders: 0},
          },
        ];
        mockPrisma.user.findMany.mockResolvedValue(mockUsers);

        const result = await GET();
        const data = await result.json();

        expect(result.status).toBe(200);
        expect(data).toEqual(mockUsers);
      });

      it('returns empty array when no users exist', async () => {
        mockPrisma.user.findMany.mockResolvedValue([]);

        const result = await GET();
        const data = await result.json();

        expect(result.status).toBe(200);
        expect(data).toEqual([]);
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
      });

      it('handles database error and returns 500', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        mockPrisma.user.findMany.mockRejectedValue(
          new Error('Database connection failed'),
        );

        const result = await GET();
        const data = await result.json();

        expect(result.status).toBe(500);
        expect(data).toEqual({error: 'Failed to fetch users'});
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error fetching users:',
          expect.any(Error),
        );
        consoleSpy.mockRestore();
      });
    });
  });

  describe('POST /api/admin/users', () => {
    const mockRequest = (body: any) =>
      ({
        json: vi.fn().mockResolvedValue(body),
      }) as unknown as NextRequest;

    describe('Authentication', () => {
      it('returns error when admin access validation fails', async () => {
        const errorResponse = NextResponse.json(
          {error: 'Unauthorized'},
          {status: 401},
        );
        mockValidateAdminAccess.mockResolvedValue({error: errorResponse});

        const request = mockRequest({
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
        });
        const result = await POST(request);

        expect(mockValidateAdminAccess).toHaveBeenCalledTimes(1);
        expect(result).toBe(errorResponse);
        expect(request.json).not.toHaveBeenCalled();
      });

      it('proceeds when admin access validation succeeds', async () => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
          id: '1',
          name: 'Test',
          email: 'test@example.com',
          createdAt: new Date(),
        });
        mockHash.mockResolvedValue('hashedPassword');

        const request = mockRequest({
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
        });
        await POST(request);

        expect(mockValidateAdminAccess).toHaveBeenCalledTimes(1);
        expect(request.json).toHaveBeenCalledTimes(1);
      });
    });

    describe('Request Validation', () => {
      beforeEach(() => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
      });

      it('returns 400 when name is missing', async () => {
        const request = mockRequest({
          email: 'test@example.com',
          password: 'password123',
        });
        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(400);
        expect(data).toEqual({error: 'Name, email, and password are required'});
      });

      it('returns 400 when email is missing', async () => {
        const request = mockRequest({name: 'Test', password: 'password123'});
        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(400);
        expect(data).toEqual({error: 'Name, email, and password are required'});
      });

      it('returns 400 when password is missing', async () => {
        const request = mockRequest({name: 'Test', email: 'test@example.com'});
        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(400);
        expect(data).toEqual({error: 'Name, email, and password are required'});
      });

      it('returns 400 when name is empty string', async () => {
        const request = mockRequest({
          name: '',
          email: 'test@example.com',
          password: 'password123',
        });
        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(400);
        expect(data).toEqual({error: 'Name, email, and password are required'});
      });

      it('returns 400 when email is empty string', async () => {
        const request = mockRequest({
          name: 'Test',
          email: '',
          password: 'password123',
        });
        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(400);
        expect(data).toEqual({error: 'Name, email, and password are required'});
      });

      it('returns 400 when password is empty string', async () => {
        const request = mockRequest({
          name: 'Test',
          email: 'test@example.com',
          password: '',
        });
        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(400);
        expect(data).toEqual({error: 'Name, email, and password are required'});
      });

      it('returns 400 when role is invalid', async () => {
        const request = mockRequest({
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
          role: 'invalid',
        });
        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(400);
        expect(data).toEqual({error: 'Invalid role'});
      });

      it('accepts valid customer role', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
          id: '1',
          name: 'Test',
          email: 'test@example.com',
          createdAt: new Date(),
        });
        mockHash.mockResolvedValue('hashedPassword');

        const request = mockRequest({
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
          role: 'customer',
        });
        const result = await POST(request);

        expect(result.status).toBe(201);
      });

      it('accepts valid admin role', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
          id: '1',
          name: 'Test',
          email: 'test@example.com',
          createdAt: new Date(),
        });
        mockHash.mockResolvedValue('hashedPassword');

        const request = mockRequest({
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
          role: 'admin',
        });
        const result = await POST(request);

        expect(result.status).toBe(201);
      });

      it('accepts request without role', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
          id: '1',
          name: 'Test',
          email: 'test@example.com',
          createdAt: new Date(),
        });
        mockHash.mockResolvedValue('hashedPassword');

        const request = mockRequest({
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
        });
        const result = await POST(request);

        expect(result.status).toBe(201);
      });
    });

    describe('User Creation', () => {
      beforeEach(() => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
      });

      it('returns 400 when user with email already exists', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          id: '1',
          name: 'Existing User',
          email: 'test@example.com',
          password: 'hashedPassword',
          role: 'customer',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const request = mockRequest({
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
        });
        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(400);
        expect(data).toEqual({error: 'User with this email already exists'});
        expect(mockPrisma.user.create).not.toHaveBeenCalled();
      });

      it('creates user successfully when email is unique', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        const mockCreatedUser = {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          createdAt: '2024-01-01T00:00:00.000Z',
        };
        mockPrisma.user.create.mockResolvedValue(mockCreatedUser);
        mockHash.mockResolvedValue('hashedPassword123');

        const request = mockRequest({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });
        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(201);
        expect(data).toEqual(mockCreatedUser);
        expect(mockHash).toHaveBeenCalledWith('password123', 10);
        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: {
            name: 'Test User',
            email: 'test@example.com',
            password: 'hashedPassword123',
          },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        });
      });

      it('hashes password correctly', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
          id: '1',
          name: 'Test',
          email: 'test@example.com',
          createdAt: new Date(),
        });
        mockHash.mockResolvedValue('hashedPassword');

        const request = mockRequest({
          name: 'Test',
          email: 'test@example.com',
          password: 'mySecretPassword',
        });
        await POST(request);

        expect(mockHash).toHaveBeenCalledWith('mySecretPassword', 10);
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockValidateAdminAccess.mockResolvedValue({error: null});
      });

      it('handles JSON parsing error and returns 500', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const request = {
          json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        } as unknown as NextRequest;

        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(500);
        expect(data).toEqual({error: 'Failed to create user'});
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error creating user:',
          expect.any(Error),
        );
        consoleSpy.mockRestore();
      });

      it('handles database findUnique error and returns 500', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        mockPrisma.user.findUnique.mockRejectedValue(
          new Error('Database error'),
        );

        const request = mockRequest({
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
        });
        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(500);
        expect(data).toEqual({error: 'Failed to create user'});
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error creating user:',
          expect.any(Error),
        );
        consoleSpy.mockRestore();
      });

      it('handles password hashing error and returns 500', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockHash.mockRejectedValue(new Error('Hashing failed'));

        const request = mockRequest({
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
        });
        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(500);
        expect(data).toEqual({error: 'Failed to create user'});
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error creating user:',
          expect.any(Error),
        );
        consoleSpy.mockRestore();
      });

      it('handles database create error and returns 500', async () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockHash.mockResolvedValue('hashedPassword');
        mockPrisma.user.create.mockRejectedValue(
          new Error('Database create failed'),
        );

        const request = mockRequest({
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
        });
        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(500);
        expect(data).toEqual({error: 'Failed to create user'});
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error creating user:',
          expect.any(Error),
        );
        consoleSpy.mockRestore();
      });
    });
  });
});
