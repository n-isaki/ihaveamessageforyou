// CustomerSetup Field Configuration for Admin Experience UI
// This file defines which fields are visible/enabled for different project types

export const FIELD_CONFIG = {
  // Basic Information Fields
  basic: {
    // Field visibility by project type
    headline: {
      enabled: ['mug', 'bracelet', 'memoria', 'noor'],
      required: ['mug', 'bracelet', 'memoria'],
      label: 'Titel',
      description: 'Erste Zeile auf dem Cover',
      placeholder: 'Für die beste Mama'
    },
    recipient: {
      enabled: ['mug', 'bracelet', 'memoria', 'noor'],
      required: ['mug', 'bracelet', 'memoria', 'noor'],
      label: 'Empfänger',
      description: 'Wer beschenkt wird?',
      placeholder: 'Name des Empfängers'
    },
    sender: {
      enabled: ['mug', 'bracelet', 'memoria', 'noor'],
      required: ['mug', 'bracelet', 'memoria', 'noor'],
      label: 'Absender',
      description: 'Wer schenkt?',
      placeholder: 'Dein Name'
    },
    subheadline: {
      enabled: ['mug', 'bracelet', 'memoria', 'noor'],
      required: [],
      label: 'Untertitel',
      description: 'Zweite Zeile auf dem Cover',
      placeholder: 'Zu deinem Geburtstag'
    }
  },

  // Media Fields
  media: {
    albumImages: {
      enabled: ['mug', 'bracelet'],
      required: [],
      label: 'Fotos & Videos',
      description: 'Lade hochwertige Fotos hoch',
      maxFiles: 7
    },
    engravingText: {
      enabled: ['mug', 'bracelet'],
      required: [],
      label: 'Gravur Text',
      description: 'Text für die Gravur (max. 30 Zeichen)',
      maxLength: 30
    },
    memoriaDesign: {
      enabled: ['memoria'],
      required: ['memoria'],
      label: 'Design Bild',
      description: 'Bild für die Gravur (Hochformat empfohlen)'
    },
    // Memoria specific fields
    deceasedName: {
      enabled: ['memoria'],
      required: ['memoria'],
      label: 'Name des Verstorbenen',
      description: 'Vollständiger Name',
      maxLength: 200
    },
    lifeDates: {
      enabled: ['memoria'],
      required: ['memoria'],
      label: 'Lebensdaten',
      description: 'Geburts- und Sterbedatum',
      maxLength: 100
    },
    meaningText: {
      enabled: ['memoria'],
      required: ['memoria'],
      label: 'Bedeutung',
      description: 'Persönliche Worte und Erinnerungen',
      maxLength: 5000
    }
  },

  // Access Control
  access: {
    enabled: ['mug', 'bracelet', 'memoria'],
    required: [],
    label: 'Zugangsoptionen',
    description: 'Wer kann das Geschenk öffnen?'
  },

  // Messages
  messages: {
    enabled: ['mug', 'bracelet', 'memoria', 'noor'],
    required: ['mug', 'bracelet', 'memoria', 'noor'],
    label: 'Persönliche Nachrichten',
    description: 'Füge persönliche Worte und Erinnerungen hinzu'
  },

  // Social Gifting
  social: {
    enabled: ['mug', 'bracelet', 'memoria', 'noor'],
    required: [],
    label: 'Gemeinschaftliches Geschenk',
    description: 'Freunde und Familie können ebenfalls Beiträge hinzufügen'
  }
};

// Helper function to check if a field is enabled for a project
export const isFieldEnabled = (category, field, projectType) => {
  const fieldConfig = FIELD_CONFIG[category]?.[field];
  return fieldConfig?.enabled?.includes(projectType) || false;
};

// Helper function to check if a field is required for a project
export const isFieldRequired = (category, field, projectType) => {
  const fieldConfig = FIELD_CONFIG[category]?.[field];
  return fieldConfig?.required?.includes(projectType) || false;
};

// Helper function to get all enabled fields for a project
export const getEnabledFields = (projectType) => {
  const enabledFields = {};
  
  Object.keys(FIELD_CONFIG).forEach(category => {
    enabledFields[category] = {};
    
    Object.keys(FIELD_CONFIG[category]).forEach(field => {
      if (isFieldEnabled(category, field, projectType)) {
        enabledFields[category][field] = {
          ...FIELD_CONFIG[category][field],
          required: isFieldRequired(category, field, projectType)
        };
      }
    });
  });
  
  return enabledFields;
};
