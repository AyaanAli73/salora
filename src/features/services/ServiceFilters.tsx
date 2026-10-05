import React from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { ServiceFilterParams, ServiceCategory } from '@/types'
import { cn } from '@/utils/cn'

interface ServiceFiltersProps {
  filters: ServiceFilterParams
  categories: ServiceCategory[]
  categoryCounts?: Record<string, number>
  totalCount?: number
  onFilterChange: (updates: Partial<ServiceFilterParams>) => void
  onResetFilters: () => void
  className?: string
}

export const ServiceFilters: React.FC<ServiceFiltersProps> = ({
  filters,
  categories,
  categoryCounts = {},
  totalCount,
  onFilterChange,
  onResetFilters,
  className,
}) => {
  const allTabs = [
    { id: 'all', name: 'All Services' },
    ...categories,
  ]

  const activeCategory = filters.category || 'all'

  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.priceRange && filters.priceRange !== 'all') ||
    (filters.duration && filters.duration !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    (filters.onlineBooking && filters.onlineBooking !== 'all')

  return (
    <div className={cn('space-y-4', className)}>
      {/* 1. Category Pills Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {allTabs.map((tab) => {
          const isActive =
            activeCategory.toLowerCase() === tab.id.toLowerCase() ||
            (tab.id !== 'all' && activeCategory.toLowerCase() === tab.name.toLowerCase())
          const count =
            tab.id === 'all'
              ? totalCount
              : categoryCounts[tab.name] || categoryCounts[tab.id] || 0

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                onFilterChange({
                  category: tab.id === 'all' ? 'all' : tab.name,
                })
              }
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-[background-color,color]',
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/40'
              )}
            >
              <span>{tab.name}</span>
              {count !== undefined && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-subtle text-text-muted'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 2. Search & Advanced Filter Controls Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <SearchInput
            placeholder="Search treatments by name or description…"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            onClear={() => onFilterChange({ search: '' })}
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Price Range Filter */}
          <div className="w-36">
            <Select
              value={filters.priceRange || 'all'}
              onChange={(e) =>
                onFilterChange({
                  priceRange: e.target.value as ServiceFilterParams['priceRange'],
                })
              }
              options={[
                { value: 'all', label: 'All Prices' },
                { value: 'under-500', label: 'Under ₹500' },
                { value: '500-1500', label: '₹500 - ₹1,500' },
                { value: 'above-1500', label: 'Above ₹1,500' },
              ]}
              aria-label="Filter by Price"
            />
          </div>

          {/* Duration Filter */}
          <div className="w-36">
            <Select
              value={filters.duration || 'all'}
              onChange={(e) =>
                onFilterChange({
                  duration: e.target.value as ServiceFilterParams['duration'],
                })
              }
              options={[
                { value: 'all', label: 'All Durations' },
                { value: 'under-30', label: '< 30 min' },
                { value: '30-60', label: '30 - 60 min' },
                { value: 'above-60', label: '> 60 min' },
              ]}
              aria-label="Filter by Duration"
            />
          </div>

          {/* Status Filter */}
          <div className="w-32">
            <Select
              value={filters.status || 'all'}
              onChange={(e) =>
                onFilterChange({
                  status: e.target.value as ServiceFilterParams['status'],
                })
              }
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active Only' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              aria-label="Filter by Status"
            />
          </div>

          {/* Online Booking Filter */}
          <div className="w-36">
            <Select
              value={filters.onlineBooking || 'all'}
              onChange={(e) =>
                onFilterChange({
                  onlineBooking: e.target.value as ServiceFilterParams['onlineBooking'],
                })
              }
              options={[
                { value: 'all', label: 'Booking: All' },
                { value: 'online', label: 'Online Bookable' },
                { value: 'offline', label: 'In-Salon Only' },
              ]}
              aria-label="Filter by Online Booking"
            />
          </div>

          {/* Sort By */}
          <div className="w-40">
            <Select
              value={filters.sortBy || 'popularity'}
              onChange={(e) =>
                onFilterChange({
                  sortBy: e.target.value as ServiceFilterParams['sortBy'],
                })
              }
              options={[
                { value: 'popularity', label: 'Sort: Most Popular' },
                { value: 'price', label: 'Sort: Price' },
                { value: 'duration', label: 'Sort: Duration' },
                { value: 'name', label: 'Sort: Name (A-Z)' },
                { value: 'latest', label: 'Sort: Recently Added' },
              ]}
              aria-label="Sort Services"
            />
          </div>

          {/* Reset Filters */}
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
    </div>
  )
}
