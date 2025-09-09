import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {NextResponse} from 'next/server';
import {GET, POST} from './route';
import prisma from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findMany: vi.fn(),
      create: vi.fn(),
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

describe('/api/users', () => {
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
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedpassword1',
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          password: 'hashedpassword2',
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      await GET();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith();
      expect(mockNextResponse.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should return empty array when no users exist', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await GET();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith();
      expect(mockNextResponse.json).toHaveBeenCalledWith([]);
    });

    it('should handle database error in GET', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.user.findMany.mockRejectedValue(dbError);

      await expect(GET()).rejects.toThrow('Database connection failed');
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith();
    });

    it('should call prisma.user.findMany exactly once', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await GET();

      expect(mockPrisma.user.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST', () => {
    const mockRequest = (body: any) =>
      ({
        json: vi.fn().mockResolvedValue(body),
      }) as any;

    it('should create a new user successfully', async () => {
      const requestBody = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const createdUser = {
        id: 1,
        ...requestBody,
      };

      const request = mockRequest(requestBody);
      mockPrisma.user.create.mockResolvedValue(createdUser);

      await POST(request);

      expect(request.json).toHaveBeenCalledWith();
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        },
      });
      expect(mockNextResponse.json).toHaveBeenCalledWith(createdUser, {
        status: 201,
      });
    });

    it('should handle missing name field', async () => {
      const requestBody = {
        email: 'john@example.com',
        password: 'password123',
      };

      const createdUser = {
        id: 1,
        name: undefined,
        email: 'john@example.com',
        password: 'password123',
      };

      const request = mockRequest(requestBody);
      mockPrisma.user.create.mockResolvedValue(createdUser);

      await POST(request);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: undefined,
          email: 'john@example.com',
          password: 'password123',
        },
      });
    });

    it('should handle missing email field', async () => {
      const requestBody = {
        name: 'John Doe',
        password: 'password123',
      };

      const createdUser = {
        id: 1,
        name: 'John Doe',
        email: undefined,
        password: 'password123',
      };

      const request = mockRequest(requestBody);
      mockPrisma.user.create.mockResolvedValue(createdUser);

      await POST(request);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          email: undefined,
          password: 'password123',
        },
      });
    });

    it('should handle missing password field', async () => {
      const requestBody = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const createdUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: undefined,
      };

      const request = mockRequest(requestBody);
      mockPrisma.user.create.mockResolvedValue(createdUser);

      await POST(request);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: undefined,
        },
      });
    });

    it('should handle empty request body', async () => {
      const requestBody = {};

      const createdUser = {
        id: 1,
        name: undefined,
        email: undefined,
        password: undefined,
      };

      const request = mockRequest(requestBody);
      mockPrisma.user.create.mockResolvedValue(createdUser);

      await POST(request);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: undefined,
          email: undefined,
          password: undefined,
        },
      });
    });

    it('should handle database error during user creation', async () => {
      const requestBody = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const request = mockRequest(requestBody);
      const dbError = new Error('Unique constraint violation');
      mockPrisma.user.create.mockRejectedValue(dbError);

      await expect(POST(request)).rejects.toThrow(
        'Unique constraint violation',
      );
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: requestBody,
      });
    });

    it('should handle invalid JSON in request', async () => {
      const request = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any;

      await expect(POST(request)).rejects.toThrow('Invalid JSON');
      expect(request.json).toHaveBeenCalledWith();
    });

    it('should create user with additional fields ignored', async () => {
      const requestBody = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        extraField: 'ignored',
        anotherField: 'also ignored',
      };

      const createdUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const request = mockRequest(requestBody);
      mockPrisma.user.create.mockResolvedValue(createdUser);

      await POST(request);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        },
      });
    });

    it('should handle null values in request body', async () => {
      const requestBody = {
        name: null,
        email: null,
        password: null,
      };

      const createdUser = {
        id: 1,
        name: null,
        email: null,
        password: null,
      };

      const request = mockRequest(requestBody);
      mockPrisma.user.create.mockResolvedValue(createdUser);

      await POST(request);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: null,
          email: null,
          password: null,
        },
      });
    });

    it('should return 201 status code for successful creation', async () => {
      const requestBody = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const createdUser = {id: 1, ...requestBody};
      const request = mockRequest(requestBody);
      mockPrisma.user.create.mockResolvedValue(createdUser);

      await POST(request);

      expect(mockNextResponse.json).toHaveBeenCalledWith(createdUser, {
        status: 201,
      });
    });
  });
});
