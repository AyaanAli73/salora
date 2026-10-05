import React from 'react'
import {
  X,
  Package,
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  Building2,
  AlertTriangle,
  User,
  XCircle,
} from 'lucide-react'
import { StockTransfer, StockTransferStatus } from '@/types'
import { stockTransferService } from '@/services/stockTransferService'
import { useToastStore } from '@/store/useToastStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface StockTransferDetailsModalProps {
  transfer: StockTransfer | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

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

export const StockTransferDetailsModal: React.FC<StockTransferDetailsModalProps> = ({
  transfer,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { addToast } = useToastStore()

  if (!isOpen || !transfer) return null

  const handleApprove = () => {
    stockTransferService.approveTransfer(transfer.id)
    addToast({
      title: 'Transfer Approved',
      message: `Requisition #${transfer.transferNumber} approved for dispatch.`,
      type: 'success',
    })
    onUpdated()
    onClose()
  }

  const handleDispatch = () => {
    stockTransferService.dispatchTransfer(transfer.id)
    addToast({
      title: 'Transfer Dispatched',
      message: `Stock transfer #${transfer.transferNumber} marked in transit. Source inventory deducted.`,
      type: 'info',
    })
    onUpdated()
    onClose()
  }

  const handleReceive = () => {
    stockTransferService.receiveTransfer(transfer.id)
    addToast({
      title: 'Transfer Received',
      message: `Stock transfer #${transfer.transferNumber} received at ${transfer.destinationBranchName}. Destination inventory updated.`,
      type: 'success',
    })
    onUpdated()
    onClose()
  }

  const handleCancel = () => {
    stockTransferService.cancelTransfer(transfer.id, 'Cancelled by salon administrator')
    addToast({
      title: 'Transfer Cancelled',
      message: `Requisition #${transfer.transferNumber} has been cancelled.`,
      type: 'danger',
    })
    onUpdated()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-detail-title"
    >
      <div className="relative w-full max-w-2xl max-h-[88vh] bg-surface rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 via-surface to-surface flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xs">
              <Package className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="transfer-detail-title" className="text-base font-bold text-text-primary">
                  {transfer.transferNumber}
                </h2>
                <Badge variant={STATUS_VARIANT_MAP[transfer.status]} size="sm">
                  {transfer.status}
                </Badge>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Created on {new Date(transfer.createdAt).toLocaleString()} by {transfer.createdByName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close transfer modal"
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Transfer Route Banner */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-primary font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase">From (Source)</span>
                <p className="text-xs font-bold text-text-primary">{transfer.sourceBranchName}</p>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-text-muted" />

            <div className="flex items-center gap-2.5 text-right">
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase">To (Destination)</span>
                <p className="text-xs font-bold text-text-primary">{transfer.destinationBranchName}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-primary font-bold">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Transfer Progress Timeline */}
          <div className="p-4 rounded-2xl border border-border bg-surface space-y-3">
            <p className="text-xs font-bold text-text-primary">Status Lifecycle</p>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div
                className={cn(
                  'p-2 rounded-xl border',
                  transfer.status === 'DRAFT'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border bg-surface-subtle text-text-muted'
                )}
              >
                <span>1. Draft</span>
              </div>
              <div
                className={cn(
                  'p-2 rounded-xl border',
                  transfer.status === 'APPROVED'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : transfer.approvedAt
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                    : 'border-border bg-surface-subtle text-text-muted'
                )}
              >
                <span>2. Approved</span>
              </div>
              <div
                className={cn(
                  'p-2 rounded-xl border',
                  transfer.status === 'IN_TRANSIT'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 font-bold'
                    : transfer.dispatchedAt
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                    : 'border-border bg-surface-subtle text-text-muted'
                )}
              >
                <span>3. In Transit</span>
              </div>
              <div
                className={cn(
                  'p-2 rounded-xl border',
                  transfer.status === 'RECEIVED'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 font-bold'
                    : 'border-border bg-surface-subtle text-text-muted'
                )}
              >
                <span>4. Received</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-text-primary">Itemized Manifest</p>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle border-b border-border text-[11px] font-bold text-text-muted uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 font-mono">SKU</th>
                    <th className="py-2.5 px-3 text-right">Qty Requisitioned</th>
                    {transfer.status === 'RECEIVED' && (
                      <th className="py-2.5 px-3 text-right">Qty Received</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transfer.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface-subtle/50">
                      <td className="py-2.5 px-3 font-medium text-text-primary">
                        {item.productName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-text-muted">
                        {item.sku || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-text-primary">
                        {item.quantity} units
                      </td>
                      {transfer.status === 'RECEIVED' && (
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                          {item.receivedQuantity ?? item.quantity} units
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {transfer.notes && (
            <div className="p-3 rounded-xl bg-surface-subtle border border-border text-xs">
              <span className="font-bold text-text-primary block mb-0.5">Notes:</span>
              <p className="text-text-muted">{transfer.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-surface-subtle/50">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            {transfer.status !== 'RECEIVED' && transfer.status !== 'CANCELLED' && (
              <Button variant="danger" size="sm" onClick={handleCancel}>
                Cancel Transfer
              </Button>
            )}

            {transfer.status === 'DRAFT' && (
              <Button variant="primary" size="sm" onClick={handleApprove}>
                Approve Transfer
              </Button>
            )}

            {transfer.status === 'APPROVED' && (
              <Button variant="primary" size="sm" onClick={handleDispatch} leftIcon={<Truck className="w-3.5 h-3.5" />}>
                Dispatch Stock (Deduct Source)
              </Button>
            )}

            {transfer.status === 'IN_TRANSIT' && (
              <Button variant="primary" size="sm" onClick={handleReceive} leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Receive & Stock In Destination
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
