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
  RotateCcw,
  Copy,
  Sliders,
  CheckCircle2,
} from 'lucide-react'

interface PrintPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  bill: Bill | null
  initialSize?: PrintPaperSize
  onReprint?: () => void
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  bill,
  initialSize = 'a4',
  onReprint,
}) => {
  const { addToast } = useToastStore()
  const settings = printService.getSettings()

  const [paperSize, setPaperSize] = useState<PrintPaperSize>(
    initialSize || settings.defaultInvoiceSize || 'a4'
  )
  const [copies, setCopies] = useState<1 | 2 | 3>(settings.copies || 1)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isFailureOpen, setIsFailureOpen] = useState(false)

  if (!bill) return null

  const handlePrint = async (asReprint = false) => {
    setIsPrinting(true)
    let res: { success: boolean; error?: string }

    if (asReprint) {
      res = await printService.reprintInvoice(bill, paperSize, copies)
    } else {
      res = await printService.printInvoice(bill, paperSize, copies)
    }
    setIsPrinting(false)

    if (res.success) {
      addToast({
        title: asReprint ? 'Invoice Reprinted' : 'Printed Successfully',
        message: `${copies} cop${copies > 1 ? 'ies' : 'y'} sent to ${paperSize.toUpperCase()} printer for ${bill.invoiceNumber}.`,
        type: 'success',
      })
      if (asReprint && onReprint) onReprint()
      onClose()
    } else {
      setIsFailureOpen(true)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      await invoiceService.downloadPDF(bill, paperSize, settings)
      addToast({
        title: 'Document Exported',
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

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Print Preview — ${bill.invoiceNumber}`}
        description="Inspect layout fidelity before dispatching to physical printer."
        size="xl"
      >
        <div className="space-y-4">
          {/* Top Control Bar: Paper Size Tabs & Copies */}
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

            {/* Copies selector & Action Shortcuts */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-muted flex items-center gap-1">
                <Copy className="h-3.5 w-3.5" />
                Copies:
              </span>
              <div className="flex items-center gap-1">
                {([1, 2, 3] as const).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCopies(num)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold border transition-colors ${
                      copies === num
                        ? 'border-primary bg-primary/10 text-primary font-black'
                        : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <div className="h-5 w-px bg-border mx-1" />

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                leftIcon={<Download className="h-3.5 w-3.5" />}
                className="text-xs"
              >
                Save File
              </Button>
            </div>
          </div>

          {/* Paper Canvas Display Area */}
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
              <span>Paper: <strong>{paperSize.toUpperCase()}</strong></span>
              <span>•</span>
              <span>Copies: <strong>{copies}</strong></span>
              {(bill.reprintCount || 0) > 0 && (
                <>
                  <span>•</span>
                  <Badge variant="warning" size="sm">
                    Reprinted {bill.reprintCount}x
                  </Badge>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Cancel
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
                Print Now ({paperSize.toUpperCase()})
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
