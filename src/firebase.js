import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Helper function to safely get environment variables
const getEnvVar = (importMetaKey, processKey, fallback) => {
  // Try Vite environment first
  if (import.meta.env && import.meta.env[importMetaKey]) {
    return import.meta.env[importMetaKey];
  }
  
  // Try window.FIREBASE_CONFIG (injected during build)
  if (typeof window !== 'undefined' && window.FIREBASE_CONFIG) {
    try {
      const firebaseConfig = JSON.parse(window.FIREBASE_CONFIG);
      return firebaseConfig[processKey] || fallback;
    } catch (e) {
      console.warn('Failed to parse window.FIREBASE_CONFIG:', e);
    }
  }
  
  return fallback;
};

const firebaseConfig = {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'apiKey', "AIzaSyDummyKeyForDevelopment"),
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'authDomain', "gift-shop-app-7bbd3.firebaseapp.com"),
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'projectId', "gift-shop-app-7bbd3"),
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'storageBucket', "gift-shop-app-7bbd3.appspot.com"),
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', 'messagingSenderId', "123456789"),
    appId: getEnvVar('VITE_FIREBASE_APP_ID', 'appId', "1:123456789:web:abcdef"),
    measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID', 'measurementId', "G-XXXXXXXX")
};

import { getStorage } from "firebase/storage";
import { getApps } from "firebase/app";
import { getFunctions } from "firebase/functions";

// Prevent multiple Firebase initializations (important when karakedimartin is also running)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);