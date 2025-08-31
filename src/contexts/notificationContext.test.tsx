import React from 'react';
import {render} from '@testing-library/react';
import {describe, it, expect, vi} from 'vitest';
import {message} from 'antd';
import {NotificationProvider, useNotification} from './notificationContext';

vi.mock('antd', () => {
  return {
    message: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    },
  };
});

describe('NotificationProvider', () => {
  it('provides a notify function', () => {
    const TestComponent = () => {
      const {notify} = useNotification();
      expect(typeof notify).toBe('function');
      return null;
    };

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );
  });

  it('calls the correct message function with provided parameters', () => {
    const TestComponent = () => {
      const {notify} = useNotification();
      notify({type: 'success', msg: 'Test Message', duration: 5});
      return null;
    };

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    expect(message.success).toHaveBeenCalledWith('Test Message', 5);
  });
});

describe('useNotification', () => {
  it('throws error when used outside NotificationProvider', () => {
    const TestComponent = () => {
      useNotification();
      return null;
    };

    const renderOutsideProvider = () => {
      render(<TestComponent />);
    };

    expect(renderOutsideProvider).toThrow(
      'useNotification must be used within a NotificationProvider',
    );
  });
  it('does not throw an error when used inside NotificationProvider', () => {
    const TestComponentInsideProvider = () => {
      const {notify} = useNotification();
      notify({type: 'info', msg: 'Test message', duration: 3});
      return <div>Component inside provider</div>;
    };

    const {getByText} = render(
      <NotificationProvider>
        <TestComponentInsideProvider />
      </NotificationProvider>,
    );

    expect(getByText('Component inside provider')).toBeInTheDocument();
  });

  it('calls appropriate message function based on type', () => {
    const TestComponent = () => {
      const {notify} = useNotification();
      notify({type: 'success', msg: 'Success message'});
      notify({type: 'error', msg: 'Error message'});
      return null;
    };

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    expect(message.success).toHaveBeenCalledWith('Success message', 3);
    expect(message.error).toHaveBeenCalledWith('Error message', 3);
  });
});
