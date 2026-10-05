import React from 'react'
import { AppointmentStatus } from '@/types'
import {
  Clock,
  CheckCircle2,
  PlayCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  UserCheck,
} from 'lucide-react'

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus
  className?: string
  size?: 'sm' | 'md'
  tokenNumber?: string
}

export const AppointmentStatusBadge: React.FC<AppointmentStatusBadgeProps> = ({
  status,
  className = '',
  size = 'md',
  tokenNumber,
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'

  switch (status) {
    case 'requested':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 ${sizeClasses} ${className}`}
        >
          <HelpCircle className="h-3 w-3" />
          Requested
        </span>
      )

    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 ${sizeClasses} ${className}`}
        >
          <Clock className="h-3 w-3" />
          Pending
        </span>
      )

    case 'confirmed':
    case 'scheduled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 ${sizeClasses} ${className}`}
        >
          <CheckCircle2 className="h-3 w-3" />
          Confirmed
        </span>
      )

    case 'checked-in':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-cyan-50 text-cyan-800 border border-cyan-300 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-700 ${sizeClasses} ${className}`}
        >
          <UserCheck className="h-3 w-3 text-cyan-600" />
          {tokenNumber ? `Token ${tokenNumber}` : 'Checked In'}
        </span>
      )

    case 'called':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/30 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
          Now Serving
        </span>
      )

    case 'in-progress':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
          In Service
        </span>
      )

    case 'completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700 ${sizeClasses} ${className}`}
        >
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </span>
      )

    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 ${sizeClasses} ${className}`}
        >
          <XCircle className="h-3 w-3" />
          Cancelled
        </span>
      )

    case 'no-show':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 ${sizeClasses} ${className}`}
        >
          <AlertCircle className="h-3 w-3" />
          No Show
        </span>
      )

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-surface-subtle text-text-secondary border border-border ${sizeClasses} ${className}`}
        >
          {status}
        </span>
      )
  }
}
