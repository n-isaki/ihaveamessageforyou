import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NoorViewer from './NoorViewer';
import { getGiftById } from '@/services/gifts';

// Mock the service
jest.mock('@/services/gifts');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: 'test-gift-id' }),
}));

// Mock Audio
const mockAudio = {
  src: '',
  play: jest.fn().mockResolvedValue(),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.Audio = jest.fn(() => mockAudio);

describe('NoorViewer', () => {
  const mockGift = {
    id: 'test-gift-id',
    title: 'Test Noor Gift',
    audioUrl: 'https://example.com/audio.mp3',
    meaningAudioUrl: 'https://example.com/meaning.mp3',
    meaningText: 'This is the meaning text',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getGiftById.mockResolvedValue(mockGift);
  });

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  test('renders loading state initially', () => {
    getGiftById.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderWithRouter(<NoorViewer />);
    
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  test('renders gift data after loading', async () => {
    renderWithRouter(<NoorViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Noor Gift')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Light of Remembrance')).toBeInTheDocument();
    expect(screen.getByText('Die Bedeutung')).toBeInTheDocument();
  });

  test('renders meaning text when provided', async () => {
    renderWithRouter(<NoorViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('This is the meaning text')).toBeInTheDocument();
    });
  });

  test('renders placeholder when no meaning text', async () => {
    const giftWithoutMeaning = { ...mockGift, meaningText: null };
    getGiftById.mockResolvedValue(giftWithoutMeaning);
    
    renderWithRouter(<NoorViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('_Keine schriftliche Bedeutung hinterlegt._')).toBeInTheDocument();
    });
  });

  test('handles audio playback', async () => {
    renderWithRouter(<NoorViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Noor Gift')).toBeInTheDocument();
    });
    
    // Find the circular player button
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);
    
    expect(mockAudio.play).toHaveBeenCalled();
  });

  test('handles pause functionality', async () => {
    renderWithRouter(<NoorViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Noor Gift')).toBeInTheDocument();
    });
    
    // Start playing
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);
    
    // Pause
    fireEvent.click(playButton);
    
    expect(mockAudio.pause).toHaveBeenCalled();
  });

  test('renders meaning audio player when meaningAudioUrl exists', async () => {
    renderWithRouter(<NoorViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Bedeutung anhören')).toBeInTheDocument();
    });
  });

  test('does not render meaning audio player when no meaningAudioUrl', async () => {
    const giftWithoutMeaningAudio = { ...mockGift, meaningAudioUrl: null };
    getGiftById.mockResolvedValue(giftWithoutMeaningAudio);
    
    renderWithRouter(<NoorViewer />);
    
    await waitFor(() => {
      expect(screen.queryByText('Bedeutung anhören')).not.toBeInTheDocument();
    });
  });

  test('handles error state when gift not found', async () => {
    getGiftById.mockResolvedValue(null);
    
    renderWithRouter(<NoorViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Nicht gefunden.')).toBeInTheDocument();
    });
  });

  test('handles fetch error gracefully', async () => {
    getGiftById.mockRejectedValue(new Error('Network error'));
    
    renderWithRouter(<NoorViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Nicht gefunden.')).toBeInTheDocument();
    });
  });

  test('renders with gift prop directly', async () => {
    renderWithRouter(<NoorViewer gift={mockGift} />);
    
    // Should not call getGiftById when gift is provided as prop
    expect(getGiftById).not.toHaveBeenCalled();
    
    await waitFor(() => {
      expect(screen.getByText('Test Noor Gift')).toBeInTheDocument();
    });
  });

  test('sets up audio sources correctly', async () => {
    renderWithRouter(<NoorViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Noor Gift')).toBeInTheDocument();
    });
    
    expect(mockAudio.src).toBe('https://example.com/audio.mp3');
  });

  test('renders branding link', async () => {
    renderWithRouter(<NoorViewer />);
    
    await waitFor(() => {
      const link = screen.getByText('www.kamlimos.com');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://www.kamlimos.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  test('handles audio ended event', async () => {
    let endedCallback;
    mockAudio.addEventListener.mockImplementation((event, callback) => {
      if (event === 'ended') {
        endedCallback = callback;
      }
    });
    
    renderWithRouter(<NoorViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Noor Gift')).toBeInTheDocument();
    });
    
    // Simulate audio ending
    if (endedCallback) {
      endedCallback();
    }
    
    // Verify the component handles the ended event
    expect(mockAudio.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
  });
});
