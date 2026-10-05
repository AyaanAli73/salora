import { httpsCallable } from 'firebase/functions'
import { functions, isFirebaseConfigured } from '@/lib/firebase'

/**
 * Salora Salon Cloud Functions Gateway
 * Handles trusted server-side executions:
 * - Username/password verification & Firebase Custom Token minting
 * - Initial Owner registration
 * - Staff credential provisioning
 * - Atomic daily token counter generation
 * - Secure data exports
 */

export interface LoginResult {
  customToken: string
  user: {
    uid: string
    username: string
    displayName: string
    role: string
    avatarUrl?: string
  }
}

export interface SetupOwnerData {
  username: string
  password: string
  ownerName: string
  salonName?: string
  salonPhone?: string
  salonAddress?: string
}

export interface CreateStaffUserData {
  name: string
  displayName?: string
  username: string
  password: string
  role: string
  active?: boolean
  phone?: string
  specialties?: string[]
}

export const functionsService = {
  /**
   * Check whether this salon instance has an owner account initialized
   */
  async checkFirstRunStatus(): Promise<{ initialized: boolean; salonName?: string }> {
    if (!isFirebaseConfigured) {
      // In unconfigured/demo mode, consider initialized
      return { initialized: true, salonName: 'Salora' }
    }

    try {
      const fn = httpsCallable<void, { initialized: boolean; salonName?: string }>(
        functions,
        'checkFirstRunStatus'
      )
      const res = await fn()
      return res.data
    } catch (err: any) {
      console.warn('[Functions:checkFirstRunStatus] Server function check:', err)
      // If function is not yet deployed or error, return fallback
      return { initialized: true }
    }
  },

  /**
   * Server-side username verification and custom token generation
   * Passwords are never stored in plaintext and never stored in Firestore.
   */
  async loginWithUsername(username: string, password: string): Promise<LoginResult> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Please supply environment variables in .env.')
    }

    try {
      const fn = httpsCallable<{ username: string; password: string }, LoginResult>(
        functions,
        'loginWithUsername'
      )
      const res = await fn({ username, password })
      return res.data
    } catch (err: any) {
      console.error('[Functions:loginWithUsername] Authentication error:', err)
      // Provide clean user-friendly error without leaking sensitive internals
      const code = err.code || ''
      if (code.includes('not-found') || code.includes('unauthenticated') || code.includes('permission-denied')) {
        throw new Error('Invalid username or password.')
      }
      if (code.includes('resource-exhausted')) {
        throw new Error('Too many failed login attempts. Please wait a few minutes before trying again.')
      }
      throw new Error(err.message || 'Unable to authenticate. Please verify your credentials.')
    }
  },

  /**
   * First-run owner account setup
   */
  async setupInitialOwner(data: SetupOwnerData): Promise<LoginResult> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Please supply environment variables in .env.')
    }

    try {
      const fn = httpsCallable<SetupOwnerData, LoginResult>(functions, 'setupInitialOwner')
      const res = await fn(data)
      return res.data
    } catch (err: any) {
      console.error('[Functions:setupInitialOwner] Setup error:', err)
      throw new Error(err.message || 'Failed to complete initial salon owner setup.')
    }
  },

  /**
   * Admin/Owner provisioning of a new staff account
   */
  async createStaffUser(data: CreateStaffUserData): Promise<{ uid: string; username: string }> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured.')
    }

    try {
      const fn = httpsCallable<CreateStaffUserData, { uid: string; username: string }>(
        functions,
        'createStaffUser'
      )
      const res = await fn(data)
      return res.data
    } catch (err: any) {
      console.error('[Functions:createStaffUser] Provisioning error:', err)
      throw new Error(err.message || 'Failed to create staff account.')
    }
  },

  /**
   * Change staff member password or force reset
   */
  async changeStaffPassword(targetUid: string, newPassword: string): Promise<void> {
    if (!isFirebaseConfigured) return

    try {
      const fn = httpsCallable<{ targetUid: string; newPassword: string }, void>(
        functions,
        'changeStaffPassword'
      )
      await fn({ targetUid, newPassword })
    } catch (err: any) {
      console.error('[Functions:changeStaffPassword] Password update error:', err)
      throw new Error(err.message || 'Failed to update user password.')
    }
  },

  /**
   * Atomic daily token counter generation
   */
  async generateDailyToken(payload: {
    appointmentId?: string
    clientId: string
    serviceId: string
    staffId: string
    priority?: boolean
  }): Promise<{ tokenId: string; tokenNumber: string; displayId: string }> {
    if (!isFirebaseConfigured) {
      const rnd = Math.floor(Math.random() * 900) + 100
      return {
        tokenId: `token_${Date.now()}`,
        tokenNumber: `#0${rnd}`,
        displayId: `TK-${rnd}`,
      }
    }

    try {
      const fn = httpsCallable<typeof payload, { tokenId: string; tokenNumber: string; displayId: string }>(
        functions,
        'generateDailyToken'
      )
      const res = await fn(payload)
      return res.data
    } catch (err: any) {
      console.error('[Functions:generateDailyToken] Token generation error:', err)
      throw new Error(err.message || 'Failed to generate queue token.')
    }
  },

  /**
   * Export Salon Data (Owner/Admin only)
   */
  async exportSalonData(module: string): Promise<{ downloadUrl?: string; data?: any }> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured for remote data export.')
    }

    try {
      const fn = httpsCallable<{ module: string }, { downloadUrl?: string; data?: any }>(
        functions,
        'exportSalonData'
      )
      const res = await fn({ module })
      return res.data
    } catch (err: any) {
      console.error('[Functions:exportSalonData] Export error:', err)
      throw new Error(err.message || 'Failed to export salon dataset.')
    }
  },
}
