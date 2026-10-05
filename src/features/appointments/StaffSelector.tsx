import React, { useMemo } from 'react'
import { Staff } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { staffAttendanceService } from '@/services/staffAttendanceService'
import { getDayNameFromDate } from '@/utils/availability'
import { Sparkles, User } from 'lucide-react'

interface StaffSelectorProps {
  selectedStaffId: string // 'any' | staff.id
  onSelectStaff: (staffId: string) => void
  staffList: Staff[]
  selectedDate: string
  error?: string
  className?: string
}

export const StaffSelector: React.FC<StaffSelectorProps> = ({
  selectedStaffId,
  onSelectStaff,
  staffList,
  selectedDate,
  error,
  className = '',
}) => {
  // Annotate each staff with availability on selected date
  const staffAvailability = useMemo(() => {
    const shortDay = selectedDate ? getDayNameFromDate(selectedDate) : 'Mon'

    return staffList.map((staff) => {
      const isOnLeave = staffAttendanceService.isStaffOnLeaveOnDate(staff.id, selectedDate)
      const scheduleDay = staff.weeklySchedule?.find(
        (s) => s.day.toLowerCase() === shortDay.toLowerCase()
      )
      const isOffDuty = scheduleDay ? !scheduleDay.isWorking : false

      let statusNote = 'Available'
      let isAvailable = true

      if (isOnLeave) {
        statusNote = 'On Leave'
        isAvailable = false
      } else if (isOffDuty) {
        statusNote = 'Off Duty'
        isAvailable = false
      }

      return {
        staff,
        isOnLeave,
        isOffDuty,
        isAvailable,
        statusNote,
      }
    })
  }, [staffList, selectedDate])

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-primary" />
          Stylist / Specialist <span className="text-danger">*</span>
        </label>
        <span className="text-xs text-text-muted">
          {selectedStaffId === 'any' ? 'First available will be assigned' : 'Specific stylist locked'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {/* "Any Available" Card */}
        <button
          type="button"
          onClick={() => onSelectStaff('any')}
          className={`p-3 rounded-xl border text-left transition-colors relative flex flex-col justify-between gap-2 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            selectedStaffId === 'any'
              ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40'
              : 'border-border bg-surface hover:border-border-hover hover:bg-surface-hover'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            {selectedStaffId === 'any' && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-text-primary">Any Available</p>
            <p className="text-[11px] text-text-muted">Fastest booking</p>
          </div>
        </button>

        {/* Specific Staff Cards */}
        {staffAvailability.map(({ staff, isAvailable, statusNote }) => {
          const isSelected = selectedStaffId === staff.id
          return (
            <button
              key={staff.id}
              type="button"
              onClick={() => onSelectStaff(staff.id)}
              className={`p-3 rounded-xl border text-left transition-colors relative flex flex-col justify-between gap-2 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40'
                  : isAvailable
                  ? 'border-border bg-surface hover:border-border-hover hover:bg-surface-hover'
                  : 'border-border/60 bg-surface/50 opacity-60 hover:opacity-90'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Avatar
                  src={staff.avatarUrl}
                  name={staff.name}
                  size="sm"
                  status={isAvailable ? 'online' : 'away'}
                />
                {!isAvailable && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-danger/10 text-danger border border-danger/20">
                    {statusNote}
                  </span>
                )}
              </div>
              <div className="min-w-0 w-full">
                <p className="text-xs font-bold text-text-primary truncate">{staff.name}</p>
                <p className="text-[11px] text-text-muted truncate">{staff.role || 'Stylist'}</p>
              </div>
            </button>
          )
        })}
      </div>

      {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
    </div>
  )
}
