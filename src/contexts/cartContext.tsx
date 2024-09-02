'use client';
import {createContext, useContext, useState, ReactNode} from 'react';
import {ProductProps} from '@/interfaces/product';
import {useNotification} from './notificationContext';
import axios from 'axios';

interface CartContextType {
  cart: ProductProps[];
  addToCart: (product: ProductProps) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({children}: {children: ReactNode}) => {
  const [cart, setCart] = useState<ProductProps[]>([]);
  const {notify} = useNotification();

  const addToCart = async (product: ProductProps) => {
    try {
      const response = await axios.post('/api/cart', {
        productId: product.id,
        quantity: 1,
      });

      if (response.status === 201) {
        setCart(prevCart => [...prevCart, product]);
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

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(product => product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{cart, addToCart, removeFromCart, clearCart}}>
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
