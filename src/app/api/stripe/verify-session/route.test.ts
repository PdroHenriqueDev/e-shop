import {NextRequest} from 'next/server';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import {auth} from '../../../../../auth';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';

process.env.STRIPE_SECRET_KEY = 'sk_test_123';

vi.mock('../../../../../auth', () => ({
  auth: vi.fn(),
}));

vi.mock('stripe', () => {
  const mockStripe = {
    checkout: {
      sessions: {
        retrieve: vi.fn(),
      },
    },
  };

  const StripeError = class StripeError extends Error {
    type: string;
    constructor(options: {message: string; type: string}) {
      super(options.message);
      this.type = options.type;
    }
  };

  const StripeConstructor = vi.fn(() => mockStripe) as any;
  StripeConstructor.errors = {
    StripeError,
  };

  return {
    default: StripeConstructor,
    errors: {
      StripeError,
    },
  };
});

vi.mock('@/lib/prisma', () => ({
  default: {
    order: {
      findUnique: vi.fn(),
    },
  },
}));

const mockAuth = auth as any;
const mockPrisma = prisma as any;

const mockCheckoutSession = {
  id: 'cs_test_123',
  payment_status: 'paid',
  status: 'complete',
  amount_total: 9999,
  currency: 'usd',
  customer_email: 'test@example.com',
  metadata: {
    orderId: '1',
    userId: '1',
  },
};

const mockOrder = {
  id: 1,
  status: 'pending',
  paymentStatus: 'paid',
  total: 99.99,
  createdAt: new Date('2023-01-01T00:00:00Z'),
  items: [
    {
      id: 1,
      quantity: 2,
      price: 29.99,
      product: {
        id: 1,
        name: 'Test Product 1',
        description: 'Test description',
        image: 'https://example.com/image1.jpg',
      },
    },
    {
      id: 2,
      quantity: 1,
      price: 39.99,
      product: {
        id: 2,
        name: 'Test Product 2',
        description: null,
        image: null,
      },
    },
  ],
};

describe('Stripe Verify Session API', () => {
  describe('Environment Variable Validation', () => {
    it('throws error when STRIPE_SECRET_KEY is not set', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;
      vi.resetModules();
      await expect(import('./route')).rejects.toThrow(
        'STRIPE_SECRET_KEY is not set',
      );
      process.env.STRIPE_SECRET_KEY = originalKey;
      vi.resetModules();
    });
  });

  let GET: any;
  let POST: any;
  let mockStripe: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import the route functions after mocks are set up
    const routeModule = await import('./route');
    GET = routeModule.GET;
    POST = routeModule.POST;

    // Get the mocked Stripe instance
    const StripeConstructor = (await import('stripe')).default;
    mockStripe = new StripeConstructor();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/stripe/verify-session', () => {
    describe('Authentication', () => {
      it('returns 401 when user is not authenticated', async () => {
        mockAuth.mockResolvedValue(null);

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session?session_id=cs_test_123',
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Authentication required');
      });

      it('returns 401 when user session has no email', async () => {
        mockAuth.mockResolvedValue({user: {}});

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session?session_id=cs_test_123',
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Authentication required');
      });
    });

    describe('Request Validation', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {email: 'test@example.com'},
        });
      });

      it('returns 400 when session_id is missing', async () => {
        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session',
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Session ID is required');
      });

      it('returns 400 when session_id is empty', async () => {
        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session?session_id=',
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Session ID is required');
      });
    });

    describe('Session Verification', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {email: 'test@example.com'},
        });
      });

      it('returns 500 when Stripe session is not found', async () => {
        mockStripe.checkout.sessions.retrieve.mockResolvedValue(null);

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session?session_id=cs_invalid',
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Session not found');
      });

      it('returns 500 when user email does not match session email', async () => {
        const sessionWithDifferentEmail = {
          ...mockCheckoutSession,
          customer_email: 'other@example.com',
        };
        mockStripe.checkout.sessions.retrieve.mockResolvedValue(
          sessionWithDifferentEmail,
        );

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session?session_id=cs_test_123',
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Unauthorized access to session');
      });

      it('returns 500 when session has no order ID in metadata', async () => {
        const sessionWithoutOrderId = {
          ...mockCheckoutSession,
          metadata: {},
        };
        mockStripe.checkout.sessions.retrieve.mockResolvedValue(
          sessionWithoutOrderId,
        );

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session?session_id=cs_test_123',
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('No order ID found in session');
      });

      it('returns 500 when order is not found in database', async () => {
        mockStripe.checkout.sessions.retrieve.mockResolvedValue(
          mockCheckoutSession,
        );
        mockPrisma.order.findUnique.mockResolvedValue(null);

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session?session_id=cs_test_123',
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Order not found');
        expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
          where: {id: 1},
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });
      });

      it('successfully verifies session and returns session and order data', async () => {
        mockStripe.checkout.sessions.retrieve.mockResolvedValue(
          mockCheckoutSession,
        );
        mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session?session_id=cs_test_123',
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          session: {
            id: 'cs_test_123',
            payment_status: 'paid',
            status: 'complete',
            amount_total: 9999,
            currency: 'usd',
            customer_email: 'test@example.com',
          },
          order: {
            id: 1,
            status: 'pending',
            paymentStatus: 'paid',
            total: 99.99,
            items: mockOrder.items,
            createdAt: mockOrder.createdAt.toISOString(),
          },
        });
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {email: 'test@example.com'},
        });
      });

      it('handles Stripe errors', async () => {
        const StripeModule = await import('stripe');
        const stripeError = new StripeModule.default.errors.StripeError({
          message: 'Invalid session ID',
          type: 'invalid_request_error',
        });
        mockStripe.checkout.sessions.retrieve.mockRejectedValue(stripeError);

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session?session_id=cs_invalid',
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Stripe error: Invalid session ID');
      });

      it('handles database errors', async () => {
        mockStripe.checkout.sessions.retrieve.mockResolvedValue(
          mockCheckoutSession,
        );
        mockPrisma.order.findUnique.mockRejectedValue(
          new Error('Database connection failed'),
        );

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session?session_id=cs_test_123',
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Database connection failed');
      });

      it('handles generic errors', async () => {
        mockStripe.checkout.sessions.retrieve.mockRejectedValue(
          'Unknown error',
        );

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session?session_id=cs_test_123',
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Internal server error');
      });
    });
  });

  describe('POST /api/stripe/verify-session', () => {
    describe('Authentication', () => {
      it('returns 401 when user is not authenticated', async () => {
        mockAuth.mockResolvedValue(null);

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session',
          {
            method: 'POST',
            body: JSON.stringify({sessionId: 'cs_test_123'}),
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Authentication required');
      });

      it('returns 401 when user session has no email', async () => {
        mockAuth.mockResolvedValue({user: {}});

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session',
          {
            method: 'POST',
            body: JSON.stringify({sessionId: 'cs_test_123'}),
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Authentication required');
      });
    });

    describe('Request Validation', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {email: 'test@example.com'},
        });
      });

      it('returns 400 when sessionId is missing', async () => {
        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session',
          {
            method: 'POST',
            body: JSON.stringify({}),
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Session ID is required');
      });

      it('returns 400 when sessionId is null', async () => {
        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session',
          {
            method: 'POST',
            body: JSON.stringify({sessionId: null}),
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Session ID is required');
      });
    });

    describe('Session Verification', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {email: 'test@example.com'},
        });
      });

      it('successfully verifies session and returns session and order data', async () => {
        mockStripe.checkout.sessions.retrieve.mockResolvedValue(
          mockCheckoutSession,
        );
        mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session',
          {
            method: 'POST',
            body: JSON.stringify({sessionId: 'cs_test_123'}),
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          session: {
            id: 'cs_test_123',
            payment_status: 'paid',
            status: 'complete',
            amount_total: 9999,
            currency: 'usd',
            customer_email: 'test@example.com',
          },
          order: {
            id: 1,
            status: 'pending',
            paymentStatus: 'paid',
            total: 99.99,
            items: mockOrder.items,
            createdAt: mockOrder.createdAt.toISOString(),
          },
        });
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {email: 'test@example.com'},
        });
      });

      it('handles Stripe errors', async () => {
        const StripeModule = await import('stripe');
        const stripeError = new StripeModule.default.errors.StripeError({
          message: 'Invalid session ID',
          type: 'invalid_request_error',
        });
        mockStripe.checkout.sessions.retrieve.mockRejectedValue(stripeError);

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session',
          {
            method: 'POST',
            body: JSON.stringify({sessionId: 'cs_invalid'}),
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Stripe error: Invalid session ID');
      });

      it('handles JSON parsing errors', async () => {
        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session',
          {
            method: 'POST',
            body: 'invalid json',
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Internal server error');
      });

      it('handles database errors', async () => {
        mockStripe.checkout.sessions.retrieve.mockResolvedValue(
          mockCheckoutSession,
        );
        mockPrisma.order.findUnique.mockRejectedValue(
          new Error('Database connection failed'),
        );

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/verify-session',
          {
            method: 'POST',
            body: JSON.stringify({sessionId: 'cs_test_123'}),
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Internal server error');
      });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {email: 'test@example.com'},
      });
    });

    it('handles session with null metadata', async () => {
      const sessionWithNullMetadata = {
        ...mockCheckoutSession,
        metadata: null,
      };
      mockStripe.checkout.sessions.retrieve.mockResolvedValue(
        sessionWithNullMetadata,
      );

      const request = new NextRequest(
        'http://localhost:3000/api/stripe/verify-session?session_id=cs_test_123',
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('No order ID found in session');
    });

    it('handles session with undefined metadata', async () => {
      const sessionWithUndefinedMetadata = {
        ...mockCheckoutSession,
        metadata: undefined,
      };
      mockStripe.checkout.sessions.retrieve.mockResolvedValue(
        sessionWithUndefinedMetadata,
      );

      const request = new NextRequest(
        'http://localhost:3000/api/stripe/verify-session?session_id=cs_test_123',
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('No order ID found in session');
    });

    it('handles order ID that cannot be parsed as integer', async () => {
      const sessionWithInvalidOrderId = {
        ...mockCheckoutSession,
        metadata: {
          orderId: 'invalid',
        },
      };
      mockStripe.checkout.sessions.retrieve.mockResolvedValue(
        sessionWithInvalidOrderId,
      );
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/stripe/verify-session?session_id=cs_test_123',
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Order not found');
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
        where: {id: NaN},
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
});
