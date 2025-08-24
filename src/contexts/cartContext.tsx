'use client';
import {createContext, useContext, useState, ReactNode} from 'react';
import {CartItemProps, ProductProps} from '@/interfaces/product';
import {useNotification} from './notificationContext';
import axios from 'axios';

interface CartContextType {
  cartItems: CartItemProps[];
  addToCart: (product: ProductProps) => void;
  handleSetCartItems: (cartItem: CartItemProps[]) => void;
  updateCartQuantity: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (cartItem: CartItemProps) => void;
  cartIsLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({children}: {children: ReactNode}) => {
  const [cartItems, setCartItems] = useState<CartItemProps[]>([]);
  const [cartIsLoading, setCartIsLoading] = useState(false);
  const {notify} = useNotification();

  const addToCart = async (product: ProductProps) => {
    setCartIsLoading(true);
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
    } finally {
      setCartIsLoading(false);
    }
  };

  const handleSetCartItems = (cartItems: CartItemProps[]) => {
    setCartItems(cartItems);
  };

  const removeFromCart = async (cartItem: CartItemProps) => {
    setCartIsLoading(true);
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
    } finally {
      setCartIsLoading(false);
    }
  };

  const updateCartQuantity = async (productId: number, quantity: number) => {
    try {
      setCartIsLoading(true);
      const response = await axios.put('/api/cart', {productId, quantity});
      const updatedItem = response.data;

      setCartItems(prevItems =>
        prevItems.map(item =>
          item.productId === updatedItem.productId
            ? {...item, quantity: updatedItem.quantity}
            : item,
        ),
      );
    } catch (error) {
      console.error('Failed to update cart item quantity:', error);
    } finally {
      setCartIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        addToCart,
        removeFromCart,
        cartItems,
        handleSetCartItems,
        cartIsLoading,
        updateCartQuantity,
      }}>
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
