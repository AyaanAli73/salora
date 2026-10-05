import { HeldBill, Bill } from '@/types'

const HELD_BILLS_STORAGE_KEY = 'SALORA_held_bills'

const initialHeldBills: HeldBill[] = [
  {
    id: 'held-1',
    clientName: 'Sunita Rao',
    itemsCount: 2,
    estimatedTotal: 2850,
    heldAt: new Date(Date.now() - 25 * 60000).toISOString(),
    note: 'Customer stepped out to fetch wallet / parking.',
    draftBill: {
      id: 'draft-held-1',
      invoiceNumber: 'DRAFT-HOLD-1',
      clientId: 'cli-010',
      clientName: 'Sunita Rao',
      clientPhone: '(310) 555-0922',
      staffId: 'staff-2',
      staffName: 'Ananya Roy',
      items: [
        {
          id: 'bi-h1',
          type: 'service',
          serviceId: 'srv-2',
          name: 'Radiance Hydrating Facial',
          quantity: 1,
          unitPrice: 1850,
          duration: 60,
          discount: 0,
          tax: 333,
          total: 1850,
          staffId: 'staff-2',
          staffName: 'Ananya Roy',
        },
        {
          id: 'bi-h2',
          type: 'service',
          serviceId: 'srv-8',
          name: 'Hydrating Glow Facial Mask Addon',
          quantity: 1,
          unitPrice: 1000,
          duration: 20,
          discount: 0,
          tax: 180,
          total: 1000,
        },
      ],
      subtotal: 2850,
      discount: 0,
      taxableAmount: 2850,
      taxRate: 18,
      tax: 513,
      rounding: 0,
      roundingMode: 'nearest_1',
      grandTotal: 3363,
      paidAmount: 0,
      dueAmount: 3363,
      paymentMethod: 'upi',
      paymentStatus: 'UNPAID',
      status: 'held',
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    },
  },
]

function getStoredHeldBills(): HeldBill[] {
  try {
    const raw = localStorage.getItem(HELD_BILLS_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (err) {
    console.warn('Failed to parse held bills from storage:', err)
  }
  return initialHeldBills
}

function saveHeldBills(bills: HeldBill[]) {
  try {
    localStorage.setItem(HELD_BILLS_STORAGE_KEY, JSON.stringify(bills))
  } catch (err) {
    console.warn('Failed to save held bills to storage:', err)
  }
}

export const heldBillService = {
  async getAll(): Promise<HeldBill[]> {
    await new Promise((res) => setTimeout(res, 30))
    return getStoredHeldBills()
  },

  async getById(id: string): Promise<HeldBill | null> {
    const list = getStoredHeldBills()
    return list.find((b) => b.id === id) || null
  },

  async saveHeldBill(bill: Bill, note?: string): Promise<HeldBill> {
    const list = getStoredHeldBills()
    const id = `held-${Date.now()}`
    const itemsCount = bill.items.reduce((acc, item) => acc + item.quantity, 0)
    
    const heldEntry: HeldBill = {
      id,
      draftBill: {
        ...bill,
        status: 'held',
      },
      heldAt: new Date().toISOString(),
      note: note || bill.notes,
      clientName: bill.clientName || 'Walk-In Guest',
      itemsCount,
      estimatedTotal: bill.grandTotal,
    }

    const updated = [heldEntry, ...list]
    saveHeldBills(updated)
    return heldEntry
  },

  async delete(id: string): Promise<void> {
    const list = getStoredHeldBills()
    const updated = list.filter((b) => b.id !== id)
    saveHeldBills(updated)
  },

  async clearAll(): Promise<void> {
    saveHeldBills([])
  },
}
