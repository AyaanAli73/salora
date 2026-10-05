import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Calendar,
  Clock,
  Sparkles,
  Receipt,
  Award,
  Tag,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react'
import { useCustomerNotificationStore } from '@/store/useCustomerNotificationStore'
import { CustomerNotification, CustomerNotificationType } from '@/types'
import { formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export const CustomerNotificationDropdown: React.FC = () => {
  const navigate = useNavigate()
  const { notifications, markAsRead, markAllAsRead, removeNotification } =
    useCustomerNotificationStore()

  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getIcon = (type: CustomerNotificationType) => {
    switch (type) {
      case 'APPOINTMENT':
      case 'REMINDER':
        return <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />
      case 'REWARDS':
        return <Award className="h-4 w-4 text-amber-500" aria-hidden="true" />
      case 'OFFER':
        return <Tag className="h-4 w-4 text-rose-500" aria-hidden="true" />
      case 'PAYMENT':
        return <Receipt className="h-4 w-4 text-emerald-500" aria-hidden="true" />
      default:
        return <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
    }
  }

  const handleNotificationClick = (notif: CustomerNotification) => {
    markAsRead(notif.id)
    if (notif.actionUrl) {
      navigate(notif.actionUrl)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Customer notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        className={cn(
          'relative h-9 w-9 flex items-center justify-center rounded-xl border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isOpen && 'border-primary ring-2 ring-primary/20 text-primary'
        )}
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Customer Notifications"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-surface shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-border bg-surface-subtle/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                My Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-primary hover:underline focus-visible:outline-none"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="divide-y divide-border/50 overflow-y-auto overscroll-contain flex-1 max-h-[360px]">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center flex flex-col items-center justify-center text-text-muted">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2 stroke-[1.5]" aria-hidden="true" />
                <p className="text-xs font-semibold text-text-primary">All caught up!</p>
                <p className="text-[11px] text-text-muted mt-0.5">No new alerts or reminders.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    'p-3 flex items-start gap-3 transition-colors cursor-pointer group hover:bg-surface-subtle relative',
                    !notif.read ? 'bg-primary-50/40 dark:bg-primary-950/20' : 'opacity-85'
                  )}
                >
                  {!notif.read && (
                    <span className="absolute left-1.5 top-4 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                  <div className="h-8 w-8 rounded-xl bg-surface border border-border/80 flex items-center justify-center shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <p className={cn('text-xs truncate', !notif.read ? 'font-bold text-text-primary' : 'font-medium text-text-secondary')}>
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-text-muted mt-1 block font-mono">
                      {formatDate(notif.createdAt, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeNotification(notif.id)
                    }}
                    aria-label="Dismiss notification"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-text-muted hover:text-text-primary transition-opacity"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
