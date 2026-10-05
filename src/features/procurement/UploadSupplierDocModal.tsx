import React, { useState } from 'react'
import { Upload, FileText, CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SupplierDocument } from '@/types'
import { useToastStore } from '@/store/useToastStore'
import { procurementService } from '@/services/procurementService'
import { storageService } from '@/services/storageService'

interface UploadSupplierDocModalProps {
  isOpen: boolean
  onClose: () => void
  supplierId: string
  supplierName: string
  onUploaded: () => void
}

export const UploadSupplierDocModal: React.FC<UploadSupplierDocModalProps> = ({
  isOpen,
  onClose,
  supplierId,
  supplierName,
  onUploaded,
}) => {
  const { addToast } = useToastStore()

  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState<SupplierDocument['type']>('INVOICE')
  const [fileUrl, setFileUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        docType.toLowerCase() as any
      )
      setFileUrl(stored.url)
      setFileName(stored.name)
      setFileSize(stored.sizeFormatted)
      if (!title.trim()) {
        setTitle(stored.name.replace(/\.[^/.]+$/, ''))
      }
    } catch {
      addToast({
        title: 'Upload Error',
        message: 'Could not upload supplier document.',
        type: 'danger',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      addToast({ title: 'Validation Error', message: 'Document title is required.', type: 'danger' })
      return
    }

    setIsSubmitting(true)
    try {
      procurementService.addSupplierDocument(supplierId, {
        supplierId,
        title: title.trim(),
        type: docType,
        fileUrl: fileUrl || storageService.generateSampleDocUrl(docType, title),
        fileName: fileName || `${title.replace(/\s+/g, '_')}.pdf`,
        fileSize: fileSize || '245 KB',
        uploadedBy: 'Ayaan (Owner)',
      })

      addToast({
        title: 'Document Saved',
        message: `Attached "${title}" to ${supplierName}.`,
        type: 'success',
      })

      onUploaded()
      onClose()
    } catch (err: any) {
      addToast({ title: 'Error', message: err.message || 'Failed to save document.', type: 'danger' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Supplier Document"
      description={`Store invoices, quotations, price lists, or contracts for ${supplierName}.`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="doc-title" className="block text-xs font-semibold text-text-primary mb-1">
            Document Title *
          </label>
          <Input
            id="doc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Annual Rate Contract 2026-27 or Quotation Q-412"
            required
          />
        </div>

        <div>
          <label htmlFor="doc-type" className="block text-xs font-semibold text-text-primary mb-1">
            Document Category *
          </label>
          <select
            id="doc-type"
            value={docType}
            onChange={(e) => setDocType(e.target.value as SupplierDocument['type'])}
            className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="INVOICE">Purchase Invoice</option>
            <option value="QUOTATION">Price Quotation / Rate Card</option>
            <option value="RECEIPT">Payment Receipt</option>
            <option value="CONTRACT">Authorized Distributor Contract</option>
            <option value="OTHER">Other Compliance Document</option>
          </select>
        </div>

        {/* Upload Box */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Select File (PDF, DOCX, PNG, JPG)
          </label>
          <div className="p-4 border border-dashed border-border rounded-xl bg-surface-subtle flex flex-col items-center justify-center text-center gap-2">
            {fileName ? (
              <div className="flex items-center gap-2 text-xs text-success font-semibold">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>
                  {fileName} ({fileSize})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFileName('')
                    setFileUrl('')
                    setFileSize('')
                  }}
                  className="text-text-muted hover:text-danger ml-2 text-[11px] underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <FileText className="h-6 w-6 text-text-muted" aria-hidden="true" />
                <div className="text-xs text-text-secondary">
                  Drag and drop file here or browse from computer
                </div>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-text-primary hover:bg-surface-subtle transition-colors">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Browse Document</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={handleFileSelect}
                    className="sr-only"
                    disabled={isUploading}
                  />
                </label>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Document
          </Button>
        </div>
      </form>
    </Modal>
  )
}
