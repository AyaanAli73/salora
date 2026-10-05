import React, { forwardRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
  shortcutHint?: string
  containerClassName?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      value,
      onChange,
      onClear,
      shortcutHint,
      placeholder = 'Search clients, appointments, services…',
      containerClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    const hasValue = Boolean(value && String(value).length > 0)

    return (
      <div className={cn('relative flex items-center w-full', containerClassName)}>
        <Search
          className="absolute left-3.5 h-4 w-4 pointer-events-none text-text-muted"
          aria-hidden="true"
        />
        <input
          ref={ref}
          type="search"
          name="global-search"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'w-full h-10 rounded-xl bg-surface border border-border pl-10 pr-12 text-sm text-text-primary placeholder:text-text-muted',
            'transition-[border-color,box-shadow] duration-150',
            'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
            'disabled:bg-surface-subtle disabled:opacity-60',
            shortcutHint && !hasValue && 'pr-20',
            className
          )}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search input"
            className="absolute right-3 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        {!hasValue && shortcutHint && (
          <kbd
            className="absolute right-3 hidden sm:inline-flex items-center gap-1 rounded-md border border-border bg-surface-subtle px-1.5 py-0.5 text-[11px] font-medium text-text-muted shadow-xs select-none pointer-events-none"
            aria-hidden="true"
          >
            {shortcutHint}
          </kbd>
        )}
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
