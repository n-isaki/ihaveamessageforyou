// Feature Toggle System für Trunk-based Development
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

export const FEATURE_FLAGS = {
  NEW_NOOR_VIEWER: env.VITE_NEW_NOOR_VIEWER === "true",
  ADVANCED_AUDIO_PLAYER: env.VITE_ADVANCED_AUDIO_PLAYER === "true",
  REDESIGNED_ADMIN_DASHBOARD: env.VITE_REDESIGNED_ADMIN_DASHBOARD === "true",
  MULTI_LANGUAGE_SUPPORT: env.VITE_MULTI_LANGUAGE_SUPPORT === "true",
  EXPERIMENTAL_ANIMATIONS: env.VITE_EXPERIMENTAL_ANIMATIONS === "true",
  BETA_SHOPIFY_INTEGRATION: env.VITE_BETA_SHOPIFY_INTEGRATION === "true",
};

// Hook for checking feature flags
export const useFeatureFlag = (feature) => {
  return FEATURE_FLAGS[feature] || false;
};

// Helper for conditional rendering
export const FeatureFlag = ({ feature, children, fallback = null }) => {
  const isEnabled = FEATURE_FLAGS[feature] || false;
  return isEnabled ? children : fallback;
};
