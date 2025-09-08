import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {NextAuthProvider} from './nextAuthProvider';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  SessionProvider: ({
    children,
    refetchInterval,
    refetchOnWindowFocus,
    refetchWhenOffline,
  }: any) => (
    <div
      data-testid="session-provider"
      data-refetch-interval={refetchInterval}
      data-refetch-on-window-focus={String(refetchOnWindowFocus)}
      data-refetch-when-offline={String(refetchWhenOffline)}>
      {children}
    </div>
  ),
}));

describe('NextAuthProvider', () => {
  it('should render SessionProvider with correct props', () => {
    render(<NextAuthProvider />);

    const provider = screen.getByTestId('session-provider');
    expect(provider).toBeInTheDocument();
    expect(provider).toHaveAttribute('data-refetch-interval', '300'); // 5 * 60
    expect(provider).toHaveAttribute('data-refetch-on-window-focus', 'true');
    expect(provider).toHaveAttribute('data-refetch-when-offline', 'false');
  });

  it('should render children when provided', () => {
    render(
      <NextAuthProvider>
        <div data-testid="child">Test Child</div>
      </NextAuthProvider>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should render without children', () => {
    render(<NextAuthProvider />);

    const provider = screen.getByTestId('session-provider');
    expect(provider).toBeInTheDocument();
    expect(provider).toBeEmptyDOMElement();
  });

  it('should wrap content in SessionProvider', () => {
    render(
      <NextAuthProvider>
        <span>Wrapped Content</span>
        <button>Action Button</button>
      </NextAuthProvider>,
    );

    const provider = screen.getByTestId('session-provider');
    expect(provider).toBeInTheDocument();
    expect(screen.getByText('Wrapped Content')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });
});
