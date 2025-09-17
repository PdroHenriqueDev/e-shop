import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {useRouter} from 'next/navigation';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import OrdersPage from './page';
import {useOrder} from '@/contexts/orderContext';
import {ORDER_STATUS} from '@/constants';

const mockPush = vi.fn();
const mockFetchOrders = vi.fn();

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

const mockUseRouter = useRouter as ReturnType<typeof vi.fn>;
const mockUseOrder = useOrder as ReturnType<typeof vi.fn>;

const mockOrders = [
  {
    id: '1',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    status: ORDER_STATUS.COMPLETED,
    total: 99.99,
    paymentMethod: 'Credit Card',
    items: [
      {
        id: '1',
        quantity: 2,
        price: 29.99,
        product: {
          name: 'Test Product 1',
        },
      },
      {
        id: '2',
        quantity: 1,
        price: 39.99,
        product: {
          name: 'Test Product 2',
        },
      },
    ],
  },
  {
    id: '2',
    createdAt: new Date('2024-02-20T14:45:00Z'),
    status: ORDER_STATUS.PROCESSING,
    total: 149.99,
    paymentMethod: 'PayPal',
    items: [
      {
        id: '3',
        quantity: 1,
        price: 149.99,
        product: {
          name: 'Expensive Product',
        },
      },
    ],
  },
];

describe('OrdersPage', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any);

    mockUseOrder.mockReturnValue({
      orders: [],
      orderIsLoading: false,
      fetchOrders: mockFetchOrders,
    });

    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading component when orderIsLoading is true', () => {
      mockUseOrder.mockReturnValue({
        orders: [],
        orderIsLoading: true,
        fetchOrders: mockFetchOrders,
      });

      render(<OrdersPage />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should center loading component on screen', () => {
      mockUseOrder.mockReturnValue({
        orders: [],
        orderIsLoading: true,
        fetchOrders: mockFetchOrders,
      });

      render(<OrdersPage />);

      const loadingContainer = screen.getByTestId('loading').parentElement;
      expect(loadingContainer).toHaveClass(
        'flex',
        'items-center',
        'justify-center',
        'w-full',
        'h-screen',
      );
    });
  });

  describe('Empty Orders State', () => {
    it('should render empty state when no orders exist', () => {
      render(<OrdersPage />);

      expect(screen.getByText('My Orders')).toBeInTheDocument();
      expect(
        screen.getByText("You haven't placed any orders yet"),
      ).toBeInTheDocument();
      expect(screen.getByText('Start Shopping')).toBeInTheDocument();
    });

    it('should navigate to catalog when Start Shopping button is clicked', () => {
      render(<OrdersPage />);

      const startShoppingButton = screen.getByText('Start Shopping');
      fireEvent.click(startShoppingButton);

      expect(mockPush).toHaveBeenCalledWith('/products/catalog');
    });
  });

  describe('Orders Display', () => {
    beforeEach(() => {
      mockUseOrder.mockReturnValue({
        orders: mockOrders,
        orderIsLoading: false,
        fetchOrders: mockFetchOrders,
      });
    });

    it('should render all orders', () => {
      render(<OrdersPage />);

      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.getByText('Order #2')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      render(<OrdersPage />);

      expect(
        screen.getByText('Placed on January 15, 2024'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Placed on February 20, 2024'),
      ).toBeInTheDocument();
    });

    it('should display order status with correct styling', () => {
      render(<OrdersPage />);

      const completedStatus = screen.getByText('Completed');
      const processingStatus = screen.getByText('Processing');

      expect(completedStatus).toHaveClass('bg-green-100', 'text-green-800');
      expect(processingStatus).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('should display order items correctly', () => {
      render(<OrdersPage />);

      expect(screen.getByText('Test Product 1 x 2')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2 x 1')).toBeInTheDocument();
      expect(screen.getByText('Expensive Product x 1')).toBeInTheDocument();
    });

    it('should calculate item totals correctly', () => {
      render(<OrdersPage />);

      expect(screen.getByText('$59.98')).toBeInTheDocument();
      expect(screen.getByText('$39.99')).toBeInTheDocument();
      expect(screen.getByText('$149.99')).toBeInTheDocument();
    });

    it('should display order totals', () => {
      render(<OrdersPage />);

      expect(screen.getByText('Total: $99.99')).toBeInTheDocument();
      expect(screen.getByText('Total: $149.99')).toBeInTheDocument();
    });

    it('should display payment methods', () => {
      render(<OrdersPage />);

      expect(screen.getByText('Payment: Credit Card')).toBeInTheDocument();
      expect(screen.getByText('Payment: PayPal')).toBeInTheDocument();
    });

    it('should navigate to order details when View Details is clicked', () => {
      render(<OrdersPage />);

      const viewDetailsButtons = screen.getAllByText('View Details');
      fireEvent.click(viewDetailsButtons[0]);

      expect(mockPush).toHaveBeenCalledWith('/orders/1');
    });

    it('should set correct background color for View Details button', () => {
      render(<OrdersPage />);

      const viewDetailsButtons = screen.getAllByTestId('custom-button');
      expect(viewDetailsButtons[0]).toHaveAttribute(
        'data-background',
        'accent',
      );
    });
  });

  describe('Status Color Function', () => {
    it('should return correct colors for all order statuses', () => {
      const testCases = [
        {
          status: ORDER_STATUS.PENDING,
          orders: [
            {
              ...mockOrders[0],
              status: ORDER_STATUS.PENDING,
            },
          ],
          expectedClass: 'bg-yellow-100 text-yellow-800',
        },
        {
          status: ORDER_STATUS.CANCELLED,
          orders: [
            {
              ...mockOrders[0],
              status: ORDER_STATUS.CANCELLED,
            },
          ],
          expectedClass: 'bg-red-100 text-red-800',
        },
      ];

      testCases.forEach(({orders, expectedClass}) => {
        mockUseOrder.mockReturnValue({
          orders,
          orderIsLoading: false,
          fetchOrders: mockFetchOrders,
        });

        const {unmount} = render(<OrdersPage />);
        const statusElement = screen.getByText(
          orders[0].status.charAt(0).toUpperCase() + orders[0].status.slice(1),
        );
        expect(statusElement).toHaveClass(...expectedClass.split(' '));
        unmount();
      });
    });

    it('should return default color for unknown status', () => {
      const ordersWithUnknownStatus = [
        {
          ...mockOrders[0],
          status: 'unknown',
        },
      ];

      mockUseOrder.mockReturnValue({
        orders: ordersWithUnknownStatus,
        orderIsLoading: false,
        fetchOrders: mockFetchOrders,
      });

      render(<OrdersPage />);

      const statusElement = screen.getByText('Unknown');
      expect(statusElement).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('useEffect Hook', () => {
    it('should call fetchOrders on component mount', () => {
      render(<OrdersPage />);

      expect(mockFetchOrders).toHaveBeenCalledTimes(1);
    });

    it('should call fetchOrders when fetchOrders dependency changes', async () => {
      const {rerender} = render(<OrdersPage />);

      expect(mockFetchOrders).toHaveBeenCalledTimes(1);

      const newFetchOrders = vi.fn();
      mockUseOrder.mockReturnValue({
        orders: [],
        orderIsLoading: false,
        fetchOrders: newFetchOrders,
      });

      rerender(<OrdersPage />);

      await waitFor(() => {
        expect(newFetchOrders).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Date Formatting', () => {
    it('should handle different date formats correctly', () => {
      const ordersWithDifferentDates = [
        {
          ...mockOrders[0],
          createdAt: new Date('2023-12-01T00:00:00Z'),
        },
        {
          ...mockOrders[0],
          id: '3',
          createdAt: new Date('2024-06-15T23:59:59Z'),
        },
      ];

      mockUseOrder.mockReturnValue({
        orders: ordersWithDifferentDates,
        orderIsLoading: false,
        fetchOrders: mockFetchOrders,
      });

      render(<OrdersPage />);

      expect(screen.getAllByText(/Placed on/)).toHaveLength(2);
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive classes to order header', () => {
      mockUseOrder.mockReturnValue({
        orders: mockOrders,
        orderIsLoading: false,
        fetchOrders: mockFetchOrders,
      });

      render(<OrdersPage />);

      const orderHeaders = screen.getAllByText(/Order #/);
      orderHeaders.forEach(header => {
        const headerContainer = header.closest('.flex');
        expect(headerContainer).toHaveClass(
          'flex',
          'flex-col',
          'md:flex-row',
          'justify-between',
        );
      });
    });

    it('should apply responsive margin classes to status badges', () => {
      mockUseOrder.mockReturnValue({
        orders: mockOrders,
        orderIsLoading: false,
        fetchOrders: mockFetchOrders,
      });

      render(<OrdersPage />);

      const statusContainers = screen
        .getAllByText('Completed')
        .map(el => el.parentElement);
      statusContainers.forEach(container => {
        expect(container).toHaveClass('mt-2', 'md:mt-0');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<OrdersPage />);

      expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
        'My Orders',
      );
    });

    it('should have proper heading hierarchy for orders', () => {
      mockUseOrder.mockReturnValue({
        orders: mockOrders,
        orderIsLoading: false,
        fetchOrders: mockFetchOrders,
      });

      render(<OrdersPage />);

      const orderHeadings = screen.getAllByRole('heading', {level: 2});
      expect(orderHeadings).toHaveLength(2);
      expect(orderHeadings[0]).toHaveTextContent('Order #1');
      expect(orderHeadings[1]).toHaveTextContent('Order #2');
    });
  });
});
