'use client';
import React, {useEffect, useState} from 'react';
import type {MenuProps} from 'antd';
import {Avatar, ConfigProvider, Dropdown, Menu} from 'antd';
import {
  MailOutlined,
  AppstoreOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {signOut, signIn, useSession} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {MenuInfo} from 'rc-menu/lib/interface';
import {MenuItemWithPathProps} from '@/interfaces/navBar';
import {useCart} from '@/contexts/cartContext';
import axios from '@/lib/axios';
import CartDrawer from './drawer/drawer';

const items = [
  {
    label: 'Home',
    key: 'home',
    icon: <MailOutlined />,
    path: '/',
  },
  {
    label: 'Categories',
    key: 'categories',
    icon: <AppstoreOutlined />,
    children: [
      {
        type: 'group',
        label: 'Category 1',
        children: [
          {
            label: 'Subcategory 1',
            key: 'subcategory:1',
            path: '/categories',
          },
          {label: 'Subcategory 2', key: 'subcategory:2'},
        ],
      },
      {
        type: 'group',
        label: 'Category 2',
        children: [
          {label: 'Subcategory 3', key: 'subcategory:3'},
          {label: 'Subcategory 4', key: 'subcategory:4'},
        ],
      },
    ],
  },
  {
    label: 'Products',
    key: 'products',
    icon: <ShoppingCartOutlined />,
    path: '/products/catalog',
  },
];

export default function NavMenu() {
  const [current, setCurrent] = useState('home');
  const router = useRouter();
  const {handleSetCartItems} = useCart();

  const {data: dataSession} = useSession();

  useEffect(() => {
    const getItems = async () => {
      if (!dataSession?.user) {
        return;
      }

      try {
        const response = await axios.get('/api/cart');
        const {data} = response;
        handleSetCartItems(data);
      } catch (error) {
        console.error('Failed to fetch cart items:', error);
      }
    };

    getItems();
  }, [dataSession?.user?.email, handleSetCartItems]);

  const handleAuthAction: MenuProps['onClick'] = async e => {
    e.key === '1' ? await signOut() : signIn();
  };

  const itemsDropDown: MenuProps['items'] = [
    {
      label: 'Log In',
      key: '0',
      onClick: handleAuthAction,
      style: {display: dataSession ? 'none' : 'block'},
    },
    {
      label: 'My Orders',
      key: 'orders',
      onClick: () => router.push('/orders'),
      style: {display: dataSession ? 'block' : 'none'},
    },
    {
      label: 'Admin Panel',
      key: 'admin',
      icon: <SettingOutlined />,
      onClick: () => router.push('/admin'),
      style: {
        display:
          dataSession && (dataSession.user as any)?.role === 'admin'
            ? 'block'
            : 'none',
      },
    },
    {
      label: 'Log Out',
      key: '1',
      onClick: handleAuthAction,
      style: {display: dataSession ? 'block' : 'none'},
    },
  ];

  const handleClick: MenuProps['onClick'] = e => {
    setCurrent(e.key);
    handlePath(e);
  };

  const handlePath = (e: MenuInfo) => {
    const findPath = (
      menuItems: MenuItemWithPathProps[] = [],
      key: string,
    ): string | undefined => {
      for (const item of menuItems) {
        if (!item) return;
        if (item.key === key) return item.path;
        const childPath = findPath(
          item.children?.flatMap(group => group.children ?? []) ?? [],
          key,
        );
        if (childPath) return childPath;
      }
    };

    const path = findPath(items as MenuItemWithPathProps[], e.key);
    if (path) {
      router.push(path);
    }
  };

  return (
    <header className="flex justify-between items-center p-4 bg-primary shadow-md">
      <div className="flex-1">
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#F7CE45',
            },
            components: {
              Menu: {
                itemSelectedBg: 'transparent',
                itemHoverBg: 'transparent',
                itemHoverColor: '#000000',
                itemSelectedColor: '#000000',
                itemColor: '#000000',
              },
            },
          }}>
          <Menu
            onClick={handleClick}
            selectedKeys={[current]}
            mode={'horizontal'}
            items={items}
            className="text-dark"
          />
        </ConfigProvider>
      </div>

      <div className="flex-1 text-center">
        <h1 className="text-dark font-semibold text-xl">E-shop</h1>
      </div>

      <div className="flex-1 flex items-start justify-end">
        <div className="flex flex-col items-center">
          <Dropdown
            menu={{items: itemsDropDown}}
            trigger={['click']}
            placement="bottomLeft">
            <Avatar
              className="bg-accent hover:bg-border cursor-pointer p-1 rounded-full transition duration-300 ease-in-out"
              size="small"
              icon={<UserOutlined />}
            />
          </Dropdown>
          <span className="text-xs text-accent">
            {dataSession?.user?.name?.[0]}
          </span>
        </div>

        <CartDrawer />
      </div>
    </header>
  );
}
