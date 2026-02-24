import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminStats from './AdminStats';

// Mock date formatting
const mockDate = new Date('2024-01-15T10:30:00');
global.Date = jest.fn(() => mockDate);
global.Date.toLocaleTimeString = jest.fn(() => '10:30');

describe('AdminStats', () => {
  const mockGifts = [
    {
      id: '1',
      recipientName: 'John Doe',
      senderName: 'Jane Smith',
      customerName: 'Customer A',
      locked: false,
      viewed: false,
      createdAt: { toDate: () => new Date('2024-01-15T08:00:00') },
      updatedAt: { toDate: () => new Date('2024-01-15T09:00:00') },
    },
    {
      id: '2',
      recipientName: 'Alice Brown',
      senderName: 'Bob Wilson',
      customerName: 'Customer B',
      locked: true,
      viewed: false,
      createdAt: { toDate: () => new Date('2024-01-15T07:00:00') },
      updatedAt: { toDate: () => new Date('2024-01-15T08:30:00') },
    },
    {
      id: '3',
      recipientName: 'Charlie Davis',
      senderName: 'Diana Evans',
      customerName: 'Customer C',
      locked: true,
      viewed: true,
      viewedAt: { toDate: () => new Date('2024-01-15T10:00:00') },
      createdAt: { toDate: () => new Date('2024-01-15T06:00:00') },
      updatedAt: { toDate: () => new Date('2024-01-15T07:30:00') },
    },
  ];

  test('renders stats cards with correct counts', () => {
    render(<AdminStats gifts={mockGifts} filteredGifts={mockGifts} />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Total
    expect(screen.getByText('1')).toBeInTheDocument(); // Offen (not locked)
    expect(screen.getByText('1')).toBeInTheDocument(); // Bereit (locked, not viewed)
    expect(screen.getByText('1')).toBeInTheDocument(); // Gesehen (viewed)
  });

  test('calculates stats correctly from filtered gifts', () => {
    const filteredGifts = [mockGifts[0], mockGifts[1]]; // Only 2 gifts
    render(<AdminStats gifts={mockGifts} filteredGifts={filteredGifts} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Total from filtered
    expect(screen.getByText('1')).toBeInTheDocument(); // Offen
    expect(screen.getByText('1')).toBeInTheDocument(); // Bereit
    expect(screen.getByText('0')).toBeInTheDocument(); // Gesehen (none in filtered)
  });

  test('displays correct labels for stats', () => {
    render(<AdminStats gifts={mockGifts} filteredGifts={mockGifts} />);
    
    expect(screen.getByText('Gesamt')).toBeInTheDocument();
    expect(screen.getByText('Offen')).toBeInTheDocument();
    expect(screen.getByText('Bereit')).toBeInTheDocument();
    expect(screen.getByText('Gesehen')).toBeInTheDocument();
  });

  test('shows activity feed section', () => {
    render(<AdminStats gifts={mockGifts} filteredGifts={mockGifts} />);
    
    expect(screen.getByText('Live Aktivität')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Animated pulse dot
  });

  test('displays activities in correct order', () => {
    render(<AdminStats gifts={mockGifts} filteredGifts={mockGifts} />);
    
    const activities = screen.getAllByText(/Neuer Auftrag|hat das Geschenk angesehen|ist jetzt fertig/);
    expect(activities).toHaveLength(3);
  });

  test('shows created activity', () => {
    render(<AdminStats gifts={mockGifts} filteredGifts={mockGifts} />);
    
    expect(screen.getByText(/Neuer Auftrag für Customer A/)).toBeInTheDocument();
  });

  test('shows viewed activity', () => {
    render(<AdminStats gifts={mockGifts} filteredGifts={mockGifts} />);
    
    expect(screen.getByText(/John Doe hat das Geschenk angesehen!/)).toBeInTheDocument();
  });

  test('shows locked activity', () => {
    render(<AdminStats gifts={mockGifts} filteredGifts={mockGifts} />);
    
    expect(screen.getByText(/Geschenk für Alice Brown ist jetzt fertig./)).toBeInTheDocument();
  });

  test('displays timestamps for activities', () => {
    render(<AdminStats gifts={mockGifts} filteredGifts={mockGifts} />);
    
    const timestamps = screen.getAllByText('10:30');
    expect(timestamps.length).toBeGreaterThan(0);
  });

  test('shows empty state when no activities', () => {
    render(<AdminStats gifts={[]} filteredGifts={[]} />);
    
    expect(screen.getByText('Keine Aktivitäten')).toBeInTheDocument();
  });

  test('handles gifts without dates gracefully', () => {
    const giftsWithoutDates = [
      { ...mockGifts[0], createdAt: null },
      { ...mockGifts[1], createdAt: undefined },
    ];
    
    render(<AdminStats gifts={giftsWithoutDates} filteredGifts={giftsWithoutDates} />);
    
    expect(screen.getByText('0')).toBeInTheDocument(); // Total should be 0 since no valid dates
  });

  test('limits activities to 5 most recent', () => {
    const manyGifts = Array.from({ length: 10 }, (_, i) => ({
      ...mockGifts[0],
      id: i.toString(),
      createdAt: { toDate: () => new Date(`2024-01-15T${8 + i}:00:00`) },
    }));
    
    render(<AdminStats gifts={manyGifts} filteredGifts={manyGifts} />);
    
    // Should show max 5 activities
    const activities = screen.getAllByText(/Neuer Auftrag/);
    expect(activities.length).toBeLessThanOrEqual(5);
  });

  test('has correct grid layout', () => {
    render(<AdminStats gifts={mockGifts} filteredGifts={mockGifts} />);
    
    const grid = screen.getByText('Gesamt').closest('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'lg:grid-cols-4');
  });

  test('stats cards have correct styling', () => {
    render(<AdminStats gifts={mockGifts} filteredGifts={mockGifts} />);
    
    const statsCards = screen.getAllByText(/\d+/).slice(0, 4); // First 4 numbers are stats
    statsCards.forEach(card => {
      const container = card.closest('.bg-white');
      expect(container).toHaveClass(
        'p-4',
        'rounded-2xl',
        'border',
        'border-stone-100',
        'shadow-sm'
      );
    });
  });

  test('activity feed has correct styling', () => {
    render(<AdminStats gifts={mockGifts} filteredGifts={mockGifts} />);
    
    const activityFeed = screen.getByText('Live Aktivität').closest('.bg-white');
    expect(activityFeed).toHaveClass(
      'rounded-2xl',
      'border',
      'border-stone-200',
      'shadow-sm'
    );
  });

  test('shows correct icons for stats', () => {
    render(<AdminStats gifts={mockGifts} filteredGifts={mockGifts} />);
    
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  test('handles edge case of single gift', () => {
    const singleGift = [mockGifts[0]];
    render(<AdminStats gifts={singleGift} filteredGifts={singleGift} />);
    
    expect(screen.getByText('1')).toBeInTheDocument(); // Total
    expect(screen.getByText('1')).toBeInTheDocument(); // Offen
    expect(screen.getByText('0')).toBeInTheDocument(); // Bereit
    expect(screen.getByText('0')).toBeInTheDocument(); // Gesehen
  });

  test('uses customerName as fallback for activity display', () => {
    const giftWithoutSender = {
      ...mockGifts[0],
      senderName: null,
      customerName: 'Customer X',
    };
    
    render(<AdminStats gifts={[giftWithoutSender]} filteredGifts={[giftWithoutSender]} />);
    
    expect(screen.getByText(/Neuer Auftrag für Customer X/)).toBeInTheDocument();
  });

  test('uses default text when no names available', () => {
    const giftWithoutNames = {
      ...mockGifts[0],
      senderName: null,
      customerName: null,
    };
    
    render(<AdminStats gifts={[giftWithoutNames]} filteredGifts={[giftWithoutNames]} />);
    
    expect(screen.getByText(/Neuer Auftrag für Kunde/)).toBeInTheDocument();
  });
});
