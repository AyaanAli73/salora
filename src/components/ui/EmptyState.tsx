import React from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border bg-surface/40',
        className
      )}
    >
      <div
        className="h-14 w-14 rounded-2xl bg-primary-50 text-primary dark:bg-primary-950 dark:text-primary-300 flex items-center justify-center mb-4 shadow-xs"
        aria-hidden="true"
      >
        {icon || <Sparkles className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-semibold text-text-primary tracking-tight text-balance mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-text-muted max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  )
}
