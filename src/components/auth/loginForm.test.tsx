import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {describe, it, expect, vi, Mock} from 'vitest';
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

describe('LoginForm', () => {
  it('should display validation errors for empty fields', async () => {
    (useRouter as Mock).mockReturnValue({push: vi.fn()});
    (useNotification as Mock).mockReturnValue({notify: vi.fn()});

    render(<LoginForm />);

    fireEvent.click(screen.getByText('Sign in'));

    expect(
      await screen.findByText('Invalid email format.'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Password must be at least 6 characters.'),
    ).toBeInTheDocument();
  });

  it('should call signIn and navigate on successful login', async () => {
    const mockPush = vi.fn();
    const mockNotify = vi.fn();

    (useRouter as Mock).mockReturnValue({push: mockPush});
    (useNotification as Mock).mockReturnValue({notify: mockNotify});
    (signIn as Mock).mockResolvedValue({error: null});

    render(<LoginForm />);

    fireEvent.input(screen.getByPlaceholderText('Enter your email'), {
      target: {value: 'test@example.com'},
    });
    fireEvent.input(screen.getByPlaceholderText('Enter your password'), {
      target: {value: 'password123'},
    });

    fireEvent.click(screen.getByText('Sign in'));

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
    const mockPush = vi.fn();
    const mockNotify = vi.fn();

    (useRouter as Mock).mockReturnValue({push: mockPush});
    (useNotification as Mock).mockReturnValue({notify: mockNotify});
    (signIn as Mock).mockResolvedValue({error: 'Invalid credentials'});

    render(<LoginForm />);

    fireEvent.input(screen.getByPlaceholderText('Enter your email'), {
      target: {value: 'test@example.com'},
    });
    fireEvent.input(screen.getByPlaceholderText('Enter your password'), {
      target: {value: 'password123'},
    });

    fireEvent.click(screen.getByText('Sign in'));

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
