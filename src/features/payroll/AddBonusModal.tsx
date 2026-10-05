import React, { useState } from 'react'
import { Sparkles, X, Gift } from 'lucide-react'
import { Staff, StaffBonusType } from '@/types'
import { payrollService } from '@/services/payrollService'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/useToastStore'

interface AddBonusModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staffList: Staff[]
  preselectedStaffId?: string
}

const BONUS_TYPES: StaffBonusType[] = ['PERFORMANCE', 'FESTIVAL', 'ATTENDANCE', 'OTHER']

export const AddBonusModal: React.FC<AddBonusModalProps> = ({
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
  const [bonusType, setBonusType] = useState<StaffBonusType>('PERFORMANCE')
  const [amount, setAmount] = useState<number>(2000)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaffId) {
      addToast({ title: 'Validation Error', message: 'Please select a specialist.', type: 'danger' })
      return
    }
    if (!amount || amount <= 0) {
      addToast({ title: 'Validation Error', message: 'Bonus amount must be greater than zero.', type: 'danger' })
      return
    }
    if (!reason.trim()) {
      addToast({ title: 'Validation Error', message: 'Please provide a reason for the bonus.', type: 'danger' })
      return
    }

    setIsSubmitting(true)
    try {
      payrollService.addBonus({
        staffId: selectedStaffId,
        bonusType,
        amount,
        date,
        reason,
        awardedBy: 'Ayaan (Owner)',
      })

      const staff = staffList.find((s) => s.id === selectedStaffId)
      addToast({
        title: 'Bonus Awarded',
        message: `Awarded ₹${amount.toLocaleString('en-IN')} ${bonusType.toLowerCase()} bonus to ${staff?.name}.`,
        type: 'success',
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not award bonus'
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
      aria-labelledby="bonus-modal-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Gift className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="bonus-modal-title" className="text-base font-bold text-text-primary">
                Award Staff Bonus
              </h3>
              <p className="text-xs text-text-muted">
                Incentivize top performance, festival, or attendance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bonus modal"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="bon-staff" className="block text-xs font-semibold text-text-primary mb-1">
              Select Specialist *
            </label>
            <select
              id="bon-staff"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="bon-type" className="block text-xs font-semibold text-text-primary mb-1">
                Bonus Type *
              </label>
              <select
                id="bon-type"
                value={bonusType}
                onChange={(e) => setBonusType(e.target.value as StaffBonusType)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                {BONUS_TYPES.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt.charAt(0) + bt.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="bon-amount" className="block text-xs font-semibold text-text-primary mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                id="bon-amount"
                name="bonAmount"
                min="100"
                step="500"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm font-bold text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bon-reason" className="block text-xs font-semibold text-text-primary mb-1">
              Reason / Milestone Achievement *
            </label>
            <textarea
              id="bon-reason"
              name="bonReason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Exceeded monthly hair color sales target by 25%…"
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
              {isSubmitting ? 'Awarding…' : 'Confirm & Award Bonus'}
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
