import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration - hardcoded for production (working solution)
const firebaseConfig = {
    apiKey: "AIzaSyBKV6i9arcfVB8pXNLxSiCD2zkCIfIo35A",
    authDomain: "gift-shop-app-7bbd3.firebaseapp.com",
    projectId: "gift-shop-app-7bbd3",
    storageBucket: "gift-shop-app-7bbd3.firebasestorage.app",
    messagingSenderId: "140642404762",
    appId: "1:140642404762:web:b5470e822a35f2f6641223",
    measurementId: "G-E9JRG0053T"
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