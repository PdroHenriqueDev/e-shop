'use client';

import React, {createContext, useContext, useState, useCallback} from 'react';
import axios from '@/lib/axios';
import {OrderProps} from '@/interfaces/order';
import {OrderContextType} from '@/interfaces/context';
import {useNotification} from './notificationContext';

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [orders, setOrders] = useState<OrderProps[]>([]);
  const [currentOrder, setCurrentOrder] = useState<OrderProps | null>(null);
  const [orderIsLoading, setOrderIsLoading] = useState<boolean>(false);
  const {notify} = useNotification();

  const placeOrder = useCallback(
    async (
      shippingAddress: string,
      paymentMethod: string,
      total: number,
    ): Promise<OrderProps | null> => {
      setOrderIsLoading(true);
      try {
        const response = await axios.post('/api/orders', {
          shippingAddress,
          paymentMethod,
          total,
        });

        setCurrentOrder(response.data);
        notify({type: 'success', msg: 'Order placed successfully!'});
        return response.data;
      } catch (error) {
        notify({
          type: 'error',
          msg: 'Failed to place order. Please try again.',
        });
        return null;
      } finally {
        setOrderIsLoading(false);
      }
    },
    [notify],
  );

  const fetchOrders = useCallback(async (): Promise<void> => {
    setOrderIsLoading(true);
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      notify({type: 'error', msg: 'Failed to fetch orders'});
    } finally {
      setOrderIsLoading(false);
    }
  }, [notify]);

  const fetchOrderById = useCallback(
    async (id: number): Promise<void> => {
      setOrderIsLoading(true);
      try {
        const response = await axios.get(`/api/orders/${id}`);
        setCurrentOrder(response.data);
      } catch (error) {
        console.error(`Error fetching order ${id}:`, error);
        notify({type: 'error', msg: 'Failed to fetch order details'});
      } finally {
        setOrderIsLoading(false);
      }
    },
    [notify],
  );

  const updateOrderPaymentStatus = useCallback(
    async (
      orderId: number,
      paymentStatus: string,
      stripeSessionId?: string,
      paymentIntentId?: string,
    ): Promise<void> => {
      try {
        const response = await axios.patch(`/api/orders/${orderId}`, {
          paymentStatus,
          stripeSessionId,
          paymentIntentId,
        });

        if (currentOrder && currentOrder.id === orderId) {
          setCurrentOrder(response.data);
        }

        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? response.data : order,
          ),
        );

        notify({
          type: 'success',
          msg: 'Order payment status updated successfully!',
        });
      } catch (error) {
        console.error('Error updating order payment status:', error);
        notify({
          type: 'error',
          msg: 'Failed to update payment status',
        });
      }
    },
    [currentOrder, notify],
  );

  const verifyStripePayment = useCallback(
    async (sessionId: string): Promise<OrderProps | null> => {
      setOrderIsLoading(true);
      try {
        const response = await axios.post('/api/stripe/verify-session', {
          sessionId,
        });

        const order = response.data.order;
        setCurrentOrder(order);

        setOrders(prevOrders =>
          prevOrders.map(existingOrder =>
            existingOrder.id === order.id ? order : existingOrder,
          ),
        );

        return order;
      } catch (error) {
        console.error('Error verifying Stripe payment:', error);
        notify({
          type: 'error',
          msg: 'Failed to verify payment status',
        });
        return null;
      } finally {
        setOrderIsLoading(false);
      }
    },
    [notify],
  );

  return (
    <OrderContext.Provider
      value={{
        orders,
        currentOrder,
        orderIsLoading,
        placeOrder,
        fetchOrders,
        fetchOrderById,
        updateOrderPaymentStatus,
        verifyStripePayment,
      }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
``;
