import React, { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl select-none touch-manipulation ' +
      'transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-150 ease-out ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ' +
      'active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100'

    const variantStyles = {
      primary:
        'bg-primary text-white shadow-sm hover:bg-primary-hover active:bg-primary-700 shadow-glow-primary/20',
      secondary:
        'bg-surface-subtle text-text-primary hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-border',
      outline:
        'border border-border bg-transparent text-text-primary hover:bg-surface-subtle hover:border-border-strong',
      ghost:
        'bg-transparent text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
      danger:
        'bg-danger text-white hover:bg-red-600 active:bg-red-700 shadow-sm',
      accent:
        'bg-accent text-white shadow-sm hover:opacity-95 shadow-glow-accent/20',
    }

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-10',
      lg: 'text-base px-5 py-2.5 gap-2.5 h-12',
      icon: 'h-10 w-10 p-0 items-center justify-center',
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>
        )}
        {children && <span className="truncate">{children}</span>}
        {!isLoading && rightIcon && (
          <span className="shrink-0" aria-hidden="true">{rightIcon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
