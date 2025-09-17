import {render, screen, fireEvent} from '@testing-library/react';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import Card from './card';

vi.mock('next/image', () => ({
  default: ({src, alt, fill, className}: any) => (
    <img
      data-testid="next-image"
      src={src}
      alt={alt}
      data-fill={fill}
      className={className}
    />
  ),
}));

vi.mock('../customButtton/customButton', () => ({
  default: ({
    buttonText,
    onClick,
    isLoading,
    backgroundColor,
    textColor,
  }: any) => (
    <button
      data-testid="custom-button"
      onClick={onClick}
      data-loading={isLoading}
      data-background-color={backgroundColor}
      data-text-color={textColor}>
      {buttonText}
    </button>
  ),
}));

vi.mock('antd', () => {
  const MockCardMeta = ({title, description}: any) => (
    <div data-testid="card-meta">
      {title && <div data-testid="card-meta-title">{title}</div>}
      {description && (
        <div data-testid="card-meta-description">{description}</div>
      )}
    </div>
  );

  const MockCard = ({
    children,
    className,
    onClick,
    cover,
    actions,
    title,
  }: any) => (
    <div
      data-testid="ant-card"
      className={className}
      onClick={onClick}
      data-has-cover={!!cover}
      data-has-actions={!!actions}
      data-title={title}>
      {cover && <div data-testid="card-cover">{cover}</div>}
      <div data-testid="card-content">{children}</div>
      {actions && (
        <div data-testid="card-actions">
          {actions.map((action: any, index: number) => (
            <div key={index} data-testid={`card-action-${index}`}>
              {action}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  MockCard.Meta = MockCardMeta;

  return {
    Card: MockCard,
  };
});

const mockIcon = <span data-testid="mock-icon">📊</span>;

describe('Card Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Product Card Variant', () => {
    const productProps = {
      variant: 'product' as const,
      title: 'Test Product',
      price: 99.99,
      imageUrl: '/test-image.jpg',
      imageAlt: 'Test product image',
    };

    it('should render product card with required props', () => {
      render(<Card {...productProps} />);

      expect(screen.getByTestId('ant-card')).toBeInTheDocument();
      expect(screen.getByTestId('next-image')).toBeInTheDocument();
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });

    it('should render product card with custom className', () => {
      render(<Card {...productProps} className="custom-class" />);

      const card = screen.getByTestId('ant-card');
      expect(card).toHaveClass('custom-class');
    });

    it('should handle onClick event', () => {
      const mockOnClick = vi.fn();
      render(<Card {...productProps} onClick={mockOnClick} />);

      const card = screen.getByTestId('ant-card');
      fireEvent.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should handle onAddToCart event', () => {
      const mockOnAddToCart = vi.fn();
      render(<Card {...productProps} onAddToCart={mockOnAddToCart} />);

      const addToCartButton = screen.getByTestId('custom-button');
      fireEvent.click(addToCartButton);

      expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
    });

    it('should pass isLoading prop to CustomButton', () => {
      render(<Card {...productProps} isLoading={true} />);

      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('data-loading', 'true');
    });

    it('should pass correct props to CustomButton', () => {
      render(<Card {...productProps} />);

      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('data-background-color', 'secondary');
      expect(button).toHaveAttribute('data-text-color', 'dark');
      expect(button).toHaveTextContent('Add to Cart');
    });

    it('should render image with correct props', () => {
      render(<Card {...productProps} />);

      const image = screen.getByTestId('next-image');
      expect(image).toHaveAttribute('src', '/test-image.jpg');
      expect(image).toHaveAttribute('alt', 'Test product image');
      expect(image).toHaveAttribute('data-fill', 'true');
    });

    it('should format price correctly with two decimal places', () => {
      render(<Card {...productProps} price={100} />);
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });

    it('should handle onAddToCart when not provided', () => {
      render(<Card {...productProps} />);

      const addToCartButton = screen.getByTestId('custom-button');
      expect(() => fireEvent.click(addToCartButton)).not.toThrow();
    });
  });

  describe('Category Card Variant', () => {
    const categoryProps = {
      variant: 'category' as const,
      title: 'Test Category',
      imageUrl: '/category-image.jpg',
      imageAlt: 'Test category image',
    };

    it('should render category card with required props', () => {
      render(<Card {...categoryProps} />);

      expect(screen.getByTestId('ant-card')).toBeInTheDocument();
      expect(screen.getByTestId('next-image')).toBeInTheDocument();
      expect(screen.getByText('Test Category')).toBeInTheDocument();
    });

    it('should render category card with custom className', () => {
      render(<Card {...categoryProps} className="category-class" />);

      const card = screen.getByTestId('ant-card');
      expect(card).toHaveClass('category-class');
    });

    it('should handle onClick event for category card', () => {
      const mockOnClick = vi.fn();
      render(<Card {...categoryProps} onClick={mockOnClick} />);

      const card = screen.getByTestId('ant-card');
      fireEvent.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should render category image with correct props', () => {
      render(<Card {...categoryProps} />);

      const image = screen.getByTestId('next-image');
      expect(image).toHaveAttribute('src', '/category-image.jpg');
      expect(image).toHaveAttribute('alt', 'Test category image');
    });

    it('should not render actions for category card', () => {
      render(<Card {...categoryProps} />);

      expect(screen.queryByTestId('card-actions')).not.toBeInTheDocument();
    });
  });

  describe('Stats Card Variant', () => {
    const statsProps = {
      variant: 'stats' as const,
      title: 'Total Sales',
      value: 1000,
    };

    it('should render stats card with required props', () => {
      render(<Card {...statsProps} />);

      expect(screen.getByTestId('ant-card')).toBeInTheDocument();
      expect(screen.getByText('Total Sales')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
    });

    it('should render stats card with string value', () => {
      render(<Card {...statsProps} value="$1,000" />);
      expect(screen.getByText('$1,000')).toBeInTheDocument();
    });

    it('should render stats card with icon', () => {
      render(<Card {...statsProps} icon={mockIcon} />);

      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('should render stats card without icon', () => {
      render(<Card {...statsProps} />);

      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
    });

    it('should apply primary color class by default', () => {
      render(<Card {...statsProps} />);

      const card = screen.getByTestId('ant-card');
      expect(card).toHaveClass('bg-primary', 'border-primary');
    });

    it('should apply secondary color class', () => {
      render(<Card {...statsProps} color="secondary" />);

      const card = screen.getByTestId('ant-card');
      expect(card).toHaveClass('bg-secondary', 'border-secondary');
    });

    it('should apply success color class', () => {
      render(<Card {...statsProps} color="success" />);

      const card = screen.getByTestId('ant-card');
      expect(card).toHaveClass('bg-green-50', 'border-green-200');
    });

    it('should apply warning color class', () => {
      render(<Card {...statsProps} color="warning" />);

      const card = screen.getByTestId('ant-card');
      expect(card).toHaveClass('bg-yellow-50', 'border-yellow-200');
    });

    it('should apply danger color class', () => {
      render(<Card {...statsProps} color="danger" />);

      const card = screen.getByTestId('ant-card');
      expect(card).toHaveClass('bg-red-50', 'border-red-200');
    });

    it('should render children content', () => {
      render(
        <Card {...statsProps}>
          <div data-testid="stats-children">Additional content</div>
        </Card>,
      );

      expect(screen.getByTestId('stats-children')).toBeInTheDocument();
      expect(screen.getByText('Additional content')).toBeInTheDocument();
    });

    it('should render stats card with custom className', () => {
      render(<Card {...statsProps} className="stats-class" />);

      const card = screen.getByTestId('ant-card');
      expect(card).toHaveClass('stats-class');
    });
  });

  describe('Content Card Variant', () => {
    const contentProps = {
      variant: 'content' as const,
    };

    it('should render content card with minimal props', () => {
      render(<Card {...contentProps} />);

      expect(screen.getByTestId('ant-card')).toBeInTheDocument();
    });

    it('should render content card with title', () => {
      render(<Card {...contentProps} title="Content Title" />);

      const card = screen.getByTestId('ant-card');
      expect(card).toHaveAttribute('data-title', 'Content Title');
    });

    it('should render content card with actions', () => {
      const actions = [
        <button key="action1" data-testid="action-1">
          Action 1
        </button>,
        <button key="action2" data-testid="action-2">
          Action 2
        </button>,
      ];

      render(<Card {...contentProps} actions={actions} />);

      expect(screen.getByTestId('card-actions')).toBeInTheDocument();
      expect(screen.getByTestId('action-1')).toBeInTheDocument();
      expect(screen.getByTestId('action-2')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(
        <Card {...contentProps}>
          <div data-testid="content-children">Content body</div>
        </Card>,
      );

      expect(screen.getByTestId('content-children')).toBeInTheDocument();
      expect(screen.getByText('Content body')).toBeInTheDocument();
    });

    it('should render content card with custom className', () => {
      render(<Card {...contentProps} className="content-class" />);

      const card = screen.getByTestId('ant-card');
      expect(card).toHaveClass('content-class');
    });

    it('should not render actions when not provided', () => {
      render(<Card {...contentProps} />);

      expect(screen.queryByTestId('card-actions')).not.toBeInTheDocument();
    });
  });

  describe('Base Classes and Styling', () => {
    it('should apply base classes to all variants', () => {
      const productProps = {
        variant: 'product' as const,
        title: 'Test',
        price: 10,
        imageUrl: '/test.jpg',
        imageAlt: 'Test',
      };

      render(<Card {...productProps} />);

      const card = screen.getByTestId('ant-card');
      expect(card).toHaveClass(
        'rounded-lg',
        'shadow-md',
        'hover:shadow-lg',
        'transition-shadow',
        'duration-200',
      );
    });

    it('should handle empty className prop', () => {
      const productProps = {
        variant: 'product' as const,
        title: 'Test',
        price: 10,
        imageUrl: '/test.jpg',
        imageAlt: 'Test',
        className: '',
      };

      render(<Card {...productProps} />);

      const card = screen.getByTestId('ant-card');
      expect(card).toHaveClass('rounded-lg');
    });
  });

  describe('Edge Cases', () => {
    it('should return null for invalid variant', () => {
      const invalidProps = {
        variant: 'invalid' as any,
      };

      const {container} = render(<Card {...invalidProps} />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle missing optional props gracefully', () => {
      const minimalProductProps = {
        variant: 'product' as const,
        title: 'Test',
        price: 0,
        imageUrl: '',
        imageAlt: '',
      };

      expect(() => render(<Card {...minimalProductProps} />)).not.toThrow();
    });

    it('should handle zero price correctly', () => {
      const productProps = {
        variant: 'product' as const,
        title: 'Free Product',
        price: 0,
        imageUrl: '/test.jpg',
        imageAlt: 'Test',
      };

      render(<Card {...productProps} />);
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should handle negative price correctly', () => {
      const productProps = {
        variant: 'product' as const,
        title: 'Discounted Product',
        price: -10.5,
        imageUrl: '/test.jpg',
        imageAlt: 'Test',
      };

      render(<Card {...productProps} />);
      expect(screen.getByText('$-10.50')).toBeInTheDocument();
    });
  });
});
