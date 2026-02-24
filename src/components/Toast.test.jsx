import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Toast from './Toast';

describe('Toast', () => {
  const defaultProps = {
    message: 'Test message',
    type: 'info',
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders toast message', () => {
    render(<Toast {...defaultProps} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  test('renders correct icon for each type', () => {
    const { rerender } = render(<Toast {...defaultProps} type="info" />);
    expect(screen.getByTestId('info-icon')).toBeInTheDocument();

    rerender(<Toast {...defaultProps} type="success" />);
    expect(screen.getByTestId('success-icon')).toBeInTheDocument();

    rerender(<Toast {...defaultProps} type="error" />);
    expect(screen.getByTestId('error-icon')).toBeInTheDocument();

    rerender(<Toast {...defaultProps} type="warning" />);
    expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
  });

  test('applies correct styling for each type', () => {
    const { rerender } = render(<Toast {...defaultProps} type="info" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-blue-500');

    rerender(<Toast {...defaultProps} type="success" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-emerald-500');

    rerender(<Toast {...defaultProps} type="error" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-rose-500');

    rerender(<Toast {...defaultProps} type="warning" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-amber-500');
  });

  test('calls onClose when close button is clicked', () => {
    render(<Toast {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('auto-dismisses after duration', async () => {
    render(<Toast {...defaultProps} duration={3000} />);
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  test('does not auto-dismiss when duration is null', () => {
    render(<Toast {...defaultProps} duration={null} />);
    
    jest.advanceTimersByTime(10000);
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  test('pauses auto-dismiss on hover and resumes on leave', async () => {
    render(<Toast {...defaultProps} duration={3000} />);
    
    const toast = screen.getByRole('alert');
    
    // Hover should pause
    fireEvent.mouseEnter(toast);
    jest.advanceTimersByTime(3000);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
    
    // Leave should resume
    fireEvent.mouseLeave(toast);
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  test('renders with custom className', () => {
    render(<Toast {...defaultProps} className="custom-class" />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('custom-class');
  });

  test('renders with title when provided', () => {
    render(<Toast {...defaultProps} title="Test Title" />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  test('has correct ARIA attributes', () => {
    render(<Toast {...defaultProps} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
  });
});
