import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || JSON.parse(process.env.FIREBASE_CONFIG || '{}').apiKey || "AIzaSyDummyKeyForDevelopment",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || JSON.parse(process.env.FIREBASE_CONFIG || '{}').authDomain || "gift-shop-app-7bbd3.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId || "gift-shop-app-7bbd3",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || JSON.parse(process.env.FIREBASE_CONFIG || '{}').storageBucket || "gift-shop-app-7bbd3.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || JSON.parse(process.env.FIREBASE_CONFIG || '{}').messagingSenderId || "123456789",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || JSON.parse(process.env.FIREBASE_CONFIG || '{}').appId || "1:123456789:web:abcdef",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || JSON.parse(process.env.FIREBASE_CONFIG || '{}').measurementId || "G-XXXXXXXX"
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