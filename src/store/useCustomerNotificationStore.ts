import { create } from 'zustand'
import { CustomerNotification, CustomerNotificationType } from '@/types'

const CUSTOMER_NOTIFS_STORAGE_KEY = 'SALORA_customer_notifications_v1'

const INITIAL_CUSTOMER_NOTIFICATIONS: CustomerNotification[] = [
  {
    id: 'cnotif-1',
    customerId: 'cli-priya',
    type: 'APPOINTMENT',
    title: 'Appointment Confirmed Today',
    message: 'Your Signature Hair Spa & Scalp Detox is confirmed for today at 5:30 PM with Rahul Verma.',
    read: false,
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    actionUrl: '/customer/appointments',
  },
  {
    id: 'cnotif-2',
    customerId: 'cli-priya',
    type: 'REMINDER',
    title: 'Treatment Reminder',
    message: 'Please arrive 10 minutes early at Styling Station 03 to enjoy complimentary detox herbal tea.',
    read: false,
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    actionUrl: '/customer/appointments',
  },
  {
    id: 'cnotif-3',
    customerId: 'cli-priya',
    type: 'REWARDS',
    title: 'Reward Points Added (+150 pts)',
    message: 'You earned 150 loyalty points from your previous visit! Your current balance is 1,450 pts.',
    read: false,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    actionUrl: '/customer/rewards',
  },
  {
    id: 'cnotif-4',
    customerId: 'cli-priya',
    type: 'OFFER',
    title: 'Exclusive Weekend Offer: 20% Off',
    message: 'Use code FESTIVE20 for 20% off all luxury Balayage and Hair Color treatments this weekend.',
    read: true,
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    actionUrl: '/customer/offers',
  },
  {
    id: 'cnotif-5',
    customerId: 'cli-priya',
    type: 'PAYMENT',
    title: 'Invoice & Payment Receipt',
    message: 'Payment of ₹1,475 received for Invoice #INV-000101. Digital receipt is ready for download.',
    read: true,
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    actionUrl: '/customer/invoices',
  },
  {
    id: 'cnotif-6',
    customerId: 'cli-priya',
    type: 'REVIEW',
    title: 'How was your experience?',
    message: 'Thank you for visiting SALORA! Please leave a review for Rahul Verma to help us serve you better.',
    read: true,
    createdAt: new Date(Date.now() - 96 * 3600000).toISOString(),
    actionUrl: '/customer/reviews',
  },
]

function getStoredNotifications(): CustomerNotification[] {
  try {
    const raw = localStorage.getItem(CUSTOMER_NOTIFS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed reading customer notifications:', err)
  }
  localStorage.setItem(CUSTOMER_NOTIFS_STORAGE_KEY, JSON.stringify(INITIAL_CUSTOMER_NOTIFICATIONS))
  return INITIAL_CUSTOMER_NOTIFICATIONS
}

function saveStoredNotifications(notifs: CustomerNotification[]): void {
  try {
    localStorage.setItem(CUSTOMER_NOTIFS_STORAGE_KEY, JSON.stringify(notifs.slice(0, 100)))
  } catch (err) {
    console.warn('Failed writing customer notifications:', err)
  }
}

interface CustomerNotificationState {
  notifications: CustomerNotification[]
  addNotification: (
    notif: Omit<CustomerNotification, 'id' | 'createdAt' | 'read'> & { read?: boolean }
  ) => CustomerNotification
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

export const useCustomerNotificationStore = create<CustomerNotificationState>((set) => ({
  notifications: getStoredNotifications(),

  addNotification: (params) => {
    const newNotif: CustomerNotification = {
      id: `cnotif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      customerId: params.customerId,
      type: params.type,
      title: params.title,
      message: params.message,
      read: params.read ?? false,
      actionUrl: params.actionUrl,
      createdAt: new Date().toISOString(),
    }
    set((state) => {
      const updated = [newNotif, ...state.notifications]
      saveStoredNotifications(updated)
      return { notifications: updated }
    })
    return newNotif
  },

  markAsRead: (id: string) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
      saveStoredNotifications(updated)
      return { notifications: updated }
    })
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }))
      saveStoredNotifications(updated)
      return { notifications: updated }
    })
  },

  removeNotification: (id: string) => {
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id)
      saveStoredNotifications(updated)
      return { notifications: updated }
    })
  },

  clearAll: () => {
    set(() => {
      saveStoredNotifications([])
      return { notifications: [] }
    })
  },
}))

// Direct export matching Requirement 10 "customerNotificationStore"
export { useCustomerNotificationStore as customerNotificationStore }
