import { User, Role, LoginCredentials, RegisterData } from '@/types'

export interface MockAuthAccount {
  user: User
  password: string
  isOnboarded: boolean
}

const MOCK_ACCOUNTS: MockAuthAccount[] = [
  {
    user: {
      id: 'usr-owner-1',
      name: 'Ayaan',
      email: 'ayaan@salora.in',
      role: 'owner',
      phone: '(310) 555-0199',
      salonId: 'salon-1',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    },
    password: 'password123',
    isOnboarded: true,
  },
  {
    user: {
      id: 'usr-admin-2',
      name: 'Jordan Hayes',
      email: 'admin@salora.in',
      role: 'admin',
      phone: '(310) 555-0144',
      salonId: 'salon-1',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    password: 'password123',
    isOnboarded: true,
  },
  {
    user: {
      id: 'usr-manager-3',
      name: 'Marcus Thorne',
      email: 'manager@salora.in',
      role: 'manager',
      phone: '(310) 555-4422',
      salonId: 'salon-1',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    password: 'password123',
    isOnboarded: true,
  },
  {
    user: {
      id: 'usr-reception-4',
      name: 'Hannah Lee',
      email: 'reception@salora.in',
      role: 'receptionist',
      phone: '(310) 555-7711',
      salonId: 'salon-1',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
    password: 'password123',
    isOnboarded: true,
  },
  {
    user: {
      id: 'usr-staff-5',
      name: 'Camille Dupré',
      email: 'staff@salora.in',
      role: 'staff',
      phone: '(310) 555-3211',
      salonId: 'salon-1',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
    password: 'password123',
    isOnboarded: true,
  },
]

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string; isOnboarded: boolean }> {
    await new Promise((res) => setTimeout(res, 350)) // realistic API latency

    const targetInput = (credentials.username || credentials.emailOrPhone || '').toLowerCase().trim()
    const account = MOCK_ACCOUNTS.find(
      (acc) =>
        acc.user.email.toLowerCase() === targetInput ||
        acc.user.phone?.replace(/\D/g, '') === targetInput.replace(/\D/g, '')
    )

    if (!account) {
      // For developer convenience & demo testing: if they type any email with 'password123', allow or fail accurately
      if (credentials.password !== 'password123') {
        throw new Error('Invalid email or password. (Hint: Use password123)')
      }
      // Create guest user
      const customUser: User = {
        id: `usr-${Date.now()}`,
        name: targetInput.split('@')[0] || 'Salon Professional',
        email: targetInput,
        role: 'owner',
        salonId: 'salon-1',
      }
      return {
        user: customUser,
        token: `salora_jwt_${Date.now()}`,
        isOnboarded: true,
      }
    }

    if (account.password !== credentials.password) {
      throw new Error('Incorrect password. Please try again or reset your password.')
    }

    return {
      user: account.user,
      token: `salora_jwt_${account.user.id}_${Date.now()}`,
      isOnboarded: account.isOnboarded,
    }
  },

  async register(data: RegisterData): Promise<{ user: User; token: string; isOnboarded: boolean }> {
    await new Promise((res) => setTimeout(res, 400))

    const existing = MOCK_ACCOUNTS.find((acc) => acc.user.email.toLowerCase() === data.email.toLowerCase())
    if (existing) {
      throw new Error('An account with this email address already exists.')
    }

    const newUser: User = {
      id: `usr-reg-${Date.now()}`,
      name: data.fullName,
      email: data.email,
      phone: data.phone,
      role: data.role || 'owner',
      salonId: `salon-${Date.now()}`,
    }

    const newAccount: MockAuthAccount = {
      user: newUser,
      password: data.password,
      isOnboarded: false, // Newly registered users start in the multi-step onboarding wizard!
    }

    MOCK_ACCOUNTS.push(newAccount)

    return {
      user: newUser,
      token: `salora_jwt_${newUser.id}_${Date.now()}`,
      isOnboarded: false,
    }
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    await new Promise((res) => setTimeout(res, 300))
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.')
    }
    return {
      success: true,
      message: `A secure password reset link has been dispatched to ${email}.`,
    }
  },

  async resetPassword(token: string, newPass: string): Promise<{ success: boolean }> {
    await new Promise((res) => setTimeout(res, 300))
    if (!token) throw new Error('Invalid or expired reset token.')
    if (newPass.length < 6) throw new Error('Password must be at least 6 characters.')
    return { success: true }
  },

  getDemoAccounts(): { email: string; role: Role; label: string; name: string; avatarUrl?: string }[] {
    return MOCK_ACCOUNTS.map((acc) => ({
      email: acc.user.email,
      role: acc.user.role,
      label: acc.user.role.toUpperCase(),
      name: acc.user.name,
      avatarUrl: acc.user.avatarUrl,
    }))
  },
}
