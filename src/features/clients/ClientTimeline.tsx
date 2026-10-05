import React from 'react'
import { CheckCircle2, Clock, Calendar, Sparkles, User } from 'lucide-react'
import { ClientTimelineItem } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/utils/cn'

interface ClientTimelineProps {
  timeline: ClientTimelineItem[]
  currency?: string
  className?: string
}

export const ClientTimeline: React.FC<ClientTimelineProps> = ({
  timeline,
  currency = 'INR',
  className,
}) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-text-muted">
        <Calendar className="h-8 w-8 text-text-muted/60" aria-hidden="true" />
        <p className="text-xs">No service timeline entries recorded yet.</p>
      </div>
    )
  }

  return (
    <div className={cn('relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/80', className)}>
      {timeline.map((item, idx) => {
        const isCompleted = item.status === 'completed'
        return (
          <div key={item.id || idx} className="relative group">
            {/* Timeline node icon */}
            <div
              className={cn(
                'absolute -left-6 top-1 h-5 w-5 rounded-full flex items-center justify-center border-2 border-surface shadow-xs',
                isCompleted
                  ? 'bg-success text-white'
                  : item.status === 'in-progress'
                  ? 'bg-accent text-white animate-pulse'
                  : 'bg-primary text-white'
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Clock className="h-3 w-3" aria-hidden="true" />
              )}
            </div>

            {/* Timeline Card */}
            <div className="p-4 rounded-2xl bg-surface border border-border hover:border-primary/40 hover:shadow-xs transition-[border-color,box-shadow]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-col">
                  {/* Date */}
                  <span className="text-xs font-bold text-primary tabular-nums">
                    {item.date}
                  </span>
                  {/* Service Title */}
                  <h4 className="text-sm font-bold text-text-primary mt-0.5">
                    {item.serviceName}
                  </h4>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  {/* Price */}
                  <span className="text-sm font-extrabold text-text-primary tabular-nums">
                    {formatCurrency(item.price, currency)}
                  </span>
                  {/* Status Badge */}
                  <StatusBadge status={item.status} />
                </div>
              </div>

              {/* Optional Specialist or Notes */}
              {(item.staffName || item.notes) && (
                <div className="mt-2.5 pt-2.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
                  {item.staffName && (
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
                      <span>{item.staffName}</span>
                    </span>
                  )}
                  {item.notes && (
                    <span className="italic text-[11px] text-text-secondary truncate max-w-sm">
                      {item.notes}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
