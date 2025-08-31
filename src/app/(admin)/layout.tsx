'use client';
import {useSession} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {Layout, Menu, Avatar, Dropdown, Spin, ConfigProvider} from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  UserOutlined,
  OrderedListOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import {signOut} from 'next-auth/react';
import Link from 'next/link';
import type {MenuProps} from 'antd';

const {Header, Sider, Content} = Layout;

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({children}: AdminLayoutProps) {
  const {data: session, status} = useSession();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    const checkAdminAccess = async () => {
      try {
        const response = await fetch('/api/admin/validate', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          router.push('/');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Admin access validation failed:', error);
        router.push('/');
      }
    };

    checkAdminAccess();
  }, [session, status, router]);

  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/admin">Dashboard</Link>,
    },
    {
      key: 'products',
      icon: <ShoppingOutlined />,
      label: <Link href="/admin/products">Products</Link>,
    },
    {
      key: 'orders',
      icon: <OrderedListOutlined />,
      label: <Link href="/admin/orders">Orders</Link>,
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: <Link href="/admin/users">Users</Link>,
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'back-to-store',
      label: <Link href="/">Back to Store</Link>,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: () => signOut(),
    },
  ];

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#F7CE45',
          colorBgContainer: '#FFFFFF',
          colorText: '#000000',
        },
        components: {
          Layout: {
            siderBg: '#FFFFFF',
            headerBg: '#FFFFFF',
          },
          Menu: {
            itemSelectedBg: '#F7CE45',
            itemHoverBg: '#F2F2F2',
            itemSelectedColor: '#000000',
            itemHoverColor: '#000000',
            itemColor: '#000000',
          },
        },
      }}>
      <Layout className="min-h-screen bg-primary">
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          className="bg-primary shadow-md border-r border-border">
          <div className="p-4 text-center border-b border-border">
            <h2
              className={`font-semibold text-dark ${
                collapsed ? 'text-sm' : 'text-lg'
              }`}>
              {collapsed ? 'Admin' : 'E-Shop Admin'}
            </h2>
          </div>
          <Menu
            mode="inline"
            defaultSelectedKeys={['dashboard']}
            items={menuItems}
            className="border-r-0 bg-primary"
          />
        </Sider>
        <Layout>
          <Header className="bg-primary px-4 shadow-sm flex items-center justify-between border-b border-border">
            <div className="flex items-center">
              {collapsed ? (
                <MenuUnfoldOutlined
                  className="text-lg cursor-pointer text-dark hover:text-secondary transition-colors"
                  onClick={() => setCollapsed(!collapsed)}
                />
              ) : (
                <MenuFoldOutlined
                  className="text-lg cursor-pointer text-dark hover:text-secondary transition-colors"
                  onClick={() => setCollapsed(!collapsed)}
                />
              )}
              <h1 className="ml-4 text-xl font-semibold text-dark">
                E-Shop Admin
              </h1>
            </div>
            <Dropdown menu={{items: userMenuItems}} placement="bottomRight">
              <div className="flex items-center cursor-pointer hover:bg-border p-2 rounded transition-colors">
                <Avatar
                  icon={<UserOutlined />}
                  className="mr-2 bg-secondary"
                  style={{backgroundColor: '#F7CE45', color: '#000000'}}
                />
                <span className="text-dark">
                  {session?.user?.name || 'Admin'}
                </span>
              </div>
            </Dropdown>
          </Header>
          <Content className="m-6 p-6 bg-primary rounded-lg shadow-sm border border-border">
            {children}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
