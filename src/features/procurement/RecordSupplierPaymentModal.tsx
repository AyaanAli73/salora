import React, { useState } from 'react'
import { IndianRupee, ShieldCheck, CreditCard } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PurchaseOrder, SupplierPaymentMethod } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { useToastStore } from '@/store/useToastStore'
import { procurementService } from '@/services/procurementService'

interface RecordSupplierPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseOrder: PurchaseOrder
  onPaid: () => void
}

export const RecordSupplierPaymentModal: React.FC<RecordSupplierPaymentModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onPaid,
}) => {
  const { addToast } = useToastStore()

  const currentOutstanding =
    purchaseOrder.outstandingAmount !== undefined
      ? purchaseOrder.outstandingAmount
      : purchaseOrder.total - (purchaseOrder.paidAmount || 0)

  const [amount, setAmount] = useState<number>(currentOutstanding)
  const [paymentMethod, setPaymentMethod] = useState<SupplierPaymentMethod>('BANK_TRANSFER')
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [referenceNumber, setReferenceNumber] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payVal = Number(amount)
    if (isNaN(payVal) || payVal <= 0) {
      addToast({
        title: 'Validation Error',
        message: 'Please enter a valid positive payment amount.',
        type: 'danger',
      })
      return
    }

    if (payVal > currentOutstanding + 0.05) {
      addToast({
        title: 'Overpayment Warning',
        message: `Amount cannot exceed the current outstanding payable balance of ${formatCurrency(currentOutstanding)}.`,
        type: 'danger',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { po, payment } = procurementService.recordSupplierPayment({
        poId: purchaseOrder.id,
        amount: payVal,
        paymentMethod,
        paymentDate,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        paidBy: 'Ayaan (Owner)',
      })

      addToast({
        title: 'Payment Disbursed',
        message: `Recorded payment #${payment.paymentNumber} of ${formatCurrency(payVal)} to ${po.supplierName}. Integrated expense logged.`,
        type: 'success',
      })

      onPaid()
      onClose()
    } catch (err: any) {
      addToast({
        title: 'Payment Failed',
        message: err.message || 'Failed to record supplier payment.',
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
      title="Disburse Supplier Payment"
      description={`Record payable settlement for ${purchaseOrder.supplierName} (${purchaseOrder.poNumber}).`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payable Account Summary */}
        <div className="p-3.5 bg-surface-subtle border border-border rounded-xl space-y-2 text-xs">
          <div className="flex justify-between items-center text-text-muted">
            <span>Supplier / Beneficiary:</span>
            <strong className="text-text-primary">{purchaseOrder.supplierName}</strong>
          </div>
          <div className="flex justify-between items-center text-text-muted">
            <span>Total Purchase Amount:</span>
            <span className="font-semibold text-text-primary tabular-nums">
              {formatCurrency(purchaseOrder.total)}
            </span>
          </div>
          <div className="flex justify-between items-center text-text-muted">
            <span>Previously Paid:</span>
            <span className="font-semibold text-success tabular-nums">
              {formatCurrency(purchaseOrder.paidAmount || 0)}
            </span>
          </div>
          <div className="pt-2 border-t border-border flex justify-between items-center text-sm font-bold">
            <span className="text-text-primary">Current Outstanding Balance:</span>
            <span className="text-danger tabular-nums">
              {formatCurrency(currentOutstanding)}
            </span>
          </div>
        </div>

        {/* Payment Amount & Quick Fill */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="pay-amt" className="text-xs font-semibold text-text-primary">
              Payment Amount (₹) *
            </label>
            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setAmount(Math.round(currentOutstanding / 2))}
                className="px-2 py-0.5 rounded bg-surface border border-border text-text-muted hover:text-text-primary transition-colors"
              >
                50% (Partial)
              </button>
              <button
                type="button"
                onClick={() => setAmount(currentOutstanding)}
                className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-semibold hover:bg-primary/20 transition-colors"
              >
                100% (Full Balance)
              </button>
            </div>
          </div>
          <Input
            id="pay-amt"
            type="number"
            step="0.5"
            min="1"
            max={currentOutstanding}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />
        </div>

        {/* Method & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="pay-method" className="block text-xs font-semibold text-text-primary mb-1">
              Payment Method *
            </label>
            <select
              id="pay-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as SupplierPaymentMethod)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CASH">Cash Voucher</option>
            </select>
          </div>

          <Input
            label="Payment Date *"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
        </div>

        {/* Reference Number */}
        <Input
          label="Transaction / UTR Reference Number"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
          placeholder="e.g. HDFC-NEFT-902188 or UPI Ref"
        />

        {/* Notes */}
        <div>
          <label htmlFor="pay-notes" className="block text-xs font-semibold text-text-primary mb-1">
            Payment Notes (Optional)
          </label>
          <input
            id="pay-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Cleared via corporate current account."
            className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        {/* Expense Integration Notice */}
        <div className="flex items-start gap-2.5 p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-text-secondary">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <strong className="text-text-primary font-semibold">Expense Ledger Synchronization:</strong>{' '}
            Confirming this disbursement will automatically post an operational expense under{' '}
            <em>"Inventory & Supplies"</em> for the salon financial reports. No duplicate transaction entry is required.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="gap-2">
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            Disburse {formatCurrency(amount || 0)}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
