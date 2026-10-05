/**
 * Storage Abstraction Service for Supplier & Procurement Documents
 * Supports: Invoices, Quotations, Goods Receipts, Contracts, and Purchase Attachments.
 */

export interface StoredFile {
  id: string
  name: string
  sizeBytes: number
  sizeFormatted: string
  mimeType: string
  url: string
  uploadedAt: string
  category: 'invoice' | 'quotation' | 'receipt' | 'contract' | 'other'
}

const STORAGE_KEY = 'SALORA_procurement_storage_files'

export const storageService = {
  getStoredFiles(): StoredFile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch (err) {
      console.warn('Failed to parse stored procurement files:', err)
    }
    return []
  },

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  },

  /**
   * Uploads and stores a document reference in the local storage abstraction.
   */
  async uploadFile(
    file: { name: string; size: number; type?: string; dataUrl?: string },
    category: StoredFile['category'] = 'invoice'
  ): Promise<StoredFile> {
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    
    // Fallback dataUrl if not provided
    const url = file.dataUrl || `https://salora-salon-assets.local/docs/${id}/${encodeURIComponent(file.name)}`

    const storedFile: StoredFile = {
      id,
      name: file.name,
      sizeBytes: file.size,
      sizeFormatted: this.formatBytes(file.size),
      mimeType: file.type || 'application/pdf',
      url,
      uploadedAt: new Date().toISOString(),
      category,
    }

    const current = this.getStoredFiles()
    const updated = [storedFile, ...current]
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 100)))
    } catch (err) {
      console.warn('Could not persist stored file metadata:', err)
    }

    return storedFile
  },

  /**
   * Simulates generation of a printable/downloadable PDF blob for a purchase order or receipt.
   */
  generateSampleDocUrl(docType: string, refNumber: string): string {
    return `data:text/plain;charset=utf-8,${encodeURIComponent(
      `SALORA SALON MANAGEMENT SYSTEM\n================================\nDOCUMENT TYPE: ${docType.toUpperCase()}\nREF: ${refNumber}\nDATE: ${new Date().toLocaleDateString('en-IN')}\nSTATUS: VERIFIED`
    )}`
  },
}
