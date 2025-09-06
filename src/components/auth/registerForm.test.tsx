import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {describe, it, expect, vi, beforeEach, Mock} from 'vitest';
import axios from 'axios';
import RegisterForm from './registerForm';
import {useNotification} from '@/contexts/notificationContext';

vi.mock('axios');

vi.mock('@/contexts/notificationContext', () => ({
  useNotification: vi.fn(),
}));

const mockHandleIsRegister = vi.fn();

describe('RegisterForm', () => {
  beforeEach(() => {
    (useNotification as Mock).mockReturnValue({notify: vi.fn()});
  });

  it('should display validation errors for empty fields', async () => {
    render(<RegisterForm handleIsRegister={mockHandleIsRegister} />);

    fireEvent.click(screen.getByText('Register'));

    expect(
      await screen.findByText('Username must be at least 2 characters.'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Invalid email format.'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Password must be at least 6 characters.'),
    ).toBeInTheDocument();
  });

  it('should display error if passwords do not match', async () => {
    render(<RegisterForm handleIsRegister={mockHandleIsRegister} />);

    fireEvent.input(screen.getByPlaceholderText('Enter your full name'), {
      target: {value: 'testuser'},
    });
    fireEvent.input(screen.getByPlaceholderText('Enter your email'), {
      target: {value: 'test@example.com'},
    });
    fireEvent.input(screen.getByPlaceholderText('Enter your password'), {
      target: {value: 'password123'},
    });
    fireEvent.input(screen.getByPlaceholderText('Confirm your password'), {
      target: {value: 'password456'},
    });

    fireEvent.click(screen.getByText('Register'));

    expect(
      await screen.findByText("Passwords don't match."),
    ).toBeInTheDocument();
  });

  it('should call handleIsRegister on successful registration', async () => {
    const mockNotify = vi.fn();
    (useNotification as Mock).mockReturnValue({notify: mockNotify});
    (axios.post as Mock).mockResolvedValue({});

    render(<RegisterForm handleIsRegister={mockHandleIsRegister} />);

    fireEvent.input(screen.getByPlaceholderText('Enter your full name'), {
      target: {value: 'testuser'},
    });
    fireEvent.input(screen.getByPlaceholderText('Enter your email'), {
      target: {value: 'test@example.com'},
    });
    fireEvent.input(screen.getByPlaceholderText('Enter your password'), {
      target: {value: 'password123'},
    });
    fireEvent.input(screen.getByPlaceholderText('Confirm your password'), {
      target: {value: 'password123'},
    });

    fireEvent.click(screen.getByText('Register'));

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith('/api/auth/register', {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }),
    );

    await waitFor(() => expect(mockHandleIsRegister).toHaveBeenCalled());
  });

  it('should show notification on registration failure', async () => {
    const mockNotify = vi.fn();
    (useNotification as Mock).mockReturnValue({notify: mockNotify});
    (axios.post as Mock).mockRejectedValue({
      response: {
        status: 400,
        data: {error: 'User already exists'},
      },
    });

    render(<RegisterForm handleIsRegister={mockHandleIsRegister} />);

    fireEvent.input(screen.getByPlaceholderText('Enter your full name'), {
      target: {value: 'testuser'},
    });
    fireEvent.input(screen.getByPlaceholderText('Enter your email'), {
      target: {value: 'test@example.com'},
    });
    fireEvent.input(screen.getByPlaceholderText('Enter your password'), {
      target: {value: 'password123'},
    });
    fireEvent.input(screen.getByPlaceholderText('Confirm your password'), {
      target: {value: 'password123'},
    });

    fireEvent.click(screen.getByText('Register'));

    await waitFor(() =>
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'error',
        msg: 'User already exists',
      }),
    );

    (axios.post as Mock).mockRejectedValue({});

    fireEvent.click(screen.getByText('Register'));

    await waitFor(() =>
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'error',
        msg: 'Register failed. Please try again',
      }),
    );
  });
});
