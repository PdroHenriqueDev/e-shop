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

export interface OrderDetailsProps {
  params: Promise<{
    id: string;
  }>;
}
