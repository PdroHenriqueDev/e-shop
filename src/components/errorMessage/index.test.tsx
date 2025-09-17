import React from 'react';
import {render, screen} from '@testing-library/react';
import {vi, describe, it, expect} from 'vitest';
import ErrorMessage from './index';

describe('ErrorMessage Component', () => {
  describe('Basic Rendering', () => {
    it('should render error message when message is provided', () => {
      const testMessage = 'This is an error message';
      render(<ErrorMessage message={testMessage} />);

      const errorElement = screen.getByText(testMessage);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500', 'text-sm', 'mt-2');
    });

    it('should render error message with correct styling classes', () => {
      const testMessage = 'Error occurred';
      render(<ErrorMessage message={testMessage} />);

      const errorElement = screen.getByText(testMessage);
      expect(errorElement.tagName).toBe('DIV');
      expect(errorElement).toHaveClass('text-red-500');
      expect(errorElement).toHaveClass('text-sm');
      expect(errorElement).toHaveClass('mt-2');
    });

    it('should render long error messages correctly', () => {
      const longMessage =
        'This is a very long error message that should still be displayed correctly with all the proper styling and formatting applied to it';
      render(<ErrorMessage message={longMessage} />);

      const errorElement = screen.getByText(longMessage);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500', 'text-sm', 'mt-2');
    });

    it('should render error messages with special characters', () => {
      const specialMessage =
        'Error: Invalid input! Please check @email.com & try again.';
      render(<ErrorMessage message={specialMessage} />);

      const errorElement = screen.getByText(specialMessage);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500', 'text-sm', 'mt-2');
    });

    it('should render error messages with HTML entities correctly', () => {
      const htmlMessage = 'Error: Value must be > 0 & < 100';
      render(<ErrorMessage message={htmlMessage} />);

      const errorElement = screen.getByText(htmlMessage);
      expect(errorElement).toBeInTheDocument();
    });

    it('should render multiline error messages', () => {
      const multilineMessage = 'Line 1 error\nLine 2 error\nLine 3 error';
      const {container} = render(<ErrorMessage message={multilineMessage} />);

      const errorElement = container.querySelector('.text-red-500');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement?.textContent).toBe(multilineMessage);
    });
  });

  describe('Conditional Rendering', () => {
    it('should not render when message is undefined', () => {
      const {container} = render(<ErrorMessage />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render when message is null', () => {
      const {container} = render(<ErrorMessage message={null as any} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render when message is an empty string', () => {
      const {container} = render(<ErrorMessage message="" />);

      expect(container.firstChild).toBeNull();
    });

    it('should render when message is a valid string', () => {
      const message = 'This is an error message';
      render(<ErrorMessage message={message} />);

      const errorElement = screen.getByText(message);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500', 'text-sm', 'mt-2');
    });

    it('should render when message is a string with only whitespace', () => {
      const whitespaceMessage = '   ';
      const {container} = render(<ErrorMessage message={whitespaceMessage} />);

      const errorElement = container.querySelector('.text-red-500');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500', 'text-sm', 'mt-2');
      expect(errorElement?.textContent).toBe(whitespaceMessage);
    });

    it('should render when message is a number as string', () => {
      const numberMessage = '123';
      render(<ErrorMessage message={numberMessage} />);

      const errorElement = screen.getByText(numberMessage);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500', 'text-sm', 'mt-2');
    });

    it('should render when message contains special characters', () => {
      const specialMessage = 'Error: @#$%^&*()';
      render(<ErrorMessage message={specialMessage} />);

      const errorElement = screen.getByText(specialMessage);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500', 'text-sm', 'mt-2');
    });

    it('should render when message is multiline', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      const {container} = render(<ErrorMessage message={multilineMessage} />);

      const errorElement = container.querySelector('.text-red-500');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement?.textContent).toBe(multilineMessage);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short messages', () => {
      render(<ErrorMessage message="!" />);

      const errorElement = screen.getByText('!');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500', 'text-sm', 'mt-2');
    });

    it('should handle numeric string messages', () => {
      render(<ErrorMessage message="404" />);

      const errorElement = screen.getByText('404');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500', 'text-sm', 'mt-2');
    });

    it('should handle messages with only special characters', () => {
      render(<ErrorMessage message="@#$%^&*()" />);

      const errorElement = screen.getByText('@#$%^&*()');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500', 'text-sm', 'mt-2');
    });

    it('should handle messages with Unicode characters', () => {
      render(<ErrorMessage message="错误信息 🚫" />);

      const errorElement = screen.getByText('错误信息 🚫');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveClass('text-red-500', 'text-sm', 'mt-2');
    });
  });

  describe('Component Structure', () => {
    it('should render as a div element', () => {
      render(<ErrorMessage message="Test" />);

      const errorElement = screen.getByText('Test');
      expect(errorElement.tagName).toBe('DIV');
    });

    it('should have exactly the expected CSS classes', () => {
      render(<ErrorMessage message="Test" />);

      const errorElement = screen.getByText('Test');
      expect(errorElement.className).toBe('text-red-500 text-sm mt-2');
    });

    it('should not have any additional attributes', () => {
      render(<ErrorMessage message="Test" />);

      const errorElement = screen.getByText('Test');
      expect(errorElement.attributes).toHaveLength(1); // Only class attribute
      expect(errorElement).toHaveAttribute('class');
    });

    it('should render text content directly without nested elements', () => {
      render(<ErrorMessage message="Direct text" />);

      const errorElement = screen.getByText('Direct text');
      expect(errorElement.children).toHaveLength(0);
      expect(errorElement.textContent).toBe('Direct text');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible to screen readers', () => {
      render(<ErrorMessage message="Accessible error message" />);

      const errorElement = screen.getByText('Accessible error message');
      expect(errorElement).toBeInTheDocument();
      // The component doesn't have specific ARIA attributes, but the text content is accessible
      expect(errorElement.textContent).toBe('Accessible error message');
    });

    it('should maintain semantic meaning through styling', () => {
      render(<ErrorMessage message="Semantic error" />);

      const errorElement = screen.getByText('Semantic error');
      // Red color (text-red-500) provides visual indication of error state
      expect(errorElement).toHaveClass('text-red-500');
    });
  });

  describe('Performance', () => {
    it('should handle rapid re-renders with different messages', () => {
      const {rerender} = render(<ErrorMessage message="First message" />);
      expect(screen.getByText('First message')).toBeInTheDocument();

      rerender(<ErrorMessage message="Second message" />);
      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.queryByText('First message')).not.toBeInTheDocument();

      rerender(<ErrorMessage message={undefined} />);
      expect(screen.queryByText('Second message')).not.toBeInTheDocument();
    });

    it('should handle switching between null and valid messages', () => {
      const {rerender, container} = render(
        <ErrorMessage message={undefined} />,
      );
      expect(container.firstChild).toBeNull();

      rerender(<ErrorMessage message="Now visible" />);
      expect(screen.getByText('Now visible')).toBeInTheDocument();

      rerender(<ErrorMessage message={undefined} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
