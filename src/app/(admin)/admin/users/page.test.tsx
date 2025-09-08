import {render, screen, waitFor} from '@testing-library/react';
import {vi} from 'vitest';
import UsersPage from './page';

// Mock Antd components with minimal implementation
vi.mock('antd', () => ({
  Table: ({columns, dataSource, loading}: any) => (
    <div data-testid="table">
      {loading ? (
        <div data-testid="table-loading">Loading...</div>
      ) : (
        <div data-testid="table-content">
          {dataSource?.map((item: any, index: number) => (
            <div key={item.id || index} data-testid="table-row">
              {JSON.stringify(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  ),
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
  Select: ({placeholder, value, onChange, children}: any) => (
    <select data-testid="select" value={value} onChange={onChange}>
      <option value="">{placeholder}</option>
      {children}
    </select>
  ),
  Popconfirm: ({title, onConfirm, children}: any) => (
    <div data-testid="popconfirm">
      <div data-testid="popconfirm-title">{title}</div>
      <button data-testid="popconfirm-ok" onClick={onConfirm}>
        OK
      </button>
      {children}
    </div>
  ),
  Tag: ({children, color}: any) => (
    <span data-testid="tag" style={{color}}>
      {children}
    </span>
  ),
  Space: ({children}: any) => <div data-testid="space">{children}</div>,
  Card: ({title, children}: any) => (
    <div data-testid="card">
      <div data-testid="card-title">{title}</div>
      {children}
    </div>
  ),
  message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Antd icons
vi.mock('@ant-design/icons', () => ({
  EditOutlined: () => <span data-testid="edit-icon">Edit</span>,
  DeleteOutlined: () => <span data-testid="delete-icon">Delete</span>,
  PlusOutlined: () => <span data-testid="plus-icon">+</span>,
}));

// Mock interfaces
vi.mock('@/interfaces/admin', () => ({
  AdminUser: {},
  AdminUserFormData: {},
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.error
const mockConsoleError = vi
  .spyOn(console, 'error')
  .mockImplementation(() => {});

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleError.mockClear();
  });

  it('should render users page with loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<UsersPage />);

    expect(screen.getByTestId('table-loading')).toBeInTheDocument();
  });

  it('should fetch users successfully', async () => {
    const mockUsers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUsers),
    } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/admin/users');
  });

  it('should handle fetch users failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });
  });

  it('should handle fetch users error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });
  });

  it('should render add user button', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });
  });
});
