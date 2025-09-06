import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {useForm} from 'react-hook-form';
import CustomInput from './index';

const WrapperComponent = ({errorMessage}: {errorMessage?: string}) => {
  const {register} = useForm();
  return (
    <CustomInput
      label="Username"
      id="username"
      type="text"
      placeholder="Enter your username"
      register={register}
      name="username"
      errorMessage={errorMessage}
    />
  );
};

describe('CustomInput component', () => {
  it('renders correctly with given props', () => {
    render(<WrapperComponent />);
    const input = screen.getByPlaceholderText('Enter your username');
    const label = screen.getByLabelText('Username');

    expect(input).toBeInTheDocument();
    expect(label).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('id', 'username');
  });

  it('displays error message when provided', () => {
    const errorMessage = 'Username is required';
    render(<WrapperComponent errorMessage={errorMessage} />);
    const error = screen.getByText(errorMessage);

    expect(error).toBeInTheDocument();
    expect(error).toHaveTextContent(errorMessage);
  });

  it('allows user input', async () => {
    const user = userEvent.setup();
    render(<WrapperComponent />);
    const input = screen.getByPlaceholderText('Enter your username');

    await user.type(input, 'testuser');
    expect(input).toHaveValue('testuser');
  });

  it('does not display error message when not provided', () => {
    render(<WrapperComponent />);
    const errorElement = screen.queryByRole('alert');

    expect(errorElement).not.toBeInTheDocument();
  });
});
