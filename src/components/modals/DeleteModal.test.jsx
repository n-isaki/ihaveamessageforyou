import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteModal from './DeleteModal';

describe('DeleteModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    isDeleting: false,
    itemName: 'Test Item',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders when isOpen is true', () => {
    render(<DeleteModal {...defaultProps} />);
    
    expect(screen.getByText('Geschenk löschen?')).toBeInTheDocument();
    expect(screen.getByText('Diese Aktion kann nicht rückgängig gemacht werden.')).toBeInTheDocument();
    expect(screen.getByText('Abbrechen')).toBeInTheDocument();
    expect(screen.getByText('Löschen')).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    render(<DeleteModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Geschenk löschen?')).not.toBeInTheDocument();
  });

  test('handles single item deletion', () => {
    render(<DeleteModal {...defaultProps} />);
    
    expect(screen.getByText('Geschenk löschen?')).toBeInTheDocument();
    expect(screen.getByText('Löschen')).toBeInTheDocument();
  });

  test('handles bulk deletion correctly', () => {
    render(<DeleteModal {...defaultProps} itemName="3 Geschenke" />);
    
    expect(screen.getByText('3 Geschenke löschen?')).toBeInTheDocument();
    expect(screen.getByText('Möchtest du wirklich 3 Geschenke löschen?')).toBeInTheDocument();
    expect(screen.getByText('3 löschen')).toBeInTheDocument();
  });

  test('handles singular bulk deletion', () => {
    render(<DeleteModal {...defaultProps} itemName="1 Geschenke" />);
    
    expect(screen.getByText('1 Geschenke löschen?')).toBeInTheDocument();
    expect(screen.getByText('Möchtest du wirklich 1 Geschenk löschen?')).toBeInTheDocument();
    expect(screen.getByText('1 löschen')).toBeInTheDocument();
  });

  test('shows loading state when deleting', () => {
    render(<DeleteModal {...defaultProps} isDeleting={true} />);
    
    expect(screen.getByText('Löscht...')).toBeInTheDocument();
    expect(screen.getByText('Abbrechen')).toBeDisabled();
    expect(screen.getByText('Löscht...')).toBeDisabled();
  });

  test('shows loading state for bulk deletion', () => {
    render(<DeleteModal {...defaultProps} itemName="5 Geschenke" isDeleting={true} />);
    
    expect(screen.getByText('Löscht...')).toBeInTheDocument();
  });

  test('calls onClose when cancel button is clicked', () => {
    render(<DeleteModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Abbrechen');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onConfirm when confirm button is clicked', () => {
    render(<DeleteModal {...defaultProps} />);
    
    const confirmButton = screen.getByText('Löschen');
    fireEvent.click(confirmButton);
    
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  test('does not call onConfirm when disabled during deletion', () => {
    render(<DeleteModal {...defaultProps} isDeleting={true} />);
    
    const confirmButton = screen.getByText('Löscht...');
    fireEvent.click(confirmButton);
    
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  test('does not call onClose when disabled during deletion', () => {
    render(<DeleteModal {...defaultProps} isDeleting={true} />);
    
    const cancelButton = screen.getByText('Abbrechen');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  test('has correct styling classes', () => {
    render(<DeleteModal {...defaultProps} />);
    
    const backdrop = screen.getByText('Geschenk löschen?').closest('.fixed');
    expect(backdrop).toHaveClass('inset-0', 'z-50', 'bg-black\\/50', 'backdrop-blur-sm');
    
    const modal = screen.getByText('Geschenk löschen?').closest('.bg-white');
    expect(modal).toHaveClass('rounded-xl', 'shadow-2xl', 'max-w-md');
  });

  test('buttons have correct styling', () => {
    render(<DeleteModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Abbrechen');
    expect(cancelButton).toHaveClass(
      'border',
      'border-stone-300',
      'text-stone-700'
    );
    
    const confirmButton = screen.getByText('Löschen');
    expect(confirmButton).toHaveClass(
      'bg-red-600',
      'text-white'
    );
  });

  test('handles edge case of zero items', () => {
    render(<DeleteModal {...defaultProps} itemName="0 Geschenke" />);
    
    expect(screen.getByText('0 Geschenke löschen?')).toBeInTheDocument();
    expect(screen.getByText('Möchtest du wirklich 0 Geschenke löschen?')).toBeInTheDocument();
  });

  test('extracts count correctly from complex item names', () => {
    render(<DeleteModal {...defaultProps} itemName="Delete 10 selected Geschenke" />);
    
    expect(screen.getByText('10 Geschenke löschen?')).toBeInTheDocument();
    expect(screen.getByText('Möchtest du wirklich 10 Geschenke löschen?')).toBeInTheDocument();
  });

  test('handles non-numeric item names gracefully', () => {
    render(<DeleteModal {...defaultProps} itemName="Some Geschenke" />);
    
    expect(screen.getByText('0 Geschenke löschen?')).toBeInTheDocument();
  });

  test('modal is centered on screen', () => {
    render(<DeleteModal {...defaultProps} />);
    
    const backdrop = screen.getByText('Geschenk löschen?').closest('.fixed');
    expect(backdrop).toHaveClass('flex', 'items-center', 'justify-center');
  });
});
