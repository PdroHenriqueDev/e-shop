import {CustomButtonProps} from '@/interfaces/customButton';
import React from 'react';
import {Spin} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';
import classNames from 'classnames';

export default function CustomButton({
  onClick,
  type = 'button',
  buttonText,
  isLoading,
  backgroundColor = 'secondary',
  textColor = 'dark',
  icon,
}: CustomButtonProps) {
  const buttonClasses = classNames(
    'w-full px-4 py-2 font-semibold rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-secondary',
    `text-${textColor}`,
    `bg-${backgroundColor}`,
  );

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={buttonClasses}>
      {isLoading ? (
        <Spin indicator={<LoadingOutlined spin />} className="text-dark" />
      ) : (
        <div className="relative flex items-center justify-center w-full">
          {icon && <span className="absolute left-4">{icon}</span>}
          {buttonText}
        </div>
      )}
    </button>
  );
}
