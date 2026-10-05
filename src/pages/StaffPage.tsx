import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Users,
  UserCheck,
  Coffee,
  Award,
  Plus,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Clock,
  CalendarDays,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { staffService } from '@/services/staffService'
import { Staff, StaffStatus, StaffStatsSummary } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { StaffGrid } from '@/features/staff/StaffGrid'
import { StaffForm } from '@/features/staff/StaffForm'
import { StaffScheduleDrawer } from '@/features/staff/StaffScheduleDrawer'
import { StaffAttendanceView } from '@/features/staff/StaffAttendanceView'
import { StaffShiftsView } from '@/features/staff/StaffShiftsView'
import { StaffLeaveView } from '@/features/staff/StaffLeaveView'
import { StaffCalendarView } from '@/features/staff/StaffCalendarView'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

type StaffTab = 'directory' | 'attendance' | 'shifts' | 'leave' | 'calendar'

export const StaffPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  // Determine active tab from URL path
  const getTabFromPath = (): StaffTab => {
    const path = location.pathname.toLowerCase()
    if (path.includes('/staff/attendance')) return 'attendance'
    if (path.includes('/staff/shifts')) return 'shifts'
    if (path.includes('/staff/leave')) return 'leave'
    if (path.includes('/staff/calendar')) return 'calendar'
    const searchParams = new URLSearchParams(location.search)
    const tabParam = searchParams.get('tab')
    if (tabParam === 'attendance') return 'attendance'
    if (tabParam === 'shifts') return 'shifts'
    if (tabParam === 'leave') return 'leave'
    if (tabParam === 'calendar') return 'calendar'
    return 'directory'
  }

  const [activeTab, setActiveTab] = useState<StaffTab>(getTabFromPath())
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [stats, setStats] = useState<StaffStatsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Sync tab with URL changes
  useEffect(() => {
    setActiveTab(getTabFromPath())
  }, [location.pathname, location.search])

  // Drawer states
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [scheduleViewingStaff, setScheduleViewingStaff] = useState<Staff | null>(null)

  const loadData = async () => {
    try {
      const [list, summary] = await Promise.all([
        staffService.getAll(),
        staffService.getStatsSummary(),
      ])
      setStaffList(list)
      setStats(summary)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleTabChange = (tab: StaffTab) => {
    setActiveTab(tab)
    if (tab === 'directory') navigate('/staff')
    else if (tab === 'attendance') navigate('/staff/attendance')
    else if (tab === 'shifts') navigate('/staff/shifts')
    else if (tab === 'leave') navigate('/staff/leave')
    else if (tab === 'calendar') navigate('/staff/calendar')
  }

  const handleUpdateStatus = async (staffId: string, status: StaffStatus) => {
    try {
      const updated = await staffService.updateStatus(staffId, status)
      setStaffList((prev) => prev.map((s) => (s.id === staffId ? updated : s)))
      const summary = await staffService.getStatsSummary()
      setStats(summary)
      addToast({
        title: 'Status Updated',
        message: `${updated.name} marked as ${status}.`,
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

  const handleAddStaffSuccess = async (newStaff: Staff) => {
    await staffService.create(newStaff)
    await loadData()
  }

  const handleEditStaffSuccess = async (updatedStaff: Staff) => {
    await staffService.update(updatedStaff.id, updatedStaff)
    await loadData()
    setEditingStaff(null)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
            Staff & Workforce
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Manage your team specialists, live attendance, shift rosters, and leave approvals.
          </p>
        </div>

        {activeTab === 'directory' && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                setScheduleViewingStaff(null)
                setIsScheduleOpen(true)
              }}
              leftIcon={<Calendar className="h-4 w-4" />}
            >
              Staff Schedule
            </Button>

            <Button
              variant="primary"
              onClick={() => {
                setEditingStaff(null)
                setIsAddStaffOpen(true)
              }}
              leftIcon={<Plus className="h-4 w-4" />}
              className="shadow-glow-primary/30"
            >
              Add Staff
            </Button>
          </div>
        )}
      </div>

      {/* Modern Navigation Tabs */}
      <div className="border-b border-border">
        <nav
          className="flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-none"
          aria-label="Staff workstation navigation tabs"
        >
          <button
            type="button"
            onClick={() => handleTabChange('directory')}
            className={cn(
              'flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              activeTab === 'directory'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
            )}
          >
            <Users className="w-4 h-4" aria-hidden="true" />
            <span>Team Directory</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-muted text-text-muted">
              {staffList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('attendance')}
            className={cn(
              'flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              activeTab === 'attendance'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
            )}
          >
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>Live Attendance</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('shifts')}
            className={cn(
              'flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              activeTab === 'shifts'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
            )}
          >
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <span>Shifts & Rosters</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('leave')}
            className={cn(
              'flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              activeTab === 'leave'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
            )}
          >
            <Coffee className="w-4 h-4" aria-hidden="true" />
            <span>Leave Management</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('calendar')}
            className={cn(
              'flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              activeTab === 'calendar'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
            )}
          >
            <CalendarDays className="w-4 h-4" aria-hidden="true" />
            <span>Schedule Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/payroll')}
            className="flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 border-transparent text-text-muted hover:text-text-primary hover:border-border whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Wallet className="w-4 h-4" aria-hidden="true" />
            <span>Payroll & Commission</span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Team Directory (Existing Staff Management) */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Staff */}
            <Card hoverEffect>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-muted">Total Staff</span>
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Users className="h-4 w-4" aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary tabular-nums">
                    {stats?.totalStaff ?? staffList.length}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">Active salon specialists</p>
                </div>
              </CardContent>
            </Card>

            {/* Working Today */}
            <Card hoverEffect>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-muted">Working Today</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <UserCheck className="h-4 w-4" aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {stats?.workingToday ?? 0}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">Specialists on duty</p>
                </div>
              </CardContent>
            </Card>

            {/* On Leave */}
            <Card hoverEffect>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-muted">On Leave</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Coffee className="h-4 w-4" aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {stats?.onLeave ?? 0}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">Scheduled time off</p>
                </div>
              </CardContent>
            </Card>

            {/* Top Performer */}
            <Card hoverEffect className="relative overflow-hidden">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-muted">Top Performer</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Award className="h-4 w-4" aria-hidden="true" />
                  </div>
                </div>
                {stats?.topPerformer ? (
                  <div className="flex items-center gap-2.5 pt-0.5">
                    <Avatar
                      name={stats.topPerformer.name}
                      src={stats.topPerformer.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">
                        {stats.topPerformer.name}
                      </p>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
                        ★ {stats.topPerformer.rating.toFixed(1)} • {formatCurrency(stats.topPerformer.monthlyRevenue)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">Calculating…</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Staff Grid with Filters */}
          <StaffGrid
            staffList={staffList}
            onEditStaff={(s) => setEditingStaff(s)}
            onUpdateStatus={handleUpdateStatus}
            onViewSchedule={(s) => {
              setScheduleViewingStaff(s)
              setIsScheduleOpen(true)
            }}
          />
        </div>
      )}

      {/* Tab 2: Attendance */}
      {activeTab === 'attendance' && <StaffAttendanceView />}

      {/* Tab 3: Shifts & Rosters */}
      {activeTab === 'shifts' && <StaffShiftsView />}

      {/* Tab 4: Leave Management */}
      {activeTab === 'leave' && <StaffLeaveView />}

      {/* Tab 5: Schedule Calendar */}
      {activeTab === 'calendar' && <StaffCalendarView />}

      {/* Add Staff Drawer */}
      {isAddStaffOpen && (
        <StaffForm
          isOpen={isAddStaffOpen}
          onClose={() => setIsAddStaffOpen(false)}
          onSuccess={handleAddStaffSuccess}
        />
      )}

      {/* Edit Staff Drawer */}
      {editingStaff && (
        <StaffForm
          isOpen={Boolean(editingStaff)}
          onClose={() => setEditingStaff(null)}
          initialStaff={editingStaff}
          onSuccess={handleEditStaffSuccess}
        />
      )}

      {/* Staff Schedule Drawer */}
      <StaffScheduleDrawer
        isOpen={isScheduleOpen}
        onClose={() => {
          setIsScheduleOpen(false)
          setScheduleViewingStaff(null)
        }}
        staffList={staffList}
        selectedStaff={scheduleViewingStaff}
      />
    </div>
  )
}
