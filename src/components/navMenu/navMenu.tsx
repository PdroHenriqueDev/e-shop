'use client';
import React, {useState} from 'react';
import type {MenuProps} from 'antd';
import {Avatar, ConfigProvider, Dropdown, Menu} from 'antd';
import {MailOutlined, AppstoreOutlined, UserOutlined} from '@ant-design/icons';
import {signOut} from 'next-auth/react';

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

  const handleLogOut: MenuProps['onClick'] = (e: any) => {
    if (e.key === '1') {
      signOut();
    }
  };

  const itemsDropDown: MenuProps['items'] = [
    {
      label: 'Log In',
      key: '0',
    },
    {
      label: 'Log Out',
      key: '1',
      onClick: handleLogOut,
    },
  ];

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
      </div>
    </header>
  );
}
