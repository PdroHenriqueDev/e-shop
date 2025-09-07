import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {CartProvider, useCart} from './cartContext';
import {useNotification} from './notificationContext';
import axios from '@/lib/axios';
import {CartItemProps, ProductProps} from '@/interfaces/product';

vi.mock('./notificationContext');
vi.mock('@/lib/axios');

const mockNotify = vi.fn();
const mockAxios = axios as any;

const TestComponent = () => {
  const {
    cartItems,
    cartIsLoading,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    handleSetCartItems,
  } = useCart();

  const mockProduct: ProductProps = {
    id: 1,
    name: 'Test Product',
    price: 99.99,
    description: 'Test description',
    image: 'test-image.jpg',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockCartItem: CartItemProps = {
    cartId: 1,
    cartItemId: 1,
    productId: 1,
    quantity: 2,
    product: mockProduct,
  };

  const mockProduct2: ProductProps = {
    id: 2,
    name: 'Test Product 2',
    price: 49.99,
    description: 'Test description 2',
    image: 'test-image-2.jpg',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockCartItem2: CartItemProps = {
    cartId: 1,
    cartItemId: 2,
    productId: 2,
    quantity: 1,
    product: mockProduct2,
  };

  return (
    <div>
      <div data-testid="cart-items-count">{cartItems.length}</div>
      <div data-testid="loading-state">
        {cartIsLoading ? 'loading' : 'idle'}
      </div>
      <button data-testid="add-to-cart" onClick={() => addToCart(mockProduct)}>
        Add to Cart
      </button>
      <button
        data-testid="remove-from-cart"
        onClick={() => removeFromCart(mockCartItem)}>
        Remove from Cart
      </button>
      <button
          data-testid="update-quantity"
          onClick={() => updateCartQuantity(1, 3)}
        >
          Update Quantity
        </button>
        <button
          data-testid="update-quantity-2"
          onClick={() => updateCartQuantity(2, 5)}
        >
          Update Quantity 2
        </button>
      <button
        data-testid="set-cart-items"
        onClick={() => handleSetCartItems([mockCartItem, mockCartItem2])}>
        Set Cart Items
      </button>
      {cartItems.map(item => (
        <div key={item.productId} data-testid={`cart-item-${item.productId}`}>
          {item.product.name} - Quantity: {item.quantity}
        </div>
      ))}
    </div>
  );
};

const TestComponentWithoutProvider = () => {
  const cart = useCart();
  return <div>{cart.cartItems.length}</div>;
};

describe('CartContext', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotification).mockReturnValue({
      notify: mockNotify,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('CartProvider', () => {
    it('should provide cart context to children', () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      expect(screen.getByTestId('cart-items-count')).toHaveTextContent('0');
      expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
    });

    it('should throw error when useCart is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponentWithoutProvider />);
      }).toThrow('useCart must be used within a CartProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('addToCart', () => {
    it('should add item to cart successfully', async () => {
      const mockResponse = {
        status: 201,
        data: {
          items: [
            {
              cartId: 1,
              cartItemId: 1,
              productId: 1,
              quantity: 1,
              product: {
                id: 1,
                name: 'Test Product',
                price: 99.99,
                description: 'Test description',
                image: 'test-image.jpg',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
              },
            },
          ],
        },
      };

      mockAxios.post.mockResolvedValueOnce(mockResponse);

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      await user.click(screen.getByTestId('add-to-cart'));

      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith('/api/cart', {
          productId: 1,
          quantity: 1,
        });
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'success',
          msg: 'Test Product has been added to your cart!',
        });
      });

      expect(screen.getByTestId('cart-items-count')).toHaveTextContent('1');
    });

    it('should handle add to cart error', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Network error'));

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      await user.click(screen.getByTestId('add-to-cart'));

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'error',
          msg: 'Failed to add Test Product to your cart.',
        });
      });

      expect(screen.getByTestId('cart-items-count')).toHaveTextContent('0');
    });

    it('should show loading state during add to cart', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockAxios.post.mockReturnValueOnce(promise);

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      await user.click(screen.getByTestId('add-to-cart'));

      expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');

      resolvePromise!({
        status: 201,
        data: {items: []},
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
      });
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart successfully', async () => {
      mockAxios.delete.mockResolvedValueOnce({status: 200});

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      // First set some cart items
      await user.click(screen.getByTestId('set-cart-items'));
      expect(screen.getByTestId('cart-items-count')).toHaveTextContent('2');

      // Then remove the item
      await user.click(screen.getByTestId('remove-from-cart'));

      await waitFor(() => {
        expect(mockAxios.delete).toHaveBeenCalledWith('/api/cart', {
          data: {
            cartId: 1,
            productId: 1,
          },
        });
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'success',
          msg: 'Test Product has been removed from your cart!',
        });
      });

      expect(screen.getByTestId('cart-items-count')).toHaveTextContent('1');
    });

    it('should handle remove from cart error', async () => {
      mockAxios.delete.mockRejectedValueOnce(new Error('Network error'));

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      await user.click(screen.getByTestId('remove-from-cart'));

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'error',
          msg: 'Failed to remove Test Product from your cart.',
        });
      });
    });
  });

  describe('updateCartQuantity', () => {
    it('should update cart item quantity successfully', async () => {
      const mockResponse = {
        data: {
          productId: 1,
          quantity: 3,
        },
      };

      mockAxios.put.mockResolvedValueOnce(mockResponse);

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      // First set some cart items
      await user.click(screen.getByTestId('set-cart-items'));
      expect(screen.getByTestId('cart-item-1')).toHaveTextContent(
        'Quantity: 2',
      );

      // Then update quantity
      await user.click(screen.getByTestId('update-quantity'));

      await waitFor(() => {
        expect(mockAxios.put).toHaveBeenCalledWith('/api/cart', {
          productId: 1,
          quantity: 3,
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('cart-item-1')).toHaveTextContent(
          'Quantity: 3',
        );
      });
    });

    it('should update only matching item quantity while preserving others', async () => {
      const mockResponse = {
        data: {
          productId: 2,
          quantity: 5,
        },
      };

      mockAxios.put.mockResolvedValueOnce(mockResponse);

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      // Set cart items with multiple products
      await user.click(screen.getByTestId('set-cart-items'));
      expect(screen.getByTestId('cart-item-1')).toHaveTextContent(
        'Quantity: 2',
      );
      expect(screen.getByTestId('cart-item-2')).toHaveTextContent(
        'Quantity: 1',
      );

      // Update quantity for product 2
      await user.click(screen.getByTestId('update-quantity-2'));

      await waitFor(() => {
        expect(mockAxios.put).toHaveBeenCalledWith('/api/cart', {
          productId: 2,
          quantity: 5,
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('cart-item-1')).toHaveTextContent(
          'Quantity: 2',
        );
        expect(screen.getByTestId('cart-item-2')).toHaveTextContent(
          'Quantity: 5',
        );
      });
    });

    it('should handle update quantity error', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      mockAxios.put.mockRejectedValueOnce(new Error('Network error'));

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      await user.click(screen.getByTestId('set-cart-items'));
      await user.click(screen.getByTestId('update-quantity'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to update cart item quantity:',
          expect.any(Error),
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('handleSetCartItems', () => {
    it('should set cart items directly', async () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      expect(screen.getByTestId('cart-items-count')).toHaveTextContent('0');

      await user.click(screen.getByTestId('set-cart-items'));

      expect(screen.getByTestId('cart-items-count')).toHaveTextContent('2');
      expect(screen.getByTestId('cart-item-1')).toHaveTextContent(
        'Test Product - Quantity: 2',
      );
      expect(screen.getByTestId('cart-item-2')).toHaveTextContent(
        'Test Product 2 - Quantity: 1',
      );
    });
  });
});