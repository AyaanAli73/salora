import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  writeBatch,
  serverTimestamp,
  QueryConstraint,
  DocumentData,
  FirestoreError,
  Timestamp,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '@/lib/firebase'

/**
 * Salora Salon Database Collection Registry
 * Single-salon, single-location architecture.
 * No tenant IDs, branch IDs, or organization IDs.
 */
export const SALORA_COLLECTIONS = {
  SALON: 'salon',
  OWNER: 'owner',
  USERS: 'users',
  CLIENTS: 'clients',
  APPOINTMENTS: 'appointments',
  TOKENS: 'tokens',
  SERVICES: 'services',
  STAFF: 'staff',
  BILLS: 'bills',
  PAYMENTS: 'payments',
  INVOICES: 'invoices',
  PRODUCTS: 'products',
  INVENTORY_MOVEMENTS: 'inventoryMovements',
  SUPPLIERS: 'suppliers',
  PURCHASES: 'purchases',
  EXPENSES: 'expenses',
  ATTENDANCE: 'attendance',
  LEAVE_REQUESTS: 'leaveRequests',
  PAYROLL: 'payroll',
  MEMBERSHIPS: 'memberships',
  PACKAGES: 'packages',
  REWARDS: 'rewards',
  LOYALTY_TRANSACTIONS: 'loyaltyTransactions',
  REVIEWS: 'reviews',
  CAMPAIGNS: 'campaigns',
  NOTIFICATIONS: 'notifications',
  COMMUNICATION_LOGS: 'communicationLogs',
  AUTOMATIONS: 'automations',
  AUTOMATION_EXECUTIONS: 'automationExecutions',
  AUDIT_LOGS: 'auditLogs',
  BUSINESS_DAYS: 'businessDays',
  SETTINGS: 'settings',
  COUNTERS: 'counters',
} as const

export type SaloraCollectionName = typeof SALORA_COLLECTIONS[keyof typeof SALORA_COLLECTIONS]

/**
 * Converts Firestore Timestamps in document data to ISO date strings for frontend consistency
 */
export const formatFirestoreData = <T = any>(docId: string, rawData: DocumentData): T => {
  const result: any = { id: docId, ...rawData }
  for (const key of Object.keys(result)) {
    const val = result[key]
    if (val instanceof Timestamp) {
      result[key] = val.toDate().toISOString()
    } else if (val && typeof val === 'object' && val.seconds !== undefined && val.nanoseconds !== undefined) {
      result[key] = new Date(val.seconds * 1000).toISOString()
    }
  }
  return result as T
}

/**
 * Format user-friendly error messages from Firestore errors
 */
export const translateFirestoreError = (err: unknown): string => {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as FirestoreError).code
    switch (code) {
      case 'permission-denied':
        return "You don't have permission to perform this action."
      case 'unavailable':
        return 'Connection problem. Please check your network connection.'
      case 'not-found':
        return 'Requested record was not found in salon database.'
      case 'already-exists':
        return 'A record with this identifier already exists.'
      case 'cancelled':
        return 'Operation was cancelled. Please try again.'
      case 'deadline-exceeded':
        return 'Server took too long to respond. Please try again.'
      default:
        break
    }
  }
  return err instanceof Error ? err.message : 'An unexpected database error occurred.'
}

/**
/**
 * Sentinel check for Firestore FieldValue (e.g. serverTimestamp, deleteField, arrayUnion),
 * Timestamp, and Date objects so they are never converted to plain empty objects.
 */
export const isFirestoreSentinel = (val: any): boolean => {
  if (!val || typeof val !== 'object') return false
  if (val instanceof Timestamp) return true
  if (val instanceof Date) return true
  if (
    val._methodName ||
    (val.constructor && val.constructor.name && val.constructor.name.includes('FieldValue'))
  ) {
    return true
  }
  return false
}

/**
 * Recursively strips undefined fields so Firestore addDoc/setDoc/updateDoc/transaction.set never reject payloads
 */
export const sanitizeForFirestore = <T = any>(obj: T): T => {
  if (obj === null || obj === undefined) return null as unknown as T
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore) as unknown as T
  }
  if (typeof obj === 'object') {
    if (isFirestoreSentinel(obj)) return obj
    const clean: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value)
      }
    }
    return clean as T
  }
  return obj
}

export const firestoreService = {
  /**
   * Fetch single document by ID
   */
  async get<T = any>(collectionName: SaloraCollectionName | string, docId: string): Promise<T | null> {
    if (!isFirebaseConfigured) return null
    try {
      const docRef = doc(db, collectionName, docId)
      const snap = await getDoc(docRef)
      if (!snap.exists()) return null
      return formatFirestoreData<T>(snap.id, snap.data())
    } catch (err) {
      console.error(`[Firestore:get] ${collectionName}/${docId}:`, err)
      throw new Error(translateFirestoreError(err))
    }
  },

  /**
   * Set document with specific ID (creates or completely replaces / merges)
   */
  async set<T extends DocumentData = DocumentData>(
    collectionName: SaloraCollectionName | string,
    docId: string,
    data: T,
    mergeOrOptions: boolean | { merge?: boolean } = true
  ): Promise<void> {
    if (!isFirebaseConfigured) return
    const merge = typeof mergeOrOptions === 'boolean' ? mergeOrOptions : Boolean(mergeOrOptions?.merge ?? true)
    try {
      const docRef = doc(db, collectionName, docId)
      const cleaned = sanitizeForFirestore(data)
      const payload = {
        ...cleaned,
        updatedAt: serverTimestamp(),
        ...(!merge ? { createdAt: serverTimestamp() } : {}),
      }
      await setDoc(docRef, payload, { merge })
    } catch (err) {
      console.error(`[Firestore:set] ${collectionName}/${docId}:`, err)
      throw new Error(translateFirestoreError(err))
    }
  },

  /**
   * Add document with auto-generated ID
   */
  async add<T extends DocumentData = DocumentData>(
    collectionName: SaloraCollectionName | string,
    data: T
  ): Promise<string> {
    if (!isFirebaseConfigured) return `offline_${Date.now()}`
    try {
      const colRef = collection(db, collectionName)
      const cleaned = sanitizeForFirestore(data)
      const payload = {
        ...cleaned,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      const ref = await addDoc(colRef, payload)
      return ref.id
    } catch (err) {
      console.error(`[Firestore:add] ${collectionName}:`, err)
      throw new Error(translateFirestoreError(err))
    }
  },

  /**
   * Update existing document fields
   */
  async update<T = any>(
    collectionName: SaloraCollectionName | string,
    docId: string,
    data: Partial<T> | Record<string, any>
  ): Promise<void> {
    if (!isFirebaseConfigured) return
    try {
      const docRef = doc(db, collectionName, docId)
      const cleaned = sanitizeForFirestore(data)
      const payload = {
        ...cleaned,
        updatedAt: serverTimestamp(),
      }
      await updateDoc(docRef, payload)
    } catch (err) {
      console.error(`[Firestore:update] ${collectionName}/${docId}:`, err)
      throw new Error(translateFirestoreError(err))
    }
  },

  /**
   * Delete document by ID (Prefer archive flag for business entities where requested)
   */
  async delete(collectionName: SaloraCollectionName | string, docId: string): Promise<void> {
    if (!isFirebaseConfigured) return
    try {
      const docRef = doc(db, collectionName, docId)
      await deleteDoc(docRef)
    } catch (err) {
      console.error(`[Firestore:delete] ${collectionName}/${docId}:`, err)
      throw new Error(translateFirestoreError(err))
    }
  },

  /**
   * Query documents with custom Firestore constraints
   */
  async query<T = any>(
    collectionName: SaloraCollectionName | string,
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    if (!isFirebaseConfigured) return []
    try {
      const colRef = collection(db, collectionName)
      const q = query(colRef, ...constraints)
      const snap = await getDocs(q)
      return snap.docs.map((d) => formatFirestoreData<T>(d.id, d.data()))
    } catch (err) {
      console.error(`[Firestore:query] ${collectionName}:`, err)
      throw new Error(translateFirestoreError(err))
    }
  },

  /**
   * Get all documents in a collection
   */
  async getAll<T = any>(collectionName: SaloraCollectionName | string): Promise<T[]> {
    return this.query<T>(collectionName, [])
  },

  /**
   * Realtime collection listener
   * Returns unsubscribe function
   */
  onSnapshotCollection<T = any>(
    collectionName: SaloraCollectionName | string,
    constraints: QueryConstraint[] = [],
    onNext: (items: T[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    if (!isFirebaseConfigured) {
      return () => {}
    }
    try {
      const colRef = collection(db, collectionName)
      const q = query(colRef, ...constraints)
      return onSnapshot(
        q,
        (snap) => {
          const items = snap.docs.map((d) => formatFirestoreData<T>(d.id, d.data()))
          onNext(items)
        },
        (error) => {
          console.error(`[Firestore:onSnapshot] ${collectionName}:`, error)
          if (onError) onError(new Error(translateFirestoreError(error)))
        }
      )
    } catch (err) {
      console.error(`[Firestore:onSnapshot:init] ${collectionName}:`, err)
      return () => {}
    }
  },

  /**
   * Realtime single document listener
   * Returns unsubscribe function
   */
  onSnapshotDoc<T = any>(
    collectionName: SaloraCollectionName | string,
    docId: string,
    onNext: (data: T | null) => void,
    onError?: (err: Error) => void
  ): () => void {
    if (!isFirebaseConfigured) {
      return () => {}
    }
    try {
      const docRef = doc(db, collectionName, docId)
      return onSnapshot(
        docRef,
        (snap) => {
          if (!snap.exists()) {
            onNext(null)
          } else {
            onNext(formatFirestoreData<T>(snap.id, snap.data()))
          }
        },
        (error) => {
          console.error(`[Firestore:onSnapshotDoc] ${collectionName}/${docId}:`, error)
          if (onError) onError(new Error(translateFirestoreError(error)))
        }
      )
    } catch (err) {
      console.error(`[Firestore:onSnapshotDoc:init] ${collectionName}/${docId}:`, err)
      return () => {}
    }
  },

  /**
   * Executes atomic transaction for financial and counter operations with automatic sanitization
   */
  async runTransaction<T>(updateFunction: (transaction: any) => Promise<T>): Promise<T> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured for atomic transactions.')
    }
    return runTransaction(db, async (txn) => {
      const safeTxn = {
        get: (docRef: any) => txn.get(docRef),
        set: (docRef: any, data: any, options?: any) => {
          const clean = sanitizeForFirestore(data)
          return options ? txn.set(docRef, clean, options) : txn.set(docRef, clean)
        },
        update: (docRef: any, dataOrField: any, ...more: any[]) => {
          const clean = sanitizeForFirestore(dataOrField)
          return (txn as any).update(docRef, clean, ...more)
        },
        delete: (docRef: any) => txn.delete(docRef),
      }
      return updateFunction(safeTxn)
    })
  },

  /**
   * Batch writer for multi-document operations with automatic sanitization
   */
  batch() {
    const rawBatch = writeBatch(db)
    return {
      set: (docRef: any, data: any, options?: any) => {
        const clean = sanitizeForFirestore(data)
        return options ? rawBatch.set(docRef, clean, options) : rawBatch.set(docRef, clean)
      },
      update: (docRef: any, dataOrField: any, ...more: any[]) => {
        const clean = sanitizeForFirestore(dataOrField)
        return (rawBatch as any).update(docRef, clean, ...more)
      },
      delete: (docRef: any) => rawBatch.delete(docRef),
      commit: () => rawBatch.commit(),
    }
  },
}
