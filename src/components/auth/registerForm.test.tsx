import {render, screen, waitFor} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {describe, it, expect, vi, beforeEach, afterEach, Mock} from 'vitest';
import RegisterForm from './registerForm';
import {useNotification} from '@/contexts/notificationContext';
import axios from '@/lib/axios';

vi.mock('@/lib/axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('@/contexts/notificationContext', () => ({
  useNotification: vi.fn(),
}));

const mockHandleIsRegister = vi.fn();
const mockNotify = vi.fn();

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useNotification as Mock).mockReturnValue({notify: mockNotify});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should display validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<RegisterForm handleIsRegister={mockHandleIsRegister} />);

    const submitButton = screen.getByRole('button', {name: /register/i});
    await user.click(submitButton);

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
    const user = userEvent.setup();
    render(<RegisterForm handleIsRegister={mockHandleIsRegister} />);

    await user.type(
      screen.getByPlaceholderText('Enter your full name'),
      'testuser',
    );
    await user.type(
      screen.getByPlaceholderText('Enter your email'),
      'test@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('Enter your password'),
      'password123',
    );
    await user.type(
      screen.getByPlaceholderText('Confirm your password'),
      'password456',
    );

    const submitButton = screen.getByRole('button', {name: /register/i});
    await user.click(submitButton);

    expect(
      await screen.findByText("Passwords don't match."),
    ).toBeInTheDocument();
  });

  it('should call handleIsRegister on successful registration', async () => {
    (axios.post as Mock).mockResolvedValue({data: {message: 'Success'}});

    const user = userEvent.setup();
    render(<RegisterForm handleIsRegister={mockHandleIsRegister} />);

    await user.type(
      screen.getByPlaceholderText('Enter your full name'),
      'testuser',
    );
    await user.type(
      screen.getByPlaceholderText('Enter your email'),
      'test@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('Enter your password'),
      'password123',
    );
    await user.type(
      screen.getByPlaceholderText('Confirm your password'),
      'password123',
    );

    const submitButton = screen.getByRole('button', {name: /register/i});
    await user.click(submitButton);

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
    (axios.post as Mock).mockRejectedValue({
      response: {
        status: 400,
        data: {error: 'User already exists'},
      },
    });

    const user = userEvent.setup();
    render(<RegisterForm handleIsRegister={mockHandleIsRegister} />);

    await user.type(
      screen.getByPlaceholderText('Enter your full name'),
      'testuser',
    );
    await user.type(
      screen.getByPlaceholderText('Enter your email'),
      'test@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('Enter your password'),
      'password123',
    );
    await user.type(
      screen.getByPlaceholderText('Confirm your password'),
      'password123',
    );

    const submitButton = screen.getByRole('button', {name: /register/i});
    await user.click(submitButton);

    await waitFor(() =>
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'error',
        msg: 'User already exists',
      }),
    );

    (axios.post as Mock).mockRejectedValue(new Error('Network error'));

    await user.click(submitButton);

    await waitFor(() =>
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'error',
        msg: 'Register failed. Please try again',
      }),
    );
  });
});
