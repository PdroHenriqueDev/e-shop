import {NextRequest, NextResponse} from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import {ORDER_STATUS} from '@/constants';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        {error: 'Missing Stripe signature'},
        {status: 400},
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        {error: 'Webhook signature verification failed'},
        {status: 400},
      );
    }

    console.log('Received webhook event:', event.type);

    const webhookHandlers = {
      'checkout.session.completed': async (eventData: any) => {
        const session = eventData.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
      },
      'payment_intent.succeeded': async (eventData: any) => {
        const paymentIntent = eventData.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
      },
      'payment_intent.payment_failed': async (eventData: any) => {
        const paymentIntent = eventData.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
      },
      'checkout.session.expired': async (eventData: any) => {
        const session = eventData.object as Stripe.Checkout.Session;
        await handleCheckoutSessionExpired(session);
      },
    };

    const handler = webhookHandlers[event.type as keyof typeof webhookHandlers];
    if (handler) {
      await handler(event.data);
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({received: true});
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({error: 'Webhook handler failed'}, {status: 500});
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  try {
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.error('No orderId in session metadata');
      return;
    }

    await prisma.order.update({
      where: {id: parseInt(orderId)},
      data: {
        paymentStatus: 'PAID',
        paymentIntentId: session.payment_intent as string,
        status: ORDER_STATUS.CONFIRMED,
      },
    });

    console.log(`Order ${orderId} marked as paid`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        paymentIntentId: paymentIntent.id,
      },
    });

    if (!order) {
      console.error(`No order found for payment intent ${paymentIntent.id}`);
      return;
    }

    await prisma.order.update({
      where: {id: order.id},
      data: {
        paymentStatus: 'PAID',
        status: ORDER_STATUS.CONFIRMED,
      },
    });

    console.log(`Order ${order.id} payment confirmed`);
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        paymentIntentId: paymentIntent.id,
      },
    });

    if (!order) {
      console.error(`No order found for payment intent ${paymentIntent.id}`);
      return;
    }

    await prisma.order.update({
      where: {id: order.id},
      data: {
        paymentStatus: 'FAILED',
        status: ORDER_STATUS.CANCELLED,
      },
    });

    console.log(`Order ${order.id} payment failed`);
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  try {
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.error('No orderId in session metadata');
      return;
    }

    await prisma.order.update({
      where: {id: parseInt(orderId)},
      data: {
        paymentStatus: 'FAILED',
        status: ORDER_STATUS.CANCELLED,
      },
    });

    console.log(`Order ${orderId} session expired, marked as cancelled`);
  } catch (error) {
    console.error('Error handling checkout session expired:', error);
  }
}
