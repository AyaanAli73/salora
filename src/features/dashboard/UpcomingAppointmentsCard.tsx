import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, ArrowRight, Calendar } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Appointment } from '@/types'
import { cn } from '@/utils/cn'

interface UpcomingAppointmentsCardProps {
  appointments: Appointment[]
  onSelectAppointment: (appt: Appointment) => void
  className?: string
}

export const UpcomingAppointmentsCard: React.FC<UpcomingAppointmentsCardProps> = ({
  appointments,
  onSelectAppointment,
  className,
}) => {
  // Show next 4 upcoming appointments
  const upcoming = appointments
    .filter((a) => a.status === 'scheduled' || a.status === 'confirmed')
    .slice(0, 4)

  return (
    <Card className={cn('flex flex-col justify-between', className)}>
      <div>
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Next guests arriving today</CardDescription>
            </div>
            <Link
              to="/appointments"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-3 pb-3">
          {upcoming.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-text-muted">
              <Calendar className="h-8 w-8 text-text-muted/60" aria-hidden="true" />
              <p className="text-xs">No more upcoming appointments today.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {upcoming.map((appt) => (
                <div
                  key={appt.id}
                  onClick={() => onSelectAppointment(appt)}
                  className="py-2.5 flex items-center justify-between gap-3 group hover:bg-surface-subtle/50 px-2 rounded-xl transition-[background-color] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Time indicator */}
                    <div className="flex flex-col items-center justify-center w-12 py-1 rounded-lg bg-surface-subtle border border-border/80 text-center shrink-0">
                      <Clock className="h-3 w-3 text-primary mb-0.5" aria-hidden="true" />
                      <span className="text-[11px] font-bold tabular-nums text-text-primary">
                        {appt.startTime}
                      </span>
                    </div>

                    {/* Client Avatar */}
                    <Avatar name={appt.clientName} src={appt.clientAvatar} size="sm" />

                    {/* Client Name & Service */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-text-primary group-hover:text-primary transition-[color] truncate">
                        {appt.clientName}
                      </span>
                      <span className="text-[11px] text-text-muted truncate">
                        {appt.serviceName}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    <StatusBadge status={appt.status} className="scale-90 origin-right" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="pt-1 pb-3">
        <Link
          to="/appointments"
          className="w-full text-center text-xs font-semibold text-text-secondary hover:text-primary transition-[color] py-1"
        >
          Open Calendar Schedule &rarr;
        </Link>
      </CardFooter>
    </Card>
  )
}
