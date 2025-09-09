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

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Dropdown: ({children, menu}: any) => (
      <div data-testid="admin-dropdown">
        {children}
        <div data-testid="admin-dropdown-menu">
          {menu?.items?.map((it: any) => (
            <button
              key={it.key}
              data-testid={`dropdown-item-${it.key}`}
              onClick={it.onClick}>
              {typeof it.label === 'string' ? it.label : it.key}
            </button>
          ))}
        </div>
      </div>
    ),
  };
});

vi.mock('@ant-design/icons', () => ({
  DashboardOutlined: (p: any) => (
    <span data-testid="dashboard-icon" {...p}>
      Dashboard
    </span>
  ),
  ShoppingOutlined: (p: any) => (
    <span data-testid="shopping-icon" {...p}>
      Shopping
    </span>
  ),
  UserOutlined: (p: any) => (
    <span data-testid="user-icon" {...p}>
      User
    </span>
  ),
  OrderedListOutlined: (p: any) => (
    <span data-testid="orders-icon" {...p}>
      Orders
    </span>
  ),
  LogoutOutlined: (p: any) => (
    <span data-testid="logout-icon" {...p}>
      Logout
    </span>
  ),
  MenuFoldOutlined: (p: any) => (
    <button data-testid="menu-fold-icon" {...p}>
      Fold
    </button>
  ),
  MenuUnfoldOutlined: (p: any) => (
    <button data-testid="menu-unfold-icon" {...p}>
      Unfold
    </button>
  ),
}));

global.fetch = vi.fn();

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

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

    expect(document.querySelector('.ant-spin-spinning')).toBeInTheDocument();
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

    expect(document.querySelector('.ant-spin-spinning')).toBeInTheDocument();
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
      expect(screen.getAllByText('E-Shop Admin')).toHaveLength(2);
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
      expect(screen.getAllByText('Dashboard')).toHaveLength(2); // Icon + Menu link
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
      expect(screen.getAllByText('E-Shop Admin')).toHaveLength(2);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
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

  it('calls signOut when clicking Logout in the user dropdown', async () => {
    mockUseSession.mockReturnValue({
      data: {user: {name: 'Admin User'}},
      status: 'authenticated',
    } as any);

    mockFetch.mockResolvedValueOnce({ok: true} as Response);

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('admin-dropdown')).toBeInTheDocument(),
    );

    const logoutBtn = screen.getByTestId('dropdown-item-logout');
    logoutBtn.click();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('toggles collapsed state via header icons and updates sider title text', async () => {
    mockUseSession.mockReturnValue({
      data: {user: {name: 'Admin User'}},
      status: 'authenticated',
    } as any);

    mockFetch.mockResolvedValueOnce({ok: true} as Response);

    render(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>,
    );

    await waitFor(() =>
      expect(screen.getAllByText('E-Shop Admin')).toHaveLength(2),
    );

    expect(screen.getByTestId('menu-fold-icon')).toBeInTheDocument();
    expect(screen.getAllByText('E-Shop Admin')).toHaveLength(2);

    screen.getByTestId('menu-fold-icon').click();

    await waitFor(() => {
      expect(screen.getByTestId('menu-unfold-icon')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getAllByText('E-Shop Admin')).toHaveLength(1);
    });

    screen.getByTestId('menu-unfold-icon').click();

    await waitFor(() => {
      expect(screen.getByTestId('menu-fold-icon')).toBeInTheDocument();
      expect(screen.getAllByText('E-Shop Admin')).toHaveLength(2);
    });
  });
});
