import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Coffee,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  Laptop,
} from 'lucide-react'
import {
  Staff,
  StaffAttendanceRecord,
  AttendanceStatus,
  AttendanceDashboardStats,
} from '@/types'
import { staffService } from '@/services/staffService'
import { staffAttendanceService } from '@/services/staffAttendanceService'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ClockInOutModal } from './ClockInOutModal'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

const STATUS_BADGE_MAP: Record<
  AttendanceStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'accent' | 'primary' }
> = {
  PRESENT: { label: 'Present', variant: 'success' },
  LATE: { label: 'Late', variant: 'warning' },
  HALF_DAY: { label: 'Half Day', variant: 'accent' },
  LEAVE: { label: 'On Leave', variant: 'danger' },
  ABSENT: { label: 'Absent', variant: 'danger' },
  OFF_DAY: { label: 'Off Day', variant: 'default' },
}

export const StaffAttendanceView: React.FC = () => {
  const { addToast } = useToastStore()
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([])
  const [stats, setStats] = useState<AttendanceDashboardStats | null>(null)
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [selectedStaffId, setSelectedStaffId] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal
  const [isClockModalOpen, setIsClockModalOpen] = useState(false)
  const [modalStaffId, setModalStaffId] = useState<string | undefined>(undefined)

  const loadData = async () => {
    try {
      const [allStaff, allRecs, todayStats] = await Promise.all([
        staffService.getAll(),
        Promise.resolve(staffAttendanceService.getAllAttendance()),
        Promise.resolve(staffAttendanceService.getTodayStats()),
      ])
      setStaffList(allStaff)
      setRecords(allRecs)
      setStats(todayStats)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Date filter
      if (selectedDate && r.date !== selectedDate) return false
      // Staff filter
      if (selectedStaffId !== 'ALL' && r.staffId !== selectedStaffId) return false
      // Status filter
      if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesStaff = r.staffName.toLowerCase().includes(q)
        const matchesNotes = r.notes?.toLowerCase().includes(q)
        const matchesShift = r.shiftName?.toLowerCase().includes(q)
        if (!matchesStaff && !matchesNotes && !matchesShift) return false
      }
      return true
    })
  }, [records, selectedDate, selectedStaffId, selectedStatus, searchQuery])

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

  const handleExportCSV = () => {
    const headers = ['Staff Name', 'Role', 'Date', 'Shift', 'Clock In', 'Clock Out', 'Hours', 'Status', 'Late Minutes', 'Notes']
    const rows = filteredRecords.map((r) => [
      `"${r.staffName}"`,
      `"${r.staffRole || ''}"`,
      r.date,
      `"${r.shiftName || ''}"`,
      r.clockIn || '',
      r.clockOut || '',
      r.workingHours !== undefined ? r.workingHours : '',
      r.status,
      r.lateMinutes || 0,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `SALORA_Attendance_${selectedDate || 'all'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    addToast({
      title: 'Attendance Exported',
      message: `Downloaded ${filteredRecords.length} records to CSV.`,
      type: 'info',
    })
  }

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Cards (Present Today, Absent Today, Late, On Leave) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Present Today */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Present Today</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-text-primary tabular-nums">
                  {stats?.presentToday ?? 0}
                </p>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {stats?.attendanceRate ?? 0}% rate
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                On shift & clocked in
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Absent Today */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Absent Today</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <UserX className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {stats?.absentToday ?? 0}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">Unexcused or missing clock-in</p>
            </div>
          </CardContent>
        </Card>

        {/* Late Today */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Late</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {stats?.lateToday ?? 0}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">&gt; 5m after shift start</p>
            </div>
          </CardContent>
        </Card>

        {/* On Leave */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">On Leave</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Calendar className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {stats?.onLeaveToday ?? 0}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">Approved leave requests</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar & Filter Controls */}
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
                placeholder="Search staff, shifts, or notes…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
              />
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />}
              >
                Export CSV
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setModalStaffId(undefined)
                  setIsClockModalOpen(true)
                }}
                leftIcon={<Clock className="h-3.5 w-3.5" />}
                className="shadow-glow-primary/20"
              >
                Clock In / Out
              </Button>
            </div>
          </div>

          {/* Secondary Filters: Date, Staff, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-border">
            {/* Date filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="filter-date" className="text-xs font-semibold text-text-muted shrink-0">
                Date:
              </label>
              <input
                type="date"
                id="filter-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-xs text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  aria-label="Clear date filter"
                  className="text-[11px] text-text-muted hover:text-text-primary px-1 font-medium"
                >
                  All
                </button>
              )}
            </div>

            {/* Staff filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="filter-staff" className="text-xs font-semibold text-text-muted shrink-0">
                Staff:
              </label>
              <select
                id="filter-staff"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
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

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="filter-status" className="text-xs font-semibold text-text-muted shrink-0">
                Status:
              </label>
              <select
                id="filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as AttendanceStatus | 'ALL')}
                className="w-full h-8 px-2 rounded-lg border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="LATE">Late Arrival</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="LEAVE">On Leave</option>
                <option value="ABSENT">Absent</option>
                <option value="OFF_DAY">Off Day</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-text-muted font-semibold select-none">
              <tr>
                <th className="py-3 px-4">Specialist</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Working Hours</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes & Terminal</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock className="w-8 h-8 text-text-muted/50" aria-hidden="true" />
                      <p className="text-sm font-semibold text-text-primary">No attendance records found</p>
                      <p className="text-xs">Adjust your date or status filters, or record a new clock-in.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDate('')
                          setSelectedStaffId('ALL')
                          setSelectedStatus('ALL')
                          setSearchQuery('')
                        }}
                        className="mt-2"
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const statusConfig = STATUS_BADGE_MAP[r.status] || {
                    label: r.status,
                    variant: 'default',
                  }
                  const openBreak = r.breaks?.find((b) => !b.breakEndTime)
                  const totalBreakMins = (r.breaks || []).reduce(
                    (sum, b) => sum + (b.durationMinutes || 0),
                    0
                  )

                  return (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      {/* Specialist */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.staffName} src={r.avatarUrl} size="sm" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary truncate">
                              {r.staffName}
                            </span>
                            <span className="text-[11px] text-text-muted truncate">
                              {r.staffRole || 'Stylist'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-text-muted whitespace-nowrap">
                        <span className="font-medium text-text-primary">
                          {formatDateDisplay(r.date)}
                        </span>
                        {r.shiftName && (
                          <span className="block text-[10px] text-text-muted truncate max-w-[140px]">
                            {r.shiftName}
                          </span>
                        )}
                      </td>

                      {/* Clock In */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {r.clockIn ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-text-primary tabular-nums">
                              {r.clockIn}
                            </span>
                            {r.lateMinutes && r.lateMinutes > 0 ? (
                              <span
                                title={`${r.lateMinutes} mins late`}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 tabular-nums border border-amber-500/20"
                              >
                                +{r.lateMinutes}m
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-text-muted italic">—</span>
                        )}
                      </td>

                      {/* Clock Out */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {r.clockOut ? (
                          <span className="font-semibold text-text-primary tabular-nums">
                            {r.clockOut}
                          </span>
                        ) : r.clockIn ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Working now
                          </span>
                        ) : (
                          <span className="text-text-muted italic">—</span>
                        )}
                      </td>

                      {/* Working Hours */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-text-primary tabular-nums">
                            {r.workingHours !== undefined ? `${r.workingHours} hrs` : '—'}
                          </span>
                          {r.breaks && r.breaks.length > 0 && (
                            <span className="text-[10px] text-text-muted">
                              {r.breaks.length} break{r.breaks.length > 1 ? 's' : ''} ({totalBreakMins}m)
                            </span>
                          )}
                          {openBreak && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              On break currently
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant={statusConfig.variant} size="sm">
                          {statusConfig.label}
                        </Badge>
                      </td>

                      {/* Notes & Terminal Metadata */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="text-[11px] text-text-primary truncate" title={r.notes}>
                          {r.notes || '—'}
                        </p>
                        {r.locationDeviceMetadata?.device && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-text-muted truncate">
                            <Laptop className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                            {r.locationDeviceMetadata.device}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setModalStaffId(r.staffId)
                            setIsClockModalOpen(true)
                          }}
                          className="text-xs h-7 px-2"
                        >
                          Clock Action
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Clock In / Out Modal */}
      {isClockModalOpen && (
        <ClockInOutModal
          isOpen={isClockModalOpen}
          onClose={() => setIsClockModalOpen(false)}
          onSuccess={loadData}
          staffList={staffList}
          preselectedStaffId={modalStaffId}
        />
      )}
    </div>
  )
}
