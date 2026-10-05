import React, { useState } from 'react'
import { Percent, X, AlertTriangle } from 'lucide-react'
import { Staff, PayrollDeductionType } from '@/types'
import { payrollService } from '@/services/payrollService'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/useToastStore'

interface AddDeductionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staffList: Staff[]
  preselectedStaffId?: string
}

const DEDUCTION_TYPES: { type: PayrollDeductionType; label: string }[] = [
  { type: 'TAX_TDS', label: 'TDS / Professional Tax' },
  { type: 'UNIFORM_KIT', label: 'Uniform / Tool Kit Purchase' },
  { type: 'LATE_PENALTY', label: 'Excess Late Penalty' },
  { type: 'UNPAID_LEAVE', label: 'Unpaid Leave / Absenteeism' },
  { type: 'ADVANCE_RECOVERY', label: 'Salary Advance Recovery' },
  { type: 'OTHER_CUSTOM', label: 'Other Configurable Deduction' },
]

export const AddDeductionModal: React.FC<AddDeductionModalProps> = ({
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
  const [deductionType, setDeductionType] = useState<PayrollDeductionType>('TAX_TDS')
  const [amount, setAmount] = useState<number>(750)
  const [description, setDescription] = useState('Income Tax TDS Deduction')
  const [reason, setReason] = useState('')

  if (!isOpen) return null

  const handleTypeChange = (newType: PayrollDeductionType) => {
    setDeductionType(newType)
    const match = DEDUCTION_TYPES.find((d) => d.type === newType)
    if (match) {
      setDescription(match.label)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaffId) {
      addToast({ title: 'Validation Error', message: 'Please select a specialist.', type: 'danger' })
      return
    }
    if (!amount || amount <= 0) {
      addToast({ title: 'Validation Error', message: 'Deduction amount must be greater than zero.', type: 'danger' })
      return
    }
    if (!reason.trim()) {
      addToast({ title: 'Validation Error', message: 'Please specify the rationale or policy basis.', type: 'danger' })
      return
    }

    try {
      payrollService.addDeduction({
        staffId: selectedStaffId,
        deductionType,
        amount,
        description: description || 'Configured Payroll Deduction',
        reason,
      })

      const staff = staffList.find((s) => s.id === selectedStaffId)
      addToast({
        title: 'Deduction Added',
        message: `Applied ₹${amount.toLocaleString('en-IN')} deduction to ${staff?.name}'s payroll.`,
        type: 'info',
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not add deduction'
      addToast({ title: 'Error', message: msg, type: 'danger' })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deduction-modal-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Percent className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="deduction-modal-title" className="text-base font-bold text-text-primary">
                Add Configurable Deduction
              </h3>
              <p className="text-xs text-text-muted">
                Custom tax, uniform, kit, or absenteeism adjustments
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close deduction modal"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="ded-staff" className="block text-xs font-semibold text-text-primary mb-1">
              Select Specialist *
            </label>
            <select
              id="ded-staff"
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
              <label htmlFor="ded-type" className="block text-xs font-semibold text-text-primary mb-1">
                Deduction Type *
              </label>
              <select
                id="ded-type"
                value={deductionType}
                onChange={(e) => handleTypeChange(e.target.value as PayrollDeductionType)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                {DEDUCTION_TYPES.map((dt) => (
                  <option key={dt.type} value={dt.type}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ded-amount" className="block text-xs font-semibold text-text-primary mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                id="ded-amount"
                name="dedAmount"
                min="50"
                step="50"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm font-bold text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ded-desc" className="block text-xs font-semibold text-text-primary mb-1">
              Description Title *
            </label>
            <input
              type="text"
              id="ded-desc"
              name="dedDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Standard Monthly TDS Assessment"
              required
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="ded-reason" className="block text-xs font-semibold text-text-primary mb-1">
              Policy Reason / Clause *
            </label>
            <textarea
              id="ded-reason"
              name="dedReason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Salon kit subsidy installment 1 of 3…"
              required
              className="w-full p-3 rounded-xl border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              type="submit"
              variant="danger"
              className="flex-1 justify-center py-2.5"
            >
              Add Deduction
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
