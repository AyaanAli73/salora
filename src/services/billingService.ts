import { Bill, SalesSummaryStats, BillItem } from '@/types'
import { formatInvoiceNumber } from '@/utils/billingUtils'
import { inventoryService } from './inventoryService'
import { appointmentService } from './appointmentService'
import { clientService } from './clientService'
import { auditLogService } from './auditLogService'
import { firestoreService, SALORA_COLLECTIONS, sanitizeForFirestore } from '@/services/firebase/firestoreService'
import { isFirebaseConfigured, db } from '@/lib/firebase'
import { doc, runTransaction, serverTimestamp, where, orderBy } from 'firebase/firestore'

const BILLS_STORAGE_KEY = 'SALORA_bills'

function getStoredBills(): Bill[] {
  try {
    const raw = localStorage.getItem(BILLS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (err) {
    console.warn('Could not read bills from localStorage:', err)
  }
  return []
}

function saveStoredBills(bills: Bill[]): void {
  try {
    localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(bills))
  } catch (err) {
    console.warn('Could not persist bills to localStorage:', err)
  }
}

let billsMemoryCache: Bill[] = getStoredBills()

export const billingService = {
  getAllSync(): Bill[] {
    if (billsMemoryCache.length === 0) {
      billsMemoryCache = getStoredBills()
    }
    return billsMemoryCache
  },

  getAllBills(_branchFilter?: string): Bill[] {
    return this.getAllSync()
  },

  getTodaySalesSummary(): SalesSummaryStats {
    const bills = this.getAllBills()
    const todayStr = new Date().toISOString().split('T')[0]
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    
    const todayBills = bills.filter((b) => b.createdAt.startsWith(todayStr))
    const yesterdayBills = bills.filter((b) => b.createdAt.startsWith(yesterdayDate))

    const todayRevenue = todayBills
      .filter((b) => b.paymentStatus !== 'REFUNDED')
      .reduce((sum, b) => sum + (b.paidAmount || 0), 0)

    const yesterdayRevenue = yesterdayBills
      .filter((b) => b.paymentStatus !== 'REFUNDED')
      .reduce((sum, b) => sum + (b.paidAmount || 0), 0)

    const todayRevenueChange = yesterdayRevenue > 0
      ? Number((((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1))
      : 0

    const paidAmount = todayBills
      .filter((b) => b.paymentStatus === 'PAID' || b.paymentStatus === 'PARTIAL')
      .reduce((sum, b) => sum + (b.paidAmount || 0), 0)
    const dueAmount = todayBills
      .filter((b) => b.dueAmount > 0 && b.paymentStatus !== 'REFUNDED')
      .reduce((sum, b) => sum + b.dueAmount, 0)
    const refundAmount = todayBills
      .filter((b) => b.paymentStatus === 'REFUNDED')
      .reduce((sum, b) => sum + (b.grandTotal || 0), 0)

    return {
      todayRevenue,
      todayRevenueChange,
      todayBillsCount: todayBills.length,
      paidAmount,
      dueAmount,
      refundAmount,
      heldBillsCount: 0,
    }
  },

  async getSalesStats(): Promise<SalesSummaryStats> {
    return this.getTodaySalesSummary()
  },

  async getAll(): Promise<Bill[]> {
    if (billsMemoryCache.length === 0) {
      billsMemoryCache = getStoredBills()
    }
    if (!isFirebaseConfigured) {
      return billsMemoryCache
    }

    try {
      const records = await firestoreService.getAll<Bill>(SALORA_COLLECTIONS.BILLS)
      if (records && records.length > 0) {
        const remoteMap = new Map(records.map((r) => [r.id, r]))
        const merged = [...records]
        for (const localBill of billsMemoryCache) {
          if (!remoteMap.has(localBill.id)) {
            merged.push(localBill)
            firestoreService.set(SALORA_COLLECTIONS.BILLS, localBill.id, localBill).catch(() => {})
          }
        }
        billsMemoryCache = merged
        saveStoredBills(billsMemoryCache)
      } else if (billsMemoryCache.length > 0) {
        for (const localBill of billsMemoryCache) {
          firestoreService.set(SALORA_COLLECTIONS.BILLS, localBill.id, localBill).catch(() => {})
        }
      }
      return billsMemoryCache
    } catch {
      return billsMemoryCache
    }
  },

  async getById(id: string): Promise<Bill | null> {
    const mem = billsMemoryCache.find((b) => b.id === id || b.invoiceNumber === id)
    if (mem) return mem

    if (!isFirebaseConfigured) return null

    try {
      return await firestoreService.get<Bill>(SALORA_COLLECTIONS.BILLS, id)
    } catch {
      return null
    }
  },

  async getByClientId(clientId: string): Promise<Bill[]> {
    const all = await this.getAll()
    return all.filter((b) => b.clientId === clientId)
  },

  async getByAppointmentId(appointmentId: string): Promise<Bill | null> {
    const all = await this.getAll()
    return all.find((b) => b.appointmentId === appointmentId) || null
  },

  /**
   * Realtime bills listener
   */
  subscribeToTodayBills(onUpdate: (bills: Bill[]) => void): () => void {
    const today = new Date().toISOString().split('T')[0]
    if (!isFirebaseConfigured) {
      onUpdate(billsMemoryCache.filter((b) => b.createdAt.startsWith(today)))
      return () => {}
    }

    return firestoreService.onSnapshotCollection<Bill>(
      SALORA_COLLECTIONS.BILLS,
      [where('createdAt', '>=', today)],
      (list) => {
        onUpdate(list)
      }
    )
  },

  /**
   * Atomically generate next sequential invoice number and persist Bill to Firestore
   */
  async createBill(
    data: Omit<Bill, 'id' | 'invoiceNumber' | 'createdAt'>,
    idempotencyKey?: string
  ): Promise<Bill> {
    const today = new Date().toISOString().split('T')[0]
    const dateKey = today.replace(/-/g, '')
    const nowIso = new Date().toISOString()

    let nextInvoiceNumber = `INV-${dateKey}-${Math.floor(100 + Math.random() * 900)}`

    if (isFirebaseConfigured) {
      try {
        const counterRef = doc(db, SALORA_COLLECTIONS.COUNTERS, `invoice_${today.replace(/-/g, '_')}`)

        const generatedBill = await runTransaction(db, async (transaction) => {
          const counterSnap = await transaction.get(counterRef)
          let seq = 1
          if (counterSnap.exists()) {
            seq = (counterSnap.data()?.lastSeq || 0) + 1
          }

          transaction.set(
            counterRef,
            sanitizeForFirestore({ lastSeq: seq, updatedAt: serverTimestamp() }),
            { merge: true }
          )

          nextInvoiceNumber = formatInvoiceNumber(seq)
          const billRef = doc(db, SALORA_COLLECTIONS.BILLS, `bill_${Date.now()}`)

          const newBillData: Bill = {
            ...data,
            id: billRef.id,
            invoiceNumber: nextInvoiceNumber,
            createdAt: nowIso,
          }

          transaction.set(
            billRef,
            sanitizeForFirestore({
              ...newBillData,
              createdTimestamp: serverTimestamp(),
            })
          )

          return newBillData
        })

        // Deduct inventory for product items
        for (const item of data.items) {
          if (item.type === 'product' && item.productId) {
            try {
              await inventoryService.deductFromSale({
                productId: item.productId,
                quantity: item.quantity,
                invoiceNumber: generatedBill.invoiceNumber,
              })
            } catch (invErr) {
              console.warn('[billingService] Inventory deduction error:', invErr)
            }
          }
        }

        // If linked to appointment, mark payment status
        if (data.appointmentId) {
          try {
            await appointmentService.updateStatus(data.appointmentId, 'completed')
          } catch {}
        }

        // Update client spent & visit count
        if (data.clientId) {
          try {
            const client = await clientService.getById(data.clientId)
            if (client) {
              await clientService.update(data.clientId, {
                totalSpent: (client.totalSpent || 0) + data.paidAmount,
                totalVisits: (client.totalVisits || 0) + 1,
                lastVisitDate: today,
              })
            }
          } catch {}
        }

        auditLogService.log({
          action: 'BILL_CREATED',
          entityId: generatedBill.id,
          entityType: 'bill',
          details: `Generated invoice ${generatedBill.invoiceNumber} for ${data.clientName} (₹${data.grandTotal}).`,
          performedBy: 'Billing Terminal',
          userRole: 'receptionist',
        })

        billsMemoryCache = [generatedBill, ...billsMemoryCache]
        saveStoredBills(billsMemoryCache)
        return generatedBill
      } catch (err: any) {
        console.error('[billingService.createBill] Transaction failed:', err)
        throw new Error(err.message || 'Failed to generate bill.')
      }
    }

    // Demo mode fallback
    const fallbackBill: Bill = {
      ...data,
      id: `bill_${Date.now()}`,
      invoiceNumber: nextInvoiceNumber,
      createdAt: nowIso,
    }

    billsMemoryCache = [fallbackBill, ...billsMemoryCache]
    saveStoredBills(billsMemoryCache)
    return fallbackBill
  },

  async updateBill(id: string, updates: Partial<Bill>): Promise<Bill> {
    const existing = await this.getById(id)
    if (!existing) throw new Error(`Bill ${id} not found`)

    const updated: Bill = { ...existing, ...updates }

    if (isFirebaseConfigured) {
      try {
        await firestoreService.update(SALORA_COLLECTIONS.BILLS, id, updates)
      } catch (err) {
        console.error(`[billingService.updateBill] ${id}:`, err)
      }
    }

    billsMemoryCache = billsMemoryCache.map((b) => (b.id === id ? updated : b))
    saveStoredBills(billsMemoryCache)
    return updated
  },

  async deleteBill(id: string): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        await firestoreService.delete(SALORA_COLLECTIONS.BILLS, id)
      } catch (err) {
        console.error(`[billingService.deleteBill] ${id}:`, err)
      }
    }
    billsMemoryCache = billsMemoryCache.filter((b) => b.id !== id)
    saveStoredBills(billsMemoryCache)
  },

  async refundBill(id: string, reason?: string): Promise<Bill> {
    const existing = await this.getById(id)
    if (!existing) throw new Error(`Bill ${id} not found`)

    const updated: Bill = {
      ...existing,
      paymentStatus: 'REFUNDED',
      status: 'cancelled',
      notes: reason ? `${existing.notes ? existing.notes + ' | ' : ''}Refund: ${reason}` : existing.notes,
    }

    if (isFirebaseConfigured) {
      try {
        await firestoreService.update(SALORA_COLLECTIONS.BILLS, id, {
          paymentStatus: 'REFUNDED',
          status: 'cancelled',
          notes: updated.notes,
        })
      } catch (err) {
        console.error(`[billingService.refundBill] ${id}:`, err)
      }
    }

    billsMemoryCache = billsMemoryCache.map((b) => (b.id === id ? updated : b))
    saveStoredBills(billsMemoryCache)
    return updated
  },
}
