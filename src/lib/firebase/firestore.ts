import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  DocumentData,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Re-export initialized Cloud Firestore instance
 */
export { db }

/**
 * Get typed document reference
 */
export const getDocRef = <T = DocumentData>(collectionPath: string, docId: string): DocumentReference<T> => {
  return doc(db, collectionPath, docId) as DocumentReference<T>
}

/**
 * Get typed collection reference
 */
export const getColRef = <T = DocumentData>(collectionPath: string): CollectionReference<T> => {
  return collection(db, collectionPath) as CollectionReference<T>
}

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp,
}

export type { DocumentData, CollectionReference, DocumentReference }
