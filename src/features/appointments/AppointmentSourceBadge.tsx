import React from 'react'
import { BookingSource } from '@/types'
import { Globe, User, Phone, Share2, Shield } from 'lucide-react'

interface AppointmentSourceBadgeProps {
  source?: BookingSource
  className?: string
  size?: 'sm' | 'md'
}

export const AppointmentSourceBadge: React.FC<AppointmentSourceBadgeProps> = ({
  source = 'ONLINE',
  className = '',
  size = 'sm',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'

  switch (source) {
    case 'ONLINE':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 ${sizeClasses} ${className}`}
        >
          <Globe className="h-2.5 w-2.5" aria-hidden="true" />
          ONLINE BOOKING
        </span>
      )
    case 'WALK_IN':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 ${sizeClasses} ${className}`}
        >
          <User className="h-2.5 w-2.5" aria-hidden="true" />
          WALK-IN
        </span>
      )
    case 'PHONE':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 ${sizeClasses} ${className}`}
        >
          <Phone className="h-2.5 w-2.5" aria-hidden="true" />
          PHONE
        </span>
      )
    case 'SOCIAL':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider bg-pink-50 text-pink-700 border border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800 ${sizeClasses} ${className}`}
        >
          <Share2 className="h-2.5 w-2.5" aria-hidden="true" />
          SOCIAL
        </span>
      )
    case 'ADMIN':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 ${sizeClasses} ${className}`}
        >
          <Shield className="h-2.5 w-2.5" aria-hidden="true" />
          ADMIN
        </span>
      )
  }
}
