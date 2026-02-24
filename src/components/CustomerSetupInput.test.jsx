import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerSetupInput from './CustomerSetupInput';
import { Check, AlertCircle } from 'lucide-react';

describe('CustomerSetupInput', () => {
  const defaultProps = {
    label: 'Test Input',
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Text Input', () => {
    test('renders label and input field', () => {
      render(<CustomerSetupInput {...defaultProps} />);
      
      expect(screen.getByText('Test Input')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('handles value changes', async () => {
      const onChange = jest.fn();
      render(<CustomerSetupInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'test value');
      
      expect(onChange).toHaveBeenCalledTimes(10); // One for each character
    });

    test('displays placeholder text', () => {
      render(<CustomerSetupInput {...defaultProps} placeholder="Enter text here" />);
      
      expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
    });

    test('shows required indicator', () => {
      render(<CustomerSetupInput {...defaultProps} required />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Textarea Input', () => {
    test('renders textarea when multiline is true', () => {
      render(<CustomerSetupInput {...defaultProps} multiline />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveAttribute('rows', '4');
    });
  });

  describe('Error and Success States', () => {
    test('displays error message and styling', () => {
      render(
        <CustomerSetupInput 
          {...defaultProps} 
          error="This field is required" 
        />
      );
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveClass('border-rose-500');
      expect(screen.getByTestId('alert-circle')).toBeInTheDocument();
    });

    test('displays success styling', () => {
      render(<CustomerSetupInput {...defaultProps} success />);
      
      expect(screen.getByRole('textbox')).toHaveClass('border-emerald-500');
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });
  });

  describe('Character Count', () => {
    test('shows character count when enabled', () => {
      render(
        <CustomerSetupInput 
          {...defaultProps} 
          value="test"
          maxLength={10}
          showCharCount
        />
      );
      
      expect(screen.getByText('4/10')).toBeInTheDocument();
    });

    test('shows warning color when approaching limit', () => {
      render(
        <CustomerSetupInput 
          {...defaultProps} 
          value="test value"
          maxLength={10}
          showCharCount
        />
      );
      
      expect(screen.getByText('10/10')).toHaveClass('text-rose-400');
    });
  });

  describe('Disabled State', () => {
    test('disables input when disabled prop is true', () => {
      render(<CustomerSetupInput {...defaultProps} disabled />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('opacity-50');
    });
  });

  describe('File Upload', () => {
    const fileUploadProps = {
      label: 'Upload Image',
      type: 'file',
      accept: 'image/*',
      onFileUpload: jest.fn(),
    };

    test('renders file upload area', () => {
      render(<CustomerSetupInput {...fileUploadProps} />);
      
      expect(screen.getByText('Bild auswählen')).toBeInTheDocument();
      expect(screen.getByText('JPG, PNG oder WebP')).toBeInTheDocument();
    });

    test('shows uploading state', () => {
      render(<CustomerSetupInput {...fileUploadProps} uploading />);
      
      expect(screen.getByText('Lädt hoch...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    test('shows preview when previewUrl is provided', () => {
      render(
        <CustomerSetupInput 
          {...fileUploadProps} 
          previewUrl="https://example.com/image.jpg"
        />
      );
      
      const img = screen.getByAltText('Preview');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    test('handles file selection', async () => {
      const onFileUpload = jest.fn();
      render(<CustomerSetupInput {...fileUploadProps} onFileUpload={onFileUpload} />);
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByRole('button'); // File input is hidden, button is the clickable area
      
      // Get the actual file input
      const fileInput = screen.getByRole('button').querySelector('input[type="file"]');
      
      await userEvent.upload(fileInput, file);
      
      expect(onFileUpload).toHaveBeenCalledWith(expect.objectContaining({
        target: expect.objectContaining({
          files: [file],
        }),
      }));
    });
  });

  describe('Icons and Description', () => {
    test('displays icon when provided', () => {
      const TestIcon = () => <div data-testid="test-icon">Icon</div>;
      render(<CustomerSetupInput {...defaultProps} icon={<TestIcon />} />);
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    test('displays description when provided', () => {
      render(
        <CustomerSetupInput 
          {...defaultProps} 
          description="This is a description" 
        />
      );
      
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('associates label with input', () => {
      render(<CustomerSetupInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Test Input');
      
      expect(input).toHaveAccessibleName('Test Input');
    });

    test('announces error to screen readers', () => {
      render(
        <CustomerSetupInput 
          {...defaultProps} 
          error="Required field" 
        />
      );
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
