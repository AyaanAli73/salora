import React, { useState } from 'react'
import { Bill, BillPaymentMethod, Refund } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { refundService } from '@/services/refundService'
import { useToastStore } from '@/store/useToastStore'
import {
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  IndianRupee,
  Receipt,
} from 'lucide-react'

interface RefundModalProps {
  isOpen: boolean
  onClose: () => void
  bill: Bill | null
  onRefundCompleted: (refund: Refund, updatedBill: Bill) => void
}

export const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  onClose,
  bill,
  onRefundCompleted,
}) => {
  const { addToast } = useToastStore()

  if (!bill) return null

  const { alreadyRefunded, refundableAmount } = refundService.getRefundableBalance(bill)

  const [refundType, setRefundType] = useState<'full' | 'partial'>('full')
  const [refundAmount, setRefundAmount] = useState<number>(refundableAmount)
  const [reason, setReason] = useState<string>('')
  const [method, setMethod] = useState<BillPaymentMethod>(
    bill.paymentMethod === 'split' ? 'upi' : bill.paymentMethod || 'cash'
  )
  const [authorizedBy, setAuthorizedBy] = useState<string>('Ayaan (Owner)')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFullToggle = (isFull: boolean) => {
    setRefundType(isFull ? 'full' : 'partial')
    setRefundAmount(isFull ? refundableAmount : Math.min(refundableAmount, Math.floor(refundableAmount / 2)))
    setError(null)
  }

  const handleConfirm = async () => {
    setError(null)
    if (!reason.trim()) {
      setError('A formal justification reason is required for accounting audit.')
      return
    }

    if (refundAmount <= 0) {
      setError('Refund amount must be greater than ₹0.')
      return
    }

    if (refundAmount > refundableAmount) {
      setError(`Refund cannot exceed maximum refundable balance of ₹${refundableAmount}.`)
      return
    }

    setIsProcessing(true)
    try {
      const { refund, updatedBill } = await refundService.processRefund({
        bill,
        amount: refundAmount,
        reason: reason.trim(),
        method,
        processedBy: authorizedBy,
      })

      addToast({
        title: 'Refund Processed Successfully',
        message: `₹${refundAmount} refunded on #${bill.invoiceNumber} via ${method.toUpperCase()}.`,
        type: 'success',
      })

      onRefundCompleted(refund, updatedBill)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Could not process refund.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Refund Processing — ${bill.invoiceNumber}`}
      description="Issue full or partial refunds with immutable ledger and drawer accounting."
      size="md"
    >
      <div className="space-y-4 text-xs">
        {/* Invoice Summary Card */}
        <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Customer Name</span>
            <span className="font-bold text-text-primary">{bill.clientName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-muted">Original Invoice Total</span>
            <span className="font-bold text-text-primary tabular-nums">
              {formatCurrency(bill.grandTotal)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-muted">Total Paid Tender</span>
            <span className="font-bold text-emerald-600 tabular-nums">
              {formatCurrency(bill.paidAmount)}
            </span>
          </div>

          {alreadyRefunded > 0 && (
            <div className="flex items-center justify-between text-rose-500 font-bold">
              <span>Previously Refunded</span>
              <span className="tabular-nums">-₹{alreadyRefunded}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-border/80 font-black">
            <span className="text-text-primary">Available for Refund</span>
            <span className="text-base text-primary tabular-nums">
              {formatCurrency(refundableAmount)}
            </span>
          </div>
        </div>

        {/* Refund Mode Selection */}
        <div className="space-y-1.5">
          <label className="font-bold text-text-primary block">Refund Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFullToggle(true)}
              className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                refundType === 'full'
                  ? 'border-primary bg-primary/10 text-primary shadow-xs'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <div>Full Refund</div>
              <div className="text-[10px] text-text-muted font-normal mt-0.5">
                Refund entire ₹{refundableAmount}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleFullToggle(false)}
              className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                refundType === 'partial'
                  ? 'border-primary bg-primary/10 text-primary shadow-xs'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <div>Partial Refund</div>
              <div className="text-[10px] text-text-muted font-normal mt-0.5">
                Specify item or custom amount
              </div>
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-1">
          <label className="font-bold text-text-primary block">
            Amount to Refund (₹)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 font-bold text-text-muted">₹</span>
            <input
              type="number"
              min="1"
              max={refundableAmount}
              value={refundAmount || ''}
              disabled={refundType === 'full'}
              onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
              className="w-full h-10 pl-7 pr-3 rounded-xl bg-surface border border-border text-base font-black tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-75 disabled:bg-surface-subtle"
            />
          </div>
        </div>

        {/* Refund Method & Payout Source */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="font-bold text-text-primary block">Payout Tender</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full h-9 px-2.5 rounded-xl bg-surface border border-border text-xs font-semibold text-text-primary focus:outline-none"
            >
              <option value="cash">Cash (From Drawer)</option>
              <option value="upi">UPI Reversal</option>
              <option value="card">Card Reversal</option>
              <option value="bank_transfer">Direct Bank Transfer</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-text-primary block">Authorized By</label>
            <input
              type="text"
              value={authorizedBy}
              onChange={(e) => setAuthorizedBy(e.target.value)}
              className="w-full h-9 px-2.5 rounded-xl bg-surface border border-border text-xs text-text-primary"
            />
          </div>
        </div>

        {/* Reason Input (Mandatory) */}
        <div className="space-y-1">
          <label className="font-bold text-text-primary block">
            Refund Justification Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="E.g. Unsatisfactory styling finish, product reaction, billing clerical correction…"
            className="w-full p-2.5 rounded-xl bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Security Warning */}
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300 space-y-0.5">
          <p className="font-bold flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Audit Logging Active
          </p>
          <p>
            Original invoice will not be deleted. An immutable refund event will be stamped to the audit trail and cash drawer.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            isLoading={isProcessing}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            className="font-bold"
          >
            Confirm Refund (₹{refundAmount})
          </Button>
        </div>
      </div>
    </Modal>
  )
}
