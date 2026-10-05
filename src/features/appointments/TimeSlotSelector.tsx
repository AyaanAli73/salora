import React, { useMemo } from 'react'
import { Appointment, Service, Staff, TimeSlot } from '@/types'
import {
  getAvailableSlots,
  getAvailableSlotsForAnyStaff,
  formatTime12Hour,
  timeToMinutes,
  isDateSelectable,
} from '@/utils/availability'
import { useSalonStore } from '@/store/useSalonStore'
import { Calendar, Clock, AlertCircle, Sun, Sunset, Moon } from 'lucide-react'

interface TimeSlotSelectorProps {
  selectedDate: string
  onDateChange: (date: string) => void
  selectedTime: string // "HH:mm"
  onSelectTime: (startTime: string, endTime: string) => void
  staffId: string // 'any' | staff.id
  staffList: Staff[]
  service: Service | null
  appointments: Appointment[]
  error?: string
  className?: string
}

export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  selectedDate,
  onDateChange,
  selectedTime,
  onSelectTime,
  staffId,
  staffList,
  service,
  appointments,
  error,
  className = '',
}) => {
  const { salon } = useSalonStore()

  // Dates for quick chips: Today, Tomorrow, Day after
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const tomorrowStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }, [])

  const durationMinutes = service?.duration || 45

  // Calculate available slots using existing availability algorithms
  const slots: TimeSlot[] = useMemo(() => {
    if (!selectedDate || durationMinutes <= 0) return []

    // For receptionist booking, past times today are blocked, but min notice is 0h
    if (staffId === 'any') {
      return getAvailableSlotsForAnyStaff(
        staffList,
        selectedDate,
        durationMinutes,
        appointments,
        salon,
        10, // buffer minutes
        30, // slot interval
        0   // 0 notice hours for receptionist instant booking
      )
    }

    const specificStaff = staffList.find((s) => s.id === staffId)
    if (!specificStaff) return []

    return getAvailableSlots(
      specificStaff,
      selectedDate,
      durationMinutes,
      appointments,
      salon,
      10, // buffer minutes
      30, // slot interval
      0   // 0 notice hours
    )
  }, [staffId, staffList, selectedDate, durationMinutes, appointments, salon])

  // Group slots into time-of-day blocks for rapid receptionist scanning
  const groupedSlots = useMemo(() => {
    const morning: TimeSlot[] = []
    const afternoon: TimeSlot[] = []
    const evening: TimeSlot[] = []

    slots.forEach((slot) => {
      const mins = timeToMinutes(slot.time)
      if (mins < 12 * 60) {
        morning.push(slot)
      } else if (mins < 17 * 60) {
        afternoon.push(slot)
      } else {
        evening.push(slot)
      }
    })

    return { morning, afternoon, evening }
  }, [slots])

  const dateCheck = useMemo(() => {
    const staff = staffId !== 'any' ? staffList.find((s) => s.id === staffId) : null
    return isDateSelectable(selectedDate, salon, staff)
  }, [selectedDate, salon, staffId, staffList])

  const availableCount = slots.filter((s) => s.isAvailable).length

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Date Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          Date & Time Slot <span className="text-danger">*</span>
        </label>

        {/* Quick Date Buttons + Custom Date Picker */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onDateChange(todayStr)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              selectedDate === todayStr
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onDateChange(tomorrowStr)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              selectedDate === tomorrowStr
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            Tomorrow
          </button>
          <input
            type="date"
            min={todayStr}
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="h-7 px-2 text-xs rounded-lg border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Date Selectability Warning */}
      {!dateCheck.selectable && (
        <div className="p-3 rounded-xl border border-warning/30 bg-warning/10 text-xs text-text-primary flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-warning shrink-0" />
          <span>{dateCheck.reason || 'Selected date is not available for appointments.'}</span>
        </div>
      )}

      {/* Slots Available Count Header */}
      <div className="flex items-center justify-between text-xs text-text-muted px-0.5">
        <span>
          Available Slots:{' '}
          <strong className="text-text-primary tabular-nums font-mono">{availableCount}</strong>
        </span>
        {selectedTime && (
          <span className="text-primary font-semibold flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Selected: <span className="font-mono">{formatTime12Hour(selectedTime)}</span>
          </span>
        )}
      </div>

      {/* Time Slots Blocks */}
      {availableCount === 0 ? (
        <div className="p-6 rounded-xl border border-border/80 bg-surface/50 text-center space-y-2">
          <Clock className="h-6 w-6 text-text-muted mx-auto" />
          <p className="text-xs font-medium text-text-secondary">
            No slots available on this date for the selected stylist/treatment.
          </p>
          <p className="text-[11px] text-text-muted">
            Try switching to "Any Available" or choose another date.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
          {/* Morning Slots */}
          {groupedSlots.morning.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <Sun className="h-3 w-3 text-amber-500" />
                Morning
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {groupedSlots.morning.map((slot) => {
                  const isSelected = selectedTime === slot.time
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => onSelectTime(slot.time, slot.endTime)}
                      title={slot.reason}
                      className={`h-11 px-2 rounded-xl text-xs font-bold transition-colors relative flex flex-col items-center justify-center border active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isSelected
                          ? 'border-primary bg-primary text-white shadow-glow-primary/30 ring-2 ring-primary/40'
                          : slot.isAvailable
                          ? 'border-border bg-surface text-text-primary hover:border-primary/50 hover:bg-primary/5'
                          : 'border-border/40 bg-surface/30 text-text-muted/40 cursor-not-allowed line-through'
                      }`}
                    >
                      <span className="font-mono tabular-nums">{formatTime12Hour(slot.time)}</span>
                      {!slot.isAvailable && slot.reason && (
                        <span className="text-[9px] font-normal no-underline opacity-80 truncate max-w-full">
                          {slot.reason === 'Booked' ? 'Booked' : slot.reason}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Afternoon Slots */}
          {groupedSlots.afternoon.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <Sunset className="h-3 w-3 text-orange-500" />
                Afternoon
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {groupedSlots.afternoon.map((slot) => {
                  const isSelected = selectedTime === slot.time
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => onSelectTime(slot.time, slot.endTime)}
                      title={slot.reason}
                      className={`h-11 px-2 rounded-xl text-xs font-bold transition-colors relative flex flex-col items-center justify-center border active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isSelected
                          ? 'border-primary bg-primary text-white shadow-glow-primary/30 ring-2 ring-primary/40'
                          : slot.isAvailable
                          ? 'border-border bg-surface text-text-primary hover:border-primary/50 hover:bg-primary/5'
                          : 'border-border/40 bg-surface/30 text-text-muted/40 cursor-not-allowed line-through'
                      }`}
                    >
                      <span className="font-mono tabular-nums">{formatTime12Hour(slot.time)}</span>
                      {!slot.isAvailable && slot.reason && (
                        <span className="text-[9px] font-normal no-underline opacity-80 truncate max-w-full">
                          {slot.reason === 'Booked' ? 'Booked' : slot.reason}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Evening Slots */}
          {groupedSlots.evening.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <Moon className="h-3 w-3 text-indigo-400" />
                Evening
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {groupedSlots.evening.map((slot) => {
                  const isSelected = selectedTime === slot.time
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => onSelectTime(slot.time, slot.endTime)}
                      title={slot.reason}
                      className={`h-11 px-2 rounded-xl text-xs font-bold transition-colors relative flex flex-col items-center justify-center border active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isSelected
                          ? 'border-primary bg-primary text-white shadow-glow-primary/30 ring-2 ring-primary/40'
                          : slot.isAvailable
                          ? 'border-border bg-surface text-text-primary hover:border-primary/50 hover:bg-primary/5'
                          : 'border-border/40 bg-surface/30 text-text-muted/40 cursor-not-allowed line-through'
                      }`}
                    >
                      <span className="font-mono tabular-nums">{formatTime12Hour(slot.time)}</span>
                      {!slot.isAvailable && slot.reason && (
                        <span className="text-[9px] font-normal no-underline opacity-80 truncate max-w-full">
                          {slot.reason === 'Booked' ? 'Booked' : slot.reason}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
    </div>
  )
}
