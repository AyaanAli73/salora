import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from './Card'
import { cn } from '@/utils/cn'

export interface StatCardProps {
  label: string
  value: string | number
  changePercent?: number
  isPositive?: boolean
  timeframe?: string
  description?: string
  icon?: React.ReactNode
  iconBgColor?: string
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  changePercent,
  isPositive = true,
  timeframe,
  description,
  icon,
  iconBgColor = 'bg-primary-50 text-primary dark:bg-primary-950 dark:text-primary-300',
  className,
}) => {
  return (
    <Card hoverEffect className={cn('p-6 relative overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider truncate">
            {label}
          </span>
          <div className="text-2xl font-bold tracking-tight text-text-primary tabular-nums mt-1">
            {value}
          </div>
        </div>

        {icon && (
          <div
            className={cn(
              'h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs',
              iconBgColor
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
        {changePercent !== undefined && (
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums',
              isPositive
                ? 'bg-success-light text-success-fg'
                : 'bg-danger-light text-danger-fg'
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>
              {isPositive ? '+' : ''}
              {changePercent}%
            </span>
          </div>
        )}

        {timeframe && (
          <span className="text-xs text-text-muted font-medium truncate">{timeframe}</span>
        )}
      </div>

      {description && (
        <p className="mt-1 text-[11px] text-text-muted truncate">{description}</p>
      )}
    </Card>
  )
}
