// Basic test without React components to avoid setup issues
import { FEATURE_FLAGS } from './featureFlags';

describe('Feature Flags Basic', () => {
  test('returns correct default values', () => {
    expect(FEATURE_FLAGS.NEW_NOOR_VIEWER).toBe(false);
    expect(FEATURE_FLAGS.ADVANCED_AUDIO_PLAYER).toBe(false);
    expect(FEATURE_FLAGS.REDESIGNED_ADMIN_DASHBOARD).toBe(false);
    expect(FEATURE_FLAGS.MULTI_LANGUAGE_SUPPORT).toBe(false);
    expect(FEATURE_FLAGS.EXPERIMENTAL_ANIMATIONS).toBe(false);
    expect(FEATURE_FLAGS.BETA_SHOPIFY_INTEGRATION).toBe(false);
  });

  test('FEATURE_FLAGS object has expected structure', () => {
    expect(typeof FEATURE_FLAGS).toBe('object');
    expect(Object.keys(FEATURE_FLAGS)).toContain('NEW_NOOR_VIEWER');
    expect(Object.keys(FEATURE_FLAGS)).toContain('ADVANCED_AUDIO_PLAYER');
    expect(Object.keys(FEATURE_FLAGS)).toContain('REDESIGNED_ADMIN_DASHBOARD');
  });

  test('all feature flags are boolean values', () => {
    Object.values(FEATURE_FLAGS).forEach(flag => {
      expect(typeof flag).toBe('boolean');
    });
  });
});
