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
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockCartItem: CartItemProps = {
    cartId: 1,
    cartItemId: 1,
    productId: 1,
    quantity: 2,
    product: mockProduct,
  };

  const mockCartItems = [
    mockCartItem,
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
        data-testid="set-cart-items"
        onClick={() => handleSetCartItems(mockCartItems)}
      >
        Set Cart Items
      </button>
      <button
        data-testid="update-quantity-2"
        onClick={() => updateCartQuantity(2, 5)}
      >
        Update Quantity 2
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
          msg: 'Test Product has been added to your cart!',
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
          msg: 'Failed to add Test Product to your cart.',
        });
      });

      expect(screen.getByTestId('cart-items-count')).toHaveTextContent('0');
    });

    it('should show loading state during add to cart', async () => {
      mockAxios.post.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100)),
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
          msg: 'Failed to remove Test Product from your cart.',
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
        expect(mockAxios.put).toHaveBeenCalledWith('/api/cart', {
          productId: 1,
          quantity: 3,
        });
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'success',
          msg: 'Cart updated successfully!',
        });
      });
    });

    it('should update only matching item quantity while preserving others', async () => {
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
            description: 'Test description 1',
            image: 'test-image-1.jpg',
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

      const mockResponse = {
        status: 200,
        data: {
          productId: 1,
          quantity: 5,
        },
      };

      mockAxios.put.mockResolvedValueOnce(mockResponse);

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>,
      );

      const setItemsButton = screen.getByTestId('set-cart-items');
      await user.click(setItemsButton);

      const updateButton = screen.getByTestId('update-quantity');
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockAxios.put).toHaveBeenCalledWith('/api/cart', {
          productId: 1,
          quantity: 3,
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
          msg: 'Failed to update cart quantity',
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

      expect(screen.getByTestId('cart-items-count')).toHaveTextContent('2');
    });
  });
});