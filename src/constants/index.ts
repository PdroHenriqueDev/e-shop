/**
 * Application-wide constants
 */

/**
 * Order status constants
 * Defines all possible states an order can be in throughout its lifecycle
 */
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

/**
 * User role constants
 * Defines the different user roles and their permissions level
 */
export const USER_ROLE = {
  USER: 'user',
  ADMIN: 'admin',
  CUSTOMER: 'customer',
} as const;

/**
 * Payment method constants
 * Defines supported payment methods for checkout
 */
export const PAYMENT_METHOD = {
  CREDIT_CARD: 'credit_card',
  STRIPE: 'stripe',
} as const;

/**
 * Checkout step constants
 * Defines the sequential steps in the checkout process
 */
export const CHECKOUT_STEP = {
  SHIPPING: 'shipping',
  PAYMENT: 'payment',
  REVIEW: 'review',
} as const;

/**
 * Order status configuration for UI display
 * Maps order statuses to their display properties (colors, labels, etc.)
 */
export const ORDER_STATUS_CONFIG = [
  {value: ORDER_STATUS.PENDING, label: 'Pending', color: 'orange'},
  {value: ORDER_STATUS.PROCESSING, label: 'Processing', color: 'blue'},
  {value: ORDER_STATUS.SHIPPED, label: 'Shipped', color: 'cyan'},
  {value: ORDER_STATUS.DELIVERED, label: 'Delivered', color: 'green'},
  {value: ORDER_STATUS.CANCELLED, label: 'Cancelled', color: 'red'},
] as const;

/**
 * Type definitions
 */
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
export type PaymentMethod =
  (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];
export type CheckoutStep = (typeof CHECKOUT_STEP)[keyof typeof CHECKOUT_STEP];
