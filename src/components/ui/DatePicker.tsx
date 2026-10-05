import React, { forwardRef } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  containerClassName?: string
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      id,
      name,
      containerClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (name ? `date-${name}` : undefined)
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
          <CalendarIcon
            className="pointer-events-none absolute left-3.5 h-4 w-4 text-text-muted"
            aria-hidden="true"
          />
          <input
            ref={ref}
            type="date"
            id={inputId}
            name={name}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full rounded-xl bg-surface border border-border pl-10 pr-3.5 py-2 text-sm text-text-primary',
              'transition-[border-color,box-shadow] duration-150',
              'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
              'disabled:bg-surface-subtle disabled:opacity-60 disabled:cursor-not-allowed',
              error && 'border-danger focus-visible:border-danger focus-visible:ring-danger/20',
              className
            )}
            {...props}
          />
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

DatePicker.displayName = 'DatePicker'
