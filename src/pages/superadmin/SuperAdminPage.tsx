import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Users,
  CreditCard,
  Layers,
  HardDrive,
  Activity,
  ShieldCheck,
  FileText,
  Settings,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  Sparkles,
  Server,
  Zap,
  Bot,
  MessageSquare,
  Lock,
  Unlock,
} from 'lucide-react'
import {
  tenantService,
  INITIAL_TENANTS,
  INITIAL_SUPER_ADMIN_AUDIT_LOGS,
  SUPER_ADMIN_PLANS,
} from '@/services/tenantService'
import {
  Tenant,
  TenantStatus,
  SuperAdminAuditLog,
  TenantPlanTier,
  SuperAdminPlan,
} from '@/types'
import { useTenantStore } from '@/store/useTenantStore'
import { useToastStore } from '@/store/useToastStore'
import { ImpersonationModal } from '@/components/superadmin/ImpersonationModal'
import { ConfirmActionModal } from '@/components/superadmin/ConfirmActionModal'
import { TenantDetailModal } from '@/components/superadmin/TenantDetailModal'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

type SuperAdminTab =
  | 'overview'
  | 'organizations'
  | 'users'
  | 'subscriptions'
  | 'plans'
  | 'usage'
  | 'health'
  | 'support'
  | 'audit'
  | 'settings'

export const SuperAdminPage: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToastStore()
  const { enterSupportMode, refreshTenants } = useTenantStore()

  // Tab State
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('overview')

  // Data State
  const [tenants, setTenants] = useState<Tenant[]>(() => tenantService.getAllTenants())
  const [auditLogs, setAuditLogs] = useState<SuperAdminAuditLog[]>(() => tenantService.getAuditLogs())
  const metrics = useMemo(() => tenantService.getSuperAdminMetrics(), [tenants])

  // Filters for Organizations Tab
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | TenantStatus>('ALL')
  const [planFilter, setPlanFilter] = useState<'ALL' | TenantPlanTier>('ALL')

  // Modals State
  const [detailTenant, setDetailTenant] = useState<Tenant | null>(null)
  const [impersonateTenant, setImpersonateTenant] = useState<Tenant | null>(null)
  const [confirmStatusModal, setConfirmStatusModal] = useState<{
    tenant: Tenant
    targetStatus: TenantStatus
  } | null>(null)

  // Filtered Organizations
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.primaryCity || '').toLowerCase().includes(searchQuery.toLowerCase())

      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter
      const matchPlan = planFilter === 'ALL' || t.planId === planFilter

      return matchSearch && matchStatus && matchPlan
    })
  }, [tenants, searchQuery, statusFilter, planFilter])

  // Handle Impersonation Launch
  const handleAuthorizeImpersonation = (
    tenantId: string,
    reason: string,
    ticketNumber?: string
  ) => {
    const session = enterSupportMode(tenantId, reason, ticketNumber)
    refreshTenants()
    addToast({
      title: 'Support Impersonation Launched',
      message: `Operating as Super Admin inside "${session.tenantName}".`,
      type: 'warning',
    })
    navigate('/')
  }

  // Handle Status Toggle (Suspend / Reactivate)
  const handleConfirmStatusChange = (
    tenantId: string,
    newStatus: TenantStatus,
    reason: string
  ) => {
    try {
      const updated = tenantService.updateTenantStatus(tenantId, newStatus, reason)
      setTenants(tenantService.getAllTenants())
      setAuditLogs(tenantService.getAuditLogs())
      refreshTenants()
      addToast({
        title: newStatus === 'SUSPENDED' ? 'Organization Suspended' : 'Organization Reactivated',
        message: `${updated.name} status is now ${newStatus}.`,
        type: newStatus === 'SUSPENDED' ? 'danger' : 'success',
      })
    } catch {
      addToast({
        title: 'Error',
        message: 'Could not alter tenant status.',
        type: 'danger',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="text-[10px] uppercase font-bold tracking-wider">
              Phase 5 Architecture
            </Badge>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-400 text-xs">Multi-Tenant SaaS Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1 tracking-tight">
            Super Admin Platform Console
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Cross-tenant orchestration, organization isolation, quota policing, and support impersonation.
          </p>
        </div>

        {/* Action Button: Quick launch support */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('support')}
            className="border-slate-700 bg-slate-800 text-slate-200 hover:text-white text-xs h-8"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
            Support Sessions
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const name = prompt('Enter new salon organization name:')
              if (name) {
                const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
                const created = tenantService.createTenant({
                  name,
                  slug,
                  ownerId: 'user-new',
                  ownerName: 'Salon Manager',
                  ownerEmail: `admin@${slug}.com`,
                  planId: 'professional',
                  status: 'ACTIVE',
                  subscriptionStatus: 'active',
                  branchesCount: 1,
                  usersCount: 5,
                  primaryCity: 'Jaipur',
                  primaryState: 'Rajasthan',
                  currency: 'INR',
                  mrrAmount: 4999,
                  billingCycle: 'monthly',
                  renewalDate: '2026-10-27',
                  features: ['Multi-branch ready', 'AI Assistant', 'POS Billing'],
                })
                setTenants(tenantService.getAllTenants())
                setAuditLogs(tenantService.getAuditLogs())
                refreshTenants()
                addToast({
                  title: 'Salon Organization Provisioned',
                  message: `Created "${created.name}" on isolated schema.`,
                  type: 'success',
                })
              }
            }}
            className="bg-teal-600 hover:bg-teal-500 text-white text-xs h-8"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Provision Salon
          </Button>
        </div>
      </div>

      {/* Navigation Tabs (10 Sections) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-800">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'organizations', label: `Organizations (${tenants.length})`, icon: Building2 },
          { id: 'users', label: 'Platform Users', icon: Users },
          { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
          { id: 'plans', label: 'SaaS Plans', icon: Layers },
          { id: 'usage', label: 'Usage & Quotas', icon: HardDrive },
          { id: 'health', label: 'System Health', icon: Server },
          { id: 'support', label: 'Support & Impersonation', icon: ShieldCheck },
          { id: 'audit', label: `Audit Logs (${auditLogs.length})`, icon: FileText },
          { id: 'settings', label: 'Global Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as SuperAdminTab)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150',
                isActive
                  ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-teal-400' : 'text-slate-500')} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: OVERVIEW                                                       */}
      {/* ===================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Metric Cards (Section 6) */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Salons
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-white tabular-nums">
                  {metrics.totalOrganizations}
                </span>
                <span className="text-[10px] font-bold text-teal-400">Multi-tenant</span>
              </div>
              <p className="text-[11px] text-slate-500">Across 8 states</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Active Salons
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-emerald-400 tabular-nums">
                  {metrics.activeOrganizations}
                </span>
                <span className="text-[10px] text-emerald-500 font-bold">Live</span>
              </div>
              <p className="text-[11px] text-slate-500">100% operational</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                New Salons
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-teal-400 tabular-nums">
                  +{metrics.newOrganizationsThisMonth}
                </span>
                <span className="text-[10px] font-bold text-teal-400">This Month</span>
              </div>
              <p className="text-[11px] text-slate-500">22% MoM growth</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Platform Users
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-white tabular-nums">
                  {metrics.activeUsersAcrossTenants}
                </span>
                <span className="text-[10px] font-bold text-slate-400">Active</span>
              </div>
              <p className="text-[11px] text-slate-500">Staff, Stylists, Admins</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Monthly Recurring
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-teal-300 tabular-nums">
                  ₹{(metrics.totalMrr / 1000).toFixed(1)}k
                </span>
                <span className="text-[10px] font-bold text-slate-400">MRR</span>
              </div>
              <p className="text-[11px] text-slate-500">
                ₹{(metrics.totalArr / 100000).toFixed(1)}L ARR
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                API Requests
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-indigo-400 tabular-nums">
                  1.42M
                </span>
                <span className="text-[10px] font-bold text-emerald-400">Today</span>
              </div>
              <p className="text-[11px] text-slate-500">99.98% response &lt;45ms</p>
            </div>
          </div>

          {/* Core Spotlight: Quick Impersonation Sandbox */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white">
                  Support Impersonation & Multi-Tenant Testing
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Test data isolation between <strong>Tenant A (Salora Jodhpur)</strong> and{' '}
                <strong>Tenant B (Luxe Glow Lounge Jaipur)</strong>. Launching an impersonation session allows you to operate directly inside any tenant workspace with guaranteed cryptographic audit logging.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImpersonateTenant(tenants[1])}
                className="border-teal-500/40 text-teal-300 hover:bg-teal-500/10 text-xs h-8"
              >
                Impersonate Tenant B (Luxe Glow)
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('organizations')}
                className="bg-teal-600 hover:bg-teal-500 text-white text-xs h-8"
              >
                Manage All Salons
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>

          {/* 2-Column: Recent Salons & Recent Platform Audits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Organizations Preview Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-400" />
                  Active Salon Organizations
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('organizations')}
                  className="text-xs text-teal-400 hover:underline"
                >
                  View all ({tenants.length})
                </button>
              </div>

              <div className="space-y-2.5">
                {tenants.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                        {t.logo ? (
                          <img
                            src={t.logo}
                            alt=""
                            className="w-full h-full object-cover"
                            width={32}
                            height={32}
                          />
                        ) : (
                          <Building2 className="w-4 h-4 text-slate-500 m-2" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white">{t.name}</p>
                          <span
                            className={cn(
                              'text-[9px] font-bold px-1.5 py-0.2 rounded uppercase',
                              t.status === 'ACTIVE'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : t.status === 'SUSPENDED'
                                ? 'bg-rose-500/15 text-rose-400'
                                : 'bg-amber-500/15 text-amber-400'
                            )}
                          >
                            {t.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {t.primaryCity} • {t.branchesCount} Branches • {t.planId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailTenant(t)}
                        className="text-slate-300 hover:text-white text-xs h-7 px-2"
                      >
                        Inspect
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setImpersonateTenant(t)}
                        className="border-slate-700 text-teal-400 hover:bg-slate-800 text-xs h-7 px-2"
                      >
                        Impersonate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Logs Preview Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  Security & Audit Activity
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className="text-xs text-teal-400 hover:underline"
                >
                  View audit log ({auditLogs.length})
                </button>
              </div>

              <div className="space-y-2.5">
                {auditLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-teal-400 font-bold text-[11px]">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {log.details}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                      <span>Admin: {log.superAdminName}</span>
                      <span>•</span>
                      <span>IP: {log.ipAddress || '103.24.88.12'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ORGANIZATIONS MANAGEMENT TABLE (Section 7)                     */}
      {/* ===================================================================== */}
      {activeTab === 'organizations' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Search by salon name, owner, slug, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="TRIAL">TRIAL</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {/* Plan Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Plan:</span>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
                >
                  <option value="ALL">All Plans</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Salon / Organization</th>
                    <th className="px-4 py-3">Owner Details</th>
                    <th className="px-4 py-3">Plan Tier</th>
                    <th className="px-4 py-3 text-center">Branches</th>
                    <th className="px-4 py-3 text-center">Users</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Subscription</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-xs">
                        No salon organizations found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((t) => {
                      const isSuspended = t.status === 'SUSPENDED'

                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Salon Column */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700 flex items-center justify-center">
                                {t.logo ? (
                                  <img
                                    src={t.logo}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    width={36}
                                    height={36}
                                  />
                                ) : (
                                  <Building2 className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-white text-xs">{t.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {t.slug} • {t.primaryCity || 'Jodhpur'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Owner Details */}
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-200">{t.ownerName}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {t.ownerEmail}
                            </p>
                          </td>

                          {/* Plan */}
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-teal-400 font-mono text-[10px] uppercase font-bold border border-slate-700">
                              {t.planId}
                            </span>
                          </td>

                          {/* Branches */}
                          <td className="px-4 py-3 text-center tabular-nums font-bold text-slate-200">
                            {t.branchesCount}
                          </td>

                          {/* Users */}
                          <td className="px-4 py-3 text-center tabular-nums font-bold text-slate-200">
                            {t.usersCount}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                t.status === 'ACTIVE'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : t.status === 'SUSPENDED'
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              )}
                            >
                              {t.status}
                            </span>
                          </td>

                          {/* Created */}
                          <td className="px-4 py-3 text-[11px] text-slate-400 tabular-nums">
                            {t.createdAt}
                          </td>

                          {/* Subscription */}
                          <td className="px-4 py-3">
                            <p className="font-bold text-white tabular-nums">
                              ₹{t.mrrAmount.toLocaleString('en-IN')}/mo
                            </p>
                            <p className="text-[10px] text-slate-400 capitalize">
                              {t.subscriptionStatus}
                            </p>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDetailTenant(t)}
                                className="text-slate-300 hover:text-white text-xs h-7 px-2"
                              >
                                View
                              </Button>

                              {/* Support Impersonation */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setImpersonateTenant(t)}
                                className="border-teal-500/40 text-teal-400 hover:bg-teal-500/10 text-xs h-7 px-2"
                              >
                                Support
                              </Button>

                              {/* Suspend / Activate Toggle */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setConfirmStatusModal({
                                    tenant: t,
                                    targetStatus: isSuspended ? 'ACTIVE' : 'SUSPENDED',
                                  })
                                }}
                                className={cn(
                                  'text-xs h-7 px-2',
                                  isSuspended
                                    ? 'text-emerald-400 hover:bg-emerald-500/10'
                                    : 'text-rose-400 hover:bg-rose-500/10'
                                )}
                              >
                                {isSuspended ? 'Activate' : 'Suspend'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: PLATFORM USERS DIRECTORY                                       */}
      {/* ===================================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-white text-sm">Cross-Tenant User Directory</h3>
              <p className="text-slate-400 text-xs">
                Audited list of salon owners, managers, frontdesk, and stylists across all tenants.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-teal-500/15 text-teal-400 font-bold">
              {metrics.activeUsersAcrossTenants} Registered Users
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Assigned Tenant</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3 text-right">Access Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {[
                  {
                    name: 'Ayaan Khan',
                    email: 'ayaan@salora.in',
                    tenant: 'Salora Jodhpur Flagship',
                    role: 'owner',
                    status: 'active',
                    joined: '2025-08-15',
                  },
                  {
                    name: 'Ananya Singhania',
                    email: 'ananya@luxeglow.in',
                    tenant: 'Luxe Glow Lounge Jaipur',
                    role: 'owner',
                    status: 'active',
                    joined: '2025-11-01',
                  },
                  {
                    name: 'Vikram Rathore',
                    email: 'vikram@aurasalon.com',
                    tenant: 'Aura Unisex Salon Udaipur',
                    role: 'owner',
                    status: 'suspended',
                    joined: '2026-01-10',
                  },
                  {
                    name: 'Camille Dupré',
                    email: 'camille@luxeaura.com',
                    tenant: 'Salora Jodhpur Flagship',
                    role: 'stylist',
                    status: 'active',
                    joined: '2025-08-20',
                  },
                  {
                    name: 'Priya Sharma',
                    email: 'priya.s@luxeglow.in',
                    tenant: 'Luxe Glow Lounge Jaipur',
                    role: 'manager',
                    status: 'active',
                    joined: '2025-11-15',
                  },
                ].map((u, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-white">
                      {u.name} <span className="text-slate-500 font-normal">({u.email})</span>
                    </td>
                    <td className="px-4 py-3 text-teal-400 font-medium">{u.tenant}</td>
                    <td className="px-4 py-3 uppercase font-mono text-[10px] text-slate-300">
                      {u.role}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                          u.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-rose-500/15 text-rose-400'
                        )}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{u.joined}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-[11px] text-slate-400">Tenant-Scoped</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: SUBSCRIPTIONS & BILLING RUNS                                   */}
      {/* ===================================================================== */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Monthly Run Rate</span>
              <p className="text-2xl font-extrabold text-teal-300 tabular-nums">
                ₹{metrics.totalMrr.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-emerald-400 font-semibold">+18.4% from last quarter</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Annual Run Rate (ARR)</span>
              <p className="text-2xl font-extrabold text-white tabular-nums">
                ₹{metrics.totalArr.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400">Projected annualized billing</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Churn Rate</span>
              <p className="text-2xl font-extrabold text-emerald-400 tabular-nums">0.0%</p>
              <p className="text-[11px] text-slate-400">Zero voluntary cancellation</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-white">Plan Distribution Across Salons</h3>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Enterprise Tier (₹9,999/mo)</span>
                  <span className="font-bold">40% of revenue</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-teal-400 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Professional Studio (₹4,999/mo)</span>
                  <span className="font-bold">48% of revenue</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '48%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Starter Salon (₹1,999/mo)</span>
                  <span className="font-bold">12% of revenue</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: '12%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: SAAS PLANS (Starter, Professional, Enterprise)                  */}
      {/* ===================================================================== */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SUPER_ADMIN_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'p-6 rounded-2xl border flex flex-col justify-between gap-6 transition-all',
                plan.isPopular
                  ? 'bg-slate-900 border-teal-500/50 shadow-xl shadow-teal-500/5'
                  : 'bg-slate-900 border-slate-800'
              )}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                  {plan.isPopular && (
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase border border-teal-500/30">
                      Most Popular
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">
                    ₹{plan.priceMonthly.toLocaleString('en-IN')}
                  </span>
                  <span className="text-slate-400 text-xs">/month</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Branches:</span>
                    <span className="font-semibold text-white">{plan.branchLimit} location(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Staff Limit:</span>
                    <span className="font-semibold text-white">{plan.staffLimit} team members</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Clients Quota:</span>
                    <span className="font-semibold text-white">{plan.clientLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Storage:</span>
                    <span className="font-semibold text-white">{(plan.storageLimitMb / 1024).toFixed(0)} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">AI Inquiries:</span>
                    <span className="font-semibold text-white">{plan.aiQueriesLimit} /mo</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Included Features:
                  </span>
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full border-slate-700 bg-slate-800 text-slate-200 hover:text-white"
                onClick={() =>
                  addToast({
                    title: 'Plan Configuration',
                    message: `${plan.name} limits enforced in tenant sandbox.`,
                    type: 'info',
                  })
                }
              >
                Configure Quotas
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: USAGE METRICS (Section 10)                                      */}
      {/* ===================================================================== */}
      {activeTab === 'usage' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-white text-sm">Tenant Resource Consumption</h3>
              <p className="text-slate-400 text-xs">
                Real-time usage breakdown of clients, storage, WhatsApp messages, and AI queries.
              </p>
            </div>
            <span className="text-xs text-teal-400 font-mono">Enforced per tenantId</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tenants.map((t) => {
              const u = tenantService.getUsageMetrics(t.id)
              return (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm truncate">{t.name}</span>
                    <Badge variant="default" className="text-[9px] uppercase font-bold">
                      {t.planId}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
                        <span>Clients ({u.clients.current} / {u.clients.limit})</span>
                        <span className="font-bold">{Math.round((u.clients.current / u.clients.limit) * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-teal-400 rounded-full"
                          style={{ width: `${Math.min(100, (u.clients.current / u.clients.limit) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
                        <span>Storage ({(u.storageMb.current / 1024).toFixed(1)} GB / {(u.storageMb.limit / 1024).toFixed(0)} GB)</span>
                        <span className="font-bold">{Math.round((u.storageMb.current / u.storageMb.limit) * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${Math.min(100, (u.storageMb.current / u.storageMb.limit) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
                        <span>Messages ({u.messagesSent.current} / {u.messagesSent.limit})</span>
                        <span className="font-bold">{Math.round((u.messagesSent.current / u.messagesSent.limit) * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${Math.min(100, (u.messagesSent.current / u.messagesSent.limit) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
                        <span>AI Copilot Queries ({u.aiQueries.current} / {u.aiQueries.limit})</span>
                        <span className="font-bold">{Math.round((u.aiQueries.current / u.aiQueries.limit) * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${Math.min(100, (u.aiQueries.current / u.aiQueries.limit) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 7: SYSTEM HEALTH                                                  */}
      {/* ===================================================================== */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Multi-Tenant Database',
                status: 'HEALTHY',
                desc: 'PostgreSQL Row-Level Security active',
                metric: '2.4ms latency',
              },
              {
                title: 'Redis Event Bus',
                status: 'HEALTHY',
                desc: 'Automation queue & idempotency keys',
                metric: '0 failed jobs in buffer',
              },
              {
                title: 'AI Copilot Gateway',
                status: 'HEALTHY',
                desc: 'Business intelligence engine',
                metric: '99.99% availability',
              },
              {
                title: 'Media CDN & S3 Cluster',
                status: 'HEALTHY',
                desc: 'Storage partitioning by tenantId',
                metric: '42.8 GB allocated',
              },
            ].map((node, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{node.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                    {node.status}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">{node.desc}</p>
                <p className="text-teal-400 font-mono text-xs pt-1 border-t border-slate-800">
                  {node.metric}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 8: SUPPORT & IMPERSONATION (Section 9)                            */}
      {/* ===================================================================== */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Controlled Support Impersonation Launcher
                </h3>
                <p className="text-xs text-slate-400">
                  Securely access salon workspaces to reproduce bugs, test isolation, or assist salon owners.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-bold text-white">Multi-Tenant Impersonation Architecture Rules:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Every impersonation request requires an explicit authorization justification reason.</li>
                <li>An audit trail record is written immediately with timestamp, admin ID, and client IP.</li>
                <li>A persistent high-visibility banner is rendered across the entire salon viewport.</li>
                <li>One-click exit immediately terminates the session and returns to this console.</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tenants.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-white truncate max-w-[150px]">{t.name}</p>
                    <p className="text-[10px] text-slate-400">{t.primaryCity} • {t.planId}</p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setImpersonateTenant(t)}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-7.5 px-2.5"
                  >
                    Launch
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 9: AUDIT LOGS (Section 5)                                         */}
      {/* ===================================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-white text-sm">Security Audit Trail</h3>
              <p className="text-slate-400 text-xs">
                Immutable record of administrative interventions, plan alterations, and impersonation sessions.
              </p>
            </div>
            <span className="font-mono text-teal-400">{auditLogs.length} events logged</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Target Tenant</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3 text-right">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-white font-sans font-semibold">
                      {log.superAdminName}
                    </td>
                    <td className="px-4 py-3 text-teal-400 font-bold">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 uppercase text-slate-400">
                      {log.category}
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-sans">
                      {log.targetTenantName || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-sans max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase',
                          log.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-400'
                            : log.severity === 'warning'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        )}
                      >
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 10: SETTINGS                                                      */}
      {/* ===================================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white">Global Multi-Tenant Platform Settings</h3>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <p className="font-bold text-white">Self-Serve Salon Onboarding</p>
                  <p className="text-slate-400">Allow new salon businesses to register and start 14-day trial</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-700 text-teal-500 focus:ring-teal-500/30"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <p className="font-bold text-white">Cross-Tenant AI Memory Isolation</p>
                  <p className="text-slate-400">Ensure vectorized client history is strictly partition-fenced</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  disabled
                  className="rounded border-slate-700 text-teal-500"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <p className="font-bold text-white">Platform Maintenance Mode</p>
                  <p className="text-slate-400">Display global upgrade notice to all salon staff & owners</p>
                </div>
                <input
                  type="checkbox"
                  className="rounded border-slate-700 text-teal-500 focus:ring-teal-500/30"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODALS                                                                */}
      {/* ===================================================================== */}
      <TenantDetailModal
        isOpen={Boolean(detailTenant)}
        onClose={() => setDetailTenant(null)}
        tenant={detailTenant}
        onOpenImpersonation={(t) => setImpersonateTenant(t)}
        onToggleStatus={(t) =>
          setConfirmStatusModal({
            tenant: t,
            targetStatus: t.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED',
          })
        }
      />

      <ImpersonationModal
        isOpen={Boolean(impersonateTenant)}
        onClose={() => setImpersonateTenant(null)}
        tenant={impersonateTenant}
        onAuthorize={handleAuthorizeImpersonation}
      />

      {confirmStatusModal && (
        <ConfirmActionModal
          isOpen={Boolean(confirmStatusModal)}
          onClose={() => setConfirmStatusModal(null)}
          tenant={confirmStatusModal.tenant}
          targetStatus={confirmStatusModal.targetStatus}
          onConfirm={handleConfirmStatusChange}
        />
      )}
    </div>
  )
}
