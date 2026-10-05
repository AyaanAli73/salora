import React from 'react'
import { SearchInput } from '@/components/ui/SearchInput'
import { Staff } from '@/types'

interface AppointmentFiltersProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  staffFilter: string
  onStaffFilterChange: (staffId: string) => void
  staffList: Staff[]
  counts: {
    all: number
    'in-progress': number
    confirmed: number
    pending: number
    completed: number
    cancelled: number
  }
}

export const AppointmentFilters: React.FC<AppointmentFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  staffFilter,
  onStaffFilterChange,
  staffList,
  counts,
}) => {
  const statusTabs = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'in-progress', label: 'In Progress', count: counts['in-progress'] },
    { id: 'confirmed', label: 'Confirmed', count: counts.confirmed },
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ]

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      {/* Status Filter Pills */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-subtle border border-border overflow-x-auto">
        {statusTabs.map((tab) => {
          const active = statusFilter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusFilterChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-surface border border-border text-text-muted'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search & Specialist selector */}
      <div className="flex items-center gap-3">
        <div className="w-full sm:w-64">
          <SearchInput
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange('')}
            placeholder="Search client, service, phone…"
          />
        </div>

        <div className="w-44">
          <select
            aria-label="Filter appointments by specialist"
            value={staffFilter}
            onChange={(e) => onStaffFilterChange(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Specialists</option>
            {staffList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
