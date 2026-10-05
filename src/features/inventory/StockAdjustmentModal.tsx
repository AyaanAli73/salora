import React, { useState, useEffect } from 'react'
import { Product, StockMovementType, StockMovement } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { inventoryService } from '@/services/inventoryService'
import { useToastStore } from '@/store/useToastStore'
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  FileText,
  AlertCircle,
  Package,
} from 'lucide-react'

interface StockAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Product | null
  products: Product[]
  onAdjusted: (product: Product, movement: StockMovement) => void
}

const MOVEMENT_TYPES: { type: StockMovementType; label: string; description: string; isAddition: boolean }[] = [
  { type: 'stock_in', label: 'Stock In', description: 'Receive new stock or replenishment', isAddition: true },
  { type: 'stock_out', label: 'Stock Out', description: 'Internal salon use or transfer', isAddition: false },
  { type: 'adjustment', label: 'Cycle Count Adjustment', description: 'Audit discrepancy correction', isAddition: true },
  { type: 'damaged', label: 'Damaged / Broken', description: 'Broken container, spillage or leak', isAddition: false },
  { type: 'expired', label: 'Expired Batch Write-off', description: 'Past manufacturer shelf date', isAddition: false },
  { type: 'returned', label: 'Customer / Supplier Return', description: 'Defective batch return to vendor', isAddition: false },
]

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  products,
  onAdjusted,
}) => {
  const { addToast } = useToastStore()

  const [selectedProductId, setSelectedProductId] = useState<string>(product?.id || (products[0]?.id || ''))
  const [movementType, setMovementType] = useState<StockMovementType>('stock_in')
  const [quantity, setQuantity] = useState<number>(1)
  const [reason, setReason] = useState<string>('')
  const [referenceId, setReferenceId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    if (product) {
      setSelectedProductId(product.id)
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id)
    }
    setQuantity(1)
    setReason('')
    setReferenceId('')
    setError(null)
  }, [product, products, isOpen])

  const activeProduct = products.find((p) => p.id === selectedProductId)
  const selectedConfig = MOVEMENT_TYPES.find((m) => m.type === movementType)

  const previewNewStock = activeProduct
    ? selectedConfig?.isAddition
      ? activeProduct.currentStock + quantity
      : Math.max(0, activeProduct.currentStock - quantity)
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!activeProduct) {
      setError('Please select a valid product.')
      return
    }

    if (quantity <= 0) {
      setError('Quantity must be greater than zero.')
      return
    }

    if (!reason.trim()) {
      setError('A specific justification reason is required for the audit ledger.')
      return
    }

    setIsSubmitting(true)
    try {
      const { product: updatedProduct, movement } = await inventoryService.adjustStock({
        productId: activeProduct.id,
        type: movementType,
        quantity,
        reason: reason.trim(),
        referenceId: referenceId.trim() || undefined,
        createdBy: 'Ayaan (Manager)',
      })

      addToast({
        title: 'Stock Movement Logged',
        message: `${updatedProduct.name}: ${movement.quantity > 0 ? '+' : ''}${movement.quantity} ${updatedProduct.unit}s (New stock: ${updatedProduct.currentStock}).`,
        type: 'success',
      })

      onAdjusted(updatedProduct, movement)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Could not record stock adjustment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Movement & Adjustment"
      description="Record physical counts, warehouse receipt, backbar usage, or damaged write-offs."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Product Selector */}
        <div className="space-y-1">
          <label className="font-semibold text-text-primary">Select Product</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
            disabled={Boolean(product)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Stock: {p.currentStock} {p.unit}s)
              </option>
            ))}
          </select>
        </div>

        {/* Movement Type Radio / Pill Selection */}
        <div className="space-y-1.5">
          <label className="font-semibold text-text-primary">Movement Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MOVEMENT_TYPES.map((m) => {
              const isSelected = movementType === m.type
              return (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => setMovementType(m.type)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30 text-text-primary font-bold'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  <p className="text-xs font-bold">{m.label}</p>
                  <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">{m.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Quantity & Stock Impact Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-surface-subtle border border-border">
          <div className="space-y-1">
            <label className="font-semibold text-text-primary">Quantity Units</label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="font-black text-sm tabular-nums"
              required
            />
          </div>

          <div className="flex flex-col justify-center space-y-1 border-t sm:border-t-0 sm:border-l border-border sm:pl-3 pt-2 sm:pt-0">
            <span className="text-[11px] text-text-muted">Stock Level Impact:</span>
            <div className="flex items-center gap-2">
              <span className="text-text-muted tabular-nums font-semibold">
                {activeProduct?.currentStock || 0}
              </span>
              <span className="text-primary font-bold">→</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {previewNewStock} {activeProduct?.unit}s
              </span>
            </div>
          </div>
        </div>

        {/* Reason (Mandatory) */}
        <div className="space-y-1">
          <label className="font-semibold text-text-primary">
            Reason for Adjustment <span className="text-rose-500">*</span>
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Broken nozzle during salon cleaning / Stock replenishment"
            required
          />
        </div>

        {/* Reference ID (Optional) */}
        <div className="space-y-1">
          <label className="font-semibold text-text-primary">Reference # (Optional)</label>
          <Input
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            placeholder="e.g. PO-2026-001 or INV-000104"
            className="font-mono"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
            className="shadow-glow-primary/20"
          >
            {isSubmitting ? 'Recording…' : 'Record Movement'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
