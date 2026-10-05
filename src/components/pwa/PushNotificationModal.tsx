import React, { useState, useEffect } from 'react'
import {
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  CreditCard,
  Building2,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { pwaService } from '@/services/pwaService'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

interface PushNotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

export const PushNotificationModal: React.FC<PushNotificationModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useToastStore()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [prefs, setPrefs] = useState({
    appointments: true,
    queue: true,
    payments: true,
    business: true,
  })

  useEffect(() => {
    if (isOpen) {
      pwaService.getNotificationPermission().then(setPermission)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleRequestPermission = async () => {
    const res = await pwaService.requestNotificationPermission()
    setPermission(res)
    if (res === 'granted') {
      addToast({
        title: 'Push Notifications Enabled',
        message: 'Salora will now alert you for bookings, queue updates, and payments.',
        type: 'success',
      })
    } else {
      addToast({
        title: 'Permission Denied',
        message: 'Notification permission was denied. You can re-enable it in browser settings.',
        type: 'warning',
      })
    }
  }

  const handleTestNotification = async (type: 'appointment' | 'queue' | 'payment' | 'business') => {
    if (type === 'appointment') {
      await pwaService.sendAppointmentReminder('Priya Sharma', 'Velvet Hair Spa & Blowdry', '04:30 PM')
      addToast({ title: 'Appointment Reminder Sent', message: 'Test notification triggered.', type: 'info' })
    } else if (type === 'queue') {
      await pwaService.sendQueueAlert('A-01', 'Priya Sharma', 'Stylist Suite 2')
      addToast({ title: 'Queue Alert Sent', message: 'Test notification triggered.', type: 'info' })
    } else if (type === 'payment') {
      await pwaService.sendPaymentNotification('INV-2026-081', '₹2,950', 'UPI')
      addToast({ title: 'Payment Alert Sent', message: 'Test notification triggered.', type: 'info' })
    } else {
      await pwaService.sendBusinessAlert('Daily Closing Milestone', 'Today\'s salon revenue reached ₹48,200 across 16 appointments.')
      addToast({ title: 'Business Alert Sent', message: 'Test notification triggered.', type: 'info' })
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="push-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900 z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="push-modal-title" className="text-base font-bold text-gray-900 dark:text-white">
                Push Notification Settings
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Configure real-time device alerts for appointments, queue tokens, and payments.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close push notification modal"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Permission Status Box */}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-800 dark:bg-gray-800/50">
          <div>
            <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              Browser Notification Permission:
            </div>
            <div className="text-[11px] text-gray-500 capitalize mt-0.5">
              Current state: <strong className="text-gray-700 dark:text-gray-300">{permission}</strong>
            </div>
          </div>

          {permission === 'granted' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Active
            </span>
          ) : (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Allow Notifications</span>
            </button>
          )}
        </div>

        {/* Channel Categories */}
        <div className="mt-5 space-y-3">
          <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
            Alert Channels &amp; Test Triggers
          </span>

          {/* 1. Appointment Reminders */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Clock className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Appointment Reminders</h3>
                <p className="text-[11px] text-gray-500">24-hour and 2-hour ahead client booking reminders</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleTestNotification('appointment')}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
            >
              <Send className="h-3 w-3" aria-hidden="true" />
              <span>Test</span>
            </button>
          </div>

          {/* 2. Queue Alerts */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                <Layers className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Queue &amp; Token Alerts</h3>
                <p className="text-[11px] text-gray-500">Instant ping when customer's token is called to station</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleTestNotification('queue')}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
            >
              <Send className="h-3 w-3" aria-hidden="true" />
              <span>Test</span>
            </button>
          </div>

          {/* 3. Payment Notifications */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Payment Notifications</h3>
                <p className="text-[11px] text-gray-500">Instant confirmation of UPI QR and card payments</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleTestNotification('payment')}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
            >
              <Send className="h-3 w-3" aria-hidden="true" />
              <span>Test</span>
            </button>
          </div>

          {/* 4. Business Alerts */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Business &amp; Daily Closing</h3>
                <p className="text-[11px] text-gray-500">End-of-day revenue reconciliation &amp; low stock alerts</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleTestNotification('business')}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
            >
              <Send className="h-3 w-3" aria-hidden="true" />
              <span>Test</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
