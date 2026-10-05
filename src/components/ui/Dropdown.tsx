import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils/cn'

export interface DropdownItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
  divider?: boolean
}

export interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen((prev) => !prev)
          }
        }}
        className="cursor-pointer inline-flex items-center"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={cn(
            'absolute z-50 mt-2 min-w-[200px] rounded-xl bg-surface border border-border shadow-xl p-1.5',
            'transition-[opacity,transform] duration-150 transform scale-100 opacity-100',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={`divider-${index}`} className="my-1 border-t border-border" />
            }

            return (
              <button
                key={item.id}
                role="menuitem"
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.()
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left',
                  'transition-[background-color,color] duration-100',
                  'focus-visible:outline-none focus-visible:bg-surface-subtle',
                  item.danger
                    ? 'text-danger hover:bg-danger-light hover:text-danger-fg'
                    : 'text-text-primary hover:bg-surface-subtle',
                  item.disabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                {item.icon && <span className="h-4 w-4 shrink-0 text-text-muted">{item.icon}</span>}
                <span className="truncate flex-1">{item.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
