import React, { useState } from 'react'
import {
  CheckCircle2,
  CreditCard,
  DollarSign,
  AlertTriangle,
  X,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Ban,
} from 'lucide-react'
import { PayrollRecord, PayrollPaymentMethod } from '@/types'
import { payrollService } from '@/services/payrollService'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

interface PayrollApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  payroll: PayrollRecord
  onOpenPayslip?: (record: PayrollRecord) => void
}

export const PayrollApprovalModal: React.FC<PayrollApprovalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  payroll,
  onOpenPayslip,
}) => {
  const { addToast } = useToastStore()
  const [activeStep, setActiveStep] = useState<'review' | 'pay' | 'void'>('review')
  const [paymentMethod, setPaymentMethod] = useState<PayrollPaymentMethod>('BANK_TRANSFER')
  const [paymentReference, setPaymentReference] = useState('')
  const [voidReason, setVoidReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handleApprove = () => {
    try {
      payrollService.approvePayroll(payroll.id, 'Ayaan (Owner)')
      addToast({
        title: 'Payroll Approved',
        message: `Approved payroll #${payroll.payrollNumber} for ${payroll.staffName}.`,
        type: 'success',
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not approve payroll'
      addToast({ title: 'Approval Failed', message: msg, type: 'danger' })
    }
  }

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    try {
      payrollService.markPayrollPaid(
        payroll.id,
        paymentMethod,
        paymentReference || 'Direct Bank Settlement',
        'Ayaan (Owner)'
      )
      addToast({
        title: 'Payroll Settled',
        message: `Disbursed ₹${payroll.netPay.toLocaleString('en-IN')} to ${payroll.staffName} via ${paymentMethod}.`,
        type: 'success',
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not mark payroll as paid'
      addToast({ title: 'Payment Failed', message: msg, type: 'danger' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault()
    if (!voidReason.trim()) {
      addToast({ title: 'Validation Error', message: 'Please specify a void reason.', type: 'danger' })
      return
    }

    try {
      payrollService.voidPayroll(payroll.id, voidReason, 'Ayaan (Owner)')
      addToast({
        title: 'Payroll Voided',
        message: `Payroll #${payroll.payrollNumber} has been voided.`,
        type: 'info',
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not void payroll'
      addToast({ title: 'Action Failed', message: msg, type: 'danger' })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-title"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50">
          <div className="flex items-center gap-3">
            <Avatar name={payroll.staffName} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h3 id="approval-title" className="text-base font-bold text-text-primary">
                  {payroll.staffName}
                </h3>
                <Badge
                  variant={
                    payroll.status === 'PAID'
                      ? 'success'
                      : payroll.status === 'APPROVED'
                      ? 'primary'
                      : 'warning'
                  }
                  size="sm"
                >
                  {payroll.status}
                </Badge>
              </div>
              <p className="text-xs text-text-muted">
                {payroll.payrollNumber} • {payroll.periodName} ({payroll.staffRole})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close approval modal"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeStep === 'review' && (
            <div className="space-y-4">
              {/* Top Net Pay Summary Banner */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-text-muted">Net Payable Amount</span>
                  <p className="text-2xl font-black text-primary tabular-nums">
                    {formatCurrency(payroll.netPay)}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-text-muted block">Gross Earnings:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{formatCurrency(payroll.grossPay)}
                  </span>
                  <span className="text-text-muted block mt-0.5">Total Deductions:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                    -{formatCurrency(payroll.totalDeductions + payroll.totalAdvancesDeducted)}
                  </span>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                  1. Earnings Breakdown
                </span>
                <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-muted">
                      Base Salary ({payroll.compensationType.replace(/_/g, ' ')})
                      {payroll.hourlyHoursWorked !== undefined && ` (${payroll.hourlyHoursWorked} hrs)`}:
                    </span>
                    <span className="font-bold text-text-primary tabular-nums">
                      {formatCurrency(payroll.baseSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">
                      Eligible Service Commission:
                    </span>
                    <span className="font-bold text-primary tabular-nums">
                      {formatCurrency(payroll.commission)}
                    </span>
                  </div>

                  {payroll.bonuses && payroll.bonuses.length > 0 && (
                    <div className="pt-2 border-t border-border/50 space-y-1">
                      <span className="font-semibold text-text-primary block text-[11px]">
                        Bonuses Awarded:
                      </span>
                      {payroll.bonuses.map((b) => (
                        <div key={b.id} className="flex justify-between text-[11px]">
                          <span className="text-text-muted">• {b.bonusType}: {b.reason}</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            +{formatCurrency(b.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                  2. Deductions & Adjustments
                </span>
                <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2 text-xs">
                  {payroll.deductions && payroll.deductions.length > 0 ? (
                    payroll.deductions.map((d) => (
                      <div key={d.id} className="flex justify-between">
                        <span className="text-text-muted">• {d.description} ({d.reason}):</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                          -{formatCurrency(d.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-text-muted italic">No operational deductions</div>
                  )}

                  {payroll.advances && payroll.advances.length > 0 && (
                    <div className="pt-2 border-t border-border/50 space-y-1">
                      <span className="font-semibold text-text-primary block text-[11px]">
                        Salary Advance Recoveries:
                      </span>
                      {payroll.advances.map((adv, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span className="text-text-muted">• {adv.note}</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                            -{formatCurrency(adv.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Commission Line Items Preview */}
              {payroll.commissionItems && payroll.commissionItems.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                    3. Eligible Commission Line Items ({payroll.commissionItems.length})
                  </span>
                  <div className="max-h-36 overflow-y-auto border border-border rounded-xl divide-y divide-border text-xs">
                    {payroll.commissionItems.map((ci) => (
                      <div key={ci.id} className="p-2.5 flex items-center justify-between hover:bg-muted/20">
                        <div>
                          <span className="font-semibold text-text-primary block">
                            {ci.serviceName}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {ci.transactionNumber} • {ci.appliedRuleName}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-primary tabular-nums block">
                            +{formatCurrency(ci.commissionAmount)}
                          </span>
                          <span className="text-[10px] text-text-muted tabular-nums">
                            on {formatCurrency(ci.netEligibleAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Toolbar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border">
                <div className="flex items-center gap-2">
                  {onOpenPayslip && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenPayslip(payroll)}
                      leftIcon={<FileText className="w-3.5 h-3.5" />}
                    >
                      View Salary Slip
                    </Button>
                  )}
                  {payroll.status !== 'PAID' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveStep('void')}
                      className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    >
                      Void Record
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {payroll.status === 'CALCULATED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleApprove}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      className="shadow-glow-primary/20"
                    >
                      Approve Payroll
                    </Button>
                  )}

                  {payroll.status !== 'PAID' && payroll.status !== 'VOID' && (
                    <Button
                      variant={payroll.status === 'APPROVED' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setActiveStep('pay')}
                      leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                      className={payroll.status === 'APPROVED' ? 'shadow-glow-primary/20' : ''}
                    >
                      Disburse / Pay
                    </Button>
                  )}

                  <Button variant="outline" size="sm" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'pay' && (
            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-xs flex justify-between items-center">
                <div>
                  <span className="text-text-muted block">Settling Payroll for:</span>
                  <span className="font-bold text-text-primary text-sm">{payroll.staffName}</span>
                </div>
                <div className="text-right">
                  <span className="text-text-muted block">Total Net Amount:</span>
                  <span className="font-bold text-primary text-lg tabular-nums">
                    {formatCurrency(payroll.netPay)}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="pay-method" className="block text-xs font-semibold text-text-primary mb-1">
                  Payment Method *
                </label>
                <select
                  id="pay-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PayrollPaymentMethod)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="UPI">UPI Instant Pay</option>
                  <option value="CASH">Cash Drawer Outflow</option>
                  <option value="CHEQUE">Bank Cheque</option>
                </select>
              </div>

              <div>
                <label htmlFor="pay-ref" className="block text-xs font-semibold text-text-primary mb-1">
                  Transaction Reference / UTR Number
                </label>
                <input
                  type="text"
                  id="pay-ref"
                  name="payRef"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. UTR-HDFC-9182910291 or Cheque #004128"
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Marking this payroll as paid will automatically record salary advance repayments and lock the record in the permanent financial audit ledger.
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isProcessing}
                  className="flex-1 justify-center py-2.5 shadow-glow-primary/20"
                >
                  {isProcessing ? 'Processing Disbursement…' : `Confirm Payment of ${formatCurrency(payroll.netPay)}`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep('review')}
                  className="w-24 justify-center"
                >
                  Back
                </Button>
              </div>
            </form>
          )}

          {activeStep === 'void' && (
            <form onSubmit={handleConfirmVoid} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Voiding will invalidate this calculated payroll entry. You can recalculate it later once corrections are made.
                </span>
              </div>

              <div>
                <label htmlFor="void-reason" className="block text-xs font-semibold text-text-primary mb-1">
                  Reason for Voiding *
                </label>
                <textarea
                  id="void-reason"
                  name="voidReason"
                  rows={3}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="e.g., Incorrect attendance hours entered, pending commission dispute…"
                  required
                  className="w-full p-3 rounded-xl border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="danger" className="flex-1 justify-center">
                  Confirm Void
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep('review')}
                  className="w-24 justify-center"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
