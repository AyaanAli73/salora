import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '…', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '…', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages)
      }
    }
    return pages
  }

  if (totalPages <= 1 && totalItems <= pageSize) {
    return (
      <div className={cn('flex items-center justify-between text-xs text-text-muted px-2 py-3', className)}>
        <span>Showing {totalItems} results</span>
      </div>
    )
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-wrap items-center justify-between gap-4 px-2 py-3.5', className)}
    >
      <p className="text-xs text-text-secondary tabular-nums">
        Showing <span className="font-semibold text-text-primary">{startItem}</span> to{' '}
        <span className="font-semibold text-text-primary">{endItem}</span> of{' '}
        <span className="font-semibold text-text-primary">{totalItems}</span> results
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Go to previous page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-subtle hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) => {
            if (typeof page === 'string') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-8 w-8 items-center justify-center text-xs text-text-muted select-none"
                >
                  {page}
                </span>
              )
            }

            const isActive = page === currentPage
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${page}`}
                className={cn(
                  'flex h-8 min-w-[32px] px-2 items-center justify-center rounded-lg text-xs font-semibold tabular-nums',
                  'transition-[background-color,border-color,color] duration-100',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'border border-border text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                )}
              >
                {page}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Go to next page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-subtle hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
