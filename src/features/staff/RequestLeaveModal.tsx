import React, { useState } from 'react'
import { Calendar, User, FileText, X, AlertCircle } from 'lucide-react'
import { Staff, LeaveType } from '@/types'
import { staffAttendanceService } from '@/services/staffAttendanceService'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/useToastStore'

interface RequestLeaveModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staffList: Staff[]
  preselectedStaffId?: string
}

const LEAVE_TYPES: LeaveType[] = ['Casual', 'Sick', 'Personal', 'Emergency', 'Other']

export const RequestLeaveModal: React.FC<RequestLeaveModalProps> = ({
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
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual')
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().split('T')[0]
  })
  const [reason, setReason] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  // Calculate day count
  const start = new Date(fromDate).getTime()
  const end = new Date(toDate).getTime()
  const daysCount =
    !isNaN(start) && !isNaN(end) && end >= start
      ? Math.round((end - start) / (1000 * 3600 * 24)) + 1
      : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaffId) {
      addToast({ title: 'Validation Error', message: 'Please select a staff member.', type: 'danger' })
      return
    }
    if (daysCount <= 0) {
      addToast({ title: 'Validation Error', message: 'End date must be on or after start date.', type: 'danger' })
      return
    }
    if (!reason.trim()) {
      addToast({ title: 'Validation Error', message: 'Please provide a reason for the leave.', type: 'danger' })
      return
    }

    setIsSubmitting(true)
    try {
      const newLeave = await staffAttendanceService.requestLeave({
        staffId: selectedStaffId,
        leaveType,
        fromDate,
        toDate,
        reason,
      })

      addToast({
        title: 'Leave Requested',
        message: `${newLeave.staffName} submitted a ${daysCount}-day ${leaveType} leave request.`,
        type: 'success',
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not submit leave request'
      addToast({ title: 'Error', message: msg, type: 'danger' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-leave-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="request-leave-modal-title" className="text-base font-bold text-text-primary">
                Submit Staff Leave Request
              </h2>
              <p className="text-xs text-text-muted">
                Request planned or emergency time off for manager approval
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close leave request modal"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Select Staff */}
          <div>
            <label htmlFor="leave-staff-select" className="block text-xs font-semibold text-text-primary mb-1">
              Select Specialist *
            </label>
            <select
              id="leave-staff-select"
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

          {/* Leave Type */}
          <div>
            <label htmlFor="leave-type-select" className="block text-xs font-semibold text-text-primary mb-1">
              Leave Type *
            </label>
            <select
              id="leave-type-select"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t} Leave
                </option>
              ))}
            </select>
          </div>

          {/* Date Range: From / To */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="leave-from-date" className="block text-xs font-semibold text-text-primary mb-1">
                From Date *
              </label>
              <input
                type="date"
                id="leave-from-date"
                name="leaveFromDate"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="leave-to-date" className="block text-xs font-semibold text-text-primary mb-1">
                To Date *
              </label>
              <input
                type="date"
                id="leave-to-date"
                name="leaveToDate"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Duration Banner */}
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-xs">
            <span className="text-text-muted">Total Leave Duration:</span>
            <span className="font-bold text-purple-700 dark:text-purple-300 tabular-nums text-sm">
              {daysCount} {daysCount === 1 ? 'Calendar Day' : 'Calendar Days'}
            </span>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="leave-reason" className="block text-xs font-semibold text-text-primary mb-1">
              Reason / Medical Certificate Notes *
            </label>
            <textarea
              id="leave-reason"
              name="leaveReason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide context for manager approval (e.g., Annual family trip, doctor consultation)…"
              required
              className="w-full p-3 rounded-xl border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex-1 justify-center py-2.5 shadow-glow-primary/20"
            >
              {isSubmitting ? 'Submitting…' : 'Submit Leave Request'}
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
