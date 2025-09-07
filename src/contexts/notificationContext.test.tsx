import React from 'react';
import {render, screen} from '@testing-library/react';
import {describe, it, expect, vi, beforeEach, afterEach, Mock} from 'vitest';
import {message} from 'antd';
import {NotificationProvider, useNotification} from './notificationContext';

const mockMessage = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}));

vi.mock('antd', () => ({
  message: mockMessage,
  App: {
    useApp: () => ({message: mockMessage}),
  },
}));

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
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

    it('should throw an error when used outside NotificationProvider', () => {
      const TestComponent = () => {
        useNotification();
        return null;
      };

      expect(() => render(<TestComponent />)).toThrow(
        'useNotification must be used within a NotificationProvider',
      );
    });
  });

  describe('useNotification', () => {
    it('calls appropriate message function based on type', () => {
      const TestComponent = () => {
        const {notify} = useNotification();

        notify({type: 'success', msg: 'Success message'});
        expect(mockMessage.success).toHaveBeenCalledWith('Success message', 3);

        notify({type: 'error', msg: 'Error message'});
        expect(mockMessage.error).toHaveBeenCalledWith('Error message', 3);

        notify({type: 'warning', msg: 'Warning message'});
        expect(mockMessage.warning).toHaveBeenCalledWith('Warning message', 3);

        notify({type: 'info', msg: 'Info message'});
        expect(mockMessage.info).toHaveBeenCalledWith('Info message', 3);

        return null;
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>,
      );
    });

    it('should throw an error when used outside NotificationProvider', () => {
      const TestComponent = () => {
        useNotification();
        return null;
      };

      expect(() => render(<TestComponent />)).toThrow(
        'useNotification must be used within a NotificationProvider',
      );
    });

    it('should handle auth-error events', () => {
      const TestComponent = () => {
        const {notify} = useNotification();
        return <div data-testid="test-component">Test</div>;
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>,
      );

      // Dispatch a custom auth-error event
      const authErrorEvent = new CustomEvent('auth-error', {
        detail: {
          message: 'Authentication failed',
          type: 'error',
        },
      });

      window.dispatchEvent(authErrorEvent);

      expect(mockMessage.error).toHaveBeenCalledWith(
        'Authentication failed',
        3,
      );
    });
  });
});
