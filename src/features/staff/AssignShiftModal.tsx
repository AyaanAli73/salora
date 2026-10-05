import React, { useState } from 'react'
import { Calendar, UserCheck, Clock, X, Check } from 'lucide-react'
import { Staff, StaffShift, ShiftAssignmentType } from '@/types'
import { staffAttendanceService } from '@/services/staffAttendanceService'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

interface AssignShiftModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staffList: Staff[]
  shifts: StaffShift[]
  preselectedStaffId?: string
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const AssignShiftModal: React.FC<AssignShiftModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  shifts,
  preselectedStaffId,
}) => {
  const { addToast } = useToastStore()

  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    preselectedStaffId || staffList[0]?.id || ''
  )
  const [selectedShiftId, setSelectedShiftId] = useState<string>(shifts[0]?.id || '')
  const [assignmentType, setAssignmentType] = useState<ShiftAssignmentType>('PERMANENT')
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
  const [specificDate, setSpecificDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  })

  if (!isOpen) return null

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const staff = staffList.find((s) => s.id === selectedStaffId)
    const shift = shifts.find((sh) => sh.id === selectedShiftId)

    if (!staff || !shift) {
      addToast({ title: 'Validation Error', message: 'Please select staff and shift.', type: 'danger' })
      return
    }

    if (assignmentType !== 'SPECIFIC_DATE' && selectedDays.length === 0) {
      addToast({ title: 'Validation Error', message: 'Please select at least one active day of the week.', type: 'danger' })
      return
    }

    try {
      staffAttendanceService.assignShift({
        staffId: staff.id,
        staffName: staff.name,
        shiftId: shift.id,
        shiftName: shift.name,
        assignmentType,
        daysOfWeek: assignmentType !== 'SPECIFIC_DATE' ? selectedDays : undefined,
        specificDate: assignmentType === 'SPECIFIC_DATE' ? specificDate : undefined,
        startDate: assignmentType === 'TEMPORARY' ? startDate : undefined,
        endDate: assignmentType === 'TEMPORARY' ? endDate : undefined,
      })

      addToast({
        title: 'Shift Assigned',
        message: `Assigned ${shift.name} to ${staff.name} (${assignmentType.toLowerCase()}).`,
        type: 'success',
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not assign shift'
      addToast({ title: 'Error', message: msg, type: 'danger' })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-shift-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="assign-shift-modal-title" className="text-base font-bold text-text-primary">
                Assign Shift to Specialist
              </h2>
              <p className="text-xs text-text-muted">
                Configure permanent roster, temporary coverage, or specific date assignments
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close assign modal"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Select Staff */}
          <div>
            <label htmlFor="assign-staff-select" className="block text-xs font-semibold text-text-primary mb-1">
              Select Specialist *
            </label>
            <select
              id="assign-staff-select"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            >
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} — {st.role}
                </option>
              ))}
            </select>
          </div>

          {/* Select Shift */}
          <div>
            <label htmlFor="assign-shift-select" className="block text-xs font-semibold text-text-primary mb-1">
              Select Shift Template *
            </label>
            <select
              id="assign-shift-select"
              value={selectedShiftId}
              onChange={(e) => setSelectedShiftId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            >
              {shifts.map((sh) => (
                <option key={sh.id} value={sh.id}>
                  {sh.name} ({sh.startTime} — {sh.endTime})
                </option>
              ))}
            </select>
          </div>

          {/* Assignment Type Toggle */}
          <div>
            <span className="block text-xs font-semibold text-text-primary mb-1.5">
              Assignment Type *
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAssignmentType('PERMANENT')}
                className={cn(
                  'p-2.5 rounded-xl border text-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  assignmentType === 'PERMANENT'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border text-text-muted hover:text-text-primary bg-muted/20'
                )}
              >
                Permanent
              </button>
              <button
                type="button"
                onClick={() => setAssignmentType('TEMPORARY')}
                className={cn(
                  'p-2.5 rounded-xl border text-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  assignmentType === 'TEMPORARY'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border text-text-muted hover:text-text-primary bg-muted/20'
                )}
              >
                Temporary
              </button>
              <button
                type="button"
                onClick={() => setAssignmentType('SPECIFIC_DATE')}
                className={cn(
                  'p-2.5 rounded-xl border text-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  assignmentType === 'SPECIFIC_DATE'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border text-text-muted hover:text-text-primary bg-muted/20'
                )}
              >
                Specific Date
              </button>
            </div>
          </div>

          {/* Days of week selector (if Permanent or Temporary) */}
          {assignmentType !== 'SPECIFIC_DATE' && (
            <div>
              <span className="block text-xs font-semibold text-text-primary mb-1.5">
                Active Days of Week
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      aria-pressed={isSelected}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        isSelected
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-muted text-text-muted hover:text-text-primary'
                      )}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Temporary Date Range */}
          {assignmentType === 'TEMPORARY' && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border">
              <div>
                <label htmlFor="temp-start" className="block text-[11px] font-semibold text-text-primary mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="temp-start"
                  name="tempStartDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="temp-end" className="block text-[11px] font-semibold text-text-primary mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="temp-end"
                  name="tempEndDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Specific Date Picker */}
          {assignmentType === 'SPECIFIC_DATE' && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border">
              <label htmlFor="specific-date" className="block text-xs font-semibold text-text-primary mb-1">
                Select Date for Single-Day Shift Override
              </label>
              <input
                type="date"
                id="specific-date"
                name="specificDate"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex flex-col sm:flex-row gap-2.5">
            <Button
              type="submit"
              variant="primary"
              className="flex-1 justify-center py-2.5 shadow-glow-primary/20"
            >
              Confirm Assignment
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="sm:w-28 justify-center"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
