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
});
