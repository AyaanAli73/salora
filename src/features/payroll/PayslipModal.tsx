import React, { useRef } from 'react'
import {
  Printer,
  Download,
  X,
  Building2,
  Calendar,
  User,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import { PayrollRecord } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToastStore } from '@/store/useToastStore'

interface PayslipModalProps {
  isOpen: boolean
  onClose: () => void
  payroll: PayrollRecord
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  isOpen,
  onClose,
  payroll,
}) => {
  const { addToast } = useToastStore()
  const slipRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
    addToast({
      title: 'Printing Payslip',
      message: `Sent payslip #${payroll.payrollNumber} to system printer.`,
      type: 'info',
    })
  }

  const handleDownloadPDF = () => {
    // In browser environment, window.print() can "Save as PDF" or triggers native print dialog
    window.print()
    addToast({
      title: 'Payslip Export',
      message: 'Choose "Save as PDF" in your print destination menu.',
      type: 'info',
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payslip-title"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Action Bar (Screen Only) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-background/50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-text-primary">
              Salary Payslip • {payroll.payrollNumber}
            </span>
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

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Print Slip
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadPDF}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="shadow-glow-primary/20"
            >
              Download PDF
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close payslip modal"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div
          ref={slipRef}
          className="p-8 overflow-y-auto space-y-6 text-text-primary bg-white dark:bg-card print:p-0 print:m-0"
        >
          {/* 1. Header with Salon Branding */}
          <div className="flex items-start justify-between border-b border-border pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white" translate="no">
                  SALORA
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-semibold bg-primary/10 text-primary uppercase tracking-wider">
                  Official Salary Slip
                </span>
              </div>
              <p className="text-xs text-text-muted">SALORA Luxe Salon & Spa • Suite 402, Platinum Square</p>
              <p className="text-xs text-text-muted">Bandra West, Mumbai 400050 • GSTIN: 27AABCG1234F1Z8</p>
            </div>

            <div className="text-right space-y-1 text-xs">
              <div className="font-bold text-text-primary font-mono text-sm tabular-nums">
                {payroll.payrollNumber}
              </div>
              <p className="text-text-muted">Pay Period: <strong className="text-text-primary">{payroll.periodName}</strong></p>
              <p className="text-text-muted">
                Dates: <span className="tabular-nums">{payroll.periodStart} to {payroll.periodEnd}</span>
              </p>
            </div>
          </div>

          {/* 2. Employee Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/30 border border-border text-xs">
            <div>
              <span className="text-text-muted block text-[11px]">Specialist Name</span>
              <span className="font-bold text-text-primary text-sm">{payroll.staffName}</span>
            </div>
            <div>
              <span className="text-text-muted block text-[11px]">Designation / Role</span>
              <span className="font-semibold text-text-primary">{payroll.staffRole}</span>
            </div>
            <div>
              <span className="text-text-muted block text-[11px]">Staff ID</span>
              <span className="font-mono text-text-primary font-medium">{payroll.staffId}</span>
            </div>
            <div>
              <span className="text-text-muted block text-[11px]">Compensation Model</span>
              <span className="font-semibold text-primary capitalize">
                {payroll.compensationType.replace(/_/g, ' ').toLowerCase()}
              </span>
            </div>
          </div>

          {/* 3. Earnings & Deductions Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings Column */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-emerald-500/10 px-4 py-2 border-b border-border text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Earnings Breakdown
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                {/* Base Salary */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-text-primary">Base Salary</span>
                    {payroll.hourlyHoursWorked !== undefined && (
                      <span className="text-[10px] text-text-muted block tabular-nums">
                        ({payroll.hourlyHoursWorked} verified attendance hours)
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-text-primary tabular-nums">
                    {formatCurrency(payroll.baseSalary)}
                  </span>
                </div>

                {/* Service Commission */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-text-primary">Service Commission</span>
                    {payroll.commissionItems && payroll.commissionItems.length > 0 && (
                      <span className="text-[10px] text-text-muted block tabular-nums">
                        ({payroll.commissionItems.length} eligible client services)
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-text-primary tabular-nums">
                    {formatCurrency(payroll.commission)}
                  </span>
                </div>

                {/* Bonuses */}
                {payroll.bonuses && payroll.bonuses.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-border/50">
                    <span className="text-[11px] font-semibold text-text-muted uppercase">Bonuses</span>
                    {payroll.bonuses.map((b) => (
                      <div key={b.id} className="flex justify-between text-[11px]">
                        <span className="text-text-muted truncate max-w-[180px]">
                          • {b.bonusType}: {b.reason}
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{formatCurrency(b.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gross Earnings Subtotal */}
                <div className="flex justify-between items-center pt-2.5 border-t border-border font-bold">
                  <span>Gross Earnings</span>
                  <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(payroll.grossPay)}
                  </span>
                </div>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-rose-500/10 px-4 py-2 border-b border-border text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                Deductions & Recoveries
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                {/* Configured Deductions */}
                {payroll.deductions && payroll.deductions.length > 0 ? (
                  payroll.deductions.map((d) => (
                    <div key={d.id} className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-text-primary">{d.description}</span>
                        <span className="text-[10px] text-text-muted block truncate max-w-[180px]">
                          {d.reason}
                        </span>
                      </div>
                      <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        -{formatCurrency(d.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-text-muted italic py-1">No operational deductions applied</div>
                )}

                {/* Advances Recovered */}
                {payroll.advances && payroll.advances.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-border/50">
                    <span className="text-[11px] font-semibold text-text-muted uppercase">
                      Salary Advance Adjustments
                    </span>
                    {payroll.advances.map((adv, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className="text-text-muted truncate max-w-[180px]">• {adv.note}</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                          -{formatCurrency(adv.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total Deductions Subtotal */}
                <div className="flex justify-between items-center pt-2.5 border-t border-border font-bold">
                  <span>Total Deductions</span>
                  <span className="text-rose-600 dark:text-rose-400 tabular-nums">
                    -{formatCurrency(payroll.totalDeductions + payroll.totalAdvancesDeducted)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Net Salary Pay Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs uppercase tracking-wider font-bold text-text-muted">
                Take-Home Net Salary Disbursed
              </span>
              <p className="text-xs text-text-muted">
                Calculated strictly in accordance with salon compensation policy
              </p>
            </div>
            <div className="text-right sm:text-right">
              <div className="text-3xl font-black text-primary tabular-nums">
                {formatCurrency(payroll.netPay)}
              </div>
              <span className="text-[11px] font-semibold text-text-muted capitalize">
                Net Payable Amount
              </span>
            </div>
          </div>

          {/* 5. Payment Audit & Compliance Footer */}
          <div className="pt-4 border-t border-border text-xs text-text-muted space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>
                  Status:{' '}
                  <strong className="text-text-primary capitalize">{payroll.status}</strong>
                  {payroll.paidAt && (
                    <span className="tabular-nums"> on {formatDate(payroll.paidAt)}</span>
                  )}
                </span>
              </div>
              {payroll.paymentMethod && (
                <div>
                  Method: <strong className="text-text-primary">{payroll.paymentMethod}</strong>
                  {payroll.paymentReference && (
                    <span className="font-mono text-[11px]"> ({payroll.paymentReference})</span>
                  )}
                </div>
              )}
            </div>

            <p className="text-[11px] text-text-muted leading-relaxed">
              This is a computer-generated salary slip approved by SALORA Salon Management. Customer payments, client billing receipts, and employee payroll accounts are maintained strictly as separate financial entities.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
