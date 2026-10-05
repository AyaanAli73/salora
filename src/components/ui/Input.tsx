import React, { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      name,
      containerClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (name ? `input-${name}` : undefined)
    const errorId = inputId ? `${inputId}-error` : undefined
    const helperId = inputId ? `${inputId}-helper` : undefined

    return (
      <div className={cn('w-full flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-text-secondary select-none tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div
              className="absolute left-3.5 flex items-center pointer-events-none text-text-muted"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            name={name}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full rounded-xl bg-surface border border-border px-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted',
              'transition-[border-color,box-shadow,background-color] duration-150',
              'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
              'disabled:bg-surface-subtle disabled:opacity-60 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-danger focus-visible:border-danger focus-visible:ring-danger/20',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div
              className="absolute right-3.5 flex items-center text-text-muted"
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p id={errorId} className="text-xs font-medium text-danger mt-0.5">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-text-muted mt-0.5">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
