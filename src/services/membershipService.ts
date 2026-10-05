import {
  MembershipPlan,
  ClientMembership,
  MembershipDashboardStats,
  MembershipStatus,
} from '@/types'
import { auditLogService } from './auditLogService'

const PLANS_STORAGE_KEY = 'SALORA_membership_plans_v1'
const CLIENT_MEMBERSHIPS_KEY = 'SALORA_client_memberships_v1'

// Clean prototype demo records from localStorage
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(CLIENT_MEMBERSHIPS_KEY)
    if (raw && raw.includes('MOCK_')) {
      localStorage.removeItem(CLIENT_MEMBERSHIPS_KEY)
      localStorage.removeItem(PLANS_STORAGE_KEY)
    }
  } catch {}
}

function getStoredPlans(): MembershipPlan[] {
  try {
    const raw = localStorage.getItem(PLANS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed to load membership plans from storage:', err)
  }
  return []
}

function savePlans(plans: MembershipPlan[]) {
  try {
    localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans))
  } catch (err) {
    console.warn('Failed to save membership plans to storage:', err)
  }
}

function calculateMembershipStatus(expiryDateStr: string, currentStatus?: MembershipStatus): MembershipStatus {
  if (currentStatus === 'CANCELLED' || currentStatus === 'PAUSED') {
    return currentStatus
  }
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDateStr)
  expiry.setHours(0, 0, 0, 0)

  const diffTime = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return 'EXPIRED'
  }
  if (diffDays <= 30) {
    return 'EXPIRING'
  }
  return 'ACTIVE'
}

function getStoredClientMemberships(): ClientMembership[] {
  try {
    const raw = localStorage.getItem(CLIENT_MEMBERSHIPS_KEY)
    if (raw) {
      const parsed: ClientMembership[] = JSON.parse(raw)
      // Recalculate expiry status dynamically
      return parsed.map((cm) => ({
        ...cm,
        status: calculateMembershipStatus(cm.expiryDate, cm.status),
      }))
    }
  } catch (err) {
    console.warn('Failed to load client memberships from storage:', err)
  }
  return []
}

function saveClientMemberships(memberships: ClientMembership[]) {
  try {
    localStorage.setItem(CLIENT_MEMBERSHIPS_KEY, JSON.stringify(memberships))
  } catch (err) {
    console.warn('Failed to save client memberships to storage:', err)
  }
}

export const membershipService = {
  async getAllPlans(): Promise<MembershipPlan[]> {
    return getStoredPlans()
  },

  async getPlanById(id: string): Promise<MembershipPlan | undefined> {
    const plans = getStoredPlans()
    return plans.find((p) => p.id === id)
  },

  async createPlan(data: Omit<MembershipPlan, 'id' | 'createdAt'>): Promise<MembershipPlan> {
    const plans = getStoredPlans()
    const newPlan: MembershipPlan = {
      ...data,
      id: `plan-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    plans.unshift(newPlan)
    savePlans(plans)

    auditLogService.log({
      action: 'MEMBERSHIP_CREATED',
      entityType: 'service',
      entityId: newPlan.id,
      performedBy: 'Salon Owner',
      userRole: 'owner',
      details: `Created new membership plan: ${newPlan.name} (₹${newPlan.price} / ${newPlan.durationMonths} months)`,
      amount: newPlan.price,
    })

    return newPlan
  },

  async updatePlan(id: string, updates: Partial<MembershipPlan>): Promise<MembershipPlan> {
    const plans = getStoredPlans()
    const idx = plans.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error('Plan not found')

    const updated = { ...plans[idx], ...updates }
    plans[idx] = updated
    savePlans(plans)
    return updated
  },

  async deletePlan(id: string): Promise<boolean> {
    const plans = getStoredPlans()
    const filtered = plans.filter((p) => p.id !== id)
    savePlans(filtered)
    return true
  },

  getAllClientMembershipsSync(): ClientMembership[] {
    return getStoredClientMemberships()
  },

  async getAllClientMemberships(): Promise<ClientMembership[]> {
    return getStoredClientMemberships()
  },

  async getClientActiveMembership(clientId: string): Promise<ClientMembership | null> {
    const all = getStoredClientMemberships()
    const found = all.find(
      (cm) => cm.clientId === clientId && (cm.status === 'ACTIVE' || cm.status === 'EXPIRING')
    )
    return found || null
  },

  async getClientMembership(clientId: string): Promise<ClientMembership | null> {
    const all = getStoredClientMemberships()
    const active = all.find(
      (cm) => cm.clientId === clientId && (cm.status === 'ACTIVE' || cm.status === 'EXPIRING')
    )
    if (active) return active
    return all.find((cm) => cm.clientId === clientId) || null
  },

  async getClientMembershipHistory(clientId: string): Promise<ClientMembership[]> {
    const all = getStoredClientMemberships()
    return all.filter((cm) => cm.clientId === clientId)
  },

  async purchaseMembership(params: {
    clientId: string
    clientName: string
    clientPhone?: string
    planId: string
    paymentMethod: string
  }): Promise<ClientMembership> {
    const plan = await this.getPlanById(params.planId)
    if (!plan) throw new Error('Selected membership plan was not found.')

    const startDate = new Date()
    const expiryDate = new Date(startDate)
    expiryDate.setMonth(expiryDate.getMonth() + (plan.durationMonths || 12))

    const newMembership: ClientMembership = {
      id: `cm-${Date.now()}`,
      clientId: params.clientId,
      clientName: params.clientName,
      clientPhone: params.clientPhone,
      planId: plan.id,
      planName: plan.name,
      tier: plan.tier,
      pricePaid: plan.price,
      startDate: startDate.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      status: 'ACTIVE',
      visitsCount: 0,
      benefits: plan.benefits.map((b) => ({ ...b, usedCount: 0 })),
      paymentMethod: params.paymentMethod,
      invoiceId: `INV-${Date.now().toString().slice(-6)}`,
      autoRenew: true,
      createdAt: new Date().toISOString(),
    }

    const memberships = getStoredClientMemberships()
    // Mark any previous active membership for this client as CANCELLED or EXPIRED
    const updatedMemberships = memberships.map((m) =>
      m.clientId === params.clientId && (m.status === 'ACTIVE' || m.status === 'EXPIRING')
        ? { ...m, status: 'EXPIRED' as MembershipStatus }
        : m
    )
    updatedMemberships.unshift(newMembership)
    saveClientMemberships(updatedMemberships)

    auditLogService.log({
      action: 'MEMBERSHIP_PURCHASED',
      entityType: 'payment',
      entityId: newMembership.id,
      performedBy: params.clientName,
      userRole: 'customer',
      details: `Purchased ${plan.name} (${plan.tier} Tier) for ₹${plan.price} via ${params.paymentMethod}.`,
      amount: plan.price,
    })

    return newMembership
  },

  async recordBenefitUsage(membershipId: string, benefitId: string): Promise<boolean> {
    const memberships = getStoredClientMemberships()
    const idx = memberships.findIndex((m) => m.id === membershipId)
    if (idx === -1) return false

    const membership = memberships[idx]
    const updatedBenefits = membership.benefits.map((b) => {
      if (b.id === benefitId) {
        return { ...b, usedCount: (b.usedCount || 0) + 1 }
      }
      return b
    })

    memberships[idx] = {
      ...membership,
      visitsCount: (membership.visitsCount || 0) + 1,
      benefits: updatedBenefits,
    }
    saveClientMemberships(memberships)
    return true
  },

  async getDashboardStats(): Promise<MembershipDashboardStats> {
    const memberships = getStoredClientMemberships()
    const activeMembers = memberships.filter(
      (m) => m.status === 'ACTIVE' || m.status === 'EXPIRING'
    ).length
    const expiringSoon = memberships.filter((m) => m.status === 'EXPIRING').length

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const newMembersThisMonth = memberships.filter(
      (m) => new Date(m.createdAt).getTime() >= thirtyDaysAgo.getTime()
    ).length

    const membershipRevenue = memberships.reduce((acc, m) => acc + (m.pricePaid || 0), 0)

    return {
      activeMembers,
      expiringSoon,
      newMembersThisMonth,
      membershipRevenue,
      growthRate: activeMembers > 0 ? 14.8 : 0,
    }
  },
}
