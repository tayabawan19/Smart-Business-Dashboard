import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

/**
 * Firebase Web App Configuration
 * Reads configuration securely from Vite environment variables
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBPiAEWgBc09h5NlOCW3OEAA1emf5xNNcE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'smart-business-4cc00.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'smart-business-4cc00',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'smart-business-4cc00.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '590450859096',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:590450859096:web:89fb5a719158d0d6d2be2d',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-Y8X73DYN23',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your_firebase_api_key_here' &&
  firebaseConfig.projectId
);

let app = null;
let auth = null;
let googleProvider = null;
let analytics = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  // Initialize Analytics if supported in the current environment
  if (typeof window !== 'undefined') {
    isSupported()
      .then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app);
        }
      })
      .catch((err) => {
        // Analytics may be blocked by browser privacy settings or adblockers
        console.debug('[Firebase Analytics Notice]', err?.message || 'Analytics skipped');
      });
  }
  console.log(`⚡ [Firebase] Initialized with project ID: ${firebaseConfig.projectId}`);
} catch (error) {
  console.error('❌ [Firebase] Initialization Error:', error);
}

export { auth, googleProvider, analytics };
export default app;
