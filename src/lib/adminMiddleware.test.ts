import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {NextResponse} from 'next/server';
import {validateAdminAccess, validateUserAccess} from './adminMiddleware';

// Mock dependencies
vi.mock('../../auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data: any, options?: any) => ({
      data,
      status: options?.status || 200,
    })),
  },
}));

describe('adminMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateAdminAccess', () => {
    it('should return authentication error when no session', async () => {
      const {auth} = await import('../../auth');
      vi.mocked(auth).mockResolvedValue(null as any);

      const result = await validateAdminAccess();

      expect(result.error).toBeDefined();
      expect(NextResponse.json).toHaveBeenCalledWith(
        {error: 'Authentication required'},
        {status: 401},
      );
    });

    it('should return authentication error when no user in session', async () => {
      const {auth} = await import('../../auth');
      vi.mocked(auth).mockResolvedValue({user: null} as any);

      const result = await validateAdminAccess();

      expect(result.error).toBeDefined();
      expect(NextResponse.json).toHaveBeenCalledWith(
        {error: 'Authentication required'},
        {status: 401},
      );
    });

    it('should return user not found error when user does not exist in database', async () => {
      const {auth} = await import('../../auth');
      const prisma = await import('@/lib/prisma');

      vi.mocked(auth).mockResolvedValue({
        user: {id: '123', email: 'test@example.com'},
      } as any);
      vi.mocked(prisma.default.user.findUnique).mockResolvedValue(null);

      const result = await validateAdminAccess();

      expect(result.error).toBeDefined();
      expect(NextResponse.json).toHaveBeenCalledWith(
        {error: 'User not found'},
        {status: 404},
      );
      expect(prisma.default.user.findUnique).toHaveBeenCalledWith({
        where: {id: 123},
      });
    });

    it('should return access denied error when user is not admin', async () => {
      const {auth} = await import('../../auth');
      const prisma = await import('@/lib/prisma');

      vi.mocked(auth).mockResolvedValue({
        user: {id: '123', email: 'test@example.com'},
      } as any);
      vi.mocked(prisma.default.user.findUnique).mockResolvedValue({
        id: 123,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await validateAdminAccess();

      expect(result.error).toBeDefined();
      expect(NextResponse.json).toHaveBeenCalledWith(
        {error: 'Admin access required'},
        {status: 403},
      );
    });

    it('should return user when validation succeeds for admin', async () => {
      const {auth} = await import('../../auth');
      const prisma = await import('@/lib/prisma');

      const mockUser = {
        id: 123,
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'hashed',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(auth).mockResolvedValue({
        user: {id: '123', email: 'admin@example.com'},
      } as any);
      vi.mocked(prisma.default.user.findUnique).mockResolvedValue(mockUser);

      const result = await validateAdminAccess();

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeUndefined();
    });

    it('should handle database errors gracefully', async () => {
      const {auth} = await import('../../auth');
      const prisma = await import('@/lib/prisma');

      vi.mocked(auth).mockResolvedValue({
        user: {id: '123', email: 'test@example.com'},
      } as any);
      vi.mocked(prisma.default.user.findUnique).mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await validateAdminAccess();

      expect(result.error).toBeDefined();
      expect(NextResponse.json).toHaveBeenCalledWith(
        {error: 'Internal server error'},
        {status: 500},
      );
      expect(console.error).toHaveBeenCalledWith(
        'Admin validation error:',
        expect.any(Error),
      );
    });
  });

  describe('validateUserAccess', () => {
    it('should return authentication error when no session', async () => {
      const {auth} = await import('../../auth');
      vi.mocked(auth).mockResolvedValue(null as any);

      const result = await validateUserAccess();

      expect(result.error).toBeDefined();
      expect(NextResponse.json).toHaveBeenCalledWith(
        {error: 'Authentication required'},
        {status: 401},
      );
    });

    it('should return authentication error when no user in session', async () => {
      const {auth} = await import('../../auth');
      vi.mocked(auth).mockResolvedValue({user: null} as any);

      const result = await validateUserAccess();

      expect(result.error).toBeDefined();
      expect(NextResponse.json).toHaveBeenCalledWith(
        {error: 'Authentication required'},
        {status: 401},
      );
    });

    it('should return user not found error when user does not exist in database', async () => {
      const {auth} = await import('../../auth');
      const prisma = await import('@/lib/prisma');

      vi.mocked(auth).mockResolvedValue({
        user: {id: '456', email: 'user@example.com'},
      } as any);
      vi.mocked(prisma.default.user.findUnique).mockResolvedValue(null);

      const result = await validateUserAccess();

      expect(result.error).toBeDefined();
      expect(NextResponse.json).toHaveBeenCalledWith(
        {error: 'User not found'},
        {status: 404},
      );
      expect(prisma.default.user.findUnique).toHaveBeenCalledWith({
        where: {id: 456},
      });
    });

    it('should return user when validation succeeds', async () => {
      const {auth} = await import('../../auth');
      const prisma = await import('@/lib/prisma');

      const mockUser = {
        id: 456,
        name: 'Regular User',
        email: 'user@example.com',
        password: 'hashed',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(auth).mockResolvedValue({
        user: {id: '456', email: 'user@example.com'},
      } as any);
      vi.mocked(prisma.default.user.findUnique).mockResolvedValue(mockUser);

      const result = await validateUserAccess();

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeUndefined();
    });

    it('should handle database errors gracefully', async () => {
      const {auth} = await import('../../auth');
      const prisma = await import('@/lib/prisma');

      vi.mocked(auth).mockResolvedValue({
        user: {id: '456', email: 'user@example.com'},
      } as any);
      vi.mocked(prisma.default.user.findUnique).mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await validateUserAccess();

      expect(result.error).toBeDefined();
      expect(NextResponse.json).toHaveBeenCalledWith(
        {error: 'Internal server error'},
        {status: 500},
      );
      expect(console.error).toHaveBeenCalledWith(
        'User validation error:',
        expect.any(Error),
      );
    });
  });
});
