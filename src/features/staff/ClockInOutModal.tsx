import React, { useState, useEffect } from 'react'
import {
  Clock,
  LogIn,
  LogOut,
  Coffee,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  Laptop,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Staff, StaffAttendanceRecord, StaffShift } from '@/types'
import { staffAttendanceService } from '@/services/staffAttendanceService'
import { timeToMinutes } from '@/utils/availability'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

interface ClockInOutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staffList: Staff[]
  preselectedStaffId?: string
}

export const ClockInOutModal: React.FC<ClockInOutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  preselectedStaffId,
}) => {
  const { addToast } = useToastStore()
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    preselectedStaffId || staffList[0]?.id || ''
  )
  const [activeTab, setActiveTab] = useState<'clock' | 'break'>('clock')
  const [customTime, setCustomTime] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [breakReason, setBreakReason] = useState<string>('Standard Lunch / Meal Break')
  const [isUnpaidBreak, setIsUnpaidBreak] = useState<boolean>(true)
  const [todayRecord, setTodayRecord] = useState<StaffAttendanceRecord | undefined>(undefined)
  const [assignedShift, setAssignedShift] = useState<StaffShift | undefined>(undefined)
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('')

  // Keep live time updated
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const formatted = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      })
      setCurrentTimeStr(formatted)
      if (!customTime) {
        setCustomTime(formatted)
      }
    }
    updateTime()
    const interval = setInterval(updateTime, 10000)
    return () => clearInterval(interval)
  }, [customTime])

  useEffect(() => {
    if (preselectedStaffId) {
      setSelectedStaffId(preselectedStaffId)
    } else if (!selectedStaffId && staffList.length > 0) {
      setSelectedStaffId(staffList[0].id)
    }
  }, [preselectedStaffId, staffList, selectedStaffId])

  // Fetch today's record and shift for the selected staff
  useEffect(() => {
    if (!selectedStaffId) return
    const record = staffAttendanceService.getAttendanceForStaffToday(selectedStaffId)
    setTodayRecord(record)
    const today = new Date().toISOString().split('T')[0]
    const shift = staffAttendanceService.getStaffShiftForDate(selectedStaffId, today)
    setAssignedShift(shift)
  }, [selectedStaffId, isOpen])

  if (!isOpen) return null

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId)
  const isClockedIn = Boolean(todayRecord?.clockIn && !todayRecord?.clockOut)
  const isClockedOut = Boolean(todayRecord?.clockOut)
  const openBreak = todayRecord?.breaks?.find((b) => !b.breakEndTime)
  const isOnBreak = Boolean(openBreak)

  // Calculate late status preview
  let lateMinutesPreview = 0
  if (!isClockedIn && assignedShift && customTime) {
    const shiftStartMins = timeToMinutes(assignedShift.startTime)
    const clockMins = timeToMinutes(customTime)
    if (clockMins > shiftStartMins + 5) {
      lateMinutesPreview = clockMins - shiftStartMins
    }
  }

  const handleClockIn = async () => {
    if (!selectedStaffId) return
    try {
      await staffAttendanceService.clockIn(
        selectedStaffId,
        customTime,
        notes,
        'Salon Front Desk iPad (Station #1)'
      )
      addToast({
        title: 'Clock-In Recorded',
        message: `${selectedStaff?.name} successfully clocked in at ${customTime}${
          lateMinutesPreview > 0 ? ` (${lateMinutesPreview} mins late)` : ''
        }.`,
        type: lateMinutesPreview > 0 ? 'warning' : 'success',
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not clock in'
      addToast({
        title: 'Clock-In Failed',
        message: msg,
        type: 'danger',
      })
    }
  }

  const handleClockOut = async () => {
    if (!selectedStaffId) return
    try {
      const updated = await staffAttendanceService.clockOut(selectedStaffId, customTime, notes)
      addToast({
        title: 'Clock-Out Recorded',
        message: `${selectedStaff?.name} clocked out at ${customTime}. Total: ${updated.workingHours} hrs worked.`,
        type: 'success',
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not clock out'
      addToast({
        title: 'Clock-Out Failed',
        message: msg,
        type: 'danger',
      })
    }
  }

  const handleStartBreak = () => {
    if (!selectedStaffId) return
    try {
      staffAttendanceService.startBreak(selectedStaffId, breakReason, isUnpaidBreak)
      addToast({
        title: 'Break Started',
        message: `${selectedStaff?.name} is now on break (${breakReason}).`,
        type: 'info',
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not start break'
      addToast({
        title: 'Action Failed',
        message: msg,
        type: 'danger',
      })
    }
  }

  const handleEndBreak = () => {
    if (!selectedStaffId) return
    try {
      staffAttendanceService.endBreak(selectedStaffId)
      addToast({
        title: 'Break Ended',
        message: `${selectedStaff?.name} ended break and resumed duty.`,
        type: 'success',
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not end break'
      addToast({
        title: 'Action Failed',
        message: msg,
        type: 'danger',
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clock-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Clock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="clock-modal-title" className="text-base font-bold text-text-primary">
                Staff Clock-In / Clock-Out
              </h2>
              <p className="text-xs text-text-muted">
                Record real-time attendance, breaks & shift verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close clock modal"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Staff Selector */}
          <div>
            <label htmlFor="staff-select" className="block text-xs font-semibold text-text-primary mb-1.5">
              Select Specialist
            </label>
            <select
              id="staff-select"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow cursor-pointer"
            >
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} — {st.role}
                </option>
              ))}
            </select>
          </div>

          {/* Current Status Pill & Assigned Shift Preview */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-text-muted">Assigned Today:</span>{' '}
              <span className="font-semibold text-text-primary">
                {assignedShift ? `${assignedShift.name} (${assignedShift.startTime} — ${assignedShift.endTime})` : 'Full Day (10:00 — 19:00)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">Status:</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full font-bold text-[11px] capitalize',
                  isOnBreak
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : isClockedIn
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : isClockedOut
                    ? 'bg-muted text-text-muted border border-border'
                    : 'bg-primary/10 text-primary border border-primary/20'
                )}
              >
                {isOnBreak ? 'On Break' : isClockedIn ? 'Clocked In (Working)' : isClockedOut ? 'Clocked Out' : 'Not Clocked In'}
              </span>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex rounded-xl bg-muted p-1 border border-border">
            <button
              type="button"
              onClick={() => setActiveTab('clock')}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                activeTab === 'clock'
                  ? 'bg-white dark:bg-card text-text-primary shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              Clock In / Clock Out
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('break')}
              disabled={!isClockedIn || isClockedOut}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed',
                activeTab === 'break'
                  ? 'bg-white dark:bg-card text-text-primary shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              Manage Break {openBreak && '• Live'}
            </button>
          </div>

          {activeTab === 'clock' && (
            <div className="space-y-4">
              {/* Time Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="clock-time" className="block text-xs font-semibold text-text-primary mb-1">
                    Recorded Time
                  </label>
                  <input
                    type="time"
                    id="clock-time"
                    name="clockTime"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
                  />
                  <span className="text-[11px] text-text-muted mt-0.5 block">
                    Current terminal time: {currentTimeStr}
                  </span>
                </div>

                <div>
                  <label htmlFor="clock-device" className="block text-xs font-semibold text-text-primary mb-1">
                    Terminal / Device Metadata
                  </label>
                  <div className="h-10 px-3 rounded-xl border border-border bg-muted/30 flex items-center gap-2 text-xs text-text-muted">
                    <Laptop className="w-3.5 h-3.5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="truncate">iPad #1 • Salon Front Desk</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                    IP & biometric verified
                  </span>
                </div>
              </div>

              {/* Late Arrival Warning */}
              {lateMinutesPreview > 0 && !isClockedIn && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-start gap-2.5 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-bold">Late Arrival Detected:</span> Clock-in at {customTime} is{' '}
                    <span className="font-semibold underline tabular-nums">{lateMinutesPreview} minutes</span> after assigned shift start ({assignedShift?.startTime}). Attendance status will automatically be set to <span className="font-bold">LATE</span>.
                  </div>
                </div>
              )}

              {/* Today summary if already clocked in */}
              {todayRecord?.clockIn && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Clocked In Today:</span>
                    <span className="font-bold text-text-primary tabular-nums">{todayRecord.clockIn}</span>
                  </div>
                  {todayRecord.clockOut && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Clocked Out Today:</span>
                      <span className="font-bold text-text-primary tabular-nums">{todayRecord.clockOut}</span>
                    </div>
                  )}
                  {todayRecord.workingHours !== undefined && (
                    <div className="flex justify-between font-semibold text-primary">
                      <span>Total Net Hours Worked:</span>
                      <span className="tabular-nums">{todayRecord.workingHours} hrs</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label htmlFor="clock-notes" className="block text-xs font-semibold text-text-primary mb-1">
                  Attendance Notes / Override Reason (Optional)
                </label>
                <input
                  type="text"
                  id="clock-notes"
                  name="clockNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Traffic delay on Highway 101, covered early morning prep…"
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                {!isClockedIn ? (
                  <Button
                    type="button"
                    variant="primary"
                    className="flex-1 justify-center py-2.5 shadow-glow-primary/20"
                    leftIcon={<LogIn className="w-4 h-4" />}
                    onClick={handleClockIn}
                  >
                    Confirm Clock In
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="danger"
                    className="flex-1 justify-center py-2.5"
                    leftIcon={<LogOut className="w-4 h-4" />}
                    onClick={handleClockOut}
                  >
                    Confirm Clock Out
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="sm:w-28 justify-center"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'break' && (
            <div className="space-y-4">
              {isOnBreak ? (
                /* Ongoing Break Alert & Stop Button */
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                    <Coffee className="w-4 h-4 animate-bounce" aria-hidden="true" />
                    <span>Break In Progress</span>
                  </div>
                  <p className="text-xs text-text-muted">
                    {selectedStaff?.name} began &quot;{openBreak?.reason}&quot; at{' '}
                    <span className="font-semibold text-text-primary tabular-nums">{openBreak?.breakStartTime}</span>.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full justify-center"
                    leftIcon={<Square className="w-4 h-4" />}
                    onClick={handleEndBreak}
                  >
                    End Break & Return to Duty
                  </Button>
                </div>
              ) : (
                /* Start Break Form */
                <div className="space-y-3">
                  <div>
                    <label htmlFor="break-reason" className="block text-xs font-semibold text-text-primary mb-1">
                      Break Reason
                    </label>
                    <select
                      id="break-reason"
                      value={breakReason}
                      onChange={(e) => setBreakReason(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    >
                      <option value="Standard Lunch / Meal Break">Standard Lunch / Meal Break</option>
                      <option value="Afternoon Tea / Rest Break">Afternoon Tea / Rest Break</option>
                      <option value="Personal Appointment">Personal Appointment</option>
                      <option value="Emergency Rest">Emergency Rest</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="unpaid-break"
                      checked={isUnpaidBreak}
                      onChange={(e) => setIsUnpaidBreak(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    />
                    <label htmlFor="unpaid-break" className="text-xs font-medium text-text-primary cursor-pointer">
                      Unpaid Break (Deducts duration from total working hours)
                    </label>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    <Button
                      type="button"
                      variant="primary"
                      className="flex-1 justify-center py-2.5"
                      leftIcon={<Play className="w-4 h-4" />}
                      onClick={handleStartBreak}
                    >
                      Start Break Now
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
