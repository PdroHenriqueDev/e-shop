import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import DataTable, {commonActions, StatusTag} from './dataTable';

vi.mock('antd', () => ({
  Table: ({
    dataSource,
    columns,
    loading,
    pagination,
    rowSelection,
    rowKey,
  }: any) => (
    <div data-testid="ant-table">
      <div data-testid="table-loading">
        {loading ? 'Loading...' : 'Not Loading'}
      </div>
      <div data-testid="table-pagination">
        {pagination === false ? 'No Pagination' : 'Has Pagination'}
      </div>
      <div data-testid="table-row-selection">
        {rowSelection ? 'Has Row Selection' : 'No Row Selection'}
      </div>
      <div data-testid="table-row-key">{rowKey}</div>
      <div data-testid="table-data">
        {dataSource?.map((item: any, index: number) => (
          <div key={item.id || index} data-testid={`table-row-${index}`}>
            {JSON.stringify(item)}
          </div>
        ))}
      </div>
      <div data-testid="table-columns">
        {columns?.map((col: any, index: number) => (
          <div key={index} data-testid={`table-column-${index}`}>
            <div data-testid={`column-title-${index}`}>{col.title}</div>
            <div data-testid={`column-key-${index}`}>{col.key}</div>
            {col.render && (
              <div data-testid={`column-render-${index}`}>
                {dataSource?.map((record: any, recordIndex: number) => (
                  <div
                    key={recordIndex}
                    data-testid={`rendered-cell-${index}-${recordIndex}`}>
                    {col.render('', record)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  ),
  Button: ({children, type, onClick, disabled, size, icon}: any) => (
    <button
      data-testid="ant-button"
      data-type={type}
      data-size={size}
      onClick={onClick}
      disabled={disabled}
      data-has-icon={!!icon}>
      {icon && <span data-testid="button-icon">{icon}</span>}
      {children}
    </button>
  ),
  Space: ({children, size}: any) => (
    <div data-testid="ant-space" data-size={size}>
      {children}
    </div>
  ),
  Tag: ({children, color}: any) => (
    <span data-testid="ant-tag" data-color={color}>
      {children}
    </span>
  ),
}));

vi.mock('@ant-design/icons', () => ({
  EditOutlined: () => <span data-testid="edit-icon">Edit</span>,
  DeleteOutlined: () => <span data-testid="delete-icon">Delete</span>,
  EyeOutlined: () => <span data-testid="eye-icon">View</span>,
}));

describe('DataTable Component', () => {
  const mockData = [
    {id: '1', name: 'John Doe', email: 'john@example.com', status: 'active'},
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'inactive',
    },
  ];

  const mockColumns = [
    {title: 'Name', dataIndex: 'name', key: 'name'},
    {title: 'Email', dataIndex: 'email', key: 'email'},
    {title: 'Status', dataIndex: 'status', key: 'status'},
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with minimal props', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      expect(screen.getByTestId('ant-table')).toBeInTheDocument();
      expect(screen.getByTestId('table-loading')).toHaveTextContent(
        'Not Loading',
      );
      expect(screen.getByTestId('table-pagination')).toHaveTextContent(
        'Has Pagination',
      );
      expect(screen.getByTestId('table-row-selection')).toHaveTextContent(
        'No Row Selection',
      );
      expect(screen.getByTestId('table-row-key')).toHaveTextContent('id');
    });

    it('should render with all props', () => {
      const mockOnAdd = vi.fn();
      const mockRowSelection = {selectedRowKeys: []};

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          loading={true}
          onAdd={mockOnAdd}
          addButtonText="Create New"
          title="User Management"
          pagination={false}
          rowSelection={mockRowSelection}
          className="custom-table"
        />,
      );

      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Create New')).toBeInTheDocument();
      expect(screen.getByTestId('table-loading')).toHaveTextContent(
        'Loading...',
      );
      expect(screen.getByTestId('table-pagination')).toHaveTextContent(
        'No Pagination',
      );
      expect(screen.getByTestId('table-row-selection')).toHaveTextContent(
        'Has Row Selection',
      );
      const container = screen.getByTestId('ant-table').parentElement;
      expect(container).toHaveClass('custom-table');
    });

    it('should render data correctly', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      expect(screen.getByTestId('table-row-0')).toHaveTextContent(
        JSON.stringify(mockData[0]),
      );
      expect(screen.getByTestId('table-row-1')).toHaveTextContent(
        JSON.stringify(mockData[1]),
      );
    });

    it('should render columns correctly', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      expect(screen.getByTestId('column-title-0')).toHaveTextContent('Name');
      expect(screen.getByTestId('column-title-1')).toHaveTextContent('Email');
      expect(screen.getByTestId('column-title-2')).toHaveTextContent('Status');
      expect(screen.getByTestId('column-key-0')).toHaveTextContent('name');
      expect(screen.getByTestId('column-key-1')).toHaveTextContent('email');
      expect(screen.getByTestId('column-key-2')).toHaveTextContent('status');
    });
  });

  describe('Header Section', () => {
    it('should render title when provided', () => {
      render(
        <DataTable data={mockData} columns={mockColumns} title="Test Title" />,
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toHaveClass(
        'text-xl',
        'font-semibold',
      );
    });

    it('should render add button when onAdd is provided', () => {
      const mockOnAdd = vi.fn();
      render(
        <DataTable data={mockData} columns={mockColumns} onAdd={mockOnAdd} />,
      );

      const addButton = screen.getByText('Add New');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveAttribute('data-type', 'primary');
    });

    it('should use custom add button text', () => {
      const mockOnAdd = vi.fn();
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          onAdd={mockOnAdd}
          addButtonText="Create User"
        />,
      );

      expect(screen.getByText('Create User')).toBeInTheDocument();
    });

    it('should call onAdd when add button is clicked', () => {
      const mockOnAdd = vi.fn();
      render(
        <DataTable data={mockData} columns={mockColumns} onAdd={mockOnAdd} />,
      );

      fireEvent.click(screen.getByText('Add New'));
      expect(mockOnAdd).toHaveBeenCalledTimes(1);
    });

    it('should not render header section when no title and no onAdd', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      expect(screen.queryByText('Add New')).not.toBeInTheDocument();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should render both title and add button', () => {
      const mockOnAdd = vi.fn();
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          title="Users"
          onAdd={mockOnAdd}
        />,
      );

      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Add New')).toBeInTheDocument();
    });
  });

  describe('Actions Column', () => {
    it('should render actions column when actions are provided', () => {
      const mockActions = [
        {
          key: 'edit',
          label: 'Edit',
          onClick: vi.fn(),
        },
        {
          key: 'delete',
          label: 'Delete',
          onClick: vi.fn(),
        },
      ];

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          actions={mockActions}
        />,
      );

      expect(screen.getByTestId('column-title-3')).toHaveTextContent('Actions');
      expect(screen.getByTestId('column-key-3')).toHaveTextContent('actions');
    });

    it('should render action buttons for each row', () => {
      const mockEditClick = vi.fn();
      const mockDeleteClick = vi.fn();
      const mockActions = [
        {
          key: 'edit',
          label: 'Edit',
          onClick: mockEditClick,
          type: 'primary' as const,
        },
        {
          key: 'delete',
          label: 'Delete',
          onClick: mockDeleteClick,
          type: 'text' as const,
        },
      ];

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          actions={mockActions}
        />,
      );

      const editButtons = screen.getAllByText('Edit');
      const deleteButtons = screen.getAllByText('Delete');

      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);

      expect(editButtons[0]).toHaveAttribute('data-type', 'primary');
      expect(deleteButtons[0]).toHaveAttribute('data-type', 'text');
    });

    it('should call action onClick with correct record', () => {
      const mockEditClick = vi.fn();
      const mockActions = [
        {
          key: 'edit',
          label: 'Edit',
          onClick: mockEditClick,
        },
      ];

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          actions={mockActions}
        />,
      );

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(mockEditClick).toHaveBeenCalledWith(mockData[0]);
    });

    it('should render action with icon', () => {
      const mockActions = [
        {
          key: 'edit',
          label: 'Edit',
          icon: <span data-testid="custom-icon">📝</span>,
          onClick: vi.fn(),
        },
      ];

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          actions={mockActions}
        />,
      );

      expect(screen.getAllByTestId('custom-icon')).toHaveLength(2);
    });

    it('should disable action button when disabled function returns true', () => {
      const mockActions = [
        {
          key: 'edit',
          label: 'Edit',
          onClick: vi.fn(),
          disabled: (record: any) => record.status === 'inactive',
        },
      ];

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          actions={mockActions}
        />,
      );

      const editButtons = screen.getAllByText('Edit');
      expect(editButtons[0]).not.toBeDisabled();
      expect(editButtons[1]).toBeDisabled();
    });

    it('should not disable action button when disabled function returns false', () => {
      const mockActions = [
        {
          key: 'edit',
          label: 'Edit',
          onClick: vi.fn(),
          disabled: (record: any) => record.status === 'deleted',
        },
      ];

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          actions={mockActions}
        />,
      );

      const editButtons = screen.getAllByText('Edit');
      expect(editButtons[0]).not.toBeDisabled();
      expect(editButtons[1]).not.toBeDisabled();
    });

    it('should not add actions column when no actions provided', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      expect(screen.queryByTestId('column-title-3')).not.toBeInTheDocument();
    });

    it('should not add actions column when empty actions array', () => {
      render(<DataTable data={mockData} columns={mockColumns} actions={[]} />);

      expect(screen.queryByTestId('column-title-3')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state when loading is true', () => {
      render(
        <DataTable data={mockData} columns={mockColumns} loading={true} />,
      );

      expect(screen.getByTestId('table-loading')).toHaveTextContent(
        'Loading...',
      );
    });

    it('should not show loading state when loading is false', () => {
      render(
        <DataTable data={mockData} columns={mockColumns} loading={false} />,
      );

      expect(screen.getByTestId('table-loading')).toHaveTextContent(
        'Not Loading',
      );
    });

    it('should default to not loading when loading prop is not provided', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      expect(screen.getByTestId('table-loading')).toHaveTextContent(
        'Not Loading',
      );
    });
  });

  describe('Pagination', () => {
    it('should show pagination by default', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      expect(screen.getByTestId('table-pagination')).toHaveTextContent(
        'Has Pagination',
      );
    });

    it('should hide pagination when pagination is false', () => {
      render(
        <DataTable data={mockData} columns={mockColumns} pagination={false} />,
      );

      expect(screen.getByTestId('table-pagination')).toHaveTextContent(
        'No Pagination',
      );
    });

    it('should show pagination when pagination object is provided', () => {
      const paginationConfig = {pageSize: 10, current: 1};
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={paginationConfig}
        />,
      );

      expect(screen.getByTestId('table-pagination')).toHaveTextContent(
        'Has Pagination',
      );
    });
  });

  describe('Row Selection', () => {
    it('should not have row selection by default', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      expect(screen.getByTestId('table-row-selection')).toHaveTextContent(
        'No Row Selection',
      );
    });

    it('should have row selection when rowSelection is provided', () => {
      const rowSelection = {selectedRowKeys: []};
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowSelection={rowSelection}
        />,
      );

      expect(screen.getByTestId('table-row-selection')).toHaveTextContent(
        'Has Row Selection',
      );
    });
  });

  describe('Empty Data', () => {
    it('should handle empty data array', () => {
      render(<DataTable data={[]} columns={mockColumns} />);

      expect(screen.getByTestId('ant-table')).toBeInTheDocument();
      expect(screen.queryByTestId('table-row-0')).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should apply default empty className', () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      const container = screen.getByTestId('ant-table').parentElement;
      expect(container).toHaveAttribute('class', '');
    });

    it('should apply custom className', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          className="custom-class"
        />,
      );

      const container = screen.getByTestId('ant-table').parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });
});

describe('commonActions', () => {
  describe('view action', () => {
    it('should create view action with correct properties', () => {
      const mockOnClick = vi.fn();
      const viewAction = commonActions.view(mockOnClick);

      expect(viewAction.key).toBe('view');
      expect(viewAction.label).toBe('View');
      expect(viewAction.onClick).toBe(mockOnClick);
    });

    it('should render view icon', () => {
      const mockOnClick = vi.fn();
      const viewAction = commonActions.view(mockOnClick);

      render(<div>{viewAction.icon}</div>);
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('should call onClick when view action is triggered', () => {
      const mockOnClick = vi.fn();
      const mockRecord = {id: '1', name: 'Test'};
      const viewAction = commonActions.view(mockOnClick);

      viewAction.onClick(mockRecord);
      expect(mockOnClick).toHaveBeenCalledWith(mockRecord);
    });
  });

  describe('edit action', () => {
    it('should create edit action with correct properties', () => {
      const mockOnClick = vi.fn();
      const editAction = commonActions.edit(mockOnClick);

      expect(editAction.key).toBe('edit');
      expect(editAction.label).toBe('Edit');
      expect(editAction.onClick).toBe(mockOnClick);
    });

    it('should render edit icon', () => {
      const mockOnClick = vi.fn();
      const editAction = commonActions.edit(mockOnClick);

      render(<div>{editAction.icon}</div>);
      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    });

    it('should call onClick when edit action is triggered', () => {
      const mockOnClick = vi.fn();
      const mockRecord = {id: '1', name: 'Test'};
      const editAction = commonActions.edit(mockOnClick);

      editAction.onClick(mockRecord);
      expect(mockOnClick).toHaveBeenCalledWith(mockRecord);
    });
  });

  describe('delete action', () => {
    it('should create delete action with correct properties', () => {
      const mockOnClick = vi.fn();
      const deleteAction = commonActions.delete(mockOnClick);

      expect(deleteAction.key).toBe('delete');
      expect(deleteAction.label).toBe('Delete');
      expect(deleteAction.type).toBe('text');
      expect(deleteAction.onClick).toBe(mockOnClick);
    });

    it('should render delete icon', () => {
      const mockOnClick = vi.fn();
      const deleteAction = commonActions.delete(mockOnClick);

      render(<div>{deleteAction.icon}</div>);
      expect(screen.getByTestId('delete-icon')).toBeInTheDocument();
    });

    it('should call onClick when delete action is triggered', () => {
      const mockOnClick = vi.fn();
      const mockRecord = {id: '1', name: 'Test'};
      const deleteAction = commonActions.delete(mockOnClick);

      deleteAction.onClick(mockRecord);
      expect(mockOnClick).toHaveBeenCalledWith(mockRecord);
    });
  });
});

describe('StatusTag Component', () => {
  const colorMap = {
    active: 'green',
    inactive: 'red',
    pending: 'orange',
  };

  it('should render status tag with correct color from colorMap', () => {
    render(<StatusTag status="active" colorMap={colorMap} />);

    const tag = screen.getByTestId('ant-tag');
    expect(tag).toHaveAttribute('data-color', 'green');
    expect(tag).toHaveTextContent('ACTIVE');
  });

  it('should render status tag with default color when status not in colorMap', () => {
    render(<StatusTag status="unknown" colorMap={colorMap} />);

    const tag = screen.getByTestId('ant-tag');
    expect(tag).toHaveAttribute('data-color', 'default');
    expect(tag).toHaveTextContent('UNKNOWN');
  });

  it('should convert status to uppercase', () => {
    render(<StatusTag status="pending" colorMap={colorMap} />);

    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('should handle case-insensitive colorMap lookup', () => {
    render(<StatusTag status="ACTIVE" colorMap={colorMap} />);

    const tag = screen.getByTestId('ant-tag');
    expect(tag).toHaveAttribute('data-color', 'green');
  });

  it('should handle empty colorMap', () => {
    render(<StatusTag status="active" colorMap={{}} />);

    const tag = screen.getByTestId('ant-tag');
    expect(tag).toHaveAttribute('data-color', 'default');
  });

  it('should handle special characters in status', () => {
    render(
      <StatusTag status="in-progress" colorMap={{'in-progress': 'blue'}} />,
    );

    const tag = screen.getByTestId('ant-tag');
    expect(tag).toHaveAttribute('data-color', 'blue');
    expect(tag).toHaveTextContent('IN-PROGRESS');
  });
});
