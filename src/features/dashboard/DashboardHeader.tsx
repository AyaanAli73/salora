import React from 'react'
import { Plus, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TimeframeFilter } from '@/types'
import { cn } from '@/utils/cn'

interface DashboardHeaderProps {
  userName?: string
  activeTimeframe: TimeframeFilter
  onTimeframeChange: (tf: TimeframeFilter) => void
  onNewAppointment: () => void
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName = 'there',
  activeTimeframe,
  onTimeframeChange,
  onNewAppointment,
}) => {
  const timeframes: { id: TimeframeFilter; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'custom', label: 'Custom Range' },
  ]

  // Get first name only
  const firstName = userName.split(' ')[0]

  return (
    <div className="flex flex-col gap-3">
      {/* Top Bar: Greeting & New Appointment */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary font-sans">
            Hey, {firstName}
          </h1>
          <p className="text-xs text-text-muted mt-0.5 hidden sm:block">
            Here is your salon overview and operational pulse for today.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onNewAppointment}
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          className="shadow-glow-primary/30 font-semibold text-xs h-9 shrink-0"
        >
          New Appointment
        </Button>
      </div>

      {/* Timeframe Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-y border-border/50 py-1.5 scrollbar-none">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-1 hidden sm:inline-block shrink-0">
          View Filter:
        </span>
        {timeframes.map((tf) => {
          const isActive = activeTimeframe === tf.id
          return (
            <button
              key={tf.id}
              type="button"
              onClick={() => onTimeframeChange(tf.id)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0',
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
              )}
            >
              {tf.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
