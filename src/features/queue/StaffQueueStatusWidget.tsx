import React from 'react'
import { Staff, Token } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Users, Clock, CheckCircle2, UserCheck, Scissors } from 'lucide-react'

interface StaffQueueStatusWidgetProps {
  staffList: Staff[]
  tokens: Token[]
  selectedStaffId: string
  onSelectStaffId: (staffId: string) => void
}

export const StaffQueueStatusWidget: React.FC<StaffQueueStatusWidgetProps> = ({
  staffList,
  tokens,
  selectedStaffId,
  onSelectStaffId,
}) => {
  return (
    <Card className="border border-border/80 bg-surface shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-bold text-text-primary">
            Available Specialists
          </CardTitle>
        </div>
        <span className="text-[11px] text-text-muted">Live Roster</span>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-border/70">
          {staffList.map((staff) => {
            const isSelected = selectedStaffId === staff.id

            // Current customer: in service or called
            const currentCustomer = tokens.find(
              (t) =>
                t.staffId === staff.id &&
                (t.status === 'IN_SERVICE' || t.status === 'CALLED')
            )

            // Next customer in waiting queue
            const nextCustomer = tokens.find(
              (t) => t.staffId === staff.id && t.status === 'WAITING'
            )

            const totalQueued = tokens.filter(
              (t) =>
                t.staffId === staff.id &&
                (t.status === 'WAITING' ||
                  t.status === 'CALLED' ||
                  t.status === 'IN_SERVICE' ||
                  t.status === 'HOLD')
            ).length

            const isBusy = Boolean(currentCustomer)
            const isOnLeave = staff.status === 'on-leave' || staff.todayStatus === 'on-leave'

            return (
              <div
                key={staff.id}
                onClick={() => onSelectStaffId(isSelected ? 'all' : staff.id)}
                className={`p-3.5 hover:bg-surface-subtle/50 transition-colors cursor-pointer space-y-2 ${
                  isSelected ? 'bg-primary/[0.04] border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      name={staff.name}
                      src={staff.avatarUrl}
                      size="sm"
                      status={isOnLeave ? 'offline' : isBusy ? 'busy' : 'online'}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">
                        {staff.name}
                      </p>
                      <p className="text-[10px] text-primary font-semibold truncate">
                        {staff.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isOnLeave ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
                        On Leave
                      </span>
                    ) : isBusy ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                        In Service
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200">
                        Available
                      </span>
                    )}

                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-surface-subtle text-text-muted border border-border tabular-nums">
                      {totalQueued}
                    </span>
                  </div>
                </div>

                {/* Current & Next Customer breakdown */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-1.5 rounded-lg bg-surface border border-border/80">
                    <span className="text-[10px] text-text-muted block font-semibold uppercase">
                      Current Client
                    </span>
                    {currentCustomer ? (
                      <p className="font-bold text-text-primary truncate">
                        <span className="text-primary mr-1">{currentCustomer.displayNumber}</span>
                        {currentCustomer.clientName}
                      </p>
                    ) : (
                      <p className="text-text-muted italic text-[10px]">Station Ready</p>
                    )}
                  </div>

                  <div className="p-1.5 rounded-lg bg-surface border border-border/80">
                    <span className="text-[10px] text-text-muted block font-semibold uppercase">
                      Next in Line
                    </span>
                    {nextCustomer ? (
                      <p className="font-bold text-text-secondary truncate">
                        <span className="text-amber-600 mr-1">{nextCustomer.displayNumber}</span>
                        {nextCustomer.clientName}
                      </p>
                    ) : (
                      <p className="text-text-muted italic text-[10px]">Queue Clear</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
