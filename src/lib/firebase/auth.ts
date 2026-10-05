import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  NextOrObserver,
} from 'firebase/auth'
import { auth } from '../firebase'

/**
 * Re-export initialized Firebase Auth instance
 */
export { auth }

/**
 * Get the currently authenticated user (or null)
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser
}

/**
 * Subscribe to authentication state changes
 */
export const onAuthChange = (observer: NextOrObserver<User | null>) => {
  return onAuthStateChanged(auth, observer)
}

/**
 * Sign out the current user session
 */
export const signOutUser = async (): Promise<void> => {
  await firebaseSignOut(auth)
}

export type { User }
