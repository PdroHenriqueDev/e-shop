import {render, screen, waitFor} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {describe, it, expect, vi, beforeEach, afterEach, Mock} from 'vitest';
import {useRouter} from 'next/navigation';
import {signIn} from 'next-auth/react';
import LoginForm from './loginForm';
import {useNotification} from '@/contexts/notificationContext';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

vi.mock('@/contexts/notificationContext', () => ({
  useNotification: vi.fn(),
}));

const mockPush = vi.fn();
const mockNotify = vi.fn();

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue({push: mockPush});
    (useNotification as Mock).mockReturnValue({notify: mockNotify});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });
  it('should display validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', {name: /^sign in$/i});
    await user.click(submitButton);

    expect(
      await screen.findByText('Invalid email format.'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Password must be at least 6 characters.'),
    ).toBeInTheDocument();
  });

  it('should call signIn and navigate on successful login', async () => {
    (signIn as Mock).mockResolvedValue({ok: true, error: null});

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByPlaceholderText('Enter your email'),
      'test@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('Enter your password'),
      'password123',
    );

    const submitButton = screen.getByRole('button', {name: /^sign in$/i});
    await user.click(submitButton);

    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        email: 'test@example.com',
        password: 'password123',
      }),
    );

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
  });

  it('should show notification on login failure', async () => {
    (signIn as Mock).mockResolvedValue({error: 'Invalid credentials'});

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByPlaceholderText('Enter your email'),
      'test@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('Enter your password'),
      'password123',
    );

    const submitButton = screen.getByRole('button', {name: /^sign in$/i});
    await user.click(submitButton);

    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        email: 'test@example.com',
        password: 'password123',
      }),
    );

    await waitFor(() =>
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'error',
        msg: 'Login failed. Please check your credentials and try again',
      }),
    );
  });
});
