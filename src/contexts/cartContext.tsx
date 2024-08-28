'use client';
import {createContext, useContext, useState, ReactNode} from 'react';
import {ProductProps} from '@/interfaces/product';
import {useNotification} from './notificationContext';

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

  const addToCart = (product: ProductProps) => {
    setCart(prevCart => [...prevCart, product]);
    notify({
      type: 'success',
      msg: `${product.name} has been added to your cart!`,
    });
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
