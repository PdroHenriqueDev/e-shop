import {NextRequest} from 'next/server';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import {auth} from '../../../../../auth';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import {ORDER_STATUS} from '@/constants';

process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

vi.mock('../../../../../auth', () => ({
  auth: vi.fn(),
}));

vi.mock('stripe', () => {
  const mockStripe = {
    checkout: {
      sessions: {
        create: vi.fn(),
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

  const StripeConstructor = vi.fn(() => mockStripe);
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
      update: vi.fn(),
    },
  },
}));

const mockAuth = auth as any;
const mockPrisma = prisma as any;

const mockOrder = {
  id: 1,
  userId: 1,
  total: 99.99,
  status: 'pending',
  stripeSessionId: null,
  user: {
    id: 1,
    email: 'test@example.com',
  },
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

const mockCheckoutSession = {
  id: 'cs_test_123',
  url: 'https://checkout.stripe.com/pay/cs_test_123',
};

describe('POST /api/stripe/create-checkout-session', () => {
  let POST: any;
  let mockStripe: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import the POST function after mocks are set up
    const routeModule = await import('./route');
    POST = routeModule.POST;

    // Get the mocked Stripe instance
    const StripeConstructor = (await import('stripe')).default;
    mockStripe = new StripeConstructor();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/stripe/create-checkout-session',
        {
          method: 'POST',
          body: JSON.stringify({orderId: 1}),
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
        'http://localhost:3000/api/stripe/create-checkout-session',
        {
          method: 'POST',
          body: JSON.stringify({orderId: 1}),
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

    it('returns 400 when orderId is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/stripe/create-checkout-session',
        {
          method: 'POST',
          body: JSON.stringify({}),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Order ID is required');
    });

    it('returns 400 when orderId is null', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/stripe/create-checkout-session',
        {
          method: 'POST',
          body: JSON.stringify({orderId: null}),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Order ID is required');
    });
  });

  describe('Order Validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {email: 'test@example.com'},
      });
    });

    it('returns 404 when order is not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/stripe/create-checkout-session',
        {
          method: 'POST',
          body: JSON.stringify({orderId: 999}),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Order not found');
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
        where: {id: 999},
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
      });
    });

    it('returns 403 when user tries to access another users order', async () => {
      const unauthorizedOrder = {
        ...mockOrder,
        user: {
          id: 2,
          email: 'other@example.com',
        },
      };
      mockPrisma.order.findUnique.mockResolvedValue(unauthorizedOrder);

      const request = new NextRequest(
        'http://localhost:3000/api/stripe/create-checkout-session',
        {
          method: 'POST',
          body: JSON.stringify({orderId: 1}),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Unauthorized access to order');
    });

    it('returns 400 when order is already completed', async () => {
      const completedOrder = {
        ...mockOrder,
        status: 'completed',
        stripeSessionId: 'cs_existing_123',
      };
      mockPrisma.order.findUnique.mockResolvedValue(completedOrder);

      const request = new NextRequest(
        'http://localhost:3000/api/stripe/create-checkout-session',
        {
          method: 'POST',
          body: JSON.stringify({orderId: 1}),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Order already completed');
    });
  });

  describe('Successful Checkout Session Creation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {email: 'test@example.com'},
      });
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockStripe.checkout.sessions.create.mockResolvedValue(
        mockCheckoutSession,
      );
      mockPrisma.order.update.mockResolvedValue({});
    });

    it('creates checkout session with default URLs', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/stripe/create-checkout-session',
        {
          method: 'POST',
          body: JSON.stringify({orderId: 1}),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessionId).toBe('cs_test_123');
      expect(data.url).toBe('https://checkout.stripe.com/pay/cs_test_123');

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Test Product 1',
                description: 'Test description',
                images: ['https://example.com/image1.jpg'],
              },
              unit_amount: 2999,
            },
            quantity: 2,
          },
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Test Product 2',
                description: undefined,
                images: undefined,
              },
              unit_amount: 3999,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url:
          'http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:3000/checkout/cancel',
        customer_email: 'test@example.com',
        metadata: {
          orderId: '1',
          userId: '1',
        },
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES'],
        },
        billing_address_collection: 'required',
        expires_at: expect.any(Number),
      });
    });

    it('creates checkout session with custom URLs', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/stripe/create-checkout-session',
        {
          method: 'POST',
          body: JSON.stringify({
            orderId: 1,
            successUrl: 'https://custom.com/success',
            cancelUrl: 'https://custom.com/cancel',
          }),
        },
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: 'https://custom.com/success',
          cancel_url: 'https://custom.com/cancel',
        }),
      );
    });

    it('updates order with stripe session information', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/stripe/create-checkout-session',
        {
          method: 'POST',
          body: JSON.stringify({orderId: 1}),
        },
      );

      await POST(request);

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: {id: 1},
        data: {
          stripeSessionId: 'cs_test_123',
          paymentMethod: 'stripe',
          status: ORDER_STATUS.PENDING,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {email: 'test@example.com'},
      });
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
    });

    it('handles Stripe errors', async () => {
      const StripeModule = await import('stripe');
      const stripeError = new StripeModule.default.errors.StripeError({
        message: 'Invalid API key',
        type: 'invalid_request_error',
      });
      mockStripe.checkout.sessions.create.mockRejectedValue(stripeError);

      const request = new NextRequest(
        'http://localhost:3000/api/stripe/create-checkout-session',
        {
          method: 'POST',
          body: JSON.stringify({orderId: 1}),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Stripe error: Invalid API key');
    });

    it('handles database errors', async () => {
      mockPrisma.order.findUnique.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const request = new NextRequest(
        'http://localhost:3000/api/stripe/create-checkout-session',
        {
          method: 'POST',
          body: JSON.stringify({orderId: 1}),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('handles JSON parsing errors', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/stripe/create-checkout-session',
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
  });
});
