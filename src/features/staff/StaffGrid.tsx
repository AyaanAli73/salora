import React, { useState } from 'react'
import { Staff, StaffStatus } from '@/types'
import { StaffCard } from './StaffCard'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { UserX } from 'lucide-react'

interface StaffGridProps {
  staffList: Staff[]
  onEditStaff: (staff: Staff) => void
  onUpdateStatus: (staffId: string, status: StaffStatus) => void
  onViewSchedule: (staff: Staff) => void
}

type StatusTabFilter = 'all' | 'available' | 'busy' | 'on-leave' | 'off-duty'

export const StaffGrid: React.FC<StaffGridProps> = ({
  staffList,
  onEditStaff,
  onUpdateStatus,
  onViewSchedule,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeStatusTab, setActiveStatusTab] = useState<StatusTabFilter>('all')
  const [selectedRole, setSelectedRole] = useState<string>('all')

  const roles = Array.from(new Set(staffList.map((s) => s.role)))

  const filteredStaff = staffList.filter((staff) => {
    // Search filter
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      staff.name.toLowerCase().includes(q) ||
      staff.role.toLowerCase().includes(q) ||
      staff.email.toLowerCase().includes(q) ||
      staff.phone.includes(q) ||
      staff.specialties.some((s) => s.toLowerCase().includes(q))

    // Status filter
    const effStatus = staff.todayStatus || (staff.status === 'on-leave' ? 'on-leave' : staff.status === 'off-duty' ? 'off-duty' : 'available')
    const matchesStatus =
      activeStatusTab === 'all' ? true : effStatus === activeStatusTab

    // Role filter
    const matchesRole =
      selectedRole === 'all' ? true : staff.role === selectedRole

    return matchesSearch && matchesStatus && matchesRole
  })

  const getStatusCount = (status: StatusTabFilter) => {
    if (status === 'all') return staffList.length
    return staffList.filter((s) => {
      const eff = s.todayStatus || (s.status === 'on-leave' ? 'on-leave' : s.status === 'off-duty' ? 'off-duty' : 'available')
      return eff === status
    }).length
  }

  const statusTabs: { id: StatusTabFilter; label: string }[] = [
    { id: 'all', label: 'All Staff' },
    { id: 'available', label: 'Available' },
    { id: 'busy', label: 'Busy' },
    { id: 'on-leave', label: 'On Leave' },
    { id: 'off-duty', label: 'Off Duty' },
  ]

  return (
    <div className="space-y-6">
      {/* Search & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-subtle border border-border overflow-x-auto">
          {statusTabs.map((tab) => {
            const active = activeStatusTab === tab.id
            const count = getStatusCount(tab.id)
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStatusTab(tab.id)}
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
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search & Role select */}
        <div className="flex items-center gap-3">
          <div className="w-full sm:w-64">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search staff, specialties…"
            />
          </div>

          <div className="w-44">
            <select
              aria-label="Filter staff by role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Cards Grid */}
      {filteredStaff.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staff) => (
            <StaffCard
              key={staff.id}
              staff={staff}
              onEdit={onEditStaff}
              onUpdateStatus={onUpdateStatus}
              onViewSchedule={onViewSchedule}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-surface-subtle/40 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-surface border border-border mx-auto flex items-center justify-center text-text-muted">
            <UserX className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-text-primary">No Staff Found</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            No specialists match your active filters or search terms. Try clearing search or switching status tabs.
          </p>
        </div>
      )}
    </div>
  )
}
