import {describe, it, expect} from 'vitest';
import type {SessionUser} from './auth';

describe('SessionUser Interface', () => {
  describe('Required Properties', () => {
    it('should have all required properties', () => {
      const user: SessionUser = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      };

      expect(user.id).toBe('user-123');
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.role).toBe('user');
    });

    it('should accept string values for all required properties', () => {
      const user: SessionUser = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      };

      expect(typeof user.id).toBe('string');
      expect(typeof user.name).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(typeof user.role).toBe('string');
    });
  });

  describe('Optional Properties', () => {
    it('should allow optional image property', () => {
      const userWithImage: SessionUser = {
        id: 'user-456',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'user',
        image: 'profile.jpg',
      };

      expect(userWithImage.image).toBe('profile.jpg');
    });

    it('should work without optional image property', () => {
      const userWithoutImage: SessionUser = {
        id: 'user-789',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        role: 'admin',
      };

      expect(userWithoutImage.image).toBeUndefined();
    });

    it('should allow null image property', () => {
      const userWithNullImage: SessionUser = {
        id: 'user-null',
        name: 'Null Image User',
        email: 'null@example.com',
        role: 'user',
        image: null,
      };

      expect(userWithNullImage.image).toBeNull();
    });
  });

  describe('Data Types', () => {
    it('should accept different role values', () => {
      const adminUser: SessionUser = {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      };

      const regularUser: SessionUser = {
        id: 'user-1',
        name: 'Regular User',
        email: 'user@example.com',
        role: 'user',
      };

      expect(adminUser.role).toBe('admin');
      expect(regularUser.role).toBe('user');
    });

    it('should handle various string formats for names', () => {
      const userWithLongName: SessionUser = {
        id: 'user-long',
        name: 'Very Long Name With Multiple Words And Spaces',
        email: 'long@example.com',
        role: 'user',
      };

      const userWithShortName: SessionUser = {
        id: 'user-short',
        name: 'Al',
        email: 'al@example.com',
        role: 'user',
      };

      expect(userWithLongName.name).toBe(
        'Very Long Name With Multiple Words And Spaces',
      );
      expect(userWithShortName.name).toBe('Al');
    });
  });

  describe('Special Characters', () => {
    it('should handle special characters in email', () => {
      const userWithComplexEmail: SessionUser = {
        id: 'user-complex',
        name: 'Complex User',
        email: 'user+test.email@sub-domain.example-site.com',
        role: 'user',
      };

      expect(userWithComplexEmail.email).toBe(
        'user+test.email@sub-domain.example-site.com',
      );
    });

    it('should handle special characters in name', () => {
      const userWithSpecialName: SessionUser = {
        id: 'user-special',
        name: "O'Connor-Smith, Jr.",
        email: 'special@example.com',
        role: 'user',
      };

      expect(userWithSpecialName.name).toBe("O'Connor-Smith, Jr.");
    });

    it('should handle unicode characters', () => {
      const userWithUnicode: SessionUser = {
        id: 'user-unicode',
        name: 'José María González',
        email: 'jose@example.com',
        role: 'user',
      };

      expect(userWithUnicode.name).toBe('José María González');
    });
  });

  describe('NextAuth Compatibility', () => {
    it('should be compatible with next-auth User interface', () => {
      const nextAuthUser: SessionUser = {
        id: 'nextauth-123',
        name: 'NextAuth User',
        email: 'nextauth@example.com',
        role: 'user',
        image: 'https://example.com/avatar.jpg',
      };

      // Test that it has the expected next-auth properties
      expect(nextAuthUser).toHaveProperty('id');
      expect(nextAuthUser).toHaveProperty('name');
      expect(nextAuthUser).toHaveProperty('email');
      expect(nextAuthUser).toHaveProperty('image');

      // Test that it has our custom role property
      expect(nextAuthUser).toHaveProperty('role');
      expect(nextAuthUser.role).toBe('user');
    });

    it('should work with session data structure', () => {
      const sessionUser: SessionUser = {
        id: 'session-456',
        name: 'Session User',
        email: 'session@example.com',
        role: 'admin',
        image: null,
      };

      const mockSession = {
        user: sessionUser,
        expires: '2024-12-31',
      };

      expect(mockSession.user.id).toBe('session-456');
      expect(mockSession.user.role).toBe('admin');
    });
  });
});
