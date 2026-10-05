import {
  SaaSPlan,
  TenantPlanTier,
  SaaSInvoice,
  SalonSubscriptionDetails,
  SaaSPaymentMethod,
  SubscriptionWebhookEvent,
  SubscriptionEventType,
  OveragePolicy,
} from '@/types'
import { tenantService } from '@/services/tenantService'

// ============================================================================
// 1. SEED SAAS PLANS (Starter, Professional, Business, Enterprise)
// ============================================================================

export const INITIAL_SAAS_PLANS: SaaSPlan[] = [
  {
    id: 'starter',
    name: 'Starter Salon',
    price: 1999,
    priceYearly: 19990,
    billingCycle: 'both',
    description: 'Essential billing, booking, and operations for independent salons & barber shops.',
    limits: {
      branches: 1,
      staff: 5,
      clients: 1000,
      appointments: 2500,
      storageMb: 2048,
      messages: 1000,
      automations: 10,
      aiUsage: 50,
    },
    features: [
      'Single Branch Management',
      'POS Billing & GST Receipt Invoicing',
      'Appointment Scheduling Calendar',
      'Up to 5 Staff Profiles',
      'Transactional Email & SMS Alerts',
      'Daily Cash Register Closing',
    ],
    status: 'ACTIVE',
    overagePolicy: 'soft_limit',
  },
  {
    id: 'professional',
    name: 'Professional Studio',
    price: 4999,
    priceYearly: 49990,
    billingCycle: 'both',
    description: 'Advanced intelligence, automated client retention, and multi-store control.',
    limits: {
      branches: 3,
      staff: 15,
      clients: 5000,
      appointments: 10000,
      storageMb: 10240,
      messages: 5000,
      automations: 50,
      aiUsage: 500,
    },
    features: [
      'Up to 3 Branches Multi-Store',
      'AI Business Assistant & Insights',
      'Event-Driven Workflow Automations',
      'Staff Commissions & Payroll Calculator',
      'Customer Loyalty Points & Passbooks',
      'WhatsApp Business Automation Gateway',
      'Product Low-Stock Requisition Alerts',
    ],
    status: 'ACTIVE',
    overagePolicy: 'soft_limit',
    isPopular: true,
  },
  {
    id: 'business',
    name: 'Business Growth',
    price: 7499,
    priceYearly: 74990,
    billingCycle: 'both',
    description: 'High-volume salons and boutique chains requiring accelerated client acquisition.',
    limits: {
      branches: 5,
      staff: 25,
      clients: 15000,
      appointments: 25000,
      storageMb: 25600,
      messages: 15000,
      automations: 100,
      aiUsage: 1200,
    },
    features: [
      'Up to 5 Branches Across Cities',
      'Dedicated WhatsApp Verification Badge API',
      'Prepaid Service Packages & Wallet',
      'Queue Kiosk & Lounge TV Display',
      'Priority AI Copilot Query Processing',
      'Centralized Inventory Transfers',
      'Multi-Branch Consolidated Reporting',
    ],
    status: 'ACTIVE',
    overagePolicy: 'paid_overage',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Franchise',
    price: 9999,
    priceYearly: 99990,
    billingCycle: 'both',
    description: 'Uncapped scale, bespoke integrations, and dedicated account management.',
    limits: {
      branches: 10,
      staff: 50,
      clients: 50000,
      appointments: 100000,
      storageMb: 51200,
      messages: 25000,
      automations: 250,
      aiUsage: 2500,
    },
    features: [
      'Up to 10 Branches with Unlimited Extensions',
      'Custom Domain & White-Label Theming',
      'Dedicated Account Concierge Manager',
      'Consolidated P&L & Franchise Analytics',
      'Custom Webhook Subscriptions & REST APIs',
      '99.98% SLA Guaranteed Uptime',
      'Bespoke Staff Shift & Biometric Sync',
    ],
    status: 'ACTIVE',
    overagePolicy: 'paid_overage',
  },
]

// ============================================================================
// 2. SEED SAAS INVOICES (Salora to Salon Owners)
// ============================================================================

export const INITIAL_SAAS_INVOICES: SaaSInvoice[] = [
  {
    id: 'sinv-101',
    invoiceNumber: 'GLOW-INV-2026-0891',
    tenantId: 'tenant-salora',
    salonName: 'Salora Jodhpur Flagship',
    planId: 'professional',
    planName: 'Professional Studio',
    billingCycle: 'monthly',
    periodStart: '2026-09-15',
    periodEnd: '2026-10-15',
    subtotal: 4999,
    tax: 899.82, // 18% GST
    discount: 0,
    total: 5898.82,
    paymentStatus: 'PAID',
    paymentMethod: 'Visa •••• 4242',
    issuedAt: '2026-09-15T09:30:00Z',
    paidAt: '2026-09-15T09:31:14Z',
    billingEmail: 'ayaan@salora.in',
    gstNumber: '08AAAAA0000A1Z5',
  },
  {
    id: 'sinv-102',
    invoiceNumber: 'GLOW-INV-2026-0784',
    tenantId: 'tenant-salora',
    salonName: 'Salora Jodhpur Flagship',
    planId: 'professional',
    planName: 'Professional Studio',
    billingCycle: 'monthly',
    periodStart: '2026-08-15',
    periodEnd: '2026-09-15',
    subtotal: 4999,
    tax: 899.82,
    discount: 0,
    total: 5898.82,
    paymentStatus: 'PAID',
    paymentMethod: 'Visa •••• 4242',
    issuedAt: '2026-08-15T09:30:00Z',
    paidAt: '2026-08-15T09:32:05Z',
    billingEmail: 'ayaan@salora.in',
    gstNumber: '08AAAAA0000A1Z5',
  },
  {
    id: 'sinv-103',
    invoiceNumber: 'GLOW-INV-2026-0912',
    tenantId: 'tenant-luxeglow',
    salonName: 'Luxe Glow Lounge Jaipur',
    planId: 'enterprise',
    planName: 'Enterprise Franchise',
    billingCycle: 'monthly',
    periodStart: '2026-09-01',
    periodEnd: '2026-10-01',
    subtotal: 9999,
    tax: 1799.82,
    discount: 0,
    total: 11798.82,
    paymentStatus: 'PAID',
    paymentMethod: 'Mastercard •••• 8821',
    issuedAt: '2026-09-01T10:00:00Z',
    paidAt: '2026-09-01T10:02:18Z',
    billingEmail: 'ananya@luxeglow.in',
    gstNumber: '08BBBBB1111B2Z4',
  },
  {
    id: 'sinv-104',
    invoiceNumber: 'GLOW-INV-2026-0940',
    tenantId: 'tenant-aurasalon',
    salonName: 'Aura Unisex Salon Udaipur',
    planId: 'starter',
    planName: 'Starter Salon',
    billingCycle: 'monthly',
    periodStart: '2026-09-10',
    periodEnd: '2026-10-10',
    subtotal: 1999,
    tax: 359.82,
    discount: 0,
    total: 2358.82,
    paymentStatus: 'FAILED',
    paymentMethod: 'UPI •••• 1920',
    issuedAt: '2026-09-10T08:00:00Z',
    billingEmail: 'vikram@aurasalon.com',
  },
]

// ============================================================================
// 3. SEED PAYMENT METHODS
// ============================================================================

export const INITIAL_PAYMENT_METHODS: Record<string, SaaSPaymentMethod> = {
  'tenant-salora': {
    id: 'pm-glow-1',
    tenantId: 'tenant-salora',
    type: 'card',
    brand: 'Visa',
    last4: '4242',
    expMonth: 8,
    expYear: 2028,
    isDefault: true,
  },
  'tenant-luxeglow': {
    id: 'pm-lux-1',
    tenantId: 'tenant-luxeglow',
    type: 'card',
    brand: 'Mastercard',
    last4: '8821',
    expMonth: 12,
    expYear: 2029,
    isDefault: true,
  },
  'tenant-aurasalon': {
    id: 'pm-aura-1',
    tenantId: 'tenant-aurasalon',
    type: 'upi',
    upiId: 'vikram.rathore@okhdfcbank',
    isDefault: true,
  },
}

// ============================================================================
// 4. SEED WEBHOOK EVENTS
// ============================================================================

export const INITIAL_WEBHOOK_EVENTS: SubscriptionWebhookEvent[] = [
  {
    id: 'evt-sub-1',
    event: 'invoice.paid',
    tenantId: 'tenant-salora',
    tenantName: 'Salora Jodhpur Flagship',
    timestamp: '2026-09-15T09:31:14Z',
    data: { invoiceNumber: 'GLOW-INV-2026-0891', amount: 5898.82, plan: 'professional' },
    delivered: true,
  },
  {
    id: 'evt-sub-2',
    event: 'subscription.updated',
    tenantId: 'tenant-luxeglow',
    tenantName: 'Luxe Glow Lounge Jaipur',
    timestamp: '2026-09-01T10:00:00Z',
    data: { previousPlan: 'professional', newPlan: 'enterprise', mrr: 9999 },
    delivered: true,
  },
  {
    id: 'evt-sub-3',
    event: 'subscription.past_due',
    tenantId: 'tenant-aurasalon',
    tenantName: 'Aura Unisex Salon Udaipur',
    timestamp: '2026-09-12T00:00:00Z',
    data: { invoiceNumber: 'GLOW-INV-2026-0940', reason: 'Card declined / UPI mandate failed' },
    delivered: true,
  },
]

// ============================================================================
// 5. SAAS BILLING SERVICE CLASS
// ============================================================================

const STORAGE_KEY_PLANS = 'SALORA_saas_plans'
const STORAGE_KEY_INVOICES = 'SALORA_saas_invoices'
const STORAGE_KEY_WEBHOOKS = 'SALORA_saas_webhooks'
const STORAGE_KEY_SUBSCRIPTIONS = 'SALORA_salon_subscriptions'

class SaasBillingService {
  private plans: SaaSPlan[] = []
  private invoices: SaaSInvoice[] = []
  private webhookEvents: SubscriptionWebhookEvent[] = []
  private paymentMethods: Record<string, SaaSPaymentMethod> = { ...INITIAL_PAYMENT_METHODS }

  constructor() {
    this.loadState()
  }

  private loadState() {
    if (typeof window === 'undefined') {
      this.plans = [...INITIAL_SAAS_PLANS]
      this.invoices = [...INITIAL_SAAS_INVOICES]
      this.webhookEvents = [...INITIAL_WEBHOOK_EVENTS]
      return
    }

    try {
      const storedPlans = localStorage.getItem(STORAGE_KEY_PLANS)
      this.plans = storedPlans ? JSON.parse(storedPlans) : [...INITIAL_SAAS_PLANS]

      const storedInvoices = localStorage.getItem(STORAGE_KEY_INVOICES)
      this.invoices = storedInvoices ? JSON.parse(storedInvoices) : [...INITIAL_SAAS_INVOICES]

      const storedWebhooks = localStorage.getItem(STORAGE_KEY_WEBHOOKS)
      this.webhookEvents = storedWebhooks ? JSON.parse(storedWebhooks) : [...INITIAL_WEBHOOK_EVENTS]
    } catch (e) {
      console.error('Failed to load SaaS billing state from localStorage', e)
      this.plans = [...INITIAL_SAAS_PLANS]
      this.invoices = [...INITIAL_SAAS_INVOICES]
      this.webhookEvents = [...INITIAL_WEBHOOK_EVENTS]
    }
  }

  private persist() {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(this.plans))
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(this.invoices))
      localStorage.setItem(STORAGE_KEY_WEBHOOKS, JSON.stringify(this.webhookEvents))
    } catch (e) {
      console.error('Failed to persist SaaS billing state', e)
    }
  }

  // --- Plan Management (Section 1 & 2) ---
  getAllPlans(): SaaSPlan[] {
    return [...this.plans]
  }

  getPlanById(id: string): SaaSPlan | undefined {
    return this.plans.find((p) => p.id === id)
  }

  updatePlan(id: string, updates: Partial<SaaSPlan>): SaaSPlan {
    const index = this.plans.findIndex((p) => p.id === id)
    if (index === -1) throw new Error(`Plan ${id} not found`)

    this.plans[index] = {
      ...this.plans[index],
      ...updates,
      limits: {
        ...this.plans[index].limits,
        ...(updates.limits || {}),
      },
    }

    this.persist()
    return this.plans[index]
  }

  // --- Salon Owner Subscription Details (Section 3 & 5) ---
  getSubscriptionDetails(tenantId: string): SalonSubscriptionDetails {
    const tenant = tenantService.getTenantById(tenantId) || tenantService.getCurrentTenant()
    const plan = this.getPlanById(tenant.planId) || this.plans[1]
    const paymentMethod = this.paymentMethods[tenantId] || {
      id: `pm-${tenantId}`,
      tenantId,
      type: 'card',
      brand: 'Visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2028,
      isDefault: true,
    }

    // Determine status from tenant
    let status: SalonSubscriptionDetails['status'] = 'ACTIVE'
    if (tenant.status === 'TRIAL' || tenant.subscriptionStatus === 'trialing') {
      status = 'TRIAL'
    } else if (tenant.status === 'SUSPENDED' || tenant.subscriptionStatus === 'past_due') {
      status = 'PAST_DUE'
    } else if (tenant.subscriptionStatus === 'cancelled') {
      status = 'CANCELLED'
    }

    const today = new Date()
    const nextBilling = new Date(today.getFullYear(), today.getMonth() + 1, 15).toISOString().split('T')[0]
    const trialEnds = status === 'TRIAL' ? new Date(today.getTime() + 11 * 86400000).toISOString().split('T')[0] : undefined

    return {
      tenantId: tenant.id,
      planId: plan.id,
      planName: plan.name,
      status,
      billingCycle: tenant.billingCycle || 'monthly',
      currentPeriodStart: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
      currentPeriodEnd: nextBilling,
      nextBillingDate: nextBilling,
      trialEndsAt: trialEnds,
      daysLeftInTrial: status === 'TRIAL' ? 11 : undefined,
      cancelAtPeriodEnd: false,
      paymentMethod,
    }
  }

  // --- Change Plan (Upgrade / Downgrade) (Section 3 & 4) ---
  changePlan(
    tenantId: string,
    targetPlanId: TenantPlanTier,
    billingCycle: 'monthly' | 'annually' = 'monthly'
  ): { subscription: SalonSubscriptionDetails; invoice: SaaSInvoice } {
    const targetPlan = this.getPlanById(targetPlanId)
    if (!targetPlan) throw new Error(`Target plan ${targetPlanId} not found`)

    const tenant = tenantService.getTenantById(tenantId) || tenantService.getCurrentTenant()
    const previousPlanId = tenant.planId

    // 1. Update Tenant in tenantService
    const price = billingCycle === 'annually' ? Math.round(targetPlan.priceYearly / 12) : targetPlan.price
    tenant.planId = targetPlanId
    tenant.mrrAmount = price
    tenant.billingCycle = billingCycle
    tenant.status = 'ACTIVE'
    tenant.subscriptionStatus = 'active'

    // 2. Generate Immediate Invoice for the transaction
    const subtotal = billingCycle === 'annually' ? targetPlan.priceYearly : targetPlan.price
    const tax = Math.round(subtotal * 0.18 * 100) / 100
    const invoice: SaaSInvoice = {
      id: `sinv-${Date.now()}`,
      invoiceNumber: `GLOW-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      tenantId: tenant.id,
      salonName: tenant.name,
      planId: targetPlanId,
      planName: targetPlan.name,
      billingCycle,
      periodStart: new Date().toISOString().split('T')[0],
      periodEnd: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      subtotal,
      tax,
      discount: billingCycle === 'annually' ? targetPlan.price * 2 : 0,
      total: Math.round((subtotal + tax) * 100) / 100,
      paymentStatus: 'PAID',
      paymentMethod: this.paymentMethods[tenantId]?.brand
        ? `${this.paymentMethods[tenantId].brand} •••• ${this.paymentMethods[tenantId].last4}`
        : 'Visa •••• 4242',
      issuedAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      billingEmail: tenant.ownerEmail,
      gstNumber: '08AAAAA0000A1Z5',
    }

    this.invoices.unshift(invoice)

    // 3. Dispatch Webhook Event (Section 10)
    this.dispatchWebhookEvent('subscription.updated', tenantId, {
      previousPlan: previousPlanId,
      newPlan: targetPlanId,
      billingCycle,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.total,
    })

    this.dispatchWebhookEvent('invoice.paid', tenantId, {
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
    })

    this.persist()

    const updatedSubscription = this.getSubscriptionDetails(tenantId)
    return { subscription: updatedSubscription, invoice }
  }

  // --- Cancel Subscription (Section 3 & 5) ---
  cancelSubscription(tenantId: string, reason: string): SalonSubscriptionDetails {
    const tenant = tenantService.getTenantById(tenantId) || tenantService.getCurrentTenant()
    tenant.subscriptionStatus = 'cancelled'

    this.dispatchWebhookEvent('subscription.cancelled', tenantId, {
      cancellationReason: reason,
      effectiveDate: new Date().toISOString(),
    })

    this.persist()
    return this.getSubscriptionDetails(tenantId)
  }

  // --- Change Billing Cycle (Monthly <-> Annually) ---
  changeBillingCycle(tenantId: string, cycle: 'monthly' | 'annually'): SalonSubscriptionDetails {
    const tenant = tenantService.getTenantById(tenantId) || tenantService.getCurrentTenant()
    const plan = this.getPlanById(tenant.planId) || this.plans[1]

    tenant.billingCycle = cycle
    tenant.mrrAmount = cycle === 'annually' ? Math.round(plan.priceYearly / 12) : plan.price

    this.dispatchWebhookEvent('subscription.updated', tenantId, {
      billingCycle: cycle,
      mrrAmount: tenant.mrrAmount,
    })

    this.persist()
    return this.getSubscriptionDetails(tenantId)
  }

  // --- Invoices Queries (Section 8) ---
  getInvoicesForTenant(tenantId: string): SaaSInvoice[] {
    return this.invoices.filter((inv) => inv.tenantId === tenantId)
  }

  getAllInvoices(): SaaSInvoice[] {
    return [...this.invoices]
  }

  getInvoiceById(id: string): SaaSInvoice | undefined {
    return this.invoices.find((inv) => inv.id === id || inv.invoiceNumber === id)
  }

  // --- Payment Method Management (Section 9) ---
  updatePaymentMethod(tenantId: string, method: Partial<SaaSPaymentMethod>): SaaSPaymentMethod {
    const existing = this.paymentMethods[tenantId] || {
      id: `pm-${tenantId}`,
      tenantId,
      type: 'card',
      isDefault: true,
    }

    const updated: SaaSPaymentMethod = {
      ...existing,
      ...method,
    }

    this.paymentMethods[tenantId] = updated
    return updated
  }

  // --- Webhook Dispatcher & Audit Log (Section 10) ---
  dispatchWebhookEvent(event: SubscriptionEventType, tenantId: string, data: Record<string, any>): SubscriptionWebhookEvent {
    const tenant = tenantService.getTenantById(tenantId)
    const webhookItem: SubscriptionWebhookEvent = {
      id: `evt-sub-${Date.now()}`,
      event,
      tenantId,
      tenantName: tenant?.name || 'Salon Workspace',
      timestamp: new Date().toISOString(),
      data,
      delivered: true,
    }

    this.webhookEvents.unshift(webhookItem)
    this.persist()
    return webhookItem
  }

  getWebhookEvents(): SubscriptionWebhookEvent[] {
    return [...this.webhookEvents]
  }
}

export const saasBillingService = new SaasBillingService()
