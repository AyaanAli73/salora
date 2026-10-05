import React from 'react'
import { Search, SlidersHorizontal, ArrowUpDown, X, Filter } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { ClientFilterParams } from '@/services/clientService'
import { cn } from '@/utils/cn'

interface ClientFiltersProps {
  filters: ClientFilterParams
  onFilterChange: (updates: Partial<ClientFilterParams>) => void
  onResetFilters: () => void
  totalCount?: number
  className?: string
}

export const ClientFilters: React.FC<ClientFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  className,
}) => {
  const statusTabs: { id: ClientFilterParams['status']; label: string }[] = [
    { id: 'all', label: 'All Clients' },
    { id: 'active', label: 'Active' },
    { id: 'vip', label: 'VIP' },
    { id: 'new', label: 'New' },
    { id: 'returning', label: 'Returning' },
    { id: 'inactive', label: 'Inactive' },
  ]

  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.status && filters.status !== 'all') ||
    (filters.gender && filters.gender !== 'all') ||
    (filters.sortBy && filters.sortBy !== 'latest')

  return (
    <div className={cn('space-y-4', className)}>
      {/* Top Filter Row: Search & Dropdowns */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <SearchInput
            placeholder="Search by name, phone or email…"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            onClear={() => onFilterChange({ search: '', page: 1 })}
          />
        </div>

        {/* Right Controls: Gender, Sort, Clear */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Gender Filter */}
          <div className="w-36">
            <Select
              value={filters.gender || 'all'}
              onChange={(e) => onFilterChange({ gender: e.target.value, page: 1 })}
              options={[
                { value: 'all', label: 'All Genders' },
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
                { value: 'non-binary', label: 'Non-binary' },
              ]}
              aria-label="Filter by Gender"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="w-44">
            <Select
              value={filters.sortBy || 'latest'}
              onChange={(e) =>
                onFilterChange({
                  sortBy: e.target.value as ClientFilterParams['sortBy'],
                  page: 1,
                })
              }
              options={[
                { value: 'latest', label: 'Sort: Latest' },
                { value: 'name', label: 'Sort: Name (A-Z)' },
                { value: 'visits', label: 'Sort: Most Visits' },
                { value: 'spent', label: 'Sort: Highest Spent' },
                { value: 'lastVisit', label: 'Sort: Last Visit' },
              ]}
              aria-label="Sort Clients"
            />
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-danger hover:bg-danger-light transition-[background-color] border border-danger/20"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Filter Row: Status Pills */}
      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {statusTabs.map((tab) => {
            const isActive = (filters.status || 'all') === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange({ status: tab.id, page: 1 })}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-[background-color,color]',
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {totalCount !== undefined && (
          <span className="text-xs text-text-muted shrink-0 hidden sm:inline tabular-nums">
            Showing <strong className="text-text-primary">{totalCount}</strong> clients
          </span>
        )}
      </div>
    </div>
  )
}
