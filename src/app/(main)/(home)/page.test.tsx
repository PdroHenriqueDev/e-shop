import {render, screen, waitFor} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import axios from 'axios';
import Home from './page';

vi.mock('axios');
vi.mock('next/link', () => ({
  default: ({children, href}: {children: React.ReactNode; href: string}) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  ),
}));

vi.mock('@/components/customButtton/customButton', () => ({
  default: ({buttonText, backgroundColor, textColor}: any) => (
    <button
      data-testid="custom-button"
      data-background={backgroundColor}
      data-text-color={textColor}>
      {buttonText}
    </button>
  ),
}));

vi.mock('@/components/loading/loading', () => ({
  default: () => <div data-testid="loading">Loading...</div>,
}));

vi.mock('@/components/card/card', () => ({
  default: ({
    title,
    price,
    imageUrl,
    imageAlt,
    onClick,
    variant,
    className,
  }: any) => (
    <div
      data-testid="card"
      data-variant={variant}
      className={className}
      onClick={onClick}>
      <div data-testid="card-title">{title}</div>
      <div data-testid="card-price">{price}</div>
      <img src={imageUrl} alt={imageAlt} data-testid="card-image" />
    </div>
  ),
}));

vi.mock('antd', () => ({
  Row: ({children, className}: any) => (
    <div data-testid="row" className={className}>
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
}));

vi.mock('antd/es/layout/layout', () => ({
  Footer: ({children, className}: any) => (
    <footer data-testid="footer" className={className}>
      {children}
    </footer>
  ),
}));

const mockAxios = axios as any;

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: {href: ''},
      writable: true,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render welcome section with correct content', () => {
    mockAxios.get.mockResolvedValue({data: []});

    render(<Home />);

    expect(screen.getByText('Welcome to E-Shop!')).toBeInTheDocument();
    expect(
      screen.getByText('Check out our exclusive offers!'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    expect(screen.getByTestId('custom-button')).toHaveAttribute(
      'data-background',
      'dark',
    );
    expect(screen.getByTestId('custom-button')).toHaveAttribute(
      'data-text-color',
      'primary',
    );
    expect(screen.getByText('Shop Now')).toBeInTheDocument();
  });

  it('should render shop now link with correct href', () => {
    mockAxios.get.mockResolvedValue({data: []});

    render(<Home />);

    const links = screen.getAllByTestId('link');
    const shopNowLink = links.find(
      link => link.getAttribute('href') === '/products/catalog',
    );
    expect(shopNowLink).toBeInTheDocument();
    expect(shopNowLink).toHaveAttribute('href', '/products/catalog');
  });

  it('should show loading state initially', () => {
    mockAxios.get.mockImplementation(() => new Promise(() => {}));

    render(<Home />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Featured Products')).toBeInTheDocument();
  });

  it('should fetch and display products successfully', async () => {
    const mockProducts = [
      {
        id: 1,
        name: 'Product 1',
        price: 99.99,
        imageUrl: 'https://example.com/image1.jpg',
      },
      {
        id: 2,
        name: 'Product 2',
        price: 149.99,
        imageUrl: 'https://example.com/image2.jpg',
      },
    ];

    mockAxios.get.mockResolvedValue({data: mockProducts});

    render(<Home />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getAllByTestId('card')).toHaveLength(2);
  });

  it('should handle API error gracefully', async () => {
    mockAxios.get.mockRejectedValue(new Error('API Error'));

    render(<Home />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId('card')).not.toBeInTheDocument();
  });

  it('should use placeholder image when product imageUrl is missing', async () => {
    const mockProducts = [
      {
        id: 1,
        name: 'Product Without Image',
        price: 99.99,
        imageUrl: null,
      },
    ];

    mockAxios.get.mockResolvedValue({data: mockProducts});

    render(<Home />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const cardImage = screen.getByTestId('card-image');
    expect(cardImage).toHaveAttribute('src', 'https://via.placeholder.com/300');
  });

  it('should navigate to product page when card is clicked', async () => {
    const mockProducts = [
      {
        id: 1,
        name: 'Product 1',
        price: 99.99,
        imageUrl: 'https://example.com/image1.jpg',
      },
    ];

    mockAxios.get.mockResolvedValue({data: mockProducts});

    render(<Home />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const card = screen.getByTestId('card');
    card.click();

    expect(window.location.href).toBe('/products/1');
  });

  it('should render footer with current year', () => {
    mockAxios.get.mockResolvedValue({data: []});
    const currentYear = new Date().getFullYear();

    render(<Home />);

    expect(
      screen.getByText(`© ${currentYear} E-Shop. All rights reserved.`),
    ).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('should render responsive grid columns with correct props', async () => {
    const mockProducts = [
      {
        id: 1,
        name: 'Product 1',
        price: 99.99,
        imageUrl: 'https://example.com/image1.jpg',
      },
    ];

    mockAxios.get.mockResolvedValue({data: mockProducts});

    render(<Home />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const col = screen
      .getAllByTestId('col')
      .find(
        col =>
          col.getAttribute('data-xs') === '24' &&
          col.getAttribute('data-sm') === '12' &&
          col.getAttribute('data-md') === '8' &&
          col.getAttribute('data-lg') === '6',
      );
    expect(col).toBeInTheDocument();
  });

  it('should render card with correct variant and className', async () => {
    const mockProducts = [
      {
        id: 1,
        name: 'Product 1',
        price: 99.99,
        imageUrl: 'https://example.com/image1.jpg',
      },
    ];

    mockAxios.get.mockResolvedValue({data: mockProducts});

    render(<Home />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('data-variant', 'product');
    expect(card).toHaveClass('h-80');
  });

  it('should call axios with correct endpoint', () => {
    mockAxios.get.mockResolvedValue({data: []});

    render(<Home />);

    expect(mockAxios.get).toHaveBeenCalledWith('/api/products');
  });
});