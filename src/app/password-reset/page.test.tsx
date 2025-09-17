import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {vi} from 'vitest';
import PasswordResetForm from './page';

const mockPush = vi.fn();
const mockNotify = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/contexts/notificationContext', () => ({
  useNotification: () => ({
    notify: mockNotify,
  }),
}));

vi.mock('@/lib/axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('@/components/customInput', () => ({
  default: vi.fn(({id, type, placeholder, register, name, errorMessage}) => (
    <div data-testid="custom-input">
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        data-testid={`input-${name}`}
      />
      {errorMessage && (
        <span data-testid={`error-${name}`}>{errorMessage}</span>
      )}
    </div>
  )),
}));

vi.mock('@/components/customButtton/customButton', () => ({
  default: vi.fn(({type, buttonText, isLoading}) => (
    <button type={type} disabled={isLoading} data-testid="custom-button">
      {isLoading ? 'Loading...' : buttonText}
    </button>
  )),
}));

describe('PasswordResetForm', () => {
  let mockAxiosPost: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const axios = await import('@/lib/axios');
    mockAxiosPost = vi.mocked(axios.default.post);
  });

  it('renders password reset form with correct elements', () => {
    render(<PasswordResetForm />);

    expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    expect(
      screen.getByText('Enter your email to receive a new password.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('custom-input')).toBeInTheDocument();
    expect(screen.getByTestId('input-email')).toBeInTheDocument();
    expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
  });

  it('renders emoji with correct accessibility attributes', () => {
    render(<PasswordResetForm />);

    const lockEmoji = screen.getByRole('img', {name: 'wave'});
    expect(lockEmoji).toBeInTheDocument();
    expect(lockEmoji).toHaveAttribute('aria-label', 'wave');
  });

  it('displays validation error for invalid email format', async () => {
    render(<PasswordResetForm />);

    const emailInput = screen.getByTestId('input-email');
    const submitButton = screen.getByTestId('custom-button');

    fireEvent.change(emailInput, {target: {value: 'invalid-email'}});
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-email')).toBeInTheDocument();
      expect(screen.getByText('Invalid email format.')).toBeInTheDocument();
    });
  });

  it('submits form successfully with valid email', async () => {
    mockAxiosPost.mockResolvedValueOnce({});

    render(<PasswordResetForm />);

    const emailInput = screen.getByTestId('input-email');
    const submitButton = screen.getByTestId('custom-button');

    fireEvent.change(emailInput, {target: {value: 'test@example.com'}});
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAxiosPost).toHaveBeenCalledWith('/api/auth/password-reset', {
        email: 'test@example.com',
      });
    });

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'success',
        msg: 'Password has been sent to your email.',
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('handles API error during form submission', async () => {
    const errorMessage = 'Network Error';
    mockAxiosPost.mockRejectedValueOnce(new Error(errorMessage));

    render(<PasswordResetForm />);

    const emailInput = screen.getByTestId('input-email');
    const submitButton = screen.getByTestId('custom-button');

    fireEvent.change(emailInput, {target: {value: 'test@example.com'}});
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAxiosPost).toHaveBeenCalledWith('/api/auth/password-reset', {
        email: 'test@example.com',
      });
    });

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        type: 'error',
        msg: 'Failed to send password. Please try again.',
      });
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows loading state during form submission', async () => {
    let resolvePromise;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    mockAxiosPost.mockReturnValueOnce(promise);

    render(<PasswordResetForm />);

    const emailInput = screen.getByTestId('input-email');
    const submitButton = screen.getByTestId('custom-button');

    fireEvent.change(emailInput, {target: {value: 'test@example.com'}});
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    resolvePromise!({});

    await waitFor(() => {
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });
  });

  it('resets loading state after successful submission', async () => {
    mockAxiosPost.mockResolvedValueOnce({});

    render(<PasswordResetForm />);

    const emailInput = screen.getByTestId('input-email');
    const submitButton = screen.getByTestId('custom-button');

    fireEvent.change(emailInput, {target: {value: 'test@example.com'}});
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAxiosPost).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('resets loading state after failed submission', async () => {
    mockAxiosPost.mockRejectedValueOnce(new Error('Network Error'));

    render(<PasswordResetForm />);

    const emailInput = screen.getByTestId('input-email');
    const submitButton = screen.getByTestId('custom-button');

    fireEvent.change(emailInput, {target: {value: 'test@example.com'}});
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAxiosPost).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('renders with correct layout structure', () => {
    render(<PasswordResetForm />);

    const container = document.querySelector(
      '.flex.items-center.justify-center.min-h-screen.p-5',
    );
    expect(container).toBeInTheDocument();

    const card = container?.querySelector(
      '.bg-primary.p-6.rounded-lg.shadow-lg.w-full.max-w-md',
    );
    expect(card).toBeInTheDocument();

    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('has correct default form values', () => {
    render(<PasswordResetForm />);

    const emailInput = screen.getByTestId('input-email');
    expect(emailInput).toHaveValue('');
  });

  it('validates empty email field', async () => {
    render(<PasswordResetForm />);

    const submitButton = screen.getByTestId('custom-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });
  });
});
