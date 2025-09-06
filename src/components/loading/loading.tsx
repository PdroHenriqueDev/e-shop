import React from 'react';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'dark';
  showText?: boolean;
  text?: string;
}

export default function Loading({
  size = 'medium',
  color = 'secondary',
  showText = true,
  text = 'Loading...',
}: LoadingProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
  };

  const colorClasses = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    dark: 'border-dark',
  };

  const textColorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    dark: 'text-dark',
  };

  const bgColorClass = colorClasses[color].replace('border-', 'bg-');

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} ${colorClasses[color]} border-4 border-t-transparent rounded-full animate-spin`}
        />
        <div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 ${bgColorClass} rounded-full animate-pulse`}
        />
      </div>
      {showText && (
        <div
          className={`text-sm font-medium ${textColorClasses[color]} animate-pulse`}>
          {text}
        </div>
      )}
    </div>
  );
}
