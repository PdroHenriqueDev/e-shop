import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {useSession} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {signOut} from 'next-auth/react';
import AdminLayout from './layout';
import {vi} from 'vitest';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('next/link', () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => {
    return <a href={href}>{children}</a>;
  };
  return {
    __esModule: true,
    default: MockLink,
  };
});

vi.mock('antd', () => {
  const MockLayout = ({children}: {children: React.ReactNode}) => (
    <div data-testid="admin-layout">{children}</div>
  );
  MockLayout.displayName = 'MockLayout';

  const MockHeader = ({children}: {children: React.ReactNode}) => (
    <header data-testid="admin-header">{children}</header>
  );
  MockHeader.displayName = 'MockHeader';
  MockLayout.Header = MockHeader;

  const MockSider = ({children}: {children: React.ReactNode}) => (
    <aside data-testid="admin-sider">{children}</aside>
  );
  MockSider.displayName = 'MockSider';
  MockLayout.Sider = MockSider;

  const MockContent = ({children}: {children: React.ReactNode}) => (
    <main data-testid="admin-content">{children}</main>
  );
  MockContent.displayName = 'MockContent';
  MockLayout.Content = MockContent;

  return {
    Layout: MockLayout,
    Menu: ({children}: {children: React.ReactNode}) => (
      <nav data-testid="admin-menu">{children}</nav>
    ),
    Avatar: ({children}: {children: React.ReactNode}) => (
      <div data-testid="admin-avatar">{children}</div>
    ),
    Dropdown: ({children}: {children: React.ReactNode}) => (
      <div data-testid="admin-dropdown">{children}</div>
    ),
    Spin: ({children}: {children: React.ReactNode}) => (
      <div data-testid="admin-spinner">Loading...</div>
    ),
    ConfigProvider: ({children}: {children: React.ReactNode}) => (
      <div data-testid="config-provider">{children}</div>
    ),
  };
});

vi.mock('@ant-design/icons', () => ({
  DashboardOutlined: () => <span data-testid="dashboard-icon">Dashboard</span>,
  ShoppingOutlined: () => <span data-testid="shopping-icon">Shopping</span>,
  UserOutlined: () => <span data-testid="user-icon">User</span>,
  OrderedListOutlined: () => <span data-testid="orders-icon">Orders</span>,
  LogoutOutlined: () => <span data-testid="logout-icon">Logout</span>,
  MenuFoldOutlined: () => <span data-testid="menu-fold-icon">Fold</span>,
  MenuUnfoldOutlined: () => <span data-testid="menu-unfold-icon">Unfold</span>,
}));

global.fetch = vi.fn();

const mockPush = vi.fn();
const mockUseRouter = useRouter as ReturnType<typeof vi.fn>;
const mockUseSession = useSession as ReturnType<typeof vi.fn>;
const mockSignOut = signOut as ReturnType<typeof vi.fn>;
const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as any);
  });

  it('should show loading spinner when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    } as any);

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    expect(screen.getByTestId('admin-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should redirect to login when no session exists', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as any);

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should show loading spinner initially when validating admin access', async () => {
    mockUseSession.mockReturnValue({
      data: {user: {name: 'Admin User'}},
      status: 'authenticated',
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    expect(screen.getByTestId('admin-spinner')).toBeInTheDocument();
  });

  it('should redirect to home when admin validation fails', async () => {
    mockUseSession.mockReturnValue({
      data: {user: {name: 'Regular User'}},
      status: 'authenticated',
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: false,
    } as Response);

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('should redirect to home when admin validation throws error', async () => {
    mockUseSession.mockReturnValue({
      data: {user: {name: 'Admin User'}},
      status: 'authenticated',
    } as any);

    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Admin access validation failed:',
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });

  it('should render admin layout when validation succeeds', async () => {
    mockUseSession.mockReturnValue({
      data: {user: {name: 'Admin User'}},
      status: 'authenticated',
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    render(
      <AdminLayout>
        <div data-testid="test-content">Test Content</div>
      </AdminLayout>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('config-provider')).toBeInTheDocument();
      expect(screen.getByTestId('admin-sider')).toBeInTheDocument();
      expect(screen.getByTestId('admin-header')).toBeInTheDocument();
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  it('should render menu component', async () => {
    mockUseSession.mockReturnValue({
      data: {user: {name: 'Admin User'}},
      status: 'authenticated',
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-menu')).toBeInTheDocument();
    });
  });

  it('should render user dropdown', async () => {
    mockUseSession.mockReturnValue({
      data: {user: {name: 'Admin User'}},
      status: 'authenticated',
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-dropdown')).toBeInTheDocument();
    });
  });

  it('should render without errors when authenticated', async () => {
    mockUseSession.mockReturnValue({
      data: {user: {name: 'Admin User'}},
      status: 'authenticated',
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('config-provider')).toBeInTheDocument();
      expect(screen.getByTestId('admin-sider')).toBeInTheDocument();
      expect(screen.getByTestId('admin-header')).toBeInTheDocument();
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });
  });

  it('should display user name in header', async () => {
    mockUseSession.mockReturnValue({
      data: {user: {name: 'John Admin'}},
      status: 'authenticated',
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    await waitFor(() => {
      expect(screen.getByText('John Admin')).toBeInTheDocument();
    });
  });

  it('should display default Admin text when no user name', async () => {
    mockUseSession.mockReturnValue({
      data: {user: {}},
      status: 'authenticated',
    } as any);

    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });
});