import { ExpenseReceiptAttachment } from '@/types'

export interface IReceiptStorageProvider {
  name: string
  upload(file: File): Promise<ExpenseReceiptAttachment>
  getDownloadUrl(attachment: ExpenseReceiptAttachment): Promise<string>
  delete(attachmentId: string): Promise<boolean>
}

/**
 * Local Frontend Base64 & Blob Storage Provider
 * Reads user-selected files into memory / local URLs for instant client-side preview.
 */
export class LocalBase64ReceiptStorageProvider implements IReceiptStorageProvider {
  name = 'local_base64'

  async upload(file: File): Promise<ExpenseReceiptAttachment> {
    // Validate size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      throw new Error('File exceeds maximum size of 10MB')
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const attachment: ExpenseReceiptAttachment = {
          id: `rcpt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          url: result,
          uploadedAt: new Date().toISOString(),
          storageProvider: 'local_base64',
        }
        resolve(attachment)
      }
      reader.onerror = (err) => reject(new Error('Failed to read file: ' + err))
      reader.readAsDataURL(file)
    })
  }

  async getDownloadUrl(attachment: ExpenseReceiptAttachment): Promise<string> {
    return attachment.url
  }

  async delete(_attachmentId: string): Promise<boolean> {
    // Local memory cleanup is handled automatically
    return true
  }
}

/**
 * Cloud Storage Adapter Stubs for Future Backend Integration
 * (AWS S3, Google Cloud Storage, or Azure Blob)
 */
export class CloudReceiptStorageProvider implements IReceiptStorageProvider {
  name: 's3' | 'gcs' | 'azure'
  private bucketEndpoint: string

  constructor(providerName: 's3' | 'gcs' | 'azure' = 's3', endpoint = 'https://storage.salora-salon.com') {
    this.name = providerName
    this.bucketEndpoint = endpoint
  }

  async upload(file: File): Promise<ExpenseReceiptAttachment> {
    // In production, would fetch a pre-signed S3/GCS PUT URL or upload via multipart API
    const fileExt = file.name.split('.').pop() || 'dat'
    const key = `receipts/${new Date().getFullYear()}/${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${fileExt}`
    
    return {
      id: `rcpt-cloud-${Date.now()}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      url: `${this.bucketEndpoint}/${key}`,
      uploadedAt: new Date().toISOString(),
      storageProvider: this.name,
    }
  }

  async getDownloadUrl(attachment: ExpenseReceiptAttachment): Promise<string> {
    return attachment.url
  }

  async delete(_attachmentId: string): Promise<boolean> {
    return true
  }
}

// Active storage instance singleton
class ReceiptStorageService {
  private activeProvider: IReceiptStorageProvider = new LocalBase64ReceiptStorageProvider()

  setProvider(provider: IReceiptStorageProvider) {
    this.activeProvider = provider
  }

  getProvider(): IReceiptStorageProvider {
    return this.activeProvider
  }

  async uploadReceipt(file: File): Promise<ExpenseReceiptAttachment> {
    return this.activeProvider.upload(file)
  }

  async getReceiptUrl(attachment: ExpenseReceiptAttachment): Promise<string> {
    return this.activeProvider.getDownloadUrl(attachment)
  }

  async deleteReceipt(attachmentId: string): Promise<boolean> {
    return this.activeProvider.delete(attachmentId)
  }
}

export const receiptStorage = new ReceiptStorageService()
