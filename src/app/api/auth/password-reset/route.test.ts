import {describe, it, expect, vi, beforeEach} from 'vitest';
import {NextResponse} from 'next/server';
import {hash} from 'bcrypt';
import {POST} from './route';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

const mockHash = hash as vi.MockedFunction<typeof hash>;
const mockPrisma = prisma as {
  user: {
    findUnique: vi.MockedFunction<typeof prisma.user.findUnique>;
    update: vi.MockedFunction<typeof prisma.user.update>;
  };
};
const mockNodemailer = nodemailer as {
  createTransport: vi.MockedFunction<typeof nodemailer.createTransport>;
};

describe('Auth Password Reset API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_PERSONAL_EMAIL = 'test@example.com';
    process.env.NEXT_PUBLIC_PERSONAL_EMAIL_PASSWORD = 'testpassword';
  });

  describe('POST /api/auth/password-reset', () => {
    const mockRequest = (body: any) =>
      ({
        json: vi.fn().mockResolvedValue(body),
      }) as unknown as Request;

    it('resets password and sends email when user exists', async () => {
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'oldHashedPassword',
        role: 'customer',
      };

      const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({messageId: 'test-message-id'}),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockHash.mockResolvedValue('newHashedPassword');
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockNodemailer.createTransport.mockReturnValue(mockTransporter);

      const request = mockRequest({email: 'john@example.com'});
      const result = await POST(request);
      const data = await result.json();

      expect(result.status).toBe(200);
      expect(data).toEqual({
        message: 'New password has been sent to your email',
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {email: 'john@example.com'},
      });
      expect(mockHash).toHaveBeenCalledWith(expect.any(String), 10);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: {email: 'john@example.com'},
        data: {password: 'newHashedPassword'},
      });
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'john@example.com',
        subject: 'Your New Password',
        html: expect.stringContaining('<p>Your new password is:'),
      });
    });

    it('returns 404 when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = mockRequest({email: 'nonexistent@example.com'});
      const result = await POST(request);
      const data = await result.json();

      expect(result.status).toBe(404);
      expect(data).toEqual({message: 'User not found'});
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {email: 'nonexistent@example.com'},
      });
      expect(mockHash).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('handles missing email field', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = mockRequest({});
      const result = await POST(request);
      const data = await result.json();

      expect(result.status).toBe(404);
      expect(data).toEqual({message: 'User not found'});
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {email: undefined},
      });
    });

    it('handles JSON parsing error and returns 500', async () => {
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      const request = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Request;

      const result = await POST(request);
      const data = await result.json();

      expect(data).toEqual({message: 'error'});
      expect(consoleLogSpy).toHaveBeenCalledWith({
        e: expect.any(Error),
      });

      consoleLogSpy.mockRestore();
    });

    it('handles database findUnique error and returns 500', async () => {
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      mockPrisma.user.findUnique.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const request = mockRequest({email: 'john@example.com'});
      const result = await POST(request);
      const data = await result.json();

      expect(data).toEqual({message: 'error'});
      expect(consoleLogSpy).toHaveBeenCalledWith({
        e: expect.any(Error),
      });

      consoleLogSpy.mockRestore();
    });

    it('handles password hashing error and returns 500', async () => {
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'oldHashedPassword',
        role: 'customer',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockHash.mockRejectedValue(new Error('Hashing failed'));

      const request = mockRequest({email: 'john@example.com'});
      const result = await POST(request);
      const data = await result.json();

      expect(data).toEqual({message: 'error'});
      expect(consoleLogSpy).toHaveBeenCalledWith({
        e: expect.any(Error),
      });

      consoleLogSpy.mockRestore();
    });

    it('handles database update error and returns 500', async () => {
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'oldHashedPassword',
        role: 'customer',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockHash.mockResolvedValue('newHashedPassword');
      mockPrisma.user.update.mockRejectedValue(
        new Error('Database update failed'),
      );

      const request = mockRequest({email: 'john@example.com'});
      const result = await POST(request);
      const data = await result.json();

      expect(data).toEqual({message: 'error'});
      expect(consoleLogSpy).toHaveBeenCalledWith({
        e: expect.any(Error),
      });

      consoleLogSpy.mockRestore();
    });

    it('handles email sending error and returns 500', async () => {
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'oldHashedPassword',
        role: 'customer',
      };

      const mockTransporter = {
        sendMail: vi.fn().mockRejectedValue(new Error('Email sending failed')),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockHash.mockResolvedValue('newHashedPassword');
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockNodemailer.createTransport.mockReturnValue(mockTransporter);

      const request = mockRequest({email: 'john@example.com'});
      const result = await POST(request);
      const data = await result.json();

      expect(data).toEqual({message: 'error'});
      expect(consoleLogSpy).toHaveBeenCalledWith({
        e: expect.any(Error),
      });

      consoleLogSpy.mockRestore();
    });

    it('generates random password with correct length', async () => {
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'oldHashedPassword',
        role: 'customer',
      };

      const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({messageId: 'test-message-id'}),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockHash.mockResolvedValue('newHashedPassword');
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockNodemailer.createTransport.mockReturnValue(mockTransporter);

      const request = mockRequest({email: 'john@example.com'});
      await POST(request);

      expect(mockHash).toHaveBeenCalledWith(expect.any(String), 10);
      const passwordArg = mockHash.mock.calls[0][0];
      expect(passwordArg).toHaveLength(12);
      expect(passwordArg).toMatch(/^[a-zA-Z0-9]+$/);
    });

    it('configures nodemailer transporter correctly', async () => {
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'oldHashedPassword',
        role: 'customer',
      };

      const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({messageId: 'test-message-id'}),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockHash.mockResolvedValue('newHashedPassword');
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockNodemailer.createTransport.mockReturnValue(mockTransporter);

      const request = mockRequest({email: 'john@example.com'});
      await POST(request);

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
          user: 'test@example.com',
          pass: 'testpassword',
        },
      });
    });
  });
});
