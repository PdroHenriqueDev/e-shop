import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import {vi} from 'vitest';
import ProductsPage from './page';

vi.mock('next/image', () => ({
  default: ({src, alt, ...props}: any) => (
    <img src={src} alt={alt} {...props} data-testid="next-image" />
  ),
}));

vi.mock('@/components/dataTable/dataTable', () => ({
  default: ({
    data,
    loading,
    onAdd,
    addButtonText,
    actions,
    columns,
    pagination,
  }: any) => {
    const showTotalResult = pagination?.showTotal
      ? pagination.showTotal(data?.length || 0, [
          1,
          Math.min(10, data?.length || 0),
        ])
      : null;

    return (
      <div data-testid="data-table">
        {onAdd && (
          <button data-testid="add-button" onClick={onAdd}>
            {addButtonText || 'Add'}
          </button>
        )}
        {loading ? (
          <div data-testid="table-loading">Loading...</div>
        ) : (
          <div data-testid="table-content">
            {data?.map((item: any, index: number) => (
              <div key={item.id || index} data-testid="table-row">
                {columns
                  ?.find((col: any) => col.key === 'imageUrl')
                  ?.render?.(item.imageUrl)}
                <span>{item.name}</span>
                <span>{item.price}</span>
                {actions && (
                  <div>
                    <button
                      data-testid={`edit-${item.id}`}
                      onClick={() => actions[0]?.onClick?.(item)}>
                      Edit
                    </button>
                    <button
                      data-testid={`delete-${item.id}`}
                      onClick={() => actions[1]?.onClick?.(item.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {showTotalResult && (
          <div data-testid="pagination-info">{showTotalResult}</div>
        )}
      </div>
    );
  },
  commonActions: {
    edit: (onClick: any) => ({
      label: 'Edit',
      onClick,
    }),
    delete: (onClick: any) => ({
      label: 'Delete',
      onClick,
    }),
  },
}));

vi.mock('antd', () => ({
  Button: ({children, onClick, ...props}: any) => (
    <button onClick={onClick} {...props} data-testid="button">
      {children}
    </button>
  ),
  Modal: ({children, open, onCancel, title, ...props}: any) =>
    open ? (
      <div data-testid="modal" {...props}>
        <div data-testid="modal-title">{title}</div>
        <button data-testid="modal-close" onClick={onCancel}>
          Close
        </button>
        {children}
      </div>
    ) : null,
  Form: Object.assign(
    ({children, onFinish, ...props}: any) => (
      <form
        data-testid="form"
        onSubmit={e => {
          e.preventDefault();
          onFinish?.({
            name: 'Test Product',
            price: 99.99,
            categoryId: '1',
            description: 'Test Description',
          });
        }}
        {...props}>
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
    (props: any) => <input data-testid="input" {...props} />,
    {
      TextArea: (props: any) => <textarea data-testid="textarea" {...props} />,
    },
  ),
  InputNumber: (props: any) => (
    <input type="number" data-testid="input-number" {...props} />
  ),
  Select: Object.assign(
    ({children, onChange, ...props}: any) => (
      <select
        data-testid="select"
        onChange={e => onChange?.(e.target.value)}
        {...props}>
        {children}
      </select>
    ),
    {
      Option: ({children, value}: any) => (
        <option value={value}>{children}</option>
      ),
    },
  ),
  Upload: ({children, onChange, fileList, ...props}: any) => (
    <div data-testid="upload" {...props}>
      <input
        type="file"
        onChange={e => {
          const files = Array.from(e.target.files || []);
          onChange?.({
            fileList: files.map((file, index) => ({
              uid: index,
              name: file.name,
              originFileObj: file,
            })),
          });
        }}
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

vi.mock('@ant-design/icons', () => ({
  PlusOutlined: () => <span data-testid="plus-icon">+</span>,
  UploadOutlined: () => <span data-testid="upload-icon">↑</span>,
}));

vi.mock('@/interfaces/admin', () => ({
  AdminProduct: {},
  AdminCategory: {},
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockConsoleError = vi
  .spyOn(console, 'error')
  .mockImplementation(() => {});

describe('ProductsPage', () => {
  const mockProducts = [
    {
      id: '1',
      name: 'Test Product 1',
      description: 'Test Description 1',
      price: 99.99,
      categoryId: '1',
      imageUrl: '/test1.jpg',
      category: {id: '1', name: 'Test Category 1'},
    },
    {
      id: '2',
      name: 'Test Product 2',
      description: 'Test Description 2',
      price: 149.99,
      categoryId: '2',
      imageUrl: '/test2.jpg',
      category: {id: '2', name: 'Test Category 2'},
    },
  ];

  const mockCategories = [
    {id: '1', name: 'Test Category 1'},
    {id: '2', name: 'Test Category 2'},
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render products page with loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<ProductsPage />);
    expect(screen.getByTestId('table-loading')).toBeInTheDocument();
  });

  it('should fetch products and categories successfully', async () => {
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
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/products');
      expect(mockFetch).toHaveBeenCalledWith('/api/categories');
    });
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
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/products');
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
      expect(mockFetch).toHaveBeenCalledWith('/api/categories');
    });
  });

  it('should handle fetch errors gracefully', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'));

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
      expect(screen.getByTestId('add-button')).toBeInTheDocument();
    });
  });

  it('should open modal when add button is clicked', async () => {
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
      expect(screen.getByTestId('add-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-button'));

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Add Product');
  });

  it('should close modal when cancel is clicked', async () => {
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
      expect(screen.getByTestId('add-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-button'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('modal-close'));
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should handle product creation successfully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('add-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-button'));

    fireEvent.submit(screen.getByTestId('form'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/products', {
        method: 'POST',
        body: expect.any(FormData),
      });
    });
  });

  it('should render image with placeholder fallback', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 99.99,
      imageUrl: null,
      category: {id: '1', name: 'Test Category'},
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockProduct]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });

    const images = screen.getAllByTestId('next-image');
    expect(images.length).toBeGreaterThan(0);

    const placeholderImage = images.find(img =>
      img.getAttribute('src')?.includes('/placeholder.jpg'),
    );
    expect(placeholderImage).toBeInTheDocument();
  });

  it('should handle product creation failure', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('add-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-button'));

    fireEvent.submit(screen.getByTestId('form'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/products', {
        method: 'POST',
        body: expect.any(FormData),
      });
    });
  });

  it('should handle product creation network error', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockRejectedValueOnce(new Error('Network error'));

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('add-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-button'));

    fireEvent.submit(screen.getByTestId('form'));

    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to submit product:',
        expect.any(Error),
      );
    });
  });

  it('should handle product deletion successfully', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 99.99,
      category: {id: '1', name: 'Test Category'},
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockProduct]),
      } as Response)
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

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-1'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/products/1', {
        method: 'DELETE',
      });
    });
  });

  it('should handle product deletion failure', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 99.99,
      category: {id: '1', name: 'Test Category'},
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockProduct]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-1'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/products/1', {
        method: 'DELETE',
      });
    });
  });

  it('should handle product deletion network error', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 99.99,
      category: {id: '1', name: 'Test Category'},
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockProduct]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockRejectedValueOnce(new Error('Network error'));

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-1'));

    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to delete product:',
        expect.any(Error),
      );
    });
  });

  it('should handle product edit', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 99.99,
      category: {id: '1', name: 'Test Category'},
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockProduct]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('edit-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('edit-1'));

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Edit Product')).toBeInTheDocument();
  });

  it('should handle product edit with image and cover fileList logic', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 99.99,
      image: 'test-image.jpg',
      description: 'Test description',
      categoryId: '1',
      category: {id: '1', name: 'Test Category'},
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockProduct]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('edit-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('edit-1'));

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Edit Product')).toBeInTheDocument();
  });

  it('should handle product edit without image', async () => {
    const mockProduct = {
      id: '2',
      name: 'Test Product No Image',
      price: 49.99,
      image: null,
      description: 'Test description',
      categoryId: '1',
      category: {id: '1', name: 'Test Category'},
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockProduct]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('edit-2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('edit-2'));

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Edit Product')).toBeInTheDocument();
  });

  it('should handle product update successfully', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 99.99,
      category: {id: '1', name: 'Test Category'},
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockProduct]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('edit-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('edit-1'));

    fireEvent.submit(screen.getByTestId('form'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/products/1', {
        method: 'PUT',
        body: expect.any(FormData),
      });
    });
  });

  it('should handle form submission without file upload', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{id: '1', name: 'Test Category'}]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('add-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-button'));

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    fireEvent.submit(screen.getByTestId('form'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/products', {
        method: 'POST',
        body: expect.any(FormData),
      });
    });
  });

  it('should render image in data table', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 99.99,
      imageUrl: 'test-image.jpg',
      category: {id: '1', name: 'Test Category'},
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockProduct]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByAltText('Product')).toBeInTheDocument();
    });
  });

  it('should render pagination with showTotal function', async () => {
    const mockProducts = Array.from({length: 15}, (_, i) => ({
      id: `${i + 1}`,
      name: `Test Product ${i + 1}`,
      price: 99.99,
      category: {id: '1', name: 'Test Category'},
    }));

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProducts),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });

  it('should render category options in select', async () => {
    const mockCategories = [
      {id: '1', name: 'Category 1'},
      {id: '2', name: 'Category 2'},
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('add-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-button'));

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  it('should handle form submission with file upload', async () => {
    const mockCategories = [{id: '1', name: 'Test Category'}];
    const mockFile = new File(['test'], 'test.jpg', {type: 'image/jpeg'});

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({id: '1', name: 'Test Product'}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{id: '1', name: 'Test Product'}]),
      } as Response);

    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('add-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-button'));

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    // Fill form fields
    const inputs = screen.getAllByTestId('input');
    fireEvent.change(inputs[0], {
      target: {value: 'Test Product'},
    });
    fireEvent.change(screen.getByTestId('textarea'), {
      target: {value: 'Test Description'},
    });
    fireEvent.change(screen.getByTestId('input-number'), {
      target: {value: 99.99},
    });

    // Simulate file upload
    const uploadComponent = screen.getByTestId('upload');
    const fileInput = uploadComponent.querySelector('input[type="file"]');
    fireEvent.change(fileInput!, {target: {files: [mockFile]}});

    // Submit form
    const submitButtons = screen.getAllByTestId('button');
    const submitButton = submitButtons.find(btn =>
      btn.textContent?.includes('Create'),
    );
    fireEvent.click(submitButton!);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/products',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        }),
      );
    });
  });
});
