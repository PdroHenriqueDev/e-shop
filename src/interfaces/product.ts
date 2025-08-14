export interface ProductProps {
  image: string;
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItemProps {
  cartId: number;
  cartItemId: number;
  productId: number;
  quantity: number;
  product: ProductProps;
}
