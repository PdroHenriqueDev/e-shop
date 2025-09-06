import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {useForm} from 'react-hook-form';
import CustomInput from './index';

const WrapperComponent = ({
  errorMessage,
  label,
  type = 'text',
  id = 'username',
  placeholder = 'Enter your username',
  name = 'username',
}: {
  errorMessage?: string;
  label?: string;
  type?: string;
  id?: string;
  placeholder?: string;
  name?: string;
}) => {
  const {register} = useForm();
  return (
    <CustomInput
      label={label}
      id={id}
      type={type}
      placeholder={placeholder}
      register={register}
      name={name}
      errorMessage={errorMessage}
    />
  );
};

describe('CustomInput component', () => {
  it('renders correctly with given props', () => {
    render(<WrapperComponent label="Username" />);
    const input = screen.getByPlaceholderText('Enter your username');
    const label = screen.getByLabelText('Username');

    expect(input).toBeInTheDocument();
    expect(label).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('id', 'username');
  });

  it('renders without label when not provided', () => {
    render(<WrapperComponent />);
    const input = screen.getByPlaceholderText('Enter your username');
    const label = screen.queryByText('Username');

    expect(input).toBeInTheDocument();
    expect(label).not.toBeInTheDocument();
  });

  it('renders with different input types', () => {
    const {rerender} = render(
      <WrapperComponent type="password" placeholder="Enter password" />,
    );
    let input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('type', 'password');

    rerender(<WrapperComponent type="email" placeholder="Enter email" />);
    input = screen.getByPlaceholderText('Enter email');
    expect(input).toHaveAttribute('type', 'email');

    rerender(<WrapperComponent type="number" placeholder="Enter number" />);
    input = screen.getByPlaceholderText('Enter number');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('displays error message when provided', () => {
    const errorMessage = 'Username is required';
    render(<WrapperComponent errorMessage={errorMessage} label="Username" />);
    const error = screen.getByText(errorMessage);

    expect(error).toBeInTheDocument();
    expect(error).toHaveTextContent(errorMessage);
  });

  it('allows user input and interaction', async () => {
    const user = userEvent.setup();
    render(<WrapperComponent label="Username" />);
    const input = screen.getByPlaceholderText('Enter your username');

    await user.type(input, 'testuser');
    expect(input).toHaveValue('testuser');

    await user.clear(input);
    expect(input).toHaveValue('');

    await user.type(input, 'newuser');
    expect(input).toHaveValue('newuser');
  });

  it('handles focus and blur events', async () => {
    const user = userEvent.setup();
    render(<WrapperComponent label="Username" />);
    const input = screen.getByPlaceholderText('Enter your username');

    await user.click(input);
    expect(input).toHaveFocus();

    await user.tab();
    expect(input).not.toHaveFocus();
  });

  it('is accessible with proper label association', () => {
    render(<WrapperComponent label="Email Address" id="email" />);
    const input = screen.getByLabelText('Email Address');
    const label = screen.getByText('Email Address');

    expect(input).toBeInTheDocument();
    expect(label).toHaveAttribute('for', 'email');
    expect(input).toHaveAttribute('id', 'email');
  });

  it('applies correct CSS classes', () => {
    render(<WrapperComponent label="Username" />);
    const input = screen.getByPlaceholderText('Enter your username');
    const container = input.closest('div');

    expect(container).toHaveClass('mb-4');
    expect(input).toHaveClass(
      'w-full',
      'px-4',
      'py-2',
      'mt-2',
      'text-sm',
      'bg-primary',
      'border',
      'rounded-md',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-secondary',
    );
  });

  it('does not display error message when not provided', () => {
    render(<WrapperComponent label="Username" />);
    const errorElement = screen.queryByRole('alert');

    expect(errorElement).not.toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<WrapperComponent label="Username" />);
    const input = screen.getByPlaceholderText('Enter your username');

    await user.tab();
    expect(input).toHaveFocus();

    await user.keyboard('Hello World');
    expect(input).toHaveValue('Hello World');

    await user.keyboard('{Backspace>5}');
    expect(input).toHaveValue('Hello ');
  });
});
