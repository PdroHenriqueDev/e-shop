import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {OrderProvider, useOrder} from './orderContext';
import {useNotification} from './notificationContext';
import axios from '@/lib/axios';
import {OrderProps} from '@/interfaces/order';

vi.mock('./notificationContext');
vi.mock('@/lib/axios');

const mockNotify = vi.fn();
const mockAxios = axios as any;

const TestComponent = () => {
  const {
    orders,
    currentOrder,
    orderIsLoading,
    placeOrder,
    fetchOrders,
    fetchOrderById,
    updateOrderPaymentStatus,
    verifyStripePayment,
  } = useOrder();

  const mockOrder: OrderProps = {
    id: 1,
    userId: 1,
    total: 99.99,
    status: 'pending',
    shippingAddress: '123 Test St',
    paymentMethod: 'credit_card',
    paymentStatus: 'pending',
    stripeSessionId: 'sess_123',
    paymentIntentId: 'pi_123',
    items: [],
    createdAt: '2024-01-01T00:00:00Z' as any,
    updatedAt: '2024-01-01T00:00:00Z' as any,
  };

  return (
    <div>
      <div data-testid="orders-count">{orders.length}</div>
      <div data-testid="current-order-id">
        {currentOrder ? currentOrder.id : 'none'}
      </div>
      <div data-testid="loading-state">
        {orderIsLoading ? 'loading' : 'idle'}
      </div>
      <button
        data-testid="place-order"
        onClick={() => placeOrder('123 Test St', 'credit_card', 99.99)}>
        Place Order
      </button>
      <button data-testid="fetch-orders" onClick={() => fetchOrders()}>
        Fetch Orders
      </button>
      <button data-testid="fetch-order-by-id" onClick={() => fetchOrderById(1)}>
        Fetch Order By ID
      </button>
      <button
        data-testid="update-payment-status"
        onClick={() =>
          updateOrderPaymentStatus(1, 'completed', 'sess_123', 'pi_123')
        }>
        Update Payment Status
      </button>
      <button
        data-testid="verify-stripe-payment"
        onClick={() => verifyStripePayment('sess_123')}>
        Verify Stripe Payment
      </button>
      {orders.map(order => (
        <div key={order.id} data-testid={`order-${order.id}`}>
          Order {order.id} - Status: {order.status}
        </div>
      ))}
    </div>
  );
};

const TestComponentWithoutProvider = () => {
  const order = useOrder();
  return <div>{order.orders.length}</div>;
};

describe('OrderContext', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    (useNotification as any).mockReturnValue({
      notify: mockNotify,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('OrderProvider', () => {
    it('should provide order context to children', () => {
      render(
        <OrderProvider>
          <TestComponent />
        </OrderProvider>,
      );

      expect(screen.getByTestId('orders-count')).toHaveTextContent('0');
      expect(screen.getByTestId('current-order-id')).toHaveTextContent('none');
      expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
    });

    it('should throw error when useOrder is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponentWithoutProvider />);
      }).toThrow('useOrder must be used within an OrderProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('placeOrder', () => {
    it('should place order successfully', async () => {
      const mockOrderResponse = {
        id: 1,
        userId: 1,
        total: 99.99,
        status: 'pending',
        shippingAddress: '123 Test St',
        paymentMethod: 'credit_card',
        paymentStatus: 'pending',
        items: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockAxios.post.mockResolvedValueOnce({data: mockOrderResponse});

      render(
        <OrderProvider>
          <TestComponent />
        </OrderProvider>,
      );

      await user.click(screen.getByTestId('place-order'));

      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith('/api/orders', {
          shippingAddress: '123 Test St',
          paymentMethod: 'credit_card',
          total: 99.99,
        });
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'success',
          msg: 'Order placed successfully!',
        });
      });

      expect(screen.getByTestId('current-order-id')).toHaveTextContent('1');
    });

    it('should handle place order error', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Network error'));

      render(
        <OrderProvider>
          <TestComponent />
        </OrderProvider>,
      );

      await user.click(screen.getByTestId('place-order'));

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'error',
          msg: 'Failed to place order. Please try again.',
        });
      });

      expect(screen.getByTestId('current-order-id')).toHaveTextContent('none');

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
      });
    });

    it('should show loading state during place order', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockAxios.post.mockReturnValueOnce(promise);

      render(
        <OrderProvider>
          <TestComponent />
        </OrderProvider>,
      );

      await user.click(screen.getByTestId('place-order'));

      expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');

      resolvePromise!({data: {}});

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
      });
    });
  });

  describe('fetchOrders', () => {
    it('should fetch orders successfully', async () => {
      const mockOrdersResponse = [
        {
          id: 1,
          userId: 1,
          total: 99.99,
          status: 'completed',
          shippingAddress: '123 Test St',
          paymentMethod: 'credit_card',
          paymentStatus: 'completed',
          items: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          userId: 1,
          total: 149.99,
          status: 'pending',
          shippingAddress: '456 Test Ave',
          paymentMethod: 'paypal',
          paymentStatus: 'pending',
          items: [],
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      ];

      mockAxios.get.mockResolvedValueOnce({data: mockOrdersResponse});

      render(
        <OrderProvider>
          <TestComponent />
        </OrderProvider>,
      );

      await user.click(screen.getByTestId('fetch-orders'));

      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith('/api/orders');
      });

      expect(screen.getByTestId('orders-count')).toHaveTextContent('2');
      expect(screen.getByTestId('order-1')).toHaveTextContent(
        'Order 1 - Status: completed',
      );
      expect(screen.getByTestId('order-2')).toHaveTextContent(
        'Order 2 - Status: pending',
      );
    });

    it('should handle fetch orders error', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockAxios.get.mockRejectedValueOnce(new Error('Network error'));

      render(
        <OrderProvider>
          <TestComponent />
        </OrderProvider>,
      );

      await user.click(screen.getByTestId('fetch-orders'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error fetching orders:',
          expect.any(Error),
        );
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'error',
          msg: 'Failed to fetch orders',
        });
      });

      consoleSpy.mockRestore();
    });
  });

  describe('fetchOrderById', () => {
    it('should fetch order by id successfully', async () => {
      const mockOrderResponse = {
        id: 1,
        userId: 1,
        total: 99.99,
        status: 'completed',
        shippingAddress: '123 Test St',
        paymentMethod: 'credit_card',
        paymentStatus: 'completed',
        items: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockAxios.get.mockResolvedValueOnce({data: mockOrderResponse});

      render(
        <OrderProvider>
          <TestComponent />
        </OrderProvider>,
      );

      await user.click(screen.getByTestId('fetch-order-by-id'));

      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith('/api/orders/1');
      });

      expect(screen.getByTestId('current-order-id')).toHaveTextContent('1');
    });

    it('should handle fetch order by id error', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockAxios.get.mockRejectedValueOnce(new Error('Network error'));

      render(
        <OrderProvider>
          <TestComponent />
        </OrderProvider>,
      );

      await user.click(screen.getByTestId('fetch-order-by-id'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error fetching order 1:',
          expect.any(Error),
        );
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'error',
          msg: 'Failed to fetch order details',
        });
      });

      consoleSpy.mockRestore();
    });
  });

  describe('updateOrderPaymentStatus', () => {
    it('should update order payment status successfully', async () => {
      const mockCurrentOrder = {
        id: 1,
        userId: 1,
        total: 99.99,
        status: 'pending',
        shippingAddress: '123 Test St',
        paymentMethod: 'credit_card',
        paymentStatus: 'pending',
        stripeSessionId: 'sess_123',
        paymentIntentId: 'pi_123',
        items: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockUpdatedOrder = {
        ...mockCurrentOrder,
        status: 'completed',
        paymentStatus: 'completed',
      };

      mockAxios.get.mockResolvedValueOnce({data: [mockCurrentOrder]});
      mockAxios.get.mockResolvedValueOnce({data: mockCurrentOrder});
      mockAxios.patch.mockResolvedValueOnce({data: mockUpdatedOrder});

      render(
        <OrderProvider>
          <TestComponent />
        </OrderProvider>,
      );

      await user.click(screen.getByTestId('fetch-orders'));
      await waitFor(() => {
        expect(screen.getByTestId('orders-count')).toHaveTextContent('1');
      });

      await user.click(screen.getByTestId('fetch-order-by-id'));
      await waitFor(() => {
        expect(screen.getByTestId('current-order-id')).toHaveTextContent('1');
      });

      await user.click(screen.getByTestId('update-payment-status'));

      await waitFor(() => {
        expect(mockAxios.patch).toHaveBeenCalledWith('/api/orders/1', {
          paymentStatus: 'completed',
          stripeSessionId: 'sess_123',
          paymentIntentId: 'pi_123',
        });
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'success',
          msg: 'Order payment status updated successfully!',
        });
      });
    });

    it('should handle update payment status error', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockAxios.patch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <OrderProvider>
          <TestComponent />
        </OrderProvider>,
      );

      await user.click(screen.getByTestId('update-payment-status'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error updating order payment status:',
          expect.any(Error),
        );
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'error',
          msg: 'Failed to update payment status',
        });
      });

      consoleSpy.mockRestore();
    });

    it('should update payment status when currentOrder is null', async () => {
      const mockOrder = {
        id: 2,
        userId: 1,
        total: 149.99,
        status: 'pending',
        shippingAddress: '456 Test Ave',
        paymentMethod: 'credit_card',
        paymentStatus: 'completed',
        stripeSessionId: 'sess_456',
        paymentIntentId: 'pi_456',
        items: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockAxios.patch.mockResolvedValueOnce({data: mockOrder});

      render(
        <OrderProvider>
          <TestComponent />
        </OrderProvider>,
      );

      await user.click(screen.getByTestId('update-payment-status'));

      await waitFor(() => {
        expect(mockAxios.patch).toHaveBeenCalledWith('/api/orders/1', {
          paymentStatus: 'completed',
          stripeSessionId: 'sess_123',
          paymentIntentId: 'pi_123',
        });
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'success',
          msg: 'Order payment status updated successfully!',
        });
      });
    });
  });

  describe('verifyStripePayment', () => {
    it('should verify Stripe payment successfully', async () => {
      const mockExistingOrder = {
        id: 1,
        userId: 1,
        total: 99.99,
        status: 'pending',
        shippingAddress: '123 Test St',
        paymentMethod: 'credit_card',
        paymentStatus: 'pending',
        stripeSessionId: 'sess_123',
        items: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockVerifyResponse = {
        order: {
          ...mockExistingOrder,
          status: 'completed',
          paymentStatus: 'completed',
        },
      };

      mockAxios.get.mockResolvedValueOnce({data: [mockExistingOrder]});
      mockAxios.post.mockResolvedValueOnce({data: mockVerifyResponse});

      render(
        <OrderProvider>
          <TestComponent />
        </OrderProvider>,
      );

      await user.click(screen.getByTestId('fetch-orders'));
      await waitFor(() => {
        expect(screen.getByTestId('orders-count')).toHaveTextContent('1');
      });

      await user.click(screen.getByTestId('verify-stripe-payment'));

      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith(
          '/api/stripe/verify-session',
          {
            sessionId: 'sess_123',
          },
        );
      });

      expect(screen.getByTestId('current-order-id')).toHaveTextContent('1');
    });

    it('should handle verify Stripe payment error', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockAxios.post.mockRejectedValueOnce(new Error('Network error'));

      render(
        <OrderProvider>
          <TestComponent />
        </OrderProvider>,
      );

      await user.click(screen.getByTestId('verify-stripe-payment'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error verifying Stripe payment:',
          expect.any(Error),
        );
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'error',
          msg: 'Failed to verify payment status',
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
      });

      consoleSpy.mockRestore();
    });
  });
});
