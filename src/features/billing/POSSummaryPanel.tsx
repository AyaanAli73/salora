import React, { useState } from 'react'
import {
  BillItem,
  DiscountType,
  RoundingMode,
  BillPaymentMethod,
} from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  calculateBillSummary,
  AVAILABLE_TAX_RATES,
} from '@/utils/billingUtils'
import { formatCurrency } from '@/utils/formatters'
import {
  CreditCard,
  IndianRupee,
  QrCode,
  Globe,
  Layers,
  Pause,
  CheckCircle2,
  Tag,
  AlertCircle,
  Percent,
} from 'lucide-react'

interface POSSummaryPanelProps {
  items: BillItem[]
  discountType: DiscountType
  discountValue: number
  couponCode: string
  taxRate: number
  roundingMode: RoundingMode
  paidAmount: number
  paymentMethod: BillPaymentMethod
  notes: string
  isSubmitting: boolean
  onOpenDiscountModal: () => void
  onChangeTaxRate: (rate: number) => void
  onChangeRounding: (mode: RoundingMode) => void
  onChangePaidAmount: (amount: number) => void
  onChangePaymentMethod: (method: BillPaymentMethod) => void
  onChangeNotes: (notes: string) => void
  onHoldBill: () => void
  onCheckout: () => void
}

export const POSSummaryPanel: React.FC<POSSummaryPanelProps> = ({
  items,
  discountType,
  discountValue,
  couponCode,
  taxRate,
  roundingMode,
  paidAmount,
  paymentMethod,
  notes,
  isSubmitting,
  onOpenDiscountModal,
  onChangeTaxRate,
  onChangeRounding,
  onChangePaidAmount,
  onChangePaymentMethod,
  onChangeNotes,
  onHoldBill,
  onCheckout,
}) => {
  const summary = calculateBillSummary({
    items,
    billDiscountType: discountType,
    billDiscountValue: discountValue,
    couponCode,
    taxRate,
    roundingMode,
    paidAmount,
  })

  // Quick cash helpers
  const handleQuickAddCash = (increment: number) => {
    onChangePaidAmount((paidAmount || 0) + increment)
  }

  const handleSetExactCash = () => {
    onChangePaidAmount(summary.grandTotal)
  }

  return (
    <Card className="border border-border/80 bg-surface shadow-xs flex flex-col justify-between h-full">
      <CardHeader className="pb-3 border-b border-border/60">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <span>Payment Summary</span>
          <span className="text-xs font-normal text-text-muted">
            {items.length} item(s)
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3.5 text-xs">
          {/* Subtotal */}
          <div className="flex justify-between text-text-secondary">
            <span>Subtotal</span>
            <span className="tabular-nums font-bold text-text-primary text-sm">
              {formatCurrency(summary.subtotal)}
            </span>
          </div>

          {/* Discount Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-text-secondary">Discount</span>
              {summary.totalDiscount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                  {couponCode ? couponCode : discountType === 'percentage' ? `${discountValue}%` : 'Fixed'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="tabular-nums font-bold text-emerald-600">
                {summary.totalDiscount > 0
                  ? `-${formatCurrency(summary.totalDiscount)}`
                  : '₹0.00'}
              </span>
              <button
                type="button"
                onClick={onOpenDiscountModal}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                {summary.totalDiscount > 0 ? 'Edit' : '+ Apply'}
              </button>
            </div>
          </div>

          {/* Taxable Amount */}
          <div className="flex justify-between text-text-muted text-[11px]">
            <span>Taxable Amount</span>
            <span className="tabular-nums font-medium">
              {formatCurrency(summary.taxableAmount)}
            </span>
          </div>

          {/* Tax Configuration Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-text-secondary">Tax (GST)</span>
              <select
                aria-label="Tax Rate (GST)"
                value={taxRate}
                onChange={(e) => onChangeTaxRate(parseFloat(e.target.value) || 0)}
                className="h-6 px-1.5 rounded-md bg-surface-subtle border border-border text-[11px] text-text-secondary font-medium"
              >
                {AVAILABLE_TAX_RATES.map((t) => (
                  <option key={t.rate} value={t.rate}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <span className="tabular-nums font-semibold text-text-primary">
              {formatCurrency(summary.tax)}
            </span>
          </div>

          {/* Rounding Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-text-secondary">Rounding</span>
              <select
                aria-label="Rounding Mode"
                value={roundingMode}
                onChange={(e) => onChangeRounding(e.target.value as RoundingMode)}
                className="h-6 px-1.5 rounded-md bg-surface-subtle border border-border text-[11px] text-text-secondary font-medium"
              >
                <option value="none">Exact</option>
                <option value="nearest_1">Nearest ₹1</option>
                <option value="nearest_5">Nearest ₹5</option>
              </select>
            </div>

            <span className="tabular-nums text-text-muted text-[11px]">
              {summary.rounding !== 0
                ? summary.rounding > 0
                  ? `+₹${summary.rounding}`
                  : `-₹${Math.abs(summary.rounding)}`
                : '₹0.00'}
            </span>
          </div>

          {/* Grand Total Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/[0.08] to-violet-500/[0.03] border-2 border-primary/20 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
              Grand Total
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-black text-text-primary font-sans tracking-tight">
                {formatCurrency(summary.grandTotal)}
              </span>
              <Badge variant="primary" size="sm">
                INR
              </Badge>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5 pt-2">
            <label className="font-semibold text-text-secondary block">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'cash', label: 'Cash', icon: <IndianRupee className="h-3.5 w-3.5" /> },
                { id: 'upi', label: 'UPI / QR', icon: <QrCode className="h-3.5 w-3.5" /> },
                { id: 'card', label: 'Card', icon: <CreditCard className="h-3.5 w-3.5" /> },
                { id: 'netbanking', label: 'NetBank', icon: <Globe className="h-3.5 w-3.5" /> },
                { id: 'split', label: 'Split', icon: <Layers className="h-3.5 w-3.5" /> },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChangePaymentMethod(m.id as BillPaymentMethod)}
                  className={`py-1.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    paymentMethod === m.id
                      ? 'border-primary bg-primary text-white shadow-xs'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Paid Amount Input & Quick Cash Buttons */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-text-secondary">Amount Tendered</label>
              <button
                type="button"
                onClick={handleSetExactCash}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Set Exact (₹{summary.grandTotal})
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-text-muted font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                min="0"
                value={paidAmount || ''}
                onChange={(e) => onChangePaidAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full h-10 pl-7 pr-3 rounded-xl bg-surface border border-border text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-black tabular-nums"
              />
            </div>

            {/* Quick Increment Shortcuts */}
            <div className="flex items-center gap-1 pt-1">
              {[100, 500, 1000, 2000].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleQuickAddCash(inc)}
                  className="flex-1 py-1 rounded-lg bg-surface-subtle border border-border text-[11px] font-semibold hover:border-primary/50 text-text-secondary transition-colors"
                >
                  +{inc}
                </button>
              ))}
            </div>
          </div>

          {/* Outstanding Due Notice (Partial Payment) */}
          {summary.dueAmount > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-400 space-y-1 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Partial Payment (Due Amount):
                </span>
                <span className="text-sm font-black tabular-nums">
                  {formatCurrency(summary.dueAmount)}
                </span>
              </div>
              <p className="text-[10px] text-amber-700 dark:text-amber-300">
                Customer balance will update to reflect ₹{summary.dueAmount} outstanding.
              </p>
            </div>
          )}

          {/* Notes Input */}
          <div>
            <input
              type="text"
              placeholder="Private checkout note (e.g. VIP discount approved)…"
              value={notes}
              onChange={(e) => onChangeNotes(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-surface border border-border text-xs text-text-secondary placeholder:text-text-muted"
            />
          </div>
        </div>

        {/* Action Buttons: Hold Bill & Checkout */}
        <div className="space-y-2 pt-3 border-t border-border">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={onHoldBill}
              disabled={items.length === 0 || isSubmitting}
              leftIcon={<Pause className="h-3.5 w-3.5" />}
              className="text-xs"
            >
              Save & Hold
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={onCheckout}
              disabled={items.length === 0 || isSubmitting}
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              className="shadow-glow-primary/30 text-xs font-bold"
            >
              Settle {formatCurrency(summary.grandTotal)}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
