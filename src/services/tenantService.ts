import {
  Tenant,
  TenantStatus,
  TenantPlanTier,
  OrganizationMember,
  TenantUsageMetrics,
  SuperAdminPlan,
  SuperAdminAuditLog,
  SupportSession,
  Client,
} from '@/types'

// ============================================================================
// 1. SEED TENANTS
// ============================================================================

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-salora',
    name: 'Salora Jodhpur Flagship',
    slug: 'salora-jodhpur',
    logo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=120&auto=format&fit=crop&q=80',
    ownerId: 'user-1',
    ownerName: 'Ayaan Khan',
    ownerEmail: 'ayaan@salora.in',
    planId: 'professional',
    status: 'ACTIVE',
    createdAt: '2025-08-15',
    subscriptionStatus: 'active',
    branchesCount: 2,
    usersCount: 8,
    primaryCity: 'Jodhpur',
    primaryState: 'Rajasthan',
    currency: 'INR',
    mrrAmount: 4999,
    billingCycle: 'monthly',
    renewalDate: '2026-10-15',
    features: [
      'Multi-branch management',
      'AI Business Assistant',
      'WhatsApp automations',
      'Inventory reorder alerts',
      'Staff commissions & payroll',
    ],
  },
  {
    id: 'tenant-luxeglow',
    name: 'Luxe Glow Lounge Jaipur',
    slug: 'luxe-glow-jaipur',
    logo: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=120&auto=format&fit=crop&q=80',
    ownerId: 'user-2',
    ownerName: 'Ananya Singhania',
    ownerEmail: 'ananya@luxeglow.in',
    planId: 'enterprise',
    status: 'ACTIVE',
    createdAt: '2025-11-01',
    subscriptionStatus: 'active',
    branchesCount: 3,
    usersCount: 16,
    primaryCity: 'Jaipur',
    primaryState: 'Rajasthan',
    currency: 'INR',
    mrrAmount: 9999,
    billingCycle: 'monthly',
    renewalDate: '2026-11-01',
    features: [
      'Enterprise multi-branch',
      'Priority AI Copilot',
      'Custom SMS Gateway',
      'Dedicated Account Manager',
      'API & Webhooks',
    ],
  },
  {
    id: 'tenant-aurasalon',
    name: 'Aura Unisex Salon Udaipur',
    slug: 'aura-salon-udaipur',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=120&auto=format&fit=crop&q=80',
    ownerId: 'user-3',
    ownerName: 'Vikram Rathore',
    ownerEmail: 'vikram@aurasalon.com',
    planId: 'starter',
    status: 'SUSPENDED',
    createdAt: '2026-01-10',
    subscriptionStatus: 'past_due',
    branchesCount: 1,
    usersCount: 4,
    primaryCity: 'Udaipur',
    primaryState: 'Rajasthan',
    currency: 'INR',
    mrrAmount: 1999,
    billingCycle: 'monthly',
    renewalDate: '2026-09-10',
    features: ['Single-branch essentials', 'Appointment booking', 'Basic POS billing'],
  },
  {
    id: 'tenant-velvetcrown',
    name: 'Velvet Crown Beauty Delhi',
    slug: 'velvet-crown-delhi',
    logo: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=120&auto=format&fit=crop&q=80',
    ownerId: 'user-4',
    ownerName: 'Meera Kapoor',
    ownerEmail: 'meera@velvetcrown.com',
    planId: 'professional',
    status: 'ACTIVE',
    createdAt: '2026-03-20',
    subscriptionStatus: 'active',
    branchesCount: 2,
    usersCount: 10,
    primaryCity: 'New Delhi',
    primaryState: 'Delhi',
    currency: 'INR',
    mrrAmount: 4999,
    billingCycle: 'monthly',
    renewalDate: '2026-10-20',
    features: ['Multi-branch management', 'AI Assistant', 'Client Loyalty & Packages'],
  },
  {
    id: 'tenant-serenespa',
    name: 'Serene Oasis Spa Mumbai',
    slug: 'serene-oasis-mumbai',
    logo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&auto=format&fit=crop&q=80',
    ownerId: 'user-5',
    ownerName: 'Rohan Mehra',
    ownerEmail: 'rohan@sereneoasis.in',
    planId: 'enterprise',
    status: 'TRIAL',
    createdAt: '2026-09-12',
    subscriptionStatus: 'trialing',
    branchesCount: 1,
    usersCount: 6,
    primaryCity: 'Mumbai',
    primaryState: 'Maharashtra',
    currency: 'INR',
    mrrAmount: 0,
    billingCycle: 'monthly',
    renewalDate: '2026-10-12',
    features: ['Enterprise trial evaluation', 'Unlimited services', 'Staff shifts & attendance'],
  },
]

// ============================================================================
// 2. SEED USAGE METRICS (Tenant-Scoped)
// ============================================================================

export const INITIAL_USAGE_METRICS: Record<string, TenantUsageMetrics> = {
  'tenant-salora': {
    tenantId: 'tenant-salora',
    clients: { current: 1248, limit: 5000 },
    appointments: { current: 489, limit: 2500 },
    staff: { current: 8, limit: 15 },
    branches: { current: 2, limit: 3 },
    storageMb: { current: 2180, limit: 10240 },
    messagesSent: { current: 1820, limit: 5000 },
    aiQueries: { current: 142, limit: 500 },
    automations: { current: 7, limit: 25 },
    lastCalculatedAt: new Date().toISOString(),
  },
  'tenant-luxeglow': {
    tenantId: 'tenant-luxeglow',
    clients: { current: 4120, limit: 25000 },
    appointments: { current: 1840, limit: 10000 },
    staff: { current: 16, limit: 50 },
    branches: { current: 3, limit: 10 },
    storageMb: { current: 12400, limit: 51200 },
    messagesSent: { current: 8490, limit: 25000 },
    aiQueries: { current: 874, limit: 2500 },
    automations: { current: 18, limit: 100 },
    lastCalculatedAt: new Date().toISOString(),
  },
  'tenant-aurasalon': {
    tenantId: 'tenant-aurasalon',
    clients: { current: 620, limit: 1000 },
    appointments: { current: 145, limit: 500 },
    staff: { current: 4, limit: 5 },
    branches: { current: 1, limit: 1 },
    storageMb: { current: 840, limit: 2048 },
    messagesSent: { current: 420, limit: 1000 },
    aiQueries: { current: 12, limit: 50 },
    automations: { current: 2, limit: 5 },
    lastCalculatedAt: new Date().toISOString(),
  },
}

// ============================================================================
// 3. SEED SUPER ADMIN PLANS
// ============================================================================

export const SUPER_ADMIN_PLANS: SuperAdminPlan[] = [
  {
    id: 'starter',
    name: 'Starter Salon',
    priceMonthly: 1999,
    priceYearly: 19990,
    clientLimit: 1000,
    staffLimit: 5,
    branchLimit: 1,
    storageLimitMb: 2048,
    messagesLimit: 1000,
    aiQueriesLimit: 50,
    features: [
      'Single Branch Management',
      'POS Billing & GST Invoicing',
      'Appointment Scheduling',
      'Up to 5 Staff Profiles',
      'Standard Email & SMS Reminders',
    ],
  },
  {
    id: 'professional',
    name: 'Professional Studio',
    priceMonthly: 4999,
    priceYearly: 49990,
    clientLimit: 5000,
    staffLimit: 15,
    branchLimit: 3,
    storageLimitMb: 10240,
    messagesLimit: 5000,
    aiQueriesLimit: 500,
    features: [
      'Up to 3 Branches Multi-Store',
      'AI Business Assistant & Insights',
      'Event-Driven Workflow Automations',
      'Staff Commissions & Daily Closing',
      'Customer Loyalty & Membership Passes',
      'WhatsApp Business Automation',
    ],
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Franchise',
    priceMonthly: 9999,
    priceYearly: 99990,
    clientLimit: 25000,
    staffLimit: 50,
    branchLimit: 10,
    storageLimitMb: 51200,
    messagesLimit: 25000,
    aiQueriesLimit: 2500,
    features: [
      'Up to 10 Branches Across Cities',
      'Custom Domain & White-label Brand',
      'High-Priority AI Copilot Engine',
      'Dedicated Account Concierge',
      'Consolidated P&L & Group Analytics',
      'Custom Webhooks & REST API Access',
    ],
  },
]

// ============================================================================
// 4. SEED SUPER ADMIN AUDIT LOGS
// ============================================================================

export const INITIAL_SUPER_ADMIN_AUDIT_LOGS: SuperAdminAuditLog[] = [
  {
    id: 'audit-sa-1',
    timestamp: '2026-09-27T10:15:22.000Z',
    superAdminId: 'sa-001',
    superAdminName: 'Salora Operations Admin',
    action: 'SUPPORT_IMPERSONATION',
    category: 'impersonation',
    targetTenantId: 'tenant-luxeglow',
    targetTenantName: 'Luxe Glow Lounge Jaipur',
    ipAddress: '103.24.88.12',
    details: 'Initiated 30-minute diagnostic support session (Ticket #TICK-8924: Payment Webhook sync check)',
    severity: 'warning',
  },
  {
    id: 'audit-sa-2',
    timestamp: '2026-09-26T16:40:10.000Z',
    superAdminId: 'sa-001',
    superAdminName: 'Salora Operations Admin',
    action: 'TENANT_STATUS_SUSPENDED',
    category: 'organization',
    targetTenantId: 'tenant-aurasalon',
    targetTenantName: 'Aura Unisex Salon Udaipur',
    ipAddress: '103.24.88.12',
    details: 'Tenant marked SUSPENDED after 15 days past due renewal notice',
    severity: 'critical',
  },
  {
    id: 'audit-sa-3',
    timestamp: '2026-09-25T11:05:00.000Z',
    superAdminId: 'sa-001',
    superAdminName: 'Salora Operations Admin',
    action: 'PLAN_UPGRADE',
    category: 'subscription',
    targetTenantId: 'tenant-luxeglow',
    targetTenantName: 'Luxe Glow Lounge Jaipur',
    ipAddress: '103.24.88.12',
    details: 'Upgraded subscription tier from Professional to Enterprise (3rd branch added)',
    severity: 'info',
  },
  {
    id: 'audit-sa-4',
    timestamp: '2026-09-24T08:30:19.000Z',
    superAdminId: 'sa-002',
    superAdminName: 'DevOps Security Lead',
    action: 'SYSTEM_BACKUP_VERIFIED',
    category: 'system',
    ipAddress: '192.168.1.100',
    details: 'Automated multi-tenant database replica snapshot completed and sha256 verified (42.8 GB)',
    severity: 'info',
  },
]

// ============================================================================
// 5. SEED MEMBERSHIPS
// ============================================================================

export const INITIAL_MEMBERSHIPS: OrganizationMember[] = [
  {
    id: 'mem-1',
    userId: 'user-1',
    userName: 'Ayaan Khan',
    userEmail: 'ayaan@salora.in',
    tenantId: 'tenant-salora',
    tenantName: 'Salora Jodhpur Flagship',
    role: 'owner',
    permissions: [
      'view:dashboard',
      'manage:clients',
      'manage:appointments',
      'manage:services',
      'manage:staff',
      'manage:inventory',
      'manage:billing',
      'manage:expenses',
      'view:reports',
      'manage:settings',
    ],
    status: 'active',
    joinedAt: '2025-08-15',
  },
  {
    id: 'mem-2',
    userId: 'user-1',
    userName: 'Ayaan Khan',
    userEmail: 'ayaan@salora.in',
    tenantId: 'tenant-luxeglow',
    tenantName: 'Luxe Glow Lounge Jaipur',
    role: 'admin',
    permissions: [
      'view:dashboard',
      'manage:clients',
      'manage:appointments',
      'manage:services',
      'view:reports',
    ],
    status: 'active',
    joinedAt: '2026-02-01',
  },
]

// ============================================================================
// 6. TENANT-SCOPED SEED CLIENTS (For Testing Isolation)
// ============================================================================

export const TENANT_SPECIFIC_CLIENTS: Record<string, Client[]> = {
  // Tenant B: Luxe Glow Lounge Jaipur Clients
  'tenant-luxeglow': [
    {
      id: 'cli-lux-1',
      firstName: 'Divya',
      lastName: 'Choudhary',
      fullName: 'Divya Choudhary',
      email: 'divya.c@jaipurelite.in',
      phone: '+91 98290 11223',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      totalVisits: 14,
      totalSpent: 48500,
      lastVisitDate: '2026-09-24',
      status: 'vip',
      isVip: true,
      gender: 'female',
      birthday: '1992-04-18',
      tags: ['Jaipur VIP', 'Bridal Specialist', 'Keratin Lover'],
      favoriteService: 'Royal Rajputana Bridal Spa',
      outstandingBalance: 0,
      tenantId: 'tenant-luxeglow',
      createdAt: '2025-11-10',
    },
    {
      id: 'cli-lux-2',
      firstName: 'Manish',
      lastName: 'Shekhawat',
      fullName: 'Manish Shekhawat',
      email: 'manish.s@pinkcity.com',
      phone: '+91 94140 44556',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      totalVisits: 8,
      totalSpent: 19800,
      lastVisitDate: '2026-09-20',
      status: 'active',
      isVip: false,
      gender: 'male',
      tags: ['C-Scheme Regular', 'Beard Grooming'],
      favoriteService: 'Gentlemen Beard Sculpt & Express Facial',
      outstandingBalance: 0,
      tenantId: 'tenant-luxeglow',
      createdAt: '2025-12-05',
    },
    {
      id: 'cli-lux-3',
      firstName: 'Radhika',
      lastName: 'Agarwal',
      fullName: 'Radhika Agarwal',
      email: 'radhika.a@gmail.com',
      phone: '+91 98292 77889',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      totalVisits: 2,
      totalSpent: 6500,
      lastVisitDate: '2026-09-15',
      status: 'new',
      isVip: false,
      gender: 'female',
      tags: ['Malviya Nagar'],
      favoriteService: 'Hydra-Oxygen Facial Glow',
      outstandingBalance: 0,
      tenantId: 'tenant-luxeglow',
      createdAt: '2026-08-20',
    },
  ],

  // Tenant C: Aura Unisex Salon Udaipur Clients
  'tenant-aurasalon': [
    {
      id: 'cli-aura-1',
      firstName: 'Bhavna',
      lastName: 'Mewada',
      fullName: 'Bhavna Mewada',
      email: 'bhavna.m@udaipurlakes.in',
      phone: '+91 94142 99881',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      totalVisits: 5,
      totalSpent: 9200,
      lastVisitDate: '2026-09-02',
      status: 'active',
      isVip: false,
      gender: 'female',
      tags: ['Fateh Sagar'],
      favoriteService: 'Hair Smoothening & Gloss',
      outstandingBalance: 1200,
      tenantId: 'tenant-aurasalon',
      createdAt: '2026-01-18',
    },
  ],
}

// ============================================================================
// 7. TENANT SERVICE CLASS
// ============================================================================

const STORAGE_KEY_TENANTS = 'SALORA_tenants_store'
const STORAGE_KEY_CURRENT_TENANT = 'SALORA_current_tenant_id'
const STORAGE_KEY_AUDIT_LOGS = 'SALORA_superadmin_audit_logs'
const STORAGE_KEY_SUPPORT_SESSION = 'SALORA_active_support_session'

class TenantService {
  private tenants: Tenant[] = []
  private auditLogs: SuperAdminAuditLog[] = []
  private activeSupportSession: SupportSession | null = null

  constructor() {
    this.loadState()
  }

  private loadState() {
    if (typeof window === 'undefined') {
      this.tenants = [...INITIAL_TENANTS]
      this.auditLogs = [...INITIAL_SUPER_ADMIN_AUDIT_LOGS]
      return
    }

    try {
      const storedTenants = localStorage.getItem(STORAGE_KEY_TENANTS)
      this.tenants = storedTenants ? JSON.parse(storedTenants) : [...INITIAL_TENANTS]

      const storedLogs = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS)
      this.auditLogs = storedLogs ? JSON.parse(storedLogs) : [...INITIAL_SUPER_ADMIN_AUDIT_LOGS]

      const storedSession = localStorage.getItem(STORAGE_KEY_SUPPORT_SESSION)
      this.activeSupportSession = storedSession ? JSON.parse(storedSession) : null
    } catch (e) {
      console.error('Failed to load multi-tenant state from localStorage', e)
      this.tenants = [...INITIAL_TENANTS]
      this.auditLogs = [...INITIAL_SUPER_ADMIN_AUDIT_LOGS]
    }
  }

  private persist() {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY_TENANTS, JSON.stringify(this.tenants))
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(this.auditLogs))
      if (this.activeSupportSession) {
        localStorage.setItem(STORAGE_KEY_SUPPORT_SESSION, JSON.stringify(this.activeSupportSession))
      } else {
        localStorage.removeItem(STORAGE_KEY_SUPPORT_SESSION)
      }
    } catch (e) {
      console.error('Failed to persist multi-tenant state', e)
    }
  }

  // --- Current Tenant Resolution ---
  getCurrentTenantId(): string {
    if (this.activeSupportSession) {
      return this.activeSupportSession.tenantId
    }
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_CURRENT_TENANT)
      if (stored) return stored
    }
    return 'tenant-salora'
  }

  setCurrentTenantId(tenantId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CURRENT_TENANT, tenantId)
    }
  }

  getCurrentTenant(): Tenant {
    const currentId = this.getCurrentTenantId()
    const found = this.tenants.find((t) => t.id === currentId)
    return found || this.tenants[0]
  }

  // --- Tenant Queries ---
  getAllTenants(): Tenant[] {
    return [...this.tenants]
  }

  getTenantById(id: string): Tenant | undefined {
    return this.tenants.find((t) => t.id === id)
  }

  // --- Tenant Mutations ---
  updateTenantStatus(id: string, status: TenantStatus, reason: string): Tenant {
    const index = this.tenants.findIndex((t) => t.id === id)
    if (index === -1) throw new Error(`Tenant ${id} not found`)

    const previous = this.tenants[index]
    this.tenants[index] = {
      ...previous,
      status,
      subscriptionStatus: status === 'ACTIVE' ? 'active' : status === 'SUSPENDED' ? 'past_due' : 'cancelled',
    }

    // Add Audit Log Entry
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      superAdminId: 'sa-001',
      superAdminName: 'Super Admin',
      action: `TENANT_STATUS_${status}`,
      category: 'organization',
      targetTenantId: id,
      targetTenantName: previous.name,
      ipAddress: '103.24.88.12',
      details: `Status altered from ${previous.status} to ${status}. Reason: ${reason}`,
      severity: status === 'SUSPENDED' ? 'critical' : 'warning',
    })

    this.persist()
    return this.tenants[index]
  }

  createTenant(data: Omit<Tenant, 'id' | 'createdAt'>): Tenant {
    const newTenant: Tenant = {
      ...data,
      id: `tenant-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    }

    this.tenants.unshift(newTenant)

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      superAdminId: 'sa-001',
      superAdminName: 'Super Admin',
      action: 'ORGANIZATION_CREATED',
      category: 'organization',
      targetTenantId: newTenant.id,
      targetTenantName: newTenant.name,
      ipAddress: '103.24.88.12',
      details: `Provisioned new salon organization on ${data.planId} plan.`,
      severity: 'info',
    })

    this.persist()
    return newTenant
  }

  // --- Usage Metrics ---
  getUsageMetrics(tenantId: string): TenantUsageMetrics {
    const metrics = INITIAL_USAGE_METRICS[tenantId]
    if (metrics) return metrics

    const tenant = this.getTenantById(tenantId)
    const plan = SUPER_ADMIN_PLANS.find((p) => p.id === tenant?.planId) || SUPER_ADMIN_PLANS[0]

    return {
      tenantId,
      clients: { current: 150, limit: plan.clientLimit },
      appointments: { current: 65, limit: 1000 },
      staff: { current: tenant?.usersCount || 3, limit: plan.staffLimit },
      branches: { current: tenant?.branchesCount || 1, limit: plan.branchLimit },
      storageMb: { current: 350, limit: plan.storageLimitMb },
      messagesSent: { current: 210, limit: plan.messagesLimit },
      aiQueries: { current: 18, limit: plan.aiQueriesLimit },
      automations: { current: 3, limit: 10 },
      lastCalculatedAt: new Date().toISOString(),
    }
  }

  // --- Super Admin Aggregates ---
  getSuperAdminMetrics() {
    const totalOrgs = this.tenants.length
    const activeOrgs = this.tenants.filter((t) => t.status === 'ACTIVE').length
    const newOrgs = this.tenants.filter((t) => new Date(t.createdAt).getMonth() === new Date().getMonth()).length
    const totalUsers = this.tenants.reduce((sum, t) => sum + t.usersCount, 0)
    const totalMrr = this.tenants
      .filter((t) => t.status === 'ACTIVE')
      .reduce((sum, t) => sum + (t.mrrAmount || 0), 0)

    return {
      totalOrganizations: totalOrgs,
      activeOrganizations: activeOrgs,
      newOrganizationsThisMonth: newOrgs > 0 ? newOrgs : 5,
      activeUsersAcrossTenants: totalUsers + 120, // scaled platform estimate
      totalMrr,
      totalArr: totalMrr * 12,
      systemUptimePercent: 99.98,
      totalApiRequestsToday: '1,428,900',
      totalDatabaseSizeMb: 43800,
    }
  }

  // --- Support Impersonation Context ---
  startSupportSession(tenantId: string, reason: string, ticketNumber?: string): SupportSession {
    const target = this.getTenantById(tenantId)
    if (!target) throw new Error(`Target tenant ${tenantId} not found`)

    const session: SupportSession = {
      sessionId: `sup-${Date.now()}`,
      superAdminId: 'sa-001',
      superAdminName: 'Super Admin',
      tenantId: target.id,
      tenantName: target.name,
      reason,
      ticketNumber: ticketNumber || `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour lease
      status: 'ACTIVE',
    }

    this.activeSupportSession = session

    // Audit log required by Web Guidelines & Phase 5 Part 4
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      superAdminId: 'sa-001',
      superAdminName: 'Super Admin',
      action: 'SUPPORT_IMPERSONATION_STARTED',
      category: 'impersonation',
      targetTenantId: target.id,
      targetTenantName: target.name,
      ipAddress: '103.24.88.12',
      details: `Support Impersonation initiated. Reason: "${reason}". Ticket: ${session.ticketNumber}`,
      severity: 'warning',
    })

    this.persist()
    return session
  }

  endSupportSession(): void {
    if (this.activeSupportSession) {
      const current = this.activeSupportSession
      this.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        superAdminId: 'sa-001',
        superAdminName: 'Super Admin',
        action: 'SUPPORT_IMPERSONATION_ENDED',
        category: 'impersonation',
        targetTenantId: current.tenantId,
        targetTenantName: current.tenantName,
        ipAddress: '103.24.88.12',
        details: `Support Impersonation session closed for "${current.tenantName}".`,
        severity: 'info',
      })
      this.activeSupportSession = null
      this.persist()
    }
  }

  getActiveSupportSession(): SupportSession | null {
    return this.activeSupportSession
  }

  getAuditLogs(): SuperAdminAuditLog[] {
    return [...this.auditLogs]
  }

  getPlans(): SuperAdminPlan[] {
    return [...SUPER_ADMIN_PLANS]
  }

  getMembershipsForUser(userId: string): OrganizationMember[] {
    return INITIAL_MEMBERSHIPS.filter((m) => m.userId === userId)
  }
}

export const tenantService = new TenantService()
