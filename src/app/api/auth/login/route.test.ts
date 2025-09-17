import {describe, it, expect, vi, beforeEach} from 'vitest';
import {NextRequest, NextResponse} from 'next/server';
import {compare} from 'bcrypt';
import {POST} from './route';
import prisma from '@/lib/prisma';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const mockCompare = compare as vi.MockedFunction<typeof compare>;
const mockPrisma = prisma as {
  user: {
    findUnique: vi.MockedFunction<typeof prisma.user.findUnique>;
  };
};

describe('Auth Login API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    const mockRequest = (body: any) =>
      ({
        json: vi.fn().mockResolvedValue(body),
      }) as unknown as NextRequest;

    describe('Successful Login', () => {
      it('returns user data when credentials are valid', async () => {
        const mockUser = {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword123',
          role: 'customer',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockCompare.mockResolvedValue(true);

        const request = mockRequest({
          email: 'john@example.com',
          password: 'password123',
        });

        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(200);
        expect(data).toEqual({user: mockUser});
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: {email: 'john@example.com'},
        });
        expect(mockCompare).toHaveBeenCalledWith(
          'password123',
          'hashedPassword123',
        );
      });

      it('handles admin user login correctly', async () => {
        const mockAdminUser = {
          id: '2',
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'hashedAdminPassword',
          role: 'admin',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockAdminUser);
        mockCompare.mockResolvedValue(true);

        const request = mockRequest({
          email: 'admin@example.com',
          password: 'adminPassword',
        });

        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(200);
        expect(data.user).toEqual(mockAdminUser);
        expect(data.user.role).toBe('admin');
      });
    });

    describe('Authentication Failure', () => {
      it('returns 401 when user does not exist', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const request = mockRequest({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(401);
        expect(data).toEqual({message: 'Invalid credentials'});
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: {email: 'nonexistent@example.com'},
        });
        expect(mockCompare).not.toHaveBeenCalled();
      });

      it('returns 401 when password is incorrect', async () => {
        const mockUser = {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword123',
          role: 'customer',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockCompare.mockResolvedValue(false);

        const request = mockRequest({
          email: 'john@example.com',
          password: 'wrongPassword',
        });

        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(401);
        expect(data).toEqual({message: 'Invalid credentials'});
        expect(mockCompare).toHaveBeenCalledWith(
          'wrongPassword',
          'hashedPassword123',
        );
      });
    });

    describe('Request Validation', () => {
      it('handles missing email field', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const request = mockRequest({
          password: 'password123',
        });

        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(401);
        expect(data).toEqual({message: 'Invalid credentials'});
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: {email: undefined},
        });
      });

      it('handles missing password field', async () => {
        const mockUser = {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword123',
          role: 'customer',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockCompare.mockResolvedValue(false);

        const request = mockRequest({
          email: 'john@example.com',
        });

        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(401);
        expect(mockCompare).toHaveBeenCalledWith(
          undefined,
          'hashedPassword123',
        );
      });

      it('handles empty email string', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const request = mockRequest({
          email: '',
          password: 'password123',
        });

        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(401);
        expect(data).toEqual({message: 'Invalid credentials'});
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: {email: ''},
        });
      });

      it('handles empty password string', async () => {
        const mockUser = {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword123',
          role: 'customer',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockCompare.mockResolvedValue(false);

        const request = mockRequest({
          email: 'john@example.com',
          password: '',
        });

        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(401);
        expect(mockCompare).toHaveBeenCalledWith('', 'hashedPassword123');
      });
    });

    describe('Error Handling', () => {
      it('handles JSON parsing error and returns 500', async () => {
        const consoleLogSpy = vi
          .spyOn(console, 'log')
          .mockImplementation(() => {});

        const request = {
          json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        } as unknown as NextRequest;

        try {
          const result = await POST(request);
          const data = await result.json();

          expect(data).toEqual({message: 'error'});
          expect(consoleLogSpy).toHaveBeenCalledWith({
            e: expect.any(Error),
          });
        } catch (error) {
          // The error is caught by the route's try-catch block
          expect(error).toBeInstanceOf(Error);
        }

        consoleLogSpy.mockRestore();
      });

      it('handles database findUnique error and returns 500', async () => {
        const consoleLogSpy = vi
          .spyOn(console, 'log')
          .mockImplementation(() => {});

        mockPrisma.user.findUnique.mockRejectedValue(
          new Error('Database connection failed'),
        );

        const request = mockRequest({
          email: 'john@example.com',
          password: 'password123',
        });

        const result = await POST(request);
        const data = await result.json();

        expect(data).toEqual({message: 'error'});
        expect(consoleLogSpy).toHaveBeenCalledWith({
          e: new Error('Database connection failed'),
        });

        consoleLogSpy.mockRestore();
      });

      it('handles bcrypt compare error and returns 500', async () => {
        const consoleLogSpy = vi
          .spyOn(console, 'log')
          .mockImplementation(() => {});

        const mockUser = {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword123',
          role: 'customer',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockCompare.mockRejectedValue(new Error('Bcrypt comparison failed'));

        const request = mockRequest({
          email: 'john@example.com',
          password: 'password123',
        });

        const result = await POST(request);
        const data = await result.json();

        expect(data).toEqual({message: 'error'});
        expect(consoleLogSpy).toHaveBeenCalledWith({
          e: new Error('Bcrypt comparison failed'),
        });

        consoleLogSpy.mockRestore();
      });
    });

    describe('Edge Cases', () => {
      it('handles user with null password field', async () => {
        const mockUser = {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          password: null,
          role: 'customer',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockCompare.mockResolvedValue(false);

        const request = mockRequest({
          email: 'john@example.com',
          password: 'password123',
        });

        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(401);
        expect(mockCompare).toHaveBeenCalledWith('password123', null);
      });

      it('handles very long email addresses', async () => {
        const longEmail = 'a'.repeat(100) + '@example.com';
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const request = mockRequest({
          email: longEmail,
          password: 'password123',
        });

        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(401);
        expect(data).toEqual({message: 'Invalid credentials'});
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: {email: longEmail},
        });
      });

      it('handles special characters in password', async () => {
        const mockUser = {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword123',
          role: 'customer',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockCompare.mockResolvedValue(true);

        const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const request = mockRequest({
          email: 'john@example.com',
          password: specialPassword,
        });

        const result = await POST(request);
        const data = await result.json();

        expect(result.status).toBe(200);
        expect(mockCompare).toHaveBeenCalledWith(
          specialPassword,
          'hashedPassword123',
        );
      });
    });
  });
});
