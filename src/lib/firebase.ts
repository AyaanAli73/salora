import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics'
import { getFunctions, Functions } from 'firebase/functions'

/**
 * Salora Salon Management System — Firebase Configuration & Initialization
 * Single-salon, single-location architecture.
 *
 * Configured for Firebase project: salora-c8843
 * Uses modular Firebase SDK with environment variable precedence.
 */

const getEnv = (key: string, fallback: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key]
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]
  }
  return fallback
}

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', 'AIzaSyANLYcEVU-13CyYckapbsDQwBkgZxe0Da8'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'salora-c8843.firebaseapp.com'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', 'salora-c8843'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'salora-c8843.firebasestorage.app'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '844863783165'),
  appId: getEnv('VITE_FIREBASE_APP_ID', '1:844863783165:web:94b3943d17c2e38e353e94'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID', 'G-667RRTZK6V'),
}

// Indicator that Firebase has valid project credentials configured
export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY'
)

/**
 * Initialize or retrieve existing Firebase App instance.
 * Avoids duplicate app initialization across Vite HMR (Hot Module Replacement).
 */
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

/**
 * Firebase Authentication instance
 */
export const auth: Auth = getAuth(app)

/**
 * Cloud Firestore instance
 */
export const db: Firestore = getFirestore(app)

/**
 * Cloud Storage instance
 */
export const storage: FirebaseStorage = getStorage(app)

/**
 * Cloud Functions instance (optional helper)
 */
export const functions: Functions = getFunctions(app, 'asia-south1')

/**
 * Firebase Analytics instance
 * Safely initialized in browser environments supporting required browser features.
 */
export let analytics: Analytics | null = null

if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app)
      }
    })
    .catch((err) => {
      console.warn('[Salora Firebase] Analytics not supported in this environment:', err)
    })
}

export default app
