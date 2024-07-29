import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
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
    expect(input).toBeTruthy();
    expect(screen.getByLabelText('Username')).toBeTruthy();
  });

  it('displays error message when provided', () => {
    const errorMessage = 'Username is required';
    render(<WrapperComponent errorMessage={errorMessage} />);
    const error = screen.getByText(errorMessage);
    expect(error.textContent).toBe(errorMessage);
  });
});
