import React from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import AdminDashboard from './page';

vi.mock('antd', () => ({
  Card: ({children, title}: any) => (
    <div data-testid="card">
      <div data-testid="card-title">{title}</div>
      {children}
    </div>
  ),
  Statistic: ({title, value, prefix}: any) => (
    <div data-testid="statistic">
      <div data-testid="statistic-title">{title}</div>
      <div data-testid="statistic-value">{value}</div>
      <div data-testid="statistic-prefix">{prefix}</div>
    </div>
  ),
  Table: ({dataSource, columns, loading}: any) => (
    <div data-testid="table">
      <div data-testid="table-content">
        {loading ? 'Loading...' : dataSource?.length || 0} items
      </div>
      {dataSource?.map((item: any, idx: number) => (
        <div key={item.id || idx} data-testid="table-row">
          <div data-testid="status-cell">
            {columns
              ?.find((c: any) => c.key === 'status')
              ?.render?.(item.status)}
          </div>
          <div data-testid="total-cell">
            {columns?.find((c: any) => c.key === 'total')?.render?.(item.total)}
          </div>
          <div data-testid="date-cell">
            {columns
              ?.find((c: any) => c.key === 'createdAt')
              ?.render?.(item.createdAt)}
          </div>
        </div>
      ))}
    </div>
  ),
  Row: ({children}: any) => <div data-testid="row">{children}</div>,
  Col: ({children}: any) => <div data-testid="col">{children}</div>,
  Tag: ({color, children, ...props}: any) => (
    <span data-testid="tag" data-color={color} {...props}>
      {children}
    </span>
  ),
}));

vi.mock('@ant-design/icons', () => ({
  UserOutlined: () => <span data-testid="user-icon">UserIcon</span>,
  OrderedListOutlined: () => <span data-testid="list-icon">ListIcon</span>,
  ShoppingOutlined: () => <span data-testid="shopping-icon">ShoppingIcon</span>,
  DollarOutlined: () => <span data-testid="dollar-icon">DollarIcon</span>,
}));

vi.mock('@/constants', () => ({
  ORDER_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    CONFIRMED: 'confirmed',
    PAID: 'paid',
    COMPLETED: 'completed',
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<AdminDashboard />);

    expect(screen.getByText(/Loading\.\.\./)).toBeInTheDocument();
  });

  it('should render dashboard structure', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<AdminDashboard />);

    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Total Products')).toBeInTheDocument();
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Recent Orders')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const mockConsoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockFetch.mockRejectedValue(new Error('API Error'));

    render(<AdminDashboard />);

    await waitFor(
      () => {
        expect(mockConsoleError).toHaveBeenCalled();
      },
      {timeout: 3000},
    );

    mockConsoleError.mockRestore();
  });

  it('should render icons correctly', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<AdminDashboard />);

    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    expect(screen.getByTestId('list-icon')).toBeInTheDocument();
    expect(screen.getByTestId('shopping-icon')).toBeInTheDocument();
    expect(screen.getByTestId('dollar-icon')).toBeInTheDocument();
  });

  it('should have proper component structure', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<AdminDashboard />);

    expect(screen.getAllByTestId('card')).toHaveLength(5);
    expect(screen.getAllByTestId('statistic')).toHaveLength(4);
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('should display initial values', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<AdminDashboard />);

    const statisticValues = screen.getAllByTestId('statistic-value');
    expect(statisticValues).toHaveLength(4);
    statisticValues.forEach(value => {
      expect(value.textContent).toMatch(/^(0|Loading\.\.\.)$/);
    });
  });

  it('should render Status tag with correct color and text for all branches', async () => {
    const mockStats = {
      totalUsers: 100,
      totalProducts: 50,
      totalOrders: 25,
      totalRevenue: 1000,
    };

    const mockOrders = [
      {
        id: '1',
        user: 'John Doe',
        total: 99.99,
        status: 'completed',
        createdAt: '2024-01-01',
      },
      {
        id: '2',
        user: 'Jane Smith',
        total: 149.99,
        status: 'pending',
        createdAt: '2024-01-02',
      },
      {
        id: '3',
        user: 'Bob Johnson',
        total: 199.99,
        status: 'failed',
        createdAt: '2024-01-03',
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

    await waitFor(() =>
      expect(screen.getByTestId('table')).toBeInTheDocument(),
    );

    const tags = screen.getAllByTestId('tag');
    expect(tags).toHaveLength(3);

    expect(tags[0]).toHaveAttribute('data-color', 'green');
    expect(tags[0]).toHaveTextContent('COMPLETED');

    expect(tags[1]).toHaveAttribute('data-color', 'orange');
    expect(tags[1]).toHaveTextContent('PENDING');

    expect(tags[2]).toHaveAttribute('data-color', 'red');
    expect(tags[2]).toHaveTextContent('FAILED');
  });

  it('renders formatted total and date cells', async () => {
    const stats = {
      totalUsers: 0,
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
    };
    const row = {
      id: 't1',
      user: 'Any',
      total: 123.456,
      status: 'completed',
      createdAt: '2024-01-05T00:00:00.000Z',
    };
    const expectedDate = new Date(row.createdAt).toLocaleDateString();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(stats),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([row]),
      } as Response);

    render(<AdminDashboard />);

    await waitFor(() =>
      expect(screen.getByTestId('table')).toBeInTheDocument(),
    );

    expect(screen.getByTestId('total-cell')).toHaveTextContent('$123.46');

    expect(screen.getByTestId('date-cell')).toHaveTextContent(expectedDate);
  });
});
