/**
 * Feature Flags Configuration
 * 
 * Diese Datei zentralisiert alle Feature Flags für die Anwendung.
 * Flags werden über Environment-Variablen gesteuert (VITE_* für Vite).
 */

// Sicherer Zugriff auf import.meta.env für Vite-Kompatibilität
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

export const FEATURE_FLAGS = {
  // Neue Noor Viewer (experimentell)
  NEW_NOOR_VIEWER: env.VITE_NEW_NOOR_VIEWER === "true",
  
  // Erweiterter Audio Player
  ADVANCED_AUDIO_PLAYER: env.VITE_ADVANCED_AUDIO_PLAYER === "true",
  
  // Redesigned Admin Dashboard
  REDESIGNED_ADMIN_DASHBOARD: env.VITE_REDESIGNED_ADMIN_DASHBOARD === "true",
  
  // Multi-Sprachunterstützung
  MULTI_LANGUAGE_SUPPORT: env.VITE_MULTI_LANGUAGE_SUPPORT === "true",
  
  // Experimentelle Animationen
  EXPERIMENTAL_ANIMATIONS: env.VITE_EXPERIMENTAL_ANIMATIONS === "true",
  
  // Beta Shopify Integration
  BETA_SHOPIFY_INTEGRATION: env.VITE_BETA_SHOPIFY_INTEGRATION === "true",
};

/**
 * Hook für den Zugriff auf einzelne Feature Flags
 * @param {string} flag - Der Name des Feature Flags
 * @returns {boolean} - Ist das Feature aktiv?
 */
export function useFeatureFlag(flag) {
  return FEATURE_FLAGS[flag] || false;
}

/**
 * React Component für bedingtes Rendern basierend auf Feature Flags
 * @param {Object} props - Component props
 * @param {string} props.feature - Der Name des Feature Flags
 * @param {React.ReactNode} props.children - Children, die gerendert werden, wenn das Feature aktiv ist
 * @param {React.ReactNode} props.fallback - Optionaler Fallback, wenn das Feature inaktiv ist
 */
export function FeatureFlag({ feature, children, fallback = null }) {
  const isEnabled = FEATURE_FLAGS[feature] || false;
  
  return isEnabled ? children : fallback;
};
