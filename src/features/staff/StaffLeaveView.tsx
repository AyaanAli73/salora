import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Users,
  Check,
  X,
  FileText,
  ShieldAlert,
} from 'lucide-react'
import {
  Staff,
  StaffLeaveRequest,
  LeaveRequestStatus,
  LeaveType,
} from '@/types'
import { staffService } from '@/services/staffService'
import { staffAttendanceService } from '@/services/staffAttendanceService'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { RequestLeaveModal } from './RequestLeaveModal'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

const STATUS_BADGE_CONFIG: Record<
  LeaveRequestStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary' }
> = {
  PENDING: { label: 'Pending Approval', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
  CANCELLED: { label: 'Cancelled', variant: 'default' },
}

export const StaffLeaveView: React.FC = () => {
  const { addToast } = useToastStore()
  const [leaves, setLeaves] = useState<StaffLeaveRequest[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [statusFilter, setStatusFilter] = useState<LeaveRequestStatus | 'ALL'>('ALL')
  const [typeFilter, setTypeFilter] = useState<LeaveType | 'ALL'>('ALL')
  const [staffFilter, setStaffFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [rejectingLeave, setRejectingLeave] = useState<StaffLeaveRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const loadData = async () => {
    try {
      const [allStaff, allLeaves] = await Promise.all([
        staffService.getAll(),
        Promise.resolve(staffAttendanceService.getLeaveRequests()),
      ])
      setStaffList(allStaff)
      setLeaves(allLeaves)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // KPI calculations
  const pendingRequests = useMemo(
    () => leaves.filter((l) => l.status === 'PENDING'),
    [leaves]
  )
  const approvedRequests = useMemo(
    () => leaves.filter((l) => l.status === 'APPROVED'),
    [leaves]
  )
  const todayStr = new Date().toISOString().split('T')[0]
  const onLeaveTodayCount = useMemo(
    () =>
      leaves.filter(
        (l) => l.status === 'APPROVED' && todayStr >= l.fromDate && todayStr <= l.toDate
      ).length,
    [leaves, todayStr]
  )
  const totalDaysTaken = useMemo(
    () =>
      approvedRequests.reduce((sum, l) => sum + (l.daysCount || 0), 0),
    [approvedRequests]
  )

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      if (statusFilter !== 'ALL' && l.status !== statusFilter) return false
      if (typeFilter !== 'ALL' && l.leaveType !== typeFilter) return false
      if (staffFilter !== 'ALL' && l.staffId !== staffFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = l.staffName.toLowerCase().includes(q)
        const matchesReason = l.reason.toLowerCase().includes(q)
        if (!matchesName && !matchesReason) return false
      }
      return true
    })
  }, [leaves, statusFilter, typeFilter, staffFilter, searchQuery])

  const handleApprove = (leave: StaffLeaveRequest) => {
    try {
      staffAttendanceService.approveLeave(leave.id, 'Ayaan (Owner)')
      addToast({
        title: 'Leave Approved',
        message: `Approved ${leave.leaveType} leave for ${leave.staffName} (${leave.daysCount} days). Staff availability updated.`,
        type: 'success',
      })
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not approve leave'
      addToast({ title: 'Error', message: msg, type: 'danger' })
    }
  }

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingLeave) return
    if (!rejectionReason.trim()) {
      addToast({ title: 'Validation Error', message: 'Please provide a rejection reason.', type: 'danger' })
      return
    }

    try {
      staffAttendanceService.rejectLeave(
        rejectingLeave.id,
        rejectionReason,
        'Ayaan (Owner)'
      )
      addToast({
        title: 'Leave Rejected',
        message: `Leave request for ${rejectingLeave.staffName} has been rejected.`,
        type: 'info',
      })
      setRejectingLeave(null)
      setRejectionReason('')
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not reject leave'
      addToast({ title: 'Error', message: msg, type: 'danger' })
    }
  }

  const formatDateDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number)
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(y, m - 1, d))
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Approvals */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Pending Approvals</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-text-primary tabular-nums">
                  {pendingRequests.length}
                </p>
                {pendingRequests.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Action required
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">Awaiting manager decision</p>
            </div>
          </CardContent>
        </Card>

        {/* Approved Leaves */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Approved Requests</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {approvedRequests.length}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">Confirmed salon leaves</p>
            </div>
          </CardContent>
        </Card>

        {/* On Leave Today */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">On Leave Today</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Calendar className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {onLeaveTodayCount}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">Excluded from booking slots</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Days Taken */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Total Leave Days</span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {totalDaysTaken}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">Accumulated team time-off</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Pending Approval Queue (Highlighted Action Section) */}
      {pendingRequests.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="p-4 pb-2 border-b border-amber-500/10 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <CardTitle className="text-sm font-bold text-text-primary">
                Manager Approval Queue ({pendingRequests.length} Pending)
              </CardTitle>
            </div>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Immediate attention
            </span>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-white dark:bg-card border border-border space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={req.staffName} src={req.avatarUrl} size="md" />
                      <div>
                        <h4 className="font-bold text-sm text-text-primary">{req.staffName}</h4>
                        <p className="text-[11px] text-text-muted">{req.staffRole || 'Stylist'}</p>
                      </div>
                    </div>
                    <Badge variant="warning" size="sm">
                      {req.leaveType} Leave
                    </Badge>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Dates:</span>
                      <span className="font-semibold text-text-primary tabular-nums">
                        {formatDateDisplay(req.fromDate)} — {formatDateDisplay(req.toDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Duration:</span>
                      <span className="font-bold text-primary tabular-nums">
                        {req.daysCount} {req.daysCount === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-text-muted italic bg-muted/10 p-2 rounded-lg border border-border/50">
                    &quot;{req.reason}&quot;
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(req)}
                      leftIcon={<Check className="h-3.5 w-3.5" />}
                      className="flex-1 justify-center shadow-glow-primary/20"
                    >
                      Approve Leave
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setRejectingLeave(req)
                        setRejectionReason('')
                      }}
                      leftIcon={<X className="h-3.5 w-3.5" />}
                      className="flex-1 justify-center"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Action Bar & Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leave requests by specialist or reason…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
              />
            </div>

            {/* Request Leave Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRequestModalOpen(true)}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              className="shadow-glow-primary/20"
            >
              Request Leave
            </Button>
          </div>

          {/* Secondary Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-border">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="leave-filter-status" className="text-xs font-semibold text-text-muted shrink-0">
                Status:
              </label>
              <select
                id="leave-filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LeaveRequestStatus | 'ALL')}
                className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Leave Type Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="leave-filter-type" className="text-xs font-semibold text-text-muted shrink-0">
                Type:
              </label>
              <select
                id="leave-filter-type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as LeaveType | 'ALL')}
                className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                <option value="ALL">All Leave Types</option>
                <option value="Casual">Casual</option>
                <option value="Sick">Sick</option>
                <option value="Personal">Personal</option>
                <option value="Emergency">Emergency</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Staff Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="leave-filter-staff" className="text-xs font-semibold text-text-muted shrink-0">
                Staff:
              </label>
              <select
                id="leave-filter-staff"
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                <option value="ALL">All Specialists</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Leave History & All Requests Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-text-muted font-semibold select-none">
              <tr>
                <th className="py-3 px-4">Specialist</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">From</th>
                <th className="py-3 px-4">To</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reason & Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar className="w-8 h-8 text-text-muted/50" aria-hidden="true" />
                      <p className="text-sm font-semibold text-text-primary">No leave records found</p>
                      <p className="text-xs">Adjust your status/type filters or submit a new leave request.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => {
                  const cfg = STATUS_BADGE_CONFIG[l.status] || {
                    label: l.status,
                    variant: 'default',
                  }
                  return (
                    <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={l.staffName} src={l.avatarUrl} size="sm" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary truncate">
                              {l.staffName}
                            </span>
                            <span className="text-[10px] text-text-muted truncate">
                              {l.staffRole || 'Stylist'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-text-primary">
                        {l.leaveType}
                      </td>
                      <td className="py-3 px-4 text-text-muted tabular-nums whitespace-nowrap">
                        {formatDateDisplay(l.fromDate)}
                      </td>
                      <td className="py-3 px-4 text-text-muted tabular-nums whitespace-nowrap">
                        {formatDateDisplay(l.toDate)}
                      </td>
                      <td className="py-3 px-4 font-bold text-text-primary tabular-nums">
                        {l.daysCount} d
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant={cfg.variant} size="sm">
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="text-[11px] text-text-primary truncate" title={l.reason}>
                          {l.reason}
                        </p>
                        {l.rejectionReason && (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 block truncate">
                            Rejected: {l.rejectionReason}
                          </span>
                        )}
                        {l.approvedBy && l.status === 'APPROVED' && (
                          <span className="text-[10px] text-text-muted block truncate">
                            Approved by {l.approvedBy}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {l.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(l)}
                              className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 h-7 px-2"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRejectingLeave(l)
                                setRejectionReason('')
                              }}
                              className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-7 px-2"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : l.status === 'APPROVED' ? (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Confirmed
                          </span>
                        ) : (
                          <span className="text-[11px] text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Request Leave Modal */}
      {isRequestModalOpen && (
        <RequestLeaveModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          onSuccess={loadData}
          staffList={staffList}
        />
      )}

      {/* Reject Leave Prompt Modal */}
      {rejectingLeave && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-leave-modal-title"
        >
          <div className="relative w-full max-w-md bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="reject-leave-modal-title" className="text-base font-bold text-text-primary">
                Reject Leave Request
              </h3>
              <button
                type="button"
                onClick={() => setRejectingLeave(null)}
                aria-label="Close rejection dialog"
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Specify the reason for declining {rejectingLeave.staffName}&apos;s {rejectingLeave.leaveType} leave request ({rejectingLeave.fromDate} to {rejectingLeave.toDate}).
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label htmlFor="rejection-reason" className="block text-xs font-semibold text-text-primary mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  id="rejection-reason"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Critical salon bookings scheduled, minimum staffing threshold not met…"
                  required
                  className="w-full p-3 rounded-xl border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="danger"
                  className="flex-1 justify-center"
                >
                  Confirm Rejection
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectingLeave(null)}
                  className="w-24 justify-center"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
