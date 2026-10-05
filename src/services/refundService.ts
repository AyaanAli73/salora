import { Refund, Bill, BillPaymentMethod } from '@/types'
import { billingService } from './billingService'
import { cashRegisterService } from './cashRegisterService'
import { auditService } from './auditService'
import { idempotencyService } from './idempotencyService'
import { useNotificationStore } from '@/store/useNotificationStore'

const REFUNDS_STORAGE_KEY = 'SALORA_refunds_history'

const INITIAL_REFUNDS: Refund[] = [
  {
    id: 'ref-001',
    invoiceId: 'bill-yesterday-1',
    invoiceNumber: 'INV-000098',
    amount: 499,
    originalAmount: 1899,
    reason: 'Customer skin sensitivity to toner product; returned unopened',
    method: 'upi',
    processedBy: 'Ayaan (Owner)',
    createdAt: new Date(Date.now() - 22 * 3600000).toISOString(),
    notes: 'Approved under 48h salon guarantee policy',
  },
]

function getStoredRefunds(): Refund[] {
  try {
    const raw = localStorage.getItem(REFUNDS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Could not read refunds history:', err)
  }
  localStorage.setItem(REFUNDS_STORAGE_KEY, JSON.stringify(INITIAL_REFUNDS))
  return INITIAL_REFUNDS
}

function saveRefunds(refunds: Refund[]): void {
  try {
    localStorage.setItem(REFUNDS_STORAGE_KEY, JSON.stringify(refunds))
  } catch (err) {
    console.warn('Could not persist refunds:', err)
  }
}

export const refundService = {
  getAll(): Refund[] {
    return getStoredRefunds()
  },

  getByInvoiceId(invoiceId: string): Refund[] {
    const list = getStoredRefunds()
    return list.filter((r) => r.invoiceId === invoiceId || r.invoiceNumber === invoiceId)
  },

  /**
   * Computes current refundable balance for an invoice
   */
  getRefundableBalance(bill: Bill): {
    alreadyRefunded: number
    refundableAmount: number
  } {
    const refunds = this.getByInvoiceId(bill.id)
    const alreadyRefunded = refunds.reduce((sum, r) => sum + r.amount, 0)
    const refundableAmount = Math.max(0, (bill.paidAmount || bill.grandTotal) - alreadyRefunded)
    return {
      alreadyRefunded: Math.round(alreadyRefunded * 100) / 100,
      refundableAmount: Math.round(refundableAmount * 100) / 100,
    }
  },

  /**
   * Processes a full or partial refund
   */
  async processRefund(params: {
    bill: Bill
    amount: number
    reason: string
    method: BillPaymentMethod
    processedBy: string
    paymentId?: string
    notes?: string
    idempotencyKey?: string
  }): Promise<{ refund: Refund; updatedBill: Bill }> {
    const { bill, amount, reason, method, processedBy, paymentId, notes, idempotencyKey } = params

    if (!reason || !reason.trim()) {
      throw new Error('A valid refund justification reason is required.')
    }

    const { alreadyRefunded, refundableAmount } = this.getRefundableBalance(bill)

    if (amount <= 0) {
      throw new Error('Refund amount must be greater than zero.')
    }

    if (amount > refundableAmount) {
      throw new Error(
        `Refund amount (₹${amount}) exceeds maximum refundable balance (₹${refundableAmount}).`
      )
    }

    const executeRefund = async (): Promise<{ refund: Refund; updatedBill: Bill }> => {
      const newRefundedTotal = Math.round((alreadyRefunded + amount) * 100) / 100
      const isFullRefund = newRefundedTotal >= (bill.paidAmount || bill.grandTotal)

      const refund: Refund = {
        id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        invoiceId: bill.id,
        invoiceNumber: bill.invoiceNumber,
        paymentId,
        amount,
        originalAmount: bill.grandTotal,
        reason: reason.trim(),
        method,
        processedBy,
        createdAt: new Date().toISOString(),
        notes,
      }

      // 1. Save to refund history
      const refunds = getStoredRefunds()
      saveRefunds([refund, ...refunds])

      // 2. Update bill payment status & refund fields
      const updatedStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED'
      const updatedBill = await billingService.updateBill(bill.id, {
        paymentStatus: updatedStatus,
        refundedAmount: newRefundedTotal,
        refunds: [refund, ...(bill.refunds || [])],
        notes: bill.notes
          ? `${bill.notes} | Refund: ₹${amount} (${reason})`
          : `Refund: ₹${amount} (${reason})`,
      })

      // 3. Sync with cash register
      cashRegisterService.recordRefundTransaction(refund)

      // 4. Immutable audit trail
      auditService.log({
        action: 'REFUND_CREATED',
        entityType: 'refund',
        entityId: refund.id,
        performedBy: processedBy,
        userRole: 'manager',
        details: `Processed ${isFullRefund ? 'Full' : 'Partial'} refund of ₹${amount} on #${bill.invoiceNumber} via ${method.toUpperCase()} for "${reason}".`,
        amount,
        metadata: {
          invoiceNumber: bill.invoiceNumber,
          newStatus: updatedStatus,
          method,
          reason,
        },
      })

      // 5. Persistent notification
      useNotificationStore.getState().addNotification({
        type: 'WARNING',
        title: 'Refund Completed',
        message: `Refund of ₹${amount} processed for #${bill.invoiceNumber} (${reason}).`,
        priority: 'medium',
        relatedId: refund.id,
        targetRole: 'owner',
        actionUrl: '/sales/history',
      })

      return { refund, updatedBill }
    }

    if (idempotencyKey) {
      const { result } = await idempotencyService.execute('REFUND_PROCESS', idempotencyKey, executeRefund)
      return result
    }

    return executeRefund()
  },
}
