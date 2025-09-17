import {render, screen, fireEvent} from '@testing-library/react';
import {vi} from 'vitest';
import Login from './page';

vi.mock('@/components/auth/loginForm', () => ({
  default: vi.fn(() => <div data-testid="login-form">Login Form</div>),
}));

vi.mock('@/components/auth/registerForm', () => ({
  default: vi.fn(({handleIsRegister}) => (
    <div data-testid="register-form">
      <button onClick={handleIsRegister}>Mock Register Action</button>
    </div>
  )),
}));

vi.mock('@/contexts/notificationContext', () => ({
  NotificationProvider: vi.fn(({children}) => (
    <div data-testid="notification-provider">{children}</div>
  )),
}));

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form by default', () => {
    render(<Login />);

    expect(screen.getByTestId('notification-provider')).toBeInTheDocument();
    expect(screen.getByText('Log in to your account')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Fill in the form with your credentials to log in to your account.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
  });

  it('renders register form when register button is clicked', () => {
    render(<Login />);

    const registerButton = screen.getByRole('button', {name: 'Register'});
    fireEvent.click(registerButton);

    expect(screen.getByText('Create a new account')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Fill in the form with your credentials and create a new account on our platform.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
  });

  it('toggles back to login form when login button is clicked from register view', () => {
    render(<Login />);

    const registerButton = screen.getByRole('button', {name: 'Register'});
    fireEvent.click(registerButton);

    expect(screen.getByTestId('register-form')).toBeInTheDocument();

    const loginButton = screen.getByRole('button', {name: 'Login'});
    fireEvent.click(loginButton);

    expect(screen.getByText('Log in to your account')).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
  });

  it('applies correct CSS classes for login state', () => {
    render(<Login />);

    const loginButton = screen.getByRole('button', {name: 'Login'});
    const registerButton = screen.getByRole('button', {name: 'Register'});

    expect(loginButton).toHaveClass('text-dark bg-primary');
    expect(registerButton).toHaveClass('text-dark bg-transparent');
  });

  it('applies correct CSS classes for register state', () => {
    render(<Login />);

    const registerButton = screen.getByRole('button', {name: 'Register'});
    fireEvent.click(registerButton);

    const loginButton = screen.getByRole('button', {name: 'Login'});

    expect(loginButton).toHaveClass('text-dark bg-transparent');
    expect(registerButton).toHaveClass('text-dark bg-primary');
  });

  it('passes handleIsRegister function to RegisterForm', () => {
    render(<Login />);

    const registerButton = screen.getByRole('button', {name: 'Register'});
    fireEvent.click(registerButton);

    const mockRegisterAction = screen.getByText('Mock Register Action');
    fireEvent.click(mockRegisterAction);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
  });

  it('renders with correct layout structure', () => {
    render(<Login />);

    const container = screen.getByTestId('notification-provider');
    expect(container).toBeInTheDocument();

    const mainDiv = container.querySelector(
      '.flex.items-center.justify-center.min-h-screen.p-5',
    );
    expect(mainDiv).toBeInTheDocument();

    const cardDiv = mainDiv?.querySelector(
      '.bg-primary.p-6.rounded-lg.shadow-lg.w-full.max-w-md',
    );
    expect(cardDiv).toBeInTheDocument();
  });

  it('renders emoji with correct accessibility attributes', () => {
    render(<Login />);

    const waveEmoji = screen.getByRole('img', {name: 'wave'});
    expect(waveEmoji).toBeInTheDocument();
    expect(waveEmoji).toHaveAttribute('aria-label', 'wave');
  });

  it('renders emoji in register state with correct accessibility attributes', () => {
    render(<Login />);

    const registerButton = screen.getByRole('button', {name: 'Register'});
    fireEvent.click(registerButton);

    const waveEmoji = screen.getByRole('img', {name: 'wave'});
    expect(waveEmoji).toBeInTheDocument();
    expect(waveEmoji).toHaveAttribute('aria-label', 'wave');
  });

  it('maintains state consistency during multiple toggles', () => {
    render(<Login />);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();

    const registerButton = screen.getByRole('button', {name: 'Register'});
    fireEvent.click(registerButton);
    expect(screen.getByTestId('register-form')).toBeInTheDocument();

    const loginButton = screen.getByRole('button', {name: 'Login'});
    fireEvent.click(loginButton);
    expect(screen.getByTestId('login-form')).toBeInTheDocument();

    fireEvent.click(registerButton);
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
  });
});
