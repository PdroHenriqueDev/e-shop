import {ProductProps} from './product';

export interface OrderItemProps {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product: ProductProps;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderProps {
  id: number;
  userId: number;
  total: number;
  status: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  items: OrderItemProps[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingFormData {
  fullName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
