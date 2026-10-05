import React, { useState } from 'react'
import { FileText, Upload, CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PurchaseOrder } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { useToastStore } from '@/store/useToastStore'
import { procurementService } from '@/services/procurementService'
import { storageService } from '@/services/storageService'

interface RecordSupplierInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseOrder: PurchaseOrder
  onSaved: () => void
}

export const RecordSupplierInvoiceModal: React.FC<RecordSupplierInvoiceModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSaved,
}) => {
  const { addToast } = useToastStore()

  const [invoiceNumber, setInvoiceNumber] = useState(
    purchaseOrder.invoiceDetails?.supplierInvoiceNumber || purchaseOrder.invoiceNumber || ''
  )
  const [invoiceDate, setInvoiceDate] = useState(
    purchaseOrder.invoiceDetails?.invoiceDate || new Date().toISOString().split('T')[0]
  )
  const [amount, setAmount] = useState(
    purchaseOrder.invoiceDetails?.amount || purchaseOrder.total
  )
  const [tax, setTax] = useState(
    purchaseOrder.invoiceDetails?.tax || purchaseOrder.tax
  )
  const [attachmentUrl, setAttachmentUrl] = useState(
    purchaseOrder.invoiceDetails?.attachmentUrl || ''
  )
  const [attachmentName, setAttachmentName] = useState(
    purchaseOrder.invoiceDetails?.attachmentName || ''
  )
  const [notes, setNotes] = useState(purchaseOrder.invoiceDetails?.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const stored = await storageService.uploadFile(
        {
          name: file.name,
          size: file.size,
          type: file.type,
        },
        'invoice'
      )
      setAttachmentUrl(stored.url)
      setAttachmentName(stored.name)
      addToast({
        title: 'Attachment Uploaded',
        message: `File "${stored.name}" ready to associate with invoice.`,
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Upload Failed',
        message: 'Could not upload invoice attachment.',
        type: 'danger',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoiceNumber.trim()) {
      addToast({
        title: 'Validation Error',
        message: 'Supplier invoice number is required.',
        type: 'danger',
      })
      return
    }

    setIsSubmitting(true)
    try {
      procurementService.recordSupplierInvoice({
        poId: purchaseOrder.id,
        supplierInvoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        amount: Number(amount) || purchaseOrder.total,
        tax: Number(tax) || purchaseOrder.tax,
        attachmentUrl: attachmentUrl || undefined,
        attachmentName: attachmentName || undefined,
        notes: notes.trim() || undefined,
        recordedBy: 'Ayaan (Owner)',
      })

      addToast({
        title: 'Invoice Recorded',
        message: `Supplier Invoice #${invoiceNumber} attached to PO #${purchaseOrder.poNumber}.`,
        type: 'success',
      })

      onSaved()
      onClose()
    } catch (err: any) {
      addToast({
        title: 'Recording Failed',
        message: err.message || 'Failed to record supplier invoice.',
        type: 'danger',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Supplier Invoice"
      description={`Link the official tax invoice received from ${purchaseOrder.supplierName}.`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info Banner */}
        <div className="p-3 bg-surface-subtle border border-border rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-text-muted">PO Reference:</span>{' '}
            <strong className="text-text-primary">{purchaseOrder.poNumber}</strong>
          </div>
          <div>
            <span className="text-text-muted">PO Total:</span>{' '}
            <strong className="text-primary tabular-nums">{formatCurrency(purchaseOrder.total)}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Supplier Invoice Number *"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
            placeholder="e.g. LOR-INV-9901"
            required
          />
          <Input
            label="Invoice Date *"
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Total Invoiced Amount (₹) *"
            type="number"
            step="0.5"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />
          <Input
            label="Included Tax / GST (₹)"
            type="number"
            step="0.5"
            value={tax}
            onChange={(e) => setTax(Number(e.target.value))}
          />
        </div>

        {/* Attachment Upload */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Supplier Bill / Tax Invoice Attachment
          </label>
          <div className="p-3 border border-dashed border-border rounded-xl bg-surface-subtle flex flex-col items-center justify-center text-center gap-2">
            {attachmentName ? (
              <div className="flex items-center gap-2 text-xs text-success font-semibold">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>{attachmentName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentName('')
                    setAttachmentUrl('')
                  }}
                  className="text-text-muted hover:text-danger ml-2 text-[11px] underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <FileText className="h-6 w-6 text-text-muted" aria-hidden="true" />
                <div className="text-xs text-text-secondary">
                  Upload PDF, PNG, or scanned invoice bill
                </div>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-text-primary hover:bg-surface-subtle transition-colors">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Choose Document</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="sr-only"
                    disabled={isUploading}
                  />
                </label>
              </>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="inv-notes" className="block text-xs font-semibold text-text-primary mb-1">
            Accounting Notes (Optional)
          </label>
          <input
            id="inv-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Verified with delivery challan, matches purchase order prices."
            className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Record & Verify Invoice
          </Button>
        </div>
      </form>
    </Modal>
  )
}
