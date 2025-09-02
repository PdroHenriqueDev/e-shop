'use client';
import {useState} from 'react';
import {useCart} from '@/contexts/cartContext';
import {useOrder} from '@/contexts/orderContext';
import {useNotification} from '@/contexts/notificationContext';
import {useRouter} from 'next/navigation';
import CustomButton from '@/components/customButtton/customButton';
import Loading from '@/components/loading/loading';

type CheckoutStep = 'shipping' | 'payment' | 'review';

export default function Checkout() {
  const {cartItems, cartIsLoading, handleSetCartItems} = useCart();
  const {placeOrder, orderIsLoading} = useOrder();
  const {notify} = useNotification();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  });

  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');

  const orderTotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep('payment');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep('review');
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      notify({
        type: 'error',
        msg: 'Your cart is empty',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedAddress = `${shippingAddress.fullName}, ${shippingAddress.addressLine1}, ${shippingAddress.addressLine2 ? shippingAddress.addressLine2 + ', ' : ''}${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.postalCode}, ${shippingAddress.country}`;

      const order = await placeOrder(
        formattedAddress,
        'stripe',
        orderTotal + orderTotal * 0.1,
      );

      if (order) {
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: order.id,
            successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/checkout/cancel`,
          }),
        });

        const data = await response.json();

        if (response.ok && data.url) {
          handleSetCartItems([]);

          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'Failed to create checkout session');
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      notify({
        type: 'error',
        msg:
          error instanceof Error
            ? error.message
            : 'Failed to process payment. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (cartIsLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <Loading />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto py-12 px-5">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <div className="bg-primary p-6 rounded-lg shadow">
          <p className="text-xl mb-4">Your cart is empty</p>
          <CustomButton
            buttonText="Continue Shopping"
            onClick={() => router.push('/')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-5">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <div className="flex mb-8 border-b pb-4">
        <div
          className={`flex-1 text-center pb-2 ${currentStep === 'shipping' ? 'border-b-2 border-secondary font-bold' : ''}`}>
          1. Shipping
        </div>
        <div
          className={`flex-1 text-center pb-2 ${currentStep === 'payment' ? 'border-b-2 border-secondary font-bold' : ''}`}>
          2. Payment
        </div>
        <div
          className={`flex-1 text-center pb-2 ${currentStep === 'review' ? 'border-b-2 border-secondary font-bold' : ''}`}>
          3. Review & Place Order
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {currentStep === 'shipping' && (
            <div className="bg-primary p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
              <form onSubmit={handleShippingSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={shippingAddress.fullName}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={shippingAddress.addressLine1}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={shippingAddress.addressLine2}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      State/Province
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={shippingAddress.postalCode}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <CustomButton
                    buttonText="Continue to Payment"
                    type="submit"
                  />
                </div>
              </form>
            </div>
          )}

          {currentStep === 'payment' && (
            <div className="bg-primary p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>
              <form onSubmit={handlePaymentSubmit}>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit_card"
                      checked={paymentMethod === 'credit_card'}
                      onChange={() => setPaymentMethod('credit_card')}
                      className="mr-2"
                    />
                    Credit Card
                  </label>
                </div>

                {paymentMethod === 'credit_card' && (
                  <div className="mt-4 p-4 border rounded bg-blue-50">
                    <div className="flex items-center mb-3">
                      <svg
                        className="w-6 h-6 text-blue-600 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium text-blue-800">
                        Secure Payment with Stripe
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mb-2">
                      You will be redirected to Stripe's secure checkout page to
                      complete your payment.
                    </p>
                    <p className="text-xs text-blue-600">
                      Stripe supports all major credit cards and ensures your
                      payment information is secure.
                    </p>
                  </div>
                )}

                <div className="mt-6 flex justify-between gap-4">
                  <CustomButton
                    buttonText="Back to Shipping"
                    onClick={() => setCurrentStep('shipping')}
                    backgroundColor="accent"
                  />
                  <CustomButton buttonText="Continue to Review" type="submit" />
                </div>
              </form>
            </div>
          )}

          {currentStep === 'review' && (
            <div className="bg-primary p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Review Your Order</h2>

              <div className="mb-6">
                <h3 className="font-bold mb-2">Shipping Address</h3>
                <p>
                  {shippingAddress.fullName}
                  <br />
                  {shippingAddress.addressLine1}
                  <br />
                  {shippingAddress.addressLine2 && (
                    <>
                      {shippingAddress.addressLine2}
                      <br />
                    </>
                  )}
                  {shippingAddress.city}, {shippingAddress.state}{' '}
                  {shippingAddress.postalCode}
                  <br />
                  {shippingAddress.country}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="font-bold mb-2">Payment Method</h3>
                <p>Stripe Checkout (Credit Card)</p>
              </div>

              <div className="mb-6">
                <h3 className="font-bold mb-2">Order Items</h3>
                {cartItems.map(item => (
                  <div
                    key={item.productId}
                    className="flex justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between gap-4">
                <CustomButton
                  buttonText="Back to Payment"
                  onClick={() => setCurrentStep('payment')}
                  backgroundColor="accent"
                />
                <CustomButton
                  buttonText={
                    isSubmitting || orderIsLoading
                      ? 'Processing...'
                      : 'Place Order'
                  }
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting || orderIsLoading}
                />
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <div className="bg-primary p-6 rounded-lg shadow sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="mb-4">
              <div className="flex justify-between py-2 border-b">
                <span>Subtotal</span>
                <span>${orderTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Tax</span>
                <span>${(orderTotal * 0.1).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between py-2 font-bold">
              <span>Total</span>
              <span>${(orderTotal + orderTotal * 0.1).toFixed(2)}</span>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-600">
                By placing your order, you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
