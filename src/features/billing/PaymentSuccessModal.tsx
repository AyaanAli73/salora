import React, { useState } from 'react'
import { Bill } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/formatters'
import { printService } from '@/services/printService'
import { invoiceService } from '@/services/invoiceService'
import { useToastStore } from '@/store/useToastStore'
import {
  CheckCircle2,
  Printer,
  Download,
  Share2,
  Mail,
  Receipt,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Eye,
} from 'lucide-react'
import { PrintPreviewModal } from './PrintPreviewModal'
import { PrintFailureDialog } from './PrintFailureDialog'

interface PaymentSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  bill: Bill | null
  onReprint?: () => void
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  bill,
  onReprint,
}) => {
  const { addToast } = useToastStore()
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isFailureOpen, setIsFailureOpen] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  if (!bill) return null

  // Fast print invoice using service layer
  const handlePrintInvoice = async () => {
    setIsPrinting(true)
    const res = await printService.printInvoice(bill, 'a4')
    setIsPrinting(false)

    if (res.success) {
      addToast({
        title: 'Invoice Sent to Printer',
        message: `Standard A4 invoice printed for ${bill.invoiceNumber}.`,
        type: 'success',
      })
    } else {
      setIsFailureOpen(true)
    }
  }

  // Fast print thermal receipt using service layer
  const handlePrintReceipt = async () => {
    setIsPrinting(true)
    const settings = printService.getSettings()
    const size = settings.defaultTokenSize || '58mm'
    const res = await printService.printReceipt(bill, size)
    setIsPrinting(false)

    if (res.success) {
      addToast({
        title: 'Thermal Receipt Printed',
        message: `Slip generated on ${size} roll for ${bill.invoiceNumber}.`,
        type: 'success',
      })
    } else {
      setIsFailureOpen(true)
    }
  }

  // Reprint using service layer
  const handleReprint = async () => {
    setIsPrinting(true)
    const res = await printService.reprintInvoice(bill)
    setIsPrinting(false)

    if (res.success) {
      addToast({
        title: 'Duplicate Slip Printed',
        message: `Reprinted invoice copy for ${bill.invoiceNumber}.`,
        type: 'info',
      })
      if (onReprint) onReprint()
    } else {
      setIsFailureOpen(true)
    }
  }

  // Download PDF
  const handleDownloadPDF = async () => {
    try {
      await invoiceService.downloadPDF(bill, 'a4')
      addToast({
        title: 'PDF Export Ready',
        message: `Downloaded e-invoice #${bill.invoiceNumber}.`,
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Download Failed',
        message: 'Could not export invoice PDF.',
        type: 'danger',
      })
    }
  }

  // WhatsApp share
  const handleWhatsApp = () => {
    const url = invoiceService.generateWhatsAppUrl(bill)
    window.open(url, '_blank', 'noopener,noreferrer')
    addToast({
      title: 'WhatsApp Notification',
      message: `Opening WhatsApp with invoice details for ${bill.clientName}.`,
      type: 'info',
    })
  }

  // Email share
  const handleEmail = () => {
    const url = invoiceService.generateEmailUrl(bill)
    window.location.href = url
    addToast({
      title: 'Email Client Opened',
      message: `Composed tax invoice message for ${bill.clientEmail || bill.clientName}.`,
      type: 'info',
    })
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <div className="text-center py-4 space-y-5">
          {/* Success Check Animation Header */}
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-text-primary tracking-tight font-sans">
              Payment Successful!
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Transaction finalized and inventory ledger balanced.
            </p>
          </div>

          {/* Invoice Card Meta */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-2.5 max-w-sm mx-auto text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-muted uppercase font-bold tracking-wider">
                Invoice Number
              </span>
              <span className="font-mono font-black text-sm text-primary">
                {bill.invoiceNumber}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Customer</span>
              <span className="font-bold text-text-primary">{bill.clientName}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Payment Method</span>
              <span className="font-bold text-text-primary uppercase">
                {bill.paymentMethod}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/80">
              <span className="text-xs font-bold text-text-primary">Amount Paid</span>
              <span className="text-lg font-black text-text-primary tabular-nums">
                {formatCurrency(bill.paidAmount)}
              </span>
            </div>

            {bill.dueAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-rose-500 font-bold pt-0.5">
                <span>Customer Due</span>
                <span className="tabular-nums">{formatCurrency(bill.dueAmount)}</span>
              </div>
            )}
          </div>

          {/* Action Grid: Required buttons */}
          <div className="space-y-2 pt-1 max-w-sm mx-auto">
            {/* Row 1: Primary Print Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                onClick={handlePrintInvoice}
                isLoading={isPrinting}
                leftIcon={<Printer className="h-4 w-4" />}
                className="shadow-glow-primary/30 text-xs font-bold"
              >
                Print Invoice (A4)
              </Button>

              <Button
                variant="outline"
                onClick={handlePrintReceipt}
                isLoading={isPrinting}
                leftIcon={<Receipt className="h-4 w-4 text-primary" />}
                className="text-xs font-bold border-primary/30"
              >
                Print Receipt
              </Button>
            </div>

            {/* Row 2: Digital Sharing & Export */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                leftIcon={<Download className="h-3.5 w-3.5" />}
                className="text-xs"
              >
                PDF
              </Button>

              <Button
                variant="outline"
                onClick={handleWhatsApp}
                leftIcon={<Share2 className="h-3.5 w-3.5 text-emerald-600" />}
                className="text-xs text-emerald-600 hover:text-emerald-700"
              >
                WhatsApp
              </Button>

              <Button
                variant="outline"
                onClick={handleEmail}
                leftIcon={<Mail className="h-3.5 w-3.5" />}
                className="text-xs"
              >
                Email
              </Button>
            </div>

            {/* Row 3: Preview & Reprint shortcuts */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview Layout
              </button>

              <button
                type="button"
                onClick={handleReprint}
                className="text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reprint Invoice
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <Button variant="ghost" size="md" onClick={onClose} className="w-full text-xs">
              Close & New Sale
            </Button>
          </div>
        </div>
      </Modal>

      {/* Print Preview Modal */}
      {isPreviewOpen && (
        <PrintPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          bill={bill}
          onReprint={onReprint}
        />
      )}

      {/* Failure Dialog */}
      {isFailureOpen && (
        <PrintFailureDialog
          isOpen={isFailureOpen}
          onClose={() => setIsFailureOpen(false)}
          onRetry={handlePrintInvoice}
          onSavePDF={handleDownloadPDF}
        />
      )}
    </>
  )
}
