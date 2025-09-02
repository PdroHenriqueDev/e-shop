'use client';

import {useRouter} from 'next/navigation';
import {useEffect} from 'react';
import {useNotification} from '@/contexts/notificationContext';

export default function CheckoutCancelPage() {
  const router = useRouter();
  const {notify} = useNotification();

  useEffect(() => {
    notify({
      type: 'info',
      msg: 'Payment was cancelled. Your cart items are still saved.',
    });
  }, [notify]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Cancelled
          </h1>
          <p className="text-gray-600 mb-8">
            Your payment was cancelled. Don't worry, your cart items are still
            saved and you can complete your purchase anytime.
          </p>

          <div className="space-y-4">
            <button
              onClick={() => router.push('/checkout')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Return to Checkout
            </button>
            <button
              onClick={() => router.push('/cart')}
              className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              View Cart
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full text-blue-600 hover:text-blue-700 transition-colors font-medium">
              Continue Shopping
            </button>
          </div>
        </div>

        <div className="mt-12 p-4 bg-white rounded-lg shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-3">
            If you're experiencing issues with payment or have questions about
            your order, we're here to help.
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Email:</span> support@eshop.com
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Phone:</span> 1-800-ESHOP-1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
