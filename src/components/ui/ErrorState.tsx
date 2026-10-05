import React from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/utils/cn'

export interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryText?: string
  className?: string
  icon?: React.ReactNode
  secondaryAction?: React.ReactNode
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to Load Content',
  message = 'An unexpected error occurred while fetching data. Please try again.',
  onRetry,
  retryText = 'Retry',
  className,
  icon,
  secondaryAction,
}) => {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-danger/20 bg-danger/5 dark:bg-danger/10',
        className
      )}
    >
      <div
        className="h-12 w-12 rounded-2xl bg-danger-light text-danger flex items-center justify-center mb-3.5 shadow-xs"
        aria-hidden="true"
      >
        {icon || <AlertCircle className="h-6 w-6" />}
      </div>

      <h3 className="text-base font-bold text-text-primary tracking-tight mb-1 text-balance">
        {title}
      </h3>

      <p className="text-xs text-text-muted max-w-md mb-5 leading-relaxed">
        {message}
      </p>

      <div className="flex items-center gap-3">
        {onRetry && (
          <Button
            variant="primary"
            size="sm"
            onClick={onRetry}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            {retryText}
          </Button>
        )}
        {secondaryAction}
      </div>
    </div>
  )
}
