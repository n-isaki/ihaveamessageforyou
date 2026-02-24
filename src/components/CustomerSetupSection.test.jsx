import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Edit3, Lightbulb } from 'lucide-react';
import CustomerSetupSection from './CustomerSetupSection';

describe('CustomerSetupSection', () => {
  const defaultProps = {
    title: 'Test Section',
    description: 'Test description',
    children: <div>Test content</div>,
  };

  test('renders title and description', () => {
    render(<CustomerSetupSection {...defaultProps} />);
    
    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('is open by default', () => {
    render(<CustomerSetupSection {...defaultProps} />);
    
    expect(screen.getByText('Test content')).toBeVisible();
  });

  test('can be closed by default', () => {
    render(<CustomerSetupSection {...defaultProps} defaultOpen={false} />);
    
    expect(screen.queryByText('Test content')).not.toBeVisible();
  });

  test('toggles open/closed state on click', () => {
    render(<CustomerSetupSection {...defaultProps} />);
    
    const header = screen.getByText('Test Section').closest('div').parentElement;
    fireEvent.click(header);
    
    expect(screen.queryByText('Test content')).not.toBeVisible();
    
    fireEvent.click(header);
    expect(screen.getByText('Test content')).toBeVisible();
  });

  test('calls onToggle when provided', () => {
    const onToggle = jest.fn();
    render(<CustomerSetupSection {...defaultProps} onToggle={onToggle} />);
    
    const header = screen.getByText('Test Section').closest('div').parentElement;
    fireEvent.click(header);
    
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test('shows completed badge when isCompleted is true', () => {
    render(<CustomerSetupSection {...defaultProps} isCompleted />);
    
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  test('shows custom badge when provided', () => {
    render(<CustomerSetupSection {...defaultProps} badge="New" />);
    
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  test('shows icon when provided', () => {
    render(<CustomerSetupSection {...defaultProps} icon={<Edit3 data-testid="test-icon" />} />);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  test('shows tips when open and tips are provided', () => {
    const tips = ['Tip 1', 'Tip 2'];
    render(<CustomerSetupSection {...defaultProps} tips={tips} />);
    
    expect(screen.getByText('Tip 1')).toBeInTheDocument();
    expect(screen.getByText('Tip 2')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true }) || document.querySelector('svg')).toBeInTheDocument(); // Lightbulb icon
  });

  test('does not show tips when closed', () => {
    const tips = ['Tip 1'];
    render(
      <CustomerSetupSection 
        {...defaultProps} 
        tips={tips} 
        defaultOpen={false} 
      />
    );
    
    expect(screen.queryByText('Tip 1')).not.toBeInTheDocument();
  });

  test('shows active styling when isActive is true', () => {
    render(<CustomerSetupSection {...defaultProps} isActive />);
    
    const section = screen.getByText('Test Section').closest('.border-brand-patina\\/50');
    expect(section).toBeInTheDocument();
  });

  test('shows completed styling when isCompleted is true', () => {
    render(<CustomerSetupSection {...defaultProps} isCompleted />);
    
    const section = screen.getByText('Test Section').closest('.border-emerald-500\\/30');
    expect(section).toBeInTheDocument();
  });

  test('shows chevron up when open', () => {
    render(<CustomerSetupSection {...defaultProps} />);
    
    const chevronUp = document.querySelector('svg.lucide-chevron-up');
    expect(chevronUp).toBeInTheDocument();
  });

  test('shows chevron down when closed', () => {
    render(<CustomerSetupSection {...defaultProps} defaultOpen={false} />);
    
    const chevronDown = document.querySelector('svg.lucide-chevron-down');
    expect(chevronDown).toBeInTheDocument();
  });

  test('has correct container styling', () => {
    render(<CustomerSetupSection {...defaultProps} />);
    
    const container = screen.getByText('Test Section').closest('.bg-white');
    expect(container).toHaveClass(
      'rounded-2xl',
      'border',
      'border-brand-border',
      'shadow-brand'
    );
  });

  test('header is clickable', () => {
    render(<CustomerSetupSection {...defaultProps} />);
    
    const header = screen.getByText('Test Section').closest('.cursor-pointer');
    expect(header).toBeInTheDocument();
  });

  test('content transitions correctly', () => {
    render(<CustomerSetupSection {...defaultProps} />);
    
    const contentContainer = screen.getByText('Test content').parentElement;
    expect(contentContainer).toHaveClass('transition-all', 'duration-300');
  });

  test('multiple tips render correctly', () => {
    const tips = ['First tip', 'Second tip', 'Third tip'];
    render(<CustomerSetupSection {...defaultProps} tips={tips} />);
    
    tips.forEach(tip => {
      expect(screen.getByText(tip)).toBeInTheDocument();
    });
  });

  test('tips container has correct styling', () => {
    render(
      <CustomerSetupSection 
        {...defaultProps} 
        tips={['Test tip']} 
      />
    );
    
    const tipsContainer = screen.getByText('Test tip').closest('.bg-blue-900\\/20');
    expect(tipsContainer).toHaveClass(
      'border',
      'border-blue-800\\/30',
      'rounded-xl'
    );
  });

  test('icon color changes based on state', () => {
    const { rerender } = render(<CustomerSetupSection {...defaultProps} icon={<Edit3 data-testid="icon" />} />);
    
    let icon = screen.getByTestId('icon').closest('.text-brand-text');
    expect(icon).toBeInTheDocument();

    rerender(<CustomerSetupSection {...defaultProps} icon={<Edit3 data-testid="icon" />} isActive />);
    icon = screen.getByTestId('icon').closest('.text-brand-patina');
    expect(icon).toBeInTheDocument();

    rerender(<CustomerSetupSection {...defaultProps} icon={<Edit3 data-testid="icon" />} isCompleted />);
    icon = screen.getByTestId('icon').closest('.text-emerald-500');
    expect(icon).toBeInTheDocument();
  });
});
