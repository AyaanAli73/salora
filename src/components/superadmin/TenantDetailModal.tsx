import React from 'react'
import {
  Building2,
  Users,
  MapPin,
  Calendar,
  CreditCard,
  HardDrive,
  MessageSquare,
  Bot,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { Tenant, TenantUsageMetrics } from '@/types'
import { tenantService } from '@/services/tenantService'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface TenantDetailModalProps {
  isOpen: boolean
  onClose: () => void
  tenant: Tenant | null
  onOpenImpersonation: (tenant: Tenant) => void
  onToggleStatus: (tenant: Tenant) => void
}

export const TenantDetailModal: React.FC<TenantDetailModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onOpenImpersonation,
  onToggleStatus,
}) => {
  if (!tenant) return null

  const usage: TenantUsageMetrics = tenantService.getUsageMetrics(tenant.id)

  const calcPercent = (curr: number, limit: number) => {
    if (!limit || limit === 0) return 0
    return Math.min(100, Math.round((curr / limit) * 100))
  }

  const isSuspended = tenant.status === 'SUSPENDED'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Organization Details & Multi-Tenant Scoping"
      size="lg"
    >
      <div className="space-y-6 text-xs">
        {/* Header Profile Bar */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-primary/10 border border-border shrink-0 flex items-center justify-center">
              {tenant.logo ? (
                <img
                  src={tenant.logo}
                  alt=""
                  className="w-full h-full object-cover"
                  width={56}
                  height={56}
                />
              ) : (
                <Building2 className="w-7 h-7 text-primary" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">
                  {tenant.name}
                </h3>
                <Badge
                  variant={isSuspended ? 'danger' : 'success'}
                  className="text-[10px]"
                >
                  {tenant.status}
                </Badge>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Slug: <span className="font-mono text-text-secondary">{tenant.slug}</span> • ID: <span className="font-mono">{tenant.id}</span>
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-text-secondary text-[11px]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {tenant.primaryCity || 'Jodhpur'}, {tenant.primaryState || 'Rajasthan'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  Joined {tenant.createdAt}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose()
                onOpenImpersonation(tenant)
              }}
              className="text-amber-700 dark:text-amber-300 hover:border-amber-500 bg-amber-500/5 text-xs h-8"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Impersonate
            </Button>
            <Button
              variant={isSuspended ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                onClose()
                onToggleStatus(tenant)
              }}
              className={cn(
                'text-xs h-8',
                isSuspended
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'text-rose-600 hover:bg-rose-50'
              )}
            >
              {isSuspended ? 'Reactivate' : 'Suspend'}
            </Button>
          </div>
        </div>

        {/* Subscription & Owner Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl border border-border bg-surface space-y-2">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
              Business Owner & Access
            </span>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                {tenant.ownerName.charAt(0)}
              </div>
              <div className="truncate">
                <p className="font-bold text-text-primary truncate">{tenant.ownerName}</p>
                <p className="text-[11px] text-text-muted truncate">{tenant.ownerEmail}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
              <span className="text-text-muted">Assigned Branches:</span>
              <span className="font-semibold text-text-primary">{tenant.branchesCount} locations</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-muted">Staff / Users:</span>
              <span className="font-semibold text-text-primary">{tenant.usersCount} team members</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                Subscription & Plan
              </span>
              <Badge variant="primary" className="text-[10px] uppercase">
                {tenant.planId}
              </Badge>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-text-primary">
                ₹{tenant.mrrAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-text-muted text-[11px]">/{tenant.billingCycle}</span>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
              <span className="text-text-muted">Subscription Status:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                {tenant.subscriptionStatus}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-muted">Next Renewal:</span>
              <span className="font-semibold text-text-primary tabular-nums">{tenant.renewalDate}</span>
            </div>
          </div>
        </div>

        {/* Section 10: Usage Metrics Against Plan Quotas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-primary" />
              Tenant Resource Usage & Quota Limits
            </h4>
            <span className="text-[11px] text-text-muted">
              Isolated per tenant schema
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Clients Bar */}
            <div className="p-3 rounded-xl bg-surface-subtle border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-primary flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Client Profiles
                </span>
                <span className="tabular-nums font-bold text-text-primary">
                  {usage.clients.current.toLocaleString()} / {usage.clients.limit.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${calcPercent(usage.clients.current, usage.clients.limit)}%` }}
                />
              </div>
              <span className="text-[10px] text-text-muted block text-right">
                {calcPercent(usage.clients.current, usage.clients.limit)}% of plan limit
              </span>
            </div>

            {/* Storage Bar */}
            <div className="p-3 rounded-xl bg-surface-subtle border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-primary flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                  Media & Document Storage
                </span>
                <span className="tabular-nums font-bold text-text-primary">
                  {(usage.storageMb.current / 1024).toFixed(1)} GB / {(usage.storageMb.limit / 1024).toFixed(0)} GB
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${calcPercent(usage.storageMb.current, usage.storageMb.limit)}%` }}
                />
              </div>
              <span className="text-[10px] text-text-muted block text-right">
                {calcPercent(usage.storageMb.current, usage.storageMb.limit)}% allocated
              </span>
            </div>

            {/* Messages Bar */}
            <div className="p-3 rounded-xl bg-surface-subtle border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-primary flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  Monthly WhatsApp & SMS
                </span>
                <span className="tabular-nums font-bold text-text-primary">
                  {usage.messagesSent.current.toLocaleString()} / {usage.messagesSent.limit.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${calcPercent(usage.messagesSent.current, usage.messagesSent.limit)}%` }}
                />
              </div>
              <span className="text-[10px] text-text-muted block text-right">
                {calcPercent(usage.messagesSent.current, usage.messagesSent.limit)}% dispatched
              </span>
            </div>

            {/* AI Assistant Queries Bar */}
            <div className="p-3 rounded-xl bg-surface-subtle border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-primary flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-teal-500" />
                  AI Business Assistant Queries
                </span>
                <span className="tabular-nums font-bold text-text-primary">
                  {usage.aiQueries.current} / {usage.aiQueries.limit}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all"
                  style={{ width: `${calcPercent(usage.aiQueries.current, usage.aiQueries.limit)}%` }}
                />
              </div>
              <span className="text-[10px] text-text-muted block text-right">
                {calcPercent(usage.aiQueries.current, usage.aiQueries.limit)}% consumed
              </span>
            </div>
          </div>
        </div>

        {/* Enabled Features List */}
        <div className="p-3 rounded-xl border border-border bg-surface">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block mb-2">
            Active Entitlements & Features
          </span>
          <div className="flex flex-wrap gap-1.5">
            {tenant.features.map((feat, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-surface-subtle border border-border text-[11px] text-text-secondary flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                {feat}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
