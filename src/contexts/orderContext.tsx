'use client';

import React, {createContext, useContext, useState} from 'react';
import axios from 'axios';
import {OrderProps} from '@/interfaces/order';
import {useNotification} from './notificationContext';

interface OrderContextType {
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
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [orders, setOrders] = useState<OrderProps[]>([]);
  const [currentOrder, setCurrentOrder] = useState<OrderProps | null>(null);
  const [orderIsLoading, setOrderIsLoading] = useState<boolean>(false);
  const {notify} = useNotification();

  const placeOrder = async (
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
      notify({type: 'error', msg: 'Failed to place order. Please try again.'});
      return null;
    } finally {
      setOrderIsLoading(false);
    }
  };

  const fetchOrders = async (): Promise<void> => {
    setOrderIsLoading(true);
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      notify({type: 'error', msg: 'Failed to fetch orders'});
    } finally {
      setOrderIsLoading(false);
    }
  };

  const fetchOrderById = async (id: number): Promise<void> => {
    setOrderIsLoading(true);
    try {
      const response = await axios.get(`/api/orders/${id}`);
      setCurrentOrder(response.data);
    } catch (error) {
      notify({type: 'error', msg: 'Failed to fetch order details'});
    } finally {
      setOrderIsLoading(false);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        currentOrder,
        orderIsLoading,
        placeOrder,
        fetchOrders,
        fetchOrderById,
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
