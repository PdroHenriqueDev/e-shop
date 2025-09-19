import {NextRequest} from 'next/server';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import prisma from '@/lib/prisma';
import {ORDER_STATUS} from '@/constants';

process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';

vi.mock('stripe', () => {
  const mockStripe = {
    webhooks: {
      constructEvent: vi.fn(),
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
      update: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/constants', () => ({
  ORDER_STATUS: {
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
  },
}));

const mockPrisma = prisma as any;

const mockCheckoutSession = {
  id: 'cs_test_123',
  payment_intent: 'pi_test_123',
  metadata: {
    orderId: '1',
    userId: '1',
  },
};

const mockPaymentIntent = {
  id: 'pi_test_123',
  status: 'succeeded',
  amount: 9999,
  currency: 'usd',
};

const mockOrder = {
  id: 1,
  status: 'pending',
  paymentStatus: 'pending',
  paymentIntentId: 'pi_test_123',
};

describe('Stripe Webhooks API', () => {
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

    it('throws error when STRIPE_WEBHOOK_SECRET is not set', async () => {
      const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      vi.resetModules();
      await expect(import('./route')).rejects.toThrow(
        'STRIPE_WEBHOOK_SECRET is not set',
      );
      process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
      vi.resetModules();
    });
  });

  let POST: any;
  let mockStripe: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const routeModule = await import('./route');
    POST = routeModule.POST;

    const StripeConstructor = (await import('stripe')).default;
    mockStripe = new StripeConstructor();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/stripe/webhooks', () => {
    describe('Request Validation', () => {
      it('returns 400 when Stripe signature is missing', async () => {
        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'checkout.session.completed'}),
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing Stripe signature');
      });

      it('returns 400 when webhook signature verification fails', async () => {
        mockStripe.webhooks.constructEvent.mockImplementation(() => {
          throw new Error('Invalid signature');
        });

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'checkout.session.completed'}),
            headers: {
              'stripe-signature': 'invalid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Webhook signature verification failed');
      });
    });

    describe('Checkout Session Completed', () => {
      beforeEach(() => {
        mockStripe.webhooks.constructEvent.mockReturnValue({
          type: 'checkout.session.completed',
          data: {
            object: mockCheckoutSession,
          },
        });
      });

      it('successfully handles checkout session completed event', async () => {
        mockPrisma.order.update.mockResolvedValue({
          id: 1,
          paymentStatus: 'PAID',
          status: ORDER_STATUS.CONFIRMED,
        });

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'checkout.session.completed'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockPrisma.order.update).toHaveBeenCalledWith({
          where: {id: 1},
          data: {
            paymentStatus: 'PAID',
            paymentIntentId: 'pi_test_123',
            status: ORDER_STATUS.CONFIRMED,
          },
        });
      });

      it('handles checkout session completed with missing orderId', async () => {
        const sessionWithoutOrderId = {
          ...mockCheckoutSession,
          metadata: {},
        };

        mockStripe.webhooks.constructEvent.mockReturnValue({
          type: 'checkout.session.completed',
          data: {
            object: sessionWithoutOrderId,
          },
        });

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'checkout.session.completed'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockPrisma.order.update).not.toHaveBeenCalled();
      });

      it('handles checkout session completed with null metadata', async () => {
        const sessionWithNullMetadata = {
          ...mockCheckoutSession,
          metadata: null,
        };

        mockStripe.webhooks.constructEvent.mockReturnValue({
          type: 'checkout.session.completed',
          data: {
            object: sessionWithNullMetadata,
          },
        });

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'checkout.session.completed'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockPrisma.order.update).not.toHaveBeenCalled();
      });

      it('handles database error during checkout session completed', async () => {
        mockPrisma.order.update.mockRejectedValue(
          new Error('Database connection failed'),
        );

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'checkout.session.completed'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
      });
    });

    describe('Payment Intent Succeeded', () => {
      beforeEach(() => {
        mockStripe.webhooks.constructEvent.mockReturnValue({
          type: 'payment_intent.succeeded',
          data: {
            object: mockPaymentIntent,
          },
        });
      });

      it('successfully handles payment intent succeeded event', async () => {
        mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
        mockPrisma.order.update.mockResolvedValue({
          ...mockOrder,
          paymentStatus: 'PAID',
          status: ORDER_STATUS.CONFIRMED,
        });

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'payment_intent.succeeded'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockPrisma.order.findFirst).toHaveBeenCalledWith({
          where: {
            paymentIntentId: 'pi_test_123',
          },
        });
        expect(mockPrisma.order.update).toHaveBeenCalledWith({
          where: {id: 1},
          data: {
            paymentStatus: 'PAID',
            status: ORDER_STATUS.CONFIRMED,
          },
        });
      });

      it('handles payment intent succeeded with no matching order', async () => {
        mockPrisma.order.findFirst.mockResolvedValue(null);

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'payment_intent.succeeded'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockPrisma.order.update).not.toHaveBeenCalled();
      });

      it('handles database error during payment intent succeeded', async () => {
        mockPrisma.order.findFirst.mockRejectedValue(
          new Error('Database connection failed'),
        );

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'payment_intent.succeeded'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
      });
    });

    describe('Payment Intent Failed', () => {
      beforeEach(() => {
        mockStripe.webhooks.constructEvent.mockReturnValue({
          type: 'payment_intent.payment_failed',
          data: {
            object: mockPaymentIntent,
          },
        });
      });

      it('successfully handles payment intent failed event', async () => {
        mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
        mockPrisma.order.update.mockResolvedValue({
          ...mockOrder,
          paymentStatus: 'FAILED',
          status: ORDER_STATUS.CANCELLED,
        });

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'payment_intent.payment_failed'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockPrisma.order.findFirst).toHaveBeenCalledWith({
          where: {
            paymentIntentId: 'pi_test_123',
          },
        });
        expect(mockPrisma.order.update).toHaveBeenCalledWith({
          where: {id: 1},
          data: {
            paymentStatus: 'FAILED',
            status: ORDER_STATUS.CANCELLED,
          },
        });
      });

      it('handles payment intent failed with no matching order', async () => {
        mockPrisma.order.findFirst.mockResolvedValue(null);

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'payment_intent.payment_failed'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockPrisma.order.update).not.toHaveBeenCalled();
      });

      it('handles database error during payment intent failed', async () => {
        mockPrisma.order.findFirst.mockRejectedValue(
          new Error('Database connection failed'),
        );

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'payment_intent.payment_failed'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
      });
    });

    describe('Checkout Session Expired', () => {
      beforeEach(() => {
        mockStripe.webhooks.constructEvent.mockReturnValue({
          type: 'checkout.session.expired',
          data: {
            object: mockCheckoutSession,
          },
        });
      });

      it('successfully handles checkout session expired event', async () => {
        mockPrisma.order.update.mockResolvedValue({
          id: 1,
          paymentStatus: 'FAILED',
          status: ORDER_STATUS.CANCELLED,
        });

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'checkout.session.expired'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockPrisma.order.update).toHaveBeenCalledWith({
          where: {id: 1},
          data: {
            paymentStatus: 'FAILED',
            status: ORDER_STATUS.CANCELLED,
          },
        });
      });

      it('handles checkout session expired with missing orderId', async () => {
        const sessionWithoutOrderId = {
          ...mockCheckoutSession,
          metadata: {},
        };

        mockStripe.webhooks.constructEvent.mockReturnValue({
          type: 'checkout.session.expired',
          data: {
            object: sessionWithoutOrderId,
          },
        });

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'checkout.session.expired'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockPrisma.order.update).not.toHaveBeenCalled();
      });

      it('handles checkout session expired with null metadata', async () => {
        const sessionWithNullMetadata = {
          ...mockCheckoutSession,
          metadata: null,
        };

        mockStripe.webhooks.constructEvent.mockReturnValue({
          type: 'checkout.session.expired',
          data: {
            object: sessionWithNullMetadata,
          },
        });

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'checkout.session.expired'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockPrisma.order.update).not.toHaveBeenCalled();
      });

      it('handles database error during checkout session expired', async () => {
        mockPrisma.order.update.mockRejectedValue(
          new Error('Database connection failed'),
        );

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'checkout.session.expired'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
      });
    });

    describe('Unhandled Events', () => {
      it('handles unhandled event types gracefully', async () => {
        mockStripe.webhooks.constructEvent.mockReturnValue({
          type: 'invoice.payment_succeeded',
          data: {
            object: {},
          },
        });

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'invoice.payment_succeeded'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
      });
    });

    describe('Error Handling', () => {
      it('handles generic errors and returns 500', async () => {
        mockStripe.webhooks.constructEvent.mockImplementation(() => {
          throw new Error('Unexpected error');
        });

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'checkout.session.completed'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Webhook signature verification failed');
      });

      it('handles request body parsing errors', async () => {
        // Mock request.text() to throw an error
        const originalText = NextRequest.prototype.text;
        NextRequest.prototype.text = vi
          .fn()
          .mockRejectedValue(new Error('Failed to parse body'));

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: 'invalid body',
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Webhook handler failed');

        // Restore original method
        NextRequest.prototype.text = originalText;
      });
    });

    describe('Edge Cases', () => {
      it('handles event with undefined data', async () => {
        mockStripe.webhooks.constructEvent.mockReturnValue({
          type: 'checkout.session.completed',
          data: undefined,
        });

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'checkout.session.completed'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Webhook handler failed');
      });

      it('handles event with null data', async () => {
        mockStripe.webhooks.constructEvent.mockReturnValue({
          type: 'checkout.session.completed',
          data: null,
        });

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'checkout.session.completed'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Webhook handler failed');
      });

      it('handles invalid orderId in metadata', async () => {
        const sessionWithInvalidOrderId = {
          ...mockCheckoutSession,
          metadata: {
            orderId: 'invalid',
          },
        };

        mockStripe.webhooks.constructEvent.mockReturnValue({
          type: 'checkout.session.completed',
          data: {
            object: sessionWithInvalidOrderId,
          },
        });

        mockPrisma.order.update.mockResolvedValue({
          id: NaN,
          paymentStatus: 'PAID',
          status: ORDER_STATUS.CONFIRMED,
        });

        const request = new NextRequest(
          'http://localhost:3000/api/stripe/webhooks',
          {
            method: 'POST',
            body: JSON.stringify({type: 'checkout.session.completed'}),
            headers: {
              'stripe-signature': 'valid_signature',
            },
          },
        );

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.received).toBe(true);
        expect(mockPrisma.order.update).toHaveBeenCalledWith({
          where: {id: NaN},
          data: {
            paymentStatus: 'PAID',
            paymentIntentId: 'pi_test_123',
            status: ORDER_STATUS.CONFIRMED,
          },
        });
      });
    });
  });
});
