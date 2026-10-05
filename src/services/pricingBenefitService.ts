import { ClientMembership, ClientPackageWallet } from '@/types'
import { membershipService } from './membershipService'
import { packageService } from './packageService'

export interface PricingBenefitResult {
  originalPrice: number
  finalPrice: number
  discountAmount: number
  discountPercent: number
  appliedBenefit?: {
    type: 'MEMBERSHIP' | 'PACKAGE'
    title: string
    description: string
    membershipId?: string
    benefitId?: string
    walletId?: string
    discountAmount: number
    isFreeService: boolean
    remainingSessions?: number
  }
}

export const pricingBenefitService = {
  async getClientActiveMembership(clientId: string): Promise<ClientMembership | null> {
    if (!clientId) return null
    return membershipService.getClientActiveMembership(clientId)
  },

  async getClientPackageWallets(clientId: string): Promise<ClientPackageWallet[]> {
    if (!clientId) return []
    const all = await packageService.getClientWallets(clientId)
    return all.filter((w) => w.status === 'active')
  },

  /**
   * Universal benefit pricing rule engine.
   * Checks package wallet first (100% pre-paid session coverage),
   * then checks active membership benefits (e.g. 15% discount or free complimentary service).
   */
  async calculatePriceWithBenefits(params: {
    clientId?: string
    clientName?: string
    serviceId?: string
    serviceName: string
    regularPrice: number
    categoryId?: string
  }): Promise<PricingBenefitResult> {
    const { clientId, serviceId, serviceName, regularPrice, categoryId } = params

    if (!clientId || regularPrice <= 0) {
      return {
        originalPrice: regularPrice,
        finalPrice: regularPrice,
        discountAmount: 0,
        discountPercent: 0,
      }
    }

    // 1. Check Package Wallet Coverage (Prepaid Pass)
    const wallets = await this.getClientPackageWallets(clientId)
    for (const wallet of wallets) {
      const matchingItem = wallet.items.find((item) => {
        if (item.remainingQuantity <= 0) return false
        if (serviceId && item.serviceId === serviceId) return true
        return (
          item.serviceName.toLowerCase().trim() === serviceName.toLowerCase().trim() ||
          serviceName.toLowerCase().includes(item.serviceName.toLowerCase()) ||
          item.serviceName.toLowerCase().includes(serviceName.toLowerCase())
        )
      })

      if (matchingItem) {
        return {
          originalPrice: regularPrice,
          finalPrice: 0,
          discountAmount: regularPrice,
          discountPercent: 100,
          appliedBenefit: {
            type: 'PACKAGE',
            title: `${wallet.packageName} (${matchingItem.remainingQuantity} remaining)`,
            description: `100% covered by prepaid ${wallet.packageName}. 1 session will be redeemed.`,
            walletId: wallet.id,
            discountAmount: regularPrice,
            isFreeService: true,
            remainingSessions: matchingItem.remainingQuantity,
          },
        }
      }
    }

    // 2. Check Active Membership Privileges
    const membership = await this.getClientActiveMembership(clientId)
    if (membership && (membership.status === 'ACTIVE' || membership.status === 'EXPIRING')) {
      // A. Check for complimentary free service entitlement
      const freeBenefit = membership.benefits.find((b) => {
        if (b.type !== 'FREE_SERVICE') return false
        const limit = b.limit || b.value || 1
        const used = b.usedCount || 0
        if (used >= limit) return false

        if (b.serviceId && serviceId && b.serviceId === serviceId) return true
        if (b.serviceName && serviceName.toLowerCase().includes(b.serviceName.toLowerCase())) return true
        return false
      })

      if (freeBenefit) {
        return {
          originalPrice: regularPrice,
          finalPrice: 0,
          discountAmount: regularPrice,
          discountPercent: 100,
          appliedBenefit: {
            type: 'MEMBERSHIP',
            title: `${membership.tier} Member Free Privilege`,
            description: `Complimentary ritual: ${freeBenefit.name} (${(freeBenefit.limit || freeBenefit.value) - (freeBenefit.usedCount || 0)} left)`,
            membershipId: membership.id,
            benefitId: freeBenefit.id,
            discountAmount: regularPrice,
            isFreeService: true,
          },
        }
      }

      // B. Check for service discount percentage
      const discountBenefit = membership.benefits.find((b) => b.type === 'SERVICE_DISCOUNT')
      if (discountBenefit && discountBenefit.value > 0) {
        const percent = discountBenefit.value
        const discountAmount = Math.round((regularPrice * percent) / 100 * 100) / 100
        const finalPrice = Math.max(0, Math.round((regularPrice - discountAmount) * 100) / 100)

        return {
          originalPrice: regularPrice,
          finalPrice,
          discountAmount,
          discountPercent: percent,
          appliedBenefit: {
            type: 'MEMBERSHIP',
            title: `${membership.tier} Member Discount (${percent}%)`,
            description: `${membership.tier} privilege: ${percent}% discount automatically applied`,
            membershipId: membership.id,
            benefitId: discountBenefit.id,
            discountAmount,
            isFreeService: false,
          },
        }
      }
    }

    // Default: No benefit applied
    return {
      originalPrice: regularPrice,
      finalPrice: regularPrice,
      discountAmount: 0,
      discountPercent: 0,
    }
  },

  /**
   * Consumes a package session after checkout or completed appointment
   */
  async consumePackageSession(walletId: string, serviceId: string) {
    return packageService.consumeWalletSession(walletId, serviceId)
  },

  /**
   * Records that a client utilized an annual membership benefit
   */
  async recordMembershipBenefitUsage(membershipId: string, benefitId: string) {
    return membershipService.recordBenefitUsage(membershipId, benefitId)
  },
}
