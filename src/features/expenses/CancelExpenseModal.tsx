import React, { useState } from 'react'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Expense } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface CancelExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  expense: Expense | null
  onConfirm: (expenseId: string, reason: string) => void
}

export const CancelExpenseModal: React.FC<CancelExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  onConfirm,
}) => {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!expense) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('A cancellation reason is required for regulatory and financial audit compliance.')
      return
    }

    setIsSubmitting(true)
    try {
      onConfirm(expense.id, reason.trim())
      setReason('')
      setError('')
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Financial Expense Voucher"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800 dark:text-rose-200 space-y-1">
            <p className="font-bold">Financial Integrity Policy:</p>
            <p className="leading-relaxed">
              SALORA adheres to strict accounting audit standards. Expense records are{' '}
              <span className="font-semibold underline">never deleted silently</span>. This voucher will be marked
              as <span className="font-bold">CANCELLED</span>, preserved in audit logs, and any linked cash register drawer
              outflow will be reversed.
            </p>
          </div>
        </div>

        {/* Voucher summary */}
        <div className="p-3 rounded-xl border border-border bg-surface-subtle/50 text-xs space-y-1 font-mono">
          <div className="flex justify-between">
            <span className="text-text-muted">Voucher ID:</span>
            <span className="font-bold text-text-primary">{expense.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Expense Name:</span>
            <span className="font-bold text-text-primary">{expense.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Amount:</span>
            <span className="font-bold text-rose-600">{formatCurrency(expense.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Payment Method:</span>
            <span className="font-bold text-text-primary">{expense.paymentMethod}</span>
          </div>
        </div>

        <div>
          <label htmlFor="cancel-reason" className="block text-xs font-bold text-text-primary mb-1">
            Reason for Cancellation <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="cancel-reason"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              if (error) setError('')
            }}
            placeholder="e.g., Duplicate supplier invoice logged in error; bill settled under digital Meta ads..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 resize-none"
          />
          {error && <p className="text-[11px] text-rose-500 mt-1 font-medium">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Keep Expense
          </Button>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            isLoading={isSubmitting}
            className="bg-rose-600 text-white hover:bg-rose-700 border-transparent"
          >
            Confirm Cancellation
          </Button>
        </div>
      </form>
    </Modal>
  )
}
