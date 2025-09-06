'use client';

import React, {useEffect} from 'react';
import {useOrder} from '@/contexts/orderContext';
import {useRouter} from 'next/navigation';
import Loading from '@/components/loading/loading';
import CustomButton from '@/components/customButtton/customButton';
import Image from 'next/image';

import {OrderDetailsProps} from '@/interfaces/checkout';
import {ORDER_STATUS} from '@/constants';

const OrderDetailsPage = ({params}: OrderDetailsProps) => {
  const {currentOrder, orderIsLoading, fetchOrderById} = useOrder();
  const router = useRouter();
  const [orderId, setOrderId] = React.useState<number | null>(null);

  React.useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      const id = parseInt(resolvedParams.id);
      setOrderId(id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (orderId !== null && !isNaN(orderId)) {
      fetchOrderById(orderId);
    } else if (orderId !== null) {
      router.push('/orders');
    }
  }, [orderId, fetchOrderById, router]);

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
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

  if (orderIsLoading || !currentOrder) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-5">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => router.push('/orders')}
          className="mr-4 text-secondary hover:underline flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Orders
        </button>
        <h1 className="text-3xl font-bold">Order #{currentOrder.id}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-primary p-6 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Order Details</h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  currentOrder.status,
                )}`}>
                {currentOrder.status.charAt(0).toUpperCase() +
                  currentOrder.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Order Date:</p>
                <p className="font-medium">
                  {formatDate(currentOrder.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Payment Method:</p>
                <p className="font-medium">
                  {currentOrder.paymentMethod
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Payment Status:</p>
                <p className="font-medium">
                  {currentOrder.paymentStatus.charAt(0).toUpperCase() +
                    currentOrder.paymentStatus.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Amount:</p>
                <p className="font-medium">${currentOrder.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-primary p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold mb-4">Items</h2>
            <div className="space-y-4">
              {currentOrder.items.map(item => (
                <div
                  key={item.id}
                  className="flex flex-col md:flex-row items-start md:items-center py-4 border-b last:border-b-0">
                  <div className="flex-shrink-0 w-20 h-20 relative mb-2 md:mb-0 md:mr-4">
                    <Image
                      src={item.product.image || '/placeholder.svg'}
                      alt={item.product.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-sm text-gray-600">
                      Price: ${item.price.toFixed(2)} each
                    </p>
                  </div>
                  <div className="font-bold mt-2 md:mt-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-primary p-6 rounded-lg shadow sticky top-4">
            <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
            <p className="whitespace-pre-line">
              {currentOrder.shippingAddress}
            </p>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${currentOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>${currentOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <CustomButton
                buttonText="Continue Shopping"
                onClick={() => router.push('/')}
                backgroundColor="accent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
