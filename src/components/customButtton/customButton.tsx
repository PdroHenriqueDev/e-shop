import {CustomButtonProps} from '@/interfaces/customButton';
import React from 'react';
import classNames from 'classnames';

export default function CustomButton({
  onClick,
  type = 'button',
  buttonText,
  isLoading,
  disabled = false,
  backgroundColor = 'secondary',
  textColor = 'dark',
  spinColor = 'dark',
  icon,
}: CustomButtonProps) {
  const buttonClasses = classNames(
    'w-full px-4 py-2 font-semibold rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-secondary',
    {
      'text-dark': textColor === 'dark',
      'text-primary': textColor === 'primary',
      'bg-secondary': backgroundColor === 'secondary',
      'bg-dark': backgroundColor === 'dark',
      'bg-danger': backgroundColor === 'danger',
      'bg-accent': backgroundColor === 'accent',
      'bg-border': backgroundColor === 'border',
    },
  );

  const spinnerColorMap = {
    dark: 'dark' as const,
    primary: 'primary' as const,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={buttonClasses}>
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="relative">
            <div
              className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${
                spinColor === 'dark' ? 'border-dark' : 'border-primary'
              }`}
            />
          </div>
        </div>
      ) : (
        <div className="relative flex items-center justify-center w-full">
          {icon && <span className="absolute left-4">{icon}</span>}
          {buttonText}
        </div>
      )}
    </button>
  );
}
