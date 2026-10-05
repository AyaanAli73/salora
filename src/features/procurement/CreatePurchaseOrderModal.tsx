import React, { useState, useEffect } from 'react'
import { Plus, Trash2, IndianRupee, Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Product, Supplier, Branch } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { useToastStore } from '@/store/useToastStore'
import { procurementService } from '@/services/procurementService'
import { inventoryService } from '@/services/inventoryService'
import { branchService } from '@/services/branchService'

interface CreatePurchaseOrderModalProps {
  isOpen: boolean
  onClose: () => void
  initialSupplierId?: string
  initialBranchId?: string
  prefillItems?: { productId: string; quantity: number }[]
  onCreated: () => void
}

interface POItemDraft {
  productId: string
  productName: string
  sku: string
  quantity: number
  purchasePrice: number
  taxRate: number
  discountPercent: number
  previousPrice?: number
}

export const CreatePurchaseOrderModal: React.FC<CreatePurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  initialSupplierId,
  initialBranchId,
  prefillItems,
  onCreated,
}) => {
  const { addToast } = useToastStore()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])

  const [supplierId, setSupplierId] = useState('')
  const [branchId, setBranchId] = useState('branch-jodhpur')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<POItemDraft[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize and load data
  useEffect(() => {
    if (!isOpen) return

    const sups = procurementService.getAllSuppliers().filter((s) => s.status === 'ACTIVE')
    const brs = branchService.getActiveBranches()
    const prods = inventoryService.getAllSync()

    setSuppliers(sups)
    setBranches(brs)
    setAllProducts(prods)

    const defaultSup = initialSupplierId || sups[0]?.id || ''
    setSupplierId(defaultSup)
    setBranchId(initialBranchId || 'branch-jodhpur')

    // Default expected delivery: 4 days from now
    const d = new Date()
    d.setDate(d.getDate() + 4)
    setExpectedDeliveryDate(d.toISOString().split('T')[0])

    if (prefillItems && prefillItems.length > 0) {
      const drafts: POItemDraft[] = prefillItems.map((pref) => {
        const prod = prods.find((p) => p.id === pref.productId)
        const prevPrice = procurementService.getLatestProductPrice(pref.productId)
        const unitPrice = prod?.costPrice || prod?.purchasePrice || prevPrice || 450
        return {
          productId: pref.productId,
          productName: prod?.name || 'Product',
          sku: prod?.sku || 'SKU',
          quantity: pref.quantity || 10,
          purchasePrice: unitPrice,
          taxRate: 18,
          discountPercent: 0,
          previousPrice: prevPrice,
        }
      })
      setItems(drafts)
    } else {
      // Default with first available product
      const firstProd = prods[0]
      if (firstProd) {
        const prevPrice = procurementService.getLatestProductPrice(firstProd.id)
        const unitPrice = firstProd.costPrice || firstProd.purchasePrice || 470
        setItems([
          {
            productId: firstProd.id,
            productName: firstProd.name,
            sku: firstProd.sku,
            quantity: 15,
            purchasePrice: unitPrice,
            taxRate: 18,
            discountPercent: 0,
            previousPrice: prevPrice,
          },
        ])
      }
    }
  }, [isOpen, initialSupplierId, initialBranchId, prefillItems])

  // Calculation helpers
  const calculateItemLine = (item: POItemDraft) => {
    const gross = item.quantity * item.purchasePrice
    const disc = (gross * (item.discountPercent || 0)) / 100
    const taxable = gross - disc
    const tax = (taxable * (item.taxRate || 0)) / 100
    const total = taxable + tax
    return { gross, disc, taxable, tax, total }
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0)
  const discountTotal = items.reduce((sum, item) => {
    const gross = item.quantity * item.purchasePrice
    return sum + (gross * (item.discountPercent || 0)) / 100
  }, 0)
  const taxTotal = items.reduce((sum, item) => {
    const gross = item.quantity * item.purchasePrice
    const disc = (gross * (item.discountPercent || 0)) / 100
    const taxable = gross - disc
    return sum + (taxable * (item.taxRate || 0)) / 100
  }, 0)
  const grandTotal = Math.round((subtotal - discountTotal + taxTotal) * 100) / 100

  const handleAddItem = () => {
    const usedIds = new Set(items.map((i) => i.productId))
    const nextProd = allProducts.find((p) => !usedIds.has(p.id)) || allProducts[0]
    if (!nextProd) return

    const prevPrice = procurementService.getLatestProductPrice(nextProd.id)
    const unitPrice = nextProd.costPrice || nextProd.purchasePrice || 500

    setItems([
      ...items,
      {
        productId: nextProd.id,
        productName: nextProd.name,
        sku: nextProd.sku,
        quantity: 10,
        purchasePrice: unitPrice,
        taxRate: 18,
        discountPercent: 0,
        previousPrice: prevPrice,
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      addToast({ title: 'Notice', message: 'A purchase order must contain at least 1 product.', type: 'info' })
      return
    }
    setItems(items.filter((_, idx) => idx !== index))
  }

  const handleItemChange = (index: number, field: keyof POItemDraft, val: any) => {
    const updated = [...items]
    const item = { ...updated[index] }

    if (field === 'productId') {
      const prod = allProducts.find((p) => p.id === val)
      if (prod) {
        item.productId = prod.id
        item.productName = prod.name
        item.sku = prod.sku
        const prevPrice = procurementService.getLatestProductPrice(prod.id)
        item.purchasePrice = prod.costPrice || prod.purchasePrice || prevPrice || 500
        item.previousPrice = prevPrice
      }
    } else {
      ;(item as any)[field] = val
    }

    updated[index] = item
    setItems(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId) {
      addToast({ title: 'Validation Error', message: 'Please select a vendor supplier.', type: 'danger' })
      return
    }
    if (items.length === 0) {
      addToast({ title: 'Validation Error', message: 'Please add at least one line item.', type: 'danger' })
      return
    }

    for (const item of items) {
      if (item.quantity <= 0) {
        addToast({ title: 'Validation Error', message: `Quantity for "${item.productName}" must be greater than zero.`, type: 'danger' })
        return
      }
      if (item.purchasePrice < 0) {
        addToast({ title: 'Validation Error', message: `Price for "${item.productName}" cannot be negative.`, type: 'danger' })
        return
      }
    }

    setIsSubmitting(true)
    try {
      const created = procurementService.createPurchaseOrder({
        supplierId,
        branchId,
        expectedDeliveryDate,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          sku: i.sku,
          quantity: Number(i.quantity),
          purchasePrice: Number(i.purchasePrice),
          taxRate: Number(i.taxRate) || 18,
          discountPercent: Number(i.discountPercent) || 0,
        })),
        notes: notes.trim() || undefined,
        createdByName: 'Ayaan (Owner)',
      })

      addToast({
        title: 'Purchase Order Created',
        message: `Generated #${created.poNumber} for ${created.supplierName} (${formatCurrency(created.total)}).`,
        type: 'success',
      })

      onCreated()
      onClose()
    } catch (err: any) {
      addToast({ title: 'Error', message: err.message || 'Failed to create purchase order.', type: 'danger' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedSupplier = suppliers.find((s) => s.id === supplierId)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Order"
      description="Procure products for a specific branch or central salon distribution."
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Supplier & Branch Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-surface-subtle border border-border rounded-xl">
          <div>
            <label htmlFor="po-supplier" className="block text-xs font-semibold text-text-primary mb-1">
              Vendor Supplier *
            </label>
            <select
              id="po-supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              required
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
            {selectedSupplier?.gstNumber && (
              <span className="block mt-1 text-[11px] text-text-muted">
                GSTIN: {selectedSupplier.gstNumber} • Terms: {selectedSupplier.paymentTermsDays || 30}&nbsp;days
              </span>
            )}
          </div>

          <div>
            <label htmlFor="po-branch" className="block text-xs font-semibold text-text-primary mb-1">
              Destination Salon Branch *
            </label>
            <select
              id="po-branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              required
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city}) {b.isHeadquarters ? '— Central HQ' : ''}
                </option>
              ))}
            </select>
            <span className="block mt-1 text-[11px] text-text-muted">
              Stock will be allocated to this location upon goods receipt.
            </span>
          </div>

          <Input
            label="Expected Delivery Date"
            type="date"
            value={expectedDeliveryDate}
            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            required
          />
        </div>

        {/* Line Items Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Purchase Line Items ({items.length})
            </h4>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-1.5 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add Product Line
            </Button>
          </div>

          <div className="border border-border rounded-xl overflow-hidden bg-surface">
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle text-text-muted font-semibold sticky top-0 border-b border-border z-10">
                  <tr>
                    <th className="py-2.5 px-3">Product Description</th>
                    <th className="py-2.5 px-2 w-20 text-right">Quantity</th>
                    <th className="py-2.5 px-2 w-28 text-right">Purchase Price (₹)</th>
                    <th className="py-2.5 px-2 w-20 text-right">Tax (%)</th>
                    <th className="py-2.5 px-2 w-20 text-right">Disc (%)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Line Total</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, idx) => {
                    const line = calculateItemLine(item)
                    return (
                      <tr key={idx} className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="py-2 px-3">
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                            aria-label={`Select product for row ${idx + 1}`}
                            className="w-full h-8 px-2 rounded-lg border border-border bg-surface text-xs font-medium text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          >
                            {allProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                          {item.previousPrice && (
                            <span className="block mt-0.5 text-[10px] text-text-muted">
                              Prev Price: {formatCurrency(item.previousPrice)}
                              {item.purchasePrice > item.previousPrice && (
                                <span className="text-danger ml-1 font-semibold">
                                  (+{formatCurrency(item.purchasePrice - item.previousPrice)})
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="1"
                            max="5000"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                            aria-label={`Quantity for ${item.productName}`}
                            className="w-full h-8 px-2 rounded-lg border border-border bg-surface text-xs font-semibold text-right text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary tabular-nums"
                            required
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.purchasePrice}
                            onChange={(e) => handleItemChange(idx, 'purchasePrice', Number(e.target.value))}
                            aria-label={`Purchase price for ${item.productName}`}
                            className="w-full h-8 px-2 rounded-lg border border-border bg-surface text-xs font-semibold text-right text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary tabular-nums"
                            required
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={item.taxRate}
                            onChange={(e) => handleItemChange(idx, 'taxRate', Number(e.target.value))}
                            aria-label={`Tax rate for ${item.productName}`}
                            className="w-full h-8 px-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-right text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent}
                            onChange={(e) => handleItemChange(idx, 'discountPercent', Number(e.target.value))}
                            aria-label={`Discount percent for ${item.productName}`}
                            className="w-full h-8 px-2 rounded-lg border border-border bg-surface text-xs font-semibold text-right text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary tabular-nums"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-text-primary tabular-nums">
                          {formatCurrency(line.total)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            aria-label={`Remove row ${idx + 1}`}
                            className="p-1 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Financial Summary & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label htmlFor="po-notes" className="block text-xs font-semibold text-text-primary mb-1">
              Requisition Notes & Dispatch Instructions
            </label>
            <textarea
              id="po-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please supply batch numbers with min 18 months shelf life. Deliver to loading bay 2."
              className="w-full p-2.5 rounded-xl border border-border bg-surface text-xs text-text-primary resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="p-3 bg-surface-subtle border border-border rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-text-secondary">
              <span>Gross Subtotal</span>
              <span className="font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-success">
                <span>Promotional Discount</span>
                <span className="font-semibold tabular-nums">−{formatCurrency(discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-secondary">
              <span>Tax (GST Breakdown)</span>
              <span className="font-semibold tabular-nums">{formatCurrency(taxTotal)}</span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between text-sm font-bold text-text-primary">
              <span>Total Purchase Value</span>
              <span className="text-primary tabular-nums">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="gap-2">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Issue Purchase Order
          </Button>
        </div>
      </form>
    </Modal>
  )
}
