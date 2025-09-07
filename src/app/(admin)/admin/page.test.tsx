import {render, screen, waitFor} from '@testing-library/react';
import {vi} from 'vitest';
import AdminDashboard from './page';

// Mock Antd components
vi.mock('antd', () => ({
  Card: ({children, title, className}: any) => (
    <div data-testid="card" className={className}>
      {title && <div data-testid="card-title">{title}</div>}
      {children}
    </div>
  ),
  Col: ({children, className}: any) => (
    <div data-testid="col" className={className}>
      {children}
    </div>
  ),
  Row: ({children, className}: any) => (
    <div data-testid="row" className={className}>
      {children}
    </div>
  ),
  Statistic: ({title, value, prefix, loading, valueStyle}: any) => (
    <div data-testid="statistic">
      <div data-testid="statistic-title">{title}</div>
      <div data-testid="statistic-value" style={valueStyle}>
        {loading ? 'Loading...' : value}
      </div>
      {prefix && <div data-testid="statistic-prefix">{prefix}</div>}
    </div>
  ),
  Table: ({
    columns,
    dataSource,
    loading,
    rowKey,
    pagination,
    className,
  }: any) => (
    <div data-testid="table" className={className}>
      {loading ? (
        <div data-testid="table-loading">Loading...</div>
      ) : (
        <div data-testid="table-content">
          {dataSource?.map((item: any, index: number) => (
            <div key={item[rowKey] || index} data-testid="table-row">
              {JSON.stringify(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  ),
  Tag: ({children, color}: any) => (
    <span data-testid="tag" style={{color}}>
      {children}
    </span>
  ),
}));

// Mock Antd icons
vi.mock('@ant-design/icons', () => ({
  ShoppingOutlined: () => <span data-testid="shopping-icon">ShoppingIcon</span>,
  UserOutlined: () => <span data-testid="user-icon">UserIcon</span>,
  DollarOutlined: () => <span data-testid="dollar-icon">DollarIcon</span>,
  OrderedListOutlined: () => (
    <span data-testid="ordered-list-icon">OrderedListIcon</span>
  ),
}));

// Mock constants
vi.mock('@/constants', () => ({
  ORDER_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },
}));

// Mock interfaces
vi.mock('@/interfaces/admin', () => ({
  AdminDashboardStats: {},
  AdminRecentOrder: {},
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.error
const mockConsoleError = vi
  .spyOn(console, 'error')
  .mockImplementation(() => {});

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleError.mockClear();
  });

  it('should render dashboard with loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AdminDashboard />);

    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    expect(screen.getAllByText('Loading...')).toHaveLength(5); // 4 statistics + 1 table
  });

  it('should fetch and display dashboard data successfully', async () => {
    const mockStats = {
      totalUsers: 100,
      totalProducts: 50,
      totalOrders: 25,
      totalRevenue: 1500.75,
    };

    const mockOrders = [
      {
        id: '1',
        user: 'John Doe',
        total: 99.99,
        status: 'completed',
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        user: 'Jane Smith',
        total: 149.5,
        status: 'pending',
        createdAt: '2024-01-02T00:00:00Z',
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOrders),
      } as Response);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument(); // Total Users
      expect(screen.getByText('50')).toBeInTheDocument(); // Total Products
      expect(screen.getByText('25')).toBeInTheDocument(); // Total Orders
      expect(screen.getByText('1500.75')).toBeInTheDocument(); // Total Revenue
    });

    // Check if orders are displayed
    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/admin/stats');
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/orders/recent');
  });

  it('should handle stats API failure gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getAllByText('0')).toHaveLength(4); // Default stats values
    });
  });

  it('should handle orders API failure gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            totalUsers: 10,
            totalProducts: 5,
            totalOrders: 2,
            totalRevenue: 100,
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
      } as Response);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    // Orders table should be empty
    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });
  });

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to fetch dashboard data:',
        expect.any(Error),
      );
    });

    // Should show default values
    await waitFor(() => {
      expect(screen.getAllByText('0')).toHaveLength(4); // All 4 statistics should show 0
    });
  });

  it('should render statistics with correct icons and styling', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            totalUsers: 1,
            totalProducts: 2,
            totalOrders: 3,
            totalRevenue: 4.56,
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      expect(screen.getByTestId('shopping-icon')).toBeInTheDocument();
      expect(screen.getByTestId('ordered-list-icon')).toBeInTheDocument();
      expect(screen.getByTestId('dollar-icon')).toBeInTheDocument();
    });

    // Check statistic titles
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Total Products')).toBeInTheDocument();
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('should render recent orders table with correct data', async () => {
    const mockOrders = [
      {
        id: 'order-1',
        user: 'Test User',
        total: 123.45,
        status: 'completed',
        createdAt: '2024-01-01T12:00:00Z',
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            totalUsers: 0,
            totalProducts: 0,
            totalOrders: 0,
            totalRevenue: 0,
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOrders),
      } as Response);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent Orders')).toBeInTheDocument();
      expect(screen.getByTestId('table')).toBeInTheDocument();
    });
  });

  it('should render with correct CSS classes and styling', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<AdminDashboard />);

    const mainDiv = screen.getByText('Dashboard Overview').parentElement;
    expect(mainDiv).toHaveClass('p-6', 'bg-primary', 'min-h-screen');

    const title = screen.getByText('Dashboard Overview');
    expect(title).toHaveClass('text-2xl', 'font-bold', 'mb-6', 'text-dark');
  });
});
