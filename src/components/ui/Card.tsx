import React from 'react'
import { cn } from '@/utils/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  hoverEffect?: boolean
}

export const Card: React.FC<CardProps> = ({
  className,
  glass = false,
  hoverEffect = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface text-text-primary shadow-card-soft',
        glass && 'glass-panel',
        hoverEffect &&
          'transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-border-strong',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('flex flex-col gap-1 px-6 pt-6 pb-4', className)} {...props}>
    {children}
  </div>
)

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3
    className={cn('text-base font-semibold tracking-tight text-text-primary text-balance', className)}
    {...props}
  >
    {children}
  </h3>
)

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn('text-xs text-text-muted', className)} {...props}>
    {children}
  </p>
)

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('px-6 pb-6 pt-0', className)} {...props}>
    {children}
  </div>
)

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('flex items-center justify-between border-t border-border px-6 py-4 bg-surface-subtle/30 rounded-b-2xl', className)}
    {...props}
  >
    {children}
  </div>
)
