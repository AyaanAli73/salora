import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  side?: 'right' | 'left'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  size = 'md',
  className,
}) => {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-xs',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }

  const drawerContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
      className="fixed inset-0 z-50 flex overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          'fixed inset-y-0 flex max-w-full',
          side === 'right' ? 'right-0' : 'left-0'
        )}
      >
        <div
          className={cn(
            'w-screen bg-surface border-border shadow-2xl flex flex-col',
            'transition-[transform,opacity] duration-200 ease-out',
            side === 'right' ? 'border-l' : 'border-r',
            sizeClasses[size],
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4.5">
            <div className="min-w-0 pr-4">
              {title && (
                <h3
                  id="drawer-title"
                  className="text-base font-semibold text-text-primary tracking-tight truncate"
                >
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-text-muted mt-0.5 truncate">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="rounded-xl p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-border bg-surface-subtle/50 px-6 py-4 flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(drawerContent, document.body)
}
