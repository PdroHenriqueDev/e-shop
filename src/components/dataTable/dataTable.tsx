import React from 'react';
import {Table, Button, Space, Tag} from 'antd';
import {EditOutlined, DeleteOutlined, EyeOutlined} from '@ant-design/icons';
import type {ColumnsType} from 'antd/es/table';

interface BaseRecord {
  id: string;
  [key: string]: any;
}

interface DataTableAction<T> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (record: T) => void;
  type?: 'primary' | 'default' | 'link' | 'text' | 'dashed';
  disabled?: (record: T) => boolean;
}

interface DataTableProps<T extends BaseRecord> {
  data: T[];
  columns: ColumnsType<T>;
  loading?: boolean;
  actions?: DataTableAction<T>[];
  onAdd?: () => void;
  addButtonText?: string;
  title?: string;
  pagination?: false | object;
  rowSelection?: object;
  className?: string;
}

export default function DataTable<T extends BaseRecord>({
  data,
  columns,
  loading = false,
  actions = [],
  onAdd,
  addButtonText = 'Add New',
  title,
  pagination = {},
  rowSelection,
  className = '',
}: DataTableProps<T>) {
  const enhancedColumns: ColumnsType<T> = [
    ...columns,
    ...(actions.length > 0
      ? [
          {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: T) => (
              <Space size="small">
                {actions.map(action => {
                  const isDisabled = action.disabled?.(record) || false;
                  return (
                    <Button
                      key={action.key}
                      type={action.type || 'default'}
                      icon={action.icon}
                      onClick={() => action.onClick(record)}
                      disabled={isDisabled}
                      size="small">
                      {action.label}
                    </Button>
                  );
                })}
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className={className}>
      {(title || onAdd) && (
        <div className="mb-4 flex justify-between items-center">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          {onAdd && (
            <Button type="primary" onClick={onAdd}>
              {addButtonText}
            </Button>
          )}
        </div>
      )}
      <Table
        dataSource={data}
        columns={enhancedColumns}
        loading={loading}
        pagination={pagination}
        rowSelection={rowSelection}
        rowKey="id"
      />
    </div>
  );
}

export const commonActions = {
  view: (onClick: (record: any) => void): DataTableAction<any> => ({
    key: 'view',
    label: 'View',
    icon: <EyeOutlined />,
    onClick,
  }),
  edit: (onClick: (record: any) => void): DataTableAction<any> => ({
    key: 'edit',
    label: 'Edit',
    icon: <EditOutlined />,
    onClick,
  }),
  delete: (onClick: (record: any) => void): DataTableAction<any> => ({
    key: 'delete',
    label: 'Delete',
    icon: <DeleteOutlined />,
    onClick,
    type: 'text' as const,
  }),
};

export function StatusTag({
  status,
  colorMap,
}: {
  status: string;
  colorMap: Record<string, string>;
}) {
  const color = colorMap[status.toLowerCase()] || 'default';
  return <Tag color={color}>{status.toUpperCase()}</Tag>;
}
