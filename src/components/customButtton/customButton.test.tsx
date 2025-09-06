import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import CustomButton from './customButton';

describe('CustomButton component', () => {
  it('renders with the correct text', () => {
    const handleClick = vi.fn();
    const buttonText = 'Click Me!';
    render(<CustomButton buttonText={buttonText} onClick={handleClick} />);
    const button = screen.getByRole('button', {name: buttonText});

    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(buttonText);
  });

  it('triggers the onClick function when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const buttonText = 'Click Me!';
    render(<CustomButton buttonText={buttonText} onClick={handleClick} />);
    const button = screen.getByRole('button', {name: buttonText});

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is accessible and focusable', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const buttonText = 'Submit Form';
    render(<CustomButton buttonText={buttonText} onClick={handleClick} />);
    const button = screen.getByRole('button', {name: buttonText});

    await user.tab();
    expect(button).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders loading state with spinner', () => {
    const handleClick = vi.fn();
    render(
      <CustomButton
        buttonText="Loading"
        onClick={handleClick}
        isLoading={true}
      />,
    );
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(button.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    const handleClick = vi.fn();
    render(
      <CustomButton
        buttonText="Disabled"
        onClick={handleClick}
        disabled={true}
      />,
    );
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
  });

  it('renders with submit type', () => {
    render(<CustomButton buttonText="Submit" type="submit" />);
    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('type', 'submit');
  });

  it('renders with reset type', () => {
    render(<CustomButton buttonText="Reset" type="reset" />);
    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('type', 'reset');
  });

  it('renders with different background colors', () => {
    const {rerender} = render(
      <CustomButton buttonText="Test" backgroundColor="dark" />,
    );
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-dark');

    rerender(<CustomButton buttonText="Test" backgroundColor="danger" />);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-danger');

    rerender(<CustomButton buttonText="Test" backgroundColor="accent" />);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-accent');

    rerender(<CustomButton buttonText="Test" backgroundColor="border" />);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-border');
  });

  it('renders with different text colors', () => {
    const {rerender} = render(
      <CustomButton buttonText="Test" textColor="primary" />,
    );
    let button = screen.getByRole('button');
    expect(button).toHaveClass('text-primary');

    rerender(<CustomButton buttonText="Test" textColor="dark" />);
    button = screen.getByRole('button');
    expect(button).toHaveClass('text-dark');
  });

  it('renders with icon', () => {
    const TestIcon = <span data-testid="test-icon">🔥</span>;
    render(<CustomButton buttonText="With Icon" icon={TestIcon} />);

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });

  it('renders spinner with different colors', () => {
    const {rerender} = render(
      <CustomButton
        buttonText="Loading"
        isLoading={true}
        spinColor="primary"
      />,
    );
    let button = screen.getByRole('button');
    let spinner = button.querySelector('.animate-spin');
    expect(spinner).toHaveClass('border-primary');

    rerender(
      <CustomButton buttonText="Loading" isLoading={true} spinColor="dark" />,
    );
    button = screen.getByRole('button');
    spinner = button.querySelector('.animate-spin');
    expect(spinner).toHaveClass('border-dark');
  });

  it('prevents event propagation on click', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <CustomButton buttonText="Click Me" onClick={handleClick} />
      </div>,
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('works without onClick handler', async () => {
    const user = userEvent.setup();
    render(<CustomButton buttonText="No Handler" />);
    const button = screen.getByRole('button');

    await user.click(button);
    expect(button).toBeInTheDocument();
  });
});
