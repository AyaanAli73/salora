import React from 'react'
import { cn } from '@/utils/cn'

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
  disabled?: boolean
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
  variant?: 'pills' | 'underline'
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  className,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex = -1
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    }

    if (nextIndex !== -1 && !tabs[nextIndex].disabled) {
      e.preventDefault()
      onChange(tabs[nextIndex].id)
    }
  }

  return (
    <div
      role="tablist"
      className={cn(
        variant === 'pills'
          ? 'inline-flex p-1 rounded-xl bg-surface-subtle border border-border gap-1'
          : 'flex border-b border-border gap-6',
        className
      )}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab

        if (variant === 'pills') {
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold select-none',
                'transition-[background-color,color,box-shadow] duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive
                  ? 'bg-surface text-text-primary shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface/50',
                tab.disabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              {tab.icon && <span className="h-3.5 w-3.5 shrink-0" aria-hidden="true">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums',
                    isActive ? 'bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300' : 'bg-surface text-text-muted'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        }

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              'inline-flex items-center gap-2 pb-3 pt-1 text-sm font-semibold border-b-2 select-none -mb-px',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:text-primary',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong',
              tab.disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            {tab.icon && <span className="h-4 w-4 shrink-0" aria-hidden="true">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-bold tabular-nums',
                  isActive ? 'bg-primary-light text-primary' : 'bg-surface-subtle text-text-muted'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
