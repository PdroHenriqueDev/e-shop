import {render, screen, fireEvent} from '@testing-library/react';
import {vi} from 'vitest';
import CheckoutCancelPage from './page';

const mockPush = vi.fn();
const mockNotify = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/contexts/notificationContext', () => ({
  useNotification: () => ({
    notify: mockNotify,
  }),
}));

describe('CheckoutCancelPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders checkout cancel page with correct content', () => {
    render(<CheckoutCancelPage />);

    expect(screen.getByText('Payment Cancelled')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your payment was cancelled. Don't worry, your cart items are still saved and you can complete your purchase anytime.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Return to Checkout')).toBeInTheDocument();
    expect(screen.getByText('View Cart')).toBeInTheDocument();
    expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
  });

  it('shows notification on component mount', () => {
    render(<CheckoutCancelPage />);

    expect(mockNotify).toHaveBeenCalledWith({
      type: 'info',
      msg: 'Payment was cancelled. Your cart items are still saved.',
    });
  });

  it('navigates to checkout when return to checkout button is clicked', () => {
    render(<CheckoutCancelPage />);

    const returnButton = screen.getByText('Return to Checkout');
    fireEvent.click(returnButton);

    expect(mockPush).toHaveBeenCalledWith('/checkout');
  });

  it('navigates to cart when view cart button is clicked', () => {
    render(<CheckoutCancelPage />);

    const viewCartButton = screen.getByText('View Cart');
    fireEvent.click(viewCartButton);

    expect(mockPush).toHaveBeenCalledWith('/cart');
  });

  it('navigates to home when continue shopping button is clicked', () => {
    render(<CheckoutCancelPage />);

    const continueShoppingButton = screen.getByText('Continue Shopping');
    fireEvent.click(continueShoppingButton);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('displays help section with contact information', () => {
    render(<CheckoutCancelPage />);

    expect(screen.getByText('Need Help?')).toBeInTheDocument();
    expect(
      screen.getByText(
        "If you're experiencing issues with payment or have questions about your order, we're here to help.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('support@eshop.com')).toBeInTheDocument();
    expect(screen.getByText('1-800-ESHOP-1')).toBeInTheDocument();
  });

  it('renders warning icon', () => {
    render(<CheckoutCancelPage />);

    const warningIcon = document.querySelector('svg');
    expect(warningIcon).toBeInTheDocument();
    expect(warningIcon).toHaveClass('w-8', 'h-8', 'text-yellow-600');
  });

  it('has correct styling classes', () => {
    render(<CheckoutCancelPage />);

    const mainContainer = document.querySelector('.min-h-screen');
    expect(mainContainer).toHaveClass('bg-gray-50', 'py-12');

    const returnButton = screen.getByText('Return to Checkout');
    expect(returnButton).toHaveClass(
      'w-full',
      'bg-blue-600',
      'text-white',
      'px-6',
      'py-3',
      'rounded-lg',
      'hover:bg-blue-700',
      'transition-colors',
      'font-medium',
    );

    const viewCartButton = screen.getByText('View Cart');
    expect(viewCartButton).toHaveClass(
      'w-full',
      'bg-gray-200',
      'text-gray-800',
      'px-6',
      'py-3',
      'rounded-lg',
      'hover:bg-gray-300',
      'transition-colors',
      'font-medium',
    );

    const continueShoppingButton = screen.getByText('Continue Shopping');
    expect(continueShoppingButton).toHaveClass(
      'w-full',
      'text-blue-600',
      'hover:text-blue-700',
      'transition-colors',
      'font-medium',
    );
  });

  it('renders with proper accessibility structure', () => {
    render(<CheckoutCancelPage />);

    const heading = screen.getByRole('heading', {name: 'Payment Cancelled'});
    expect(heading).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveTextContent('Return to Checkout');
    expect(buttons[1]).toHaveTextContent('View Cart');
    expect(buttons[2]).toHaveTextContent('Continue Shopping');
  });
});
