import {ReactNode} from 'react';

export interface MenuItemWithPathProps {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  path?: string;
  children?: MenuItemWithPathProps[];
  type?: 'group' | 'divider' | 'item';
}
