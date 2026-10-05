import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Package,
  CreditCard,
  UserCheck,
  Calendar,
  X,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  DollarSign,
  Receipt,
  Users,
} from 'lucide-react'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Notification, NotificationType } from '@/types'
import { formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export const NotificationCenterDropdown: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    getFilteredByRole,
  } = useNotificationStore()

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'operations' | 'financial'>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter based on user's salon role
  const roleNotifications = getFilteredByRole(user?.role || 'owner')
  const unreadCount = roleNotifications.filter((n) => !n.read && !n.isRead).length

  // Filter by active tab
  const displayedNotifications = roleNotifications.filter((n) => {
    const isUnread = !n.read && !n.isRead
    if (activeTab === 'unread') return isUnread
    if (activeTab === 'operations') {
      return (
        n.type === 'APPOINTMENT' ||
        n.type === 'QUEUE' ||
        n.type === 'INVENTORY' ||
        n.type === 'SYSTEM' ||
        n.type === 'appointment' ||
        n.type === 'inventory'
      )
    }
    if (activeTab === 'financial') {
      return (
        n.type === 'PAYMENT' ||
        n.title.toLowerCase().includes('payment') ||
        n.title.toLowerCase().includes('refund') ||
        n.title.toLowerCase().includes('register')
      )
    }
    return true
  })

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getIconForType = (type: NotificationType, title: string) => {
    const t = type.toUpperCase()
    if (t === 'APPOINTMENT' || title.toLowerCase().includes('appointment')) {
      return <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />
    }
    if (t === 'QUEUE' || title.toLowerCase().includes('token') || title.toLowerCase().includes('waiting')) {
      return <Clock className="h-4 w-4 text-amber-500" aria-hidden="true" />
    }
    if (t === 'INVENTORY' || title.toLowerCase().includes('stock')) {
      return <Package className="h-4 w-4 text-orange-500" aria-hidden="true" />
    }
    if (t === 'PAYMENT' || title.toLowerCase().includes('payment')) {
      return <DollarSign className="h-4 w-4 text-emerald-500" aria-hidden="true" />
    }
    if (title.toLowerCase().includes('refund')) {
      return <Receipt className="h-4 w-4 text-rose-500" aria-hidden="true" />
    }
    if (title.toLowerCase().includes('client')) {
      return <Users className="h-4 w-4 text-indigo-500" aria-hidden="true" />
    }
    if (t === 'WARNING' || t === 'SYSTEM') {
      return <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
    }
    if (t === 'ERROR') {
      return <AlertCircle className="h-4 w-4 text-rose-500" aria-hidden="true" />
    }
    return <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
  }

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id)
    if (notif.actionUrl) {
      navigate(notif.actionUrl)
      setIsOpen(false)
    }
  }

  // Relative time helper
  const getRelativeTime = (isoString: string): string => {
    const diffMs = Date.now() - new Date(isoString).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return formatDate(isoString, { month: 'short', day: 'numeric' })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications Center, ${unreadCount} unread`}
        aria-expanded={isOpen}
        className={cn(
          'relative h-9 w-9 flex items-center justify-center rounded-xl border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isOpen && 'border-primary ring-2 ring-primary/20 text-primary'
        )}
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notification Center"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-surface shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-border bg-surface-subtle/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">
                Notifications Center
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold text-primary hover:underline focus-visible:outline-none"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close notification center"
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Role Filter Tabs */}
          <div className="px-3 pt-2.5 pb-2 flex items-center gap-1 border-b border-border/60 bg-surface">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'operations', label: 'Operations' },
              ...(user?.role === 'owner' ? [{ id: 'financial', label: 'Financial' }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all',
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List of Notifications */}
          <div className="divide-y divide-border/50 overflow-y-auto overscroll-contain flex-1 max-h-[380px]">
            {displayedNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center text-text-muted">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2 stroke-[1.5]" aria-hidden="true" />
                <p className="text-xs font-semibold text-text-primary">All caught up!</p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  No {activeTab !== 'all' ? activeTab : ''} operational alerts or pending items.
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const isUnread = !notif.read && !notif.isRead
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      'p-3 flex items-start gap-3 transition-colors cursor-pointer group hover:bg-surface-subtle relative',
                      isUnread ? 'bg-primary-50/40 dark:bg-primary-950/20' : 'bg-transparent opacity-85 hover:opacity-100'
                    )}
                  >
                    {/* Unread dot indicator */}
                    {isUnread && (
                      <span className="absolute left-1.5 top-4 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}

                    {/* Type Icon */}
                    <div
                      className={cn(
                        'h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border border-border/80',
                        isUnread ? 'bg-surface shadow-xs' : 'bg-surface-subtle'
                      )}
                    >
                      {getIconForType(notif.type, notif.title)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={cn(
                            'text-xs truncate tracking-tight',
                            isUnread ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'
                          )}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-text-muted shrink-0 tabular-nums font-mono">
                          {getRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-text-secondary mt-0.5 leading-snug line-clamp-2">
                        {notif.message}
                      </p>

                      {notif.actionUrl && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-primary group-hover:underline">
                          <span>View details</span>
                          <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNotification(notif.id)
                      }}
                      aria-label="Dismiss notification"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface transition-all"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer with Operational Quick Link */}
          <div className="p-2.5 border-t border-border bg-surface-subtle/80 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                navigate('/reports/daily-closing')
              }}
              className="text-primary font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Daily Closing Checklist &rarr;</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                navigate('/settings')
              }}
              className="text-text-muted hover:text-text-primary font-medium"
            >
              Alert Settings
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
