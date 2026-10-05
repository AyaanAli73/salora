import React, { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options?: SelectOption[]
  containerClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options = [],
      children,
      id,
      name,
      containerClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (name ? `select-${name}` : undefined)
    const errorId = selectId ? `${selectId}-error` : undefined
    const helperId = selectId ? `${selectId}-helper` : undefined

    return (
      <div className={cn('w-full flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-text-secondary select-none tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          <select
            ref={ref}
            id={selectId}
            name={name}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full appearance-none rounded-xl bg-surface text-text-primary border border-border px-3.5 py-2 pr-10 text-sm',
              'transition-[border-color,box-shadow] duration-150',
              'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
              'disabled:bg-surface-subtle disabled:opacity-60 disabled:cursor-not-allowed',
              error && 'border-danger focus-visible:border-danger focus-visible:ring-danger/20',
              className
            )}
            style={{
              backgroundColor: 'rgb(var(--color-surface))',
              color: 'rgb(var(--color-text-primary))',
            }}
            {...props}
          >
            {options.length > 0
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="bg-surface text-text-primary py-1"
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div
            className="pointer-events-none absolute right-3.5 flex items-center text-text-muted"
            aria-hidden="true"
          >
            <ChevronDown className="h-4 w-4" />
          </div>
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

Select.displayName = 'Select'
