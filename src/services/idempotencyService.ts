/**
 * Central Idempotency Engine
 * Guarantees that duplicate requests with the same idempotency key
 * (e.g. due to network retries, double-clicking, reconnecting)
 * will NEVER re-execute critical financial or mutating operations.
 *
 * Supported scopes:
 * - PAYMENT_CREATE
 * - INVOICE_CREATE
 * - REFUND_PROCESS
 * - INVENTORY_DEDUCT
 * - AUTOMATION_EXEC
 * - WEBHOOK_HANDLE
 */

import { logger } from '@/utils/logger'

export type IdempotencyScope =
  | 'PAYMENT_CREATE'
  | 'INVOICE_CREATE'
  | 'REFUND_PROCESS'
  | 'INVENTORY_DEDUCT'
  | 'AUTOMATION_EXEC'
  | 'WEBHOOK_HANDLE'

export interface IdempotencyRecord<T = any> {
  key: string
  scope: IdempotencyScope
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  result?: T
  error?: string
  createdAt: string
  completedAt?: string
}

const STORAGE_KEY = 'SALORA_idempotency_records'
const TTL_HOURS = 24

class IdempotencyService {
  private records: Map<string, IdempotencyRecord> = new Map()

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const list: IdempotencyRecord[] = JSON.parse(raw)
        const now = Date.now()
        // Purge expired records past TTL
        list.forEach((rec) => {
          const ageHours = (now - new Date(rec.createdAt).getTime()) / (1000 * 60 * 60)
          if (ageHours < TTL_HOURS) {
            this.records.set(rec.key, rec)
          }
        })
      }
    } catch (err) {
      console.warn('[Idempotency] Failed loading cache:', err)
    }
  }

  private persist() {
    if (typeof window === 'undefined') return
    try {
      const array = Array.from(this.records.values())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(array.slice(-200)))
    } catch (err) {
      console.warn('[Idempotency] Failed persisting records:', err)
    }
  }

  /**
   * Generates a standard idempotency key
   */
  public generateKey(scope: IdempotencyScope, identifier: string): string {
    return `idemp_${scope}_${identifier}_${Date.now()}`
  }

  /**
   * Checks if an operation has already succeeded
   */
  public getRecord<T>(key: string): IdempotencyRecord<T> | undefined {
    return this.records.get(key)
  }

  /**
   * Executes an async operation with strict idempotency protection.
   * If the key already completed, returns the cached result without invoking fn.
   */
  public async execute<T>(
    scope: IdempotencyScope,
    key: string,
    operationFn: () => Promise<T>
  ): Promise<{ result: T; wasCached: boolean }> {
    const existing = this.records.get(key)

    if (existing) {
      if (existing.status === 'COMPLETED') {
        logger.info('idempotency', `Duplicate request suppressed for [${scope}] key: ${key}`)
        return { result: existing.result as T, wasCached: true }
      }

      if (existing.status === 'PENDING') {
        logger.warn('idempotency', `Concurrent in-flight duplicate blocked for [${scope}] key: ${key}`)
        throw new Error(`An identical transaction is already being processed for key: ${key}`)
      }
    }

    // Mark as PENDING
    const record: IdempotencyRecord<T> = {
      key,
      scope,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    }
    this.records.set(key, record)
    this.persist()

    try {
      const result = await operationFn()
      record.status = 'COMPLETED'
      record.result = result
      record.completedAt = new Date().toISOString()
      this.persist()
      return { result, wasCached: false }
    } catch (error: any) {
      record.status = 'FAILED'
      record.error = error?.message || 'Operation failed'
      this.persist()
      throw error
    }
  }

  public clearAll() {
    this.records.clear()
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }
}

export const idempotencyService = new IdempotencyService()
