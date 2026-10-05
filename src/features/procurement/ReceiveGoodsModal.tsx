import React, { useState } from 'react'
import { PackageCheck, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PurchaseOrder } from '@/types'
import { useToastStore } from '@/store/useToastStore'
import { procurementService } from '@/services/procurementService'

interface ReceiveGoodsModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseOrder: PurchaseOrder
  onReceived: () => void
}

interface ItemReceiptState {
  productId: string
  productName: string
  sku: string
  ordered: number
  alreadyReceived: number
  remaining: number
  qtyToReceive: number
  batchNumber: string
  expiryDate: string
  notes: string
}

export const ReceiveGoodsModal: React.FC<ReceiveGoodsModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onReceived,
}) => {
  const { addToast } = useToastStore()

  const [receiverName, setReceiverName] = useState('Priya Rathore (Manager)')
  const [generalNotes, setGeneralNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize line items with remaining balances
  const [receiptItems, setReceiptItems] = useState<ItemReceiptState[]>(() => {
    return purchaseOrder.items.map((i) => {
      const ordered = i.orderedQuantity ?? i.quantity
      const alreadyReceived = i.receivedQuantity || 0
      const remaining = Math.max(0, ordered - alreadyReceived)
      return {
        productId: i.productId,
        productName: i.productName,
        sku: i.sku,
        ordered,
        alreadyReceived,
        remaining,
        qtyToReceive: remaining, // default to receive full remaining
        batchNumber: i.batchNumber || `LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        expiryDate: i.expiryDate || '2028-06-30',
        notes: '',
      }
    })
  })

  const handleQtyChange = (productId: string, val: number) => {
    setReceiptItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item
        const clamped = Math.max(0, Math.min(item.remaining, val))
        return { ...item, qtyToReceive: clamped }
      })
    )
  }

  const handleFieldChange = (productId: string, field: 'batchNumber' | 'expiryDate' | 'notes', val: string) => {
    setReceiptItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, [field]: val } : item))
    )
  }

  const totalQtyToReceive = receiptItems.reduce((sum, i) => sum + i.qtyToReceive, 0)
  const isPartial = receiptItems.some((i) => i.qtyToReceive < i.remaining && i.qtyToReceive > 0)
  const isNone = totalQtyToReceive === 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (totalQtyToReceive <= 0) {
      addToast({
        title: 'Validation Error',
        message: 'Please specify at least 1 unit to receive.',
        type: 'danger',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const targetBranch = purchaseOrder.branchId || 'branch-jodhpur'
      const { po, grn } = procurementService.receiveGoods({
        poId: purchaseOrder.id,
        branchId: targetBranch,
        receivedItems: receiptItems
          .filter((i) => i.qtyToReceive > 0)
          .map((i) => ({
            productId: i.productId,
            quantityReceived: i.qtyToReceive,
            batchNumber: i.batchNumber || undefined,
            expiryDate: i.expiryDate || undefined,
            notes: i.notes || undefined,
          })),
        receivedBy: receiverName.trim() || 'Store Manager',
        notes: generalNotes.trim() || undefined,
      })

      addToast({
        title: 'Consignment Received',
        message: `Generated Goods Receipt #${grn.receiptNumber}. Inventory increased for ${targetBranch}. Status: ${po.status}.`,
        type: 'success',
      })

      onReceived()
      onClose()
    } catch (err: any) {
      addToast({
        title: 'Receipt Failed',
        message: err.message || 'Failed to process goods receipt.',
        type: 'danger',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Goods Receipt (GRN) — ${purchaseOrder.poNumber}`}
      description={`Record incoming inventory from ${purchaseOrder.supplierName} for ${purchaseOrder.branchName}.`}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* PO Snapshot */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-subtle border border-border rounded-xl text-xs">
          <div>
            <span className="text-text-muted">Vendor:</span>{' '}
            <strong className="text-text-primary">{purchaseOrder.supplierName}</strong>
          </div>
          <div>
            <span className="text-text-muted">Target Location:</span>{' '}
            <strong className="text-text-primary">{purchaseOrder.branchName}</strong>
          </div>
          <div>
            <span className="text-text-muted">Total Order Items:</span>{' '}
            <strong className="text-text-primary">{purchaseOrder.items.length} Lines</strong>
          </div>
        </div>

        {/* Goods Receipt Items Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Verify Consignment Quantities
            </h4>
            <span className="text-xs text-text-muted">
              Only quantities received will be added to stock.
            </span>
          </div>

          <div className="border border-border rounded-xl overflow-hidden bg-surface">
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle text-text-muted font-semibold sticky top-0 border-b border-border z-10">
                  <tr>
                    <th className="py-2.5 px-3">Product Description</th>
                    <th className="py-2.5 px-2 text-center w-20">Ordered</th>
                    <th className="py-2.5 px-2 text-center w-20">Prior Recv</th>
                    <th className="py-2.5 px-2 text-center w-20">Remaining</th>
                    <th className="py-2.5 px-2 text-right w-28 bg-primary/5 text-primary">Receive Now</th>
                    <th className="py-2.5 px-3 w-36">Batch & Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {receiptItems.map((item) => (
                    <tr key={item.productId} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-text-primary">{item.productName}</div>
                        <div className="text-[11px] text-text-muted">SKU: {item.sku}</div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium tabular-nums">
                        {item.ordered}
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium tabular-nums text-text-muted">
                        {item.alreadyReceived}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold tabular-nums">
                        {item.remaining > 0 ? (
                          <span className="text-warning">{item.remaining}</span>
                        ) : (
                          <span className="text-success">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 bg-primary/5">
                        <input
                          type="number"
                          min="0"
                          max={item.remaining}
                          value={item.qtyToReceive}
                          onChange={(e) => handleQtyChange(item.productId, Number(e.target.value))}
                          disabled={item.remaining === 0}
                          aria-label={`Receive quantity for ${item.productName}`}
                          className="w-full h-8 px-2 rounded-lg border border-primary/30 bg-surface font-bold text-primary text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary tabular-nums"
                        />
                      </td>
                      <td className="py-2.5 px-3 space-y-1">
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={(e) => handleFieldChange(item.productId, 'batchNumber', e.target.value)}
                          placeholder="Batch / Lot #"
                          aria-label={`Batch number for ${item.productName}`}
                          className="w-full h-7 px-2 rounded border border-border bg-surface text-[11px] text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        />
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => handleFieldChange(item.productId, 'expiryDate', e.target.value)}
                          aria-label={`Expiry date for ${item.productName}`}
                          className="w-full h-7 px-2 rounded border border-border bg-surface text-[11px] text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Partial Receipt Example Alert */}
        {isPartial && (
          <div className="flex items-start gap-2.5 p-3 bg-warning/10 border border-warning/30 rounded-xl text-xs text-warning">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="block font-semibold">Partial Delivery Detected:</strong>
              Inventory will increase only for the {totalQtyToReceive} units confirmed above. The
              remaining balance will stay open under <strong>PARTIALLY_RECEIVED</strong> status for future delivery.
            </div>
          </div>
        )}

        {/* Receiving Personnel & General Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Input
            label="Received By (Storekeeper / Manager) *"
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
            required
          />
          <div>
            <label htmlFor="grn-notes" className="block text-xs font-semibold text-text-primary mb-1">
              Consignment Condition Notes
            </label>
            <input
              id="grn-notes"
              type="text"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="e.g. Outer carton intact, security seal verified, cool pack cold."
              className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="text-xs text-text-muted">
            Total items to add to inventory: <strong className="text-text-primary">{totalQtyToReceive} Units</strong>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isNone}
              className="gap-2"
            >
              <PackageCheck className="h-4 w-4" aria-hidden="true" />
              Confirm Goods Receipt
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
