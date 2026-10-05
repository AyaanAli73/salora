import {
  BillItem,
  DiscountType,
  RoundingMode,
  BillPaymentStatus,
} from '@/types'
import { offerService } from '@/services/offerService'

export interface CouponRule {
  code: string
  description: string
  type: 'percentage' | 'fixed'
  value: number
  minSubtotal?: number
}

export const AVAILABLE_COUPONS: CouponRule[] = [
  {
    code: 'GLOW10',
    description: '10% off salon ritual order',
    type: 'percentage',
    value: 10,
  },
  {
    code: 'VIP20',
    description: '20% VIP exclusive salon savings',
    type: 'percentage',
    value: 20,
    minSubtotal: 1000,
  },
  {
    code: 'FESTIVE500',
    description: 'Flat ₹500 off bill of ₹2,000+',
    type: 'fixed',
    value: 500,
    minSubtotal: 2000,
  },
  {
    code: 'WELCOME15',
    description: '15% First time client welcome',
    type: 'percentage',
    value: 15,
  },
]

export const AVAILABLE_TAX_RATES = [
  { rate: 0, label: '0% (Exempt)' },
  { rate: 5, label: '5% (Essential)' },
  { rate: 12, label: '12% (Standard)' },
  { rate: 18, label: '18% (Standard Salon GST)' },
  { rate: 28, label: '28% (Luxury)' },
]

/**
 * Calculates item totals:
 * unitPrice * quantity - discount
 */
export function calculateItemTotal(
  unitPrice: number,
  quantity: number,
  discount: number = 0
): number {
  const lineTotal = Math.max(0, unitPrice * quantity - discount)
  return Math.round(lineTotal * 100) / 100
}

/**
 * Calculates discount for an item
 */
export function calculateItemDiscount(
  unitPrice: number,
  quantity: number,
  discountType?: 'percentage' | 'fixed',
  discountValue: number = 0
): number {
  const gross = unitPrice * quantity
  if (!discountValue || discountValue <= 0) return 0

  if (discountType === 'percentage') {
    const calculated = (gross * Math.min(100, discountValue)) / 100
    return Math.round(calculated * 100) / 100
  }

  // Fixed
  return Math.min(gross, Math.round(discountValue * 100) / 100)
}

/**
 * Calculates the bill-level discount amount
 */
export function calculateBillLevelDiscount(
  netSubtotal: number,
  discountType?: DiscountType,
  discountValue: number = 0,
  couponCode?: string
): { discountAmount: number; error?: string } {
  if (netSubtotal <= 0) return { discountAmount: 0 }

  if (discountType === 'coupon' && couponCode) {
    const cleanCode = couponCode.trim().toUpperCase()

    // 1. Support Loyalty Reward Vouchers (e.g. RWD-4921)
    if (cleanCode.startsWith('RWD-')) {
      try {
        const raw = localStorage.getItem('salora_reward_redemptions')
        const redemptions = raw ? JSON.parse(raw) : []
        const voucher = redemptions.find((r: any) => r.code?.toUpperCase() === cleanCode)
        if (!voucher) {
          return { discountAmount: 0, error: 'Reward voucher not found or invalid.' }
        }
        if (voucher.status === 'USED') {
          return { discountAmount: 0, error: 'Reward voucher has already been redeemed.' }
        }
        if (new Date(voucher.expiresAt) < new Date() || voucher.status === 'EXPIRED') {
          return { discountAmount: 0, error: 'Reward voucher has expired.' }
        }
        const val = voucher.value || (voucher.type === 'FREE_SERVICE' ? 850 : 250)
        return { discountAmount: Math.min(netSubtotal, val) }
      } catch (err) {
        console.warn('Failed parsing loyalty vouchers:', err)
      }
    }

    // 2. Marketing Offers & Coupons System Integration (Phase 3 Part 7)
    const offerValidation = offerService.validateCoupon({
      code: cleanCode,
      netSubtotal,
    })

    if (offerValidation.isValid) {
      return { discountAmount: offerValidation.discountAmount }
    } else if (offerValidation.error && !offerValidation.error.includes('is not recognized')) {
      return { discountAmount: 0, error: offerValidation.error }
    }

    // 3. Fallback to legacy AVAILABLE_COUPONS
    const coupon = AVAILABLE_COUPONS.find(
      (c) => c.code.toUpperCase() === cleanCode
    )
    if (!coupon) {
      return { discountAmount: 0, error: offerValidation.error || 'Invalid coupon or voucher code.' }
    }
    if (coupon.minSubtotal && netSubtotal < coupon.minSubtotal) {
      return {
        discountAmount: 0,
        error: `Requires min subtotal of ₹${coupon.minSubtotal}.`,
      }
    }

    if (coupon.type === 'percentage') {
      const amt = (netSubtotal * coupon.value) / 100
      return { discountAmount: Math.min(netSubtotal, Math.round(amt * 100) / 100) }
    } else {
      return { discountAmount: Math.min(netSubtotal, coupon.value) }
    }
  }

  if (discountType === 'percentage' && discountValue > 0) {
    const pct = Math.min(100, Math.max(0, discountValue))
    const amt = (netSubtotal * pct) / 100
    return { discountAmount: Math.min(netSubtotal, Math.round(amt * 100) / 100) }
  }

  if (discountType === 'fixed' && discountValue > 0) {
    return { discountAmount: Math.min(netSubtotal, Math.round(discountValue * 100) / 100) }
  }

  return { discountAmount: 0 }
}

/**
 * Calculates rounding adjustment
 */
export function calculateRounding(
  amount: number,
  mode: RoundingMode = 'none'
): { rounded: number; adjustment: number } {
  if (mode === 'none') {
    const exact = Math.round(amount * 100) / 100
    return { rounded: exact, adjustment: 0 }
  }

  if (mode === 'nearest_1') {
    const rounded = Math.round(amount)
    const adjustment = Math.round((rounded - amount) * 100) / 100
    return { rounded, adjustment }
  }

  if (mode === 'nearest_5') {
    const rounded = Math.round(amount / 5) * 5
    const adjustment = Math.round((rounded - amount) * 100) / 100
    return { rounded, adjustment }
  }

  return { rounded: amount, adjustment: 0 }
}

/**
 * Comprehensive calculation of complete bill breakdown
 */
export interface BillSummaryCalculation {
  subtotal: number
  itemsDiscount: number
  billDiscount: number
  totalDiscount: number
  taxableAmount: number
  taxRate: number
  tax: number
  rounding: number
  grandTotal: number
  paidAmount: number
  dueAmount: number
  paymentStatus: BillPaymentStatus
}

export function calculateBillSummary(params: {
  items: BillItem[]
  billDiscountType?: DiscountType
  billDiscountValue?: number
  couponCode?: string
  taxRate?: number
  roundingMode?: RoundingMode
  paidAmount?: number
}): BillSummaryCalculation {
  const {
    items = [],
    billDiscountType,
    billDiscountValue = 0,
    couponCode,
    taxRate = 18,
    roundingMode = 'nearest_1',
    paidAmount = 0,
  } = params

  // 1. Gross subtotal & items discount
  let subtotal = 0
  let itemsDiscount = 0

  items.forEach((item) => {
    const lineGross = (item.unitPrice || 0) * (item.quantity || 1)
    subtotal += lineGross
    itemsDiscount += item.discount || 0
  })

  subtotal = Math.round(subtotal * 100) / 100
  itemsDiscount = Math.round(itemsDiscount * 100) / 100

  const subtotalAfterItemDiscounts = Math.max(0, subtotal - itemsDiscount)

  // 2. Bill level discount
  const { discountAmount: billDiscount } = calculateBillLevelDiscount(
    subtotalAfterItemDiscounts,
    billDiscountType,
    billDiscountValue,
    couponCode
  )

  const totalDiscount = Math.min(
    subtotal,
    Math.round((itemsDiscount + billDiscount) * 100) / 100
  )

  // 3. Taxable amount
  const taxableAmount = Math.max(0, Math.round((subtotal - totalDiscount) * 100) / 100)

  // 4. Tax
  const tax = Math.round(((taxableAmount * (taxRate || 0)) / 100) * 100) / 100

  // 5. Pre-rounded grand total
  const unroundedTotal = taxableAmount + tax

  // 6. Rounding
  const { rounded: grandTotal, adjustment: rounding } = calculateRounding(
    unroundedTotal,
    roundingMode
  )

  // 7. Payment status & Due calculation
  const safePaid = Math.max(0, Math.round((paidAmount || 0) * 100) / 100)
  const dueAmount = Math.max(0, Math.round((grandTotal - safePaid) * 100) / 100)

  let paymentStatus: BillPaymentStatus = 'UNPAID'
  if (grandTotal === 0) {
    paymentStatus = 'PAID'
  } else if (safePaid >= grandTotal) {
    paymentStatus = 'PAID'
  } else if (safePaid > 0 && safePaid < grandTotal) {
    paymentStatus = 'PARTIAL'
  } else {
    paymentStatus = 'UNPAID'
  }

  return {
    subtotal,
    itemsDiscount,
    billDiscount,
    totalDiscount,
    taxableAmount,
    taxRate,
    tax,
    rounding,
    grandTotal,
    paidAmount: safePaid,
    dueAmount,
    paymentStatus,
  }
}

/**
 * Formats invoice number: e.g. INV-000124
 */
export function formatInvoiceNumber(seq: number): string {
  const padded = seq.toString().padStart(6, '0')
  return `INV-${padded}`
}
