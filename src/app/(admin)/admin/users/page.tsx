'use client';

import React, {useState, useEffect} from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Space,
  Card,
} from 'antd';
import {EditOutlined, DeleteOutlined, PlusOutlined} from '@ant-design/icons';
import type {ColumnsType} from 'antd/es/table';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  _count: {
    orders: number;
  };
}

interface UserFormData {
  name: string;
  email: string;
  role: 'user' | 'admin';
  password?: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm<UserFormData>();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        message.error('Failed to fetch users');
      }
    } catch (error) {
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setModalVisible(true);
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('User deleted successfully');
        fetchUsers();
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to delete user');
      }
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const handleSubmit = async (values: UserFormData) => {
    try {
      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(
          `User ${editingUser ? 'updated' : 'created'} successfully`,
        );
        setModalVisible(false);
        fetchUsers();
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to save user');
      }
    } catch (error) {
      message.error('Failed to save user');
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Orders',
      dataIndex: ['_count', 'orders'],
      key: 'orders',
      width: 100,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No">
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-primary min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">User Management</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateUser}
          className="bg-secondary border-secondary hover:bg-yellow-400 text-dark">
          Add User
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          className="text-dark"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
          }}
        />
      </Card>

      <Modal
        title={
          <span className="text-dark font-semibold">
            {editingUser ? 'Edit User' : 'Add User'}
          </span>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        className="text-dark">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4">
          <Form.Item
            label="Name"
            name="name"
            rules={[{required: true, message: 'Please enter user name'}]}>
            <Input placeholder="Enter user name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              {required: true, message: 'Please enter email'},
              {type: 'email', message: 'Please enter a valid email'},
            ]}>
            <Input placeholder="Enter email address" />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
            rules={[{required: true, message: 'Please select a role'}]}>
            <Select placeholder="Select user role">
              <Select.Option value="user">User</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
            </Select>
          </Form.Item>

          {!editingUser && (
            <Form.Item
              label="Password"
              name="password"
              rules={[
                {required: true, message: 'Please enter password'},
                {min: 6, message: 'Password must be at least 6 characters'},
              ]}>
              <Input.Password placeholder="Enter password" />
            </Form.Item>
          )}

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Update' : 'Create'} User
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;
