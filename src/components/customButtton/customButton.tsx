import {CustomButtonProps} from '@/interfaces/customButton';
import React from 'react';
import {Spin} from 'antd';
import {LoadingOutlined} from '@ant-design/icons';

export default function CustomButton({
  onClick,
  type = 'button',
  buttonText,
  isLoading,
}: CustomButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className="w-full px-4 py-2 font-semibold text-dark bg-secondary rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-secondary">
      {isLoading ? (
        <Spin indicator={<LoadingOutlined spin />} className="text-dark" />
      ) : (
        buttonText
      )}
    </button>
  );
}
