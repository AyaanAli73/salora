import React from 'react'
import { Client, Service, Staff, BookingSource } from '@/types'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { formatTime12Hour } from '@/utils/availability'
import {
  Calendar,
  Clock,
  User,
  Scissors,
  UserCheck,
  Ticket,
  Sparkles,
} from 'lucide-react'

interface AppointmentSummaryProps {
  client: Client | null
  service: Service | null
  staff: Staff | null
  staffId: string // 'any' | staff.id
  date: string
  time: string
  duration: number
  price: number
  bookingSource: BookingSource
  generateToken: boolean
  onToggleGenerateToken?: (val: boolean) => void
  isSubmitting: boolean
  onBook: () => void
  className?: string
}

export const AppointmentSummary: React.FC<AppointmentSummaryProps> = ({
  client,
  service,
  staff,
  staffId,
  date,
  time,
  duration,
  price,
  bookingSource,
  generateToken,
  onToggleGenerateToken,
  isSubmitting,
  onBook,
  className = '',
}) => {
  const isToday = date === new Date().toISOString().split('T')[0]
  const dateLabel = isToday ? 'Today' : formatDate(date)
  const timeLabel = time ? formatTime12Hour(time) : 'Select Time'

  const staffDisplayName =
    staffId === 'any' ? 'Any Available' : staff ? staff.name : 'Select Staff'

  const canBook = Boolean(client && service && time && !isSubmitting)

  return (
    <div
      className={`p-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-surface to-primary/[0.03] shadow-md space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Booking Summary
        </h3>
        <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
          Source: {bookingSource}
        </span>
      </div>

      {/* Grid of Key Info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        {/* Client */}
        <div className="space-y-0.5 min-w-0">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1">
            <User className="h-3 w-3" />
            Client:
          </p>
          <p className="font-bold text-text-primary truncate">
            {client ? client.fullName : <span className="text-text-muted font-normal">Pending</span>}
          </p>
          {client && (
            <p className="text-[10px] font-mono text-text-muted truncate">{client.phone}</p>
          )}
        </div>

        {/* Service */}
        <div className="space-y-0.5 min-w-0">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1">
            <Scissors className="h-3 w-3" />
            Service:
          </p>
          <p className="font-bold text-text-primary truncate">
            {service ? service.name : <span className="text-text-muted font-normal">Pending</span>}
          </p>
          {service && (
            <p className="text-[10px] text-text-muted">
              {service.categoryName || service.category || 'Treatment'}
            </p>
          )}
        </div>

        {/* Staff */}
        <div className="space-y-0.5 min-w-0">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1">
            <UserCheck className="h-3 w-3" />
            Staff:
          </p>
          <p className="font-bold text-text-primary truncate">{staffDisplayName}</p>
        </div>

        {/* Date & Time */}
        <div className="space-y-0.5 min-w-0">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {dateLabel}:
          </p>
          <p className="font-bold text-text-primary font-mono tabular-nums">{timeLabel}</p>
        </div>

        {/* Duration */}
        <div className="space-y-0.5 min-w-0">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Duration:
          </p>
          <p className="font-bold text-text-primary font-mono tabular-nums">{duration} min</p>
        </div>

        {/* Price */}
        <div className="space-y-0.5 min-w-0">
          <p className="text-[11px] font-medium text-text-muted">Price:</p>
          <p className="text-base font-extrabold text-primary tabular-nums">
            {formatCurrency(price, 'INR')}
          </p>
        </div>
      </div>

      {/* Walk-in Live Queue Token Option (Phase 2 token functionality) */}
      {(bookingSource === 'WALK_IN' || isToday) && onToggleGenerateToken && (
        <div className="pt-2 border-t border-border/80 flex items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={generateToken}
              onChange={(e) => onToggleGenerateToken(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus-visible:ring-primary"
            />
            <span className="text-text-secondary flex items-center gap-1.5 font-medium">
              <Ticket className="h-3.5 w-3.5 text-primary" />
              Issue live queue check-in token upon booking
            </span>
          </label>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="pt-1">
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={!canBook}
          isLoading={isSubmitting}
          onClick={onBook}
          className="w-full h-12 text-sm font-bold shadow-glow-primary/40 active:scale-99 transition-colors"
        >
          Book Appointment
        </Button>
      </div>
    </div>
  )
}
