import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = (import.meta as any).env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyD_jl0QfkP7_ujvMmMmsol4oe3RUu0HGnc',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'goldex-c4347.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'goldex-c4347',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'goldex-c4347.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '829299296738',
  appId: env.VITE_FIREBASE_APP_ID || '1:829299296738:web:4c8f11be20d571edbbd1bb',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-LCXXBLH8FJ',
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();
export const analyticsPromise = app ? isSupported().then((supported) => supported ? getAnalytics(app) : null) : Promise.resolve(null);
