'use client';
import {useEffect, useState} from 'react';
import {Table, Button, Modal, Select, Tag, message, Descriptions} from 'antd';
import {EyeOutlined} from '@ant-design/icons';
import type {ColumnsType} from 'antd/es/table';

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    imageUrl?: string;
  };
}

interface Order {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  items: OrderItem[];
}

const ORDER_STATUSES = [
  {value: 'pending', label: 'Pending', color: 'orange'},
  {value: 'processing', label: 'Processing', color: 'blue'},
  {value: 'shipped', label: 'Shipped', color: 'cyan'},
  {value: 'delivered', label: 'Delivered', color: 'green'},
  {value: 'cancelled', label: 'Cancelled', color: 'red'},
];

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      message.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({status: newStatus}),
      });

      if (response.ok) {
        message.success('Order status updated successfully');
        fetchOrders();
      } else {
        message.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      message.error('Failed to update order status');
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    const statusConfig = ORDER_STATUSES.find(s => s.value === status);
    return statusConfig?.color || 'default';
  };

  const columns: ColumnsType<Order> = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => `#${id}`,
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.user.name}</div>
          <div className="text-gray-500 text-sm">{record.user.email}</div>
        </div>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `$${total.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record) => (
        <Select
          value={status}
          onChange={newStatus => handleStatusUpdate(record.id, newStatus)}
          className="w-32">
          {ORDER_STATUSES.map(statusOption => (
            <Select.Option key={statusOption.value} value={statusOption.value}>
              <Tag color={statusOption.color}>{statusOption.label}</Tag>
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => handleViewOrder(record)}>
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 bg-primary min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">Orders Management</h1>
      </div>

      <div className="bg-primary border border-border rounded-lg shadow-sm">
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          className="text-dark"
          pagination={{pageSize: 10}}
        />
      </div>

      <Modal
        title={
          <span className="text-dark font-semibold">
            Order Details - #{selectedOrder?.id}
          </span>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        className="text-dark">
        {selectedOrder && (
          <div className="space-y-6">
            <Descriptions title="Order Information" bordered>
              <Descriptions.Item label="Order ID">
                #{selectedOrder.id}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedOrder.status)}>
                  {
                    ORDER_STATUSES.find(s => s.value === selectedOrder.status)
                      ?.label
                  }
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                ${selectedOrder.total.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Customer Name">
                {selectedOrder.user.name}
              </Descriptions.Item>
              <Descriptions.Item label="Customer Email">
                {selectedOrder.user.email}
              </Descriptions.Item>
              <Descriptions.Item label="Order Date">
                {new Date(selectedOrder.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <h3 className="text-lg font-semibold mb-4">Order Items</h3>
              <Table
                dataSource={selectedOrder.items}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: 'Product',
                    key: 'product',
                    render: (_, item) => item.product.name,
                  },
                  {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                    key: 'quantity',
                  },
                  {
                    title: 'Unit Price',
                    dataIndex: 'price',
                    key: 'price',
                    render: (price: number) => `$${price.toFixed(2)}`,
                  },
                  {
                    title: 'Subtotal',
                    key: 'subtotal',
                    render: (_, item) =>
                      `$${(item.quantity * item.price).toFixed(2)}`,
                  },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
