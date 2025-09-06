'use client';
import {useEffect, useState} from 'react';
import {Card, Col, Row, Statistic, Table, Tag} from 'antd';
import {
  ShoppingOutlined,
  UserOutlined,
  DollarOutlined,
  OrderedListOutlined,
} from '@ant-design/icons';
import type {ColumnsType} from 'antd/es/table';

import {AdminDashboardStats, AdminRecentOrder} from '@/interfaces/admin';
import {ORDER_STATUS} from '@/constants';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<AdminRecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, ordersResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/orders/recent'),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setRecentOrders(ordersData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const orderColumns: ColumnsType<AdminRecentOrder> = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Customer',
      dataIndex: 'user',
      key: 'user',
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
      render: (status: string) => {
        const color =
          status === 'completed'
            ? 'green'
            : status === ORDER_STATUS.PENDING
              ? 'orange'
              : 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div className="p-6 bg-primary min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-dark">Dashboard Overview</h1>

      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined className="text-secondary" />}
              loading={loading}
              valueStyle={{color: '#000000'}}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Products"
              value={stats.totalProducts}
              prefix={<ShoppingOutlined className="text-secondary" />}
              loading={loading}
              valueStyle={{color: '#000000'}}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Orders"
              value={stats.totalOrders}
              prefix={<OrderedListOutlined className="text-secondary" />}
              loading={loading}
              valueStyle={{color: '#000000'}}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Revenue"
              value={stats.totalRevenue}
              prefix={<DollarOutlined className="text-secondary" />}
              precision={2}
              loading={loading}
              valueStyle={{color: '#000000'}}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<span className="text-dark font-semibold">Recent Orders</span>}
        className="mb-6 border-border shadow-sm">
        <Table
          columns={orderColumns}
          dataSource={recentOrders}
          rowKey="id"
          loading={loading}
          pagination={{pageSize: 10}}
          className="text-dark"
        />
      </Card>
    </div>
  );
}
