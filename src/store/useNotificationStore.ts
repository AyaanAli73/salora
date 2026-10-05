import { create } from 'zustand'
import { Notification, NotificationType, NotificationPriority, NotificationRole } from '@/types'
import { notificationService } from '@/services/notificationService'
import { useToastStore } from '@/store/useToastStore'

const NOTIFICATIONS_STORAGE_KEY = 'SALORA_notifications_store_v2'

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    type: 'APPOINTMENT',
    title: 'Appointment Starting Soon (10 min)',
    message: 'Aarav Patel — Signature Hair Spa & Scalp Detox is scheduled at 4:00 PM with Camille Dupré.',
    read: false,
    isRead: false,
    priority: 'high',
    relatedId: 'appt-102',
    targetRole: 'all',
    actionUrl: '/appointments',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'notif-002',
    type: 'QUEUE',
    title: 'Customer Waiting in Lounge',
    message: 'Token #003 (Sunita Roy) has been waiting for 22 minutes at station waiting area.',
    read: false,
    isRead: false,
    priority: 'high',
    relatedId: 'tok-003',
    targetRole: 'receptionist',
    actionUrl: '/appointments/queue',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: 'notif-003',
    type: 'INVENTORY',
    title: 'Low Stock Alert: Olaplex No. 3',
    message: 'Current stock is 4 bottles (below threshold of 8). Reorder required.',
    read: false,
    isRead: false,
    priority: 'medium',
    relatedId: 'prod-2',
    targetRole: 'manager',
    actionUrl: '/inventory/products',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: 'notif-004',
    type: 'PAYMENT',
    title: 'Payment Received: ₹1,475',
    message: 'UPI payment of ₹1,475 received from Priya Sharma for Invoice #INV-000101.',
    read: false,
    isRead: false,
    priority: 'low',
    relatedId: 'INV-000101',
    targetRole: 'owner',
    actionUrl: '/sales/billing',
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
  },
  {
    id: 'notif-005',
    type: 'WARNING',
    title: 'Payment Due Pending',
    message: 'Invoice #INV-000098 for Rohan Mehta has an outstanding balance of ₹850.',
    read: false,
    isRead: false,
    priority: 'medium',
    relatedId: 'INV-000098',
    targetRole: 'owner',
    actionUrl: '/sales/history',
    createdAt: new Date(Date.now() - 65 * 60000).toISOString(),
  },
  {
    id: 'notif-006',
    type: 'SYSTEM',
    title: 'Register Needs Closing',
    message: 'Today’s cash drawer register session has not been closed yet. Review closing checklist.',
    read: false,
    isRead: false,
    priority: 'urgent',
    relatedId: 'reg-session-today',
    targetRole: 'manager',
    actionUrl: '/sales/register',
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
  },
  {
    id: 'notif-007',
    type: 'REFUND_CREATED' as any,
    title: 'Refund Completed',
    message: 'Refund of ₹350 processed for damaged retail product return (Invoice #INV-000085).',
    read: true,
    isRead: true,
    priority: 'low',
    relatedId: 'ref-001',
    targetRole: 'owner',
    actionUrl: '/sales/history',
    createdAt: new Date(Date.now() - 150 * 60000).toISOString(),
  },
  {
    id: 'notif-008',
    type: 'INFO',
    title: 'New Client Registered',
    message: 'Dr. Meera Nambiar registered as a new client with VIP tagging.',
    read: true,
    isRead: true,
    priority: 'low',
    relatedId: 'client-105',
    targetRole: 'receptionist',
    actionUrl: '/clients',
    createdAt: new Date(Date.now() - 210 * 60000).toISOString(),
  },
  {
    id: 'notif-009',
    type: 'ERROR',
    title: 'Cancelled Appointment',
    message: 'Rajiv Sen cancelled Bridal Package appointment scheduled for 5:30 PM.',
    read: true,
    isRead: true,
    priority: 'medium',
    relatedId: 'appt-109',
    targetRole: 'receptionist',
    actionUrl: '/appointments',
    createdAt: new Date(Date.now() - 300 * 60000).toISOString(),
  },
]

function getStoredNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('Failed reading notifications from storage:', e)
  }
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS))
  return INITIAL_NOTIFICATIONS
}

function saveStoredNotifications(items: Notification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items.slice(0, 100)))
  } catch (e) {
    console.warn('Failed writing notifications to storage:', e)
  }
}

interface NotificationState {
  notifications: Notification[]
  addNotification: (
    notif: Omit<Notification, 'id' | 'createdAt' | 'read' | 'isRead'> & {
      read?: boolean
      isRead?: boolean
      showToast?: boolean
    }
  ) => Notification
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  getFilteredByRole: (role?: string) => Notification[]
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: getStoredNotifications(),

  addNotification: (params) => {
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: params.type,
      title: params.title,
      message: params.message,
      read: params.read ?? false,
      isRead: params.isRead ?? false,
      priority: params.priority || 'medium',
      relatedId: params.relatedId,
      targetRole: params.targetRole || 'all',
      actionUrl: params.actionUrl,
      createdAt: new Date().toISOString(),
    }

    set((state) => {
      const updated = [newNotif, ...state.notifications]
      saveStoredNotifications(updated)
      return { notifications: updated }
    })

    // If requested, also emit immediate toast
    if (params.showToast) {
      const toastTypeMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
        SUCCESS: 'success',
        PAYMENT: 'success',
        WARNING: 'warning',
        ERROR: 'danger',
        INVENTORY: 'warning',
        QUEUE: 'info',
        APPOINTMENT: 'info',
        SYSTEM: 'warning',
        INFO: 'info',
      }

      useToastStore.getState().addToast({
        title: params.title,
        message: params.message,
        type: toastTypeMap[params.type.toUpperCase()] || 'info',
      })
    }

    return newNotif
  },

  markAsRead: (id: string) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true, isRead: true } : n
      )
      saveStoredNotifications(updated)
      return { notifications: updated }
    })
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({
        ...n,
        read: true,
        isRead: true,
      }))
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

  getFilteredByRole: (role: string = 'owner') => {
    const list = get().notifications
    const normalizedRole = role.toLowerCase()

    // Owner has unrestricted visibility across all notifications
    if (normalizedRole === 'owner') {
      return list
    }

    // Manager sees operational, staff, queue, inventory, and appointment alerts
    if (normalizedRole === 'manager') {
      return list.filter(
        (n) =>
          n.targetRole === 'all' ||
          n.targetRole === 'manager' ||
          n.type === 'INVENTORY' ||
          n.type === 'QUEUE' ||
          n.type === 'APPOINTMENT' ||
          n.type === 'SYSTEM'
      )
    }

    // Receptionist & Stylists see appointments and queue alerts (financial strictly hidden)
    return list.filter((n) => {
      const isFinancial =
        n.type === 'PAYMENT' ||
        n.title.toLowerCase().includes('payment') ||
        n.title.toLowerCase().includes('refund') ||
        n.title.toLowerCase().includes('register') ||
        n.title.toLowerCase().includes('sales')
      if (isFinancial) return false
      return (
        n.targetRole === 'all' ||
        n.targetRole === 'receptionist' ||
        n.type === 'APPOINTMENT' ||
        n.type === 'QUEUE' ||
        n.type === 'INFO'
      )
    })
  },
}))

// Direct export matching requirement 2 "notificationStore.ts"
export { useNotificationStore as notificationStore }
