import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import {useRouter} from 'next/navigation';
import axios from 'axios';
import {useNotification} from '@/contexts/notificationContext';
import {useCart} from '@/contexts/cartContext';
import ProductCatalog from './page';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('@/contexts/notificationContext', () => ({
  useNotification: vi.fn(),
}));

vi.mock('@/contexts/cartContext', () => ({
  useCart: vi.fn(),
}));

vi.mock('@/components/customButtton/customButton', () => ({
  default: ({buttonText, onClick, backgroundColor, disabled}: any) => (
    <button
      data-testid="custom-button"
      onClick={onClick}
      disabled={disabled}
      data-background={backgroundColor}>
      {buttonText}
    </button>
  ),
}));

vi.mock('@/components/customInput', () => ({
  default: ({id, type, placeholder, register, name, errorMessage}: any) => (
    <div data-testid="custom-input-wrapper">
      <input
        data-testid={`custom-input-${id}`}
        type={type}
        placeholder={placeholder}
        {...register(name)}
      />
      {errorMessage && <div data-testid="error-message">{errorMessage}</div>}
    </div>
  ),
}));

vi.mock('next/image', () => ({
  default: ({src, alt, fill, sizes, className}: any) => (
    <img
      data-testid="next-image"
      src={src}
      alt={alt}
      data-fill={fill}
      data-sizes={sizes}
      className={className}
    />
  ),
}));

vi.mock('antd', () => ({
  Card: ({children, hoverable, cover, className}: any) => (
    <div data-testid="card" data-hoverable={hoverable} className={className}>
      {cover && <div data-testid="card-cover">{cover}</div>}
      {children}
    </div>
  ),
  Row: ({children, gutter, className}: any) => (
    <div
      data-testid="row"
      data-gutter={JSON.stringify(gutter)}
      className={className}>
      {children}
    </div>
  ),
  Col: ({children, span, xs, sm, md, lg, className}: any) => (
    <div
      data-testid="col"
      data-span={span}
      data-xs={xs}
      data-sm={sm}
      data-md={md}
      data-lg={lg}
      className={className}>
      {children}
    </div>
  ),
  Pagination: ({current, pageSize, total, onChange}: any) => (
    <div data-testid="pagination">
      <button
        data-testid="pagination-prev"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}>
        Previous
      </button>
      <span data-testid="pagination-current">{current}</span>
      <button
        data-testid="pagination-next"
        onClick={() => onChange(current + 1)}
        disabled={current * pageSize >= total}>
        Next
      </button>
    </div>
  ),
}));

const mockPush = vi.fn();
const mockNotify = vi.fn();
const mockAddToCart = vi.fn();
const mockAxios = axios as any;

const mockCategories = [
  {id: 1, name: 'Electronics'},
  {id: 2, name: 'Clothing'},
];

const mockProducts = [
  {
    id: 1,
    name: 'iPhone 15',
    price: 999,
    imageUrl: '/iphone.jpg',
    categoryId: 1,
  },
  {
    id: 2,
    name: 'Samsung Galaxy',
    price: 899,
    image: '/samsung.jpg',
    categoryId: 1,
  },
  {
    id: 3,
    name: 'T-Shirt',
    price: 29,
    imageUrl: '/tshirt.jpg',
    categoryId: 2,
  },
];

describe('ProductCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({push: mockPush});
    (useNotification as any).mockReturnValue({notify: mockNotify});
    (useCart as any).mockReturnValue({
      addToCart: mockAddToCart,
      cartIsLoading: false,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should show loading state initially', async () => {
    mockAxios.get.mockImplementation(() => new Promise(() => {}));

    render(<ProductCatalog />);

    expect(screen.getByText('Product Catalog')).toBeInTheDocument();
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('should fetch and display categories and products', async () => {
    mockAxios.get
      .mockResolvedValueOnce({data: mockCategories})
      .mockResolvedValueOnce({data: mockProducts});

    render(<ProductCatalog />);

    await waitFor(() => {
      expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
    expect(screen.getByText('iPhone 15')).toBeInTheDocument();
    expect(screen.getByText('Samsung Galaxy')).toBeInTheDocument();
    expect(screen.getByText('T-Shirt')).toBeInTheDocument();
  });

  it('should handle API error and show notification', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockAxios.get.mockRejectedValue(new Error('API Error'));

    render(<ProductCatalog />);

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'error',
        msg: 'Failed to load data',
      });
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to fetch data:',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it('should filter products by category when category is selected', async () => {
    mockAxios.get
      .mockResolvedValueOnce({data: mockCategories})
      .mockResolvedValueOnce({data: mockProducts})
      .mockResolvedValueOnce({
        data: mockProducts.filter(p => p.categoryId === 1),
      });

    render(<ProductCatalog />);

    await waitFor(() => {
      expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
    });

    const electronicsButton = screen.getByText('Electronics');
    fireEvent.click(electronicsButton);

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/products', {
        params: {categoryId: 1},
      });
    });
  });

  it('should search products by name', async () => {
    mockAxios.get
      .mockResolvedValueOnce({data: mockCategories})
      .mockResolvedValueOnce({data: mockProducts});

    render(<ProductCatalog />);

    await waitFor(() => {
      expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('custom-input-searchQuery');
    fireEvent.change(searchInput, {target: {value: 'iPhone'}});

    const form = searchInput.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'info',
        msg: 'Searching for: iPhone',
      });
    });

    expect(screen.getByText('iPhone 15')).toBeInTheDocument();
    expect(screen.queryByText('Samsung Galaxy')).not.toBeInTheDocument();
  });

  it('should handle empty search query', async () => {
    mockAxios.get
      .mockResolvedValueOnce({data: mockCategories})
      .mockResolvedValueOnce({data: mockProducts});

    render(<ProductCatalog />);

    await waitFor(() => {
      expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('custom-input-searchQuery');
    const form = searchInput.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'info',
        msg: 'Searching for: all products',
      });
    });
  });

  it('should add product to cart', async () => {
    mockAxios.get
      .mockResolvedValueOnce({data: mockCategories})
      .mockResolvedValueOnce({data: mockProducts});

    render(<ProductCatalog />);

    await waitFor(() => {
      expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
    });

    const addToCartButtons = screen.getAllByText('Add to Cart');
    fireEvent.click(addToCartButtons[0]);

    expect(mockAddToCart).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('should navigate to product detail page when product is clicked', async () => {
    mockAxios.get
      .mockResolvedValueOnce({data: mockCategories})
      .mockResolvedValueOnce({data: mockProducts});

    render(<ProductCatalog />);

    await waitFor(() => {
      expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
    });

    const productCard = screen.getAllByTestId('card')[0];
    fireEvent.click(productCard);

    expect(mockPush).toHaveBeenCalledWith('/products/1');
  });

  it('should handle pagination', async () => {
    const manyProducts = Array.from({length: 20}, (_, i) => ({
      id: i + 1,
      name: `Product ${i + 1}`,
      price: 100 + i,
      imageUrl: `/product${i + 1}.jpg`,
      categoryId: 1,
    }));

    mockAxios.get
      .mockResolvedValueOnce({data: mockCategories})
      .mockResolvedValueOnce({data: manyProducts});

    render(<ProductCatalog />);

    await waitFor(() => {
      expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-current')).toHaveTextContent('1');

    const nextButton = screen.getByTestId('pagination-next');
    fireEvent.click(nextButton);

    expect(screen.getByTestId('pagination-current')).toHaveTextContent('2');
  });

  it('should show disabled add to cart button when cart is loading', async () => {
    (useCart as any).mockReturnValue({
      addToCart: mockAddToCart,
      cartIsLoading: true,
    });

    mockAxios.get
      .mockResolvedValueOnce({data: mockCategories})
      .mockResolvedValueOnce({data: mockProducts});

    render(<ProductCatalog />);

    await waitFor(() => {
      expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
    });

    const addToCartButtons = screen.getAllByText('Add to Cart');
    expect(addToCartButtons[0]).toBeDisabled();
    expect(addToCartButtons[0]).toHaveAttribute('data-background', 'accent');
  });

  it('should handle "All" category selection', async () => {
    mockAxios.get
      .mockResolvedValueOnce({data: mockCategories})
      .mockResolvedValueOnce({data: mockProducts})
      .mockResolvedValueOnce({data: mockProducts});

    render(<ProductCatalog />);

    await waitFor(() => {
      expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
    });

    const allButton = screen.getByText('All');
    fireEvent.click(allButton);

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/products', {
        params: {},
      });
    });
  });

  it('should render product with fallback image', async () => {
    mockAxios.get
      .mockResolvedValueOnce({data: mockCategories})
      .mockResolvedValueOnce({data: mockProducts});

    render(<ProductCatalog />);

    await waitFor(() => {
      expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
    });

    const images = screen.getAllByTestId('next-image');
    expect(images[0]).toHaveAttribute('src', '/iphone.jpg');
    expect(images[1]).toHaveAttribute('src', '/samsung.jpg');
  });

  it('should prevent event propagation when clicking add to cart', async () => {
    mockAxios.get
      .mockResolvedValueOnce({data: mockCategories})
      .mockResolvedValueOnce({data: mockProducts});

    render(<ProductCatalog />);

    await waitFor(() => {
      expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
    });

    const addToCartButton = screen.getAllByText('Add to Cart')[0];
    const stopPropagationSpy = vi.fn();

    fireEvent.click(addToCartButton, {
      stopPropagation: stopPropagationSpy,
    });

    expect(mockAddToCart).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should render responsive grid columns', async () => {
    mockAxios.get
      .mockResolvedValueOnce({data: mockCategories})
      .mockResolvedValueOnce({data: mockProducts});

    render(<ProductCatalog />);

    await waitFor(() => {
      expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
    });

    const productCols = screen
      .getAllByTestId('col')
      .filter(col => col.getAttribute('data-xs') === '24');
    expect(productCols[0]).toHaveAttribute('data-xs', '24');
    expect(productCols[0]).toHaveAttribute('data-sm', '12');
    expect(productCols[0]).toHaveAttribute('data-md', '8');
    expect(productCols[0]).toHaveAttribute('data-lg', '6');
  });
});
