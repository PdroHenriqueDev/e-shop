import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import {useParams, useRouter} from 'next/navigation';
import axios from '@/lib/axios';
import {useCart} from '@/contexts/cartContext';
import {useNotification} from '@/contexts/notificationContext';
import CategoryProductsPage from './page';

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('@/contexts/cartContext', () => ({
  useCart: vi.fn(),
}));

vi.mock('@/contexts/notificationContext', () => ({
  useNotification: vi.fn(),
}));

vi.mock('@/components/loading/loading', () => ({
  default: () => <div data-testid="loading-component">Loading...</div>,
}));

vi.mock('@/components/customButtton/customButton', () => ({
  default: ({buttonText, onClick}: any) => (
    <button data-testid="add-to-cart-button" onClick={onClick}>
      {buttonText}
    </button>
  ),
}));

vi.mock('next/image', () => ({
  default: ({src, alt, fill, sizes, className}: any) => (
    <img
      data-testid="product-image"
      src={src ?? ''}
      alt={alt}
      data-fill={fill}
      data-sizes={sizes}
      className={className}
    />
  ),
}));

vi.mock('antd', () => ({
  Card: ({children, hoverable, cover, bodyStyle}: any) => (
    <div
      data-testid="product-card"
      data-hoverable={hoverable}
      style={bodyStyle}>
      {cover && <div data-testid="card-cover">{cover}</div>}
      <div data-testid="card-body">{children}</div>
    </div>
  ),
  Row: ({children, gutter}: any) => (
    <div data-testid="products-row" data-gutter={JSON.stringify(gutter)}>
      {children}
    </div>
  ),
  Col: ({children, xs, sm, md, lg}: any) => (
    <div
      data-testid="product-col"
      data-xs={xs}
      data-sm={sm}
      data-md={md}
      data-lg={lg}>
      {children}
    </div>
  ),
}));

const mockPush = vi.fn();
const mockAddToCart = vi.fn();
const mockNotify = vi.fn();
const mockAxios = axios as any;

const mockProducts = [
  {
    id: 1,
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone with advanced features',
    price: 999.99,
    imageUrl: '/iphone15.jpg',
    category: {
      id: 1,
      name: 'Electronics',
    },
  },
  {
    id: 2,
    name: 'MacBook Pro',
    description: 'Powerful laptop for professionals',
    price: 1999.99,
    imageUrl: '/macbook.jpg',
    category: {
      id: 1,
      name: 'Electronics',
    },
  },
];

const mockCategories = [
  {id: 1, name: 'Electronics'},
  {id: 2, name: 'Clothing'},
  {id: 3, name: 'Books'},
];

describe('CategoryProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
    (useCart as any).mockReturnValue({
      addToCart: mockAddToCart,
    });
    (useNotification as any).mockReturnValue({
      notify: mockNotify,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading component while data is being fetched', async () => {
      (useParams as any).mockReturnValue({category: '1'});
      mockAxios.get.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100)),
      );

      render(<CategoryProductsPage />);

      expect(screen.getByTestId('loading-component')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Empty CategoryId', () => {
    it('should show no products message when useParams returns no category', async () => {
      (useParams as any).mockReturnValue({category: null});

      render(<CategoryProductsPage />);

      await waitFor(() => {
        expect(
          screen.getByText('No products found in this category.'),
        ).toBeInTheDocument();
      });

      expect(mockAxios.get).not.toHaveBeenCalled();
    });

    it('should show no products message when useParams returns undefined category', async () => {
      (useParams as any).mockReturnValue({category: undefined});

      render(<CategoryProductsPage />);

      await waitFor(() => {
        expect(
          screen.getByText('No products found in this category.'),
        ).toBeInTheDocument();
      });

      expect(mockAxios.get).not.toHaveBeenCalled();
    });
  });

  describe('Successful Product Fetch', () => {
    it('should display category name and products when fetch is successful', async () => {
      (useParams as any).mockReturnValue({category: '1'});
      mockAxios.get.mockResolvedValueOnce({
        data: mockProducts,
      });

      render(<CategoryProductsPage />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
      });

      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      expect(
        screen.getByText('Latest iPhone with advanced features'),
      ).toBeInTheDocument();
      expect(screen.getByText('$999.99')).toBeInTheDocument();

      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
      expect(
        screen.getByText('Powerful laptop for professionals'),
      ).toBeInTheDocument();
      expect(screen.getByText('$1999.99')).toBeInTheDocument();

      const productImages = screen.getAllByTestId('product-image');
      expect(productImages).toHaveLength(2);
      expect(productImages[0]).toHaveAttribute('src', '/iphone15.jpg');
      expect(productImages[0]).toHaveAttribute('alt', 'iPhone 15 Pro');
      expect(productImages[1]).toHaveAttribute('src', '/macbook.jpg');
      expect(productImages[1]).toHaveAttribute('alt', 'MacBook Pro');

      expect(mockAxios.get).toHaveBeenCalledWith('/api/products', {
        params: {categoryId: '1'},
      });
    });

    it('should display products without category information', async () => {
      (useParams as any).mockReturnValue({category: '1'});
      const productsWithoutCategory = mockProducts.map(product => ({
        ...product,
        category: undefined,
      }));

      mockAxios.get.mockResolvedValueOnce({
        data: productsWithoutCategory,
      });

      render(<CategoryProductsPage />);

      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      });

      expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
      expect(screen.getAllByTestId('add-to-cart-button')).toHaveLength(2);
    });
  });

  describe('Fallback Category Fetch', () => {
    it('should fetch category name from /api/categories when products have no category info', async () => {
      (useParams as any).mockReturnValue({category: '1'});
      const productsWithoutCategory = mockProducts.map(product => ({
        ...product,
        category: undefined,
      }));

      mockAxios.get
        .mockResolvedValueOnce({
          data: productsWithoutCategory,
        })
        .mockResolvedValueOnce({
          data: mockCategories,
        });

      render(<CategoryProductsPage />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/products', {
        params: {categoryId: '1'},
      });
      expect(mockAxios.get).toHaveBeenCalledWith('/api/categories');
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    });

    it('should handle case when category is not found in categories list', async () => {
      (useParams as any).mockReturnValue({category: '999'});
      const productsWithoutCategory = mockProducts.map(product => ({
        ...product,
        category: undefined,
      }));

      mockAxios.get
        .mockResolvedValueOnce({
          data: productsWithoutCategory,
        })
        .mockResolvedValueOnce({
          data: mockCategories,
        });

      render(<CategoryProductsPage />);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/products', {
        params: {categoryId: '999'},
      });
      expect(mockAxios.get).toHaveBeenCalledWith('/api/categories');
    });
  });

  describe('Fetch Error', () => {
    it('should call notification function when axios throws an error', async () => {
      (useParams as any).mockReturnValue({category: '1'});
      const errorMessage = 'Network Error';
      mockAxios.get.mockRejectedValueOnce(new Error(errorMessage));

      render(<CategoryProductsPage />);

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'error',
          msg: 'Failed to load products',
        });
      });

      expect(
        screen.getByText('No products found in this category.'),
      ).toBeInTheDocument();
    });

    it('should handle error during category fetch fallback', async () => {
      (useParams as any).mockReturnValue({category: '1'});
      const productsWithoutCategory = mockProducts.map(product => ({
        ...product,
        category: undefined,
      }));

      mockAxios.get
        .mockResolvedValueOnce({
          data: productsWithoutCategory,
        })
        .mockRejectedValueOnce(new Error('Categories fetch failed'));

      render(<CategoryProductsPage />);

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith({
          type: 'error',
          msg: 'Failed to load products',
        });
      });
    });
  });

  describe('Add to Cart', () => {
    it('should call addToCart when Add to Cart button is clicked', async () => {
      (useParams as any).mockReturnValue({category: '1'});
      mockAxios.get.mockResolvedValueOnce({
        data: mockProducts,
      });

      render(<CategoryProductsPage />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('add-to-cart-button');
      fireEvent.click(addToCartButtons[0]);

      expect(mockAddToCart).toHaveBeenCalledWith(mockProducts[0]);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should call addToCart for the correct product when multiple products exist', async () => {
      (useParams as any).mockReturnValue({category: '1'});
      mockAxios.get.mockResolvedValueOnce({
        data: mockProducts,
      });

      render(<CategoryProductsPage />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('add-to-cart-button');
      fireEvent.click(addToCartButtons[1]);

      expect(mockAddToCart).toHaveBeenCalledWith(mockProducts[1]);
      expect(mockAddToCart).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigate to Product Page', () => {
    it('should navigate to product detail page when product card is clicked', async () => {
      (useParams as any).mockReturnValue({category: '1'});
      mockAxios.get.mockResolvedValueOnce({
        data: mockProducts,
      });

      render(<CategoryProductsPage />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
      });

      const clickableDiv = screen
        .getAllByRole('generic')[0]
        .querySelector('.cursor-pointer');
      fireEvent.click(clickableDiv!);

      expect(mockPush).toHaveBeenCalledWith('/products/1');
    });

    it('should navigate to correct product page for different products', async () => {
      (useParams as any).mockReturnValue({category: 'electronics'});
      mockAxios.get.mockResolvedValueOnce({data: mockProducts});

      render(<CategoryProductsPage />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
      });

      const macbookCard = screen
        .getByText('MacBook Pro')
        .closest('.cursor-pointer');
      fireEvent.click(macbookCard!);

      expect(mockPush).toHaveBeenCalledWith('/products/2');
    });

    it('should not navigate when Add to Cart button is clicked due to stopPropagation', async () => {
      (useParams as any).mockReturnValue({category: '1'});
      mockAxios.get.mockResolvedValueOnce({
        data: mockProducts,
      });

      render(<CategoryProductsPage />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
      });

      const addToCartButtons = screen.getAllByTestId('add-to-cart-button');
      fireEvent.click(addToCartButtons[0]);

      expect(mockAddToCart).toHaveBeenCalledWith(mockProducts[0]);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Empty Products State', () => {
    it('should show no products message when API returns empty array', async () => {
      (useParams as any).mockReturnValue({category: '1'});
      mockAxios.get.mockResolvedValueOnce({
        data: [],
      });

      render(<CategoryProductsPage />);

      await waitFor(() => {
        expect(
          screen.getByText('No products found in this category.'),
        ).toBeInTheDocument();
      });

      expect(screen.queryByTestId('products-row')).not.toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render correct component structure when products are loaded', async () => {
      (useParams as any).mockReturnValue({category: '1'});
      mockAxios.get.mockResolvedValueOnce({
        data: mockProducts,
      });

      render(<CategoryProductsPage />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
      });

      expect(screen.getByTestId('products-row')).toBeInTheDocument();
      expect(screen.getAllByTestId('product-col')).toHaveLength(2);
      expect(screen.getAllByTestId('product-card')).toHaveLength(2);
      expect(screen.getAllByTestId('card-cover')).toHaveLength(2);
      expect(screen.getAllByTestId('card-body')).toHaveLength(2);
    });

    it('should have correct responsive grid properties', async () => {
      (useParams as any).mockReturnValue({category: '1'});
      mockAxios.get.mockResolvedValueOnce({
        data: mockProducts,
      });

      render(<CategoryProductsPage />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
      });

      const productCols = screen.getAllByTestId('product-col');
      productCols.forEach(col => {
        expect(col).toHaveAttribute('data-xs', '24');
        expect(col).toHaveAttribute('data-sm', '12');
        expect(col).toHaveAttribute('data-md', '8');
        expect(col).toHaveAttribute('data-lg', '6');
      });
    });
  });
});
