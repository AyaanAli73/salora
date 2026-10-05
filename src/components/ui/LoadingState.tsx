import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface LoadingStateProps {
  message?: string
  minHeight?: string
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading…',
  minHeight = 'min-h-[220px]',
  className,
}) => {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center p-8 gap-3',
        minHeight,
        className
      )}
    >
      <Loader2 className="h-7 w-7 text-primary animate-spin" aria-hidden="true" />
      <p className="text-xs font-medium text-text-muted">{message}</p>
    </div>
  )
}

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-surface-subtle', className)}
      {...props}
    />
  )
}
