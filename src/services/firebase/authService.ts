import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser,
  AuthError,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '@/lib/firebase'
import { firestoreService, SALORA_COLLECTIONS } from './firestoreService'
import { User, Role, RegisterData } from '@/types'

/**
 * Salora Salon Authentication Service
 * Secure Firebase Authentication using Email & Password.
 * Single-salon, single-owner architecture.
 */

export interface AuthResponse {
  user: User
  token: string
  isOnboarded: boolean
}

export interface SetupOwnerData {
  ownerName: string
  email: string
  password: string
  salonName?: string
  salonPhone?: string
  salonAddress?: string
  username?: string
}

/**
 * Translates Firebase Auth error codes into helpful, secure user messages
 */
export const translateFirebaseAuthError = (err: unknown): string => {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as AuthError).code
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect email or password. Please verify your credentials and try again.'
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists. Please sign in instead.'
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.'
      case 'auth/too-many-requests':
        return 'Access temporarily disabled due to multiple failed login attempts. Please reset your password or try again in a few minutes.'
      case 'auth/network-request-failed':
        return 'Network connection failed. Please check your internet connection.'
      case 'auth/requires-recent-login':
        return 'This operation is sensitive. Please sign out and sign in again before proceeding.'
      default:
        break
    }
  }
  return err instanceof Error ? err.message : 'An authentication error occurred. Please try again.'
}

export const firebaseAuthService = {
  /**
   * Secure Email + Password Sign-In
   */
  async login(emailOrUsername: string, password: string): Promise<AuthResponse> {
    const rawInput = emailOrUsername.trim()
    if (!rawInput) {
      throw new Error('Please enter your email address.')
    }
    if (!password) {
      throw new Error('Please enter your password.')
    }

    if (!isFirebaseConfigured) {
      throw new Error('Firebase authentication is not configured.')
    }

    // Auto-normalize if user typed pure username without domain
    const email = rawInput.includes('@') ? rawInput.toLowerCase() : `${rawInput.toLowerCase()}@salora.local`

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const fbUser = userCredential.user
      const idToken = await fbUser.getIdToken()

      // Retrieve or provision user profile from Firestore
      let profile = await firestoreService.get<User>(SALORA_COLLECTIONS.USERS, fbUser.uid)
      if (!profile) {
        const username = email.split('@')[0]
        profile = {
          id: fbUser.uid,
          name: fbUser.displayName || username,
          username,
          email,
          role: 'owner',
          salonId: 'main',
        }
        await firestoreService.set(SALORA_COLLECTIONS.USERS, fbUser.uid, profile).catch(() => {})
      }

      return {
        user: profile,
        token: idToken,
        isOnboarded: true,
      }
    } catch (err: unknown) {
      console.error('[firebaseAuthService.login] Error:', err)
      throw new Error(translateFirebaseAuthError(err))
    }
  },

  /**
   * Register a new Salon Owner using Firebase Email & Password
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const trimmedEmail = data.email.trim().toLowerCase()
    const trimmedName = data.fullName.trim()

    if (!trimmedEmail) throw new Error('Please enter your business email.')
    if (!data.password || data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.')
    }

    if (!isFirebaseConfigured) {
      throw new Error('Firebase authentication is not configured.')
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, data.password)
      const fbUser = userCredential.user
      const idToken = await fbUser.getIdToken()

      if (trimmedName) {
        await updateProfile(fbUser, { displayName: trimmedName }).catch(() => {})
      }

      const role: Role = data.role || 'owner'
      const username = trimmedEmail.split('@')[0]
      const userProfile: User = {
        id: fbUser.uid,
        name: trimmedName || username,
        username,
        email: trimmedEmail,
        phone: data.phone || '',
        role,
        salonId: 'main',
      }

      // Persist profile to Firestore
      await firestoreService.set(SALORA_COLLECTIONS.USERS, fbUser.uid, userProfile)

      // Initialize primary salon record in Firestore
      const salonPayload = {
        id: 'main',
        name: data.salonName || 'Salora Luxe Salon',
        ownerName: trimmedName || 'Salon Owner',
        phone: data.phone || '',
        email: trimmedEmail,
        address: data.salonAddress || '',
        city: '',
        state: '',
        pincode: '',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        businessHours: {
          open: '09:00',
          close: '20:00',
        },
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        bookingSettings: {
          slotDurationMinutes: 30,
          bufferTimeMinutes: 5,
          minAdvanceBookingHours: 1,
          maxAdvanceBookingDays: 30,
          allowCancellationHours: 2,
          allowOnlineBooking: true,
          autoConfirmAppointments: false,
          requireDeposit: false,
          depositAmount: 0,
        },
        printingSettings: {
          paperSize: '80mm',
          autoPrintReceipt: false,
          headerText: data.salonName || 'Salora Luxe Salon',
          footerText: 'Thank you for visiting!',
          showLogo: true,
          showGstNumber: true,
          showStylistName: true,
          showPaymentMethod: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await firestoreService.set(SALORA_COLLECTIONS.SALON, 'main', salonPayload)

      // Sync owner/main
      await firestoreService.set(SALORA_COLLECTIONS.OWNER, 'main', {
        id: 'main',
        uid: fbUser.uid,
        name: trimmedName,
        email: trimmedEmail,
        phone: data.phone || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      return {
        user: userProfile,
        token: idToken,
        isOnboarded: true,
      }
    } catch (err: unknown) {
      console.error('[firebaseAuthService.register] Error:', err)
      throw new Error(translateFirebaseAuthError(err))
    }
  },

  /**
   * First-Run Initial Salon & Owner Setup
   */
  async setupInitialOwner(data: SetupOwnerData): Promise<AuthResponse> {
    const email = data.email?.trim().toLowerCase() || `${(data.username || 'owner').toLowerCase().trim()}@salora.local`
    return this.register({
      fullName: data.ownerName,
      email,
      phone: data.salonPhone || '',
      password: data.password,
      salonName: data.salonName || 'Salora Luxe Salon',
      salonAddress: data.salonAddress || '',
      role: 'owner',
    })
  },

  /**
   * Check if salon database requires initial owner creation
   */
  async checkFirstRunStatus(): Promise<boolean> {
    if (!isFirebaseConfigured) return false
    try {
      const salonDoc = await firestoreService.get<{ name?: string }>(SALORA_COLLECTIONS.SALON, 'main')
      if (!salonDoc || !salonDoc.name) {
        return true
      }
      return false
    } catch (err) {
      console.warn('[checkFirstRunStatus] Firestore check error:', err)
      return false
    }
  },

  /**
   * Send Password Reset Email via Firebase Auth
   */
  async sendPasswordReset(email: string): Promise<void> {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      throw new Error('Please enter your registered email address.')
    }
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured.')
    }
    try {
      await sendPasswordResetEmail(auth, trimmed)
    } catch (err) {
      console.error('[firebaseAuthService.sendPasswordReset] Error:', err)
      throw new Error(translateFirebaseAuthError(err))
    }
  },

  /**
   * Update Owner Password via Firebase Auth
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser
    if (!user || !user.email) {
      throw new Error('No user is currently authenticated on this terminal.')
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.')
    }
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
    } catch (err) {
      console.error('[firebaseAuthService.changePassword] Error:', err)
      throw new Error(translateFirebaseAuthError(err))
    }
  },

  /**
   * Sign Out Current User
   */
  async logout(): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        await firebaseSignOut(auth)
      } catch (err) {
        console.warn('[AuthService:logout] Error signing out from Firebase:', err)
      }
    }
  },

  async signOut(): Promise<void> {
    return this.logout()
  },

  /**
   * Listen to Firebase Auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!isFirebaseConfigured) {
      return () => {}
    }

    return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        callback(null)
        return
      }

      try {
        let profile = await firestoreService.get<User>(SALORA_COLLECTIONS.USERS, fbUser.uid)
        if (!profile) {
          const username = fbUser.email?.split('@')[0] || 'owner'
          profile = {
            id: fbUser.uid,
            name: fbUser.displayName || username,
            username,
            email: fbUser.email || '',
            role: 'owner',
            salonId: 'main',
          }
          await firestoreService.set(SALORA_COLLECTIONS.USERS, fbUser.uid, profile).catch(() => {})
        }
        callback(profile)
      } catch (err) {
        console.error('[AuthService:onAuthStateChanged] Profile fetch error:', err)
        callback({
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Salon Owner',
          username: fbUser.email?.split('@')[0] || 'owner',
          email: fbUser.email || '',
          role: 'owner',
          salonId: 'main',
        })
      }
    })
  },
}
