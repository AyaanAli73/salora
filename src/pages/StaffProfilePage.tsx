import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Star,
  Mail,
  Phone,
  Calendar,
  Clock,
  Scissors,
  DollarSign,
  Award,
  CheckCircle2,
  AlertCircle,
  Coffee,
  UserX,
  Edit,
  Shield,
  Briefcase,
  Layers,
  ChevronRight,
  FileText,
  Eye,
  TrendingUp,
  Wallet,
  Percent,
} from 'lucide-react'
import { staffService } from '@/services/staffService'
import { appointmentService } from '@/services/appointmentService'
import { reviewService } from '@/services/reviewService'
import { staffAttendanceService } from '@/services/staffAttendanceService'
import { payrollService } from '@/services/payrollService'
import {
  Staff,
  Appointment,
  StaffStatus,
  Review,
  StaffAttendanceSummary,
  StaffAttendanceRecord,
  StaffShift,
  StaffMonthlyPerformance,
  StaffCompensationConfig,
  PayrollRecord,
} from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { useToastStore } from '@/store/useToastStore'
import { StaffForm } from '@/features/staff/StaffForm'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { PayslipModal } from '@/features/payroll/PayslipModal'

export const StaffProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  const [staff, setStaff] = useState<Staff | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<
    'profile' | 'services' | 'schedule' | 'appointments' | 'attendance' | 'performance' | 'reviews'
  >('profile')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [staffReviews, setStaffReviews] = useState<Review[]>([])
  const [staffRatingData, setStaffRatingData] = useState<{ rating: number; reviewCount: number }>({ rating: 4.9, reviewCount: 48 })
  const [attendanceSummary, setAttendanceSummary] = useState<StaffAttendanceSummary | null>(null)
  const [staffAttendanceLogs, setStaffAttendanceLogs] = useState<StaffAttendanceRecord[]>([])
  const [staffShift, setStaffShift] = useState<StaffShift | undefined>(undefined)
  const [performanceData, setPerformanceData] = useState<StaffMonthlyPerformance | null>(null)
  const [staffCompensation, setStaffCompensation] = useState<StaffCompensationConfig | null>(null)
  const [staffPayrolls, setStaffPayrolls] = useState<PayrollRecord[]>([])
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null)

  useEffect(() => {
    let isMounted = true
    if (!id) return

    Promise.all([
      staffService.getById(id),
      appointmentService.getByStaffId(id),
      reviewService.getStaffRating(id),
      reviewService.getReviewsByStaff(id),
    ]).then(([staffData, apptData, ratingCalc, revs]) => {
      if (!isMounted) return
      setStaff(staffData || null)
      setAppointments(apptData || [])
      setStaffRatingData(ratingCalc)
      setStaffReviews(revs)

      // Staff attendance data
      const summary = staffAttendanceService.getStaffAttendanceSummary(id)
      const logs = staffAttendanceService.getAttendanceRecords({ staffId: id })
      const today = new Date().toISOString().split('T')[0]
      const shift = staffAttendanceService.getStaffShiftForDate(id, today)

      setAttendanceSummary(summary)
      setStaffAttendanceLogs(logs)
      setStaffShift(shift)

      // Staff payroll & performance data
      payrollService.getStaffMonthlyPerformance(id).then((perf) => {
        if (isMounted) setPerformanceData(perf)
      })
      const comp = payrollService.getCompensationConfig(id)
      const payrollHistory = payrollService.getStaffPayrollHistory(id)
      setStaffCompensation(comp)
      setStaffPayrolls(payrollHistory)

      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="p-12 text-center text-text-muted animate-pulse">
        Loading specialist profile…
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-text-primary">Staff Member Not Found</h2>
        <p className="text-xs text-text-muted">The requested staff profile does not exist.</p>
        <Button variant="primary" onClick={() => navigate('/staff')}>
          Back to Staff
        </Button>
      </div>
    )
  }

  const handleUpdateStatus = async (newStatus: StaffStatus) => {
    try {
      const updated = await staffService.updateStatus(staff.id, newStatus)
      setStaff(updated)
      addToast({
        title: 'Status Updated',
        message: `${staff.name} is now marked as ${newStatus}.`,
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Error',
        message: 'Could not update specialist status.',
        type: 'danger',
      })
    }
  }

  const effectiveStatus = staff.todayStatus || (staff.status === 'on-leave' ? 'on-leave' : staff.status === 'off-duty' ? 'off-duty' : 'available')

  const commissionAccrued = Math.round((staff.monthlyRevenue * (staff.commissionRate / 100)) * 10) / 10

  const tabs = [
    { id: 'profile', label: 'Profile & Contact' },
    { id: 'attendance', label: 'Attendance & Shifts', badge: attendanceSummary?.daysPresent ?? 0 },
    { id: 'services', label: 'Services', badge: staff.services?.length || staff.serviceIds?.length || 0 },
    { id: 'schedule', label: 'Weekly Schedule' },
    { id: 'appointments', label: 'Appointments', badge: appointments.length },
    { id: 'performance', label: 'Performance & Commission' },
    { id: 'reviews', label: 'Guest Reviews', badge: staffReviews.length },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Back button and breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link to="/staff" className="flex items-center gap-1 hover:text-text-primary transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Staff</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
        <span className="font-semibold text-text-primary truncate">{staff.name}</span>
      </div>

      {/* Hero Header Card */}
      <Card className="relative overflow-hidden border border-border">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-96 h-36 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent pointer-events-none" />

        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <Avatar
                name={staff.name}
                src={staff.avatarUrl}
                size="xl"
                status={effectiveStatus === 'available' ? 'online' : effectiveStatus === 'busy' ? 'busy' : 'offline'}
              />

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
                    {staff.name}
                  </h1>
                  <Badge variant="primary" size="md">
                    {staff.role}
                  </Badge>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      effectiveStatus === 'available'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : effectiveStatus === 'busy'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                        : effectiveStatus === 'on-leave'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        effectiveStatus === 'available'
                          ? 'bg-emerald-500 animate-pulse'
                          : effectiveStatus === 'busy'
                          ? 'bg-amber-500'
                          : effectiveStatus === 'on-leave'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    {effectiveStatus.replace('-', ' ')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-text-muted" />
                    {staff.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-text-muted" />
                    {staff.phone}
                  </span>
                  <span className="flex items-center gap-1 tabular-nums">
                    <Calendar className="h-3.5 w-3.5 text-text-muted" />
                    Joined {staff.joiningDate || 'Feb 2023'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2 self-start md:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                leftIcon={<Edit className="h-3.5 w-3.5" />}
              >
                Edit Profile
              </Button>

              <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border">
                <button
                  type="button"
                  title="Mark Available"
                  onClick={() => handleUpdateStatus('available')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    effectiveStatus === 'available'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-text-muted hover:text-emerald-600 hover:bg-surface'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Mark Busy"
                  onClick={() => handleUpdateStatus('busy')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    effectiveStatus === 'busy'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-text-muted hover:text-amber-600 hover:bg-surface'
                  }`}
                >
                  <AlertCircle className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Mark On Leave"
                  onClick={() => handleUpdateStatus('on-leave')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    effectiveStatus === 'on-leave'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-text-muted hover:text-amber-600 hover:bg-surface'
                  }`}
                >
                  <Coffee className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-text-muted">Appointments Completed</span>
            <p className="text-xl font-bold text-text-primary tabular-nums">
              {staff.appointmentsCompleted} sessions
            </p>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              +12% vs last month
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-text-muted">Revenue Generated</span>
            <p className="text-xl font-bold text-text-primary tabular-nums">
              {formatCurrency(staff.monthlyRevenue)}
            </p>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Top 10% salon producer
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-text-muted">Average Rating</span>
            <div className="flex items-center gap-1.5">
              <p className="text-xl font-bold text-text-primary tabular-nums">
                {staffRatingData.rating.toFixed(1)}
              </p>
              <div className="flex items-center text-amber-500">
                <Star className="h-4 w-4 fill-current" />
              </div>
            </div>
            <span className="text-[11px] text-text-muted tabular-nums">
              Based on {staffRatingData.reviewCount} client reviews
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-text-muted">Commission Rate</span>
            <p className="text-xl font-bold text-primary tabular-nums">
              {staff.commissionRate}%
            </p>
            <span className="text-[11px] text-text-muted tabular-nums">
              Est. Accrued: {formatCurrency(commissionAccrued)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
        variant="underline"
      />

      {/* Tab 1: Profile & Contact */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Specialist Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Biography & Background
                </span>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  {staff.bio ||
                    `${staff.name} is a certified ${staff.role} with extensive experience delivering bespoke salon rituals, precision styling, and tailored client treatments.`}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Key Specialties
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {staff.specialties.map((spec) => (
                    <Badge key={spec} variant="primary" size="md">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-border grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-text-muted">Hourly Rate</span>
                  <p className="text-sm font-bold text-text-primary tabular-nums mt-0.5">
                    {formatCurrency(staff.hourlyRate || 80)} / hr
                  </p>
                </div>
                <div>
                  <span className="text-xs text-text-muted">Commission Split</span>
                  <p className="text-sm font-bold text-text-primary tabular-nums mt-0.5">
                    {staff.commissionRate}% service rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact & Emergency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-border">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-text-muted" />
                    <div>
                      <span className="text-[11px] text-text-muted">Work Email</span>
                      <p className="text-xs font-semibold text-text-primary">{staff.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`mailto:${staff.email}`)}
                  >
                    Email
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-border">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-text-muted" />
                    <div>
                      <span className="text-[11px] text-text-muted">Phone Number</span>
                      <p className="text-xs font-semibold text-text-primary">{staff.phone}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`tel:${staff.phone}`)}
                  >
                    Call
                  </Button>
                </div>
              </div>

              {staff.emergencyContact && (
                <div className="p-3.5 rounded-xl border border-border bg-surface-subtle/50 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-bold text-text-primary">
                      Emergency Contact
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    {staff.emergencyContact.name} ({staff.emergencyContact.relationship}) —{' '}
                    <strong className="text-text-primary">{staff.emergencyContact.phone}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Attendance & Shifts (Requirement 12) */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Top 5 Attendance Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Days Present */}
            <Card hoverEffect>
              <CardContent className="p-4 space-y-1.5">
                <span className="text-xs font-semibold text-text-muted">Days Present</span>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {attendanceSummary?.daysPresent ?? 0}
                </p>
                <p className="text-[11px] text-text-muted">Punctual & verified</p>
              </CardContent>
            </Card>

            {/* Days Absent */}
            <Card hoverEffect>
              <CardContent className="p-4 space-y-1.5">
                <span className="text-xs font-semibold text-text-muted">Days Absent</span>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  {attendanceSummary?.daysAbsent ?? 0}
                </p>
                <p className="text-[11px] text-text-muted">Unexcused missed</p>
              </CardContent>
            </Card>

            {/* Late Count */}
            <Card hoverEffect>
              <CardContent className="p-4 space-y-1.5">
                <span className="text-xs font-semibold text-text-muted">Late Count</span>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {attendanceSummary?.lateCount ?? 0}
                </p>
                <p className="text-[11px] text-text-muted">&gt; 5m after shift</p>
              </CardContent>
            </Card>

            {/* Total Hours */}
            <Card hoverEffect>
              <CardContent className="p-4 space-y-1.5">
                <span className="text-xs font-semibold text-text-muted">Total Hours</span>
                <p className="text-2xl font-bold text-primary tabular-nums">
                  {attendanceSummary?.totalHours ?? 0}h
                </p>
                <p className="text-[11px] text-text-muted">Net of unpaid breaks</p>
              </CardContent>
            </Card>

            {/* Leave Used */}
            <Card hoverEffect>
              <CardContent className="p-4 space-y-1.5">
                <span className="text-xs font-semibold text-text-muted">Leave Used</span>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                  {attendanceSummary?.leaveUsed ?? 0}d
                </p>
                <p className="text-[11px] text-text-muted">Approved requests</p>
              </CardContent>
            </Card>
          </div>

          {/* Assigned Shift Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-text-primary">
                Assigned Shift & Operational Schedule
              </CardTitle>
              {staffShift && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: staffShift.color || '#3B82F6' }}
                >
                  {staffShift.name} ({staffShift.code})
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {staffShift ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border text-xs">
                  <div>
                    <span className="text-text-muted block">Working Window</span>
                    <span className="font-bold text-text-primary text-sm tabular-nums">
                      {staffShift.startTime} — {staffShift.endTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block">Unpaid Break Deduction</span>
                    <span className="font-semibold text-text-primary">
                      {staffShift.unpaidBreakMinutes} minutes
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block">Punctuality Grace Period</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      5 minutes standard
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-muted">No specific shift assigned. Using salon default hours (10:00 — 19:00).</p>
              )}
            </CardContent>
          </Card>

          {/* Specialist Attendance Logs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-text-primary">
                Recent Attendance & Clock Activity
              </CardTitle>
              <span className="text-xs text-text-muted">
                {staffAttendanceLogs.length} verified logs
              </span>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-text-muted font-semibold select-none">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Clock In</th>
                    <th className="py-2.5 px-4">Clock Out</th>
                    <th className="py-2.5 px-4">Working Hours</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {staffAttendanceLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-text-muted">
                        No historical attendance recorded for this specialist yet.
                      </td>
                    </tr>
                  ) : (
                    staffAttendanceLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/20">
                        <td className="py-2.5 px-4 font-medium text-text-primary tabular-nums">
                          {log.date}
                        </td>
                        <td className="py-2.5 px-4 tabular-nums">
                          {log.clockIn || '—'}
                          {log.lateMinutes && log.lateMinutes > 0 ? (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 font-bold">
                              +{log.lateMinutes}m
                            </span>
                          ) : null}
                        </td>
                        <td className="py-2.5 px-4 tabular-nums">{log.clockOut || '—'}</td>
                        <td className="py-2.5 px-4 font-bold tabular-nums">
                          {log.workingHours !== undefined ? `${log.workingHours} hrs` : '—'}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge
                            variant={
                              log.status === 'PRESENT'
                                ? 'success'
                                : log.status === 'LATE'
                                ? 'warning'
                                : log.status === 'LEAVE'
                                ? 'danger'
                                : 'default'
                            }
                            size="sm"
                          >
                            {log.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-text-muted max-w-[200px] truncate">
                          {log.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Services Assigned */}
      {activeTab === 'services' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Assigned Services</CardTitle>
            <span className="text-xs text-text-muted">
              {staff.services?.length || staff.serviceIds?.length || 0} treatments enabled
            </span>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(staff.services || []).map((srvName) => (
                <div
                  key={srvName}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-surface hover:border-primary/40 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Scissors className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">{srvName}</p>
                    <span className="text-[11px] text-text-muted">Active Treatment</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Schedule */}
      {activeTab === 'schedule' && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Working Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
              {staff.weeklySchedule.map((schedule) => (
                <div
                  key={schedule.day}
                  className="flex items-center justify-between p-3.5 hover:bg-surface-subtle/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-xs font-bold text-text-primary uppercase">
                      {schedule.day}
                    </span>
                    {schedule.isWorking ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        Working
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Day Off
                      </span>
                    )}
                  </div>

                  {schedule.isWorking ? (
                    <div className="flex items-center gap-4 text-xs tabular-nums text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-text-muted" />
                        <span>
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                      </div>
                      {schedule.breakTime && (
                        <Badge variant="default" size="sm">
                          Break: {schedule.breakTime.startTime} - {schedule.breakTime.endTime}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted italic">Scheduled Off</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Appointments */}
      {activeTab === 'appointments' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Specialist Bookings</CardTitle>
            <span className="text-xs text-text-muted">
              {appointments.length} appointments on record
            </span>
          </CardHeader>
          <CardContent>
            {appointments.length > 0 ? (
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-surface-subtle/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={appt.clientName} src={appt.clientAvatar} size="md" />
                      <div>
                        <h2 className="text-xs font-bold text-text-primary">{appt.clientName}</h2>
                        <p className="text-xs text-text-muted">{appt.serviceName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs tabular-nums">
                      <div className="text-right sm:text-left">
                        <span className="font-semibold text-text-primary block">{appt.date}</span>
                        <span className="text-text-muted">
                          {appt.startTime} - {appt.endTime}
                        </span>
                      </div>

                      <span className="font-bold text-text-primary">
                        {formatCurrency(appt.totalAmount)}
                      </span>

                      <Badge variant="primary" size="sm" className="capitalize">
                        {appt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-text-muted text-xs">
                No appointments assigned to this specialist yet.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Performance & Commission */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Monthly Performance KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-text-muted">Completed Sessions</span>
                <p className="text-2xl font-bold text-text-primary tabular-nums">
                  {performanceData?.servicesCompletedCount ?? staff.appointmentsCompleted}
                </p>
                <p className="text-[11px] text-text-muted">
                  Client retention rate: <strong className="text-text-primary">94%</strong>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-text-muted">Total Gross Revenue</span>
                <p className="text-2xl font-bold text-text-primary tabular-nums">
                  {formatCurrency(performanceData?.totalRevenueGenerated ?? staff.monthlyRevenue)}
                </p>
                <p className="text-[11px] text-text-muted">
                  Eligible paid services: <strong className="text-text-primary">{performanceData?.servicesCompletedCount ?? staff.appointmentsCompleted}</strong>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-text-muted">Commission Earned (Month)</span>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(performanceData?.commissionEarned ?? 0)}
                </p>
                <p className="text-[11px] text-text-muted">
                  Split rule: <strong className="text-text-primary">{staffCompensation?.defaultCommissionRate ?? staff.commissionRate}% standard</strong>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-text-muted">Client Rating</span>
                <div className="flex items-center gap-1.5">
                  <p className="text-2xl font-bold text-text-primary tabular-nums">
                    {(performanceData?.averageRating ?? staff.rating).toFixed(1)}
                  </p>
                  <Star className="h-4 w-4 text-amber-500 fill-current" />
                </div>
                <p className="text-[11px] text-text-muted">
                  Verified reviews: <strong className="text-text-primary">{staffRatingData.reviewCount || staff.reviewCount}</strong>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Current Compensation & Advances Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-bold">Compensation Package & Earnings</CardTitle>
                  </div>
                  <Badge variant="primary" size="sm" className="capitalize">
                    {staffCompensation?.compensationType.replace('_', ' ') || 'Fixed + Commission'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-surface-hover/50 border border-border">
                    <span className="text-[11px] text-text-muted block">Base Salary</span>
                    <span className="text-base font-bold text-text-primary tabular-nums">
                      {staffCompensation?.compensationType === 'HOURLY'
                        ? `${formatCurrency(staffCompensation?.hourlyRate || 0)}/hr`
                        : staffCompensation?.compensationType === 'COMMISSION_ONLY'
                        ? '₹0 (Comm. Only)'
                        : formatCurrency(staffCompensation?.baseSalary || 0)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-hover/50 border border-border">
                    <span className="text-[11px] text-text-muted block">Standard Commission</span>
                    <span className="text-base font-bold text-primary tabular-nums">
                      {staffCompensation?.defaultCommissionRate ?? staff.commissionRate}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-hover/50 border border-border">
                    <span className="text-[11px] text-text-muted block">Estimated Net Period</span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(
                        (performanceData?.baseSalary ?? (staffCompensation?.baseSalary || 0)) +
                          (performanceData?.commissionEarned ?? 0)
                      )}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-hover/50 border border-border">
                    <span className="text-[11px] text-text-muted block">Bank On File</span>
                    <span className="text-xs font-semibold text-text-primary block truncate">
                      {staffCompensation?.bankDetails?.bankName || 'HDFC Bank'}
                    </span>
                    <span className="text-[10px] text-text-muted tabular-nums">
                      •••• {staffCompensation?.bankDetails?.accountNumber?.slice(-4) || '9012'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-text-muted leading-relaxed bg-surface p-3.5 rounded-xl border border-border flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-text-primary">Deterministic Commission Policy: </span>
                    Commissions are computed exclusively from fully paid client services. Cancelled appointments, unpaid tokens, and refunded invoices are automatically excluded to preserve financial integrity.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advance Balance Card */}
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-bold">Salary Advances</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <span className="text-xs text-text-muted">Outstanding Advance Balance</span>
                  <p className="text-2xl font-bold text-text-primary tabular-nums mt-1">
                    {formatCurrency(performanceData?.remainingAdvanceBalance ?? 0)}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Total advances taken this month:{' '}
                    <strong className="text-text-primary">
                      {formatCurrency(performanceData?.advancesTaken ?? 0)}
                    </strong>
                  </p>
                </div>

                {Number(performanceData?.remainingAdvanceBalance || 0) > 0 ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                    <strong>Auto-Recovery Active:</strong> Outstanding advances will be adjusted against net pay during monthly payroll disbursement.
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>No pending advance balances for this specialist.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payroll History Table & Payslips */}
          <Card>
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Payroll History & Salary Slips</CardTitle>
                <p className="text-xs text-text-muted mt-0.5">
                  Settled and active salary disbursements for {staff.name}
                </p>
              </div>
              <Badge variant="default" size="sm">
                {staffPayrolls.length} Records
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {staffPayrolls.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-surface-hover/50 text-text-muted font-semibold border-b border-border">
                      <tr>
                        <th className="py-3 px-4">Slip #</th>
                        <th className="py-3 px-4">Period</th>
                        <th className="py-3 px-4 text-right">Base Salary</th>
                        <th className="py-3 px-4 text-right">Commission</th>
                        <th className="py-3 px-4 text-right">Bonus</th>
                        <th className="py-3 px-4 text-right">Deductions</th>
                        <th className="py-3 px-4 text-right">Advances</th>
                        <th className="py-3 px-4 text-right">Net Pay</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {staffPayrolls.map((pr) => (
                        <tr key={pr.id} className="hover:bg-surface-hover/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-text-primary">
                            {pr.payrollNumber}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-text-primary block">
                              {pr.periodStart} - {pr.periodEnd}
                            </span>
                            {pr.paidAt && (
                              <span className="text-[10px] text-text-muted">
                                Paid {formatDate(pr.paidAt)}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium tabular-nums">
                            {formatCurrency(pr.baseSalary)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(pr.commission)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(pr.totalBonuses)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium tabular-nums text-rose-500">
                            -{formatCurrency(pr.totalDeductions)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium tabular-nums text-amber-600 dark:text-amber-400">
                            -{formatCurrency(pr.totalAdvancesDeducted)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-sm tabular-nums text-text-primary">
                            {formatCurrency(pr.netPay)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Badge
                              variant={
                                pr.status === 'PAID'
                                  ? 'success'
                                  : pr.status === 'APPROVED'
                                  ? 'info'
                                  : pr.status === 'CALCULATED'
                                  ? 'warning'
                                  : pr.status === 'VOID'
                                  ? 'danger'
                                  : 'default'
                              }
                              size="sm"
                            >
                              {pr.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs flex items-center gap-1.5 mx-auto"
                              onClick={() => setSelectedPayslip(pr)}
                            >
                              <FileText className="w-3.5 h-3.5 text-primary" />
                              <span>View Slip</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-text-muted text-xs">
                  No payroll records generated for this specialist yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 6: Guest Reviews & Ratings */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-border">
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Client Reviews for {staff.name}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Verified customer ratings and testimonials across treatments
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 self-start sm:self-auto">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>
                {staffRatingData.rating.toFixed(1)} Rating ({staffRatingData.reviewCount} Reviews)
              </span>
            </span>
          </div>

          {staffReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staffReviews.map((rev) => (
                <ReviewCard key={rev.id} review={rev} showStaff={false} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center text-xs text-text-muted space-y-2 border border-border">
              <Star className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="font-semibold text-text-primary">No direct reviews recorded yet</p>
              <p>Reviews submitted by guests after their appointments with {staff.name} will appear here.</p>
            </Card>
          )}
        </div>
      )}

      {/* Edit Staff Drawer */}
      {isEditModalOpen && (
        <StaffForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialStaff={staff}
          onSuccess={(updated) => {
            setStaff(updated)
            staffService.update(staff.id, updated)
          }}
        />
      )}

      {/* Salary Slip Modal */}
      {selectedPayslip && (
        <PayslipModal
          isOpen={Boolean(selectedPayslip)}
          onClose={() => setSelectedPayslip(null)}
          payroll={selectedPayslip}
        />
      )}
    </div>
  )
}
