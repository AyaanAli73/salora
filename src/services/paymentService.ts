import { Payment, BillPaymentMethod, PaymentStatus, Bill } from '@/types'
import { cashRegisterService } from './cashRegisterService'
import { auditService } from './auditService'

const PAYMENTS_STORAGE_KEY = 'SALORA_payments_history'

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-101',
    billId: 'bill-today-1',
    invoiceNumber: 'INV-000101',
    clientId: 'c1',
    clientName: 'Priya Sharma',
    method: 'upi',
    amount: 1475,
    reference: 'UPI-9820194812@icici',
    upiId: 'priyasharma@okaxis',
    status: 'COMPLETED',
    paidAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    recordedBy: 'Camille Dupré',
    notes: 'Direct QR scan at reception terminal',
  },
  {
    id: 'pay-102',
    billId: 'bill-today-2',
    invoiceNumber: 'INV-000102',
    clientId: 'c2',
    clientName: 'Aarav Patel',
    method: 'card',
    amount: 1500,
    reference: 'AUTH-689104',
    cardLast4: '4242',
    cardType: 'Visa Infinite',
    status: 'COMPLETED',
    paidAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    recordedBy: 'Rahul Mehta',
    notes: 'HDFC POS swipe terminal',
  },
  {
    id: 'pay-103',
    billId: 'bill-today-3',
    invoiceNumber: 'INV-000103',
    clientId: 'c3',
    clientName: 'Ananya Deshmukh',
    method: 'cash',
    amount: 650,
    reference: 'CASH-REC-103',
    status: 'COMPLETED',
    paidAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
    recordedBy: 'Ayaan',
    notes: 'Paid ₹1,000 cash; returned ₹350 change',
  },
  {
    id: 'pay-104',
    billId: 'bill-today-4',
    invoiceNumber: 'INV-000104',
    clientId: 'c4',
    clientName: 'Rohan Verma',
    method: 'split',
    amount: 2500,
    reference: 'SPLIT-CASH-UPI',
    status: 'COMPLETED',
    paidAt: new Date(Date.now() - 30 * 60000).toISOString(),
    recordedBy: 'Camille Dupré',
    notes: 'Cash ₹1,500 + UPI ₹1,000',
  },
]

function getStoredPayments(): Payment[] {
  try {
    const raw = localStorage.getItem(PAYMENTS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Could not read payments history:', err)
  }
  localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(INITIAL_PAYMENTS))
  return INITIAL_PAYMENTS
}

function savePayments(payments: Payment[]): void {
  try {
    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments))
  } catch (err) {
    console.warn('Could not persist payments:', err)
  }
}

export const paymentService = {
  getAll(): Payment[] {
    return getStoredPayments()
  },

  getById(id: string): Payment | null {
    const list = getStoredPayments()
    return list.find((p) => p.id === id) || null
  },

  getByBillId(billId: string): Payment[] {
    const list = getStoredPayments()
    return list.filter((p) => p.billId === billId)
  },

  /**
   * Records a payment transaction with cash drawer and audit trail integration
   */
  recordPayment(paymentData: Omit<Payment, 'id' | 'paidAt'>): Payment {
    const payments = getStoredPayments()
    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      paidAt: new Date().toISOString(),
    }

    const updated = [newPayment, ...payments]
    savePayments(updated)

    // Sync with live cash register
    if (newPayment.status === 'COMPLETED') {
      cashRegisterService.recordSaleTransaction(newPayment)
    }

    // Immutable audit record
    auditService.log({
      action: 'PAYMENT_CREATED',
      entityType: 'payment',
      entityId: newPayment.id,
      performedBy: newPayment.recordedBy || 'Salon Receptionist',
      userRole: 'receptionist',
      details: `Collected ${newPayment.method.toUpperCase()} payment of ₹${newPayment.amount} for Invoice #${newPayment.invoiceNumber}.`,
      amount: newPayment.amount,
      metadata: {
        method: newPayment.method,
        invoiceNumber: newPayment.invoiceNumber,
        reference: newPayment.reference,
      },
    })

    return newPayment
  },

  /**
   * Validates split tender payments: sum cannot exceed total
   */
  validateSplitPayments(
    entries: { method: BillPaymentMethod; amount: number }[],
    grandTotal: number
  ): { isValid: boolean; allocatedTotal: number; remainingDue: number; error?: string } {
    const allocatedTotal = entries.reduce((sum, e) => sum + (e.amount || 0), 0)
    const roundedAllocated = Math.round(allocatedTotal * 100) / 100
    const roundedTotal = Math.round(grandTotal * 100) / 100

    if (roundedAllocated > roundedTotal) {
      return {
        isValid: false,
        allocatedTotal: roundedAllocated,
        remainingDue: 0,
        error: `Sum of split payments (₹${roundedAllocated}) cannot exceed grand total (₹${roundedTotal}).`,
      }
    }

    const remainingDue = Math.max(0, Math.round((roundedTotal - roundedAllocated) * 100) / 100)
    return {
      isValid: true,
      allocatedTotal: roundedAllocated,
      remainingDue,
    }
  },

  /**
   * Calculates cash return change
   */
  calculateChange(dueAmount: number, cashReceived: number): { change: number; isSufficient: boolean } {
    const diff = cashReceived - dueAmount
    return {
      change: Math.max(0, Math.round(diff * 100) / 100),
      isSufficient: cashReceived >= dueAmount,
    }
  },
}
