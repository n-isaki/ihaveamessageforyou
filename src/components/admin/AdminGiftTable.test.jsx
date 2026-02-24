import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminGiftTable from './AdminGiftTable';

// Mock the registry module
jest.mock('../../modules/registry', () => ({
  getExperience: jest.fn(() => ({
    id: 'noor',
    label: 'Noor Experience',
    icon: () => null,
    colors: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  })),
}));

// Mock toast service
jest.mock('../../services/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    origin: 'http://localhost:3000',
  },
  writable: true,
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(),
  },
  writable: true,
});

describe('AdminGiftTable', () => {
  const mockGifts = [
    {
      id: '1',
      recipientName: 'John Doe',
      senderName: 'Jane Smith',
      customerName: 'Customer A',
      productType: 'noor',
      locked: false,
      viewed: false,
      securityToken: 'token123',
      createdAt: { toDate: () => new Date('2024-01-15') },
      status: 'open',
    },
    {
      id: '2',
      recipientName: 'Alice Brown',
      senderName: 'Bob Wilson',
      customerName: 'Customer B',
      productType: 'tasse',
      locked: true,
      viewed: true,
      securityToken: 'token456',
      createdAt: { toDate: () => new Date('2024-01-14') },
      status: 'sealed',
    },
  ];

  const defaultProps = {
    gifts: mockGifts,
    expandedId: null,
    onToggleExpand: jest.fn(),
    onDeleteClick: jest.fn(),
    onToggleViewed: jest.fn(),
    isSelectMode: false,
    selectedGifts: new Set(),
    onToggleSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders gift table with gifts', () => {
    render(<AdminGiftTable {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    expect(screen.getByText('Customer A')).toBeInTheDocument();
    expect(screen.getByText('Customer B')).toBeInTheDocument();
  });

  test('shows correct status indicators', () => {
    render(<AdminGiftTable {...defaultProps} />);
    
    // First gift: unlocked, not viewed
    expect(screen.getByText('John Doe').closest('tr')).toContainElement(
      screen.getByRole('img', { hidden: true }) // Unlock icon
    );
    
    // Second gift: locked, viewed
    expect(screen.getByText('Alice Brown').closest('tr')).toContainElement(
      screen.getByRole('img', { hidden: true }) // Lock icon
    );
  });

  test('handles expand/collapse', () => {
    render(<AdminGiftTable {...defaultProps} />);
    
    const expandButton = screen.getByRole('button', { name: /expand/i });
    fireEvent.click(expandButton);
    
    expect(defaultProps.onToggleExpand).toHaveBeenCalledWith('1');
  });

  test('shows expanded content when gift is expanded', () => {
    render(<AdminGiftTable {...defaultProps} expandedId="1" />);
    
    // Should show expanded details for first gift
    expect(screen.getByText(/token123/)).toBeInTheDocument();
  });

  test('handles delete click', () => {
    render(<AdminGiftTable {...defaultProps} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    expect(defaultProps.onDeleteClick).toHaveBeenCalledWith(mockGifts[0]);
  });

  test('handles toggle viewed', () => {
    render(<AdminGiftTable {...defaultProps} />);
    
    const viewedButton = screen.getByRole('button', { name: /viewed/i });
    fireEvent.click(viewedButton);
    
    expect(defaultProps.onToggleViewed).toHaveBeenCalledWith('1');
  });

  test('shows select mode checkboxes', () => {
    render(<AdminGiftTable {...defaultProps} isSelectMode={true} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2); // One for each gift
  });

  test('handles selection toggle', () => {
    render(<AdminGiftTable {...defaultProps} isSelectMode={true} />);
    
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    
    expect(defaultProps.onToggleSelect).toHaveBeenCalledWith('1');
  });

  test('shows selected gifts', () => {
    render(
      <AdminGiftTable 
        {...defaultProps} 
        isSelectMode={true} 
        selectedGifts={new Set(['1'])} 
      />
    );
    
    const checkbox = screen.getAllByRole('checkbox')[0];
    expect(checkbox).toBeChecked();
  });

  test('handles copy link functionality', async () => {
    render(<AdminGiftTable {...defaultProps} />);
    
    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  test('generates correct URLs for staging', () => {
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'staging.kamlimos.com',
        origin: 'https://staging.kamlimos.com',
      },
      writable: true,
    });

    render(<AdminGiftTable {...defaultProps} />);
    
    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('https://staging.kamlimos.com')
    );
  });

  test('generates correct URLs for production', () => {
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'kamlimos.com',
        origin: 'https://kamlimos.com',
      },
      writable: true,
    });

    render(<AdminGiftTable {...defaultProps} />);
    
    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('https://scan.kamlimos.com')
    );
  });

  test('shows experience colors and icons', () => {
    render(<AdminGiftTable {...defaultProps} />);
    
    // Should show experience-specific styling
    const experienceElements = document.querySelectorAll('.bg-emerald-100, .text-emerald-600');
    expect(experienceElements.length).toBeGreaterThan(0);
  });

  test('handles empty gifts array', () => {
    render(<AdminGiftTable {...defaultProps} gifts={[]} />);
    
    expect(screen.getByText(/keine geschenke gefunden/i)).toBeInTheDocument();
  });

  test('shows correct timestamps', () => {
    render(<AdminGiftTable {...defaultProps} />);
    
    expect(screen.getByText(/15\.01\.2024/)).toBeInTheDocument();
    expect(screen.getByText(/14\.01\.2024/)).toBeInTheDocument();
  });

  test('handles gifts without security tokens', () => {
    const giftsWithoutToken = [
      { ...mockGifts[0], securityToken: null },
    ];
    
    render(<AdminGiftTable {...defaultProps} gifts={giftsWithoutToken} />);
    
    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.not.stringContaining('/token')
    );
  });

  test('shows print button', () => {
    render(<AdminGiftTable {...defaultProps} />);
    
    const printButton = screen.getByRole('button', { name: /print/i });
    expect(printButton).toBeInTheDocument();
  });

  test('shows external link button', () => {
    render(<AdminGiftTable {...defaultProps} />);
    
    const linkButton = screen.getByRole('button', { name: /external/i });
    expect(linkButton).toBeInTheDocument();
  });

  test('handles bulk selection', () => {
    render(
      <AdminGiftTable 
        {...defaultProps} 
        isSelectMode={true} 
        selectedGifts={new Set(['1', '2'])} 
      />
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
  });

  test('shows correct product types', () => {
    render(<AdminGiftTable {...defaultProps} />);
    
    expect(screen.getByText(/noor/i)).toBeInTheDocument();
    expect(screen.getByText(/tasse/i)).toBeInTheDocument();
  });

  test('has correct table structure', () => {
    render(<AdminGiftTable {...defaultProps} />);
    
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    
    const headers = screen.getAllByRole('columnheader');
    expect(headers.length).toBeGreaterThan(0);
  });

  test('handles gifts without customer names', () => {
    const giftsWithoutCustomer = [
      { ...mockGifts[0], customerName: null },
    ];
    
    render(<AdminGiftTable {...defaultProps} gifts={giftsWithoutCustomer} />);
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument(); // Fallback to senderName
  });

  test('handles gifts without sender names', () => {
    const giftsWithoutSender = [
      { ...mockGifts[0], customerName: null, senderName: null },
    ];
    
    render(<AdminGiftTable {...defaultProps} gifts={giftsWithoutSender} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument(); // Fallback to recipientName
  });
});
