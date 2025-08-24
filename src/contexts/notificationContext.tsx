'use client';
import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import {App} from 'antd';
import {NoticeType} from 'antd/es/message/interface';

type NotifyFunction = (options: {
  type: NoticeType;
  msg: string;
  duration?: number;
}) => void;

interface NotificationContextType {
  notify: NotifyFunction;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      'useNotification must be used within a NotificationProvider',
    );
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const {message} = App.useApp();

  const notify: NotifyFunction = useCallback(
    ({type, msg, duration = 3}) => {
      message[type](msg, duration);
    },
    [message],
  );

  useEffect(() => {
    const handleAuthError = (event: CustomEvent) => {
      const {message: errorMessage, type} = event.detail;
      notify({type, msg: errorMessage});
    };

    window.addEventListener('auth-error', handleAuthError as EventListener);

    return () => {
      window.removeEventListener(
        'auth-error',
        handleAuthError as EventListener,
      );
    };
  }, [notify]);

  return (
    <NotificationContext.Provider value={{notify}}>
      {children}
    </NotificationContext.Provider>
  );
};
