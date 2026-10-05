import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { Appointment, Staff } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { formatTime12Hour, timeToMinutes } from '@/utils/availability'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { AppointmentCard } from './AppointmentCard'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface AppointmentCalendarProps {
  appointments: Appointment[]
  staffList: Staff[]
  onSelectAppointment: (appointment: Appointment) => void
  selectedDate: string // YYYY-MM-DD
  onDateChange: (date: string) => void
  viewMode: 'day' | 'week' | 'month'
  onViewModeChange: (mode: 'day' | 'week' | 'month') => void
}

const HOURS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
]

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  staffList,
  onSelectAppointment,
  selectedDate,
  onDateChange,
  viewMode,
  onViewModeChange,
}) => {
  // Navigation helpers
  const handlePrev = () => {
    const d = new Date(selectedDate)
    if (viewMode === 'day') {
      d.setDate(d.getDate() - 1)
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7)
    } else {
      d.setMonth(d.getMonth() - 1)
    }
    onDateChange(d.toISOString().split('T')[0])
  }

  const handleNext = () => {
    const d = new Date(selectedDate)
    if (viewMode === 'day') {
      d.setDate(d.getDate() + 1)
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7)
    } else {
      d.setMonth(d.getMonth() + 1)
    }
    onDateChange(d.toISOString().split('T')[0])
  }

  const handleToday = () => {
    onDateChange(new Date().toISOString().split('T')[0])
  }

  const dateObj = new Date(selectedDate)
  const formattedHeaderDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // Filter appointments for selectedDate
  const dayAppointments = appointments.filter((a) => a.date === selectedDate)

  return (
    <div className="space-y-4">
      {/* Calendar Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-border shadow-sm">
        {/* Left: Date navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-border rounded-xl bg-surface overflow-hidden">
            <button
              type="button"
              aria-label="Previous Period"
              onClick={handlePrev}
              className="p-2 hover:bg-surface-hover text-text-secondary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-bold text-text-primary hover:bg-surface-hover border-x border-border transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              aria-label="Next Period"
              onClick={handleNext}
              className="p-2 hover:bg-surface-hover text-text-secondary transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div>
            <h2 className="text-base font-bold text-text-primary tracking-tight font-sans">
              {formattedHeaderDate}
            </h2>
            <span className="text-[11px] text-text-muted">
              {dayAppointments.length} bookings scheduled for this date
            </span>
          </div>
        </div>

        {/* Right: View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-subtle border border-border self-start sm:self-center">
          <button
            type="button"
            onClick={() => onViewModeChange('day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'day'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Day Timeline
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'week'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Staff Columns
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'month'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Month Grid
          </button>
        </div>
      </div>

      {/* VIEW 1: DAY TIMELINE STYLE */}
      {viewMode === 'day' && (
        <Card className="overflow-hidden border border-border">
          <div className="divide-y divide-border">
            {HOURS.map((hour) => {
              const hourMins = timeToMinutes(hour)
              const hourAppointments = dayAppointments.filter((a) => {
                const aMins = timeToMinutes(a.startTime)
                return aMins >= hourMins && aMins < hourMins + 60
              })

              return (
                <div
                  key={hour}
                  className="flex flex-col sm:flex-row items-start min-h-[5.5rem] p-3 sm:p-4 hover:bg-surface-subtle/30 transition-colors gap-3 sm:gap-6 group"
                >
                  {/* Time label */}
                  <div className="w-16 flex-shrink-0 pt-0.5">
                    <span className="text-xs font-bold text-text-muted tabular-nums group-hover:text-primary transition-colors">
                      {hour}
                    </span>
                    <span className="text-[10px] text-text-muted block">
                      {formatTime12Hour(hour).split(' ')[1]}
                    </span>
                  </div>

                  {/* Appointments in this hour slot */}
                  <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {hourAppointments.length > 0 ? (
                      hourAppointments.map((appt) => (
                        <AppointmentCard
                          key={appt.id}
                          appointment={appt}
                          onClick={onSelectAppointment}
                        />
                      ))
                    ) : (
                      <div className="h-full flex items-center text-xs text-text-muted/60 italic py-1">
                        No appointments booked
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* VIEW 2: WEEK VIEW (STAFF COLUMNS & APPOINTMENTS) */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {staffList.map((staff) => {
            const staffDayAppointments = dayAppointments.filter(
              (a) => a.staffId === staff.id
            )

            const effectiveStatus = staff.todayStatus || (staff.status === 'on-leave' ? 'on-leave' : staff.status === 'off-duty' ? 'off-duty' : 'available')

            return (
              <div
                key={staff.id}
                className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col"
              >
                {/* Column Header */}
                <div className="p-4 border-b border-border bg-surface-subtle/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={staff.name}
                        src={staff.avatarUrl}
                        size="md"
                        status={effectiveStatus === 'available' ? 'online' : effectiveStatus === 'busy' ? 'busy' : 'offline'}
                      />
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-text-primary truncate">
                          {staff.name}
                        </h3>
                        <p className="text-[11px] text-primary font-semibold truncate">
                          {staff.role}
                        </p>
                      </div>
                    </div>

                    <Badge variant="default" size="sm" className="tabular-nums font-bold">
                      {staffDayAppointments.length}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border/60">
                    <span className="tabular-nums">
                      {staff.startTime || '09:00'} - {staff.endTime || '18:00'}
                    </span>
                    <span className="capitalize font-semibold text-text-secondary">
                      {effectiveStatus.replace('-', ' ')}
                    </span>
                  </div>
                </div>

                {/* Column Appointment Cards */}
                <div className="p-3 space-y-3 min-h-[18rem] bg-surface-subtle/20 max-h-[38rem] overflow-y-auto">
                  {staffDayAppointments.length > 0 ? (
                    staffDayAppointments.map((appt) => (
                      <AppointmentCard
                        key={appt.id}
                        appointment={appt}
                        onClick={onSelectAppointment}
                      />
                    ))
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/70 rounded-xl text-text-muted space-y-1">
                      <CalendarIcon className="h-5 w-5 opacity-40" />
                      <p className="text-xs font-semibold">Available for bookings</p>
                      <span className="text-[10px]">No appointments today</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* VIEW 3: MONTH VIEW (CALENDAR WITH INDICATORS) */}
      {viewMode === 'month' && (
        <Card className="p-5 border border-border">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-text-muted uppercase tracking-wider">
            {WEEK_DAYS.map((wd) => (
              <div key={wd} className="py-2">
                {wd}
              </div>
            ))}
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, index) => {
              // Calculate day relative to selected month
              const currentMonthDate = new Date(selectedDate)
              const firstDayOfMonth = new Date(
                currentMonthDate.getFullYear(),
                currentMonthDate.getMonth(),
                1
              )
              const startingDay = firstDayOfMonth.getDay() // 0-6

              const cellDate = new Date(
                currentMonthDate.getFullYear(),
                currentMonthDate.getMonth(),
                index - startingDay + 1
              )

              const cellDateStr = cellDate.toISOString().split('T')[0]
              const isSelected = cellDateStr === selectedDate
              const isCurrentMonth =
                cellDate.getMonth() === currentMonthDate.getMonth()

              // Appointments on this date
              const cellAppointments = appointments.filter(
                (a) => a.date === cellDateStr
              )

              return (
                <div
                  key={cellDateStr}
                  onClick={() => onDateChange(cellDateStr)}
                  className={`min-h-[6.5rem] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20 shadow-sm'
                      : isCurrentMonth
                      ? 'border-border bg-surface hover:border-primary/40 hover:bg-surface-subtle/50'
                      : 'border-border/40 bg-surface-subtle/30 opacity-40'
                  }`}
                >
                  {/* Top: Day Number + Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        isSelected
                          ? 'w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center'
                          : 'text-text-primary'
                      }`}
                    >
                      {cellDate.getDate()}
                    </span>

                    {cellAppointments.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary tabular-nums">
                        {cellAppointments.length}
                      </span>
                    )}
                  </div>

                  {/* Indicators for appointments */}
                  <div className="space-y-1 mt-1">
                    {cellAppointments.slice(0, 2).map((appt) => (
                      <div
                        key={appt.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectAppointment(appt)
                        }}
                        className="truncate text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface border border-border hover:border-primary text-text-secondary flex items-center gap-1"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            appt.status === 'in-progress'
                              ? 'bg-emerald-500'
                              : appt.status === 'confirmed'
                              ? 'bg-indigo-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span className="truncate">{appt.clientName}</span>
                      </div>
                    ))}
                    {cellAppointments.length > 2 && (
                      <span className="text-[10px] text-text-muted font-bold block pl-1">
                        +{cellAppointments.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
