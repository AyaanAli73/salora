import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  StorageReference,
  UploadMetadata,
} from 'firebase/storage'
import { storage } from '../firebase'

/**
 * Re-export initialized Cloud Storage instance
 */
export { storage }

/**
 * Upload a file/blob to the given storage path and return its public download URL
 */
export const uploadFile = async (
  path: string,
  file: Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata
): Promise<string> => {
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file, metadata)
  return await getDownloadURL(fileRef)
}

/**
 * Delete a file from Cloud Storage by path
 */
export const deleteFile = async (path: string): Promise<void> => {
  const fileRef = ref(storage, path)
  await deleteObject(fileRef)
}

export { ref, uploadBytes, getDownloadURL, deleteObject }
export type { StorageReference, UploadMetadata }
