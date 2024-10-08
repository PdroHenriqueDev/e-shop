import {ReactNode} from 'react';

export interface CustomButtonProps {
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  buttonText: string;
  isLoading?: boolean;
  disabled?: boolean;
  textColor?: 'primary' | 'secondary' | 'accent' | 'danger' | 'dark' | 'border';
  spinColor?: 'primary' | 'secondary' | 'accent' | 'danger' | 'dark' | 'border';
  backgroundColor?:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'danger'
    | 'dark'
    | 'border';
  icon?: ReactNode;
}
