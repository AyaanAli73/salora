import { Staff, Appointment, TimeSlot, Salon, BookingSettings } from '@/types'
import { staffAttendanceService } from '@/services/staffAttendanceService'

/**
 * Standard annual salon holidays (YYYY-MM-DD)
 */
export const SALON_HOLIDAYS_2026: string[] = [
  '2026-01-01', // New Year's Day
  '2026-01-26', // Republic Day
  '2026-03-04', // Holi
  '2026-08-15', // Independence Day
  '2026-10-02', // Gandhi Jayanti
  '2026-10-20', // Dussehra
  '2026-11-08', // Diwali Festival
  '2026-12-25', // Christmas Day
]

/**
 * Converts a time string "HH:mm" to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

/**
 * Converts minutes from midnight to "HH:mm"
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * Calculates end time string given start time and duration in minutes
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMins = timeToMinutes(startTime)
  return minutesToTime(startMins + durationMinutes)
}

/**
 * Formats time from "14:30" to "2:30 PM"
 */
export function formatTime12Hour(timeStr: string): string {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':').map(Number)
  const period = (hours || 0) >= 12 ? 'PM' : 'AM'
  const h = (hours || 0) % 12 || 12
  return `${h}:${(minutes || 0).toString().padStart(2, '0')} ${period}`
}

/**
 * Checks if two time intervals [start1, end1] and [start2, end2] overlap
 */
export function doIntervalsOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 < end2 && start2 < end1
}

/**
 * Returns the short day name ("Mon", "Tue", etc.) for a YYYY-MM-DD date string
 */
export function getDayNameFromDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

/**
 * Returns the full day name ("Monday", "Tuesday", etc.) for a YYYY-MM-DD date string
 */
export function getFullDayNameFromDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

/**
 * Checks whether a given calendar date is selectable for customer booking
 */
export function isDateSelectable(
  dateStr: string,
  salon?: Salon,
  staff?: Staff | null,
  bookingSettings?: BookingSettings
): { selectable: boolean; reason?: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [y, m, d] = dateStr.split('-').map(Number)
  const targetDate = new Date(y, m - 1, d)
  targetDate.setHours(0, 0, 0, 0)

  // 1. Disable past dates
  if (targetDate.getTime() < today.getTime()) {
    return { selectable: false, reason: 'Past date' }
  }

  // 2. Advance booking window (e.g. max 30 days)
  const maxDays = bookingSettings?.advanceBookingDays ?? 30
  const maxFutureDate = new Date(today)
  maxFutureDate.setDate(today.getDate() + maxDays)
  if (targetDate.getTime() > maxFutureDate.getTime()) {
    return { selectable: false, reason: `Booking opens up to ${maxDays} days in advance` }
  }

  // 3. Salon holidays
  if (SALON_HOLIDAYS_2026.includes(dateStr)) {
    return { selectable: false, reason: 'Salon holiday' }
  }

  // 4. Salon closed days
  const fullDayName = getFullDayNameFromDate(dateStr)
  if (salon?.openHours) {
    const daySchedule = salon.openHours.find(
      (h) => h.day.toLowerCase() === fullDayName.toLowerCase()
    )
    if (daySchedule && daySchedule.closed) {
      return { selectable: false, reason: `Salon closed on ${fullDayName}s` }
    }
  }

  // 5. Check if staff is on approved leave
  if (staff && staffAttendanceService.isStaffOnLeaveOnDate(staff.id, dateStr)) {
    return { selectable: false, reason: `${staff.name} is on approved leave` }
  }

  // 6. If specific staff is selected, check staff scheduled working days
  if (staff && staff.weeklySchedule) {
    const shortDayName = getDayNameFromDate(dateStr)
    const staffDay = staff.weeklySchedule.find(
      (s) => s.day.toLowerCase() === shortDayName.toLowerCase()
    )
    if (staffDay && !staffDay.isWorking) {
      return { selectable: false, reason: `${staff.name} is off on ${shortDayName}s` }
    }
  }

  return { selectable: true }
}

/**
 * Calculates available time slots for a single staff specialist on a given date
 */
export function getAvailableSlots(
  staff: Staff,
  dateStr: string,
  durationMinutes: number,
  appointments: Appointment[],
  salonOrInterval?: Salon | number,
  bufferTimeMinutes: number = 10,
  intervalMinutes: number = 30,
  minNoticeHours: number = 2
): TimeSlot[] {
  let salon: Salon | undefined = undefined
  let effectiveInterval = intervalMinutes
  if (typeof salonOrInterval === 'number') {
    effectiveInterval = salonOrInterval
  } else if (salonOrInterval) {
    salon = salonOrInterval
  }

  const slots: TimeSlot[] = []
  if (!staff || !dateStr || durationMinutes <= 0) return slots

  // Check if staff member is on approved leave
  if (staffAttendanceService.isStaffOnLeaveOnDate(staff.id, dateStr)) {
    return [] // Staff on approved leave - unavailable for appointments
  }

  const shortDay = getDayNameFromDate(dateStr)
  const fullDay = getFullDayNameFromDate(dateStr)

  // 1. Check salon business hours
  let salonStartMins = 9 * 60 // 09:00 default
  let salonEndMins = 20 * 60  // 20:00 default
  if (salon?.openHours) {
    const dayHours = salon.openHours.find(
      (h) => h.day.toLowerCase() === fullDay.toLowerCase()
    )
    if (dayHours?.closed) {
      return [] // Salon is completely closed
    }
    if (dayHours?.open && dayHours?.close) {
      salonStartMins = timeToMinutes(dayHours.open)
      salonEndMins = timeToMinutes(dayHours.close)
    }
  }

  // 2. Check assigned shift or staff weekly schedule
  const assignedShift = staffAttendanceService.getStaffShiftForDate(staff.id, dateStr)
  const scheduleDay = staff.weeklySchedule?.find(
    (s) => s.day.toLowerCase() === shortDay.toLowerCase()
  )
  if (scheduleDay && !scheduleDay.isWorking && !assignedShift) {
    return [] // Staff off duty
  }

  const staffWorkStart = timeToMinutes(assignedShift?.startTime || scheduleDay?.startTime || staff.startTime || '09:00')
  const staffWorkEnd = timeToMinutes(assignedShift?.endTime || scheduleDay?.endTime || staff.endTime || '19:00')

  // Effective boundary is intersection of salon open hours & staff working hours
  const effectiveStartMins = Math.max(salonStartMins, staffWorkStart)
  const effectiveEndMins = Math.min(salonEndMins, staffWorkEnd)

  // 3. Staff Break Times
  const breakStart = scheduleDay?.breakTime?.startTime || staff.breakTime?.startTime
  const breakEnd = scheduleDay?.breakTime?.endTime || staff.breakTime?.endTime
  const breakStartMins = breakStart ? timeToMinutes(breakStart) : null
  const breakEndMins = breakEnd ? timeToMinutes(breakEnd) : null

  // 4. Active appointments for this staff member on this date
  const staffAppts = appointments.filter(
    (a) =>
      a.staffId === staff.id &&
      a.date === dateStr &&
      a.status !== 'cancelled' &&
      a.status !== 'no-show'
  )

  // 5. Check if booking for today with minimum notice requirement
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`
  const isToday = dateStr === todayStr
  const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes()
  const minimumNoticeMinutes = minNoticeHours * 60

  for (let current = effectiveStartMins; current + durationMinutes <= effectiveEndMins; current += effectiveInterval) {
    const slotStartMins = current
    const slotEndMins = current + durationMinutes
    const slotStartTime = minutesToTime(slotStartMins)
    const slotEndTime = minutesToTime(slotEndMins)

    let isAvailable = true
    let reason: string | undefined

    // A. Minimum advance notice check for same-day bookings
    if (isToday && slotStartMins < currentMinutesFromMidnight + minimumNoticeMinutes) {
      isAvailable = false
      reason = `Requires ${minNoticeHours}h advance notice`
    }

    // B. Staff Break overlap
    if (isAvailable && breakStartMins !== null && breakEndMins !== null) {
      if (doIntervalsOverlap(slotStartMins, slotEndMins, breakStartMins, breakEndMins)) {
        isAvailable = false
        reason = 'Staff break'
      }
    }

    // C. Existing appointment overlaps (including buffer time)
    if (isAvailable) {
      const conflictingAppt = staffAppts.find((a) => {
        const aStart = timeToMinutes(a.startTime)
        const aDur = a.duration || a.serviceDuration || 60
        // Appointment occupies start until end + buffer
        const aEndWithBuffer = aStart + aDur + bufferTimeMinutes
        return doIntervalsOverlap(slotStartMins, slotEndMins, aStart, aEndWithBuffer)
      })

      if (conflictingAppt) {
        isAvailable = false
        reason = 'Booked'
      }
    }

    slots.push({
      time: slotStartTime,
      endTime: slotEndTime,
      isAvailable,
      reason,
      staffId: staff.id,
      staffName: staff.name,
    })
  }

  return slots
}


/**
 * Calculates available time slots when customer chooses "Any Available Professional"
 * A slot is available if at least one qualified staff member is free at that time.
 */
export function getAvailableSlotsForAnyStaff(
  allStaff: Staff[],
  dateStr: string,
  durationMinutes: number,
  appointments: Appointment[],
  salon?: Salon,
  bufferTimeMinutes: number = 10,
  intervalMinutes: number = 30,
  minNoticeHours: number = 2
): TimeSlot[] {
  const activeStaff = allStaff.filter(
    (s) =>
      (s.status === 'active' || s.status === undefined || s.status === 'available') &&
      !staffAttendanceService.isStaffOnLeaveOnDate(s.id, dateStr)
  )
  if (activeStaff.length === 0) return []

  // Pre-compute slots for each staff member
  const staffSlotsMap = activeStaff.map((staff) => ({
    staff,
    slots: getAvailableSlots(
      staff,
      dateStr,
      durationMinutes,
      appointments,
      salon,
      bufferTimeMinutes,
      intervalMinutes,
      minNoticeHours
    ),
  }))

  // Collect all distinct slot times across all staff
  const allTimeSet = new Set<string>()
  staffSlotsMap.forEach(({ slots }) => {
    slots.forEach((s) => allTimeSet.add(s.time))
  })

  const sortedTimes = Array.from(allTimeSet).sort((a, b) => timeToMinutes(a) - timeToMinutes(b))

  return sortedTimes.map((timeStr) => {
    const slotStartMins = timeToMinutes(timeStr)
    const slotEndTime = minutesToTime(slotStartMins + durationMinutes)

    // Find all staff who have this slot open and available
    const availableStaffList = staffSlotsMap.filter(({ slots }) => {
      const matched = slots.find((s) => s.time === timeStr)
      return matched && matched.isAvailable
    })

    if (availableStaffList.length > 0) {
      // Pick best available staff member (e.g. least appointments on that date)
      const chosenStaff = availableStaffList[0].staff
      return {
        time: timeStr,
        endTime: slotEndTime,
        isAvailable: true,
        staffId: chosenStaff.id,
        staffName: chosenStaff.name,
      }
    }

    // Otherwise it's unavailable across all staff
    return {
      time: timeStr,
      endTime: slotEndTime,
      isAvailable: false,
      reason: 'All stylists booked',
    }
  })
}

/**
 * Verifies whether a specific requested time slot is conflict-free
 */
export function isSlotAvailable(
  staff: Staff,
  dateStr: string,
  startTime: string,
  durationMinutes: number,
  appointments: Appointment[],
  excludeAppointmentId?: string,
  bufferTimeMinutes: number = 10
): { available: boolean; conflictReason?: string; reason?: string } {
  if (!staff || !dateStr || !startTime) {
    return {
      available: false,
      conflictReason: 'Missing required booking parameters',
      reason: 'Missing required booking parameters',
    }
  }

  if (staffAttendanceService.isStaffOnLeaveOnDate(staff.id, dateStr)) {
    const msg = `${staff.name} is on approved leave on ${dateStr}`
    return { available: false, conflictReason: msg, reason: msg }
  }

  const shortDay = getDayNameFromDate(dateStr)
  const scheduleDay = staff.weeklySchedule?.find(
    (s) => s.day.toLowerCase() === shortDay.toLowerCase()
  )

  if (scheduleDay && !scheduleDay.isWorking) {
    const msg = `${staff.name} is off duty on ${shortDay}s`
    return { available: false, conflictReason: msg, reason: msg }
  }

  const slotStartMins = timeToMinutes(startTime)
  const slotEndMins = slotStartMins + durationMinutes
  const workStartMins = timeToMinutes(scheduleDay?.startTime || staff.startTime || '09:00')
  const workEndMins = timeToMinutes(scheduleDay?.endTime || staff.endTime || '19:00')

  if (slotStartMins < workStartMins || slotEndMins > workEndMins) {
    const msg = `Outside working hours (${scheduleDay?.startTime || staff.startTime || '09:00'} - ${scheduleDay?.endTime || staff.endTime || '19:00'})`
    return { available: false, conflictReason: msg, reason: msg }
  }

  // Check break
  const breakStart = scheduleDay?.breakTime?.startTime || staff.breakTime?.startTime
  const breakEnd = scheduleDay?.breakTime?.endTime || staff.breakTime?.endTime
  if (breakStart && breakEnd) {
    const bStartMins = timeToMinutes(breakStart)
    const bEndMins = timeToMinutes(breakEnd)
    if (doIntervalsOverlap(slotStartMins, slotEndMins, bStartMins, bEndMins)) {
      const msg = `Staff scheduled break (${breakStart} - ${breakEnd})`
      return { available: false, conflictReason: msg, reason: msg }
    }
  }

  // Check existing appointments for conflicts
  const activeAppts = appointments.filter(
    (a) =>
      a.staffId === staff.id &&
      a.date === dateStr &&
      a.id !== excludeAppointmentId &&
      a.appointmentId !== excludeAppointmentId &&
      a.status !== 'cancelled' &&
      a.status !== 'no-show'
  )

  const conflict = activeAppts.find((a) => {
    const aStart = timeToMinutes(a.startTime)
    const aDur = a.duration || a.serviceDuration || 60
    const aEndWithBuffer = aStart + aDur + bufferTimeMinutes
    return doIntervalsOverlap(slotStartMins, slotEndMins, aStart, aEndWithBuffer)
  })

  if (conflict) {
    const msg = `Conflicting appointment for ${conflict.clientName} (${conflict.startTime} - ${conflict.endTime})`
    return { available: false, conflictReason: msg, reason: msg }
  }

  return { available: true }
}

/**
 * Checks if an appointment can be cancelled under salon policies
 */
export function canCancelAppointment(
  appointment: Appointment,
  settings?: BookingSettings
): { allowed: boolean; warning?: string; hoursRemaining: number } {
  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    return { allowed: false, warning: 'This appointment cannot be cancelled.', hoursRemaining: 0 }
  }

  const apptDateTime = new Date(`${appointment.date}T${appointment.startTime}:00`)
  const now = new Date()
  const diffHours = (apptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  const minNotice = settings?.cancellationWindowHours ?? 24

  if (diffHours < 0) {
    return { allowed: false, warning: 'Past appointment cannot be cancelled.', hoursRemaining: 0 }
  }

  if (diffHours < minNotice) {
    return {
      allowed: true,
      warning: `Late Cancellation Notice: Our policy asks for at least ${minNotice} hours notice. Cancellations with less notice may forfeit their deposit.`,
      hoursRemaining: Math.max(0, Math.round(diffHours)),
    }
  }

  return { allowed: true, hoursRemaining: Math.round(diffHours) }
}

/**
 * Checks if an appointment can be rescheduled under salon policies
 */
export function canRescheduleAppointment(
  appointment: Appointment,
  settings?: BookingSettings
): { allowed: boolean; warning?: string } {
  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    return { allowed: false, warning: 'Completed or cancelled appointments cannot be rescheduled.' }
  }

  const apptDateTime = new Date(`${appointment.date}T${appointment.startTime}:00`)
  const now = new Date()
  const diffHours = (apptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  const minNotice = settings?.rescheduleWindowHours ?? 12

  if (diffHours < minNotice) {
    return {
      allowed: false,
      warning: `Rescheduling requires at least ${minNotice} hours advance notice. Please contact salon concierge directly.`,
    }
  }

  return { allowed: true }
}
