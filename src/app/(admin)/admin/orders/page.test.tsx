import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import {vi} from 'vitest';
import OrdersManagement from './page';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('antd', () => ({
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
              {columns?.map((col: any, colIndex: number) => (
                <div
                  key={colIndex}
                  data-testid={`table-cell-${col.key || col.dataIndex}`}>
                  {col.render
                    ? col.render(item[col.dataIndex], item, index)
                    : item[col.dataIndex]}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  ),
  Button: ({children, onClick, icon, type}: any) => (
    <button data-testid="button" onClick={onClick} type={type}>
      {icon}
      {children}
    </button>
  ),
  Modal: ({title, open, onCancel, children, footer, width, className}: any) =>
    open ? (
      <div data-testid="modal" className={className} style={{width}}>
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-content">{children}</div>
        <button data-testid="modal-close" onClick={onCancel}>
          Close
        </button>
        {footer}
      </div>
    ) : null,
  Select: Object.assign(
    ({value, onChange, children, className}: any) => (
      <select
        data-testid="select"
        value={value}
        onChange={e => onChange(e.target.value)}
        className={className}>
        {children}
      </select>
    ),
    {
      Option: ({children, value}: any) => (
        <option value={value}>{children}</option>
      ),
    },
  ),
  Tag: ({children, color}: any) => (
    <span data-testid="tag" style={{color}}>
      {children}
    </span>
  ),
  message: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Descriptions: Object.assign(
    ({title, children, bordered}: any) => (
      <div data-testid="descriptions" data-bordered={bordered}>
        <div data-testid="descriptions-title">{title}</div>
        {children}
      </div>
    ),
    {
      Item: ({label, children}: any) => (
        <div data-testid="descriptions-item">
          <span data-testid="descriptions-label">{label}:</span>
          <span data-testid="descriptions-value">{children}</span>
        </div>
      ),
    },
  ),
}));

vi.mock('@ant-design/icons', () => ({
  EyeOutlined: () => <span data-testid="eye-icon">EyeIcon</span>,
}));

vi.mock('@/interfaces/admin', () => ({
  AdminOrder: {},
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockConsoleError = vi
  .spyOn(console, 'error')
  .mockImplementation(() => {});

describe('OrdersManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleError.mockClear();
  });

  it('should render orders management page with loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<OrdersManagement />);

    expect(screen.getByText('Orders Management')).toBeInTheDocument();
    expect(screen.getByTestId('table-loading')).toBeInTheDocument();
  });

  it('should fetch and display orders successfully', async () => {
    const mockOrders = [
      {
        id: '1',
        user: {name: 'John Doe', email: 'john@example.com'},
        total: 99.99,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
        items: [
          {
            id: '1',
            product: {name: 'Test Product'},
            quantity: 2,
            price: 49.99,
          },
        ],
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockOrders),
    } as Response);

    render(<OrdersManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/admin/orders');
  });

  it('should handle fetch orders failure gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    } as Response);

    render(<OrdersManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });
  });

  it('should handle fetch orders error gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<OrdersManagement />);

    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to fetch orders:',
        expect.any(Error),
      );
    });
  });

  it('should handle status update successfully', async () => {
    const mockOrders = [
      {
        id: '1',
        user: {name: 'John Doe', email: 'john@example.com'},
        total: 99.99,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
        items: [],
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOrders),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOrders),
      } as Response);

    render(<OrdersManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });

    const select = screen.getByTestId('select');
    fireEvent.change(select, {target: {value: 'processing'}});

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/orders/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({status: 'processing'}),
      });
    });
  });

  it('should handle status update failure', async () => {
    const mockOrders = [
      {
        id: '1',
        user: {name: 'John Doe', email: 'john@example.com'},
        total: 99.99,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
        items: [],
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOrders),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
      } as Response);

    render(<OrdersManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });

    const select = screen.getByTestId('select');
    fireEvent.change(select, {target: {value: 'processing'}});

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/orders/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({status: 'processing'}),
      });
    });
  });

  it('should handle status update error', async () => {
    const mockOrders = [
      {
        id: '1',
        user: {name: 'John Doe', email: 'john@example.com'},
        total: 99.99,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
        items: [],
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOrders),
      } as Response)
      .mockRejectedValue(new Error('Network error'));

    render(<OrdersManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });

    const select = screen.getByTestId('select');
    fireEvent.change(select, {target: {value: 'processing'}});

    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to update order status:',
        expect.any(Error),
      );
    });
  });

  it('should open and close order details modal', async () => {
    const mockOrders = [
      {
        id: '1',
        user: {name: 'John Doe', email: 'john@example.com'},
        total: 99.99,
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z',
        items: [
          {
            id: '1',
            product: {name: 'Test Product'},
            quantity: 2,
            price: 49.99,
          },
        ],
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockOrders),
    } as Response);

    render(<OrdersManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });

    const viewButton = screen.getByTestId('button');
    fireEvent.click(viewButton);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Order Details - #1')).toBeInTheDocument();

    const closeButton = screen.getByTestId('modal-close');
    fireEvent.click(closeButton);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should render with correct CSS classes', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<OrdersManagement />);

    const mainDiv =
      screen.getByText('Orders Management').parentElement?.parentElement;
    expect(mainDiv).toHaveClass('p-6', 'bg-primary', 'min-h-screen');

    const title = screen.getByText('Orders Management');
    expect(title).toHaveClass('text-2xl', 'font-bold', 'text-dark');
  });
});
