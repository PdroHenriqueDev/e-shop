import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    category: 'test-category',
    stock: 10,
  };

  const mockCartItem: CartItemProps = {
    id: 1,
    name: 'Test Product',
    price: 99.99,
    image: 'test-image.jpg',
    quantity: 2,
  };

  return (
    <div>
      <div data-testid="cart-items-count">{cartItems.length}</div>
      <div data-testid="loading-state">{cartIsLoading ? 'loading' : 'idle'}</div>
      <button
        data-testid="add-to-cart"
        onClick={() => addToCart(mockProduct)}
      >
        Add to Cart
      </button>
      <button
        data-testid="remove-from-cart"
        onClick={() => removeFromCart(mockCartItem)}
      >
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
        onClick={() => handleSetCartItems([mockCartItem])}
      >
        Set Cart Items
      </button>
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
      expect(() => {
        render(<TestComponentWithoutProvider />);
      }).toThrow('useCart must be used within a CartProvider');
    });
  });

  describe('addToCart', () => {
    it('should add item to cart successfully', async () => {
      const mockResponse = {
        status: 201,
        data: {
          items: [
            {
              id: 1,
              name: 'Test Product',
              price: 99.99,
              image: 'test-image.jpg',
              quantity: 1,
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

      const addButton = screen.getByTestId('add-to-cart');
      await user.click(addButton);

      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith('/api/cart', {
          productId: 1,
          quantity: 1,
        });
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'success',
          message: 'Item added to cart successfully!',
        });
      });

      expect(screen.getByTestId('cart-items-count')).toHaveTextContent('1');
    });

    it('should handle add to cart error', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Failed to add item to cart',
          },
        },
      };

      mockAxios.post.mockRejectedValueOnce(mockError);

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      const addButton = screen.getByTestId('add-to-cart');
      await user.click(addButton);

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'error',
          message: 'Failed to add item to cart',
        });
      });

      expect(screen.getByTestId('cart-items-count')).toHaveTextContent('0');
    });

    it('should show loading state during add to cart', async () => {
      mockAxios.post.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      const addButton = screen.getByTestId('add-to-cart');
      await user.click(addButton);

      expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart successfully', async () => {
      const mockResponse = {
        status: 200,
        data: {
          items: [],
        },
      };

      mockAxios.delete.mockResolvedValueOnce(mockResponse);

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      const removeButton = screen.getByTestId('remove-from-cart');
      await user.click(removeButton);

      await waitFor(() => {
        expect(mockAxios.delete).toHaveBeenCalledWith('/api/cart/1');
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'success',
          message: 'Item removed from cart successfully!',
        });
      });
    });

    it('should handle remove from cart error', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Failed to remove item from cart',
          },
        },
      };

      mockAxios.delete.mockRejectedValueOnce(mockError);

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      const removeButton = screen.getByTestId('remove-from-cart');
      await user.click(removeButton);

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'error',
          message: 'Failed to remove item from cart',
        });
      });
    });
  });

  describe('updateCartQuantity', () => {
    it('should update cart item quantity successfully', async () => {
      const mockResponse = {
        status: 200,
        data: {
          items: [
            {
              id: 1,
              name: 'Test Product',
              price: 99.99,
              image: 'test-image.jpg',
              quantity: 3,
            },
          ],
        },
      };

      mockAxios.put.mockResolvedValueOnce(mockResponse);

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      const updateButton = screen.getByTestId('update-quantity');
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockAxios.put).toHaveBeenCalledWith('/api/cart/1', {
          quantity: 3,
        });
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'success',
          message: 'Cart updated successfully!',
        });
      });
    });

    it('should update only matching item quantity while preserving others', async () => {
      const mockResponse = {
        status: 200,
        data: {
          items: [
            {
              id: 1,
              name: 'Test Product 1',
              price: 99.99,
              image: 'test-image-1.jpg',
              quantity: 3,
            },
            {
              id: 2,
              name: 'Test Product 2',
              price: 149.99,
              image: 'test-image-2.jpg',
              quantity: 5,
            },
          ],
        },
      };

      mockAxios.put.mockResolvedValueOnce(mockResponse);

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      const updateButton = screen.getByTestId('update-quantity-2');
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockAxios.put).toHaveBeenCalledWith('/api/cart/2', {
          quantity: 5,
        });
      });
    });

    it('should handle update quantity error', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Failed to update cart quantity',
          },
        },
      };

      mockAxios.put.mockRejectedValueOnce(mockError);

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      const updateButton = screen.getByTestId('update-quantity');
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'error',
          message: 'Failed to update cart quantity',
        });
      });
    });
  });

  describe('handleSetCartItems', () => {
    it('should set cart items directly', async () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      const setItemsButton = screen.getByTestId('set-cart-items');
      await user.click(setItemsButton);

      expect(screen.getByTestId('cart-items-count')).toHaveTextContent('1');
    });
  });
});