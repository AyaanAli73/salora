import React from 'react'
import { LoadingState } from './LoadingState'
import { ErrorState } from './ErrorState'
import { EmptyState } from './EmptyState'

export interface AsyncStateWrapperProps {
  isLoading: boolean
  error?: string | Error | null
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  emptyIcon?: React.ReactNode
  loadingMessage?: string
  onRetry?: () => void
  children: React.ReactNode
  className?: string
}

export const AsyncStateWrapper: React.FC<AsyncStateWrapperProps> = ({
  isLoading,
  error,
  isEmpty = false,
  emptyTitle = 'No Records Found',
  emptyDescription = 'There are currently no items to display in this view.',
  emptyAction,
  emptyIcon,
  loadingMessage = 'Loading data…',
  onRetry,
  children,
  className,
}) => {
  // 1. Loading State
  if (isLoading) {
    return <LoadingState message={loadingMessage} className={className} />
  }

  // 2. Error State
  if (error) {
    const errorMsg = typeof error === 'string' ? error : error.message
    return (
      <ErrorState
        message={errorMsg || 'Failed to load content. Please check your connection and retry.'}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  // 3. Empty State
  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        icon={emptyIcon}
        className={className}
      />
    )
  }

  // 4. Success State
  return <>{children}</>
}
