import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {NextRequest} from 'next/server';
import {hash} from 'bcrypt';
import {POST} from './route';
import prisma from '@/lib/prisma';

vi.mock('bcrypt');
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const mockHash = hash as any;
const mockPrisma = prisma as any;

describe('/api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should register a new user successfully', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockHash.mockResolvedValue('hashedPassword');
    mockPrisma.user.create.mockResolvedValue({
      id: 1,
      name: userData.username,
      email: userData.email,
      password: 'hashedPassword',
      role: 'user',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.message).toBe('success');
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: {email: userData.email},
    });
    expect(mockHash).toHaveBeenCalledWith(userData.password, 10);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        name: userData.username,
        email: userData.email,
        password: 'hashedPassword',
      },
    });
  });

  it('should return error if user already exists', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      name: 'existinguser',
      email: userData.email,
      password: 'hashedPassword',
      role: 'user',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toBe('Email already registered. Please log in.');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.message).toBe('error');
  });

  it('should handle invalid JSON gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.message).toBe('error');
  });
});