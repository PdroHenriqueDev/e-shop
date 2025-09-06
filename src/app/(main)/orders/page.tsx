'use client';

import React, {useEffect} from 'react';
import {useOrder} from '@/contexts/orderContext';
import {useRouter} from 'next/navigation';
import Loading from '@/components/loading/loading';
import CustomButton from '@/components/customButtton/customButton';
import {ORDER_STATUS} from '@/constants';

const OrdersPage = () => {
  const {orders, orderIsLoading, fetchOrders} = useOrder();
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case ORDER_STATUS.COMPLETED:
        return 'bg-green-100 text-green-800';
      case ORDER_STATUS.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case ORDER_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ORDER_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (orderIsLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-5">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-primary p-6 rounded-lg shadow text-center">
          <p className="text-xl mb-4">You haven't placed any orders yet</p>
          <CustomButton
            buttonText="Start Shopping"
            onClick={() => router.push('/products/catalog')}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div
              key={order.id}
              className="bg-primary p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Order #{order.id}</h2>
                  <p className="text-gray-600">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      order.status,
                    )}`}>
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="border-t border-b py-4 my-4">
                <p className="font-medium">Items:</p>
                <ul className="mt-2 space-y-2">
                  {order.items.map(item => (
                    <li key={item.id} className="flex justify-between">
                      <span>
                        {item.product.name} x {item.quantity}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">Total: ${order.total.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">
                    Payment: {order.paymentMethod}
                  </p>
                </div>
                <CustomButton
                  buttonText="View Details"
                  onClick={() => router.push(`/orders/${order.id}`)}
                  backgroundColor="accent"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
