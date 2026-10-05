import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { MoreVertical, Clock, ArrowRight, Eye, CheckCircle2, Play, XCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Dropdown } from '@/components/ui/Dropdown'
import { Appointment } from '@/types'
import { cn } from '@/utils/cn'

interface AppointmentsTodayCardProps {
  appointments: Appointment[]
  onSelectAppointment: (appt: Appointment) => void
  onUpdateStatus: (id: string, status: Appointment['status']) => void
}

export const AppointmentsTodayCard: React.FC<AppointmentsTodayCardProps> = ({
  appointments,
  onSelectAppointment,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all')

  const filtered = appointments.filter((appt) => {
    if (activeTab === 'all') return true
    if (activeTab === 'pending') return appt.status === 'scheduled' || appt.status === 'confirmed'
    return appt.status === activeTab
  })

  const tabs: { id: typeof activeTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: appointments.length },
    {
      id: 'pending',
      label: 'Pending',
      count: appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length,
    },
    {
      id: 'in-progress',
      label: 'In Progress',
      count: appointments.filter((a) => a.status === 'in-progress').length,
    },
    {
      id: 'completed',
      label: 'Completed',
      count: appointments.filter((a) => a.status === 'completed').length,
    },
  ]

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Appointments Today</CardTitle>
            <CardDescription>Live timeline of scheduled treatments</CardDescription>
          </div>
          <Link
            to="/appointments"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mt-3 p-1 rounded-xl bg-surface-subtle border border-border/70 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-surface text-text-primary shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 rounded-full font-bold tabular-nums',
                    isActive ? 'bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300' : 'bg-surface/60 text-text-muted'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>

      {/* Appointment Rows List */}
      <CardContent className="pt-3 pb-3 flex-1 min-w-0">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted">
            No appointments in this category today.
          </div>
        ) : (
          <div className="divide-y divide-border/60 max-h-[460px] overflow-y-auto pr-1">
            {filtered.map((appt) => (
              <div
                key={appt.id}
                onClick={() => onSelectAppointment(appt)}
                className="py-3 flex items-center justify-between gap-3 group hover:bg-surface-subtle/50 px-2 rounded-xl transition-colors cursor-pointer"
              >
                {/* Left: Time & Client */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col items-center justify-center min-w-[50px] py-1 px-1 rounded-lg bg-surface-subtle border border-border/80 text-center shrink-0">
                    <Clock className="h-3 w-3 text-text-muted mb-0.5" aria-hidden="true" />
                    <span className="text-[11px] font-bold tabular-nums text-text-primary">
                      {appt.startTime}
                    </span>
                    {appt.tokenNumber && (
                      <span className="text-[10px] font-black text-primary font-sans leading-none mt-0.5">
                        {appt.tokenNumber}
                      </span>
                    )}
                  </div>

                  <Avatar name={appt.clientName} src={appt.clientAvatar} size="sm" />

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-text-primary truncate">
                      {appt.clientName}
                    </span>
                    <span className="text-[11px] text-text-muted truncate">
                      {appt.serviceName}
                    </span>
                  </div>
                </div>

                {/* Right: Status & Three-Dot Menu */}
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={appt.status} className="scale-90 origin-right" />

                  <div onClick={(e) => e.stopPropagation()}>
                    <Dropdown
                      trigger={
                        <button
                          type="button"
                          aria-label={`Actions for ${appt.clientName}`}
                          className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" aria-hidden="true" />
                        </button>
                      }
                      items={[
                        {
                          id: 'view',
                          label: 'View Details',
                          icon: <Eye className="h-3.5 w-3.5" />,
                          onClick: () => onSelectAppointment(appt),
                        },
                        {
                          id: 'checkin',
                          label: 'Check In Guest',
                          icon: <Play className="h-3.5 w-3.5 text-accent" />,
                          disabled: appt.status === 'in-progress' || appt.status === 'completed',
                          onClick: () => onUpdateStatus(appt.id, 'in-progress'),
                        },
                        {
                          id: 'complete',
                          label: 'Mark as Completed',
                          icon: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
                          disabled: appt.status === 'completed',
                          onClick: () => onUpdateStatus(appt.id, 'completed'),
                        },
                        {
                          id: 'cancel',
                          label: 'Cancel Booking',
                          danger: true,
                          icon: <XCircle className="h-3.5 w-3.5" />,
                          disabled: appt.status === 'cancelled',
                          onClick: () => onUpdateStatus(appt.id, 'cancelled'),
                        },
                      ]}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 pb-3 border-t border-border/40 mt-auto">
        <Link
          to="/appointments"
          className="w-full text-center text-xs font-semibold text-text-secondary hover:text-primary transition-colors py-1"
        >
          View Full Today Schedule &rarr;
        </Link>
      </CardFooter>
    </Card>
  )
}
