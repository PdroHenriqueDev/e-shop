import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach, afterEach} from 'vitest';
import {useRouter} from 'next/navigation';
import axios from '@/lib/axios';
import {useNotification} from '@/contexts/notificationContext';
import CategoryPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('@/lib/axios', () => ({
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

vi.mock('@/components/card/card', () => ({
  default: ({variant, title, imageUrl, imageAlt, onClick, className}: any) => (
    <div
      data-testid="card"
      data-variant={variant}
      className={className}
      onClick={onClick}>
      <div data-testid="card-title">{title}</div>
      <img src={imageUrl} alt={imageAlt} data-testid="card-image" />
    </div>
  ),
}));

vi.mock('@/components/pageContainer/pageContainer', () => ({
  default: ({title, isLoading, loadingMessage, children}: any) => (
    <div data-testid="page-container">
      {title && <h1 data-testid="page-title">{title}</h1>}
      {isLoading ? (
        <div data-testid="loading-state">{loadingMessage}</div>
      ) : (
        children
      )}
    </div>
  ),
  EmptyState: ({title, message}: any) => (
    <div data-testid="empty-state">
      <div data-testid="empty-title">{title}</div>
      <div data-testid="empty-message">{message}</div>
    </div>
  ),
}));

vi.mock('@/components/loading/loading', () => ({
  default: () => <div data-testid="suspense-loading">Loading...</div>,
}));

vi.mock('antd', () => ({
  Row: ({children, gutter, justify}: any) => (
    <div
      data-testid="row"
      data-gutter={JSON.stringify(gutter)}
      data-justify={justify}>
      {children}
    </div>
  ),
  Col: ({children, xs, sm, md, lg}: any) => (
    <div data-testid="col" data-xs={xs} data-sm={sm} data-md={md} data-lg={lg}>
      {children}
    </div>
  ),
}));

const mockPush = vi.fn();
const mockNotify = vi.fn();
const mockAxios = axios as any;

describe('CategoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({push: mockPush});
    (useNotification as any).mockReturnValue({notify: mockNotify});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render loading state during data fetch', async () => {
    mockAxios.get.mockImplementation(() => new Promise(() => {}));

    render(<CategoryPage />);

    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByText('Loading categories...')).toBeInTheDocument();
    });
  });

  it('should render empty state when no categories', async () => {
    mockAxios.get.mockResolvedValue({data: []});

    render(<CategoryPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No Categories Found')).toBeInTheDocument();
    });
  });

  it('should render page title and loading state', async () => {
    mockAxios.get.mockImplementation(() => new Promise(() => {}));

    render(<CategoryPage />);

    await waitFor(() => {
      expect(screen.getByTestId('page-title')).toBeInTheDocument();
      expect(screen.getByText('Browse Categories')).toBeInTheDocument();
      expect(screen.getByText('Loading categories...')).toBeInTheDocument();
    });
  });

  it('should fetch and display categories successfully', async () => {
    const mockCategories = [
      {id: 1, name: 'Electronics'},
      {id: 2, name: 'Clothing'},
      {id: 3, name: 'Accessories'},
    ];

    mockAxios.get.mockResolvedValue({data: mockCategories});

    render(<CategoryPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
    expect(screen.getByText('Accessories')).toBeInTheDocument();
    expect(screen.getAllByTestId('card')).toHaveLength(3);
  });

  it('should show empty state when no categories found', async () => {
    mockAxios.get.mockResolvedValue({data: []});

    render(<CategoryPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No Categories Found')).toBeInTheDocument();
    expect(
      screen.getByText('There are no categories available at the moment.'),
    ).toBeInTheDocument();
  });

  it('should handle API error and show notification', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockAxios.get.mockRejectedValue(new Error('API Error'));

    render(<CategoryPage />);

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'error',
        msg: 'Failed to load categories',
      });
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to fetch categories:',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it('should navigate to category page when card is clicked', async () => {
    const mockCategories = [{id: 1, name: 'Electronics'}];
    mockAxios.get.mockResolvedValue({data: mockCategories});

    render(<CategoryPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });

    const card = screen.getByTestId('card');
    fireEvent.click(card);

    expect(mockPush).toHaveBeenCalledWith('/categories/1');
  });

  it('should render cards with correct variant and className', async () => {
    const mockCategories = [{id: 1, name: 'Electronics'}];
    mockAxios.get.mockResolvedValue({data: mockCategories});

    render(<CategoryPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });

    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('data-variant', 'category');
    expect(card).toHaveClass('h-full');
  });

  it('should generate correct icon for Electronics category', async () => {
    const mockCategories = [{id: 1, name: 'Electronics'}];
    mockAxios.get.mockResolvedValue({data: mockCategories});

    render(<CategoryPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });

    const cardImage = screen.getByTestId('card-image') as HTMLImageElement;
    expect(cardImage.src).toContain('%F0%9F%93%B1');
  });

  it('should generate correct icon for Clothing category', async () => {
    const mockCategories = [{id: 1, name: 'Clothing'}];
    mockAxios.get.mockResolvedValue({data: mockCategories});

    render(<CategoryPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });

    const cardImage = screen.getByTestId('card-image') as HTMLImageElement;
    expect(cardImage.src).toContain('%F0%9F%91%95');
  });

  it('should generate correct icon for Accessories category', async () => {
    const mockCategories = [{id: 1, name: 'Accessories'}];
    mockAxios.get.mockResolvedValue({data: mockCategories});

    render(<CategoryPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });

    const cardImage = screen.getByTestId('card-image') as HTMLImageElement;
    expect(cardImage.src).toContain('%F0%9F%91%9C');
  });

  it('should generate default icon for unknown category', async () => {
    const mockCategories = [{id: 1, name: 'Unknown Category'}];
    mockAxios.get.mockResolvedValue({data: mockCategories});

    render(<CategoryPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });

    const cardImage = screen.getByTestId('card-image') as HTMLImageElement;
    expect(cardImage.src).toContain('%F0%9F%93%A6');
  });

  it('should render responsive grid columns with correct props', async () => {
    const mockCategories = [{id: 1, name: 'Electronics'}];
    mockAxios.get.mockResolvedValue({data: mockCategories});

    render(<CategoryPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });

    const col = screen.getByTestId('col');
    expect(col).toHaveAttribute('data-xs', '24');
    expect(col).toHaveAttribute('data-sm', '12');
    expect(col).toHaveAttribute('data-md', '8');
    expect(col).toHaveAttribute('data-lg', '6');
  });

  it('should render row with correct gutter and justify props', async () => {
    const mockCategories = [{id: 1, name: 'Electronics'}];
    mockAxios.get.mockResolvedValue({data: mockCategories});

    render(<CategoryPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });

    const row = screen.getByTestId('row');
    expect(row).toHaveAttribute('data-gutter', '[16,16]');
    expect(row).toHaveAttribute('data-justify', 'center');
  });

  it('should call axios with correct endpoint', async () => {
    mockAxios.get.mockResolvedValue({data: []});

    render(<CategoryPage />);

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/categories');
    });
  });

  it('should fetch categories after component is mounted', async () => {
    mockAxios.get.mockResolvedValue({data: []});

    render(<CategoryPage />);

    await waitFor(() => {
      expect(mockAxios.get).toHaveBeenCalledWith('/api/categories');
    });
  });
});
