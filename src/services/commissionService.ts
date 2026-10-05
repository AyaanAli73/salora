import {
  CommissionRule,
  CommissionRuleScope,
  CommissionRuleType,
  StaffCommissionItem,
  StaffCommissionSummary,
  Bill,
  Appointment,
} from '@/types'
import { billingService } from './billingService'
import { appointmentService } from './appointmentService'
import { staffService } from './staffService'
import { auditLogService } from './auditLogService'

const STORAGE_KEY = 'SALORA_commission_rules'

// Clear mock commission rules from localStorage if present
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && (raw.includes('crule-') || raw.includes('Marcus'))) {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {}
}

function getStoredRules(): CommissionRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Error reading commission rules from localStorage:', err)
  }
  return []
}

function saveStoredRules(rules: CommissionRule[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
  } catch (err) {
    console.warn('Error saving commission rules to localStorage:', err)
  }
}

export const commissionService = {
  // ==========================================
  // 1. RULES MANAGEMENT
  // ==========================================

  getRules(): CommissionRule[] {
    return getStoredRules().sort((a, b) => a.priority - b.priority)
  },

  getRuleById(id: string): CommissionRule | undefined {
    return this.getRules().find((r) => r.id === id)
  },

  createRule(
    ruleData: Omit<CommissionRule, 'id' | 'createdAt'>,
    performedBy = 'Owner'
  ): CommissionRule {
    const rules = this.getRules()
    const newRule: CommissionRule = {
      ...ruleData,
      id: `crule-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }

    const updated = [...rules, newRule]
    saveStoredRules(updated)

    auditLogService.log({
      action: 'COMMISSION_RULE_CREATED',
      entityType: 'commission_rule',
      entityId: newRule.id,
      performedBy,
      userRole: 'owner',
      details: `Created ${newRule.scope} commission rule "${newRule.name}" (${newRule.ruleType}: ${newRule.value}${
        newRule.ruleType === 'PERCENTAGE' ? '%' : ' INR'
      }).`,
    })

    return newRule
  },

  updateRule(
    id: string,
    updates: Partial<CommissionRule>,
    performedBy = 'Ayaan (Owner)'
  ): CommissionRule {
    const rules = this.getRules()
    const idx = rules.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Commission rule not found')

    const updated = { ...rules[idx], ...updates }
    rules[idx] = updated
    saveStoredRules(rules)

    auditLogService.log({
      action: 'COMMISSION_RULE_CREATED',
      entityType: 'commission_rule',
      entityId: updated.id,
      performedBy,
      userRole: 'owner',
      details: `Updated commission rule "${updated.name}".`,
    })

    return updated
  },

  deleteRule(id: string): boolean {
    const rules = this.getRules()
    const filtered = rules.filter((r) => r.id !== id)
    saveStoredRules(filtered)
    return true
  },

  // ==========================================
  // 2. DETERMINISTIC RULE HIERARCHY
  // Priority: Staff-specific (1) -> Service-specific (2) -> Category (3) -> Default (4)
  // ==========================================

  findApplicableRule(
    staffId: string,
    serviceId?: string,
    serviceCategory?: string
  ): { rule: CommissionRule; effectiveScope: CommissionRuleScope } {
    const activeRules = this.getRules().filter((r) => r.isActive)

    // 1. Staff-specific rule (Highest Priority)
    const staffRule = activeRules.find((r) => {
      if (r.scope !== 'STAFF_SPECIFIC') return false
      if (r.staffId !== staffId) return false
      if (r.serviceId && serviceId && r.serviceId !== serviceId) return false
      if (
        r.serviceCategory &&
        serviceCategory &&
        r.serviceCategory.toLowerCase() !== serviceCategory.toLowerCase()
      ) {
        return false
      }
      return true
    })
    if (staffRule) {
      return { rule: staffRule, effectiveScope: 'STAFF_SPECIFIC' }
    }

    // 2. Service-specific rule
    if (serviceId) {
      const serviceRule = activeRules.find(
        (r) => r.scope === 'SERVICE_SPECIFIC' && r.serviceId === serviceId
      )
      if (serviceRule) {
        return { rule: serviceRule, effectiveScope: 'SERVICE_SPECIFIC' }
      }
    }

    // 3. Category rule
    if (serviceCategory) {
      const categoryRule = activeRules.find(
        (r) =>
          r.scope === 'CATEGORY' &&
          r.serviceCategory?.toLowerCase() === serviceCategory.toLowerCase()
      )
      if (categoryRule) {
        return { rule: categoryRule, effectiveScope: 'CATEGORY' }
      }
    }

    // 4. Salon Default rule
    const defaultRule = activeRules.find((r) => r.scope === 'DEFAULT')
    if (defaultRule) {
      return { rule: defaultRule, effectiveScope: 'DEFAULT' }
    }

    // Fallback baseline rule if no default in storage
    const fallbackRule: CommissionRule = {
      id: 'fallback-default',
      name: 'Standard Salon Base Commission (15%)',
      scope: 'DEFAULT',
      ruleType: 'PERCENTAGE',
      value: 15,
      isActive: true,
      priority: 4,
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    return { rule: fallbackRule, effectiveScope: 'DEFAULT' }
  },

  calculateItemCommission(
    itemPrice: number,
    rule: CommissionRule
  ): number {
    if (itemPrice <= 0) return 0
    if (rule.ruleType === 'PERCENTAGE') {
      return Math.round((itemPrice * (rule.value / 100)) * 100) / 100
    }
    if (rule.ruleType === 'FIXED_PER_SERVICE') {
      return Math.min(itemPrice, rule.value)
    }
    return 0
  },

  // ==========================================
  // 3. COMMISSION CALCULATION FOR PAYROLL PERIOD
  // Strictly EXCLUDES:
  // - Cancelled appointments & cancelled bills
  // - Unpaid bills
  // - Refunded transactions
  // ==========================================

  async calculateStaffCommissionForPeriod(
    staffId: string,
    periodStart: string, // YYYY-MM-DD
    periodEnd: string // YYYY-MM-DD
  ): Promise<StaffCommissionSummary> {
    const staff = await staffService.getById(staffId)
    const staffName = staff ? staff.name : 'Unknown Specialist'

    const items: StaffCommissionItem[] = []
    let totalEligibleRevenue = 0
    let totalCommissionEarned = 0

    // 1. Fetch all bills from billing service
    let allBills: Bill[] = []
    try {
      allBills = await billingService.getAllBills()
    } catch {
      allBills = []
    }

    // Filter bills in date range
    const periodBills = allBills.filter((b) => {
      const billDate = b.createdAt ? b.createdAt.split('T')[0] : ''
      return billDate >= periodStart && billDate <= periodEnd
    })

    // Process each bill
    for (const bill of periodBills) {
      // RULE 4: Strict eligibility exclusions
      if (bill.status === 'cancelled') continue
      if (bill.paymentStatus === 'UNPAID') continue
      if (bill.paymentStatus === 'REFUNDED') continue

      // Calculate effective refund multiplier if partial refund occurred
      const refundRatio =
        bill.refundedAmount && bill.grandTotal > 0
          ? Math.max(0, 1 - bill.refundedAmount / bill.grandTotal)
          : 1

      // Scan bill items for this staff member
      for (const item of bill.items) {
        // Staff attribution: item-level specialist or bill-level specialist
        const itemStaffId = item.staffId || bill.staffId
        if (itemStaffId !== staffId) continue

        const netEligibleAmount = Math.round(item.total * refundRatio * 100) / 100
        if (netEligibleAmount <= 0) continue

        // Determine category (default to Hair or General if not explicit)
        const category = item.type === 'service' ? 'Hair' : 'Retail'

        // Resolve deterministic rule
        const { rule, effectiveScope } = this.findApplicableRule(
          staffId,
          item.id,
          category
        )

        const commAmount = this.calculateItemCommission(netEligibleAmount, rule)

        const commItem: StaffCommissionItem = {
          id: `comm-item-${bill.id}-${item.id}`,
          transactionId: bill.id,
          transactionNumber: bill.invoiceNumber || `INV-${bill.id.slice(-6)}`,
          transactionDate: bill.createdAt.split('T')[0],
          staffId,
          staffName,
          clientName: bill.clientName,
          serviceId: item.id,
          serviceName: item.name,
          serviceCategory: category,
          servicePrice: item.total,
          netEligibleAmount,
          appliedRuleScope: effectiveScope,
          appliedRuleName: rule.name,
          ruleType: rule.ruleType,
          ruleValue: rule.value,
          commissionAmount: commAmount,
          isEligible: true,
        }

        items.push(commItem)
        totalEligibleRevenue += netEligibleAmount
        totalCommissionEarned += commAmount
      }
    }

    // 2. Fetch completed appointments that may have been settled outside POS bills
    let allAppointments: Appointment[] = []
    try {
      allAppointments = await appointmentService.getByStaffId(staffId)
    } catch {
      allAppointments = []
    }

    const eligibleAppointments = allAppointments.filter((appt) => {
      if (appt.date < periodStart || appt.date > periodEnd) return false
      // EXCLUDE cancelled, no-show, or unpaid appointments
      if (appt.status === 'cancelled' || appt.status === 'no-show') return false
      if (appt.paymentStatus === 'unpaid' || appt.paymentStatus === 'refunded') return false
      // Only include completed appointments
      return appt.status === 'completed'
    })

    // Avoid double counting if appointment was already processed in a bill
    const processedApptIds = new Set(periodBills.map((b) => b.appointmentId).filter(Boolean))

    for (const appt of eligibleAppointments) {
      if (processedApptIds.has(appt.id)) continue

      const netEligibleAmount = appt.price || 0
      if (netEligibleAmount <= 0) continue

      const category = 'Hair'
      const { rule, effectiveScope } = this.findApplicableRule(
        staffId,
        appt.serviceId,
        category
      )

      const commAmount = this.calculateItemCommission(netEligibleAmount, rule)

      const commItem: StaffCommissionItem = {
        id: `comm-appt-${appt.id}`,
        transactionId: appt.id,
        transactionNumber: `APPT-${appt.id.slice(-6).toUpperCase()}`,
        transactionDate: appt.date,
        staffId,
        staffName,
        clientName: appt.clientName,
        serviceId: appt.serviceId,
        serviceName: appt.serviceName,
        serviceCategory: category,
        servicePrice: appt.price,
        netEligibleAmount,
        appliedRuleScope: effectiveScope,
        appliedRuleName: rule.name,
        ruleType: rule.ruleType,
        ruleValue: rule.value,
        commissionAmount: commAmount,
        isEligible: true,
      }

      items.push(commItem)
      totalEligibleRevenue += netEligibleAmount
      totalCommissionEarned += commAmount
    }

    // Fallback: If no live bills/appointments exist in localStorage yet, use default monthly base commission estimate
    if (items.length === 0 && staff && staff.monthlyRevenue > 0) {
      const defaultRate = staff.commissionRate || 15
      const estimatedCommission = Math.round((staff.monthlyRevenue * (defaultRate / 100)) * 10) / 10
      totalEligibleRevenue = staff.monthlyRevenue
      totalCommissionEarned = estimatedCommission

      items.push({
        id: `comm-est-${staffId}`,
        transactionId: `tx-period-${periodStart}`,
        transactionNumber: `AGG-${periodStart.slice(0, 7)}`,
        transactionDate: periodEnd,
        staffId,
        staffName,
        serviceName: 'Accumulated Eligible Salon Treatments',
        serviceCategory: 'Hair & Spa',
        servicePrice: staff.monthlyRevenue,
        netEligibleAmount: staff.monthlyRevenue,
        appliedRuleScope: 'DEFAULT',
        appliedRuleName: `${staff.name} Base Commission (${defaultRate}%)`,
        ruleType: 'PERCENTAGE',
        ruleValue: defaultRate,
        commissionAmount: estimatedCommission,
        isEligible: true,
      })
    }

    return {
      staffId,
      staffName,
      periodStart,
      periodEnd,
      totalEligibleRevenue: Math.round(totalEligibleRevenue * 100) / 100,
      totalCommissionEarned: Math.round(totalCommissionEarned * 100) / 100,
      completedServicesCount: items.length,
      items: items.sort((a, b) => (a.transactionDate > b.transactionDate ? -1 : 1)),
    }
  },
}
