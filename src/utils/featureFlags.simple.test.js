import { FEATURE_FLAGS, useFeatureFlag, FeatureFlag } from './featureFlags';
import { render, screen } from '@testing-library/react';

describe('Feature Flags', () => {
  test('returns correct default values', () => {
    expect(FEATURE_FLAGS.NEW_NOOR_VIEWER).toBe(false);
    expect(FEATURE_FLAGS.ADVANCED_AUDIO_PLAYER).toBe(false);
    expect(FEATURE_FLAGS.REDESIGNED_ADMIN_DASHBOARD).toBe(false);
  });

  test('FeatureFlag component renders children when enabled', () => {
    // Mock environment variable
    const originalEnv = process.env.REACT_APP_NEW_NOOR_VIEWER;
    process.env.REACT_APP_NEW_NOOR_VIEWER = 'true';

    // Re-import to get updated values
    jest.resetModules();
    const { FeatureFlag } = require('./featureFlags');

    render(
      <FeatureFlag feature="NEW_NOOR_VIEWER">
        <div data-testid="feature-content">New Feature Content</div>
      </FeatureFlag>
    );

    expect(screen.getByTestId('feature-content')).toBeInTheDocument();
    expect(screen.getByText('New Feature Content')).toBeInTheDocument();

    // Restore original env
    process.env.REACT_APP_NEW_NOOR_VIEWER = originalEnv;
  });

  test('FeatureFlag component renders fallback when disabled', () => {
    render(
      <FeatureFlag 
        feature="NEW_NOOR_VIEWER"
        fallback={<div data-testid="fallback-content">Fallback Content</div>}
      >
        <div data-testid="feature-content">New Feature Content</div>
      </FeatureFlag>
    );

    expect(screen.queryByTestId('feature-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    expect(screen.getByText('Fallback Content')).toBeInTheDocument();
  });
});
