'use client';
import {createContext, useContext, useState, ReactNode} from 'react';
import {CartItemProps, ProductProps} from '@/interfaces/product';
import {useNotification} from './notificationContext';
import axios from 'axios';

interface CartContextType {
  cartItems: CartItemProps[];
  handleSetCartItems: (cartItem: CartItemProps[]) => void;
  addToCart: (product: ProductProps) => void;
  removeFromCart: (cartItem: CartItemProps) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({children}: {children: ReactNode}) => {
  const [cartItems, setCartItems] = useState<CartItemProps[]>([]);
  const {notify} = useNotification();

  const addToCart = async (product: ProductProps) => {
    try {
      const response = await axios.post('/api/cart', {
        productId: product.id,
        quantity: 1,
      });

      if (response.status === 201) {
        const {items} = response.data;
        setCartItems(items);

        notify({
          type: 'success',
          msg: `${product.name} has been added to your cart!`,
        });
      }
    } catch (error) {
      notify({
        type: 'error',
        msg: `Failed to add ${product.name} to your cart.`,
      });
      console.error('Error adding to cart:', error);
    }
  };

  const handleSetCartItems = (cartItems: CartItemProps[]) => {
    setCartItems(cartItems);
  };

  const removeFromCart = async (cartItem: CartItemProps) => {
    try {
      await axios.delete('/api/cart', {
        data: {
          cartId: cartItem.cartId,
          productId: cartItem.productId,
        },
      });

      setCartItems(prevCartItems =>
        prevCartItems.filter(
          item =>
            item.cartId !== cartItem.cartId ||
            item.productId !== cartItem.productId,
        ),
      );

      notify({
        type: 'success',
        msg: 'Item has been removed from your cart!',
      });
    } catch (error) {
      notify({
        type: 'error',
        msg: 'Failed to remove item from your cart.',
      });
      console.log('Error adding to cart:', error);
    }
  };

  return (
    <CartContext.Provider
      value={{addToCart, removeFromCart, cartItems, handleSetCartItems}}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
