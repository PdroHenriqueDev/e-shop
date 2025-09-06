export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
  COMPLETED: 'completed',
} as const;

export const CHECKOUT_STEP = {
  SHIPPING: 'shipping',
  PAYMENT: 'payment',
  REVIEW: 'review',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export type CheckoutStep = (typeof CHECKOUT_STEP)[keyof typeof CHECKOUT_STEP];
