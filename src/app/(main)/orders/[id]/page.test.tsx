import React from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import {useRouter} from 'next/navigation';
import {useOrder} from '@/contexts/orderContext';
import OrderDetailsPage from './page';
import {ORDER_STATUS} from '@/constants';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/contexts/orderContext', () => ({
  useOrder: vi.fn(),
}));

vi.mock('@/components/loading/loading', () => ({
  default: function MockLoading() {
    return <div data-testid="loading">Loading...</div>;
  },
}));

vi.mock('@/components/customButtton/customButton', () => ({
  default: function MockCustomButton({
    buttonText,
    onClick,
    backgroundColor,
  }: any) {
    return (
      <button
        data-testid="custom-button"
        data-background={backgroundColor}
        onClick={onClick}>
        {buttonText}
      </button>
    );
  },
}));

vi.mock('next/image', () => ({
  default: function MockImage({src, alt, ...props}: any) {
    return (
      <img src={src} alt={alt} data-testid="order-item-image" {...props} />
    );
  },
}));

const mockUseRouter = useRouter as ReturnType<typeof vi.fn>;
const mockUseOrder = useOrder as ReturnType<typeof vi.fn>;

const mockPush = vi.fn();
const mockFetchOrderById = vi.fn();

const mockOrder = {
  id: 1,
  createdAt: new Date('2024-01-15'),
  status: 'completed',
  total: 159.98,
  paymentMethod: 'credit_card',
  paymentStatus: 'paid',
  shippingAddress: '123 Main St\nAnytown, ST 12345',
  items: [
    {
      id: 1,
      quantity: 2,
      price: 59.99,
      product: {
        id: 1,
        name: 'Test Product 1',
        image: '/test-image-1.jpg',
      },
    },
    {
      id: 2,
      quantity: 1,
      price: 39.99,
      product: {
        id: 2,
        name: 'Test Product 2',
        image: '/test-image-2.jpg',
      },
    },
  ],
};

describe('OrderDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });
  });

  describe('Loading State', () => {
    it('renders loading component when orderIsLoading is true', () => {
      mockUseOrder.mockReturnValue({
        currentOrder: null,
        orderIsLoading: true,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('renders loading component when currentOrder is null', () => {
      mockUseOrder.mockReturnValue({
        currentOrder: null,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('Order Display', () => {
    beforeEach(() => {
      mockUseOrder.mockReturnValue({
        currentOrder: mockOrder,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });
    });

    it('renders order details correctly', async () => {
      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        expect(screen.getByText('Order #1')).toBeInTheDocument();
      });

      expect(screen.getByText('Order Details')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Credit Card')).toBeInTheDocument();
      expect(screen.getByText('Paid')).toBeInTheDocument();
      expect(screen.getAllByText('$159.98')).toHaveLength(3);
    });

    it('renders order items correctly', async () => {
      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 1')).toBeInTheDocument();
      expect(screen.getByText('Price: $59.99 each')).toBeInTheDocument();
      expect(screen.getByText('Price: $39.99 each')).toBeInTheDocument();
      expect(screen.getByText('$119.98')).toBeInTheDocument();
      expect(screen.getByText('$39.99')).toBeInTheDocument();
    });

    it('renders shipping address correctly', async () => {
      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      });

      expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
      expect(screen.getByText(/Anytown, ST 12345/)).toBeInTheDocument();
    });

    it('renders order summary correctly', async () => {
      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        expect(screen.getByText('Order Summary')).toBeInTheDocument();
      });

      expect(screen.getByText('Subtotal:')).toBeInTheDocument();
      expect(screen.getByText('Shipping:')).toBeInTheDocument();
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Total:')).toBeInTheDocument();
    });

    it('renders continue shopping button', async () => {
      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        expect(screen.getByTestId('custom-button')).toBeInTheDocument();
      });

      expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
    });
  });

  describe('Status Colors', () => {
    it('applies correct color for completed status', async () => {
      const completedOrder = {...mockOrder, status: 'completed'};
      mockUseOrder.mockReturnValue({
        currentOrder: completedOrder,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        const statusElement = screen.getByText('Completed');
        expect(statusElement).toHaveClass('bg-green-100', 'text-green-800');
      });
    });

    it('applies correct color for processing status', async () => {
      const processingOrder = {...mockOrder, status: ORDER_STATUS.PROCESSING};
      mockUseOrder.mockReturnValue({
        currentOrder: processingOrder,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        const statusElement = screen.getByText('Processing');
        expect(statusElement).toHaveClass('bg-blue-100', 'text-blue-800');
      });
    });

    it('applies correct color for pending status', async () => {
      const pendingOrder = {...mockOrder, status: ORDER_STATUS.PENDING};
      mockUseOrder.mockReturnValue({
        currentOrder: pendingOrder,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        const statusElement = screen.getByText('Pending');
        expect(statusElement).toHaveClass('bg-yellow-100', 'text-yellow-800');
      });
    });

    it('applies correct color for cancelled status', async () => {
      const cancelledOrder = {...mockOrder, status: ORDER_STATUS.CANCELLED};
      mockUseOrder.mockReturnValue({
        currentOrder: cancelledOrder,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        const statusElement = screen.getByText('Cancelled');
        expect(statusElement).toHaveClass('bg-red-100', 'text-red-800');
      });
    });

    it('applies default color for unknown status', async () => {
      const unknownOrder = {...mockOrder, status: 'unknown'};
      mockUseOrder.mockReturnValue({
        currentOrder: unknownOrder,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        const statusElement = screen.getByText('Unknown');
        expect(statusElement).toHaveClass('bg-gray-100', 'text-gray-800');
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockUseOrder.mockReturnValue({
        currentOrder: mockOrder,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });
    });

    it('navigates back to orders when back button is clicked', async () => {
      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        const backButton = screen.getByText('Back to Orders');
        backButton.click();
      });

      expect(mockPush).toHaveBeenCalledWith('/orders');
    });

    it('navigates to home when continue shopping is clicked', async () => {
      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        const continueButton = screen.getByTestId('custom-button');
        continueButton.click();
      });

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Parameter Handling', () => {
    it('fetches order by id when valid id is provided', async () => {
      mockUseOrder.mockReturnValue({
        currentOrder: mockOrder,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        expect(mockFetchOrderById).toHaveBeenCalledWith(1);
      });
    });

    it('redirects to orders page when invalid id is provided', async () => {
      mockUseOrder.mockReturnValue({
        currentOrder: null,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={Promise.resolve({id: 'invalid'})} />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/orders');
      });
    });

    it('handles async params correctly', async () => {
      const asyncParams = Promise.resolve({id: '2'});
      mockUseOrder.mockReturnValue({
        currentOrder: mockOrder,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={asyncParams} />);

      await waitFor(() => {
        expect(mockFetchOrderById).toHaveBeenCalledWith(2);
      });
    });
  });

  describe('Date Formatting', () => {
    it('formats date correctly', async () => {
      mockUseOrder.mockReturnValue({
        currentOrder: mockOrder,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        expect(screen.getByText(/January/)).toBeInTheDocument();
      });
    });
  });

  describe('Payment Method Formatting', () => {
    it('formats payment method correctly', async () => {
      const orderWithUnderscorePayment = {
        ...mockOrder,
        paymentMethod: 'debit_card',
      };
      mockUseOrder.mockReturnValue({
        currentOrder: orderWithUnderscorePayment,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        expect(screen.getByText('Debit Card')).toBeInTheDocument();
      });
    });
  });

  describe('Image Handling', () => {
    it('renders product images correctly', async () => {
      mockUseOrder.mockReturnValue({
        currentOrder: mockOrder,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        const images = screen.getAllByTestId('order-item-image');
        expect(images).toHaveLength(2);
        expect(images[0]).toHaveAttribute('src', '/test-image-1.jpg');
        expect(images[1]).toHaveAttribute('src', '/test-image-2.jpg');
      });
    });

    it('handles missing product images with placeholder', async () => {
      const orderWithoutImages = {
        ...mockOrder,
        items: [
          {
            ...mockOrder.items[0],
            product: {
              ...mockOrder.items[0].product,
              image: null,
            },
          },
        ],
      };
      mockUseOrder.mockReturnValue({
        currentOrder: orderWithoutImages,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        const image = screen.getByTestId('order-item-image');
        expect(image).toHaveAttribute('src', '/placeholder.svg');
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders responsive grid layout', async () => {
      mockUseOrder.mockReturnValue({
        currentOrder: mockOrder,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        const gridContainer = screen
          .getByText('Order Details')
          .closest('.bg-primary');
        expect(gridContainer).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      mockUseOrder.mockReturnValue({
        currentOrder: mockOrder,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
          'Order #1',
        );
        expect(
          screen.getByRole('heading', {name: 'Order Details'}),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('heading', {name: 'Items'}),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('heading', {name: 'Shipping Address'}),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('heading', {name: 'Order Summary'}),
        ).toBeInTheDocument();
      });
    });

    it('has accessible back button', async () => {
      mockUseOrder.mockReturnValue({
        currentOrder: mockOrder,
        orderIsLoading: false,
        fetchOrderById: mockFetchOrderById,
      });

      render(<OrderDetailsPage params={Promise.resolve({id: '1'})} />);

      await waitFor(() => {
        const backButton = screen.getByRole('button', {
          name: /back to orders/i,
        });
        expect(backButton).toBeInTheDocument();
      });
    });
  });
});
