import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PageContainer, { EmptyState, ErrorState } from './pageContainer';

// Mock the Loading component
vi.mock('../loading/loading', () => ({
  default: () => <div data-testid="loading-component">Loading...</div>,
}));

describe('PageContainer', () => {
  it('should render children when not loading', () => {
    render(
      <PageContainer>
        <div data-testid="child-content">Test Content</div>
      </PageContainer>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render loading state when isLoading is true', () => {
    render(
      <PageContainer isLoading={true}>
        <div>This should not be visible</div>
      </PageContainer>
    );

    expect(screen.getByTestId('loading-component')).toBeInTheDocument();
    expect(screen.queryByText('This should not be visible')).not.toBeInTheDocument();
  });

  it('should render loading message when provided', () => {
    render(
      <PageContainer isLoading={true} loadingMessage="Please wait...">
        <div>Content</div>
      </PageContainer>
    );

    expect(screen.getByTestId('loading-component')).toBeInTheDocument();
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('should render title when provided', () => {
    render(
      <PageContainer title="Test Title">
        <div>Content</div>
      </PageContainer>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Title');
  });

  it('should render subtitle when provided', () => {
    render(
      <PageContainer subtitle="Test Subtitle">
        <div>Content</div>
      </PageContainer>
    );

    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('should render both title and subtitle', () => {
    render(
      <PageContainer title="Main Title" subtitle="Sub Title">
        <div>Content</div>
      </PageContainer>
    );

    expect(screen.getByText('Main Title')).toBeInTheDocument();
    expect(screen.getByText('Sub Title')).toBeInTheDocument();
  });

  it('should render actions when provided', () => {
    const actions = (
      <button data-testid="action-button">Action</button>
    );

    render(
      <PageContainer title="Title" actions={actions}>
        <div>Content</div>
      </PageContainer>
    );

    expect(screen.getByTestId('action-button')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <PageContainer className="custom-class">
        <div>Content</div>
      </PageContainer>
    );

    const container = screen.getByText('Content').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('should apply custom containerClassName', () => {
    render(
      <PageContainer containerClassName="custom-container">
        <div>Content</div>
      </PageContainer>
    );

    const container = screen.getByText('Content').parentElement;
    expect(container).toHaveClass('custom-container');
  });

  it('should apply centerContent styling when loading and centerContent is true', () => {
    render(
      <PageContainer isLoading={true} centerContent={true}>
        <div>Content</div>
      </PageContainer>
    );

    const loadingContainer = screen.getByTestId('loading-component').parentElement?.parentElement;
    expect(loadingContainer).toHaveClass('flex', 'items-center', 'justify-center', 'min-h-screen');
  });

  it('should not render header section when no title, subtitle, or actions', () => {
    render(
      <PageContainer>
        <div data-testid="content">Content</div>
      </PageContainer>
    );

    // The mb-8 class is only applied when header section exists
    const container = screen.getByTestId('content').parentElement;
    expect(container?.querySelector('.mb-8')).not.toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('should render title and message', () => {
    render(
      <EmptyState 
        title="No Items Found" 
        message="There are no items to display" 
      />
    );

    expect(screen.getByText('No Items Found')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display')).toBeInTheDocument();
  });

  it('should render action when provided', () => {
    const action = <button data-testid="empty-action">Add Item</button>;

    render(
      <EmptyState 
        title="No Items" 
        message="No items found" 
        action={action}
      />
    );

    expect(screen.getByTestId('empty-action')).toBeInTheDocument();
  });

  it('should render icon when provided', () => {
    const icon = <span data-testid="empty-icon">📦</span>;

    render(
      <EmptyState 
        title="Empty" 
        message="Nothing here" 
        icon={icon}
      />
    );

    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('should render without action and icon', () => {
    render(
      <EmptyState 
        title="Empty State" 
        message="No content available" 
      />
    );

    expect(screen.getByText('Empty State')).toBeInTheDocument();
    expect(screen.getByText('No content available')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('should render with default title and custom message', () => {
    render(
      <ErrorState message="Failed to load data" />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(
      <ErrorState 
        title="Custom Error" 
        message="Something bad happened" 
      />
    );

    expect(screen.getByText('Custom Error')).toBeInTheDocument();
    expect(screen.getByText('Something bad happened')).toBeInTheDocument();
  });

  it('should render retry button when onRetry is provided', () => {
    const mockRetry = vi.fn();

    render(
      <ErrorState 
        message="Network error" 
        onRetry={mockRetry}
      />
    );

    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('should not render retry button when onRetry is not provided', () => {
    render(
      <ErrorState message="Error occurred" />
    );

    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });
});