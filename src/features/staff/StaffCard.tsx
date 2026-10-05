import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Star,
  MoreVertical,
  Calendar,
  Clock,
  ExternalLink,
  Edit,
  CheckCircle2,
  AlertCircle,
  Coffee,
  UserX,
} from 'lucide-react'
import { Staff, StaffStatus } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface StaffCardProps {
  staff: Staff
  onEdit?: (staff: Staff) => void
  onUpdateStatus?: (staffId: string, status: StaffStatus) => void
  onViewSchedule?: (staff: Staff) => void
}

export const StaffCard: React.FC<StaffCardProps> = ({
  staff,
  onEdit,
  onUpdateStatus,
  onViewSchedule,
}) => {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Available
          </span>
        )
      case 'busy':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Busy
          </span>
        )
      case 'on-leave':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            On Leave
          </span>
        )
      case 'off-duty':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Off Duty
          </span>
        )
    }
  }

  const effectiveStatus = staff.todayStatus || (staff.status === 'on-leave' ? 'on-leave' : staff.status === 'off-duty' ? 'off-duty' : 'available')

  return (
    <Card hoverEffect className="relative flex flex-col justify-between overflow-visible transition-shadow duration-200">
      <CardContent className="p-5 space-y-4">
        {/* Top bar: Avatar + Info + Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative cursor-pointer" onClick={() => navigate(`/staff/${staff.id}`)}>
              <Avatar
                name={staff.name}
                src={staff.avatarUrl}
                size="lg"
                status={effectiveStatus === 'available' ? 'online' : effectiveStatus === 'busy' ? 'busy' : 'offline'}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/staff/${staff.id}`)}
                  className="font-bold text-text-primary text-base truncate hover:text-primary transition-colors text-left font-sans"
                >
                  {staff.name}
                </button>
              </div>
              <span className="text-xs font-semibold text-primary">{staff.role}</span>
              <span className="text-xs text-text-muted truncate">{staff.phone}</span>
            </div>
          </div>

          {/* Three-dot menu button */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              aria-label={`Options for ${staff.name}`}
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 w-48 rounded-xl bg-surface border border-border shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false)
                      navigate(`/staff/${staff.id}`)
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-text-muted" />
                    View Profile
                  </button>

                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false)
                        onEdit(staff)
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5 text-text-muted" />
                      Edit Staff
                    </button>
                  )}

                  {onViewSchedule && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false)
                        onViewSchedule(staff)
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      <Calendar className="h-3.5 w-3.5 text-text-muted" />
                      View Schedule
                    </button>
                  )}

                  <div className="my-1 border-t border-border" />
                  <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Set Status
                  </div>

                  {onUpdateStatus && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false)
                          onUpdateStatus(staff.id, 'available')
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Available
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false)
                          onUpdateStatus(staff.id, 'busy')
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        Busy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false)
                          onUpdateStatus(staff.id, 'on-leave')
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                      >
                        <Coffee className="h-3.5 w-3.5" />
                        On Leave
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false)
                          onUpdateStatus(staff.id, 'off-duty')
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        Off Duty
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status + Rating row */}
        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <div>{getStatusBadge(effectiveStatus)}</div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 text-xs font-bold text-amber-500 tabular-nums">
              <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              <span>{staff.rating.toFixed(1)}</span>
            </div>
            <span className="text-[11px] text-text-muted">({staff.reviewCount})</span>
          </div>
        </div>

        {/* Specialties Tags */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Specialties
          </span>
          <div className="flex flex-wrap gap-1">
            {staff.specialties.slice(0, 3).map((spec) => (
              <Badge key={spec} variant="default" size="sm" className="text-[11px] font-medium py-0.5">
                {spec}
              </Badge>
            ))}
            {staff.specialties.length > 3 && (
              <Badge variant="default" size="sm" className="text-[11px] font-medium text-text-muted">
                +{staff.specialties.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* Appointments Today & Working Hours */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-surface-subtle border border-border/70">
            <div className="flex items-center gap-1 text-[10px] text-text-muted font-medium">
              <Calendar className="h-3 w-3" />
              <span>Bookings Today</span>
            </div>
            <p className="text-sm font-bold text-text-primary tabular-nums mt-0.5">
              {staff.appointmentsToday ?? 0} {staff.appointmentsToday === 1 ? 'client' : 'clients'}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-subtle border border-border/70">
            <div className="flex items-center gap-1 text-[10px] text-text-muted font-medium">
              <Clock className="h-3 w-3" />
              <span>Hours</span>
            </div>
            <p className="text-xs font-semibold text-text-primary tabular-nums mt-1 truncate">
              {staff.startTime || '09:00'} - {staff.endTime || '18:00'}
            </p>
          </div>
        </div>
      </CardContent>

      {/* Footer with view profile button */}
      <div className="px-5 py-3 bg-surface-subtle/50 border-t border-border flex items-center justify-between">
        <span className="text-xs text-text-muted tabular-nums">
          Commission: <strong className="text-text-primary">{staff.commissionRate}%</strong>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/staff/${staff.id}`)}
          className="text-xs"
        >
          View Profile
        </Button>
      </div>
    </Card>
  )
}
