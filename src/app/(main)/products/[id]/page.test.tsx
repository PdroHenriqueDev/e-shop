import {render, screen, waitFor} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import {useParams} from 'next/navigation';
import axios from 'axios';
import {useCart} from '@/contexts/cartContext';
import ProductDetails from './page';

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
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

vi.mock('@/components/loading/loading', () => ({
  default: () => <div data-testid="loading-component">Loading...</div>,
}));

vi.mock('next/image', () => ({
  default: ({src, alt, fill, sizes, className}: any) => (
    <img
      data-testid="next-image"
      src={src ?? ''}
      alt={alt}
      data-fill={fill}
      data-sizes={sizes}
      className={className}
    />
  ),
}));

const mockAddToCart = vi.fn();
const mockAxios = axios as any;

const mockProduct = {
  id: 1,
  name: 'iPhone 15 Pro',
  description: 'Latest iPhone with advanced features',
  price: 999.99,
  imageUrl: '/iphone15.jpg',
};

describe('ProductDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useCart as any).mockReturnValue({
      addToCart: mockAddToCart,
      cartIsLoading: false,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should show loading state initially', () => {
    (useParams as any).mockReturnValue({id: '1'});
    mockAxios.get.mockImplementation(() => new Promise(() => {}));

    render(<ProductDetails />);

    expect(screen.getByTestId('loading-component')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should fetch and display product details', async () => {
    (useParams as any).mockReturnValue({id: '1'});
    mockAxios.get.mockResolvedValue({data: mockProduct});

    render(<ProductDetails />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
    });

    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    expect(
      screen.getByText('Latest iPhone with advanced features'),
    ).toBeInTheDocument();
    expect(screen.getByText('$999.99')).toBeInTheDocument();
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
  });

  it('should show "Product not found" when product is null', async () => {
    (useParams as any).mockReturnValue({id: '1'});
    mockAxios.get.mockResolvedValue({data: null});

    render(<ProductDetails />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Product not found')).toBeInTheDocument();
    expect(screen.queryByText('Add to Cart')).not.toBeInTheDocument();
  });

  it('should show "Product not found" when API returns undefined', async () => {
    (useParams as any).mockReturnValue({id: '1'});
    mockAxios.get.mockResolvedValue({data: undefined});

    render(<ProductDetails />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Product not found')).toBeInTheDocument();
  });

  it('should not fetch product when id is not provided', async () => {
    (useParams as any).mockReturnValue({});

    render(<ProductDetails />);

    // Wait for loading to finish
    await waitFor(
      () => {
        expect(
          screen.queryByTestId('loading-component'),
        ).not.toBeInTheDocument();
      },
      {timeout: 3000},
    );

    expect(mockAxios.get).not.toHaveBeenCalled();
    expect(screen.getByText('Product not found')).toBeInTheDocument();
  });

  it('should handle API error gracefully', async () => {
    (useParams as any).mockReturnValue({id: '1'});
    mockAxios.get.mockRejectedValue(new Error('API Error'));

    // Suppress console errors for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ProductDetails />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Product not found')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should call addToCart when Add to Cart button is clicked', async () => {
    (useParams as any).mockReturnValue({id: '1'});
    mockAxios.get.mockResolvedValue({data: mockProduct});

    render(<ProductDetails />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
    });

    const addToCartButton = screen.getByText('Add to Cart');
    addToCartButton.click();

    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  it('should disable Add to Cart button when cart is loading', async () => {
    (useParams as any).mockReturnValue({id: '1'});
    (useCart as any).mockReturnValue({
      addToCart: mockAddToCart,
      cartIsLoading: true,
    });
    mockAxios.get.mockResolvedValue({data: mockProduct});

    render(<ProductDetails />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
    });

    const addToCartButton = screen.getByTestId('custom-button');
    expect(addToCartButton).toBeDisabled();
    expect(addToCartButton).toHaveAttribute('data-background', 'accent');
  });

  it('should show secondary background when cart is not loading', async () => {
    (useParams as any).mockReturnValue({id: '1'});
    mockAxios.get.mockResolvedValue({data: mockProduct});

    render(<ProductDetails />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
    });

    const addToCartButton = screen.getByTestId('custom-button');
    expect(addToCartButton).not.toBeDisabled();
    expect(addToCartButton).toHaveAttribute('data-background', 'secondary');
  });

  it('should render product image with correct props', async () => {
    (useParams as any).mockReturnValue({id: '1'});
    mockAxios.get.mockResolvedValue({data: mockProduct});

    render(<ProductDetails />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
    });

    const productImage = screen.getByTestId('next-image');
    expect(productImage).toHaveAttribute('src', '/iphone15.jpg');
    expect(productImage).toHaveAttribute('alt', 'iPhone 15 Pro');
    expect(productImage).toHaveAttribute('data-fill', 'true');
    expect(productImage).toHaveAttribute(
      'data-sizes',
      '(max-width: 768px) 100vw, 50vw',
    );
    expect(productImage).toHaveClass('rounded-lg object-cover');
  });

  it('should handle product with empty imageUrl', async () => {
    const productWithoutImage = {...mockProduct, imageUrl: ''};
    (useParams as any).mockReturnValue({id: '1'});
    mockAxios.get.mockResolvedValue({data: productWithoutImage});

    render(<ProductDetails />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
    });

    const productImage = screen.getByTestId('next-image');
    expect(productImage).not.toHaveAttribute('src');
  });

  it('should format price correctly with two decimal places', async () => {
    const productWithWholePrice = {...mockProduct, price: 1000};
    (useParams as any).mockReturnValue({id: '1'});
    mockAxios.get.mockResolvedValue({data: productWithWholePrice});

    render(<ProductDetails />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
    });

    expect(screen.getByText('$1000.00')).toBeInTheDocument();
  });

  it('should call API with correct product ID', async () => {
    (useParams as any).mockReturnValue({id: '123'});
    mockAxios.get.mockResolvedValue({data: mockProduct});

    render(<ProductDetails />);

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/products/123');
    });
  });

  it('should render responsive grid layout', async () => {
    (useParams as any).mockReturnValue({id: '1'});
    mockAxios.get.mockResolvedValue({data: mockProduct});

    render(<ProductDetails />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
    });

    const container = screen.getByText('iPhone 15 Pro').closest('.container');
    expect(container).toHaveClass('mx-auto py-12 px-5');

    const grid = container?.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1 md:grid-cols-2 gap-8');
  });

  it('should handle product without description', async () => {
    const productWithoutDescription = {...mockProduct, description: undefined};
    (useParams as any).mockReturnValue({id: '1'});
    mockAxios.get.mockResolvedValue({data: productWithoutDescription});

    render(<ProductDetails />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-component')).not.toBeInTheDocument();
    });

    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    expect(screen.getByText('$999.99')).toBeInTheDocument();
    expect(
      screen.queryByText('Latest iPhone with advanced features'),
    ).not.toBeInTheDocument();
  });
});