import React, { useState } from 'react'
import {
  Package,
  Plus,
  ArrowRight,
  Truck,
  CheckCircle2,
  Clock,
  Building2,
  Search,
  Eye,
  Filter,
} from 'lucide-react'
import { StockTransfer, StockTransferStatus } from '@/types'
import { stockTransferService } from '@/services/stockTransferService'
import { useBranchStore } from '@/store/useBranchStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { CreateStockTransferModal } from './CreateStockTransferModal'
import { StockTransferDetailsModal } from './StockTransferDetailsModal'
import { cn } from '@/utils/cn'

const STATUS_VARIANT_MAP: Record<
  StockTransferStatus,
  'default' | 'primary' | 'warning' | 'success' | 'danger'
> = {
  DRAFT: 'default',
  APPROVED: 'primary',
  IN_TRANSIT: 'warning',
  RECEIVED: 'success',
  CANCELLED: 'danger',
}

export const InterBranchTransfersView: React.FC = () => {
  const { currentBranchId, branches } = useBranchStore()

  const [transfers, setTransfers] = useState<StockTransfer[]>(() =>
    stockTransferService.getAllTransfers(currentBranchId)
  )
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | StockTransferStatus>('ALL')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null)

  const reload = () => {
    setTransfers(stockTransferService.getAllTransfers(currentBranchId))
  }

  const filteredTransfers = transfers.filter((t) => {
    const matchesSearch =
      t.transferNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.sourceBranchName.toLowerCase().includes(search.toLowerCase()) ||
      t.destinationBranchName.toLowerCase().includes(search.toLowerCase()) ||
      t.items.some((i) => i.productName.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus = statusFilter === 'ALL' ? true : t.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Quick stats
  const inTransitCount = transfers.filter((t) => t.status === 'IN_TRANSIT').length
  const receivedCount = transfers.filter((t) => t.status === 'RECEIVED').length
  const pendingCount = transfers.filter((t) => t.status === 'DRAFT' || t.status === 'APPROVED').length

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-surface shadow-xs">
          <div className="flex items-center gap-2 text-text-muted text-xs font-semibold mb-1">
            <Truck className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span>In Transit Shipments</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 tabular-nums">{inTransitCount}</p>
          <span className="text-[11px] text-text-muted">Awaiting branch receipt</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-surface shadow-xs">
          <div className="flex items-center gap-2 text-text-muted text-xs font-semibold mb-1">
            <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>Pending Authorization</span>
          </div>
          <p className="text-2xl font-bold text-text-primary tabular-nums">{pendingCount}</p>
          <span className="text-[11px] text-text-muted">Draft or approved requisitions</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-surface shadow-xs">
          <div className="flex items-center gap-2 text-text-muted text-xs font-semibold mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            <span>Completed Transfers</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{receivedCount}</p>
          <span className="text-[11px] text-text-muted">Stock received and updated</span>
        </div>
      </div>

      {/* Action and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-surface shadow-xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transfers by ID, branch, product…"
              className="pl-9 h-10 text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-10 px-3 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="APPROVED">Approved</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          New Stock Transfer
        </Button>
      </div>

      {/* Transfers Table */}
      <div className="rounded-3xl border border-border bg-surface shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle border-b border-border text-[11px] font-bold text-text-muted uppercase">
              <tr>
                <th className="py-3 px-4">Transfer #</th>
                <th className="py-3 px-4">Route (From → To)</th>
                <th className="py-3 px-4">Products & Units</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    No stock transfers found for the active filter.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((t) => {
                  const totalUnits = t.items.reduce((s, i) => s + i.quantity, 0)

                  return (
                    <tr key={t.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">
                        {t.transferNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-medium text-text-primary">
                          <span>{t.sourceBranchName}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                          <span>{t.destinationBranchName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-text-primary">
                          {t.items.length} items
                        </span>{' '}
                        <span className="text-text-muted">({totalUnits} units total)</span>
                        <p className="text-[11px] text-text-muted truncate max-w-xs">
                          {t.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-text-muted">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={STATUS_VARIANT_MAP[t.status]} size="sm">
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTransfer(t)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          View / Manage
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <CreateStockTransferModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={reload}
      />

      {/* Details & Actions Modal */}
      <StockTransferDetailsModal
        transfer={selectedTransfer}
        isOpen={Boolean(selectedTransfer)}
        onClose={() => setSelectedTransfer(null)}
        onUpdated={reload}
      />
    </div>
  )
}
