import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import NavMenu from './navMenu';

// Mock all dependencies
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock('@/contexts/cartContext', () => ({
  useCart: vi.fn(),
}));

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('antd', () => ({
  Menu: ({onClick, selectedKeys, items}: any) => (
    <div data-testid="menu">
      {items.map((item: any) => (
        <div key={item.key}>
          <button
            data-testid={`menu-item-${item.key}`}
            onClick={() => onClick({key: item.key})}
            className={selectedKeys?.includes(item.key) ? 'selected' : ''}>
            {item.label}
          </button>
          {item.children &&
            item.children.map((child: any) => (
              <button
                key={child.key}
                data-testid={`menu-item-${child.key}`}
                onClick={() => onClick({key: child.key})}
                className={selectedKeys?.includes(child.key) ? 'selected' : ''}>
                {child.label}
              </button>
            ))}
        </div>
      ))}
    </div>
  ),
  Layout: {
    Header: ({children}: {children: React.ReactNode}) => (
      <div data-testid="header">{children}</div>
    ),
  },
  Dropdown: ({children, menu}: any) => (
    <div
      data-testid="dropdown"
      onClick={() => {
        menu.items.forEach((item: any) => {
          if (item.onClick) item.onClick({key: item.key});
        });
      }}>
      {children}
    </div>
  ),
  Avatar: () => <div data-testid="avatar">Avatar</div>,
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button data-testid="button" onClick={onClick}>
      {children}
    </button>
  ),
  ConfigProvider: ({children}: {children: React.ReactNode}) => (
    <div>{children}</div>
  ),
}));

vi.mock('./drawer/drawer', () => ({
  default: () => <div data-testid="cart-drawer">Cart Drawer</div>,
}));

const mockUseSession = vi.fn();
const mockUseRouter = vi.fn();
const mockUsePathname = vi.fn();
const mockUseCart = vi.fn();
const mockAxios = vi.fn();

// Import the mocked modules
import {useSession} from 'next-auth/react';
import {useRouter, usePathname} from 'next/navigation';
import {useCart} from '@/contexts/cartContext';
import axios from '@/lib/axios';

describe('NavMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    (useSession as any).mockReturnValue({data: null});
    (useRouter as any).mockReturnValue({push: vi.fn()});
    (usePathname as any).mockReturnValue('/');
    (useCart as any).mockReturnValue({
      cartItems: [],
      addToCart: vi.fn(),
      handleSetCartItems: vi.fn(),
      updateCartQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      cartIsLoading: false,
    });
    (axios.get as any).mockResolvedValue({data: []});
  });

  it('renders the navigation menu', () => {
    render(<NavMenu />);

    expect(screen.getByTestId('menu')).toBeInTheDocument();
    // Check for the actual header element instead of test-id
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders cart drawer component', () => {
    render(<NavMenu />);

    expect(screen.getByTestId('cart-drawer')).toBeInTheDocument();
  });

  it('displays user avatar when authenticated', () => {
    (useSession as any).mockReturnValue({
      data: {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'USER',
        },
      },
    });

    render(<NavMenu />);

    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  it('handles unauthenticated state', () => {
    (useSession as any).mockReturnValue({data: null});

    render(<NavMenu />);

    // Should still render the menu structure
    expect(screen.getByTestId('menu')).toBeInTheDocument();
  });

  it('renders with different pathname', () => {
    (usePathname as any).mockReturnValue('/products');

    render(<NavMenu />);

    expect(screen.getByTestId('menu')).toBeInTheDocument();
  });

  it('handles menu item click and navigation', () => {
    const mockPush = vi.fn();
    (useRouter as any).mockReturnValue({push: mockPush});

    render(<NavMenu />);

    const productsButton = screen.getByTestId('menu-item-products');
    productsButton.click();

    expect(mockPush).toHaveBeenCalledWith('/products/catalog');
  });

  it('handles child menu item click and navigation', () => {
    const mockPush = vi.fn();
    (useRouter as any).mockReturnValue({push: mockPush});

    render(<NavMenu />);

    const clothingButton = screen.getByTestId('menu-item-clothing');
    clothingButton.click();

    expect(mockPush).toHaveBeenCalledWith('/categories/1');
  });

  it('handles dropdown menu interactions', () => {
    const mockPush = vi.fn();
    (useRouter as any).mockReturnValue({push: mockPush});
    (useSession as any).mockReturnValue({
      data: {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'admin',
        },
      },
    });

    render(<NavMenu />);

    const dropdown = screen.getByTestId('dropdown');
    dropdown.click();

    expect(mockPush).toHaveBeenCalled();
  });

  it('fetches cart items when user session exists', async () => {
    const mockHandleSetCartItems = vi.fn();
    (useCart as any).mockReturnValue({
      cartItems: [],
      addToCart: vi.fn(),
      handleSetCartItems: mockHandleSetCartItems,
      updateCartQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      cartIsLoading: false,
    });
    (useSession as any).mockReturnValue({
      data: {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    });
    (axios.get as any).mockResolvedValue({data: [{id: 1, name: 'Product 1'}]});

    render(<NavMenu />);

    // Wait for useEffect to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(axios.get).toHaveBeenCalledWith('/api/cart');
    expect(mockHandleSetCartItems).toHaveBeenCalledWith([
      {id: 1, name: 'Product 1'},
    ]);
  });

  it('handles cart fetch error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (useSession as any).mockReturnValue({
      data: {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    });
    (axios.get as any).mockRejectedValue(new Error('Network error'));

    render(<NavMenu />);

    // Wait for useEffect to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch cart items:',
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it('sets correct active key for clothing category path', () => {
    (usePathname as any).mockReturnValue('/categories/1');
    (useSession as any).mockReturnValue({data: null});
    (useCart as any).mockReturnValue({
      cartItems: [],
      addToCart: vi.fn(),
      handleSetCartItems: vi.fn(),
      updateCartQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      cartIsLoading: false,
    });

    render(<NavMenu />);

    expect(screen.getByTestId('menu-item-clothing')).toHaveClass('selected');
  });

  it('sets correct active key for electronics category path', () => {
    (usePathname as any).mockReturnValue('/categories/2');
    (useSession as any).mockReturnValue({data: null});
    (useCart as any).mockReturnValue({
      cartItems: [],
      addToCart: vi.fn(),
      handleSetCartItems: vi.fn(),
      updateCartQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      cartIsLoading: false,
    });

    render(<NavMenu />);

    expect(screen.getByTestId('menu-item-electronics')).toHaveClass('selected');
  });

  it('sets correct active key for accessories category path', () => {
    (usePathname as any).mockReturnValue('/categories/3');
    (useSession as any).mockReturnValue({data: null});
    (useCart as any).mockReturnValue({
      cartItems: [],
      addToCart: vi.fn(),
      handleSetCartItems: vi.fn(),
      updateCartQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      cartIsLoading: false,
    });

    render(<NavMenu />);

    expect(screen.getByTestId('menu-item-accessories')).toHaveClass('selected');
  });

  it('sets correct active key for products path', () => {
    (usePathname as any).mockReturnValue('/products/catalog');
    (useSession as any).mockReturnValue({data: null});
    (useCart as any).mockReturnValue({
      cartItems: [],
      addToCart: vi.fn(),
      handleSetCartItems: vi.fn(),
      updateCartQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      cartIsLoading: false,
    });

    render(<NavMenu />);

    expect(screen.getByTestId('menu-item-products')).toHaveClass('selected');
  });

  it('sets correct active key for other categories path', () => {
    (usePathname as any).mockReturnValue('/categories/other');
    (useSession as any).mockReturnValue({data: null});
    (useCart as any).mockReturnValue({
      cartItems: [],
      addToCart: vi.fn(),
      handleSetCartItems: vi.fn(),
      updateCartQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      cartIsLoading: false,
    });

    render(<NavMenu />);

    expect(screen.getByTestId('menu-item-categories')).toHaveClass('selected');
  });

  it('sets home as default active key for unknown paths', () => {
    (usePathname as any).mockReturnValue('/unknown/path');
    (useSession as any).mockReturnValue({data: null});
    (useCart as any).mockReturnValue({
      cartItems: [],
      addToCart: vi.fn(),
      handleSetCartItems: vi.fn(),
      updateCartQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      cartIsLoading: false,
    });

    render(<NavMenu />);

    expect(screen.getByTestId('menu-item-home')).toHaveClass('selected');
  });
});
