import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  UserPlus,
  List,
  CalendarDays,
  Columns,
  Grid,
  Layers,
  Hash,
  Sparkles,
} from 'lucide-react'
import { appointmentService } from '@/services/appointmentService'
import { staffService } from '@/services/staffService'
import { Appointment, AppointmentStatus, AppointmentStatsSummary, Staff } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useToastStore } from '@/store/useToastStore'
import { useAIStore } from '@/store/useAIStore'
import {
  AppointmentCalendar,
  AppointmentDetails,
  AppointmentForm,
  AppointmentFilters,
  AppointmentTable,
  WalkInModal,
} from '@/features/appointments'
import { FastWalkInDrawer } from '@/features/queue'

type ViewMode = 'list' | 'day' | 'week' | 'month'

export const AppointmentsPage: React.FC = () => {
  const { addToast } = useToastStore()
  const { openDrawer } = useAIStore()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [stats, setStats] = useState<AppointmentStatsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // View & Filter states
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [staffFilter, setStaffFilter] = useState('all')

  // Modals & Drawers
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [isNewApptModalOpen, setIsNewApptModalOpen] = useState(false)
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false)

  const loadData = async () => {
    try {
      const [appts, staff, summary] = await Promise.all([
        appointmentService.getAll(),
        staffService.getAll(),
        appointmentService.getStatsSummary(),
      ])
      setAppointments(appts)
      setStaffList(staff)
      setStats(summary)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Keyboard shortcut: N opens new appointment booking modal if not typing in form control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable

      if (!isInput && (e.key === 'n' || e.key === 'N') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setIsNewApptModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Filtered appointments for List view
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      // Search query
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        appt.clientName.toLowerCase().includes(q) ||
        appt.serviceName.toLowerCase().includes(q) ||
        appt.staffName.toLowerCase().includes(q) ||
        appt.clientPhone.includes(q) ||
        (appt.appointmentId && appt.appointmentId.toLowerCase().includes(q))

      // Status filter
      let matchesStatus = true
      if (statusFilter !== 'all') {
        if (statusFilter === 'confirmed') {
          matchesStatus = appt.status === 'confirmed' || appt.status === 'scheduled'
        } else {
          matchesStatus = appt.status === statusFilter
        }
      }

      // Staff filter
      const matchesStaff =
        staffFilter === 'all' ? true : appt.staffId === staffFilter

      return matchesSearch && matchesStatus && matchesStaff
    })
  }, [appointments, searchQuery, statusFilter, staffFilter])

  // Status counts for filter pills
  const statusCounts = useMemo(() => {
    return {
      all: appointments.length,
      'in-progress': appointments.filter((a) => a.status === 'in-progress').length,
      confirmed: appointments.filter((a) => a.status === 'confirmed' || a.status === 'scheduled').length,
      pending: appointments.filter((a) => a.status === 'pending' || a.status === 'requested').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled' || a.status === 'no-show').length,
    }
  }, [appointments])

  // Handle appointment status change
  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    try {
      const updated = await appointmentService.updateStatus(id, status)
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)))
      if (selectedAppt?.id === id) setSelectedAppt(updated)
      const summary = await appointmentService.getStatsSummary()
      setStats(summary)
      addToast({
        title: 'Status Updated',
        message: `Appointment marked as ${status}.`,
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Error',
        message: 'Could not update appointment status.',
        type: 'danger',
      })
    }
  }

  // Handle rescheduling
  const handleReschedule = async (id: string, date: string, startTime: string) => {
    try {
      const updated = await appointmentService.reschedule(id, date, startTime)
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)))
      if (selectedAppt?.id === id) setSelectedAppt(updated)
      addToast({
        title: 'Appointment Rescheduled',
        message: `Updated to ${date} at ${startTime}.`,
        type: 'success',
      })
    } catch (err: any) {
      addToast({
        title: 'Reschedule Failed',
        message: err.message || 'Slot conflict detected.',
        type: 'danger',
      })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
            Appointments
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Manage bookings, schedules and provide the best salon experience.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Queue Navigation */}
          <Link to="/appointments/queue">
            <Button
              variant="outline"
              leftIcon={<Layers className="h-4 w-4 text-primary" />}
              className="border-primary/30"
            >
              Live Queue
            </Button>
          </Link>

          {/* Token History Navigation */}
          <Link to="/appointments/tokens">
            <Button
              variant="outline"
              leftIcon={<Hash className="h-4 w-4 text-text-secondary" />}
            >
              Tokens
            </Button>
          </Link>

          {/* Quick toggle to toggle between List & Calendar */}
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'list' ? 'day' : 'list')}
            leftIcon={viewMode === 'list' ? <CalendarIcon className="h-4 w-4" /> : <List className="h-4 w-4" />}
          >
            {viewMode === 'list' ? 'Calendar' : 'List'}
          </Button>

          {/* AI Schedule Insights */}
          <Button
            variant="outline"
            onClick={() =>
              openDrawer('How many appointments are scheduled today?', {
                sourcePage: 'appointments',
              })
            }
            leftIcon={<Sparkles className="h-4 w-4 text-primary" />}
            className="border-primary/30 hover:border-primary text-text-primary"
          >
            AI Insights
          </Button>

          {/* Add Walk-in instant queue action */}
          <Button
            variant="outline"
            onClick={() => setIsWalkInModalOpen(true)}
            leftIcon={<UserPlus className="h-4 w-4 text-primary" />}
            className="border-primary/40 hover:border-primary text-text-primary"
          >
            + Add Walk-in
          </Button>

          {/* New Appointment button & dedicated route link */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="primary"
              onClick={() => setIsNewApptModalOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
              className="shadow-glow-primary/30"
              title="Schedule New Appointment (Shortcut: N)"
            >
              New Appointment
            </Button>
            <Link
              to="/appointments/new"
              className="h-9 px-2.5 rounded-lg border border-primary/30 bg-surface hover:bg-primary/5 text-primary text-xs font-semibold flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Open Dedicated Booking Page (/appointments/new)"
              aria-label="Open Dedicated Booking Page (/appointments/new)"
            >
              /new
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Appointments */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Total Appointments</span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CalendarIcon className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {stats?.totalAppointments ?? appointments.length}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">All scheduled sessions</p>
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Completed</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {stats?.completed ?? 0}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">Finished treatments</p>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Pending</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {stats?.pending ?? 0}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">Upcoming & requested</p>
            </div>
          </CardContent>
        </Card>

        {/* Cancelled */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Cancelled</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <XCircle className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {stats?.cancelled ?? 0}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">Cancelled or no-shows</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main View Mode Switcher Pills (List, Day, Week, Month) */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-subtle border border-border w-fit">
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'list'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <List className="h-3.5 w-3.5" />
          <span>List</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('day')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'day'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Day</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('week')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'week'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Columns className="h-3.5 w-3.5" />
          <span>Week</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('month')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'month'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Grid className="h-3.5 w-3.5" />
          <span>Month</span>
        </button>
      </div>

      {/* CONDITIONAL RENDER: LIST VIEW VS CALENDAR VIEWS */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          <AppointmentFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            staffFilter={staffFilter}
            onStaffFilterChange={setStaffFilter}
            staffList={staffList}
            counts={statusCounts}
          />

          <AppointmentTable
            appointments={filteredAppointments}
            isLoading={isLoading}
            onSelectAppointment={(appt) => setSelectedAppt(appt)}
          />
        </div>
      ) : (
        <AppointmentCalendar
          appointments={appointments}
          staffList={staffList}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          viewMode={viewMode}
          onViewModeChange={(m) => setViewMode(m)}
          onSelectAppointment={(appt) => setSelectedAppt(appt)}
        />
      )}

      {/* Appointment Detail Drawer */}
      <AppointmentDetails
        isOpen={Boolean(selectedAppt)}
        onClose={() => setSelectedAppt(null)}
        appointment={selectedAppt}
        onUpdateStatus={handleUpdateStatus}
        onReschedule={handleReschedule}
      />

      {/* New Appointment Modal Form */}
      {isNewApptModalOpen && (
        <AppointmentForm
          isOpen={isNewApptModalOpen}
          onClose={() => setIsNewApptModalOpen(false)}
          onSuccess={(newAppt) => {
            setAppointments((prev) => [newAppt, ...prev])
            loadData()
          }}
          initialDate={selectedDate}
        />
      )}

      {/* Walk-in Fast Reception Drawer with Instant Token Issuance */}
      {isWalkInModalOpen && (
        <FastWalkInDrawer
          isOpen={isWalkInModalOpen}
          onClose={() => setIsWalkInModalOpen(false)}
          onSuccess={() => {
            loadData()
          }}
        />
      )}
    </div>
  )
}
