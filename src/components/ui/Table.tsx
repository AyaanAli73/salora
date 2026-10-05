import React from 'react'
import { cn } from '@/utils/cn'

export interface Column<T> {
  key: string
  header: React.ReactNode
  cell?: (row: T, index: number) => React.ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
  width?: string
}

export interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T, index: number) => string
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  className?: string
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No records found',
  onRowClick,
  className,
}: TableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-2xl border border-border bg-surface', className)}>
      <table className="w-full text-left text-sm text-text-primary border-collapse">
        <thead className="bg-surface-subtle/80 border-b border-border text-xs uppercase font-semibold text-text-secondary select-none tracking-wider">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={{ width: col.width }}
                className={cn(
                  'px-6 py-3.5 whitespace-nowrap',
                  col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-text-muted">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-xs">Loading data…</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-text-muted">
                <p className="text-sm">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={keyExtractor(row, index)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'transition-[background-color] duration-100',
                  onRowClick ? 'cursor-pointer hover:bg-surface-subtle/60' : 'hover:bg-surface-subtle/30'
                )}
              >
                {columns.map((col) => {
                  const content = col.cell ? col.cell(row, index) : (row as Record<string, unknown>)[col.key] as React.ReactNode
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        'px-6 py-4 whitespace-nowrap text-sm',
                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right tabular-nums' : 'text-left',
                        col.className
                      )}
                    >
                      {content}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
