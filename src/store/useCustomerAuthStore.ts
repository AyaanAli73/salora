import { create } from 'zustand'
import { CustomerUser } from '@/types'

const CUSTOMER_SESSION_KEY = 'SALORA_customer_session_v1'

export const DEFAULT_CUSTOMER: CustomerUser = {
  id: 'cli-priya',
  firstName: 'Priya',
  lastName: 'Sharma',
  fullName: 'Priya Sharma',
  email: 'priya.sharma@example.com',
  phone: '+91 98765 43210',
  avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  gender: 'female',
  dateOfBirth: '1994-08-15',
  address: 'A-304, Emerald Heights, Linking Road, Bandra West, Mumbai',
  rewardPoints: 1450,
  membershipTier: 'Gold',
  membershipExpiry: '2027-04-30',
  totalVisits: 18,
  totalSpent: 38450,
  preferredStaffId: 'staff-2',
  preferredStaffName: 'Rahul Verma',
  preferredServices: ['Hair Spa Ritual', 'Signature Scalp Detox', 'Bespoke Balayage', 'Gel Nail Art'],
  communicationPrefs: {
    email: true,
    sms: true,
    whatsapp: true,
    marketingOptIn: true,
    transactionalOptIn: true,
  },
  createdAt: '2025-02-10T10:00:00Z',
}

function getStoredCustomer(): CustomerUser | null {
  try {
    const raw = localStorage.getItem(CUSTOMER_SESSION_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed reading customer session from storage:', err)
  }
  // Default logged in as Priya Sharma for instant review & prototype testing
  localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(DEFAULT_CUSTOMER))
  return DEFAULT_CUSTOMER
}

function saveStoredCustomer(customer: CustomerUser | null): void {
  try {
    if (customer) {
      localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(customer))
    } else {
      localStorage.removeItem(CUSTOMER_SESSION_KEY)
    }
  } catch (err) {
    console.warn('Failed saving customer session:', err)
  }
}

interface CustomerAuthState {
  customer: CustomerUser | null
  isAuthenticated: boolean
  isLoading: boolean
  setCustomer: (customer: CustomerUser | null) => void
  updateProfile: (data: Partial<CustomerUser>) => void
  logout: () => void
}

export const useCustomerAuthStore = create<CustomerAuthState>((set) => ({
  customer: getStoredCustomer(),
  isAuthenticated: Boolean(getStoredCustomer()),
  isLoading: false,

  setCustomer: (customer) => {
    saveStoredCustomer(customer)
    set({ customer, isAuthenticated: Boolean(customer) })
  },

  updateProfile: (data) => {
    set((state) => {
      if (!state.customer) return state
      const updated: CustomerUser = {
        ...state.customer,
        ...data,
        fullName:
          data.firstName && data.lastName
            ? `${data.firstName} ${data.lastName}`
            : data.firstName
            ? `${data.firstName} ${state.customer.lastName}`
            : state.customer.fullName,
      }
      saveStoredCustomer(updated)
      return { customer: updated }
    })
  },

  logout: () => {
    saveStoredCustomer(null)
    set({ customer: null, isAuthenticated: false })
  },
}))
