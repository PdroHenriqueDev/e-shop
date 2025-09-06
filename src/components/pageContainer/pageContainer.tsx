import React from 'react';
import Loading from '../loading/loading';

interface PageContainerProps {
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  loadingMessage?: string;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  centerContent?: boolean;
}

export default function PageContainer({
  title,
  subtitle,
  isLoading = false,
  loadingMessage,
  className = '',
  containerClassName = 'container mx-auto py-12 px-5',
  children,
  actions,
  centerContent = false,
}: PageContainerProps) {
  if (isLoading) {
    return (
      <div
        className={`${containerClassName} ${centerContent ? 'flex items-center justify-center min-h-screen' : ''}`}>
        <div className="flex flex-col items-center justify-center w-full">
          <Loading />
          {loadingMessage && (
            <p className="mt-4 text-lg text-gray-600">{loadingMessage}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerClassName} ${className}`}>
      {(title || subtitle || actions) && (
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              {title && (
                <h1 className="text-3xl font-bold mb-2 text-dark">{title}</h1>
              )}
              {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
            </div>
            {actions && <div className="flex gap-2">{actions}</div>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
  icon,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-primary p-8 rounded-lg shadow text-center">
      {icon && <div className="mb-4 text-4xl text-gray-400">{icon}</div>}
      <h2 className="text-xl font-semibold mb-2 text-dark">{title}</h2>
      <p className="text-gray-600 mb-4">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-red-50 border border-red-200 p-8 rounded-lg text-center">
      <h2 className="text-xl font-semibold mb-2 text-red-800">{title}</h2>
      <p className="text-red-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
          Try Again
        </button>
      )}
    </div>
  );
}
