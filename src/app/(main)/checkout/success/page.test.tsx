import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {vi} from 'vitest';
import CheckoutSuccessPage from './page';

const mockPush = vi.fn();
const mockGet = vi.fn();
const mockNotify = vi.fn();

const mockOrderDetails = {
  id: 'order-123',
  createdAt: '2024-01-15T10:30:00Z',
  paymentStatus: 'paid',
  total: 220.0,
  shippingAddress: 'John Doe, 123 Main St, New York, NY, 10001, United States',
  items: [
    {
      id: 'item-1',
      productName: 'Test Product 1',
      quantity: 2,
      price: 100.0,
    },
    {
      id: 'item-2',
      productName: 'Test Product 2',
      quantity: 1,
      price: 20.0,
    },
  ],
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

vi.mock('@/contexts/notificationContext', () => ({
  useNotification: () => ({
    notify: mockNotify,
  }),
}));

vi.mock('@/components/pageContainer/pageContainer', () => ({
  default: vi.fn(({children, isLoading, loadingMessage}) => (
    <div data-testid="page-container">
      {isLoading ? <div data-testid="loading">{loadingMessage}</div> : children}
    </div>
  )),
  ErrorState: vi.fn(({title, message, onRetry}) => (
    <div data-testid="error-state">
      <h2>{title}</h2>
      <p>{message}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  )),
}));

global.fetch = vi.fn();

describe('CheckoutSuccessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockGet.mockReturnValue('session_123');
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<CheckoutSuccessPage />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Verifying your payment...')).toBeInTheDocument();
  });

  it('shows error when no session ID is provided', async () => {
    mockGet.mockReturnValue(null);

    render(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(
        screen.getByText('Payment Verification Failed'),
      ).toBeInTheDocument();
      expect(screen.getByText('No session ID found')).toBeInTheDocument();
    });
  });

  it('handles successful payment verification', async () => {
    mockGet.mockReturnValue('session_123');
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({order: mockOrderDetails}),
    } as Response);

    render(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    });

    expect(mockNotify).toHaveBeenCalledWith({
      type: 'success',
      msg: 'Payment successful! Your order has been confirmed.',
    });

    expect(screen.getByText('order-123')).toBeInTheDocument();
    expect(screen.getByText('1/15/2024')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
    expect(screen.getByText('$220.00')).toBeInTheDocument();
    expect(
      screen.getByText(
        'John Doe, 123 Main St, New York, NY, 10001, United States',
      ),
    ).toBeInTheDocument();
  });

  it('displays order items correctly', async () => {
    mockGet.mockReturnValue('session_123');
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({order: mockOrderDetails}),
    } as Response);

    render(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByText('Items Ordered')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();

    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    expect(screen.getByText('Quantity: 1')).toBeInTheDocument();
    expect(screen.getByText('$20.00')).toBeInTheDocument();
  });

  it('handles payment verification error', async () => {
    mockGet.mockReturnValue('session_123');
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({error: 'Payment verification failed'}),
    } as Response);

    render(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(
        screen.getByText('Payment verification failed'),
      ).toBeInTheDocument();
    });

    expect(mockNotify).toHaveBeenCalledWith({
      type: 'error',
      msg: 'There was an issue verifying your payment. Please contact support.',
    });
  });

  it('handles network error during payment verification', async () => {
    mockGet.mockReturnValue('session_123');
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    expect(mockNotify).toHaveBeenCalledWith({
      type: 'error',
      msg: 'There was an issue verifying your payment. Please contact support.',
    });
  });

  it('navigates to orders page when view all orders button is clicked', async () => {
    mockGet.mockReturnValue('session_123');
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({order: mockOrderDetails}),
    } as Response);

    render(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByText('View All Orders')).toBeInTheDocument();
    });

    const viewOrdersButton = screen.getByText('View All Orders');
    fireEvent.click(viewOrdersButton);

    expect(mockPush).toHaveBeenCalledWith('/orders');
  });

  it('navigates to home when continue shopping button is clicked', async () => {
    mockGet.mockReturnValue('session_123');
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({order: mockOrderDetails}),
    } as Response);

    render(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
    });

    const continueShoppingButton = screen.getByText('Continue Shopping');
    fireEvent.click(continueShoppingButton);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('makes correct API call to verify payment', async () => {
    mockGet.mockReturnValue('session_123');
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({order: mockOrderDetails}),
    } as Response);

    render(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({sessionId: 'session_123'}),
      });
    });
  });

  it('handles retry from error state', async () => {
    mockGet.mockReturnValue(null);

    render(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    expect(mockPush).toHaveBeenCalledWith('/checkout');
  });

  it('renders success icon correctly', async () => {
    mockGet.mockReturnValue('session_123');
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({order: mockOrderDetails}),
    } as Response);

    render(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    });

    const successIcon = document.querySelector('svg');
    expect(successIcon).toBeInTheDocument();
    expect(successIcon).toHaveClass('w-8', 'h-8', 'text-green-600');
  });

  it('shows no order details message when order details are null', async () => {
    mockGet.mockReturnValue('session_123');
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({order: null}),
    } as Response);

    render(<CheckoutSuccessPage />);

    await waitFor(() => {
      expect(screen.getByText('No order details found.')).toBeInTheDocument();
    });
  });
});
