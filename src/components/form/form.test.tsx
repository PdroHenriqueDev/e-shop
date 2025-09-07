import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {z} from 'zod';
import Form, {useFormReturn} from './form';

// Mock react-hook-form with different scenarios
let mockErrors = {};
let mockHandleSubmit = vi.fn();

vi.mock('react-hook-form', () => ({
  useForm: vi.fn(() => ({
    register: vi.fn(() => ({})),
    handleSubmit: mockHandleSubmit,
    formState: {
      errors: mockErrors,
      isSubmitting: false,
    },
  })),
}));

// Mock custom components
vi.mock('../customInput', () => ({
  default: ({label, placeholder, id, errorMessage}: any) => (
    <div data-testid={`input-${id}`}>
      <label>{label}</label>
      <input placeholder={placeholder} />
      {errorMessage && <span data-testid={`error-${id}`}>{errorMessage}</span>}
    </div>
  ),
}));

vi.mock('../customButtton/customButton', () => ({
  default: ({children, isLoading, type}: any) => (
    <button data-testid="submit-button" type={type} disabled={isLoading}>
      {isLoading ? 'Loading...' : children}
    </button>
  ),
}));

const mockSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const mockFields = [
  {
    name: 'email' as const,
    label: 'Email',
    type: 'email',
    placeholder: 'Enter email',
    id: 'email',
  },
  {
    name: 'password' as const,
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    id: 'password',
  },
];

const mockDefaultValues = {
  email: '',
  password: '',
};

describe('Form Component', () => {
  it('should render form with required props', () => {
    const mockOnSubmit = vi.fn();

    render(
      <Form
        schema={mockSchema}
        defaultValues={mockDefaultValues}
        onSubmit={mockOnSubmit}
        fields={mockFields}
        submitButtonText="Submit"
      />,
    );

    expect(screen.getByTestId('input-email')).toBeInTheDocument();
    expect(screen.getByTestId('input-password')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('should render form with custom className', () => {
    const mockOnSubmit = vi.fn();

    render(
      <Form
        schema={mockSchema}
        defaultValues={mockDefaultValues}
        onSubmit={mockOnSubmit}
        fields={mockFields}
        submitButtonText="Submit"
        className="custom-class"
      />,
    );

    const form = document.querySelector('form')!;
    expect(form).toHaveClass('custom-class');
  });

  it('should call onSubmit when form is submitted', async () => {
    const mockOnSubmit = vi.fn();

    // Set up mockHandleSubmit to call the onSubmit function
    mockHandleSubmit = vi.fn(fn => (e: any) => {
      e.preventDefault();
      fn({email: 'test@test.com', password: 'password'});
    });

    render(
      <Form
        schema={mockSchema}
        defaultValues={mockDefaultValues}
        onSubmit={mockOnSubmit}
        fields={mockFields}
        submitButtonText="Submit"
      />,
    );

    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password',
      });
    });
  });

  it('should render children when provided', () => {
    const mockOnSubmit = vi.fn();

    render(
      <Form
        schema={mockSchema}
        defaultValues={mockDefaultValues}
        onSubmit={mockOnSubmit}
        fields={mockFields}
        submitButtonText="Submit">
        <div data-testid="child">Test Child</div>
      </Form>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const mockOnSubmit = vi.fn();

    render(
      <Form
        schema={mockSchema}
        defaultValues={mockDefaultValues}
        onSubmit={mockOnSubmit}
        fields={mockFields}
        submitButtonText="Submit"
        isLoading={true}
      />,
    );

    const button = screen.getByTestId('submit-button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Loading...');
  });

  it('should display error messages when validation fails', () => {
    const mockOnSubmit = vi.fn();

    // Set mock errors
    mockErrors = {
      email: {message: 'Invalid email format'},
      password: {message: 'Password too short'},
    };

    render(
      <Form
        schema={mockSchema}
        defaultValues={mockDefaultValues}
        onSubmit={mockOnSubmit}
        fields={mockFields}
        submitButtonText="Submit"
      />,
    );

    expect(screen.getByTestId('error-email')).toHaveTextContent(
      'Invalid email format',
    );
    expect(screen.getByTestId('error-password')).toHaveTextContent(
      'Password too short',
    );

    // Reset errors for other tests
    mockErrors = {};
  });
});

describe('useFormReturn hook', () => {
  it('should return form instance', () => {
    const result = useFormReturn(mockSchema, mockDefaultValues);
    expect(result).toBeDefined();
  });
});
