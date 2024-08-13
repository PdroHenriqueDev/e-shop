'use client';
import React, {useState} from 'react';
import type {MenuProps} from 'antd';
import {Avatar, ConfigProvider, Menu} from 'antd';
import {MailOutlined, AppstoreOutlined, UserOutlined} from '@ant-design/icons';

const items = [
  {
    label: 'Home',
    key: 'home',
    icon: <MailOutlined />,
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
          {label: 'Subcategory 1', key: 'subcategory:1'},
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

  const handleClick: MenuProps['onClick'] = e => {
    console.log('click ', e);
    setCurrent(e.key);
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

      <div className="flex-1 text-right">
        <Avatar size="large" icon={<UserOutlined />} />
      </div>
    </header>
  );
}
