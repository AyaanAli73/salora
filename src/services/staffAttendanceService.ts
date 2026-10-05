import {
  StaffShift,
  StaffShiftAssignment,
  StaffAttendanceRecord,
  StaffAttendanceBreak,
  StaffLeaveRequest,
  AttendanceStatus,
  LeaveRequestStatus,
  LeaveType,
  StaffAttendanceSummary,
  AttendanceDashboardStats,
  StaffScheduleCalendarEvent,
  Staff,
} from '@/types'
import { DEFAULT_SHIFTS } from '@/data/mockStaffAttendance'
import { staffService } from './staffService'
import { auditLogService } from './auditLogService'
import { timeToMinutes, minutesToTime, getDayNameFromDate } from '@/utils/availability'

// Clear mock attendance records from localStorage if present
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('SALORA_staff_attendance')
    if (raw && (raw.includes('att-') || raw.includes('Marcus') || raw.includes('Chloe'))) {
      localStorage.removeItem('SALORA_staff_attendance')
      localStorage.removeItem('SALORA_staff_leaves')
      localStorage.removeItem('SALORA_shift_assignments')
    }
  } catch {}
}

const DEFAULT_SHIFT_ASSIGNMENTS: StaffShiftAssignment[] = []
const DEFAULT_ATTENDANCE_RECORDS: StaffAttendanceRecord[] = []
const DEFAULT_LEAVE_REQUESTS: StaffLeaveRequest[] = []

const STORAGE_KEYS = {
  SHIFTS: 'SALORA_staff_shifts',
  ASSIGNMENTS: 'SALORA_shift_assignments',
  ATTENDANCE: 'SALORA_staff_attendance',
  LEAVES: 'SALORA_staff_leaves',
}

function getStoredItem<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn(`Error reading localStorage key ${key}:`, err)
  }
  localStorage.setItem(key, JSON.stringify(defaultVal))
  return defaultVal
}

function saveStoredItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.warn(`Error saving to localStorage key ${key}:`, err)
  }
}

export const staffAttendanceService = {
  // ==========================================
  // 1. SHIFTS MANAGEMENT
  // ==========================================

  getShifts(): StaffShift[] {
    return getStoredItem<StaffShift[]>(STORAGE_KEYS.SHIFTS, DEFAULT_SHIFTS)
  },

  getShiftById(id: string): StaffShift | undefined {
    return this.getShifts().find((s) => s.id === id)
  },

  createShift(shift: Omit<StaffShift, 'id'>): StaffShift {
    const shifts = this.getShifts()
    const newShift: StaffShift = {
      ...shift,
      id: `shift-${Date.now()}`,
    }
    const updated = [...shifts, newShift]
    saveStoredItem(STORAGE_KEYS.SHIFTS, updated)
    return newShift
  },

  updateShift(id: string, updates: Partial<StaffShift>): StaffShift {
    const shifts = this.getShifts()
    const idx = shifts.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error('Shift not found')
    const updated = { ...shifts[idx], ...updates }
    shifts[idx] = updated
    saveStoredItem(STORAGE_KEYS.SHIFTS, shifts)
    return updated
  },

  deleteShift(id: string): boolean {
    const shifts = this.getShifts()
    const target = shifts.find((s) => s.id === id)
    if (!target) return false
    if (target.isDefault) {
      target.active = false
      saveStoredItem(STORAGE_KEYS.SHIFTS, shifts)
      return true
    }
    const filtered = shifts.filter((s) => s.id !== id)
    saveStoredItem(STORAGE_KEYS.SHIFTS, filtered)
    return true
  },

  // ==========================================
  // 2. SHIFT ASSIGNMENTS
  // ==========================================

  getShiftAssignments(): StaffShiftAssignment[] {
    return getStoredItem<StaffShiftAssignment[]>(
      STORAGE_KEYS.ASSIGNMENTS,
      DEFAULT_SHIFT_ASSIGNMENTS
    )
  },

  assignShift(
    data: Omit<StaffShiftAssignment, 'id' | 'assignedAt' | 'assignedBy'>,
    assignedBy = 'Ayaan (Owner)'
  ): StaffShiftAssignment {
    const list = this.getShiftAssignments()
    const newAssign: StaffShiftAssignment = {
      ...data,
      id: `assign-${Date.now()}`,
      assignedBy,
      assignedAt: new Date().toISOString(),
    }
    const updated = [...list, newAssign]
    saveStoredItem(STORAGE_KEYS.ASSIGNMENTS, updated)

    auditLogService.log({
      action: 'SHIFT_ASSIGNED',
      entityType: 'staff_shift',
      entityId: newAssign.id,
      performedBy: assignedBy,
      userRole: 'manager',
      details: `Assigned shift "${newAssign.shiftName}" to ${newAssign.staffName} (${newAssign.assignmentType}).`,
    })

    return newAssign
  },

  removeShiftAssignment(id: string): boolean {
    const list = this.getShiftAssignments()
    const filtered = list.filter((a) => a.id !== id)
    saveStoredItem(STORAGE_KEYS.ASSIGNMENTS, filtered)
    return true
  },

  getStaffShiftForDate(staffId: string, dateStr: string): StaffShift | undefined {
    const assignments = this.getShiftAssignments()
    const shifts = this.getShifts()

    // 1. Check for specific date override assignment
    const specific = assignments.find(
      (a) =>
        a.staffId === staffId &&
        a.assignmentType === 'SPECIFIC_DATE' &&
        a.specificDate === dateStr
    )
    if (specific) {
      const shift = shifts.find((s) => s.id === specific.shiftId)
      if (shift) return shift
    }

    // 2. Check for permanent/temporary recurring assignments
    const dayOfWeek = getDayNameFromDate(dateStr)
    const recurring = assignments.find((a) => {
      if (a.staffId !== staffId) return false
      if (a.daysOfWeek && a.daysOfWeek.includes(dayOfWeek)) {
        if (a.assignmentType === 'TEMPORARY' && a.startDate && a.endDate) {
          return dateStr >= a.startDate && dateStr <= a.endDate
        }
        return true
      }
      return false
    })

    if (recurring) {
      const shift = shifts.find((s) => s.id === recurring.shiftId)
      if (shift) return shift
    }

    // 3. Fallback: Morning shift default
    return shifts[0]
  },

  // ==========================================
  // 3. ATTENDANCE CLOCK-IN / CLOCK-OUT & BREAKS
  // ==========================================

  getAllAttendance(): StaffAttendanceRecord[] {
    return getStoredItem<StaffAttendanceRecord[]>(
      STORAGE_KEYS.ATTENDANCE,
      DEFAULT_ATTENDANCE_RECORDS
    )
  },

  getAttendanceRecords(filter?: {
    date?: string
    staffId?: string
    status?: AttendanceStatus | 'ALL'
  }): StaffAttendanceRecord[] {
    let list = this.getAllAttendance()
    if (!filter) return list.sort((a, b) => (a.date > b.date ? -1 : 1))

    if (filter.date) {
      list = list.filter((r) => r.date === filter.date)
    }
    if (filter.staffId && filter.staffId !== 'ALL') {
      list = list.filter((r) => r.staffId === filter.staffId)
    }
    if (filter.status && filter.status !== 'ALL') {
      list = list.filter((r) => r.status === filter.status)
    }
    return list.sort((a, b) => (a.date > b.date ? -1 : 1))
  },

  getAttendanceForStaffToday(staffId: string): StaffAttendanceRecord | undefined {
    const today = new Date().toISOString().split('T')[0]
    return this.getAllAttendance().find((r) => r.staffId === staffId && r.date === today)
  },

  async clockIn(
    staffId: string,
    customTime?: string,
    notes?: string,
    device = 'Salon Front Desk iPad (Station #1)'
  ): Promise<StaffAttendanceRecord> {
    const staff = await staffService.getById(staffId)
    if (!staff) throw new Error('Staff member not found')

    const todayStr = new Date().toISOString().split('T')[0]
    const currentTimeStr =
      customTime ||
      new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })

    const assignedShift = this.getStaffShiftForDate(staffId, todayStr)

    // Calculate late arrival
    let lateMinutes = 0
    let status: AttendanceStatus = 'PRESENT'

    if (assignedShift) {
      const shiftStartMins = timeToMinutes(assignedShift.startTime)
      const clockInMins = timeToMinutes(currentTimeStr)
      if (clockInMins > shiftStartMins + 5) {
        // 5-minute grace period
        lateMinutes = clockInMins - shiftStartMins
        status = 'LATE'
      }
    }

    const records = this.getAllAttendance()
    const existingIdx = records.findIndex((r) => r.staffId === staffId && r.date === todayStr)

    const nowIso = new Date().toISOString()
    let record: StaffAttendanceRecord

    if (existingIdx !== -1) {
      record = {
        ...records[existingIdx],
        clockIn: currentTimeStr,
        status,
        lateMinutes,
        shiftId: assignedShift?.id,
        shiftName: assignedShift ? `${assignedShift.name} (${assignedShift.startTime} — ${assignedShift.endTime})` : undefined,
        notes: notes || records[existingIdx].notes,
        locationDeviceMetadata: {
          device,
          ipAddress: '192.168.1.105',
          verifiedBy: 'Salon Front Desk',
        },
        updatedAt: nowIso,
      }
      records[existingIdx] = record
    } else {
      record = {
        id: `att-${Date.now()}`,
        staffId: staff.id,
        staffName: staff.name,
        staffRole: staff.role,
        avatarUrl: staff.avatarUrl,
        date: todayStr,
        clockIn: currentTimeStr,
        status,
        shiftId: assignedShift?.id,
        shiftName: assignedShift ? `${assignedShift.name} (${assignedShift.startTime} — ${assignedShift.endTime})` : undefined,
        lateMinutes,
        breaks: [],
        notes: notes || (status === 'LATE' ? `Late arrival by ${lateMinutes} mins.` : 'Punctual clock-in.'),
        locationDeviceMetadata: {
          device,
          ipAddress: '192.168.1.105',
          verifiedBy: 'Salon Front Desk',
        },
        createdAt: nowIso,
        updatedAt: nowIso,
      }
      records.unshift(record)
    }

    saveStoredItem(STORAGE_KEYS.ATTENDANCE, records)

    // Sync todayStatus in staffService
    staffService.updateStatus(staffId, 'available').catch(console.warn)

    auditLogService.log({
      action: 'STAFF_CLOCK_IN',
      entityType: 'attendance',
      entityId: record.id,
      performedBy: staff.name,
      userRole: 'staff',
      details: `${staff.name} clocked in at ${currentTimeStr}${
        lateMinutes > 0 ? ` (${lateMinutes} mins late for ${assignedShift?.name})` : ''
      }.`,
      metadata: { lateMinutes, device, status },
    })

    return record
  },

  async clockOut(
    staffId: string,
    customTime?: string,
    notes?: string
  ): Promise<StaffAttendanceRecord> {
    const todayStr = new Date().toISOString().split('T')[0]
    const currentTimeStr =
      customTime ||
      new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })

    const records = this.getAllAttendance()
    const idx = records.findIndex((r) => r.staffId === staffId && r.date === todayStr)
    if (idx === -1) {
      throw new Error('No clock-in record found for today. Please clock in first.')
    }

    const current = records[idx]
    const clockInMins = timeToMinutes(current.clockIn || '09:00')
    const clockOutMins = timeToMinutes(currentTimeStr)

    // Calculate unpaid break minutes
    const unpaidBreakMins = (current.breaks || [])
      .filter((b) => b.isUnpaid && b.durationMinutes)
      .reduce((sum, b) => sum + (b.durationMinutes || 0), 0)

    const rawWorkingMins = Math.max(0, clockOutMins - clockInMins)
    const netWorkingMins = Math.max(0, rawWorkingMins - unpaidBreakMins)
    const workingHours = Number((netWorkingMins / 60).toFixed(2))

    const updatedRecord: StaffAttendanceRecord = {
      ...current,
      clockOut: currentTimeStr,
      workingHours,
      notes: notes ? `${current.notes || ''} • ${notes}` : current.notes,
      updatedAt: new Date().toISOString(),
    }

    records[idx] = updatedRecord
    saveStoredItem(STORAGE_KEYS.ATTENDANCE, records)

    // Mark staff off-duty in staffService
    staffService.updateStatus(staffId, 'off-duty').catch(console.warn)

    auditLogService.log({
      action: 'STAFF_CLOCK_OUT',
      entityType: 'attendance',
      entityId: updatedRecord.id,
      performedBy: current.staffName,
      userRole: 'staff',
      details: `${current.staffName} clocked out at ${currentTimeStr}. Completed ${workingHours} hrs working time.`,
      metadata: { workingHours, unpaidBreakMins },
    })

    return updatedRecord
  },

  startBreak(
    staffId: string,
    reason = 'Standard Rest / Meal Break',
    isUnpaid = true
  ): StaffAttendanceRecord {
    const todayStr = new Date().toISOString().split('T')[0]
    const records = this.getAllAttendance()
    const idx = records.findIndex((r) => r.staffId === staffId && r.date === todayStr)
    if (idx === -1) throw new Error('Must clock in before starting a break.')

    const current = records[idx]
    const currentTimeStr = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })

    const newBreak: StaffAttendanceBreak = {
      id: `brk-${Date.now()}`,
      breakStartTime: currentTimeStr,
      reason,
      isUnpaid,
    }

    current.breaks = [...(current.breaks || []), newBreak]
    current.updatedAt = new Date().toISOString()
    records[idx] = current
    saveStoredItem(STORAGE_KEYS.ATTENDANCE, records)

    // Update staff status to busy / break
    staffService.updateStatus(staffId, 'busy').catch(console.warn)

    auditLogService.log({
      action: 'STAFF_BREAK_START',
      entityType: 'attendance',
      entityId: current.id,
      performedBy: current.staffName,
      userRole: 'staff',
      details: `${current.staffName} started break (${reason}) at ${currentTimeStr}.`,
    })

    return current
  },

  endBreak(staffId: string): StaffAttendanceRecord {
    const todayStr = new Date().toISOString().split('T')[0]
    const records = this.getAllAttendance()
    const idx = records.findIndex((r) => r.staffId === staffId && r.date === todayStr)
    if (idx === -1) throw new Error('No attendance record found for today.')

    const current = records[idx]
    const currentTimeStr = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })

    const openBreakIdx = (current.breaks || []).findIndex((b) => !b.breakEndTime)
    if (openBreakIdx !== -1) {
      const openBreak = current.breaks[openBreakIdx]
      const startMins = timeToMinutes(openBreak.breakStartTime)
      const endMins = timeToMinutes(currentTimeStr)
      const duration = Math.max(1, endMins - startMins)

      current.breaks[openBreakIdx] = {
        ...openBreak,
        breakEndTime: currentTimeStr,
        durationMinutes: duration,
      }
      current.updatedAt = new Date().toISOString()
      records[idx] = current
      saveStoredItem(STORAGE_KEYS.ATTENDANCE, records)

      // Revert staff status to available
      staffService.updateStatus(staffId, 'available').catch(console.warn)

      auditLogService.log({
        action: 'STAFF_BREAK_END',
        entityType: 'attendance',
        entityId: current.id,
        performedBy: current.staffName,
        userRole: 'staff',
        details: `${current.staffName} ended break at ${currentTimeStr} (${duration} mins).`,
      })
    }

    return current
  },

  manualUpdateRecord(
    recordId: string,
    updates: Partial<StaffAttendanceRecord>,
    adminName = 'Ayaan (Owner)'
  ): StaffAttendanceRecord {
    const records = this.getAllAttendance()
    const idx = records.findIndex((r) => r.id === recordId)
    if (idx === -1) throw new Error('Attendance record not found')

    const updated = {
      ...records[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    records[idx] = updated
    saveStoredItem(STORAGE_KEYS.ATTENDANCE, records)

    auditLogService.log({
      action: 'STAFF_CLOCK_IN',
      entityType: 'attendance',
      entityId: updated.id,
      performedBy: adminName,
      userRole: 'owner',
      details: `Manually updated attendance for ${updated.staffName} on ${updated.date} (Status: ${updated.status}).`,
    })

    return updated
  },

  getTodayStats(): AttendanceDashboardStats {
    const todayStr = new Date().toISOString().split('T')[0]
    const records = this.getAttendanceRecords({ date: todayStr })

    const presentToday = records.filter(
      (r) => r.status === 'PRESENT' || r.status === 'HALF_DAY'
    ).length
    const lateToday = records.filter((r) => r.status === 'LATE').length
    const onLeaveToday = records.filter((r) => r.status === 'LEAVE').length
    const absentToday = records.filter((r) => r.status === 'ABSENT').length

    const totalStaff = 5 // standard team count
    const totalActive = presentToday + lateToday
    const attendanceRate = totalStaff > 0 ? Math.round((totalActive / totalStaff) * 100) : 0

    return {
      presentToday,
      absentToday,
      lateToday,
      onLeaveToday,
      totalStaff,
      attendanceRate,
    }
  },

  // ==========================================
  // 4. LEAVE MANAGEMENT
  // ==========================================

  getLeaveRequests(filter?: {
    staffId?: string
    status?: LeaveRequestStatus | 'ALL'
  }): StaffLeaveRequest[] {
    let list = getStoredItem<StaffLeaveRequest[]>(STORAGE_KEYS.LEAVES, DEFAULT_LEAVE_REQUESTS)
    if (!filter) return list.sort((a, b) => (a.fromDate > b.fromDate ? -1 : 1))

    if (filter.staffId && filter.staffId !== 'ALL') {
      list = list.filter((r) => r.staffId === filter.staffId)
    }
    if (filter.status && filter.status !== 'ALL') {
      list = list.filter((r) => r.status === filter.status)
    }
    return list.sort((a, b) => (a.fromDate > b.fromDate ? -1 : 1))
  },

  async requestLeave(data: {
    staffId: string
    leaveType: LeaveType
    fromDate: string
    toDate: string
    reason: string
  }): Promise<StaffLeaveRequest> {
    const staff = await staffService.getById(data.staffId)
    if (!staff) throw new Error('Staff not found')

    const start = new Date(data.fromDate).getTime()
    const end = new Date(data.toDate).getTime()
    const daysCount = Math.max(1, Math.round((end - start) / (1000 * 3600 * 24)) + 1)

    const leaves = this.getLeaveRequests()
    const newLeave: StaffLeaveRequest = {
      id: `leave-${Date.now()}`,
      staffId: staff.id,
      staffName: staff.name,
      staffRole: staff.role,
      avatarUrl: staff.avatarUrl,
      leaveType: data.leaveType,
      fromDate: data.fromDate,
      toDate: data.toDate,
      daysCount,
      reason: data.reason,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
    }

    const updated = [newLeave, ...leaves]
    saveStoredItem(STORAGE_KEYS.LEAVES, updated)

    auditLogService.log({
      action: 'LEAVE_REQUESTED',
      entityType: 'staff_leave',
      entityId: newLeave.id,
      performedBy: staff.name,
      userRole: 'staff',
      details: `${staff.name} requested ${daysCount} day(s) of ${data.leaveType} leave (${data.fromDate} to ${data.toDate}).`,
    })

    return newLeave
  },

  approveLeave(leaveId: string, approvedBy = 'Ayaan (Owner)'): StaffLeaveRequest {
    const leaves = this.getLeaveRequests()
    const idx = leaves.findIndex((l) => l.id === leaveId)
    if (idx === -1) throw new Error('Leave request not found')

    const leave = leaves[idx]
    const updatedLeave: StaffLeaveRequest = {
      ...leave,
      status: 'APPROVED',
      approvedBy,
      approvedAt: new Date().toISOString(),
    }
    leaves[idx] = updatedLeave
    saveStoredItem(STORAGE_KEYS.LEAVES, leaves)

    // Mark attendance records on leave dates as LEAVE
    const records = this.getAllAttendance()
    const today = new Date().toISOString().split('T')[0]
    if (today >= leave.fromDate && today <= leave.toDate) {
      const todayRecordIdx = records.findIndex(
        (r) => r.staffId === leave.staffId && r.date === today
      )
      if (todayRecordIdx !== -1) {
        records[todayRecordIdx].status = 'LEAVE'
      } else {
        records.unshift({
          id: `att-leave-${Date.now()}`,
          staffId: leave.staffId,
          staffName: leave.staffName,
          staffRole: leave.staffRole,
          avatarUrl: leave.avatarUrl,
          date: today,
          status: 'LEAVE',
          breaks: [],
          notes: `Approved ${leave.leaveType} Leave: ${leave.reason}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
      saveStoredItem(STORAGE_KEYS.ATTENDANCE, records)

      // Also set staff status to on-leave in staffService
      staffService.updateStatus(leave.staffId, 'on-leave').catch(console.warn)
    }

    auditLogService.log({
      action: 'LEAVE_APPROVED',
      entityType: 'staff_leave',
      entityId: leave.id,
      performedBy: approvedBy,
      userRole: 'owner',
      details: `Approved ${leave.leaveType} leave for ${leave.staffName} (${leave.fromDate} to ${leave.toDate}).`,
    })

    return updatedLeave
  },

  rejectLeave(
    leaveId: string,
    rejectionReason: string,
    rejectedBy = 'Ayaan (Owner)'
  ): StaffLeaveRequest {
    const leaves = this.getLeaveRequests()
    const idx = leaves.findIndex((l) => l.id === leaveId)
    if (idx === -1) throw new Error('Leave request not found')

    const leave = leaves[idx]
    const updatedLeave: StaffLeaveRequest = {
      ...leave,
      status: 'REJECTED',
      rejectionReason,
      approvedBy: rejectedBy,
      approvedAt: new Date().toISOString(),
    }
    leaves[idx] = updatedLeave
    saveStoredItem(STORAGE_KEYS.LEAVES, leaves)

    auditLogService.log({
      action: 'LEAVE_REJECTED',
      entityType: 'staff_leave',
      entityId: leave.id,
      performedBy: rejectedBy,
      userRole: 'owner',
      details: `Rejected leave for ${leave.staffName}. Reason: "${rejectionReason}".`,
    })

    return updatedLeave
  },

  /**
   * Section 13: APPOINTMENT INTEGRATION
   * Determines if a staff member is on approved leave on a given date string (YYYY-MM-DD).
   * Used by availability slot calculators to prevent online/walk-in bookings.
   */
  isStaffOnLeaveOnDate(staffId: string, dateStr: string): boolean {
    const leaves = this.getLeaveRequests().filter(
      (l) => l.staffId === staffId && l.status === 'APPROVED'
    )
    return leaves.some((l) => dateStr >= l.fromDate && dateStr <= l.toDate)
  },

  // ==========================================
  // 5. ATTENDANCE SUMMARY FOR STAFF PROFILE
  // ==========================================

  getStaffAttendanceSummary(staffId: string): StaffAttendanceSummary {
    const allRecords = this.getAllAttendance().filter((r) => r.staffId === staffId)
    const leaves = this.getLeaveRequests().filter(
      (l) => l.staffId === staffId && l.status === 'APPROVED'
    )

    const daysPresent = allRecords.filter((r) => r.status === 'PRESENT').length
    const daysAbsent = allRecords.filter((r) => r.status === 'ABSENT').length
    const lateCount = allRecords.filter((r) => r.status === 'LATE').length
    const halfDays = allRecords.filter((r) => r.status === 'HALF_DAY').length
    const offDays = allRecords.filter((r) => r.status === 'OFF_DAY').length

    const totalHours = allRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0)
    const leaveUsed = leaves.reduce((sum, l) => sum + (l.daysCount || 0), 0)

    const todayStr = new Date().toISOString().split('T')[0]
    const todayRec = allRecords.find((r) => r.date === todayStr)

    return {
      staffId,
      daysPresent,
      daysAbsent,
      lateCount,
      totalHours: Number(totalHours.toFixed(1)),
      leaveUsed,
      halfDays,
      offDays,
      currentStatus: todayRec ? todayRec.status : 'OFF_DAY',
    }
  },

  // ==========================================
  // 6. STAFF CALENDAR EVENTS
  // ==========================================

  getCalendarEvents(
    startDate: string,
    endDate: string,
    staffId?: string
  ): StaffScheduleCalendarEvent[] {
    const events: StaffScheduleCalendarEvent[] = []
    const shifts = this.getShifts()
    const assignments = this.getShiftAssignments()
    const leaves = this.getLeaveRequests().filter((l) => l.status === 'APPROVED')
    const attendance = this.getAllAttendance()

    // Generate dates between start and end
    const curr = new Date(startDate)
    const end = new Date(endDate)

    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0]
      const dayName = getDayNameFromDate(dateStr)

      // Filter assignments
      assignments.forEach((assign) => {
        if (staffId && assign.staffId !== staffId) return

        let matches = false
        if (assign.assignmentType === 'SPECIFIC_DATE' && assign.specificDate === dateStr) {
          matches = true
        } else if (assign.daysOfWeek && assign.daysOfWeek.includes(dayName)) {
          matches = true
        }

        if (matches) {
          const shift = shifts.find((s) => s.id === assign.shiftId)
          if (shift) {
            events.push({
              id: `evt-shift-${assign.id}-${dateStr}`,
              staffId: assign.staffId,
              staffName: assign.staffName,
              date: dateStr,
              type: 'SHIFT',
              title: `${assign.staffName}: ${shift.name}`,
              startTime: shift.startTime,
              endTime: shift.endTime,
              color: shift.color,
            })
          }
        }
      })

      // Add approved leaves
      leaves.forEach((l) => {
        if (staffId && l.staffId !== staffId) return
        if (dateStr >= l.fromDate && dateStr <= l.toDate) {
          events.push({
            id: `evt-leave-${l.id}-${dateStr}`,
            staffId: l.staffId,
            staffName: l.staffName,
            date: dateStr,
            type: 'LEAVE',
            title: `${l.staffName}: ${l.leaveType} Leave`,
            color: '#EC4899', // Pink
            status: 'APPROVED',
          })
        }
      })

      curr.setDate(curr.getDate() + 1)
    }

    return events
  },
}
