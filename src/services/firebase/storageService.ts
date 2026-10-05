import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { storage, isFirebaseConfigured } from '@/lib/firebase'

/**
 * Salora Salon Cloud Storage Service
 * Handles media assets: salon logo, staff avatars, service photos, receipts, documents.
 * Files are stored in Cloud Storage and URLs are recorded in Firestore documents.
 */

export const STORAGE_FOLDERS = {
  SALON_BRANDING: 'salon/branding',
  STAFF_AVATARS: 'staff/avatars',
  CLIENT_PHOTOS: 'clients/photos',
  SERVICES: 'services/images',
  RECEIPTS: 'expenses/receipts',
  SUPPLIER_INVOICES: 'suppliers/invoices',
  DOCUMENTS: 'documents',
} as const

export const storageService = {
  /**
   * Upload file and return public download URL
   */
  async uploadFile(
    folder: string,
    file: File | Blob,
    customFileName?: string
  ): Promise<string> {
    if (!isFirebaseConfigured) {
      console.warn('[Storage] Firebase not configured; creating temporary object URL.')
      return URL.createObjectURL(file)
    }

    try {
      const fileName = customFileName || `${Date.now()}_${(file as File).name || 'asset'}`
      const fileRef = ref(storage, `${folder}/${fileName}`)
      const snapshot = await uploadBytes(fileRef, file)
      const downloadUrl = await getDownloadURL(snapshot.ref)
      return downloadUrl
    } catch (err: any) {
      console.error('[Storage:uploadFile] Error uploading file:', err)
      throw new Error(err.message || 'Failed to upload file to salon storage.')
    }
  },

  /**
   * Upload file with progress callbacks
   */
  uploadWithProgress(
    folder: string,
    file: File,
    onProgress: (percent: number) => void
  ): Promise<string> {
    if (!isFirebaseConfigured) {
      onProgress(100)
      return Promise.resolve(URL.createObjectURL(file))
    }

    return new Promise((resolve, reject) => {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const fileRef = ref(storage, `${folder}/${fileName}`)
      const uploadTask = uploadBytesResumable(fileRef, file)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          onProgress(Math.round(progress))
        },
        (error) => {
          console.error('[Storage:uploadWithProgress] Upload error:', error)
          reject(new Error('Failed to upload file: ' + error.message))
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
            resolve(downloadUrl)
          } catch (urlErr) {
            reject(urlErr)
          }
        }
      )
    })
  },

  /**
   * Delete file from storage path
   */
  async deleteFile(filePath: string): Promise<void> {
    if (!isFirebaseConfigured) return
    try {
      const fileRef = ref(storage, filePath)
      await deleteObject(fileRef)
    } catch (err: any) {
      // Ignore if file doesn't exist
      if (err.code !== 'storage/object-not-found') {
        console.error('[Storage:deleteFile] Error deleting file:', err)
        throw new Error('Failed to delete file from salon storage.')
      }
    }
  },
}
