import {describe, it, expect, vitest} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import CustomButton from './customButton';

describe('CustomButton component', () => {
  it('renders with the correct text', () => {
    const handleClick = vitest.fn();
    const buttonText = 'Click Me!';
    render(<CustomButton buttonText={buttonText} onClick={handleClick} />);
    const button = screen.getByText(buttonText);

    expect(button).toBeDefined();
    expect(button.textContent).toBe(buttonText);
  });

  it('triggers the onClick function when clicked', () => {
    const handleClick = vitest.fn();
    const buttonText = 'Click Me!';
    render(<CustomButton buttonText={buttonText} onClick={handleClick} />);
    const button = screen.getByText(buttonText);

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });
});
