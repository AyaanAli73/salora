import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Crown,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { Client } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Dropdown } from '@/components/ui/Dropdown'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface ClientTableProps {
  clients: Client[]
  selectedIds: string[]
  onToggleSelect: (id: string) => void
  onSelectAll: (select: boolean) => void
  onClientClick?: (client: Client) => void
  onEditClient?: (client: Client) => void
  onDeleteClient?: (id: string) => void
  onSendMessage?: (client: Client) => void
  pagination: {
    page: number
    totalPages: number
    total: number
    pageSize: number
    onPageChange: (page: number) => void
  }
  isLoading?: boolean
  className?: string
}

export const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClientClick,
  onEditClient,
  onDeleteClient,
  onSendMessage,
  pagination,
  isLoading = false,
  className,
}) => {
  const navigate = useNavigate()

  const allSelected = clients.length > 0 && clients.every((c) => selectedIds.includes(c.id))
  const someSelected = clients.some((c) => selectedIds.includes(c.id)) && !allSelected

  const handleRowClick = (client: Client) => {
    if (onClientClick) {
      onClientClick(client)
    } else {
      navigate(`/clients/${client.id}`)
    }
  }

  return (
    <div className={cn('flex flex-col justify-between', className)}>
      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border/80 bg-surface-subtle/70 text-text-secondary uppercase tracking-wider text-[11px] font-bold">
              {/* Checkbox */}
              <th className="py-3 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all clients on this page"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected
                  }}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 font-bold">Client</th>
              <th className="py-3 px-4 font-bold">Phone</th>
              <th className="py-3 px-4 font-bold">Email</th>
              <th className="py-3 px-4 text-center font-bold">Visits</th>
              <th className="py-3 px-4 font-bold">Last Visit</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 text-right font-bold w-14">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="py-4 px-4">
                    <div className="h-5 bg-surface-subtle rounded-md w-full" />
                  </td>
                </tr>
              ))
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-text-muted">
                  No clients match the current search or filters.
                </td>
              </tr>
            ) : (
              clients.map((client) => {
                const isSelected = selectedIds.includes(client.id)
                return (
                  <tr
                    key={client.id}
                    onClick={() => handleRowClick(client)}
                    className={cn(
                      'group hover:bg-surface-subtle/50 transition-[background-color] cursor-pointer',
                      isSelected && 'bg-primary-50/40 dark:bg-primary-950/20'
                    )}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select ${client.fullName}`}
                        checked={isSelected}
                        onChange={() => onToggleSelect(client.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>

                    {/* Avatar & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={client.fullName} src={client.avatarUrl} size="sm" />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-text-primary group-hover:text-primary transition-[color] truncate">
                              {client.fullName}
                            </span>
                            {client.isVip && (
                              <Crown className="h-3 w-3 text-accent shrink-0" aria-label="VIP Client" />
                            )}
                          </div>
                          {client.favoriteService && (
                            <span className="text-[11px] text-text-muted truncate">
                              {client.favoriteService}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 tabular-nums text-text-secondary whitespace-nowrap">
                      {client.phone}
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4 text-text-secondary truncate max-w-[180px]">
                      {client.email}
                    </td>

                    {/* Total Visits */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-text-primary tabular-nums bg-surface-subtle border border-border/80">
                        {client.totalVisits}
                      </span>
                    </td>

                    {/* Last Visit */}
                    <td className="py-3 px-4 text-text-secondary whitespace-nowrap tabular-nums">
                      {client.lastVisitDate ? formatDate(client.lastVisitDate) : '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={client.status} />
                    </td>

                    {/* Actions Menu */}
                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Dropdown
                        trigger={
                          <button
                            type="button"
                            aria-label={`Actions for ${client.fullName}`}
                            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-[background-color,color]"
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                          </button>
                        }
                        items={[
                          {
                            id: 'view',
                            label: 'View Profile',
                            icon: <Eye className="h-3.5 w-3.5" />,
                            onClick: () => navigate(`/clients/${client.id}`),
                          },
                          {
                            id: 'edit',
                            label: 'Edit Details',
                            icon: <Edit2 className="h-3.5 w-3.5" />,
                            onClick: () => onEditClient && onEditClient(client),
                          },
                          {
                            id: 'message',
                            label: 'Send Message',
                            icon: <MessageSquare className="h-3.5 w-3.5 text-accent" />,
                            onClick: () => onSendMessage && onSendMessage(client),
                          },
                          {
                            id: 'delete',
                            label: 'Archive Record',
                            danger: true,
                            icon: <Trash2 className="h-3.5 w-3.5" />,
                            onClick: () => onDeleteClient && onDeleteClient(client.id),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 px-1">
          <span className="text-xs text-text-muted tabular-nums">
            Page <strong className="text-text-primary">{pagination.page}</strong> of{' '}
            <strong className="text-text-primary">{pagination.totalPages}</strong> (
            {pagination.total} total clients)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-[background-color,color]"
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            {Array.from({ length: pagination.totalPages }).map((_, idx) => {
              const p = idx + 1
              const isCurrent = p === pagination.page
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => pagination.onPageChange(p)}
                  className={cn(
                    'h-7 w-7 rounded-lg text-xs font-bold tabular-nums transition-[background-color,color]',
                    isCurrent
                      ? 'bg-primary text-white shadow-xs'
                      : 'border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                  )}
                >
                  {p}
                </button>
              )
            })}

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-[background-color,color]"
              aria-label="Next Page"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
