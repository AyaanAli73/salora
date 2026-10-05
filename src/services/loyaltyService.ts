import {
  LoyaltyRuleConfig,
  LoyaltyTransaction,
  Reward,
  RewardRedemption,
  Referral,
  LoyaltyDashboardStats,
} from '@/types'
import { DEFAULT_LOYALTY_RULES } from '@/data/mockLoyalty'
import { auditLogService } from './auditLogService'
import { clientService } from './clientService'

const RULES_KEY = 'salora_loyalty_rules'
const TRANSACTIONS_KEY = 'salora_loyalty_transactions'
const REWARDS_KEY = 'salora_rewards_catalog'
const REDEMPTIONS_KEY = 'salora_reward_redemptions'
const REFERRALS_KEY = 'salora_referrals'

function getStoredRules(): LoyaltyRuleConfig {
  try {
    const raw = localStorage.getItem(RULES_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed to parse loyalty rules from localStorage:', err)
  }
  return DEFAULT_LOYALTY_RULES
}

function saveRules(rules: LoyaltyRuleConfig) {
  try {
    localStorage.setItem(RULES_KEY, JSON.stringify(rules))
  } catch (err) {
    console.error('Failed to save loyalty rules to localStorage:', err)
  }
}

// Clear mock loyalty data from localStorage if present
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY)
    if (raw && raw.includes('MOCK_')) {
      localStorage.removeItem(TRANSACTIONS_KEY)
      localStorage.removeItem(REWARDS_KEY)
      localStorage.removeItem(REDEMPTIONS_KEY)
      localStorage.removeItem(REFERRALS_KEY)
    }
  } catch {}
}

function getStoredTransactions(): LoyaltyTransaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed to parse loyalty transactions:', err)
  }
  return []
}

function saveTransactions(txs: LoyaltyTransaction[]) {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs))
  } catch (err) {
    console.error('Failed to save loyalty transactions:', err)
  }
}

function getStoredRewards(): Reward[] {
  try {
    const raw = localStorage.getItem(REWARDS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed to parse rewards catalog:', err)
  }
  return []
}

function saveRewards(rwds: Reward[]) {
  try {
    localStorage.setItem(REWARDS_KEY, JSON.stringify(rwds))
  } catch (err) {
    console.error('Failed to save rewards:', err)
  }
}

function getStoredRedemptions(): RewardRedemption[] {
  try {
    const raw = localStorage.getItem(REDEMPTIONS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed to parse redemptions:', err)
  }
  return []
}

function saveRedemptions(reds: RewardRedemption[]) {
  try {
    localStorage.setItem(REDEMPTIONS_KEY, JSON.stringify(reds))
  } catch (err) {
    console.error('Failed to save redemptions:', err)
  }
}

function getStoredReferrals(): Referral[] {
  try {
    const raw = localStorage.getItem(REFERRALS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed to parse referrals:', err)
  }
  return []
}

function saveReferrals(refs: Referral[]) {
  try {
    localStorage.setItem(REFERRALS_KEY, JSON.stringify(refs))
  } catch (err) {
    console.error('Failed to save referrals:', err)
  }
}

export const loyaltyService = {
  // ─── 1. RULES CONFIGURATION ───
  async getRules(): Promise<LoyaltyRuleConfig> {
    return getStoredRules()
  },

  async updateRules(updates: Partial<LoyaltyRuleConfig>): Promise<LoyaltyRuleConfig> {
    const current = getStoredRules()
    const updated = { ...current, ...updates }
    saveRules(updated)
    return updated
  },

  // ─── 2. POINTS BALANCE & TRANSACTIONS ───
  normalizeClientIds(clientId: string): string[] {
    if (!clientId) return []
    if (clientId === 'cli-6' || clientId === 'cli-priya') return ['cli-6', 'cli-priya']
    if (clientId === 'cli-1' || clientId === 'cli-seraphina') return ['cli-1', 'cli-seraphina']
    if (clientId === 'cli-2' || clientId === 'cli-julian') return ['cli-2', 'cli-julian']
    if (clientId === 'cli-3' || clientId === 'cli-amara') return ['cli-3', 'cli-amara']
    return [clientId]
  },

  async getClientBalance(clientId: string): Promise<number> {
    if (!clientId) return 0
    const ids = this.normalizeClientIds(clientId)
    const txs = getStoredTransactions().filter((t) => ids.includes(t.clientId))
    const sum = txs.reduce((acc, t) => acc + t.points, 0)
    return Math.max(0, sum)
  },

  async getAllTransactions(): Promise<LoyaltyTransaction[]> {
    return getStoredTransactions().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  async getClientTransactions(clientId: string): Promise<LoyaltyTransaction[]> {
    if (!clientId) return []
    const ids = this.normalizeClientIds(clientId)
    return getStoredTransactions()
      .filter((t) => ids.includes(t.clientId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  /**
   * Adds a transaction to the immutable ledger.
   * Guarantees no silent mutation and prevents negative point balance.
   */
  async addTransaction(data: {
    clientId: string
    clientName: string
    type: LoyaltyTransaction['type']
    points: number
    reason: string
    referenceId?: string
  }): Promise<LoyaltyTransaction> {
    const currentBalance = await this.getClientBalance(data.clientId)

    // Prevent negative balance if points is negative (deduction)
    if (data.points < 0 && currentBalance + data.points < 0) {
      throw new Error(
        `Insufficient loyalty points. Client has ${currentBalance} points, cannot deduct ${Math.abs(
          data.points
        )} points.`
      )
    }

    const newTx: LoyaltyTransaction = {
      id: `ltx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      clientId: data.clientId,
      clientName: data.clientName,
      type: data.type,
      points: data.points,
      reason: data.reason,
      referenceId: data.referenceId,
      createdAt: new Date().toISOString(),
    }

    const txs = getStoredTransactions()
    txs.unshift(newTx)
    saveTransactions(txs)

    return newTx
  },

  // ─── 3. REWARD CATALOG & REDEMPTION ───
  async getRewards(): Promise<Reward[]> {
    return getStoredRewards()
  },

  async getActiveRewards(): Promise<Reward[]> {
    return getStoredRewards().filter((r) => r.active)
  },

  async getRewardById(id: string): Promise<Reward | undefined> {
    return getStoredRewards().find((r) => r.id === id)
  },

  async createReward(data: Omit<Reward, 'id' | 'createdAt'>): Promise<Reward> {
    const rewards = getStoredRewards()
    const newReward: Reward = {
      ...data,
      id: `rwd-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    rewards.unshift(newReward)
    saveRewards(rewards)
    return newReward
  },

  async updateReward(id: string, updates: Partial<Reward>): Promise<Reward> {
    const rewards = getStoredRewards()
    const idx = rewards.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Reward not found')
    const updated = { ...rewards[idx], ...updates }
    rewards[idx] = updated
    saveRewards(rewards)
    return updated
  },

  async deleteReward(id: string): Promise<boolean> {
    const rewards = getStoredRewards()
    const filtered = rewards.filter((r) => r.id !== id)
    saveRewards(filtered)
    return true
  },

  /**
   * Redeems a reward for a customer.
   * Decrements points via transaction and creates a unique redemption voucher.
   */
  async redeemReward(clientId: string, clientName: string, rewardId: string): Promise<RewardRedemption> {
    const reward = await this.getRewardById(rewardId)
    if (!reward) throw new Error('Reward not found')
    if (!reward.active) throw new Error('This reward is currently inactive')

    const balance = await this.getClientBalance(clientId)
    if (balance < reward.pointsRequired) {
      throw new Error(
        `Insufficient points: You have ${balance} points, but ${reward.pointsRequired} points are required.`
      )
    }

    // 1. Deduct points with immutable transaction
    await this.addTransaction({
      clientId,
      clientName,
      type: 'REDEEMED',
      points: -reward.pointsRequired,
      reason: `Redeemed for ${reward.name}`,
      referenceId: reward.id,
    })

    // 2. Generate unique voucher with validity
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (reward.validDays || 60))

    const newRedemption: RewardRedemption = {
      id: `red-${Date.now()}`,
      clientId,
      clientName,
      rewardId: reward.id,
      rewardName: reward.name,
      code: `RWD-${Math.floor(1000 + Math.random() * 9000)}`,
      type: reward.type,
      value: reward.value,
      pointsSpent: reward.pointsRequired,
      serviceId: reward.serviceId,
      serviceName: reward.serviceName,
      status: 'ACTIVE',
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    }

    const redemptions = getStoredRedemptions()
    redemptions.unshift(newRedemption)
    saveRedemptions(redemptions)

    auditLogService.log({
      action: 'PAYMENT_CREATED',
      entityType: 'payment',
      entityId: newRedemption.code,
      performedBy: clientName,
      userRole: 'customer',
      details: `Redeemed ${reward.pointsRequired} points for voucher ${newRedemption.code} (${reward.name}).`,
      amount: reward.value,
    })

    return newRedemption
  },

  async getClientVouchers(clientId: string): Promise<RewardRedemption[]> {
    if (!clientId) return []
    const ids = this.normalizeClientIds(clientId)
    const now = new Date()
    return getStoredRedemptions()
      .filter((r) => ids.includes(r.clientId))
      .map((r) => {
        // Auto mark expired if active but past expiresAt
        if (r.status === 'ACTIVE' && new Date(r.expiresAt) < now) {
          return { ...r, status: 'EXPIRED' as const }
        }
        return r
      })
  },

  async applyVoucherAtCheckout(voucherCode: string, billId: string): Promise<RewardRedemption> {
    const redemptions = getStoredRedemptions()
    const idx = redemptions.findIndex(
      (r) => r.code.toUpperCase() === voucherCode.toUpperCase().trim()
    )

    if (idx === -1) throw new Error('Voucher code is invalid')
    const voucher = redemptions[idx]

    if (voucher.status === 'USED') {
      throw new Error(`Voucher ${voucherCode} has already been redeemed`)
    }

    if (new Date(voucher.expiresAt) < new Date() || voucher.status === 'EXPIRED') {
      throw new Error(`Voucher ${voucherCode} has expired`)
    }

    const updated: RewardRedemption = {
      ...voucher,
      status: 'USED',
      usedAt: new Date().toISOString(),
      billId,
    }

    redemptions[idx] = updated
    saveRedemptions(redemptions)
    return updated
  },

  // ─── 4. REFERRALS ───
  async getAllReferrals(): Promise<Referral[]> {
    return getStoredReferrals().sort(
      (a, b) => new Date(b.referralDate).getTime() - new Date(a.referralDate).getTime()
    )
  },

  async getClientReferrals(clientId: string): Promise<Referral[]> {
    if (!clientId) return []
    const ids = this.normalizeClientIds(clientId)
    return getStoredReferrals().filter((r) => ids.includes(r.referrerId))
  },

  async getClientReferralCode(clientId: string, clientName: string): Promise<string> {
    // Generate deterministic clean uppercase code e.g. "PRIYA20"
    const firstName = clientName.split(' ')[0] || 'VIP'
    const cleanName = firstName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5)
    return `${cleanName}20`
  },

  /**
   * Applies referral code for a new customer registration or first booking.
   * Awards welcome bonus points to new customer and sets referral status to PENDING.
   */
  async applyReferralCode(params: {
    referrerCode: string
    referredClientId: string
    referredClientName: string
    referredClientPhone?: string
  }): Promise<Referral> {
    const code = params.referrerCode.trim().toUpperCase()
    const rules = getStoredRules()
    const clients = await clientService.getAll()
    const referrer = clients.find(
      (c) => (c.referralCode && c.referralCode.toUpperCase() === code) || c.id === code
    )
    const referrerId = referrer?.id || `ref-client-${code.toLowerCase()}`
    const referrerName = referrer?.fullName || `Client (${code})`

    const newReferral: Referral = {
      id: `ref-${Date.now()}`,
      referrerId,
      referrerName,
      referrerCode: code,
      referredClientId: params.referredClientId,
      referredClientName: params.referredClientName,
      referredClientPhone: params.referredClientPhone,
      referralDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      rewardIssued: false,
      rewardPointsReferrer: rules.referralRewardReferrer,
      rewardPointsReferred: rules.referralRewardReferred,
    }

    const referrals = getStoredReferrals()
    referrals.unshift(newReferral)
    saveReferrals(referrals)

    // Award welcome reward to new referred client
    if (rules.referralRewardReferred > 0) {
      await this.addTransaction({
        clientId: params.referredClientId,
        clientName: params.referredClientName,
        type: 'BONUS',
        points: rules.referralRewardReferred,
        reason: `Welcome Friend Referral Bonus (Code: ${code})`,
        referenceId: newReferral.id,
      })
    }

    return newReferral
  },

  /**
   * Called automatically when a client completes their first appointment.
   * If a pending referral exists, marks it COMPLETED and awards referrer points.
   */
  async completeReferralOnFirstAppointment(clientId: string, appointmentId: string): Promise<boolean> {
    const referrals = getStoredReferrals()
    const idx = referrals.findIndex(
      (r) => r.referredClientId === clientId && r.status === 'PENDING'
    )

    if (idx === -1) return false

    const ref = referrals[idx]
    const updatedRef: Referral = {
      ...ref,
      status: 'COMPLETED',
      rewardIssued: true,
      completedAt: new Date().toISOString(),
      firstAppointmentId: appointmentId,
    }

    referrals[idx] = updatedRef
    saveReferrals(referrals)

    // Award points to referrer
    if (ref.rewardPointsReferrer > 0) {
      await this.addTransaction({
        clientId: ref.referrerId,
        clientName: ref.referrerName,
        type: 'BONUS',
        points: ref.rewardPointsReferrer,
        reason: `Referral Completed: ${ref.referredClientName} completed their 1st appointment`,
        referenceId: appointmentId,
      })
    }

    return true
  },

  // ─── 5. POINT EARNING CALCULATOR ───
  calculatePointsForSpend(grandTotal: number, tier: string = 'Standard'): number {
    const rules = getStoredRules()
    const multiplier = rules.tierMultipliers[tier] || 1.0
    const basePoints = Math.floor(grandTotal * (rules.pointsPerRupee || 0.1))
    return Math.round(basePoints * multiplier)
  },

  async awardSpendPoints(params: {
    clientId: string
    clientName: string
    billId: string
    grandTotal: number
    membershipTier?: string
  }): Promise<number> {
    const { clientId, clientName, billId, grandTotal, membershipTier = 'Standard' } = params
    const rules = getStoredRules()

    let earned = this.calculatePointsForSpend(grandTotal, membershipTier)
    if (rules.campaignActive && rules.campaignBonusPoints > 0) {
      earned += rules.campaignBonusPoints
    }

    if (earned > 0) {
      await this.addTransaction({
        clientId,
        clientName,
        type: 'EARNED',
        points: earned,
        reason: `Points earned on salon invoice #${billId}${
          rules.campaignActive ? ` (incl. ${rules.campaignBonusPoints} bonus pts)` : ''
        }`,
        referenceId: billId,
      })
    }

    return earned
  },

  // ─── 6. DASHBOARD AGGREGATE STATS ───
  async getDashboardStats(): Promise<LoyaltyDashboardStats> {
    const txs = getStoredTransactions()
    const redemptions = getStoredRedemptions()
    const referrals = getStoredReferrals()

    const totalPointsIssued = txs
      .filter((t) => t.points > 0)
      .reduce((acc, t) => acc + t.points, 0)

    const pointsRedeemed = Math.abs(
      txs.filter((t) => t.type === 'REDEEMED').reduce((acc, t) => acc + t.points, 0)
    )

    const uniqueClients = new Set(txs.map((t) => t.clientId))
    const completedRefs = referrals.filter((r) => r.status === 'COMPLETED').length
    const pendingRefs = referrals.filter((r) => r.status === 'PENDING').length

    return {
      totalPointsIssued,
      pointsRedeemed,
      activeMembers: uniqueClients.size,
      rewardRedemptions: redemptions.length,
      totalReferrals: referrals.length,
      completedReferrals: completedRefs,
      pendingReferrals: pendingRefs,
    }
  },
}
