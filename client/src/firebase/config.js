import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCsryFdOffcV4-Z6X8fJIdwW7G3SFTi4xE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cohort3-29812.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cohort3-29812",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cohort3-29812.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "574414820901",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:574414820901:web:99150481a8ca31f6bf51cc",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JZ1TP9CYGJ"
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Analytics if supported in environment
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export const isConfigured = true;

export function saveFirebaseConfig(newConfig) {
  localStorage.setItem('firebase_app_config', JSON.stringify(newConfig));
  window.location.reload();
}

export { app, auth, googleProvider, analytics };
