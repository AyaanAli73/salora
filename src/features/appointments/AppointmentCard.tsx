import React from 'react'
import { Appointment } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { AppointmentSourceBadge } from './AppointmentSourceBadge'
import { Avatar } from '@/components/ui/Avatar'
import { Clock, User } from 'lucide-react'

interface AppointmentCardProps {
  appointment: Appointment
  onClick: (appointment: Appointment) => void
  compact?: boolean
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onClick,
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        onClick={() => onClick(appointment)}
        className="group relative p-2 rounded-lg border border-border/80 bg-surface hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all duration-150 space-y-1"
      >
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="font-bold text-text-primary tabular-nums">
            {appointment.startTime}
          </span>
          <div className="flex items-center gap-1">
            <AppointmentSourceBadge source={appointment.bookingSource || 'ONLINE'} size="sm" />
            <AppointmentStatusBadge status={appointment.status} size="sm" />
          </div>
        </div>
        <p className="text-xs font-semibold text-text-primary truncate">
          {appointment.clientName}
        </p>
        <p className="text-[10px] text-text-muted truncate">
          {appointment.serviceName}
        </p>
      </div>
    )
  }

  return (
    <div
      onClick={() => onClick(appointment)}
      className="group relative p-3.5 rounded-xl border border-border bg-surface hover:border-primary/50 hover:shadow-md cursor-pointer transition-all duration-150 space-y-2.5"
    >
      {/* Top row: Time + Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary tabular-nums">
          <Clock className="h-3.5 w-3.5 text-text-muted" />
          <span>
            {appointment.startTime} - {appointment.endTime}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <AppointmentSourceBadge source={appointment.bookingSource || 'ONLINE'} size="sm" />
          <AppointmentStatusBadge status={appointment.status} size="sm" />
        </div>
      </div>

      {/* Client Info */}
      <div className="flex items-center gap-2.5">
        <Avatar
          name={appointment.clientName}
          src={appointment.clientAvatar}
          size="sm"
        />
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-text-primary truncate group-hover:text-primary transition-colors">
            {appointment.clientName}
          </h4>
          <p className="text-[11px] text-text-muted truncate">
            {appointment.serviceName}
          </p>
        </div>
      </div>

      {/* Footer: Staff & Price */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
        <div className="flex items-center gap-1.5 text-text-muted truncate">
          <Avatar
            name={appointment.staffName}
            src={appointment.staffAvatar}
            size="xs"
          />
          <span className="text-[11px] truncate">{appointment.staffName}</span>
        </div>

        <span className="font-bold text-text-primary tabular-nums">
          {formatCurrency(appointment.totalAmount)}
        </span>
      </div>
    </div>
  )
}
