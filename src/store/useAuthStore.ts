import { create } from 'zustand'
import { User, Role, LoginCredentials, RegisterData } from '@/types'
import { firebaseAuthService, translateFirebaseAuthError } from '@/services/firebase/authService'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isOnboarded: boolean
  isLoading: boolean
  isFirstRunChecked: boolean
  requiresOwnerSetup: boolean

  login: (credentials: LoginCredentials) => Promise<void>
  registerUser: (data: RegisterData) => Promise<void>
  setupInitialOwner: (data: {
    email: string
    password: string
    ownerName: string
    salonName?: string
    salonPhone?: string
    salonAddress?: string
    username?: string
  }) => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  checkFirstRun: () => Promise<boolean>
  logout: () => void
  switchRole: (role: Role) => void
  completeOnboarding: () => void
  updateUserProfile: (updates: Partial<User>) => void
}

const STORAGE_KEY = 'SALORA_auth_session'

const getStoredSession = (): {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isOnboarded: boolean
} => {
  if (typeof window === 'undefined') {
    return { user: null, token: null, isAuthenticated: false, isOnboarded: false }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Purge any legacy demo/mock tokens or mock users
      if (
        parsed.token === 'salora_demo_token' ||
        parsed.token === 'owner_demo_token' ||
        parsed.token?.startsWith('owner_session_') ||
        parsed.user?.username === 'ayaan' ||
        !parsed.user?.id
      ) {
        localStorage.removeItem(STORAGE_KEY)
        return { user: null, token: null, isAuthenticated: false, isOnboarded: false }
      }
      return {
        user: parsed.user || null,
        token: parsed.token || null,
        isAuthenticated: Boolean(parsed.isAuthenticated && parsed.user),
        isOnboarded: parsed.isOnboarded !== undefined ? parsed.isOnboarded : true,
      }
    }
  } catch (err) {
    console.error('Failed to parse auth session from localStorage', err)
  }
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isOnboarded: false,
  }
}

const initial = getStoredSession()

export const useAuthStore = create<AuthState>((set, get) => {
  // Real-time synchronization with Firebase Authentication state
  if (typeof window !== 'undefined') {
    try {
      firebaseAuthService.onAuthStateChanged((profile) => {
        if (profile) {
          const current = get().user
          if (!current || current.id !== profile.id || current.role !== profile.role) {
            set({
              user: profile,
              isAuthenticated: true,
              isOnboarded: true,
            })
            const session = {
              user: profile,
              token: get().token,
              isAuthenticated: true,
              isOnboarded: true,
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
          }
        } else {
          // Firebase reports signed out
          const wasAuth = get().isAuthenticated
          if (wasAuth) {
            localStorage.removeItem(STORAGE_KEY)
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            })
          }
        }
      })
    } catch (err) {
      console.warn('[useAuthStore] Firebase Auth listener error:', err)
    }
  }

  return {
    user: initial.user,
    token: initial.token,
    isAuthenticated: initial.isAuthenticated,
    isOnboarded: initial.isOnboarded,
    isLoading: false,
    isFirstRunChecked: false,
    requiresOwnerSetup: false,

    checkFirstRun: async () => {
      try {
        const needsSetup = await firebaseAuthService.checkFirstRunStatus()
        set({
          isFirstRunChecked: true,
          requiresOwnerSetup: needsSetup,
        })
        return needsSetup
      } catch (err) {
        console.warn('[useAuthStore] checkFirstRun error:', err)
        set({ isFirstRunChecked: true, requiresOwnerSetup: false })
        return false
      }
    },

    setupInitialOwner: async (data: {
      email: string
      password: string
      ownerName: string
      salonName?: string
      salonPhone?: string
      salonAddress?: string
      username?: string
    }) => {
      set({ isLoading: true })
      try {
        const res = await firebaseAuthService.setupInitialOwner(data)
        const session = {
          user: res.user,
          token: res.token,
          isAuthenticated: true,
          isOnboarded: true,
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
        }
        set({
          user: res.user,
          token: res.token,
          isAuthenticated: true,
          isOnboarded: true,
          isLoading: false,
          requiresOwnerSetup: false,
        })
      } catch (err) {
        set({ isLoading: false })
        throw err
      }
    },

    login: async (credentials: LoginCredentials) => {
      set({ isLoading: true })
      try {
        const emailOrIdentifier =
          credentials.email || credentials.username || credentials.emailOrPhone || ''
        const res = await firebaseAuthService.login(emailOrIdentifier, credentials.password)
        const session = {
          user: res.user,
          token: res.token,
          isAuthenticated: true,
          isOnboarded: res.isOnboarded,
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
        }
        set({
          user: res.user,
          token: res.token,
          isAuthenticated: true,
          isOnboarded: res.isOnboarded,
          isLoading: false,
        })
      } catch (err) {
        set({ isLoading: false })
        throw err
      }
    },

    registerUser: async (data: RegisterData) => {
      set({ isLoading: true })
      try {
        const res = await firebaseAuthService.register(data)
        const session = {
          user: res.user,
          token: res.token,
          isAuthenticated: true,
          isOnboarded: true,
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
        }
        set({
          user: res.user,
          token: res.token,
          isAuthenticated: true,
          isOnboarded: true,
          isLoading: false,
        })
      } catch (err) {
        set({ isLoading: false })
        throw err
      }
    },

    sendPasswordReset: async (email: string) => {
      set({ isLoading: true })
      try {
        await firebaseAuthService.sendPasswordReset(email)
      } finally {
        set({ isLoading: false })
      }
    },

    logout: () => {
      firebaseAuthService.logout().catch(() => {})
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isOnboarded: false,
      })
    },

    switchRole: (role: Role) => {
      const currentUser = get().user
      if (!currentUser) return
      const updatedUser: User = {
        ...currentUser,
        role,
      }
      const session = {
        user: updatedUser,
        token: get().token,
        isAuthenticated: true,
        isOnboarded: get().isOnboarded,
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      }
      set({ user: updatedUser })
    },

    completeOnboarding: () => {
      const currentUser = get().user
      const session = {
        user: currentUser,
        token: get().token,
        isAuthenticated: true,
        isOnboarded: true,
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      }
      set({ isOnboarded: true })
    },

    updateUserProfile: (updates: Partial<User>) => {
      const current = get().user
      if (!current) return
      const updated = { ...current, ...updates }
      const session = {
        user: updated,
        token: get().token,
        isAuthenticated: get().isAuthenticated,
        isOnboarded: get().isOnboarded,
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      }
      set({ user: updated })
    },
  }
})

export const useAuth = () => {
  const store = useAuthStore()
  return {
    ...store,
    isOwner: store.user?.role === 'owner',
    isAdmin: store.user?.role === 'admin' || store.user?.role === 'owner',
    isManager:
      store.user?.role === 'manager' ||
      store.user?.role === 'admin' ||
      store.user?.role === 'owner',
    isReceptionist: store.user?.role === 'receptionist',
    isStaff: store.user?.role === 'staff' || store.user?.role === 'stylist',
  }
}

// Automatically verify first-run initialization against Cloud Firestore on startup
if (typeof window !== 'undefined') {
  useAuthStore.getState().checkFirstRun().catch(console.warn)
}
