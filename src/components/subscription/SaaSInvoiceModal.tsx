import React from 'react'
import {
  Printer,
  Download,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Sparkles,
} from 'lucide-react'
import { SaaSInvoice } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToastStore } from '@/store/useToastStore'

interface SaaSInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: SaaSInvoice | null
}

export const SaaSInvoiceModal: React.FC<SaaSInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const { addToast } = useToastStore()

  if (!invoice) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    const csvContent =
      `Salora SaaS Subscription Tax Invoice\n` +
      `Invoice Number,${invoice.invoiceNumber}\n` +
      `Salon,${invoice.salonName}\n` +
      `Plan,${invoice.planName}\n` +
      `Billing Cycle,${invoice.billingCycle}\n` +
      `Period,${invoice.periodStart} to ${invoice.periodEnd}\n` +
      `Subtotal,₹${invoice.subtotal}\n` +
      `GST (18%),₹${invoice.tax}\n` +
      `Total,₹${invoice.total}\n` +
      `Status,${invoice.paymentStatus}\n` +
      `Issued At,${invoice.issuedAt}\n`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoice.invoiceNumber}.csv`
    a.click()
    URL.revokeObjectURL(url)

    addToast({
      title: 'Invoice Downloaded',
      message: `${invoice.invoiceNumber} saved to downloads.`,
      type: 'success',
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tax Invoice — ${invoice.invoiceNumber}`}
      size="md"
    >
      <div className="space-y-6 text-xs text-text-primary print:p-0">
        {/* Salora SaaS Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-text-primary">
                SALORA SALON SAAS
              </span>
              <Badge variant="primary" className="text-[9px]">
                Official Receipt
              </Badge>
            </div>
            <p className="text-[11px] text-text-muted">
              Salora Cloud Technologies Private Limited
            </p>
            <p className="text-[10px] text-text-muted">
              GSTIN: <span className="font-mono">08AABCG1234F1Z9</span> • Support: billing@salora.com
            </p>
          </div>

          <div className="text-right">
            <span
              className={
                invoice.paymentStatus === 'PAID'
                  ? 'px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px]'
                  : 'px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider text-[10px]'
              }
            >
              {invoice.paymentStatus}
            </span>
            <p className="font-mono text-xs font-bold text-text-primary mt-1.5">
              {invoice.invoiceNumber}
            </p>
            <p className="text-[10px] text-text-muted">
              Issued: {new Date(invoice.issuedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Billed To / Salon Details */}
        <div className="p-3.5 rounded-xl bg-surface-subtle border border-border grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block mb-1">
              Billed To:
            </span>
            <p className="font-bold text-text-primary text-xs">{invoice.salonName}</p>
            <p className="text-[11px] text-text-muted truncate">{invoice.billingEmail}</p>
            {invoice.gstNumber && (
              <p className="text-[10px] text-text-muted font-mono mt-0.5">
                Client GSTIN: {invoice.gstNumber}
              </p>
            )}
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block mb-1">
              Service Period:
            </span>
            <p className="font-semibold text-text-primary text-xs">
              {invoice.periodStart} &rarr; {invoice.periodEnd}
            </p>
            <p className="text-[11px] text-text-muted capitalize">
              Cycle: {invoice.billingCycle}
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">
              Paid via {invoice.paymentMethod}
            </p>
          </div>
        </div>

        {/* Itemized Line Items */}
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle border-b border-border text-[10px] font-bold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="p-2.5">Subscription Plan / Description</th>
                <th className="p-2.5 text-center">Qty</th>
                <th className="p-2.5 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-2.5">
                  <p className="font-bold text-text-primary">{invoice.planName}</p>
                  <p className="text-[10px] text-text-muted">
                    Full platform entitlements, multi-branch, AI Assistant & workflow engine
                  </p>
                </td>
                <td className="p-2.5 text-center tabular-nums text-text-muted">1</td>
                <td className="p-2.5 text-right font-semibold text-text-primary tabular-nums">
                  ₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculation Summary */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5 text-xs">
            <div className="flex justify-between text-text-muted">
              <span>Subtotal:</span>
              <span className="tabular-nums font-semibold text-text-primary">
                ₹{invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>GST (18% Integrated Tax):</span>
              <span className="tabular-nums font-semibold text-text-primary">
                ₹{invoice.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Discount / Promo:</span>
                <span className="tabular-nums">
                  -₹{invoice.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-border flex justify-between text-sm font-extrabold text-text-primary">
              <span>Total Paid:</span>
              <span className="tabular-nums text-primary">
                ₹{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border flex items-center justify-between print:hidden">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              className="text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download Receipt
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
