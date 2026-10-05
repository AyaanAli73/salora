import React, { useState } from 'react'
import { Landmark, X, AlertCircle } from 'lucide-react'
import { Staff } from '@/types'
import { payrollService } from '@/services/payrollService'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/useToastStore'

interface AddAdvanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staffList: Staff[]
  preselectedStaffId?: string
}

export const AddAdvanceModal: React.FC<AddAdvanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  preselectedStaffId,
}) => {
  const { addToast } = useToastStore()
  const [selectedStaffId, setSelectedStaffId] = useState(
    preselectedStaffId || staffList[0]?.id || ''
  )
  const [amount, setAmount] = useState<number>(3000)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaffId) {
      addToast({ title: 'Validation Error', message: 'Please select a specialist.', type: 'danger' })
      return
    }
    if (!amount || amount <= 0) {
      addToast({ title: 'Validation Error', message: 'Advance amount must be greater than zero.', type: 'danger' })
      return
    }
    if (!reason.trim()) {
      addToast({ title: 'Validation Error', message: 'Please specify the reason for the salary advance.', type: 'danger' })
      return
    }

    setIsSubmitting(true)
    try {
      const adv = await payrollService.createAdvance(
        selectedStaffId,
        amount,
        reason,
        'Ayaan (Owner)'
      )
      addToast({
        title: 'Salary Advance Granted',
        message: `Granted ₹${amount.toLocaleString('en-IN')} to ${adv.staffName}. Tracked under #${adv.advanceNumber}.`,
        type: 'success',
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not issue salary advance'
      addToast({ title: 'Error', message: msg, type: 'danger' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="advance-modal-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Landmark className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="advance-modal-title" className="text-base font-bold text-text-primary">
                Issue Salary Advance
              </h3>
              <p className="text-xs text-text-muted">
                Record upfront staff loan with automatic payroll recovery
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close advance modal"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="adv-staff" className="block text-xs font-semibold text-text-primary mb-1">
              Select Specialist *
            </label>
            <select
              id="adv-staff"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            >
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} — {st.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="adv-amount" className="block text-xs font-semibold text-text-primary mb-1">
              Advance Amount (₹) *
            </label>
            <input
              type="number"
              id="adv-amount"
              name="advAmount"
              min="500"
              max="100000"
              step="500"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm font-bold text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="adv-reason" className="block text-xs font-semibold text-text-primary mb-1">
              Reason / Emergency Context *
            </label>
            <textarea
              id="adv-reason"
              name="advReason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Medical treatment, festive family expenses, vehicle repair…"
              required
              className="w-full p-3 rounded-xl border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex-1 justify-center py-2.5 shadow-glow-primary/20"
            >
              {isSubmitting ? 'Recording…' : 'Approve & Issue Advance'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-24 justify-center"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
