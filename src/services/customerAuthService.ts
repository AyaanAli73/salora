import { CustomerUser, Client } from '@/types'
import { useCustomerAuthStore, DEFAULT_CUSTOMER } from '@/store/useCustomerAuthStore'
import { clientService } from '@/services/clientService'
import { auditLogService } from '@/services/auditLogService'
import { useToastStore } from '@/store/useToastStore'

export interface CustomerRegisterParams {
  firstName: string
  lastName: string
  phone: string
  email: string
  password: string
  confirmPassword: string
  dateOfBirth?: string
  gender?: 'female' | 'male' | 'non-binary' | 'prefer-not-to-say'
  avatarUrl?: string
  acceptTerms: boolean
}

export const customerAuthService = {
  async login(
    phoneOrEmail: string,
    password?: string,
    rememberMe: boolean = true
  ): Promise<CustomerUser> {
    await new Promise((res) => setTimeout(res, 350))

    const cleanInput = phoneOrEmail.trim().toLowerCase()

    // Retrieve all clients from salon clientService
    const clients = await clientService.getAll()
    const matchingClient = clients.find(
      (c) =>
        c.email.toLowerCase() === cleanInput ||
        c.phone.replace(/\D/g, '') === cleanInput.replace(/\D/g, '')
    )

    let customerUser: CustomerUser

    if (matchingClient) {
      customerUser = {
        id: matchingClient.id,
        firstName: matchingClient.firstName,
        lastName: matchingClient.lastName,
        fullName: matchingClient.fullName,
        email: matchingClient.email,
        phone: matchingClient.phone,
        avatarUrl: matchingClient.avatarUrl,
        gender: matchingClient.gender,
        dateOfBirth: matchingClient.dateOfBirth || matchingClient.birthday,
        address: matchingClient.address,
        rewardPoints: 1250,
        membershipTier: matchingClient.isVip ? 'Gold' : 'Silver',
        membershipExpiry: '2027-06-30',
        totalVisits: matchingClient.totalVisits || 1,
        totalSpent: matchingClient.totalSpent || 500,
        preferredStaffId: matchingClient.preferredStaffId,
        preferredServices: [matchingClient.favoriteService || 'Hair Spa Ritual'],
        communicationPrefs: {
          email: true,
          sms: true,
          whatsapp: true,
        },
        createdAt: matchingClient.createdAt || new Date().toISOString(),
      }
    } else {
      // Fallback to default demo user Priya Sharma
      customerUser = {
        ...DEFAULT_CUSTOMER,
        email: cleanInput.includes('@') ? cleanInput : DEFAULT_CUSTOMER.email,
        phone: !cleanInput.includes('@') ? phoneOrEmail : DEFAULT_CUSTOMER.phone,
      }
    }

    useCustomerAuthStore.getState().setCustomer(customerUser)

    auditLogService.log({
      action: 'LOGIN',
      entityType: 'auth',
      entityId: customerUser.id,
      performedBy: customerUser.fullName,
      userRole: 'customer',
      details: `Customer ${customerUser.fullName} logged into self-service portal.`,
    })

    useToastStore.getState().addToast({
      title: 'Welcome Back',
      message: `Signed in as ${customerUser.fullName}.`,
      type: 'success',
    })

    return customerUser
  },

  async register(params: CustomerRegisterParams): Promise<CustomerUser> {
    await new Promise((res) => setTimeout(res, 450))

    if (!params.firstName.trim() || !params.lastName.trim()) {
      throw new Error('Please enter your full first and last name.')
    }
    if (!params.email.trim() || !params.email.includes('@')) {
      throw new Error('Please provide a valid email address.')
    }
    if (!params.phone.trim() || params.phone.length < 10) {
      throw new Error('Please provide a valid 10-digit mobile phone number.')
    }
    if (params.password !== params.confirmPassword) {
      throw new Error('Passwords do not match.')
    }
    if (!params.acceptTerms) {
      throw new Error('Please accept the Terms of Service and Privacy Policy.')
    }

    const fullName = `${params.firstName.trim()} ${params.lastName.trim()}`
    const clientId = `cli-portal-${Date.now()}`

    // 1. Synchronize into salon client database so reception sees the new client!
    try {
      await clientService.create({
        firstName: params.firstName.trim(),
        lastName: params.lastName.trim(),
        fullName,
        email: params.email.trim().toLowerCase(),
        phone: params.phone.trim(),
        gender: params.gender || 'female',
        dateOfBirth: params.dateOfBirth,
        avatarUrl: params.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        tags: ['Customer Portal User', 'Online Registered'],
        status: 'active',
        totalVisits: 0,
        totalSpent: 0,
        favoriteService: 'Hair Spa Ritual',
        isVip: false,
      })
    } catch (err) {
      console.warn('Could not mirror client to admin table:', err)
    }

    // 2. Create customer portal user model
    const newCustomer: CustomerUser = {
      id: clientId,
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      fullName,
      email: params.email.trim().toLowerCase(),
      phone: params.phone.trim(),
      gender: params.gender,
      dateOfBirth: params.dateOfBirth,
      avatarUrl: params.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      rewardPoints: 200, // 200 welcome bonus reward points
      membershipTier: 'Standard',
      totalVisits: 0,
      totalSpent: 0,
      preferredServices: [],
      communicationPrefs: {
        email: true,
        sms: true,
        whatsapp: true,
      },
      createdAt: new Date().toISOString(),
    }

    useCustomerAuthStore.getState().setCustomer(newCustomer)

    auditLogService.log({
      action: 'LOGIN',
      entityType: 'auth',
      entityId: newCustomer.id,
      performedBy: newCustomer.fullName,
      userRole: 'customer',
      details: `New customer registered: ${newCustomer.fullName} (${newCustomer.phone}). Awarded 200 welcome points.`,
    })

    useToastStore.getState().addToast({
      title: 'Registration Complete',
      message: `Welcome to SALORA, ${newCustomer.firstName}! 200 welcome points have been added to your balance.`,
      type: 'success',
      duration: 5000,
    })

    return newCustomer
  },

  async forgotPassword(emailOrPhone: string): Promise<{ success: boolean; message: string }> {
    await new Promise((res) => setTimeout(res, 400))
    return {
      success: true,
      message: `A password reset link and verification code have been dispatched to ${emailOrPhone}.`,
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    await new Promise((res) => setTimeout(res, 350))
    useToastStore.getState().addToast({
      title: 'Password Updated',
      message: 'Your account password has been changed successfully.',
      type: 'success',
    })
    return true
  },

  logout(): void {
    const current = useCustomerAuthStore.getState().customer
    if (current) {
      auditLogService.log({
        action: 'LOGOUT',
        entityType: 'auth',
        entityId: current.id,
        performedBy: current.fullName,
        userRole: 'customer',
        details: `Customer ${current.fullName} signed out of self-service portal.`,
      })
    }
    useCustomerAuthStore.getState().logout()
    useToastStore.getState().addToast({
      title: 'Logged Out',
      message: 'You have been safely signed out.',
      type: 'info',
    })
  },
}
