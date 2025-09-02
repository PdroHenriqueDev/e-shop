import {NextRequest, NextResponse} from 'next/server';
import {auth} from '../../../../../auth';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

async function verifySession(sessionId: string, userEmail: string) {
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

  if (!checkoutSession) {
    throw new Error('Session not found');
  }

  if (checkoutSession.customer_email !== userEmail) {
    throw new Error('Unauthorized access to session');
  }

  const orderId = checkoutSession.metadata?.orderId;

  if (!orderId) {
    throw new Error('No order ID found in session');
  }

  const order = await prisma.order.findUnique({
    where: {id: parseInt(orderId)},
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return {
    session: {
      id: checkoutSession.id,
      payment_status: checkoutSession.payment_status,
      status: checkoutSession.status,
      amount_total: checkoutSession.amount_total,
      currency: checkoutSession.currency,
      customer_email: checkoutSession.customer_email,
    },
    order: {
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      items: order.items,
      createdAt: order.createdAt,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {error: 'Authentication required'},
        {status: 401},
      );
    }

    const {searchParams} = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        {error: 'Session ID is required'},
        {status: 400},
      );
    }

    const result = await verifySession(sessionId, session.user.email);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error verifying session:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {error: `Stripe error: ${error.message}`},
        {status: 400},
      );
    }

    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Internal server error'},
      {status: 500},
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {error: 'Authentication required'},
        {status: 401},
      );
    }

    const {sessionId} = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        {error: 'Session ID is required'},
        {status: 400},
      );
    }

    const result = await verifySession(sessionId, session.user.email);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error verifying session:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {error: `Stripe error: ${error.message}`},
        {status: 400},
      );
    }

    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
