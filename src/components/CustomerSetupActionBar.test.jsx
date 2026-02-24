import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomerSetupActionBar from './CustomerSetupActionBar';

describe('CustomerSetupActionBar', () => {
  const defaultProps = {
    currentStep: 'basic',
    completedSteps: [],
    totalSteps: 4,
    onPrevious: jest.fn(),
    onNext: jest.fn(),
    onSave: jest.fn(),
    canGoNext: true,
    canGoPrevious: false,
    isSaving: false,
    isLastStep: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders action buttons', () => {
    render(<CustomerSetupActionBar {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /weiter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /speichern/i })).toBeInTheDocument();
  });

  test('shows previous button when canGoPrevious is true', () => {
    render(<CustomerSetupActionBar {...defaultProps} canGoPrevious={true} />);
    
    expect(screen.getByRole('button', { name: /zurück/i })).toBeInTheDocument();
  });

  test('does not show previous button when canGoPrevious is false', () => {
    render(<CustomerSetupActionBar {...defaultProps} canGoPrevious={false} />);
    
    expect(screen.queryByRole('button', { name: /zurück/i })).not.toBeInTheDocument();
  });

  test('disables next button when canGoNext is false', () => {
    render(<CustomerSetupActionBar {...defaultProps} canGoNext={false} />);
    
    const nextButton = screen.getByRole('button', { name: /weiter/i });
    expect(nextButton).toBeDisabled();
  });

  test('enables next button when canGoNext is true', () => {
    render(<CustomerSetupActionBar {...defaultProps} canGoNext={true} />);
    
    const nextButton = screen.getByRole('button', { name: /weiter/i });
    expect(nextButton).not.toBeDisabled();
  });

  test('shows finish button on last step', () => {
    render(<CustomerSetupActionBar {...defaultProps} isLastStep={true} />);
    
    expect(screen.getByRole('button', { name: /abschließen/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /weiter/i })).not.toBeInTheDocument();
  });

  test('shows loading state when saving', () => {
    render(<CustomerSetupActionBar {...defaultProps} isSaving={true} />);
    
    expect(screen.getByText('Speichert...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /speichern/i })).toBeDisabled();
  });

  test('calls onPrevious when previous button is clicked', () => {
    render(<CustomerSetupActionBar {...defaultProps} canGoPrevious={true} />);
    
    const previousButton = screen.getByRole('button', { name: /zurück/i });
    fireEvent.click(previousButton);
    
    expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
  });

  test('calls onNext when next button is clicked', () => {
    render(<CustomerSetupActionBar {...defaultProps} />);
    
    const nextButton = screen.getByRole('button', { name: /weiter/i });
    fireEvent.click(nextButton);
    
    expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
  });

  test('calls onSave when save button is clicked', () => {
    render(<CustomerSetupActionBar {...defaultProps} />);
    
    const saveButton = screen.getByRole('button', { name: /speichern/i });
    fireEvent.click(saveButton);
    
    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
  });

  test('calls onSave when finish button is clicked', () => {
    render(<CustomerSetupActionBar {...defaultProps} isLastStep={true} />);
    
    const finishButton = screen.getByRole('button', { name: /abschließen/i });
    fireEvent.click(finishButton);
    
    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
  });

  test('shows progress indicator', () => {
    render(<CustomerSetupActionBar {...defaultProps} />);
    
    expect(screen.getByText(/Schritt 1 von 4/)).toBeInTheDocument();
  });

  test('shows correct progress for different steps', () => {
    render(<CustomerSetupActionBar {...defaultProps} currentStep="media" />);
    
    expect(screen.getByText(/Schritt 2 von 4/)).toBeInTheDocument();
  });

  test('shows completed steps count', () => {
    render(
      <CustomerSetupActionBar 
        {...defaultProps} 
        completedSteps={['basic', 'media']} 
      />
    );
    
    expect(screen.getByText(/2 von 4 abgeschlossen/)).toBeInTheDocument();
  });

  test('disables all buttons when saving', () => {
    render(
      <CustomerSetupActionBar 
        {...defaultProps} 
        isSaving={true}
        canGoPrevious={true}
      />
    );
    
    expect(screen.getByRole('button', { name: /speichern/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /weiter/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /zurück/i })).toBeDisabled();
  });

  test('has correct styling classes', () => {
    render(<CustomerSetupActionBar {...defaultProps} />);
    
    const container = screen.getByRole('button', { name: /weiter/i }).closest('div');
    expect(container).toHaveClass('flex', 'justify-between', 'items-center');
  });

  test('buttons have correct styling', () => {
    render(<CustomerSetupActionBar {...defaultProps} />);
    
    const nextButton = screen.getByRole('button', { name: /weiter/i });
    expect(nextButton).toHaveClass('btn-primary');
    
    const saveButton = screen.getByRole('button', { name: /speichern/i });
    expect(saveButton).toHaveClass('btn-secondary');
  });

  test('shows progress bar visually', () => {
    render(<CustomerSetupActionBar {...defaultProps} />);
    
    const progressBar = screen.getByRole('progressbar') || document.querySelector('.progress');
    expect(progressBar).toBeInTheDocument();
  });

  test('handles keyboard navigation', () => {
    render(<CustomerSetupActionBar {...defaultProps} />);
    
    const nextButton = screen.getByRole('button', { name: /weiter/i });
    nextButton.focus();
    fireEvent.keyPress(nextButton, { key: 'Enter', charCode: 13 });
    
    expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
  });

  test('shows step names in progress', () => {
    render(<CustomerSetupActionBar {...defaultProps} />);
    
    expect(screen.getByText(/Grundlagen/)).toBeInTheDocument();
  });

  test('handles edge case of zero total steps', () => {
    render(<CustomerSetupActionBar {...defaultProps} totalSteps={0} />);
    
    // Should not crash and show reasonable fallback
    expect(screen.getByRole('button', { name: /weiter/i })).toBeInTheDocument();
  });

  test('shows completion percentage', () => {
    render(
      <CustomerSetupActionBar 
        {...defaultProps} 
        completedSteps={['basic', 'media']} 
      />
    );
    
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  test('handles empty completed steps', () => {
    render(<CustomerSetupActionBar {...defaultProps} completedSteps={[]} />);
    
    expect(screen.getByText(/0 von 4 abgeschlossen/)).toBeInTheDocument();
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });

  test('handles all completed steps', () => {
    render(
      <CustomerSetupActionBar 
        {...defaultProps} 
        completedSteps={['basic', 'media', 'messages', 'social']} 
      />
    );
    
    expect(screen.getByText(/4 von 4 abgeschlossen/)).toBeInTheDocument();
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });
});
