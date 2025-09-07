import {render, screen} from '@testing-library/react';
import RootLayout, {metadata} from './layout';
import {vi} from 'vitest';

vi.mock('@/contexts/notificationContext', () => ({
  NotificationProvider: ({children}: {children: React.ReactNode}) => (
    <div data-testid="notification-provider">{children}</div>
  ),
}));

vi.mock('@/components/nexAuthProvider/nextAuthProvider', () => ({
  NextAuthProvider: ({children}: {children: React.ReactNode}) => (
    <div data-testid="nextauth-provider">{children}</div>
  ),
}));

vi.mock('@ant-design/nextjs-registry', () => ({
  AntdRegistry: ({children}: {children: React.ReactNode}) => (
    <div data-testid="antd-registry">{children}</div>
  ),
}));

vi.mock('antd', () => ({
  App: ({children}: {children: React.ReactNode}) => (
    <div data-testid="antd-app">{children}</div>
  ),
}));

vi.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
  }),
}));

describe('RootLayout', () => {
  it('should render children within all provider wrappers', () => {
    const testContent = 'Test Content';

    render(
      <RootLayout>
        <div>{testContent}</div>
      </RootLayout>,
    );

    expect(screen.getByText(testContent)).toBeInTheDocument();
    expect(screen.getByTestId('nextauth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('antd-registry')).toBeInTheDocument();
    expect(screen.getByTestId('antd-app')).toBeInTheDocument();
    expect(screen.getByTestId('notification-provider')).toBeInTheDocument();
  });

  it('should render html structure with correct attributes', () => {
    render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>,
    );

    const htmlElement = document.documentElement;
    expect(htmlElement).toHaveAttribute('lang', 'en');
  });

  it('should apply correct body classes', () => {
    render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>,
    );

    const bodyElement = document.body;
    expect(bodyElement).toHaveClass('inter-font', 'bg-primary');
  });

  it('should have correct provider nesting order', () => {
    render(
      <RootLayout>
        <div data-testid="child-content">Test</div>
      </RootLayout>,
    );

    const nextAuthProvider = screen.getByTestId('nextauth-provider');
    const antdRegistry = screen.getByTestId('antd-registry');
    const antdApp = screen.getByTestId('antd-app');
    const notificationProvider = screen.getByTestId('notification-provider');
    const childContent = screen.getByTestId('child-content');

    expect(nextAuthProvider).toContainElement(antdRegistry);
    expect(antdRegistry).toContainElement(antdApp);
    expect(antdApp).toContainElement(notificationProvider);
    expect(notificationProvider).toContainElement(childContent);
  });
});

describe('metadata', () => {
  it('should have correct title', () => {
    expect(metadata.title).toBe('E-shop');
  });
});
