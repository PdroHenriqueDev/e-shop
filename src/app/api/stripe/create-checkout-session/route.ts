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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {error: 'Authentication required'},
        {status: 401},
      );
    }

    const {orderId, successUrl, cancelUrl} = await request.json();

    if (!orderId) {
      return NextResponse.json({error: 'Order ID is required'}, {status: 400});
    }

    const order = await prisma.order.findUnique({
      where: {id: orderId},
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({error: 'Order not found'}, {status: 404});
    }

    if (order.user.email !== session.user.email) {
      return NextResponse.json(
        {error: 'Unauthorized access to order'},
        {status: 403},
      );
    }

    // Allow creating new session if order status is not completed
    if (order.stripeSessionId && order.status === 'completed') {
      return NextResponse.json(
        {error: 'Order already completed'},
        {status: 400},
      );
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.items.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product.name,
            description: item.product.description || undefined,
            images: item.product.image ? [item.product.image] : undefined,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url:
        successUrl ||
        `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/checkout/cancel`,
      customer_email: session.user.email,
      metadata: {
        orderId: orderId.toString(),
        userId: order.userId.toString(),
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES'],
      },
      billing_address_collection: 'required',
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    await prisma.order.update({
      where: {id: orderId},
      data: {
        stripeSessionId: checkoutSession.id,
        paymentMethod: 'stripe',
        status: 'pending',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {error: `Stripe error: ${error.message}`},
        {status: 400},
      );
    }

    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
