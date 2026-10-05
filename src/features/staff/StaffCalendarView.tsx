import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Sparkles,
  Coffee,
  AlertCircle,
  Filter,
  CheckCircle2,
  CalendarDays,
  X,
} from 'lucide-react'
import {
  Staff,
  StaffShift,
  StaffScheduleCalendarEvent,
  Appointment,
} from '@/types'
import { staffService } from '@/services/staffService'
import { staffAttendanceService } from '@/services/staffAttendanceService'
import { appointmentService } from '@/services/appointmentService'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface CalendarDayInfo {
  date: Date
  dateStr: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
}

export const StaffCalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedStaffId, setSelectedStaffId] = useState<string>('ALL')
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [calendarEvents, setCalendarEvents] = useState<StaffScheduleCalendarEvent[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    dateStr: string
    events: Array<{
      id: string
      type: 'SHIFT' | 'APPOINTMENT' | 'LEAVE' | 'OFF_DAY'
      title: string
      subtitle?: string
      time?: string
      color?: string
      staffName?: string
      avatarUrl?: string
    }>
  } | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    try {
      const [allStaff, allAppts] = await Promise.all([
        staffService.getAll(),
        appointmentService.getAll(),
      ])
      setStaffList(allStaff)
      setAppointments(allAppts)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Calculate year and month
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Generate 35-42 days grid for current calendar view
  const calendarDays = useMemo(() => {
    const days: CalendarDayInfo[] = []
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // Day of week index (0=Sun, 1=Mon, ..., 6=Sat). Let's start week on Monday (1).
    let startDayOfWeek = firstDayOfMonth.getDay() - 1
    if (startDayOfWeek === -1) startDayOfWeek = 6 // Sunday -> 6

    const todayStr = new Date().toISOString().split('T')[0]

    // Previous month padding days
    const prevMonthLastDate = new Date(year, month, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDate = new Date(year, month - 1, prevMonthLastDate - i)
      const dateStr = pDate.toISOString().split('T')[0]
      days.push({
        date: pDate,
        dateStr,
        dayNumber: pDate.getDate(),
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      })
    }

    // Current month days
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const cDate = new Date(year, month, d)
      const dateStr = cDate.toISOString().split('T')[0]
      days.push({
        date: cDate,
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      })
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7
    for (let n = 1; n <= remaining; n++) {
      const nDate = new Date(year, month + 1, n)
      const dateStr = nDate.toISOString().split('T')[0]
      days.push({
        date: nDate,
        dateStr,
        dayNumber: n,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      })
    }

    return days
  }, [year, month])

  // Fetch calendar events whenever month or staff filter changes
  useEffect(() => {
    if (calendarDays.length === 0) return
    const startStr = calendarDays[0].dateStr
    const endStr = calendarDays[calendarDays.length - 1].dateStr

    const staffIdParam = selectedStaffId !== 'ALL' ? selectedStaffId : undefined
    const evts = staffAttendanceService.getCalendarEvents(startStr, endStr, staffIdParam)
    setCalendarEvents(evts)
  }, [calendarDays, selectedStaffId])

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const monthYearLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate)

  // Get aggregated events for a day cell
  const getDayEvents = (dateStr: string) => {
    const result: Array<{
      id: string
      type: 'SHIFT' | 'APPOINTMENT' | 'LEAVE' | 'OFF_DAY'
      title: string
      subtitle?: string
      time?: string
      color?: string
      staffName?: string
      avatarUrl?: string
    }> = []

    // 1. Shifts and leaves from staffAttendanceService
    const attEvents = calendarEvents.filter((e) => e.date === dateStr)
    attEvents.forEach((ae) => {
      result.push({
        id: ae.id,
        type: ae.type,
        title: ae.title,
        time: ae.startTime ? `${ae.startTime} - ${ae.endTime}` : undefined,
        color: ae.color,
        staffName: ae.staffName,
      })
    })

    // 2. Appointments from appointmentService
    const dayAppts = appointments.filter((a) => {
      if (a.date !== dateStr) return false
      if (selectedStaffId !== 'ALL' && a.staffId !== selectedStaffId) return false
      return a.status !== 'cancelled'
    })

    dayAppts.forEach((ap) => {
      result.push({
        id: `appt-${ap.id}`,
        type: 'APPOINTMENT',
        title: `${ap.staffName || 'Specialist'}: ${ap.serviceName || 'Service'}`,
        subtitle: `Client: ${ap.clientName}`,
        time: `${ap.startTime} - ${ap.endTime}`,
        color: '#8B5CF6', // Purple
        staffName: ap.staffName,
      })
    })

    return result
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Navigation & Legend */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Month & Navigation Buttons */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                  className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                  className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <h2 className="text-lg font-bold text-text-primary capitalize tracking-tight">
                {monthYearLabel}
              </h2>

              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="text-xs h-8 px-2.5"
              >
                Today
              </Button>
            </div>

            {/* Staff Filter Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="calendar-staff-filter" className="text-xs font-semibold text-text-muted shrink-0">
                Specialist:
              </label>
              <select
                id="calendar-staff-filter"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer min-w-[180px]"
              >
                <option value="ALL">All Team Members</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} — {st.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visual Legend Bar */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border text-xs">
            <span className="text-text-muted font-semibold">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
              <span className="text-text-primary">Assigned Shift</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
              <span className="text-text-primary">Booked Appointment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-pink-500" />
              <span className="text-text-primary">Approved Leave</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/30" />
              <span className="text-text-muted">Day Off</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Interactive Calendar Grid */}
      <Card className="overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-[11px] font-semibold text-text-muted uppercase tracking-wider select-none text-center py-2.5">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div className="text-primary font-bold">Sat</div>
          <div className="text-rose-500 font-bold">Sun</div>
        </div>

        {/* 7 Columns Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border">
          {calendarDays.map((day) => {
            const events = getDayEvents(day.dateStr)
            const hasShift = events.some((e) => e.type === 'SHIFT')
            const hasLeave = events.some((e) => e.type === 'LEAVE')
            const isOffDay = selectedStaffId !== 'ALL' && !hasShift && !hasLeave && day.isCurrentMonth

            return (
              <div
                key={day.dateStr}
                onClick={() => {
                  if (events.length > 0) {
                    setSelectedDayEvents({ dateStr: day.dateStr, events })
                  }
                }}
                className={cn(
                  'min-h-[110px] p-2 flex flex-col justify-between transition-colors cursor-pointer group',
                  !day.isCurrentMonth && 'bg-muted/15 text-text-muted/50',
                  day.isToday && 'bg-primary/5 ring-1 ring-inset ring-primary/30',
                  isOffDay && 'bg-muted/10',
                  events.length > 0 ? 'hover:bg-muted/30' : 'hover:bg-muted/10'
                )}
              >
                {/* Date header in cell */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center tabular-nums',
                      day.isToday
                        ? 'bg-primary text-white shadow-xs'
                        : day.isCurrentMonth
                        ? 'text-text-primary'
                        : 'text-text-muted'
                    )}
                  >
                    {day.dayNumber}
                  </span>

                  {events.length > 2 && (
                    <span className="text-[10px] font-semibold text-primary">
                      +{events.length - 2} more
                    </span>
                  )}
                </div>

                {/* Event previews in cell */}
                <div className="space-y-1 my-1 flex-1 overflow-hidden">
                  {events.slice(0, 2).map((ev) => {
                    const isAppt = ev.type === 'APPOINTMENT'
                    const isLv = ev.type === 'LEAVE'
                    return (
                      <div
                        key={ev.id}
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] truncate leading-tight font-medium shadow-2xs',
                          isLv
                            ? 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20'
                            : isAppt
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                        )}
                        title={`${ev.title} ${ev.time ? `(${ev.time})` : ''}`}
                      >
                        <span className="truncate">{ev.title}</span>
                      </div>
                    )
                  })}
                  {isOffDay && events.length === 0 && (
                    <span className="inline-block text-[10px] text-text-muted/60 italic px-1">
                      Off Duty
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-text-muted text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  View details
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Day Events Detail Popover Modal */}
      {selectedDayEvents && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-detail-title"
        >
          <div className="relative w-full max-w-lg bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" aria-hidden="true" />
                <div>
                  <h3 id="day-detail-title" className="text-base font-bold text-text-primary">
                    Schedule for {selectedDayEvents.dateStr}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {selectedDayEvents.events.length} team event(s) scheduled on this day
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayEvents(null)}
                aria-label="Close day detail modal"
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2.5">
              {selectedDayEvents.events.map((ev) => (
                <div
                  key={ev.id}
                  className={cn(
                    'p-3 rounded-xl border text-xs space-y-1',
                    ev.type === 'LEAVE'
                      ? 'bg-pink-500/5 border-pink-500/20'
                      : ev.type === 'APPOINTMENT'
                      ? 'bg-purple-500/5 border-purple-500/20'
                      : 'bg-blue-500/5 border-blue-500/20'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary text-sm">{ev.title}</span>
                    <Badge
                      variant={
                        ev.type === 'LEAVE'
                          ? 'danger'
                          : ev.type === 'APPOINTMENT'
                          ? 'accent'
                          : 'primary'
                      }
                      size="sm"
                    >
                      {ev.type}
                    </Badge>
                  </div>
                  {ev.subtitle && <p className="text-text-muted">{ev.subtitle}</p>}
                  {ev.time && (
                    <div className="flex items-center gap-1.5 text-text-muted font-mono pt-1">
                      <Clock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                      <span>{ev.time}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDayEvents(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
