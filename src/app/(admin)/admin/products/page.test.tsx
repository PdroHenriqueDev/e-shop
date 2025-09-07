import {render, screen, waitFor} from '@testing-library/react';
import {vi} from 'vitest';
import ProductsPage from './page';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({src, alt, width, height}: any) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      data-testid="image"
    />
  ),
}));

// Mock DataTable component
vi.mock('@/components/dataTable/dataTable', () => ({
  default: ({data, loading, onAdd, addButtonText}: any) => (
    <div data-testid="data-table">
      {onAdd && (
        <button data-testid="button" onClick={onAdd}>
          {addButtonText || 'Add'}
        </button>
      )}
      {loading ? (
        <div data-testid="table-loading">Loading...</div>
      ) : (
        <div data-testid="table-content">
          {data?.map((item: any, index: number) => (
            <div key={item.id || index} data-testid="table-row">
              {JSON.stringify(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  ),
  commonActions: {
    edit: (onClick: any) => ({
      key: 'edit',
      label: 'Edit',
      onClick,
    }),
    delete: (onClick: any) => ({
      key: 'delete',
      label: 'Delete',
      onClick,
    }),
  },
}));

// Mock Antd components with minimal implementation
vi.mock('antd', () => ({
  Button: ({children, onClick, type, icon}: any) => (
    <button data-testid="button" onClick={onClick} type={type}>
      {icon}
      {children}
    </button>
  ),
  Modal: ({title, open, onCancel, children}: any) =>
    open ? (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-content">{children}</div>
        <button data-testid="modal-close" onClick={onCancel}>
          Close
        </button>
      </div>
    ) : null,
  Form: Object.assign(
    ({children}: any) => <form data-testid="form">{children}</form>,
    {
      useForm: () => [
        {
          resetFields: vi.fn(),
          setFieldsValue: vi.fn(),
          validateFields: vi.fn().mockResolvedValue({}),
        },
      ],
      Item: ({children, label}: any) => (
        <div data-testid="form-item">
          <label>{label}</label>
          {children}
        </div>
      ),
    },
  ),
  Input: ({placeholder, value, onChange}: any) => (
    <input
      data-testid="input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  ),
  InputNumber: ({placeholder, value, onChange, min}: any) => (
    <input
      data-testid="input-number"
      type="number"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      min={min}
    />
  ),
  Select: ({placeholder, value, onChange, children}: any) => (
    <select data-testid="select" value={value} onChange={onChange}>
      <option value="">{placeholder}</option>
      {children}
    </select>
  ),
  Upload: ({children, fileList, onChange}: any) => (
    <div data-testid="upload">
      <input
        type="file"
        data-testid="file-input"
        onChange={e => onChange?.({fileList: Array.from(e.target.files || [])})}
      />
      {children}
    </div>
  ),
  Space: ({children}: any) => <div data-testid="space">{children}</div>,
  message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Antd icons
vi.mock('@ant-design/icons', () => ({
  PlusOutlined: () => <span data-testid="plus-icon">+</span>,
  UploadOutlined: () => <span data-testid="upload-icon">Upload</span>,
}));

// Mock interfaces
vi.mock('@/interfaces/admin', () => ({
  AdminProduct: {},
  AdminCategory: {},
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.error
const mockConsoleError = vi
  .spyOn(console, 'error')
  .mockImplementation(() => {});

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleError.mockClear();
  });

  it('should render products page with loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ProductsPage />);

    expect(screen.getByTestId('table-loading')).toBeInTheDocument();
  });

  it('should fetch products and categories successfully', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product',
        price: 99.99,
        category: {id: '1', name: 'Test Category'},
        stock: 10,
        description: 'Test description',
        images: ['test.jpg'],
      },
    ];

    const mockCategories = [{id: '1', name: 'Test Category'}];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProducts),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/admin/products');
    expect(mockFetch).toHaveBeenCalledWith('/api/categories');
  });

  it('should handle fetch products failure', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });
  });

  it('should handle fetch categories failure', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });
  });

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<ProductsPage />);

    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to fetch products:',
        expect.any(Error),
      );
    });
  });

  it('should render add product button', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });
  });
});
