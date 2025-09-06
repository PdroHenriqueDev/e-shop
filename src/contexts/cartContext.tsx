'use client';
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import {CartItemProps, ProductProps} from '@/interfaces/product';
import {CartContextType} from '@/interfaces/context';
import {useNotification} from './notificationContext';
import axios from '@/lib/axios';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({children}: {children: ReactNode}) => {
  const [cartItems, setCartItems] = useState<CartItemProps[]>([]);
  const [cartIsLoading, setCartIsLoading] = useState(false);
  const {notify} = useNotification();

  const addToCart = useCallback(
    async (product: ProductProps) => {
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
    },
    [notify],
  );

  const handleSetCartItems = useCallback((cartItems: CartItemProps[]) => {
    setCartItems(cartItems);
  }, []);

  const removeFromCart = useCallback(
    async (cartItem: CartItemProps) => {
      setCartIsLoading(true);
      try {
        await axios.delete('/api/cart', {
          data: {
            cartId: cartItem.cartId,
            productId: cartItem.productId,
          },
        });

        setCartItems(prevItems =>
          prevItems.filter(item => item.productId !== cartItem.productId),
        );

        notify({
          type: 'success',
          msg: `${cartItem.product.name} has been removed from your cart!`,
        });
      } catch (error) {
        notify({
          type: 'error',
          msg: `Failed to remove ${cartItem.product.name} from your cart.`,
        });
      } finally {
        setCartIsLoading(false);
      }
    },
    [notify],
  );

  const updateCartQuantity = useCallback(
    async (productId: number, quantity: number) => {
      try {
        setCartIsLoading(true);
        const response = await axios.put('/api/cart', {
          productId,
          quantity,
        });

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
    },
    [],
  );

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
