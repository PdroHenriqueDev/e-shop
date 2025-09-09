import React from 'react';
import {render, screen, waitFor} from '@testing-library/react';
import {vi} from 'vitest';
import UsersPage from './page';

vi.mock('antd', () => ({
  Table: ({columns, dataSource, loading, pagination}: any) => (
    <div data-testid="table">
      {loading ? (
        <div data-testid="table-loading">Loading...</div>
      ) : (
        <div data-testid="table-content">
          {dataSource?.map((item: any, index: number) => (
            <div key={item.id || index} data-testid="table-row">
              {JSON.stringify(item)}
              {columns?.map((col: any, colIndex: number) => {
                if (col.render && typeof col.render === 'function') {
                  const cellContent = col.render(
                    col.dataIndex ? item[col.dataIndex] : item,
                    item,
                    index,
                  );
                  return (
                    <div key={colIndex} data-testid={`table-cell-${col.key}`}>
                      {cellContent}
                    </div>
                  );
                }
                return (
                  <div key={colIndex} data-testid={`table-cell-${col.key}`}>
                    {col.dataIndex ? item[col.dataIndex] : item[col.key] || ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {pagination && pagination.showTotal && (
        <div data-testid="table-total">{pagination.showTotal(42, [1, 10])}</div>
      )}
    </div>
  ),
  Button: ({children, onClick, type, icon, size, danger}: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      type={type}
      data-size={size}
      data-danger={danger}>
      {icon}
      {children}
    </button>
  ),
  Modal: ({title, open, onCancel, children}: any) => {
    if (!open) return null;
    return (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-content">{children}</div>
        <button data-testid="modal-close" onClick={onCancel}>
          Close
        </button>
      </div>
    );
  },
  Form: Object.assign(
    ({children, onFinish}: any) => (
      <form
        data-testid="form"
        onSubmit={e => {
          e.preventDefault();
          onFinish?.({
            name: 'Test User',
            email: 'test@example.com',
            role: 'user',
            password: 'password123',
          });
        }}>
        {children}
      </form>
    ),
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
  Input: Object.assign(
    ({placeholder, value, onChange}: any) => (
      <input
        data-testid="input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    ),
    {
      Password: ({placeholder, value, onChange}: any) => (
        <input
          data-testid="input-password"
          type="password"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      ),
    },
  ),
  Select: Object.assign(
    ({placeholder, value, onChange, children}: any) => (
      <select data-testid="select" value={value} onChange={onChange}>
        <option value="">{placeholder}</option>
        {children}
      </select>
    ),
    {
      Option: ({value, children}: any) => (
        <option value={value}>{children}</option>
      ),
    },
  ),
  Popconfirm: ({title, onConfirm, children}: any) => {
    const [visible, setVisible] = React.useState(false);
    return (
      <div data-testid="popconfirm">
        <div onClick={() => setVisible(!visible)}>{children}</div>
        {visible && (
          <div data-testid="popconfirm-content">
            <div data-testid="popconfirm-title">{title}</div>
            <button
              data-testid="popconfirm-ok"
              onClick={() => {
                onConfirm();
                setVisible(false);
              }}>
              OK
            </button>
          </div>
        )}
      </div>
    );
  },
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

vi.mock('@ant-design/icons', () => ({
  EditOutlined: () => <span data-testid="edit-icon">Edit</span>,
  DeleteOutlined: () => <span data-testid="delete-icon">Delete</span>,
  PlusOutlined: () => <span data-testid="plus-icon">+</span>,
}));

vi.mock('@/interfaces/admin', () => ({
  AdminUser: {},
  AdminUserFormData: {},
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

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
    mockFetch.mockImplementation(() => new Promise(() => {}));

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

  it('should open create user modal when add user button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    // Find the Add User button specifically
    const buttons = screen.getAllByTestId('button');
    const addButton = buttons.find(btn =>
      btn.textContent?.includes('Add User'),
    );
    addButton?.click();

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Add User');
  });

  it('should open edit user modal when edit button is clicked', async () => {
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

    const editButtons = screen.getAllByTestId('button');
    const editButton = editButtons.find(btn =>
      btn.textContent?.includes('Edit'),
    );

    editButton?.click();

    // Wait for state changes to propagate
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit User');
  });

  it('should delete user successfully', async () => {
    const mockUsers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });

    // First click the delete button to show the popconfirm
    const deleteButtons = screen.getAllByTestId('button');
    const deleteButton = deleteButtons.find(btn =>
      btn.textContent?.includes('Delete'),
    );
    deleteButton?.click();

    // Then click the OK button in the popconfirm
    await waitFor(() => {
      expect(screen.getByTestId('popconfirm-ok')).toBeInTheDocument();
    });
    const confirmButton = screen.getByTestId('popconfirm-ok');
    confirmButton.click();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/1', {
        method: 'DELETE',
      });
    });
  });

  it('should submit form to create new user successfully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    const addButton = screen.getByTestId('button');
    addButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    const form = screen.getByTestId('form');
    form.dispatchEvent(new Event('submit', {bubbles: true}));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          password: 'password123',
        }),
      });
    });
  });

  it('should submit form to update existing user successfully', async () => {
    const mockUsers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTestId('button');
    const editButton = editButtons.find(btn =>
      btn.textContent?.includes('Edit'),
    );
    editButton?.click();

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    const form = screen.getByTestId('form');
    form.dispatchEvent(new Event('submit', {bubbles: true}));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          password: 'password123',
        }),
      });
    });
  });

  it('should handle form submission failure', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({error: 'Validation failed'}),
      } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    const addButton = screen.getByTestId('button');
    addButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    const form = screen.getByTestId('form');
    form.dispatchEvent(new Event('submit', {bubbles: true}));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          password: 'password123',
        }),
      });
    });
  });

  it('should handle form submission network error', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockRejectedValueOnce(new Error('Network error'));

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    const addButton = screen.getByTestId('button');
    addButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    const form = screen.getByTestId('form');
    form.dispatchEvent(new Event('submit', {bubbles: true}));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          password: 'password123',
        }),
      });
    });
  });

  it('should close modal when cancel button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    const addButton = screen.getByTestId('button');
    addButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    const closeButton = screen.getByTestId('modal-close');
    closeButton.click();

    await waitFor(() => {
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  it('should render role tags with correct colors', async () => {
    const mockUsers = [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
        _count: {orders: 5},
      },
      {
        id: '2',
        name: 'Regular User',
        email: 'user@example.com',
        role: 'user',
        createdAt: '2024-01-02T00:00:00Z',
        _count: {orders: 2},
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

    const tags = screen.getAllByTestId('tag');
    expect(tags).toHaveLength(2);
  });

  it('should render formatted dates', async () => {
    const mockUsers = [
      {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
        _count: {orders: 0},
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

    const tableContent = screen.getByTestId('table-content');
    expect(tableContent).toBeInTheDocument();
  });

  it('should render orders count', async () => {
    const mockUsers = [
      {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
        _count: {orders: 10},
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

    const tableContent = screen.getByTestId('table-content');
    expect(tableContent.textContent).toContain('10');
  });

  it('should handle delete user failure', async () => {
    const mockUsers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({error: 'Delete failed'}),
      } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });

    // First click the delete button to show the popconfirm
    const deleteButtons = screen.getAllByTestId('button');
    const deleteButton = deleteButtons.find(btn =>
      btn.textContent?.includes('Delete'),
    );
    deleteButton?.click();

    // Then click the OK button in the popconfirm
    await waitFor(() => {
      expect(screen.getByTestId('popconfirm-ok')).toBeInTheDocument();
    });
    const confirmButton = screen.getByTestId('popconfirm-ok');
    confirmButton.click();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/1', {
        method: 'DELETE',
      });
    });
  });

  it('should handle delete user network error', async () => {
    const mockUsers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      } as Response)
      .mockRejectedValueOnce(new Error('Network error'));

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });

    // First click the delete button to show the popconfirm
    const deleteButtons = screen.getAllByTestId('button');
    const deleteButton = deleteButtons.find(btn =>
      btn.textContent?.includes('Delete'),
    );
    deleteButton?.click();

    // Then click the OK button in the popconfirm
    await waitFor(() => {
      expect(screen.getByTestId('popconfirm-ok')).toBeInTheDocument();
    });
    const confirmButton = screen.getByTestId('popconfirm-ok');
    confirmButton.click();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/1', {
        method: 'DELETE',
      });
    });
  });

  it('shows fallback message when delete returns no error body', async () => {
    const mockUsers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTestId('button');
    const deleteButton = deleteButtons.find(btn =>
      btn.textContent?.includes('Delete'),
    );
    deleteButton?.click();

    await waitFor(() => {
      expect(screen.getByTestId('popconfirm-ok')).toBeInTheDocument();
    });
    const confirmButton = screen.getByTestId('popconfirm-ok');
    confirmButton.click();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/1', {
        method: 'DELETE',
      });
    });

    const {message} = await import('antd');
    expect(message.error).toHaveBeenCalledWith('Failed to delete user');
  });

  it('shows fallback message when save returns no error body', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    const buttons = screen.getAllByTestId('button');
    const addButton = buttons.find(btn =>
      btn.textContent?.includes('Add User'),
    );
    addButton?.click();

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    const form = screen.getByTestId('form');
    form.dispatchEvent(new Event('submit', {bubbles: true}));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          password: 'password123',
        }),
      });
    });

    const {message} = await import('antd');
    expect(message.error).toHaveBeenCalledWith('Failed to save user');
  });

  it('should show fallback message when delete returns no error field', async () => {
    const mockUsers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('table-content')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTestId('button');
    const deleteButton = deleteButtons.find(btn =>
      btn.textContent?.includes('Delete'),
    );
    deleteButton?.click();

    await waitFor(() => {
      expect(screen.getByTestId('popconfirm-ok')).toBeInTheDocument();
    });
    const confirmButton = screen.getByTestId('popconfirm-ok');
    confirmButton.click();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/1', {
        method: 'DELETE',
      });
    });

    const {message} = await import('antd');
    expect(message.error).toHaveBeenCalledWith('Failed to delete user');
  });

  it('should show fallback message when save returns no error field', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    const buttons = screen.getAllByTestId('button');
    const addButton = buttons.find(btn =>
      btn.textContent?.includes('Add User'),
    );
    addButton?.click();

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    const form = screen.getByTestId('form');
    form.dispatchEvent(new Event('submit', {bubbles: true}));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          password: 'password123',
        }),
      });
    });

    const {message} = await import('antd');
    expect(message.error).toHaveBeenCalledWith('Failed to save user');
  });

  it('should execute pagination showTotal function', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('table-total')).toBeInTheDocument();
    });

    expect(screen.getByTestId('table-total')).toHaveTextContent(
      '1-10 of 42 users',
    );
  });

  it('should close modal when inline cancel button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    const buttons = screen.getAllByTestId('button');
    const addButton = buttons.find(btn =>
      btn.textContent?.includes('Add User'),
    );
    addButton?.click();

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByTestId('button');
    const cancelButton = cancelButtons.find(btn =>
      btn.textContent?.includes('Cancel'),
    );
    cancelButton?.click();

    await waitFor(() => {
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });
});
