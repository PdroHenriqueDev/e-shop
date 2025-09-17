import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from './route';
import { validateAdminAccess } from '@/lib/adminMiddleware';

// Mock the validateAdminAccess function
vi.mock('@/lib/adminMiddleware', () => ({
  validateAdminAccess: vi.fn(),
}));

const mockValidateAdminAccess = validateAdminAccess as vi.MockedFunction<typeof validateAdminAccess>;

describe('Admin Validate API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/validate', () => {
    describe('Authentication Success', () => {
      it('returns success response when admin access is valid', async () => {
        const mockUser = {
          id: '1',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
        };

        mockValidateAdminAccess.mockResolvedValue({
          user: mockUser,
          error: null,
        });

        const result = await GET();
        const data = await result.json();

        expect(result.status).toBe(200);
        expect(data).toEqual({
          success: true,
          user: mockUser,
        });
        expect(mockValidateAdminAccess).toHaveBeenCalledTimes(1);
      });

      it('returns user data with correct structure', async () => {
        const mockUser = {
          id: '2',
          name: 'Another Admin',
          email: 'another@example.com',
          role: 'admin',
        };

        mockValidateAdminAccess.mockResolvedValue({
          user: mockUser,
          error: null,
        });

        const result = await GET();
        const data = await result.json();

        expect(data.success).toBe(true);
        expect(data.user).toEqual(mockUser);
        expect(data.user.id).toBe('2');
        expect(data.user.name).toBe('Another Admin');
        expect(data.user.email).toBe('another@example.com');
        expect(data.user.role).toBe('admin');
      });
    });

    describe('Authentication Failure', () => {
      it('returns error response when admin access is invalid', async () => {
        const mockErrorResponse = NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );

        mockValidateAdminAccess.mockResolvedValue({
          user: null,
          error: mockErrorResponse,
        });

        const result = await GET();

        expect(result).toBe(mockErrorResponse);
        expect(mockValidateAdminAccess).toHaveBeenCalledTimes(1);
      });

      it('returns 403 error when user is not admin', async () => {
        const mockErrorResponse = NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        );

        mockValidateAdminAccess.mockResolvedValue({
          user: null,
          error: mockErrorResponse,
        });

        const result = await GET();

        expect(result).toBe(mockErrorResponse);
        expect(mockValidateAdminAccess).toHaveBeenCalledTimes(1);
      });

      it('returns 401 error when no token is provided', async () => {
        const mockErrorResponse = NextResponse.json(
          { error: 'No token provided' },
          { status: 401 }
        );

        mockValidateAdminAccess.mockResolvedValue({
          user: null,
          error: mockErrorResponse,
        });

        const result = await GET();

        expect(result).toBe(mockErrorResponse);
        expect(mockValidateAdminAccess).toHaveBeenCalledTimes(1);
      });

      it('returns 401 error when token is invalid', async () => {
        const mockErrorResponse = NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );

        mockValidateAdminAccess.mockResolvedValue({
          user: null,
          error: mockErrorResponse,
        });

        const result = await GET();

        expect(result).toBe(mockErrorResponse);
        expect(mockValidateAdminAccess).toHaveBeenCalledTimes(1);
      });
    });

    describe('Error Handling', () => {
      it('handles validateAdminAccess throwing an error', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        mockValidateAdminAccess.mockRejectedValue(new Error('Database connection failed'));

        try {
          await GET();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Database connection failed');
        }

        expect(mockValidateAdminAccess).toHaveBeenCalledTimes(1);
        
        consoleErrorSpy.mockRestore();
      });

      it('handles validateAdminAccess returning undefined', async () => {
        mockValidateAdminAccess.mockResolvedValue(undefined as any);

        try {
          await GET();
        } catch (error) {
          expect(error).toBeDefined();
        }

        expect(mockValidateAdminAccess).toHaveBeenCalledTimes(1);
      });
    });

    describe('Edge Cases', () => {
      it('handles user object with minimal properties', async () => {
        const mockUser = {
          id: '3',
          name: '',
          email: '',
          role: 'admin',
        };

        mockValidateAdminAccess.mockResolvedValue({
          user: mockUser,
          error: null,
        });

        const result = await GET();
        const data = await result.json();

        expect(result.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.user).toEqual(mockUser);
      });

      it('handles user object with additional properties', async () => {
        const mockUser = {
          id: '4',
          name: 'Super Admin',
          email: 'super@example.com',
          role: 'admin',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        };

        mockValidateAdminAccess.mockResolvedValue({
          user: mockUser,
          error: null,
        });

        const result = await GET();
        const data = await result.json();

        expect(result.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.user).toEqual(mockUser);
      });
    });
  });
});