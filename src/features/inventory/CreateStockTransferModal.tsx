import React, { useState } from 'react'
import { X, ArrowRight, Package, Plus, Trash2, Building2, AlertCircle } from 'lucide-react'
import { Branch, Product, StockTransferItem } from '@/types'
import { useBranchStore } from '@/store/useBranchStore'
import { inventoryService } from '@/services/inventoryService'
import { stockTransferService } from '@/services/stockTransferService'
import { useToastStore } from '@/store/useToastStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface CreateStockTransferModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const CreateStockTransferModal: React.FC<CreateStockTransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { branches } = useBranchStore()
  const { addToast } = useToastStore()

  const activeBranches = branches.filter((b) => b.status === 'ACTIVE')
  const products = inventoryService.getAllSync()

  const [sourceBranchId, setSourceBranchId] = useState(activeBranches[0]?.id || 'branch-jodhpur')
  const [destBranchId, setDestBranchId] = useState(activeBranches[1]?.id || 'branch-jaipur')
  const [notes, setNotes] = useState('')

  // Transfer Items
  const [items, setItems] = useState<StockTransferItem[]>([
    {
      productId: products[0]?.id || 'prod-1',
      productName: products[0]?.name || 'Shampoo',
      sku: products[0]?.sku || 'SKU-01',
      quantity: 5,
      unitCost: products[0]?.purchasePrice || 500,
    },
  ])

  if (!isOpen) return null

  const handleAddItem = () => {
    const unselected = products.find((p) => !items.some((i) => i.productId === p.id)) || products[0]
    setItems((prev) => [
      ...prev,
      {
        productId: unselected.id,
        productName: unselected.name,
        sku: unselected.sku,
        quantity: 1,
        unitCost: unselected.purchasePrice || 500,
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitCost: product.purchasePrice || 500,
      }
      return updated
    })
  }

  const handleQuantityChange = (index: number, qty: number) => {
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        quantity: Math.max(1, qty),
      }
      return updated
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (sourceBranchId === destBranchId) {
      addToast({
        title: 'Invalid Transfer Route',
        message: 'Source and destination branches cannot be the same salon location.',
        type: 'danger',
      })
      return
    }

    if (items.length === 0) {
      addToast({
        title: 'No Products Selected',
        message: 'Please specify at least one product and quantity to transfer.',
        type: 'warning',
      })
      return
    }

    const sourceBranch = branches.find((b) => b.id === sourceBranchId)
    const destBranch = branches.find((b) => b.id === destBranchId)

    stockTransferService.createTransfer({
      sourceBranchId,
      sourceBranchName: sourceBranch?.name || 'Source Branch',
      destinationBranchId: destBranchId,
      destinationBranchName: destBranch?.name || 'Destination Branch',
      items,
      notes: notes.trim() || undefined,
    })

    addToast({
      title: 'Transfer Requisition Created',
      message: `Requisition created for ${items.length} items from ${sourceBranch?.name} to ${destBranch?.name}.`,
      type: 'success',
    })

    onSuccess()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-transfer-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-surface rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-surface-subtle/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="create-transfer-title" className="text-base font-bold text-text-primary">
                New Inter-Branch Stock Transfer
              </h2>
              <p className="text-xs text-text-muted">
                Create a stock transfer requisition between salon locations
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Source & Destination Route */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border grid grid-cols-1 sm:grid-cols-5 items-center gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="source-b" className="block text-xs font-bold text-text-primary mb-1">
                Source Location (From)
              </label>
              <select
                id="source-b"
                value={sourceBranchId}
                onChange={(e) => setSourceBranchId(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary focus-visible:ring-2 focus-visible:ring-primary"
              >
                {activeBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center text-text-muted">
              <ArrowRight className="w-5 h-5" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="dest-b" className="block text-xs font-bold text-text-primary mb-1">
                Destination Location (To)
              </label>
              <select
                id="dest-b"
                value={destBranchId}
                onChange={(e) => setDestBranchId(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary focus-visible:ring-2 focus-visible:ring-primary"
              >
                {activeBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {sourceBranchId === destBranchId && (
            <div className="p-3 rounded-xl bg-danger/10 text-danger border border-danger/20 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Source and destination must be different salon branches.</span>
            </div>
          )}

          {/* Product Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Products To Transfer
              </h3>
              <Button variant="ghost" size="sm" type="button" onClick={handleAddItem} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Line Item
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => {
                const selectedProd = products.find((p) => p.id === item.productId)
                const sourceAvail = selectedProd?.branchStock?.[sourceBranchId] ?? selectedProd?.currentStock ?? 0

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-border bg-surface flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <label className="text-[10px] text-text-muted block mb-0.5">Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full h-8 px-2 rounded-lg border border-border bg-surface text-xs focus-visible:ring-1 focus-visible:ring-primary"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <label className="text-[10px] text-text-muted block mb-0.5">Source Stock</label>
                      <span className="h-8 px-2.5 rounded-lg bg-surface-subtle border border-border flex items-center text-xs font-mono font-bold text-text-secondary">
                        {sourceAvail} in stock
                      </span>
                    </div>

                    <div className="w-24">
                      <label className="text-[10px] text-text-muted block mb-0.5">Quantity</label>
                      <Input
                        type="number"
                        min={1}
                        max={sourceAvail > 0 ? sourceAvail : 999}
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="pt-4 sm:pt-0 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length === 1}
                        className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-surface-subtle transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Transfer Notes */}
          <div>
            <label htmlFor="trf-notes" className="block text-xs font-semibold text-text-primary mb-1">
              Transfer Notes & Courier Logistics
            </label>
            <Input
              id="trf-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Courier via BlueDart express, Ref tracking #BD-88492"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit Transfer Requisition
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
