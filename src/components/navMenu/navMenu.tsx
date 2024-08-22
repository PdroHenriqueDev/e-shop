'use client';
import React, {useState} from 'react';
import type {MenuProps} from 'antd';
import {Avatar, Badge, ConfigProvider, Dropdown, Menu} from 'antd';
import {
  MailOutlined,
  AppstoreOutlined,
  UserOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import {signOut, signIn} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {MenuInfo} from 'rc-menu/lib/interface';
import {MenuItemWithPathProps} from '@/interfaces/navBar';

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
];

export default function NavMenu() {
  const [current, setCurrent] = useState('home');
  const router = useRouter();

  const handleAuthAction: MenuProps['onClick'] = (e: any) => {
    e.key === '1' ? signOut() : signIn();
  };

  const itemsDropDown: MenuProps['items'] = [
    {
      label: 'Log In',
      key: '0',
      onClick: handleAuthAction,
    },
    {
      label: 'Log Out',
      key: '1',
      onClick: handleAuthAction,
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
                colorItemBgSelected: 'transparent',
                colorItemBgHover: 'transparent',
                colorItemTextHover: '#000000',
                colorItemTextSelected: '#000000',
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

      <div className="flex-1 flex items-center justify-end">
        <Dropdown
          menu={{items: itemsDropDown}}
          trigger={['click']}
          placement="bottomLeft">
          <Avatar
            className="bg-accent hover:bg-border cursor-pointer p-1 rounded-full transition duration-300 ease-in-out"
            size="large"
            icon={<UserOutlined />}
          />
        </Dropdown>

        <Badge count={5} className="cursor-pointer mx-5 mt-1">
          <ShoppingCartOutlined className="text-xl" />
        </Badge>
      </div>
    </header>
  );
}
