import React, { useState, useEffect } from 'react'
import {
  Clock,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import {
  Staff,
  StaffShift,
  StaffShiftAssignment,
} from '@/types'
import { staffService } from '@/services/staffService'
import { staffAttendanceService } from '@/services/staffAttendanceService'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ShiftModal } from './ShiftModal'
import { AssignShiftModal } from './AssignShiftModal'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const StaffShiftsView: React.FC = () => {
  const { addToast } = useToastStore()
  const [shifts, setShifts] = useState<StaffShift[]>([])
  const [assignments, setAssignments] = useState<StaffShiftAssignment[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<StaffShift | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [preselectedStaffId, setPreselectedStaffId] = useState<string | undefined>(undefined)

  const loadData = async () => {
    try {
      const [allStaff, allShifts, allAssigns] = await Promise.all([
        staffService.getAll(),
        Promise.resolve(staffAttendanceService.getShifts()),
        Promise.resolve(staffAttendanceService.getShiftAssignments()),
      ])
      setStaffList(allStaff)
      setShifts(allShifts)
      setAssignments(allAssigns)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDeleteShift = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to deactivate shift "${name}"?`)) {
      staffAttendanceService.deleteShift(id)
      addToast({
        title: 'Shift Removed',
        message: `Shift "${name}" has been deactivated.`,
        type: 'info',
      })
      loadData()
    }
  }

  const handleRemoveAssignment = (id: string, staffName: string) => {
    if (window.confirm(`Remove shift assignment for ${staffName}?`)) {
      staffAttendanceService.removeShiftAssignment(id)
      addToast({
        title: 'Assignment Removed',
        message: `Shift assignment for ${staffName} removed.`,
        type: 'info',
      })
      loadData()
    }
  }

  // Get active shift for a staff on a given day name
  const getStaffDayShift = (staffId: string, dayName: string): StaffShift | undefined => {
    const assign = assignments.find((a) => {
      if (a.staffId !== staffId) return false
      return a.daysOfWeek?.includes(dayName)
    })
    if (assign) {
      return shifts.find((s) => s.id === assign.shiftId)
    }
    return undefined
  }

  return (
    <div className="space-y-6">
      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Shift Templates & Schedules</h2>
          <p className="text-xs text-text-muted">
            Configure standard salon operating shifts, weekend peak times, and staff rosters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => {
              setEditingShift(null)
              setIsShiftModalOpen(true)
            }}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Shift
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              setPreselectedStaffId(undefined)
              setIsAssignModalOpen(true)
            }}
            leftIcon={<Calendar className="h-4 w-4" />}
            className="shadow-glow-primary/20"
          >
            Assign Shift
          </Button>
        </div>
      </div>

      {/* 1. Shift Templates Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts.map((shift) => {
          const assignedCount = assignments.filter((a) => a.shiftId === shift.id).length
          return (
            <Card key={shift.id} hoverEffect className="relative overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: shift.color || '#3B82F6' }}
              />
              <CardContent className="p-4 pt-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-white shadow-xs"
                      style={{ backgroundColor: shift.color || '#3B82F6' }}
                    >
                      {shift.code}
                    </span>
                    <h3 className="font-bold text-sm text-text-primary">{shift.name}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingShift(shift)
                        setIsShiftModalOpen(true)
                      }}
                      aria-label={`Edit ${shift.name}`}
                      className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    {!shift.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleDeleteShift(shift.id, shift.name)}
                        aria-label={`Delete ${shift.name}`}
                        className="p-1 rounded text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                  <div className="flex items-center gap-1.5 text-text-primary font-semibold tabular-nums">
                    <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>
                      {shift.startTime} — {shift.endTime}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted">
                    {shift.unpaidBreakMinutes}m unpaid break
                  </span>
                </div>

                {shift.description && (
                  <p className="text-xs text-text-muted truncate">{shift.description}</p>
                )}

                <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                  <span>Assigned Specialists:</span>
                  <Badge variant={assignedCount > 0 ? 'primary' : 'default'} size="sm">
                    {assignedCount} Specialist{assignedCount === 1 ? '' : 's'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 2. Weekly Roster Matrix */}
      <Card>
        <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-text-primary">
              Weekly Team Shift Roster
            </CardTitle>
            <p className="text-xs text-text-muted">
              Live schedule overview mapped across each specialist&apos;s working days
            </p>
          </div>
          <span className="text-[11px] font-semibold text-text-muted">
            Mon — Sun Coverage
          </span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-text-muted font-semibold select-none">
              <tr>
                <th className="py-3 px-4 min-w-[160px]">Specialist</th>
                {DAYS.map((day) => (
                  <th key={day} className="py-3 px-3 text-center min-w-[110px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staffList.map((st) => (
                <tr key={st.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={st.name} src={st.avatarUrl} size="sm" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-text-primary truncate">
                          {st.name}
                        </span>
                        <span className="text-[10px] text-text-muted truncate">{st.role}</span>
                      </div>
                    </div>
                  </td>
                  {DAYS.map((day) => {
                    const shift = getStaffDayShift(st.id, day)
                    return (
                      <td key={day} className="py-2.5 px-2 text-center">
                        {shift ? (
                          <div
                            className="inline-flex flex-col items-center justify-center px-2 py-1 rounded-lg text-white font-medium text-[10px] shadow-xs max-w-[100px] mx-auto"
                            style={{ backgroundColor: shift.color || '#3B82F6' }}
                          >
                            <span className="font-bold truncate w-full text-center">
                              {shift.code}
                            </span>
                            <span className="text-[9px] opacity-90 tabular-nums">
                              {shift.startTime}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] text-text-muted bg-muted/40 font-medium">
                            Off
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 3. Detailed Shift Assignments Table */}
      <Card>
        <CardHeader className="p-4 pb-2 border-b border-border">
          <CardTitle className="text-sm font-bold text-text-primary">
            Active Shift Assignments
          </CardTitle>
          <p className="text-xs text-text-muted">
            All permanent and temporary recurring shift allocations
          </p>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-text-muted font-semibold select-none">
              <tr>
                <th className="py-3 px-4">Specialist</th>
                <th className="py-3 px-4">Shift</th>
                <th className="py-3 px-4">Assignment Type</th>
                <th className="py-3 px-4">Active Days / Dates</th>
                <th className="py-3 px-4">Assigned By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    No active shift assignments. Click &quot;Assign Shift&quot; to configure staff rosters.
                  </td>
                </tr>
              ) : (
                assignments.map((assign) => {
                  const shift = shifts.find((s) => s.id === assign.shiftId)
                  return (
                    <tr key={assign.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-text-primary">
                        {assign.staffName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: shift?.color || '#3B82F6' }}
                          />
                          <span className="font-semibold text-text-primary">
                            {assign.shiftName}
                          </span>
                          {shift && (
                            <span className="text-[11px] text-text-muted tabular-nums">
                              ({shift.startTime} — {shift.endTime})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            assign.assignmentType === 'PERMANENT'
                              ? 'primary'
                              : assign.assignmentType === 'TEMPORARY'
                              ? 'warning'
                              : 'accent'
                          }
                          size="sm"
                        >
                          {assign.assignmentType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-text-primary">
                        {assign.assignmentType === 'SPECIFIC_DATE' ? (
                          <span className="font-mono tabular-nums">{assign.specificDate}</span>
                        ) : assign.assignmentType === 'TEMPORARY' ? (
                          <span>
                            {assign.daysOfWeek?.join(', ')} ({assign.startDate} to {assign.endDate})
                          </span>
                        ) : (
                          <span>{assign.daysOfWeek?.join(', ')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-muted">
                        {assign.assignedBy || 'Ayaan (Owner)'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAssignment(assign.id, assign.staffName)}
                          className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-7 px-2"
                        >
                          Remove
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

      {/* Modals */}
      {isShiftModalOpen && (
        <ShiftModal
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          onSuccess={loadData}
          shiftToEdit={editingShift}
        />
      )}

      {isAssignModalOpen && (
        <AssignShiftModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={loadData}
          staffList={staffList}
          shifts={shifts}
          preselectedStaffId={preselectedStaffId}
        />
      )}
    </div>
  )
}
