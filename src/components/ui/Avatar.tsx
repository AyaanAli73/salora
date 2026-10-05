import React, { useState } from 'react'
import { cn } from '@/utils/cn'

export interface AvatarProps {
  src?: string
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'busy' | 'away' | 'offline'
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  className,
}) => {
  const [hasError, setHasError] = useState(false)

  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  }

  const statusSizeClasses = {
    xs: 'h-1.5 w-1.5 ring-1',
    sm: 'h-2 w-2 ring-1.5',
    md: 'h-2.5 w-2.5 ring-2',
    lg: 'h-3 w-3 ring-2',
    xl: 'h-3.5 w-3.5 ring-2',
  }

  const statusColors = {
    online: 'bg-success',
    busy: 'bg-danger',
    away: 'bg-warning',
    offline: 'bg-text-muted',
  }

  const getInitials = (str: string) => {
    if (!str) return 'SA'
    const parts = str.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return str.slice(0, 2).toUpperCase()
  }

  return (
    <div className={cn('relative inline-flex shrink-0 select-none', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center font-semibold border border-border shadow-xs',
          'bg-gradient-to-br from-primary-100 to-accent-100 text-primary-800 dark:from-primary-950 dark:to-accent-950 dark:text-primary-300',
          sizeClasses[size]
        )}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={name}
            onError={() => setHasError(true)}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-surface',
            statusColors[status],
            statusSizeClasses[size]
          )}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
