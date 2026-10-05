import React, { useState } from 'react'
import { BillItem } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/utils/formatters'
import {
  Scissors,
  Package,
  Plus,
  Trash2,
  Tag,
  ShoppingBag,
  Percent,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface POSCartTableProps {
  items: BillItem[]
  onUpdateQty: (id: string, qty: number) => void
  onUpdateDiscount: (id: string, type?: 'percentage' | 'fixed', val?: number) => void
  onRemoveItem: (id: string) => void
  onOpenAddService: () => void
  onOpenAddProduct: () => void
  onClearCart: () => void
}

export const POSCartTable: React.FC<POSCartTableProps> = ({
  items,
  onUpdateQty,
  onUpdateDiscount,
  onRemoveItem,
  onOpenAddService,
  onOpenAddProduct,
  onClearCart,
}) => {
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null)
  const [discountVal, setDiscountVal] = useState<string>('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')

  const handleStartEditDiscount = (item: BillItem) => {
    setEditingDiscountId(item.id)
    setDiscountType(item.discountType || 'percentage')
    setDiscountVal(item.discountValue ? item.discountValue.toString() : '')
  }

  const handleSaveDiscount = (id: string) => {
    const val = parseFloat(discountVal) || 0
    onUpdateDiscount(id, discountType, val)
    setEditingDiscountId(null)
  }

  return (
    <Card className="border border-border/80 bg-surface shadow-xs flex flex-col h-full">
      {/* Top Header & Buttons */}
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold">
              Bill Items ({items.length})
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAddService}
              leftIcon={<Scissors className="h-3.5 w-3.5 text-primary" />}
              className="text-xs"
            >
              + Add Service
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAddProduct}
              leftIcon={<Package className="h-3.5 w-3.5 text-amber-500" />}
              className="text-xs"
            >
              + Add Product
            </Button>

            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearCart}
                className="text-xs text-text-muted hover:text-rose-500"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Cart Content Table */}
      <CardContent className="p-0 flex-1 flex flex-col justify-between overflow-x-auto">
        {items.length > 0 ? (
          <div className="min-w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-subtle/50 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="py-2.5 px-4">Item & Specialist</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Discount</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const isService = item.type === 'service'
                  const isEditingDiscount = editingDiscountId === item.id

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-subtle/40 transition-colors group"
                    >
                      {/* Name & Meta */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isService
                                ? 'bg-primary/10 text-primary'
                                : 'bg-amber-500/10 text-amber-600'
                            }`}
                          >
                            {isService ? (
                              <Scissors className="h-3.5 w-3.5" />
                            ) : (
                              <Package className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-text-primary text-xs leading-snug">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-0.5">
                              {isService ? (
                                <span>{item.duration || 45} mins</span>
                              ) : (
                                <span>Product</span>
                              )}
                              {item.staffName && (
                                <>
                                  <span>•</span>
                                  <span>{item.staffName}</span>
                                </>
                              )}
                            </div>
                            {item.appliedBenefit && (
                              <div className="mt-1">
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border',
                                    item.appliedBenefit.type === 'PACKAGE'
                                      ? 'bg-teal-500/15 border-teal-500/30 text-teal-700 dark:text-teal-300'
                                      : 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                                  )}
                                >
                                  {item.appliedBenefit.type === 'PACKAGE' ? '📦 ' : '★ '}
                                  {item.appliedBenefit.title}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-3 text-right tabular-nums text-text-secondary font-medium">
                        {formatCurrency(item.unitPrice)}
                      </td>

                      {/* Quantity Controls */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1 border border-border rounded-lg bg-surface p-0.5">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${item.name}`}
                            onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold hover:bg-surface-subtle disabled:opacity-30"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold text-xs tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.name}`}
                            onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                            disabled={
                              item.availableStock !== undefined &&
                              item.quantity >= item.availableStock
                            }
                            className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold hover:bg-surface-subtle disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Line Discount */}
                      <td className="py-3 px-3 text-right">
                        {isEditingDiscount ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={discountVal}
                              onChange={(e) => setDiscountVal(e.target.value)}
                              className="w-14 h-6 px-1 text-right text-xs rounded border border-primary bg-surface font-bold"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setDiscountType(
                                  discountType === 'percentage' ? 'fixed' : 'percentage'
                                )
                              }
                              className="text-[10px] font-bold px-1 py-0.5 rounded bg-surface-subtle border"
                            >
                              {discountType === 'percentage' ? '%' : '₹'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveDiscount(item.id)}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-white"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEditDiscount(item)}
                            className="hover:underline tabular-nums text-right text-xs"
                          >
                            {item.discount > 0 ? (
                              <span className="font-semibold text-emerald-600">
                                -{formatCurrency(item.discount)}
                              </span>
                            ) : (
                              <span className="text-text-muted hover:text-primary">
                                + Add disc.
                              </span>
                            )}
                          </button>
                        )}
                      </td>

                      {/* Line Total */}
                      <td className="py-3 px-4 text-right tabular-nums font-bold text-text-primary text-xs">
                        {formatCurrency(item.total)}
                      </td>

                      {/* Delete */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          aria-label={`Remove ${item.name} from bill`}
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1 rounded-md text-text-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty Cart State */
          <div className="py-20 text-center text-text-muted space-y-4 px-4 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <ShoppingBag className="h-7 w-7" />
            </div>

            <div className="space-y-1 max-w-sm mx-auto">
              <p className="font-bold text-sm text-text-primary">Cart is Empty</p>
              <p className="text-xs text-text-muted">
                Add salon rituals or retail shelf products to build the checkout bill.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenAddService}
                leftIcon={<Scissors className="h-3.5 w-3.5" />}
                className="shadow-glow-primary/20 text-xs"
              >
                + Add Service
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAddProduct}
                leftIcon={<Package className="h-3.5 w-3.5" />}
                className="text-xs"
              >
                + Add Product
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
