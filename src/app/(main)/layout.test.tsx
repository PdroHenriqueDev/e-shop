import {render, screen} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import RootLayout from './layout';

vi.mock('@/components/loading/loading', () => ({
  default: () => <div data-testid="loading">Loading...</div>,
}));

vi.mock('@/components/navMenu/navMenu', () => ({
  default: () => <nav data-testid="nav-menu">Navigation Menu</nav>,
}));

vi.mock('@/contexts/cartContext', () => ({
  CartProvider: ({children}: {children: React.ReactNode}) => (
    <div data-testid="cart-provider">{children}</div>
  ),
}));

vi.mock('@/contexts/orderContext', () => ({
  OrderProvider: ({children}: {children: React.ReactNode}) => (
    <div data-testid="order-provider">{children}</div>
  ),
}));

describe('RootLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children within the layout structure', () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>;

    render(
      <RootLayout>
        <TestChild />
      </RootLayout>,
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render NavMenu component', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>,
    );

    expect(screen.getByTestId('nav-menu')).toBeInTheDocument();
    expect(screen.getByText('Navigation Menu')).toBeInTheDocument();
  });

  it('should wrap children with CartProvider', () => {
    render(
      <RootLayout>
        <div data-testid="child-content">Child Content</div>
      </RootLayout>,
    );

    const cartProvider = screen.getByTestId('cart-provider');
    expect(cartProvider).toBeInTheDocument();
    expect(cartProvider).toContainElement(screen.getByTestId('child-content'));
  });

  it('should wrap children with OrderProvider', () => {
    render(
      <RootLayout>
        <div data-testid="child-content">Child Content</div>
      </RootLayout>,
    );

    const orderProvider = screen.getByTestId('order-provider');
    expect(orderProvider).toBeInTheDocument();
    expect(orderProvider).toContainElement(screen.getByTestId('child-content'));
  });

  it('should have correct provider nesting structure', () => {
    render(
      <RootLayout>
        <div data-testid="nested-child">Nested Content</div>
      </RootLayout>,
    );

    const cartProvider = screen.getByTestId('cart-provider');
    const orderProvider = screen.getByTestId('order-provider');
    const navMenu = screen.getByTestId('nav-menu');
    const child = screen.getByTestId('nested-child');

    // Check that CartProvider contains OrderProvider
    expect(cartProvider).toContainElement(orderProvider);
    // Check that OrderProvider contains NavMenu and child
    expect(orderProvider).toContainElement(navMenu);
    expect(orderProvider).toContainElement(child);
  });

  it('should render multiple children correctly', () => {
    render(
      <RootLayout>
        <div data-testid="child-1">First Child</div>
        <div data-testid="child-2">Second Child</div>
      </RootLayout>,
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
  });

  it('should handle empty children gracefully', () => {
    render(<RootLayout>{null}</RootLayout>);

    expect(screen.getByTestId('nav-menu')).toBeInTheDocument();
    expect(screen.getByTestId('cart-provider')).toBeInTheDocument();
    expect(screen.getByTestId('order-provider')).toBeInTheDocument();
  });

  it('should render with correct component hierarchy', () => {
    const {container} = render(
      <RootLayout>
        <main data-testid="main-content">Main Content</main>
      </RootLayout>,
    );

    // Verify the overall structure exists
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });
});
