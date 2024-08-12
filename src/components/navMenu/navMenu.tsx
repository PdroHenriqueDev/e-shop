'use client';
import React, {useState} from 'react';
import type {MenuProps} from 'antd';
import {Menu} from 'antd';

type MenuItem = Required<MenuProps>['items'][number];

interface CustomizableNavMenuProps {
  menuItems: MenuItem[];
  defaultSelectedKey?: string;
  mode?: MenuProps['mode'];
  onMenuClick?: MenuProps['onClick'];
}

export default function NavMenu({
  menuItems,
  defaultSelectedKey = 'mail',
  mode = 'horizontal',
  onMenuClick,
}: CustomizableNavMenuProps) {
  const [current, setCurrent] = useState(defaultSelectedKey);

  const handleClick: MenuProps['onClick'] = e => {
    console.log('click ', e);
    setCurrent(e.key);
    if (onMenuClick) {
      onMenuClick(e);
    }
  };

  return (
    <Menu
      onClick={handleClick}
      selectedKeys={[current]}
      mode={mode}
      items={menuItems}
    />
  );
}
