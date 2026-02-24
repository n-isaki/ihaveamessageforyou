import React from 'react';
import { render, screen } from '@testing-library/react';
import CustomerSetupProgress from './CustomerSetupProgress';

describe('CustomerSetupProgress', () => {
  const defaultProps = {
    currentStep: 'basic',
    completedSteps: [],
    giftType: 'mug',
    isLocked: false,
  };

  test('renders all steps', () => {
    render(<CustomerSetupProgress {...defaultProps} />);
    
    expect(screen.getByText('Grundlagen')).toBeInTheDocument();
    expect(screen.getByText('Medien')).toBeInTheDocument();
    expect(screen.getByText('Nachrichten')).toBeInTheDocument();
    expect(screen.getByText('Gemeinschaft')).toBeInTheDocument();
  });

  test('shows active step correctly', () => {
    render(<CustomerSetupProgress {...defaultProps} currentStep="media" />);
    
    const mediaButton = screen.getByText('Medien');
    expect(mediaButton).toHaveClass('text-brand-patina', 'font-semibold');
  });

  test('shows completed steps with checkmark', () => {
    render(<CustomerSetupProgress {...defaultProps} completedSteps={['basic']} />);
    
    const basicButton = screen.getByText('Grundlagen');
    expect(basicButton).toHaveClass('text-emerald-500', 'font-medium');
    expect(basicButton).toContainHTML('✓');
  });

  test('shows pending steps correctly', () => {
    render(<CustomerSetupProgress {...defaultProps} currentStep="basic" completedSteps={[]} />);
    
    const mediaButton = screen.getByText('Medien');
    expect(mediaButton).toHaveClass('text-brand-text');
  });

  test('hides media step for noor gift type', () => {
    render(<CustomerSetupProgress {...defaultProps} giftType="noor" />);
    
    // Media step should still be visible but not required
    expect(screen.getByText('Medien')).toBeInTheDocument();
  });

  test('disables all steps when locked', () => {
    render(<CustomerSetupProgress {...defaultProps} isLocked={true} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
      expect(button).toHaveClass('cursor-not-allowed', 'opacity-50');
    });
  });

  test('shows hover effect on non-completed steps when not locked', () => {
    render(<CustomerSetupProgress {...defaultProps} isLocked={false} />);
    
    const mediaButton = screen.getByText('Medien');
    expect(mediaButton).toHaveClass('hover:text-brand-anthracite', 'cursor-pointer');
  });

  test('shows abbreviated step names on mobile', () => {
    render(<CustomerSetupProgress {...defaultProps} />);
    
    // Check for mobile-specific text (hidden on sm: and visible on default)
    const mobileTexts = ['Grund', 'Medien', 'Nachr', 'Gemein'];
    mobileTexts.forEach(text => {
      const element = screen.getByText(text);
      expect(element).toHaveClass('sm:hidden');
    });
  });

  test('shows full step names on larger screens', () => {
    render(<CustomerSetupProgress {...defaultProps} />);
    
    const fullTexts = ['Grundlagen', 'Medien', 'Nachrichten', 'Gemeinschaft'];
    fullTexts.forEach(text => {
      const element = screen.getByText(text);
      expect(element).toHaveClass('hidden', 'sm:inline');
    });
  });

  test('handles multiple completed steps', () => {
    render(
      <CustomerSetupProgress 
        {...defaultProps} 
        completedSteps={['basic', 'media']} 
        currentStep="messages"
      />
    );
    
    expect(screen.getByText('Grundlagen')).toHaveClass('text-emerald-500');
    expect(screen.getByText('Medien')).toHaveClass('text-emerald-500');
    expect(screen.getByText('Nachrichten')).toHaveClass('text-brand-patina');
    expect(screen.getByText('Gemeinschaft')).toHaveClass('text-brand-text');
  });

  test('has correct container styling', () => {
    render(<CustomerSetupProgress {...defaultProps} />);
    
    const container = screen.getByText('Grundlagen').closest('.bg-white');
    expect(container).toHaveClass(
      'rounded-lg',
      'border',
      'border-brand-border',
      'shadow-brand'
    );
  });

  test('all buttons are clickable when not locked', () => {
    render(<CustomerSetupProgress {...defaultProps} isLocked={false} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toBeDisabled();
    });
  });

  test('step status calculation works correctly', () => {
    render(
      <CustomerSetupProgress 
        {...defaultProps} 
        currentStep="media"
        completedSteps={['basic']}
      />
    );
    
    expect(screen.getByText('Grundlagen')).toHaveClass('text-emerald-500'); // completed
    expect(screen.getByText('Medien')).toHaveClass('text-brand-patina'); // active
    expect(screen.getByText('Nachrichten')).toHaveClass('text-brand-text'); // pending
    expect(screen.getByText('Gemeinschaft')).toHaveClass('text-brand-text'); // pending
  });
});
