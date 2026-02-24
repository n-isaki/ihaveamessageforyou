import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(window.location, 'reload').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    window.location.reload.mockRestore();
  });

  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByText('Ups, etwas ist schiefgelaufen.')).not.toBeInTheDocument();
  });

  test('catches errors and displays error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Ups, etwas ist schiefgelaufen.')).toBeInTheDocument();
    expect(screen.getByText('Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu.')).toBeInTheDocument();
    expect(screen.getByText('Seite neu laden')).toBeInTheDocument();
  });

  test('displays error message when available', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  test('reloads page when reload button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('Seite neu laden');
    reloadButton.click();

    expect(window.location.reload).toHaveBeenCalled();
  });

  test('logs error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      'Uncaught error:',
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  test('has correct styling classes', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const container = screen.getByText('Ups, etwas ist schiefgelaufen.').closest('div');
    expect(container).toHaveClass('bg-brand-cream');
    
    const errorBox = screen.getByText('Ups, etwas ist schiefgelaufen.').closest('.bg-white');
    expect(errorBox).toHaveClass('rounded-2xl', 'shadow-brand', 'border-brand-border');
  });

  test('displays error icon', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const icon = screen.getByRole('img', { hidden: true }) || document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
