import React from 'react'
import { cn } from '@/utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-primary-light text-primary border-primary-200/50 dark:border-primary-800/40',
    accent: 'bg-accent-light text-accent border-accent-200/50 dark:border-accent-800/40',
    success: 'bg-success-light text-success-fg border-success/20',
    warning: 'bg-warning-light text-warning-fg border-warning/20',
    danger: 'bg-danger-light text-danger-fg border-danger/20',
    info: 'bg-info-light text-info-fg border-info/20',
    default: 'bg-surface-subtle text-text-secondary border-border',
  }

  const dotColors = {
    primary: 'bg-primary',
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    default: 'bg-text-muted',
  }

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-xs px-3 py-1 gap-2 font-medium',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border shrink-0 select-none whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0 animate-pulse', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
