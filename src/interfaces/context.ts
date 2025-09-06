import {ReactNode} from 'react';
import {OrderProps} from './order';
import {CartItemProps, ProductProps} from './product';

export interface OrderContextType {
  orders: OrderProps[];
  currentOrder: OrderProps | null;
  orderIsLoading: boolean;
  placeOrder: (
    shippingAddress: string,
    paymentMethod: string,
    total: number,
  ) => Promise<OrderProps | null>;
  fetchOrders: () => Promise<void>;
  fetchOrderById: (id: number) => Promise<void>;
  updateOrderPaymentStatus: (
    orderId: number,
    paymentStatus: string,
    stripeSessionId?: string,
    paymentIntentId?: string,
  ) => Promise<void>;
  verifyStripePayment: (sessionId: string) => Promise<OrderProps | null>;
}

export interface CartContextType {
  cartItems: CartItemProps[];
  addToCart: (product: ProductProps) => void;
  handleSetCartItems: (cartItem: CartItemProps[]) => void;
  updateCartQuantity: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (cartItem: CartItemProps) => void;
  cartIsLoading: boolean;
}

export type NotifyFunction = (options: {
  type: import('antd/es/message/interface').NoticeType;
  msg: string;
  duration?: number;
}) => void;

export interface NotificationContextType {
  notify: NotifyFunction;
}

export interface NotificationProviderProps {
  children: ReactNode;
}
