import React from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, CalendarPlus, Sparkles, CreditCard, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useUIStore } from '@/store/useUIStore'

export const QuickActionsBar: React.FC = () => {
  const navigate = useNavigate()
  const { openNewAppointmentModal, openNewClientModal } = useUIStore()

  const actions = [
    {
      id: 'qa-client',
      label: 'New Client',
      sub: 'Add guest book record',
      icon: <UserPlus className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />,
      iconBg: 'bg-sky-50 dark:bg-sky-950/60',
      onClick: openNewClientModal,
    },
    {
      id: 'qa-appt',
      label: 'New Appointment',
      sub: 'Schedule treatment',
      icon: <CalendarPlus className="h-4 w-4 text-primary" aria-hidden="true" />,
      iconBg: 'bg-primary-50 dark:bg-primary-950/60',
      onClick: openNewAppointmentModal,
    },
    {
      id: 'qa-service',
      label: 'Add Service',
      sub: 'Configure treatment menu',
      icon: <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />,
      iconBg: 'bg-accent-50 dark:bg-accent-950/60',
      onClick: () => navigate('/services'),
    },
    {
      id: 'qa-payment',
      label: 'Record Payment',
      sub: 'Register register checkout',
      icon: <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      onClick: () => navigate('/sales'),
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {actions.map((act) => (
        <button
          key={act.id}
          type="button"
          onClick={act.onClick}
          className="group flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-surface border border-border hover:border-primary/50 hover:shadow-card-hover transition-all text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-lg flex items-center justify-center shrink-0 ${act.iconBg}`}
            >
              {act.icon}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                {act.label}
              </span>
              <span className="text-[10px] text-text-muted truncate hidden sm:inline">
                {act.sub}
              </span>
            </div>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-transform shrink-0" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
