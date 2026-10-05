import { MarketingOffer, Client, PersonalizedRecommendation } from '@/types'
import { calculateDaysSince } from './marketing/segmentEvaluator'

const OFFERS_KEY = 'salora_marketing_offers_v1'

// Clear mock offers from localStorage if present
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(OFFERS_KEY)
    if (raw && (raw.includes('FESTIVE20') || raw.includes('off-1'))) {
      localStorage.removeItem(OFFERS_KEY)
    }
  } catch {}
}

function getStoredOffers(): MarketingOffer[] {
  try {
    const raw = localStorage.getItem(OFFERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed reading marketing offers from storage:', err)
  }
  return []
}

function saveStoredOffers(offers: MarketingOffer[]): void {
  try {
    localStorage.setItem(OFFERS_KEY, JSON.stringify(offers))
  } catch (err) {
    console.error('Failed saving marketing offers:', err)
  }
}

export interface CouponValidationParams {
  code: string
  netSubtotal: number
  client?: Client | null
  hasLoyaltyRedemption?: boolean
  hasMembershipDiscount?: boolean
}

export interface CouponValidationResult {
  isValid: boolean
  discountAmount: number
  offer?: MarketingOffer
  error?: string
  bonusPoints?: number
}

export const offerService = {
  async getAll(): Promise<MarketingOffer[]> {
    await new Promise((res) => setTimeout(res, 20))
    return getStoredOffers()
  },

  async getActive(): Promise<MarketingOffer[]> {
    const all = await this.getAll()
    const now = new Date().toISOString().split('T')[0]
    return all.filter((o) => o.isActive && o.startDate <= now && o.endDate >= now)
  },

  async getByCode(code: string): Promise<MarketingOffer | undefined> {
    const clean = code.trim().toUpperCase()
    const all = await this.getAll()
    return all.find((o) => o.code.toUpperCase() === clean)
  },

  async create(data: Omit<MarketingOffer, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>): Promise<MarketingOffer> {
    const all = getStoredOffers()
    const cleanCode = data.code.trim().toUpperCase()

    if (all.some((o) => o.code.toUpperCase() === cleanCode)) {
      throw new Error(`A promotional offer with coupon code "${cleanCode}" already exists.`)
    }

    const now = new Date().toISOString()
    const newOffer: MarketingOffer = {
      ...data,
      id: `off-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: cleanCode,
      usedCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    all.unshift(newOffer)
    saveStoredOffers(all)
    return newOffer
  },

  async update(id: string, data: Partial<MarketingOffer>): Promise<MarketingOffer> {
    const all = getStoredOffers()
    const idx = all.findIndex((o) => o.id === id)
    if (idx === -1) throw new Error('Offer not found')

    const current = all[idx]
    if (data.code && data.code.toUpperCase() !== current.code.toUpperCase()) {
      const clean = data.code.trim().toUpperCase()
      if (all.some((o) => o.id !== id && o.code.toUpperCase() === clean)) {
        throw new Error(`Coupon code "${clean}" is already in use by another offer.`)
      }
      data.code = clean
    }

    const updated: MarketingOffer = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    }

    all[idx] = updated
    saveStoredOffers(all)
    return updated
  },

  async delete(id: string): Promise<boolean> {
    const all = getStoredOffers()
    const filtered = all.filter((o) => o.id !== id)
    saveStoredOffers(filtered)
    return true
  },

  /**
   * Direct billing integration: Validates a coupon code and calculates the discount amount.
   * Enforces min subtotal, expiry, max discount cap, usage limit, customer eligibility and discount stacking.
   */
  validateCoupon(params: CouponValidationParams): CouponValidationResult {
    const { code, netSubtotal, client, hasLoyaltyRedemption, hasMembershipDiscount } = params
    if (!code || netSubtotal <= 0) {
      return { isValid: false, discountAmount: 0 }
    }

    const clean = code.trim().toUpperCase()
    const all = getStoredOffers()
    const offer = all.find((o) => o.code.toUpperCase() === clean)

    if (!offer) {
      return {
        isValid: false,
        discountAmount: 0,
        error: `Coupon "${clean}" is not recognized or invalid.`,
      }
    }

    if (!offer.isActive) {
      return {
        isValid: false,
        discountAmount: 0,
        error: `Offer "${offer.name}" has been disabled.`,
      }
    }

    const todayStr = new Date().toISOString().split('T')[0]
    if (offer.startDate && offer.startDate > todayStr) {
      return {
        isValid: false,
        discountAmount: 0,
        error: `Coupon "${clean}" is not active yet (starts ${offer.startDate}).`,
      }
    }

    if (offer.endDate && offer.endDate < todayStr) {
      return {
        isValid: false,
        discountAmount: 0,
        error: `Coupon "${clean}" has expired on ${offer.endDate}.`,
      }
    }

    if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
      return {
        isValid: false,
        discountAmount: 0,
        error: `Coupon "${clean}" has reached its maximum global usage limit.`,
      }
    }

    if (offer.minimumSpend && netSubtotal < offer.minimumSpend) {
      return {
        isValid: false,
        discountAmount: 0,
        error: `Coupon requires minimum order value of ₹${offer.minimumSpend.toLocaleString('en-IN')}.`,
      }
    }

    // Stacking verification
    if (hasLoyaltyRedemption && offer.canStackWithLoyalty === false) {
      return {
        isValid: false,
        discountAmount: 0,
        error: `Promo code "${clean}" cannot be combined with loyalty reward redemptions.`,
      }
    }

    if (hasMembershipDiscount && offer.canStackWithMembershipDiscount === false) {
      return {
        isValid: false,
        discountAmount: 0,
        error: `Promo code "${clean}" cannot be stacked with membership tier discounts.`,
      }
    }

    // Customer eligibility verification
    if (client && offer.customerSegmentId && offer.customerSegmentId !== 'ALL') {
      if (offer.customerSegmentId === 'seg-new-clients' && client.totalVisits > 1) {
        return {
          isValid: false,
          discountAmount: 0,
          error: `Coupon "${clean}" is exclusively reserved for first-time guests.`,
        }
      }
      if (offer.customerSegmentId === 'seg-vip-clients' && !client.isVip && (client.totalSpent || 0) < 20000) {
        return {
          isValid: false,
          discountAmount: 0,
          error: `Coupon "${clean}" is exclusively reserved for VIP guests.`,
        }
      }
    }

    // Calculate discount amount
    let discountAmount = 0
    let bonusPoints: number | undefined

    switch (offer.type) {
      case 'PERCENTAGE_DISCOUNT': {
        const calculated = (netSubtotal * offer.value) / 100
        const capped = offer.maximumDiscount
          ? Math.min(calculated, offer.maximumDiscount)
          : calculated
        discountAmount = Math.min(netSubtotal, Math.round(capped * 100) / 100)
        break
      }
      case 'FIXED_DISCOUNT':
        discountAmount = Math.min(netSubtotal, offer.value)
        break
      case 'SERVICE_DISCOUNT':
      case 'BUY_ONE_GET_ONE':
        discountAmount = Math.min(netSubtotal, offer.maximumDiscount || 850)
        break
      case 'FREE_SERVICE':
        discountAmount = Math.min(netSubtotal, 850)
        break
      case 'BONUS_POINTS':
        discountAmount = 0
        bonusPoints = offer.value
        break
      default:
        discountAmount = 0
    }

    return {
      isValid: true,
      discountAmount,
      offer,
      bonusPoints,
    }
  },

  /**
   * Increments usedCount when invoice is finalized
   */
  async recordRedemption(code: string): Promise<void> {
    const clean = code.trim().toUpperCase()
    const all = getStoredOffers()
    const idx = all.findIndex((o) => o.code.toUpperCase() === clean)
    if (idx !== -1) {
      all[idx].usedCount += 1
      saveStoredOffers(all)
    }
  },

  /**
   * Generates personalized recommendations for a customer using real customer behavior rules
   */
  getPersonalizedRecommendations(client: Client | null): PersonalizedRecommendation[] {
    const offers = getStoredOffers().filter((o) => o.isActive)
    const recommendations: PersonalizedRecommendation[] = []

    if (!client) {
      // Default guests recommendations
      const welcome = offers.find((o) => o.code === 'WELCOME20')
      if (welcome) {
        recommendations.push({
          offer: welcome,
          reason: 'First-time guest special: Enjoy 20% off your introductory salon ritual.',
          badge: 'Welcome Gift',
          ctaText: 'Claim 20% Off',
          score: 100,
        })
      }
      const glow = offers.find((o) => o.code === 'GLOW25')
      if (glow) {
        recommendations.push({
          offer: glow,
          reason: 'Seasonal festive hair spa ritual curation.',
          badge: 'Popular',
          ctaText: 'Use GLOW25',
          score: 80,
        })
      }
      return recommendations
    }

    const lastVisitDays = calculateDaysSince(client.lastVisitDate)
    const currentMonth = new Date().getMonth() + 1

    // Rule 1: Inactive > 60 Days Reactivation
    if (lastVisitDays >= 60) {
      const revive = offers.find((o) => o.code === 'REVIVE500')
      if (revive) {
        recommendations.push({
          offer: revive,
          reason: `We haven't seen you in ${lastVisitDays} days! Come back and enjoy ₹500 courtesy savings.`,
          badge: 'We Miss You',
          ctaText: 'Redeem ₹500 Off',
          score: 110,
        })
      }
    }

    // Rule 2: Birthday Celebration
    const bdayStr = client.birthday || client.dateOfBirth
    if (bdayStr) {
      const d = new Date(bdayStr)
      const bdayMonth = isNaN(d.getTime()) ? 0 : d.getMonth() + 1
      if (bdayMonth === currentMonth) {
        const bdayOffer = offers.find((o) => o.code === 'BIRTHDAY15')
        if (bdayOffer) {
          recommendations.push({
            offer: bdayOffer,
            reason: 'Happy Birthday from SALORA! Treat yourself to 15% off and bonus loyalty points this month.',
            badge: 'Birthday Treat',
            ctaText: 'Celebrate With 15%',
            score: 120,
          })
        }
      }
    }

    // Rule 3: Favorite Service = Hair Spa or Color
    const favorite = (client.favoriteService || '').toLowerCase()
    if (favorite.includes('hair spa') || favorite.includes('scalp')) {
      const spabogo = offers.find((o) => o.code === 'SPA_BOGO')
      if (spabogo) {
        recommendations.push({
          offer: spabogo,
          reason: `Because your favorite ritual is ${client.favoriteService}, enjoy a complimentary scalp treatment on your next booking.`,
          badge: 'Service Match',
          ctaText: 'Claim Ritual Offer',
          score: 95,
        })
      }
    }

    // Rule 4: VIP Guest / Platinum / Gold Privilege
    if (client.isVip || (client.totalSpent && client.totalSpent >= 20000)) {
      const vipOffer = offers.find((o) => o.code === 'VIPGLAM')
      if (vipOffer) {
        recommendations.push({
          offer: vipOffer,
          reason: 'As a top-tier salon patron, enjoy an exclusive ₹1,000 courtesy voucher.',
          badge: 'VIP Privilege',
          ctaText: 'Use ₹1,000 Voucher',
          score: 90,
        })
      }
    }

    // Fallback: General active offers
    const general = offers.find((o) => o.code === 'GLOW25')
    if (general && !recommendations.some((r) => r.offer.code === general.code)) {
      recommendations.push({
        offer: general,
        reason: 'Seasonal restorative hair ritual savings for all salon patrons.',
        badge: 'Trending Offer',
        ctaText: 'Use GLOW25',
        score: 70,
      })
    }

    return recommendations.sort((a, b) => (b.score || 0) - (a.score || 0))
  },
}
