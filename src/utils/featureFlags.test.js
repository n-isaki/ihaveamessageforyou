import { FEATURE_FLAGS, useFeatureFlag, FeatureFlag } from './featureFlags';
import { render, screen } from '@testing-library/react';

// Mock process.env
const originalEnv = process.env;

describe('Feature Flags', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('FEATURE_FLAGS', () => {
    test('returns correct default values', () => {
      expect(FEATURE_FLAGS.NEW_NOOR_VIEWER).toBe(false);
      expect(FEATURE_FLAGS.ADVANCED_AUDIO_PLAYER).toBe(false);
      expect(FEATURE_FLAGS.REDESIGNED_ADMIN_DASHBOARD).toBe(false);
      expect(FEATURE_FLAGS.MULTI_LANGUAGE_SUPPORT).toBe(false);
      expect(FEATURE_FLAGS.EXPERIMENTAL_ANIMATIONS).toBe(false);
      expect(FEATURE_FLAGS.BETA_SHOPIFY_INTEGRATION).toBe(false);
    });

    test('reads from environment variables', () => {
      process.env.REACT_APP_NEW_NOOR_VIEWER = 'true';
      process.env.REACT_APP_ADVANCED_AUDIO_PLAYER = 'true';
      process.env.REACT_APP_EXPERIMENTAL_ANIMATIONS = 'true';

      // Re-import to get updated values
      jest.resetModules();
      const { FEATURE_FLAGS: UpdatedFlags } = require('./featureFlags');

      expect(UpdatedFlags.NEW_NOOR_VIEWER).toBe(true);
      expect(UpdatedFlags.ADVANCED_AUDIO_PLAYER).toBe(true);
      expect(UpdatedFlags.EXPERIMENTAL_ANIMATIONS).toBe(true);
      expect(UpdatedFlags.REDESIGNED_ADMIN_DASHBOARD).toBe(false);
    });

    test('handles string "false" correctly', () => {
      process.env.REACT_APP_NEW_NOOR_VIEWER = 'false';

      jest.resetModules();
      const { FEATURE_FLAGS: UpdatedFlags } = require('./featureFlags');

      expect(UpdatedFlags.NEW_NOOR_VIEWER).toBe(false);
    });

    test('handles undefined environment variables', () => {
      delete process.env.REACT_APP_NEW_NOOR_VIEWER;

      jest.resetModules();
      const { FEATURE_FLAGS: UpdatedFlags } = require('./featureFlags');

      expect(UpdatedFlags.NEW_NOOR_VIEWER).toBe(false);
    });
  });

  describe('useFeatureFlag hook', () => {
    test('returns false for disabled feature', () => {
      process.env.REACT_APP_NEW_NOOR_VIEWER = 'false';

      jest.resetModules();
      const { useFeatureFlag } = require('./featureFlags');

      const TestComponent = () => {
        const isEnabled = useFeatureFlag('NEW_NOOR_VIEWER');
        return <div>{isEnabled ? 'Enabled' : 'Disabled'}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByText('Disabled')).toBeInTheDocument();
    });

    test('returns true for enabled feature', () => {
      process.env.REACT_APP_NEW_NOOR_VIEWER = 'true';

      jest.resetModules();
      const { useFeatureFlag } = require('./featureFlags');

      const TestComponent = () => {
        const isEnabled = useFeatureFlag('NEW_NOOR_VIEWER');
        return <div>{isEnabled ? 'Enabled' : 'Disabled'}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByText('Enabled')).toBeInTheDocument();
    });

    test('returns false for unknown feature', () => {
      jest.resetModules();
      const { useFeatureFlag } = require('./featureFlags');

      const TestComponent = () => {
        const isEnabled = useFeatureFlag('UNKNOWN_FEATURE');
        return <div>{isEnabled ? 'Enabled' : 'Disabled'}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByText('Disabled')).toBeInTheDocument();
    });
  });

  describe('FeatureFlag component', () => {
    test('renders children when feature is enabled', () => {
      process.env.REACT_APP_NEW_NOOR_VIEWER = 'true';

      jest.resetModules();
      const { FeatureFlag } = require('./featureFlags');

      render(
        <FeatureFlag feature="NEW_NOOR_VIEWER">
          <div data-testid="feature-content">New Feature Content</div>
        </FeatureFlag>
      );

      expect(screen.getByTestId('feature-content')).toBeInTheDocument();
      expect(screen.getByText('New Feature Content')).toBeInTheDocument();
    });

    test('renders fallback when feature is disabled', () => {
      process.env.REACT_APP_NEW_NOOR_VIEWER = 'false';

      jest.resetModules();
      const { FeatureFlag } = require('./featureFlags');

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

    test('renders nothing when feature is disabled and no fallback', () => {
      process.env.REACT_APP_NEW_NOOR_VIEWER = 'false';

      jest.resetModules();
      const { FeatureFlag } = require('./featureFlags');

      render(
        <FeatureFlag feature="NEW_NOOR_VIEWER">
          <div data-testid="feature-content">New Feature Content</div>
        </FeatureFlag>
      );

      expect(screen.queryByTestId('feature-content')).not.toBeInTheDocument();
    });

    test('renders children for unknown feature (defaults to false)', () => {
      jest.resetModules();
      const { FeatureFlag } = require('./featureFlags');

      render(
        <FeatureFlag feature="UNKNOWN_FEATURE">
          <div data-testid="feature-content">Unknown Feature Content</div>
        </FeatureFlag>
      );

      expect(screen.queryByTestId('feature-content')).not.toBeInTheDocument();
    });

    test('handles experimental features', () => {
      process.env.REACT_APP_EXPERIMENTAL_ANIMATIONS = 'true';

      jest.resetModules();
      const { FeatureFlag } = require('./featureFlags');

      render(
        <FeatureFlag feature="EXPERIMENTAL_ANIMATIONS">
          <div data-testid="experimental-content">Experimental Animations</div>
        </FeatureFlag>
      );

      expect(screen.getByTestId('experimental-content')).toBeInTheDocument();
    });

    test('handles multiple feature flags simultaneously', () => {
      process.env.REACT_APP_NEW_NOOR_VIEWER = 'true';
      process.env.REACT_APP_ADVANCED_AUDIO_PLAYER = 'false';

      jest.resetModules();
      const { FeatureFlag } = require('./featureFlags');

      render(
        <div>
          <FeatureFlag feature="NEW_NOOR_VIEWER">
            <div data-testid="noor-viewer">Noor Viewer</div>
          </FeatureFlag>
          <FeatureFlag feature="ADVANCED_AUDIO_PLAYER">
            <div data-testid="audio-player">Audio Player</div>
          </FeatureFlag>
        </div>
      );

      expect(screen.getByTestId('noor-viewer')).toBeInTheDocument();
      expect(screen.queryByTestId('audio-player')).not.toBeInTheDocument();
    });
  });

  describe('Integration with React components', () => {
    test('works with complex component trees', () => {
      process.env.REACT_APP_REDESIGNED_ADMIN_DASHBOARD = 'true';

      jest.resetModules();
      const { FeatureFlag } = require('./featureFlags');

      const AdminDashboard = () => (
        <div>
          <h1>Admin Dashboard</h1>
          <FeatureFlag feature="REDESIGNED_ADMIN_DASHBOARD">
            <div>
              <h2>New Dashboard Design</h2>
              <p>This is the new dashboard layout</p>
            </div>
          </FeatureFlag>
          <FeatureFlag 
            feature="REDESIGNED_ADMIN_DASHBOARD" 
            fallback={<div><h2>Old Dashboard</h2></div>}
          >
            <div></div>
          </FeatureFlag>
        </div>
      );

      render(<AdminDashboard />);

      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('New Dashboard Design')).toBeInTheDocument();
      expect(screen.getByText('This is the new dashboard layout')).toBeInTheDocument();
      expect(screen.queryByText('Old Dashboard')).not.toBeInTheDocument();
    });
  });
});
