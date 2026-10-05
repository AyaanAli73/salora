import React, { useState } from 'react'
import { Staff } from '@/types'
import { Drawer } from '@/components/ui/Drawer'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Clock, Calendar, Check, X } from 'lucide-react'

interface StaffScheduleDrawerProps {
  isOpen: boolean
  onClose: () => void
  staffList: Staff[]
  selectedStaff?: Staff | null
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const StaffScheduleDrawer: React.FC<StaffScheduleDrawerProps> = ({
  isOpen,
  onClose,
  staffList,
  selectedStaff,
}) => {
  const [activeDay, setActiveDay] = useState<string>('Mon')

  const displayedStaff = selectedStaff ? [selectedStaff] : staffList

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={selectedStaff ? `${selectedStaff.name}'s Schedule` : 'Salon Team Schedule'}
      description="View working rosters, daily shift hours, and scheduled break intervals."
      size="xl"
    >
      <div className="space-y-6">
        {/* Day selector tabs */}
        {!selectedStaff && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-subtle border border-border overflow-x-auto">
            {daysOfWeek.map((day) => {
              const active = activeDay === day
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDay(day)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        )}

        {/* Schedule Grid */}
        <div className="space-y-3">
          {displayedStaff.map((staff) => {
            if (selectedStaff) {
              // Full week breakdown for single selected specialist
              return (
                <div key={staff.id} className="space-y-3">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-subtle border border-border">
                    <Avatar name={staff.name} src={staff.avatarUrl} size="md" />
                    <div>
                      <h2 className="text-sm font-bold text-text-primary">{staff.name}</h2>
                      <p className="text-xs text-primary font-medium">{staff.role}</p>
                    </div>
                  </div>

                  <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-surface">
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
                              <Check className="h-3 w-3" /> Working
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              <X className="h-3 w-3" /> Day Off
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
                </div>
              )
            }

            // Overview for all staff on activeDay
            const schedule = staff.weeklySchedule?.find((s) => s.day === activeDay)
            const isWorking = schedule?.isWorking ?? false

            return (
              <div
                key={staff.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <Avatar name={staff.name} src={staff.avatarUrl} size="md" />
                  <div>
                    <h2 className="text-sm font-bold text-text-primary">{staff.name}</h2>
                    <p className="text-xs text-primary font-medium">{staff.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {isWorking ? (
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary tabular-nums">
                        <Clock className="h-3.5 w-3.5 text-text-muted" />
                        <span>
                          {schedule?.startTime || staff.startTime || '09:00'} -{' '}
                          {schedule?.endTime || staff.endTime || '18:00'}
                        </span>
                      </div>

                      {(schedule?.breakTime || staff.breakTime) && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 tabular-nums">
                          Break:{' '}
                          {schedule?.breakTime?.startTime || staff.breakTime?.startTime || '13:00'} -{' '}
                          {schedule?.breakTime?.endTime || staff.breakTime?.endTime || '14:00'}
                        </span>
                      )}

                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        On Duty
                      </span>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Off Duty
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Drawer>
  )
}
