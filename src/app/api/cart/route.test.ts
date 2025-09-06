import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {NextRequest} from 'next/server';
import {GET, POST, PUT, DELETE} from './route';
import prisma from '@/lib/prisma';

vi.mock('../../../../auth', () => ({
  auth: vi.fn(),
}));

import {auth} from '../../../../auth';

vi.mock('@/lib/prisma', () => ({
  default: {
    cart: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    cartItem: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const mockPrisma = prisma as any;
const mockAuth = auth as any;

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
};

const mockSession = {
  user: mockUser,
};

const mockCart = {
  id: 1,
  userId: 1,
  items: [
    {
      id: 1,
      cartId: 1,
      productId: 1,
      quantity: 2,
      product: {
        id: 1,
        name: 'Test Product',
        price: 100,
        imageUrl: 'test.jpg',
      },
    },
  ],
};

describe('/api/cart', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth.mockResolvedValue(mockSession);

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/cart', () => {
    it('should return cart for authenticated user', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);

      const request = new NextRequest('http://localhost:3000/api/cart');
      const response = await GET();
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toEqual(mockCart.items);
      expect(mockPrisma.cart.findUnique).toHaveBeenCalledWith({
        where: {userId: 1},
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/cart');
      const response = await GET();
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe('Not authenticated');
    });

    it('should create empty cart if none exists', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockPrisma.cart.findUnique.mockResolvedValue(null);
      const emptyCart = {
        id: 1,
        userId: 1,
        items: [],
      };
      mockPrisma.cart.create.mockResolvedValue(emptyCart);
      mockPrisma.cart.findUnique.mockResolvedValueOnce(emptyCart);

      const request = new NextRequest('http://localhost:3000/api/cart');
      const response = await GET();
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toEqual([]);
      expect(mockPrisma.cart.findUnique).toHaveBeenCalledWith({
        where: {userId: 1},
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  });

  describe('POST /api/cart', () => {
    it('should add item to cart successfully', async () => {
      const cartData = {
        productId: 1,
        quantity: 2,
      };

      mockAuth.mockResolvedValue(mockSession);
      mockPrisma.cart.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        items: [],
      });
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);
      mockPrisma.cartItem.create.mockResolvedValue({
        id: 1,
        cartId: 1,
        productId: 1,
        quantity: 2,
      });
      mockPrisma.cart.findUnique.mockResolvedValueOnce(mockCart);

      const request = new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify(cartData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(mockPrisma.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: 1,
          productId: 1,
          quantity: 2,
        },
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({productId: 1, quantity: 2}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe('Not authenticated');
    });

    it('should return 400 for invalid input', async () => {
      mockAuth.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({productId: 1}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Invalid input');
    });
  });

  describe('DELETE /api/cart', () => {
    it('should delete cart item successfully', async () => {
      mockAuth.mockResolvedValue(mockSession);
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);
      mockPrisma.cartItem.findUnique.mockResolvedValue({
        id: 1,
        cartId: 1,
        productId: 1,
        quantity: 2,
      });
      mockPrisma.cartItem.delete.mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/cart', {
        method: 'DELETE',
        body: JSON.stringify({productId: 1}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await DELETE(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.message).toBe('Cart item deleted successfully');
      expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({
        where: {cartId_productId: {cartId: 1, productId: 1}},
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/cart', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toBe('Not authenticated');
    });
  });
});