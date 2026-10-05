import { create } from 'zustand'
import {
  Bill,
  BillItem,
  Client,
  DiscountType,
  RoundingMode,
  BillPaymentMethod,
  HeldBill,
  SalesSummaryStats,
  Appointment,
  Token,
} from '@/types'
import { billingService } from '@/services/billingService'
import { heldBillService } from '@/services/heldBillService'
import { calculateBillSummary, calculateItemTotal, calculateItemDiscount } from '@/utils/billingUtils'

interface BillingStoreState {
  // Cart Client & Reference
  client: Client | null
  isWalkIn: boolean
  walkInName: string
  walkInPhone: string
  appointmentId: string | null
  tokenId: string | null
  staffId: string
  staffName: string

  // Cart Line Items
  items: BillItem[]

  // Cart Adjustments
  discountType: DiscountType
  discountValue: number
  couponCode: string
  taxRate: number
  roundingMode: RoundingMode

  // Payment
  paidAmount: number
  customPaidTouched: boolean
  paymentMethod: BillPaymentMethod
  notes: string

  // Held Bills & Storage
  heldBills: HeldBill[]
  activeHeldBillId: string | null
  bills: Bill[]
  stats: SalesSummaryStats
  isLoading: boolean
  isSubmitting: boolean

  // Setters
  setClient: (client: Client | null) => void
  setWalkIn: (name: string, phone?: string) => void
  setStaff: (id: string, name: string) => void
  loadFromAppointment: (appt: Appointment) => void
  loadFromToken: (token: Token) => void

  // Cart mutations
  addItem: (item: Omit<BillItem, 'id' | 'total' | 'discount'> & { discount?: number }) => void
  updateItemQty: (id: string, quantity: number) => void
  updateItemDiscount: (id: string, discountType?: 'percentage' | 'fixed', discountValue?: number) => void
  removeItem: (id: string) => void
  setBillDiscount: (type: DiscountType, value: number, couponCode?: string) => void
  setTaxRate: (rate: number) => void
  setRoundingMode: (mode: RoundingMode) => void
  setPaidAmount: (amount: number) => void
  setPaymentMethod: (method: BillPaymentMethod) => void
  setNotes: (notes: string) => void
  clearCart: () => void

  // Held Bills Operations
  loadHeldBills: () => Promise<void>
  holdBill: (note?: string) => Promise<HeldBill>
  resumeHeldBill: (heldId: string) => Promise<void>
  deleteHeldBill: (heldId: string) => Promise<void>

  // Checkout & History Operations
  checkoutBill: () => Promise<Bill>
  loadHistory: () => Promise<void>
  loadStats: () => Promise<void>
}

export const useBillingStore = create<BillingStoreState>((set, get) => ({
  // Cart
  client: null,
  isWalkIn: false,
  walkInName: '',
  walkInPhone: '',
  appointmentId: null,
  tokenId: null,
  staffId: '',
  staffName: '',
  items: [],
  discountType: 'percentage',
  discountValue: 0,
  couponCode: '',
  taxRate: 18,
  roundingMode: 'nearest_1',
  paidAmount: 0,
  customPaidTouched: false,
  paymentMethod: 'cash',
  notes: '',

  // Records
  heldBills: [],
  activeHeldBillId: null,
  bills: [],
  stats: {
    todayRevenue: 0,
    todayRevenueChange: 0,
    todayBillsCount: 0,
    paidAmount: 0,
    dueAmount: 0,
    refundAmount: 0,
    heldBillsCount: 0,
  },
  isLoading: false,
  isSubmitting: false,

  setClient: (client) => {
    set({
      client,
      isWalkIn: !client,
      walkInName: client?.fullName || '',
      walkInPhone: client?.phone || '',
    })
  },

  setWalkIn: (name, phone = '') => {
    set({
      client: null,
      isWalkIn: true,
      walkInName: name,
      walkInPhone: phone,
    })
  },

  setStaff: (id, name) => {
    set({ staffId: id, staffName: name })
  },

  /**
   * Auto-loads client, service, staff, and price when creating bill from completed appointment
   */
  loadFromAppointment: (appt: Appointment) => {
    const servicePrice = appt.price || appt.servicePrice || 499
    const item: BillItem = {
      id: `bi-${Date.now()}`,
      type: 'service',
      serviceId: appt.serviceId,
      name: appt.serviceName,
      quantity: 1,
      unitPrice: servicePrice,
      duration: appt.duration || appt.serviceDuration || 45,
      discount: appt.discount || 0,
      tax: Math.round(servicePrice * 0.18 * 100) / 100,
      total: servicePrice - (appt.discount || 0),
      staffId: appt.staffId,
      staffName: appt.staffName,
    }

    const nameParts = appt.clientName.trim().split(' ')
    const clientObj: Client = {
      id: appt.clientId,
      firstName: nameParts[0] || appt.clientName,
      lastName: nameParts.slice(1).join(' ') || '',
      fullName: appt.clientName,
      phone: appt.clientPhone,
      email: `${appt.clientName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      gender: 'female',
      totalVisits: 1,
      totalSpent: servicePrice,
      status: 'active',
      tags: [],
      preferredStaffId: appt.staffId,
      createdAt: appt.date,
    }

    set({
      client: clientObj,
      isWalkIn: false,
      walkInName: appt.clientName,
      walkInPhone: appt.clientPhone,
      appointmentId: appt.id,
      tokenId: appt.tokenId || null,
      staffId: appt.staffId,
      staffName: appt.staffName,
      items: [item],
      discountType: 'percentage',
      discountValue: 0,
      couponCode: '',
      notes: appt.notes || '',
      customPaidTouched: false,
    })

    // Update default paidAmount to grandTotal
    const summary = calculateBillSummary({
      items: [item],
      taxRate: get().taxRate,
      roundingMode: get().roundingMode,
    })
    set({ paidAmount: summary.grandTotal })
  },

  /**
   * Auto-loads from a queue token
   */
  loadFromToken: (token: Token) => {
    const servicePrice = token.servicePrice || 499
    const item: BillItem = {
      id: `bi-${Date.now()}`,
      type: 'service',
      serviceId: token.serviceId,
      name: token.serviceName,
      quantity: 1,
      unitPrice: servicePrice,
      duration: token.serviceDuration,
      discount: 0,
      tax: Math.round(servicePrice * 0.18 * 100) / 100,
      total: servicePrice,
      staffId: token.staffId,
      staffName: token.staffName,
    }

    set({
      client: token.clientId
        ? {
            id: token.clientId,
            firstName: token.clientName.trim().split(' ')[0] || token.clientName,
            lastName: token.clientName.trim().split(' ').slice(1).join(' ') || '',
            fullName: token.clientName,
            phone: token.clientPhone || '',
            email: `${token.clientName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            gender: 'female',
            totalVisits: 1,
            totalSpent: servicePrice,
            status: 'active',
            tags: [],
            createdAt: token.date,
          }
        : null,
      isWalkIn: !token.clientId || token.appointmentType === 'WALK_IN',
      walkInName: token.clientName,
      walkInPhone: token.clientPhone || '',
      appointmentId: token.appointmentId || null,
      tokenId: token.id,
      staffId: token.staffId,
      staffName: token.staffName,
      items: [item],
      notes: token.notes || '',
      customPaidTouched: false,
    })

    const summary = calculateBillSummary({
      items: [item],
      taxRate: get().taxRate,
      roundingMode: get().roundingMode,
    })
    set({ paidAmount: summary.grandTotal })
  },

  addItem: (itemData) => {
    const { items, customPaidTouched } = get()

    // If it's a product and already in cart, increment quantity up to available stock
    if (itemData.type === 'product' && itemData.productId) {
      const existingIndex = items.findIndex((i) => i.productId === itemData.productId)
      if (existingIndex > -1) {
        const existing = items[existingIndex]
        const maxStock = existing.availableStock ?? 999
        const newQty = Math.min(maxStock, existing.quantity + (itemData.quantity || 1))
        const lineTotal = calculateItemTotal(existing.unitPrice, newQty, existing.discount)

        const updatedItems = [...items]
        updatedItems[existingIndex] = {
          ...existing,
          quantity: newQty,
          total: lineTotal,
        }

        set({ items: updatedItems })

        if (!customPaidTouched) {
          const summary = calculateBillSummary({
            items: updatedItems,
            billDiscountType: get().discountType,
            billDiscountValue: get().discountValue,
            couponCode: get().couponCode,
            taxRate: get().taxRate,
            roundingMode: get().roundingMode,
          })
          set({ paidAmount: summary.grandTotal })
        }
        return
      }
    }

    const discountAmt = itemData.discount || 0
    const lineTotal = calculateItemTotal(itemData.unitPrice, itemData.quantity, discountAmt)

    const newItem: BillItem = {
      ...itemData,
      id: `bi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      discount: discountAmt,
      tax: Math.round(((lineTotal * (get().taxRate || 18)) / 100) * 100) / 100,
      total: lineTotal,
    }

    const nextItems = [...items, newItem]
    set({ items: nextItems })

    if (!customPaidTouched) {
      const summary = calculateBillSummary({
        items: nextItems,
        billDiscountType: get().discountType,
        billDiscountValue: get().discountValue,
        couponCode: get().couponCode,
        taxRate: get().taxRate,
        roundingMode: get().roundingMode,
      })
      set({ paidAmount: summary.grandTotal })
    }
  },

  updateItemQty: (id, quantity) => {
    if (quantity < 1) return
    const { items, customPaidTouched } = get()
    const updated = items.map((item) => {
      if (item.id === id) {
        const safeQty = item.availableStock ? Math.min(item.availableStock, quantity) : quantity
        const discountAmt = calculateItemDiscount(
          item.unitPrice,
          safeQty,
          item.discountType,
          item.discountValue
        )
        const total = calculateItemTotal(item.unitPrice, safeQty, discountAmt)
        return {
          ...item,
          quantity: safeQty,
          discount: discountAmt,
          total,
        }
      }
      return item
    })

    set({ items: updated })

    if (!customPaidTouched) {
      const summary = calculateBillSummary({
        items: updated,
        billDiscountType: get().discountType,
        billDiscountValue: get().discountValue,
        couponCode: get().couponCode,
        taxRate: get().taxRate,
        roundingMode: get().roundingMode,
      })
      set({ paidAmount: summary.grandTotal })
    }
  },

  updateItemDiscount: (id, discountType, discountValue = 0) => {
    const { items, customPaidTouched } = get()
    const updated = items.map((item) => {
      if (item.id === id) {
        const discountAmt = calculateItemDiscount(
          item.unitPrice,
          item.quantity,
          discountType,
          discountValue
        )
        const total = calculateItemTotal(item.unitPrice, item.quantity, discountAmt)
        return {
          ...item,
          discountType,
          discountValue,
          discount: discountAmt,
          total,
        }
      }
      return item
    })

    set({ items: updated })

    if (!customPaidTouched) {
      const summary = calculateBillSummary({
        items: updated,
        billDiscountType: get().discountType,
        billDiscountValue: get().discountValue,
        couponCode: get().couponCode,
        taxRate: get().taxRate,
        roundingMode: get().roundingMode,
      })
      set({ paidAmount: summary.grandTotal })
    }
  },

  removeItem: (id) => {
    const { items, customPaidTouched } = get()
    const updated = items.filter((item) => item.id !== id)
    set({ items: updated })

    if (!customPaidTouched) {
      const summary = calculateBillSummary({
        items: updated,
        billDiscountType: get().discountType,
        billDiscountValue: get().discountValue,
        couponCode: get().couponCode,
        taxRate: get().taxRate,
        roundingMode: get().roundingMode,
      })
      set({ paidAmount: summary.grandTotal })
    }
  },

  setBillDiscount: (type, value, couponCode = '') => {
    set({
      discountType: type,
      discountValue: value,
      couponCode,
    })

    if (!get().customPaidTouched) {
      const summary = calculateBillSummary({
        items: get().items,
        billDiscountType: type,
        billDiscountValue: value,
        couponCode,
        taxRate: get().taxRate,
        roundingMode: get().roundingMode,
      })
      set({ paidAmount: summary.grandTotal })
    }
  },

  setTaxRate: (taxRate) => {
    set({ taxRate })
    if (!get().customPaidTouched) {
      const summary = calculateBillSummary({
        items: get().items,
        billDiscountType: get().discountType,
        billDiscountValue: get().discountValue,
        couponCode: get().couponCode,
        taxRate,
        roundingMode: get().roundingMode,
      })
      set({ paidAmount: summary.grandTotal })
    }
  },

  setRoundingMode: (roundingMode) => {
    set({ roundingMode })
    if (!get().customPaidTouched) {
      const summary = calculateBillSummary({
        items: get().items,
        billDiscountType: get().discountType,
        billDiscountValue: get().discountValue,
        couponCode: get().couponCode,
        taxRate: get().taxRate,
        roundingMode,
      })
      set({ paidAmount: summary.grandTotal })
    }
  },

  setPaidAmount: (paidAmount) => {
    set({ paidAmount: Math.max(0, paidAmount), customPaidTouched: true })
  },

  setPaymentMethod: (paymentMethod) => {
    set({ paymentMethod })
  },

  setNotes: (notes) => {
    set({ notes })
  },

  clearCart: () => {
    set({
      client: null,
      isWalkIn: false,
      walkInName: '',
      walkInPhone: '',
      appointmentId: null,
      tokenId: null,
      staffId: '',
      staffName: '',
      items: [],
      discountType: 'percentage',
      discountValue: 0,
      couponCode: '',
      paidAmount: 0,
      customPaidTouched: false,
      notes: '',
      activeHeldBillId: null,
    })
  },

  loadHeldBills: async () => {
    const held = await heldBillService.getAll()
    set({ heldBills: held })
  },

  holdBill: async (note) => {
    const s = get()
    if (s.items.length === 0) {
      throw new Error('Cannot hold an empty cart.')
    }

    const summary = calculateBillSummary({
      items: s.items,
      billDiscountType: s.discountType,
      billDiscountValue: s.discountValue,
      couponCode: s.couponCode,
      taxRate: s.taxRate,
      roundingMode: s.roundingMode,
      paidAmount: s.paidAmount,
    })

    const draft: Bill = {
      id: `draft-${Date.now()}`,
      invoiceNumber: 'DRAFT',
      clientId: s.client?.id || '',
      clientName: s.client?.fullName || s.walkInName || 'Walk-In Guest',
      clientPhone: s.client?.phone || s.walkInPhone,
      clientEmail: s.client?.email,
      isWalkInClient: s.isWalkIn,
      appointmentId: s.appointmentId || undefined,
      tokenId: s.tokenId || undefined,
      staffId: s.staffId,
      staffName: s.staffName,
      items: s.items,
      subtotal: summary.subtotal,
      discount: summary.totalDiscount,
      discountType: s.discountType,
      discountValue: s.discountValue,
      couponCode: s.couponCode,
      taxableAmount: summary.taxableAmount,
      tax: summary.tax,
      taxRate: s.taxRate,
      rounding: summary.rounding,
      roundingMode: s.roundingMode,
      grandTotal: summary.grandTotal,
      paidAmount: s.paidAmount,
      dueAmount: summary.dueAmount,
      paymentMethod: s.paymentMethod,
      paymentStatus: summary.paymentStatus,
      status: 'held',
      notes: note || s.notes,
      createdAt: new Date().toISOString(),
    }

    const held = await heldBillService.saveHeldBill(draft, note)

    // Reset current active cart
    get().clearCart()
    await get().loadHeldBills()
    return held
  },

  resumeHeldBill: async (heldId: string) => {
    const held = await heldBillService.getById(heldId)
    if (!held) throw new Error('Held bill not found')

    const draft = held.draftBill

    // Set cart from draft
    set({
      client: draft.clientId
        ? {
            id: draft.clientId,
            firstName: draft.clientName.trim().split(' ')[0] || draft.clientName,
            lastName: draft.clientName.trim().split(' ').slice(1).join(' ') || '',
            fullName: draft.clientName,
            phone: draft.clientPhone || '',
            email: draft.clientEmail || '',
            gender: 'female',
            totalVisits: 1,
            totalSpent: draft.grandTotal,
            status: 'active',
            tags: [],
            createdAt: draft.createdAt,
          }
        : null,
      isWalkIn: draft.isWalkInClient ?? !draft.clientId,
      walkInName: draft.clientName,
      walkInPhone: draft.clientPhone || '',
      appointmentId: draft.appointmentId || null,
      tokenId: draft.tokenId || null,
      staffId: draft.staffId || '',
      staffName: draft.staffName || '',
      items: draft.items || [],
      discountType: draft.discountType || 'percentage',
      discountValue: draft.discountValue || 0,
      couponCode: draft.couponCode || '',
      taxRate: draft.taxRate || 18,
      roundingMode: draft.roundingMode || 'nearest_1',
      paidAmount: draft.paidAmount || draft.grandTotal,
      customPaidTouched: true,
      paymentMethod: draft.paymentMethod || 'cash',
      notes: draft.notes || '',
      activeHeldBillId: heldId,
    })

    // Remove from held list now that it is resumed
    await heldBillService.delete(heldId)
    await get().loadHeldBills()
  },

  deleteHeldBill: async (heldId: string) => {
    await heldBillService.delete(heldId)
    await get().loadHeldBills()
  },

  checkoutBill: async () => {
    const s = get()
    if (s.items.length === 0) {
      throw new Error('Cannot checkout an empty bill. Add at least one service or product.')
    }

    set({ isSubmitting: true })
    try {
      const summary = calculateBillSummary({
        items: s.items,
        billDiscountType: s.discountType,
        billDiscountValue: s.discountValue,
        couponCode: s.couponCode,
        taxRate: s.taxRate,
        roundingMode: s.roundingMode,
        paidAmount: s.paidAmount,
      })

      const bill = await billingService.createBill({
        clientId: s.client?.id || '',
        clientName: s.client?.fullName || s.walkInName || 'Walk-In Guest',
        clientPhone: s.client?.phone || s.walkInPhone,
        clientEmail: s.client?.email,
        isWalkInClient: s.isWalkIn,
        appointmentId: s.appointmentId || undefined,
        tokenId: s.tokenId || undefined,
        staffId: s.staffId,
        staffName: s.staffName,
        items: s.items,
        subtotal: summary.subtotal,
        discount: summary.totalDiscount,
        discountType: s.discountType,
        discountValue: s.discountValue,
        couponCode: s.couponCode,
        taxableAmount: summary.taxableAmount,
        tax: summary.tax,
        taxRate: s.taxRate,
        rounding: summary.rounding,
        roundingMode: s.roundingMode,
        grandTotal: summary.grandTotal,
        paidAmount: summary.paidAmount,
        dueAmount: summary.dueAmount,
        paymentMethod: s.paymentMethod,
        paymentStatus: summary.paymentStatus,
        status: 'completed',
        notes: s.notes,
      })

      // Clean up if it was a held bill
      if (s.activeHeldBillId) {
        await heldBillService.delete(s.activeHeldBillId)
      }

      get().clearCart()
      await get().loadHistory()
      await get().loadStats()
      await get().loadHeldBills()

      return bill
    } finally {
      set({ isSubmitting: false })
    }
  },

  loadHistory: async () => {
    set({ isLoading: true })
    try {
      const allBills = await billingService.getAll()
      set({ bills: allBills, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  loadStats: async () => {
    try {
      const stats = await billingService.getSalesStats()
      const held = await heldBillService.getAll()
      set({
        stats: {
          ...stats,
          heldBillsCount: held.length,
        },
      })
    } catch (err) {
      console.warn('Failed to load sales stats:', err)
    }
  },
}))
