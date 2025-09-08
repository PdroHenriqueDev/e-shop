import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import Loading from './loading';

describe('Loading Component', () => {
  it('should render with default props', () => {
    render(<Loading />);

    const container = screen.getByText('Loading...');
    expect(container).toBeInTheDocument();
  });

  it('should render with small size', () => {
    render(<Loading size="small" />);

    const spinner = document.querySelector('.w-6.h-6');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with medium size (default)', () => {
    render(<Loading size="medium" />);

    const spinner = document.querySelector('.w-10.h-10');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with large size', () => {
    render(<Loading size="large" />);

    const spinner = document.querySelector('.w-16.h-16');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with primary color', () => {
    render(<Loading color="primary" />);

    const spinner = document.querySelector('.border-primary');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with secondary color (default)', () => {
    render(<Loading color="secondary" />);

    const spinner = document.querySelector('.border-secondary');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with dark color', () => {
    render(<Loading color="dark" />);

    const spinner = document.querySelector('.border-dark');
    expect(spinner).toBeInTheDocument();
  });

  it('should show text by default', () => {
    render(<Loading />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should hide text when showText is false', () => {
    render(<Loading showText={false} />);

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should render custom text', () => {
    render(<Loading text="Please wait..." />);

    expect(screen.getByText('Please wait...')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should render all size and color combinations', () => {
    const sizes: Array<'small' | 'medium' | 'large'> = [
      'small',
      'medium',
      'large',
    ];
    const colors: Array<'primary' | 'secondary' | 'dark'> = [
      'primary',
      'secondary',
      'dark',
    ];

    sizes.forEach(size => {
      colors.forEach(color => {
        const {unmount} = render(<Loading size={size} color={color} />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        unmount();
      });
    });
  });
});
