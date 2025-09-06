/**
 * Checkout-related interfaces
 */

/**
 * Order details interface for checkout success page
 */
export interface CheckoutOrderDetails {
  id: string;
  total: number;
  shippingAddress: string;
  paymentStatus: string;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
}

/**
 * Order details props for order details page
 * Props for the OrderDetails component displaying order information
 */
export interface OrderDetailsProps {
  params: Promise<{
    id: string;
  }>;
}
