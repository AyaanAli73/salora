import React, { useState } from 'react'
import { Bill, PrintPaperSize } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { printService } from '@/services/printService'
import { invoiceService } from '@/services/invoiceService'
import { useToastStore } from '@/store/useToastStore'
import { InvoicePrintTemplate } from './InvoicePrintTemplate'
import { PrintFailureDialog } from './PrintFailureDialog'
import {
  Printer,
  Download,
  Share2,
  Mail,
  RotateCcw,
  Receipt,
  Eye,
} from 'lucide-react'

interface BillInvoicePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  bill: Bill | null
  onReprint?: () => void
}

export const BillInvoicePreviewModal: React.FC<BillInvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  bill,
  onReprint,
}) => {
  const { addToast } = useToastStore()
  const settings = printService.getSettings()

  const [paperSize, setPaperSize] = useState<PrintPaperSize>(
    settings.defaultInvoiceSize || 'a4'
  )
  const [isPrinting, setIsPrinting] = useState(false)
  const [isFailureOpen, setIsFailureOpen] = useState(false)

  if (!bill) return null

  const handlePrint = async (asReprint = false) => {
    setIsPrinting(true)
    let res: { success: boolean; error?: string }

    if (asReprint) {
      res = await printService.reprintInvoice(bill, paperSize)
    } else {
      res = await printService.printInvoice(bill, paperSize)
    }
    setIsPrinting(false)

    if (res.success) {
      addToast({
        title: asReprint ? 'Invoice Reprinted' : 'Printed Successfully',
        message: `Sent to ${paperSize.toUpperCase()} printer for ${bill.invoiceNumber}.`,
        type: 'success',
      })
      if (asReprint && onReprint) onReprint()
    } else {
      setIsFailureOpen(true)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      await invoiceService.downloadPDF(bill, paperSize, settings)
      addToast({
        title: 'Invoice Exported',
        message: `Saved ${bill.invoiceNumber} in ${paperSize.toUpperCase()} format.`,
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Export Failed',
        message: 'Could not export invoice file.',
        type: 'danger',
      })
    }
  }

  const handleWhatsApp = () => {
    const url = invoiceService.generateWhatsAppUrl(bill)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleEmail = () => {
    const url = invoiceService.generateEmailUrl(bill)
    window.location.href = url
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Tax Invoice — ${bill.invoiceNumber}`}
        description="Inspect invoice details and dispatch to printer or customer channels."
        size="xl"
      >
        <div className="space-y-4">
          {/* Top Control Bar: Format Selector & Quick Channels */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-surface-subtle border border-border">
            {/* Format Selection Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-border">
              {(
                [
                  { id: 'a4', label: 'A4 Standard' },
                  { id: '80mm', label: '80mm Thermal' },
                  { id: '58mm', label: '58mm Thermal' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPaperSize(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    paperSize === tab.id
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quick Share Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                leftIcon={<Download className="h-3.5 w-3.5" />}
                className="text-xs"
              >
                PDF
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleWhatsApp}
                leftIcon={<Share2 className="h-3.5 w-3.5 text-emerald-600" />}
                className="text-xs text-emerald-600"
              >
                WhatsApp
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleEmail}
                leftIcon={<Mail className="h-3.5 w-3.5" />}
                className="text-xs"
              >
                Email
              </Button>
            </div>
          </div>

          {/* Paper Canvas */}
          <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-border flex justify-center items-start shadow-inner">
            <InvoicePrintTemplate
              bill={bill}
              paperSize={paperSize}
              settings={settings}
              isReprint={(bill.reprintCount || 0) > 0}
            />
          </div>

          {/* Bottom Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>Layout: <strong>{paperSize.toUpperCase()}</strong></span>
              {(bill.reprintCount || 0) > 0 && (
                <>
                  <span>•</span>
                  <Badge variant="warning" size="sm">
                    Reprinted {bill.reprintCount} time(s)
                  </Badge>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Close
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrint(true)}
                isLoading={isPrinting}
                leftIcon={<RotateCcw className="h-3.5 w-3.5 text-primary" />}
                className="text-xs border-primary/30"
              >
                Reprint Invoice
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handlePrint(false)}
                isLoading={isPrinting}
                leftIcon={<Printer className="h-4 w-4" />}
                className="shadow-glow-primary/30 text-xs font-bold"
              >
                Print Invoice
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Failure Dialog */}
      {isFailureOpen && (
        <PrintFailureDialog
          isOpen={isFailureOpen}
          onClose={() => setIsFailureOpen(false)}
          onRetry={() => handlePrint(false)}
          onSavePDF={handleDownloadPDF}
        />
      )}
    </>
  )
}
