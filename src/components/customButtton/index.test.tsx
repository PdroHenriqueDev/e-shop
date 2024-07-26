import {describe, it, expect} from 'vitest';
import {render} from '@testing-library/react';
import CustomButton from './index';

describe('CustomButton component', () => {
  it('renders with the correct text', () => {
    const buttonText = 'Click Me!';
    const {getByText} = render(
      <CustomButton buttonText={buttonText} onClick={() => {}} />,
    );
    expect(getByText(buttonText)).toBeDefined();
  });
});
