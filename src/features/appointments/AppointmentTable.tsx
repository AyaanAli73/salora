import React from 'react'
import { Appointment } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { formatTime12Hour } from '@/utils/availability'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { AppointmentSourceBadge } from './AppointmentSourceBadge'
import { Table, Column } from '@/components/ui/Table'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Clock, Calendar } from 'lucide-react'

interface AppointmentTableProps {
  appointments: Appointment[]
  isLoading: boolean
  onSelectAppointment: (appointment: Appointment) => void
}

export const AppointmentTable: React.FC<AppointmentTableProps> = ({
  appointments,
  isLoading,
  onSelectAppointment,
}) => {
  const columns: Column<Appointment>[] = [
    {
      key: 'time',
      header: 'Time',
      cell: (row) => (
        <div className="flex flex-col tabular-nums">
          <span className="font-bold text-text-primary text-xs">
            {row.startTime} - {row.endTime}
          </span>
          <span className="text-[11px] text-text-muted">
            {row.date} ({formatTime12Hour(row.startTime)})
          </span>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.clientName} src={row.clientAvatar} size="sm" />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-text-primary text-xs truncate">
              {row.clientName}
            </span>
            <span className="text-[11px] text-text-muted">{row.clientPhone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Service',
      cell: (row) => (
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-text-primary text-xs truncate">
            {row.serviceName}
          </span>
          <span className="text-[11px] text-primary font-medium tabular-nums">
            {formatCurrency(row.totalAmount)}
          </span>
        </div>
      ),
    },
    {
      key: 'staff',
      header: 'Staff',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.staffName} src={row.staffAvatar} size="xs" />
          <span className="text-xs font-medium text-text-secondary truncate">
            {row.staffName}
          </span>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      cell: (row) => (
        <AppointmentSourceBadge source={row.bookingSource || 'ONLINE'} size="sm" />
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      cell: (row) => (
        <span className="text-xs text-text-muted tabular-nums">
          {row.duration || row.serviceDuration} mins
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <AppointmentStatusBadge
            status={row.status}
            size="sm"
            tokenNumber={row.tokenNumber}
          />
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onSelectAppointment(row)
          }}
          className="text-xs h-8 px-3"
        >
          Manage
        </Button>
      ),
    },
  ]

  return (
    <Card className="overflow-hidden border border-border">
      <Table
        columns={columns}
        data={appointments}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No appointments match your active filter."
        onRowClick={onSelectAppointment}
      />
    </Card>
  )
}
