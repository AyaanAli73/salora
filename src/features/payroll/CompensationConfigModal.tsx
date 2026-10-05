import React, { useState } from 'react'
import { Sliders, X, Wallet, Building2, Check } from 'lucide-react'
import { Staff, StaffCompensationConfig, StaffCompensationType } from '@/types'
import { payrollService } from '@/services/payrollService'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

interface CompensationConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staff: Staff
  initialConfig?: StaffCompensationConfig
}

export const CompensationConfigModal: React.FC<CompensationConfigModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staff,
  initialConfig,
}) => {
  const { addToast } = useToastStore()

  const config = initialConfig || payrollService.getCompensationConfig(staff.id)

  const [compensationType, setCompensationType] = useState<StaffCompensationType>(
    config.compensationType
  )
  const [baseSalary, setBaseSalary] = useState<number>(config.baseSalary || 30000)
  const [hourlyRate, setHourlyRate] = useState<number>(config.hourlyRate || 150)
  const [defaultCommissionRate, setDefaultCommissionRate] = useState<number>(
    config.defaultCommissionRate || 15
  )
  const [bankName, setBankName] = useState(config.bankDetails?.bankName || '')
  const [accountNumber, setAccountNumber] = useState(config.bankDetails?.accountNumber || '')
  const [ifscCode, setIfscCode] = useState(config.bankDetails?.ifscCode || '')
  const [upiId, setUpiId] = useState(config.bankDetails?.upiId || '')
  const [notes, setNotes] = useState(config.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      payrollService.saveCompensationConfig(
        {
          staffId: staff.id,
          compensationType,
          baseSalary: Number(baseSalary) || 0,
          hourlyRate: Number(hourlyRate) || 0,
          defaultCommissionRate: Number(defaultCommissionRate) || 0,
          effectiveFrom: config.effectiveFrom || '2026-01-01',
          bankDetails: {
            bankName,
            accountNumber,
            ifscCode,
            upiId,
          },
          notes,
          updatedAt: new Date().toISOString(),
        },
        'Ayaan (Owner)'
      )

      addToast({
        title: 'Compensation Updated',
        message: `Updated salary and commission terms for ${staff.name}.`,
        type: 'success',
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save compensation terms'
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
      aria-labelledby="comp-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sliders className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="comp-modal-title" className="text-base font-bold text-text-primary">
                Compensation Terms • {staff.name}
              </h3>
              <p className="text-xs text-text-muted">
                Configure base remuneration, hourly rates, and baseline commission splits
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close compensation modal"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Compensation Model Select */}
          <div>
            <span className="block text-xs font-semibold text-text-primary mb-1.5">
              Compensation Structure *
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCompensationType('FIXED_PLUS_COMMISSION')}
                className={cn(
                  'p-3 rounded-xl border text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  compensationType === 'FIXED_PLUS_COMMISSION'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border text-text-muted hover:text-text-primary bg-muted/20'
                )}
              >
                <span className="block font-bold">Fixed + Commission</span>
                <span className="text-[11px] opacity-80">Guaranteed base + service %</span>
              </button>

              <button
                type="button"
                onClick={() => setCompensationType('FIXED')}
                className={cn(
                  'p-3 rounded-xl border text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  compensationType === 'FIXED'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border text-text-muted hover:text-text-primary bg-muted/20'
                )}
              >
                <span className="block font-bold">Fixed Salary Only</span>
                <span className="text-[11px] opacity-80">Flat monthly stipend</span>
              </button>

              <button
                type="button"
                onClick={() => setCompensationType('HOURLY')}
                className={cn(
                  'p-3 rounded-xl border text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  compensationType === 'HOURLY'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border text-text-muted hover:text-text-primary bg-muted/20'
                )}
              >
                <span className="block font-bold">Hourly Salary</span>
                <span className="text-[11px] opacity-80">Clocked attendance hours</span>
              </button>

              <button
                type="button"
                onClick={() => setCompensationType('COMMISSION_ONLY')}
                className={cn(
                  'p-3 rounded-xl border text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  compensationType === 'COMMISSION_ONLY'
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border text-text-muted hover:text-text-primary bg-muted/20'
                )}
              >
                <span className="block font-bold">Commission Only</span>
                <span className="text-[11px] opacity-80">100% service-volume split</span>
              </button>
            </div>
          </div>

          {/* Amounts based on selection */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/30 border border-border">
            {(compensationType === 'FIXED' || compensationType === 'FIXED_PLUS_COMMISSION') && (
              <div>
                <label htmlFor="comp-base" className="block text-xs font-semibold text-text-primary mb-1">
                  Monthly Base Salary (₹) *
                </label>
                <input
                  type="number"
                  id="comp-base"
                  name="compBase"
                  min="0"
                  step="500"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm font-bold text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            )}

            {compensationType === 'HOURLY' && (
              <div>
                <label htmlFor="comp-hourly" className="block text-xs font-semibold text-text-primary mb-1">
                  Hourly Rate (₹ / hr) *
                </label>
                <input
                  type="number"
                  id="comp-hourly"
                  name="compHourly"
                  min="0"
                  step="10"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm font-bold text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            )}

            {compensationType !== 'FIXED' && (
              <div>
                <label htmlFor="comp-comm" className="block text-xs font-semibold text-text-primary mb-1">
                  Default Commission Rate (%) *
                </label>
                <input
                  type="number"
                  id="comp-comm"
                  name="compComm"
                  min="0"
                  max="100"
                  step="1"
                  value={defaultCommissionRate}
                  onChange={(e) => setDefaultCommissionRate(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm font-bold text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            )}
          </div>

          {/* Bank / UPI Disbursal Details */}
          <div className="space-y-3 pt-1 border-t border-border">
            <span className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
              Disbursement Account Information
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="comp-bank" className="block text-[11px] font-semibold text-text-muted mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  id="comp-bank"
                  name="compBank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="comp-acc" className="block text-[11px] font-semibold text-text-muted mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  id="comp-acc"
                  name="compAcc"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 50100492817291"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="comp-ifsc" className="block text-[11px] font-semibold text-text-muted mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  id="comp-ifsc"
                  name="compIfsc"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0000128"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-mono text-text-primary uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="comp-upi" className="block text-[11px] font-semibold text-text-muted mb-1">
                  UPI VPA ID
                </label>
                <input
                  type="text"
                  id="comp-upi"
                  name="compUpi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. camille@okhdfcbank"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="comp-notes" className="block text-xs font-semibold text-text-primary mb-1">
              Internal Compensation Notes (Optional)
            </label>
            <input
              type="text"
              id="comp-notes"
              name="compNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Subject to quarterly performance revision…"
              className="w-full h-9 px-3 rounded-xl border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex-1 justify-center py-2.5 shadow-glow-primary/20"
            >
              {isSubmitting ? 'Saving Terms…' : 'Save Compensation Terms'}
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
