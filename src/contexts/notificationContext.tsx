'use client';

import React, {createContext, useContext, ReactNode} from 'react';
import {message} from 'antd';
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
  const notify: NotifyFunction = ({type, msg, duration = 3}) => {
    message[type](msg, duration);
  };

  return (
    <NotificationContext.Provider value={{notify}}>
      {children}
    </NotificationContext.Provider>
  );
};
