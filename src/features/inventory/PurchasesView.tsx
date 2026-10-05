import React, { useState } from 'react'
import {
  ShoppingCart,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Building,
  AlertCircle,
  Package,
  IndianRupee,
  FileText,
} from 'lucide-react'
import { PurchaseOrder, PurchaseOrderItem, Product, Supplier } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useToastStore } from '@/store/useToastStore'
import { inventoryService } from '@/services/inventoryService'

interface PurchasesViewProps {
  purchases: PurchaseOrder[]
  suppliers: Supplier[]
  products: Product[]
  onPurchasesUpdated: () => void
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  suppliers,
  products,
  onPurchasesUpdated,
}) => {
  const { addToast } = useToastStore()

  // New Purchase Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || '')
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [autoReceive, setAutoReceive] = useState<boolean>(true)
  const [notes, setNotes] = useState<string>('')

  // Order Items
  const [items, setItems] = useState<PurchaseOrderItem[]>([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      sku: products[0]?.sku || '',
      quantity: 10,
      purchasePrice: products[0]?.purchasePrice || 500,
      taxRate: 18,
      total: (products[0]?.purchasePrice || 500) * 10 * 1.18,
    },
  ])

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0)
  const tax = items.reduce(
    (sum, item) => sum + (item.quantity * item.purchasePrice * item.taxRate) / 100,
    0
  )
  const total = Math.round((subtotal + tax) * 100) / 100

  const handleAddItem = () => {
    const firstProd = products[0]
    if (!firstProd) return
    setItems([
      ...items,
      {
        productId: firstProd.id,
        productName: firstProd.name,
        sku: firstProd.sku,
        quantity: 5,
        purchasePrice: firstProd.purchasePrice,
        taxRate: 18,
        total: firstProd.purchasePrice * 5 * 1.18,
      },
    ])
  }

  const handleUpdateItem = (
    index: number,
    field: 'productId' | 'quantity' | 'purchasePrice' | 'taxRate',
    val: any
  ) => {
    const updated = [...items]
    const current = { ...updated[index] }

    if (field === 'productId') {
      const prod = products.find((p) => p.id === val)
      if (prod) {
        current.productId = prod.id
        current.productName = prod.name
        current.sku = prod.sku
        current.purchasePrice = prod.purchasePrice
      }
    } else if (field === 'quantity') {
      current.quantity = Math.max(1, parseInt(val) || 1)
    } else if (field === 'purchasePrice') {
      current.purchasePrice = Math.max(0, parseFloat(val) || 0)
    } else if (field === 'taxRate') {
      current.taxRate = Math.max(0, parseFloat(val) || 0)
    }

    current.total = Math.round(current.quantity * current.purchasePrice * (1 + current.taxRate / 100) * 100) / 100
    updated[index] = current
    setItems(updated)
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!supplierId) {
      setError('Please select a supplier.')
      return
    }

    if (!invoiceNumber.trim()) {
      setError('Supplier Invoice Number is required for tax compliance.')
      return
    }

    if (items.length === 0) {
      setError('Add at least one product item to the purchase order.')
      return
    }

    setIsSubmitting(true)
    try {
      const selectedSup = suppliers.find((s) => s.id === supplierId)
      const newPO = await inventoryService.createPurchase(
        {
          supplierId,
          supplierName: selectedSup?.name || 'Direct Wholesale',
          invoiceNumber: invoiceNumber.trim(),
          date,
          items,
          subtotal,
          tax,
          total,
          status: autoReceive ? 'RECEIVED' : 'PENDING',
          notes: notes.trim() || undefined,
          receivedBy: 'Ayaan (Manager)',
        },
        autoReceive
      )

      addToast({
        title: autoReceive ? 'Purchase Received & Stock Updated' : 'Purchase Order Created',
        message: `${newPO.purchaseNumber} recorded. Total: ${formatCurrency(newPO.total)}.`,
        type: 'success',
      })

      setIsModalOpen(false)
      onPurchasesUpdated()
    } catch (err: any) {
      setError(err.message || 'Could not record purchase order.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReceiveOrder = async (orderId: string) => {
    try {
      const updated = await inventoryService.receivePurchase(orderId, 'Ayaan (Manager)')
      addToast({
        title: 'Goods Received',
        message: `Inventory automatically increased for #${updated.purchaseNumber}.`,
        type: 'success',
      })
      onPurchasesUpdated()
    } catch (err: any) {
      addToast({
        title: 'Receiving Error',
        message: err.message || 'Could not receive order.',
        type: 'danger',
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header and Actions */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Stock Purchases & Vendor Invoices</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Receive replenishment shipments from authorized cosmetic manufacturers and distributors.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setInvoiceNumber(`INV-${Math.floor(10000 + Math.random() * 90000)}`)
              setIsModalOpen(true)
            }}
            leftIcon={<Plus className="h-4 w-4" />}
            className="shadow-glow-primary/20 text-xs shrink-0"
          >
            + New Purchase Order
          </Button>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-subtle/50 text-[11px] font-bold text-text-muted uppercase">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-3">Vendor Invoice #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-center">Items</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right">GST / Tax</th>
                  <th className="py-3 px-3 text-right">Grand Total</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {purchases.length > 0 ? (
                  purchases.map((po) => {
                    const isReceived = po.status === 'RECEIVED'
                    return (
                      <tr key={po.id} className="hover:bg-surface-hover/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-primary">
                          {po.purchaseNumber}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-text-primary truncate">{po.supplierName}</p>
                          {po.notes && <p className="text-[10px] text-text-muted truncate">{po.notes}</p>}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-text-secondary">
                          {po.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-text-muted">
                          {po.date}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-text-secondary">
                          {po.items.length} SKUs
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-text-muted tabular-nums">
                          {formatCurrency(po.subtotal)}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-text-muted tabular-nums">
                          {formatCurrency(po.tax)}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-text-primary tabular-nums">
                          {formatCurrency(po.total)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isReceived
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200'
                            }`}
                          >
                            {isReceived ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                Received (Stocked)
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3" />
                                Pending
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!isReceived && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReceiveOrder(po.id)}
                              className="text-xs text-emerald-600 hover:text-emerald-700"
                            >
                              Receive Goods
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-xs text-text-muted">
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: New Purchase Order */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create Stock Purchase Order"
          description="Log wholesale invoice receipt from supplier with automatic inventory replenishment."
          size="lg"
        >
          <form onSubmit={handleSavePurchase} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Supplier & Invoice # */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-text-primary">Supplier <span className="text-rose-500">*</span></label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-primary">Vendor Invoice Number <span className="text-rose-500">*</span></label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. LOR-INV-9901"
                  className="font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-primary">Invoice Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="font-mono"
                  required
                />
              </div>
            </div>

            {/* Product Lines Section */}
            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary">Products & Shipments</span>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={handleAddItem}
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  className="text-xs h-7"
                >
                  + Add Line Item
                </Button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-subtle border border-border grid grid-cols-12 gap-2 items-center text-xs"
                  >
                    <div className="col-span-5 space-y-1">
                      <label className="text-[10px] text-text-muted font-semibold">Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdateItem(idx, 'productId', e.target.value)}
                        className="w-full h-8 px-2 rounded-lg bg-surface border border-border text-xs text-text-primary focus:outline-none"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] text-text-muted font-semibold">Qty</label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                        className="h-8 text-xs font-bold tabular-nums"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] text-text-muted font-semibold">Price (₹)</label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={item.purchasePrice}
                        onChange={(e) => handleUpdateItem(idx, 'purchasePrice', e.target.value)}
                        className="h-8 text-xs font-bold tabular-nums"
                      />
                    </div>

                    <div className="col-span-2 space-y-1 text-right">
                      <label className="text-[10px] text-text-muted font-semibold">Total (₹)</label>
                      <p className="font-black text-xs tabular-nums text-text-primary h-8 flex items-center justify-end">
                        {formatCurrency(item.total)}
                      </p>
                    </div>

                    <div className="col-span-1 flex justify-end pt-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="p-1 rounded-lg text-text-muted hover:text-rose-500 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary & Auto-receive Toggle */}
            <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoReceive}
                  onChange={(e) => setAutoReceive(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-text-primary block">
                    Automatically increase product inventory immediately
                  </span>
                  <span className="text-[10px] text-text-muted">
                    Marks goods as received and adds items to active shelf stock
                  </span>
                </div>
              </label>

              <div className="text-right space-y-0.5 shrink-0 border-t sm:border-t-0 sm:border-l border-border sm:pl-4 pt-2 sm:pt-0">
                <p className="text-[11px] text-text-muted">
                  Subtotal: <strong className="text-text-primary">{formatCurrency(subtotal)}</strong>
                </p>
                <p className="text-[11px] text-text-muted">
                  GST (18%): <strong className="text-text-primary">{formatCurrency(tax)}</strong>
                </p>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  Total: {formatCurrency(total)}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
                className="shadow-glow-primary/20"
              >
                {isSubmitting ? 'Recording…' : autoReceive ? 'Receive & Stock Products' : 'Save Purchase Order'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
