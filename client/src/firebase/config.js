import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Retrieve configuration from Vite env variables or localStorage
function getFirebaseConfig() {
  const saved = localStorage.getItem('firebase_app_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved Firebase config from localStorage');
    }
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  };
}

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase only if valid projectId & apiKey exist
let app = null;
let auth = null;
const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

if (isConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('[Firebase] Initialized with project ID:', firebaseConfig.projectId);
  } catch (err) {
    console.error('[Firebase Init Error]:', err);
  }
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function saveFirebaseConfig(newConfig) {
  localStorage.setItem('firebase_app_config', JSON.stringify(newConfig));
  window.location.reload();
}

export { app, auth, googleProvider, isConfigured, firebaseConfig };
