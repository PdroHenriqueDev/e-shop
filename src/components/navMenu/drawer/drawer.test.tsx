import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartDrawer from './drawer';

// Mock dependencies
vi.mock('@/contexts/cartContext', () => ({
  useCart: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/components/customButtton/customButton', () => ({
  default: ({buttonText, onClick, disabled}: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="custom-button">
      {buttonText}
    </button>
  ),
}));

vi.mock('antd', () => {
  const ListItem = ({children, actions}: any) => (
    <div data-testid="list-item">
      {children}
      <div data-testid="list-actions">
        {actions?.map((action: any, index: number) => (
          <div key={index} data-testid={`action-${index}`}>
            {action}
          </div>
        ))}
      </div>
    </div>
  );

  ListItem.Meta = ({title, description}: any) => (
    <div data-testid="list-meta">
      <div data-testid="meta-title">{title}</div>
      <div data-testid="meta-description">{description}</div>
    </div>
  );

  const List = ({dataSource, renderItem}: any) => (
    <div data-testid="list">
      {dataSource?.map((item: any, index: number) => (
        <div key={index} data-testid={`list-item-${index}`}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );

  List.Item = ListItem;

  return {
    Drawer: ({children, open, onClose, title}: any) => (
      open ? (
        <div data-testid="drawer">
          <div data-testid="drawer-title">{title}</div>
          <button onClick={onClose} data-testid="close-drawer">
            Close
          </button>
          {children}
        </div>
      ) : null
    ),
    List,
    Badge: ({children, count}: any) => (
      <div data-testid="badge" data-count={count}>
        {children}
      </div>
    ),
    Divider: () => <div data-testid="divider" />,
  };
});

vi.mock('@ant-design/icons', () => ({
  ShoppingCartOutlined: (props: any) => (
    <div data-testid="cart-icon" onClick={props.onClick} className={props.className} />
  ),
  DeleteOutlined: (props: any) => (
    <div data-testid="delete-icon" onClick={props.onClick} className={props.className} />
  ),
}));

// Import mocked modules
import {useCart} from '@/contexts/cartContext';
import {useRouter} from 'next/navigation';

const mockCartItems = [
  {
    cartId: 1,
    cartItemId: 1,
    productId: 1,
    quantity: 2,
    product: {
      id: 1,
      name: 'Test Product 1',
      price: 99.99,
      description: 'Test description',
      image: 'test-image.jpg',
      createdAt: '2024-01-01T00:00:00Z',
    },
  },
  {
    cartId: 2,
    cartItemId: 2,
    productId: 2,
    quantity: 1,
    product: {
      id: 2,
      name: 'Test Product 2',
      price: 149.99,
      description: 'Test description 2',
      image: 'test-image-2.jpg',
      createdAt: '2024-01-01T00:00:00Z',
    },
  },
];

describe('CartDrawer', () => {
  const mockPush = vi.fn();
  const mockRemoveFromCart = vi.fn();
  const mockUpdateCartQuantity = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
    
    (useCart as any).mockReturnValue({
      cartItems: [],
      removeFromCart: mockRemoveFromCart,
      cartIsLoading: false,
      updateCartQuantity: mockUpdateCartQuantity,
    });
  });

  it('renders cart icon with badge', () => {
    (useCart as any).mockReturnValue({
      cartItems: mockCartItems,
      removeFromCart: mockRemoveFromCart,
      cartIsLoading: false,
      updateCartQuantity: mockUpdateCartQuantity,
    });

    render(<CartDrawer />);
    
    expect(screen.getByTestId('badge')).toBeInTheDocument();
    expect(screen.getByTestId('cart-icon')).toBeInTheDocument();
    expect(screen.getByTestId('badge')).toHaveAttribute('data-count', '2');
  });

  it('opens drawer when cart icon is clicked', async () => {
    render(<CartDrawer />);
    
    const cartIcon = screen.getByTestId('cart-icon');
    await user.click(cartIcon);
    
    expect(screen.getByTestId('drawer')).toBeInTheDocument();
    expect(screen.getByTestId('drawer-title')).toHaveTextContent('Shopping Cart');
  });

  it('closes drawer when close button is clicked', async () => {
    render(<CartDrawer />);
    
    // Open drawer
    const cartIcon = screen.getByTestId('cart-icon');
    await user.click(cartIcon);
    
    expect(screen.getByTestId('drawer')).toBeInTheDocument();
    
    // Close drawer
    const closeButton = screen.getByTestId('close-drawer');
    await user.click(closeButton);
    
    expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
  });

  it('displays empty cart message when no items', async () => {
    render(<CartDrawer />);
    
    const cartIcon = screen.getByTestId('cart-icon');
    await user.click(cartIcon);
    
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByText('Browse Products')).toBeInTheDocument();
  });

  it('navigates to home when browse products is clicked', async () => {
    render(<CartDrawer />);
    
    const cartIcon = screen.getByTestId('cart-icon');
    await user.click(cartIcon);
    
    const browseButton = screen.getByText('Browse Products');
    await user.click(browseButton);
    
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('displays cart items when items exist', async () => {
    (useCart as any).mockReturnValue({
      cartItems: mockCartItems,
      removeFromCart: mockRemoveFromCart,
      cartIsLoading: false,
      updateCartQuantity: mockUpdateCartQuantity,
    });

    render(<CartDrawer />);
    
    const cartIcon = screen.getByTestId('cart-icon');
    await user.click(cartIcon);
    
    expect(screen.getByTestId('list')).toBeInTheDocument();
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
  });

  it('displays correct total price', async () => {
    (useCart as any).mockReturnValue({
      cartItems: mockCartItems,
      removeFromCart: mockRemoveFromCart,
      cartIsLoading: false,
      updateCartQuantity: mockUpdateCartQuantity,
    });

    render(<CartDrawer />);
    
    const cartIcon = screen.getByTestId('cart-icon');
    await user.click(cartIcon);
    
    // Total: (99.99 * 2) + (149.99 * 1) = 349.97
    expect(screen.getByText('$349.97')).toBeInTheDocument();
    expect(screen.getByText('Total:')).toBeInTheDocument();
  });

  it('handles remove item from cart', async () => {
    (useCart as any).mockReturnValue({
      cartItems: mockCartItems,
      removeFromCart: mockRemoveFromCart,
      cartIsLoading: false,
      updateCartQuantity: mockUpdateCartQuantity,
    });

    render(<CartDrawer />);
    
    const cartIcon = screen.getByTestId('cart-icon');
    await user.click(cartIcon);
    
    const deleteIcons = screen.getAllByTestId('delete-icon');
    await user.click(deleteIcons[0]);
    
    expect(mockRemoveFromCart).toHaveBeenCalledWith(mockCartItems[0]);
  });

  it('prevents remove when cart is loading', async () => {
    (useCart as any).mockReturnValue({
      cartItems: mockCartItems,
      removeFromCart: mockRemoveFromCart,
      cartIsLoading: true,
      updateCartQuantity: mockUpdateCartQuantity,
    });

    render(<CartDrawer />);
    
    const cartIcon = screen.getByTestId('cart-icon');
    await user.click(cartIcon);
    
    const deleteIcons = screen.getAllByTestId('delete-icon');
    await user.click(deleteIcons[0]);
    
    expect(mockRemoveFromCart).not.toHaveBeenCalled();
  });

  it('handles increase quantity', async () => {
    (useCart as any).mockReturnValue({
      cartItems: mockCartItems,
      removeFromCart: mockRemoveFromCart,
      cartIsLoading: false,
      updateCartQuantity: mockUpdateCartQuantity,
    });

    render(<CartDrawer />);
    
    const cartIcon = screen.getByTestId('cart-icon');
    await user.click(cartIcon);
    
    const increaseButtons = screen.getAllByText('+');
    await user.click(increaseButtons[0]);
    
    expect(mockUpdateCartQuantity).toHaveBeenCalledWith(1, 3); // productId: 1, quantity: 2 + 1
  });

  it('handles decrease quantity', async () => {
    (useCart as any).mockReturnValue({
      cartItems: mockCartItems,
      removeFromCart: mockRemoveFromCart,
      cartIsLoading: false,
      updateCartQuantity: mockUpdateCartQuantity,
    });

    render(<CartDrawer />);
    
    const cartIcon = screen.getByTestId('cart-icon');
    await user.click(cartIcon);
    
    const decreaseButtons = screen.getAllByText('-');
    await user.click(decreaseButtons[0]);
    
    expect(mockUpdateCartQuantity).toHaveBeenCalledWith(1, 1); // productId: 1, quantity: 2 - 1
  });

  it('prevents decrease quantity when quantity is 1', async () => {
    const singleItemCart = [{
      ...mockCartItems[0],
      quantity: 1,
    }];

    (useCart as any).mockReturnValue({
      cartItems: singleItemCart,
      removeFromCart: mockRemoveFromCart,
      cartIsLoading: false,
      updateCartQuantity: mockUpdateCartQuantity,
    });

    render(<CartDrawer />);
    
    const cartIcon = screen.getByTestId('cart-icon');
    await user.click(cartIcon);
    
    const decreaseButtons = screen.getAllByText('-');
    await user.click(decreaseButtons[0]);
    
    expect(mockUpdateCartQuantity).not.toHaveBeenCalled();
  });

  it('navigates to checkout when proceed button is clicked', async () => {
    (useCart as any).mockReturnValue({
      cartItems: mockCartItems,
      removeFromCart: mockRemoveFromCart,
      cartIsLoading: false,
      updateCartQuantity: mockUpdateCartQuantity,
    });

    render(<CartDrawer />);
    
    const cartIcon = screen.getByTestId('cart-icon');
    await user.click(cartIcon);
    
    const checkoutButton = screen.getByText('Proceed to Checkout');
    await user.click(checkoutButton);
    
    expect(mockPush).toHaveBeenCalledWith('/checkout');
  });

  it('displays individual item prices correctly', async () => {
    (useCart as any).mockReturnValue({
      cartItems: mockCartItems,
      removeFromCart: mockRemoveFromCart,
      cartIsLoading: false,
      updateCartQuantity: mockUpdateCartQuantity,
    });

    render(<CartDrawer />);
    
    const cartIcon = screen.getByTestId('cart-icon');
    await user.click(cartIcon);
    
    // First item: $99.99 * 2 = $199.98
    expect(screen.getByText('$199.98')).toBeInTheDocument();
    expect(screen.getByText('$99.99 each')).toBeInTheDocument();
    
    // Second item: $149.99 * 1 = $149.99
    expect(screen.getByText('$149.99')).toBeInTheDocument();
    expect(screen.getByText('$149.99 each')).toBeInTheDocument();
  });

  it('displays correct quantity for each item', async () => {
    (useCart as any).mockReturnValue({
      cartItems: mockCartItems,
      removeFromCart: mockRemoveFromCart,
      cartIsLoading: false,
      updateCartQuantity: mockUpdateCartQuantity,
    });

    render(<CartDrawer />);
    
    const cartIcon = screen.getByTestId('cart-icon');
    await user.click(cartIcon);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // First item quantity
    expect(screen.getByText('1')).toBeInTheDocument(); // Second item quantity
  });
});