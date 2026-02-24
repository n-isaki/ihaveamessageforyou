import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Firebase config from env (no key in repo). Set in .env.local and in GitHub Secrets for CI.
// In Google Cloud Console: restrict this API key (HTTP referrers + API restrictions) to limit abuse.
const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "gift-shop-app-7bbd3.firebaseapp.com",
    projectId: env.VITE_FIREBASE_PROJECT_ID || "gift-shop-app-7bbd3",
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "gift-shop-app-7bbd3.firebasestorage.app",
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "140642404762",
    appId: env.VITE_FIREBASE_APP_ID || "1:140642404762:web:b5470e822a35f2f6641223",
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-E9JRG0053T"
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