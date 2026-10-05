import React, { useState, useMemo } from 'react'
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Users,
  Building2,
  MessageSquare,
  Bot,
  Zap,
  Calendar,
  Layers,
  ArrowRight,
  Shield,
  FileText,
  Download,
  Printer,
  Sparkles,
  RefreshCw,
  Plus,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'
import {
  saasBillingService,
} from '@/services/saasBillingService'
import { tenantService } from '@/services/tenantService'
import { useTenantStore } from '@/store/useTenantStore'
import { useToastStore } from '@/store/useToastStore'
import {
  SaaSInvoice,
  SalonSubscriptionDetails,
  TenantPlanTier,
  SaaSPlan,
  TenantUsageMetrics,
} from '@/types'
import { PlanComparisonModal } from '@/components/subscription/PlanComparisonModal'
import { SaaSInvoiceModal } from '@/components/subscription/SaaSInvoiceModal'
import { CancelSubscriptionModal } from '@/components/subscription/CancelSubscriptionModal'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

export const SalonSubscriptionPage: React.FC = () => {
  const { currentTenant, currentTenantId } = useTenantStore()
  const { addToast } = useToastStore()

  // State
  const [subscription, setSubscription] = useState<SalonSubscriptionDetails>(() =>
    saasBillingService.getSubscriptionDetails(currentTenantId)
  )
  const [invoices, setInvoices] = useState<SaaSInvoice[]>(() =>
    saasBillingService.getInvoicesForTenant(currentTenantId)
  )
  const usage: TenantUsageMetrics = useMemo(() =>
    tenantService.getUsageMetrics(currentTenantId),
    [currentTenantId, subscription]
  )
  const currentPlan: SaaSPlan = useMemo(() => {
    return saasBillingService.getPlanById(subscription.planId) || saasBillingService.getAllPlans()[1]
  }, [subscription.planId])

  // Modals
  const [isComparisonOpen, setIsComparisonOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<SaaSInvoice | null>(null)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const reloadData = () => {
    setSubscription(saasBillingService.getSubscriptionDetails(currentTenantId))
    setInvoices(saasBillingService.getInvoicesForTenant(currentTenantId))
  }

  // Handle Plan Change (Upgrade / Downgrade)
  const handleSelectPlan = (planId: TenantPlanTier, cycle: 'monthly' | 'annually') => {
    try {
      const result = saasBillingService.changePlan(currentTenantId, planId, cycle)
      setSubscription(result.subscription)
      setInvoices(saasBillingService.getInvoicesForTenant(currentTenantId))
      addToast({
        title: 'Plan Updated Successfully',
        message: `Your salon is now on the ${result.subscription.planName} tier (${cycle}).`,
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Error',
        message: 'Could not complete plan modification.',
        type: 'danger',
      })
    }
  }

  // Handle Cycle Toggle
  const handleToggleBillingCycle = () => {
    const nextCycle = subscription.billingCycle === 'monthly' ? 'annually' : 'monthly'
    const updated = saasBillingService.changeBillingCycle(currentTenantId, nextCycle)
    setSubscription(updated)
    addToast({
      title: 'Billing Cycle Changed',
      message: `Switched to ${nextCycle} billing.`,
      type: 'info',
    })
  }

  // Handle Cancel
  const handleConfirmCancel = (reason: string) => {
    const updated = saasBillingService.cancelSubscription(currentTenantId, reason)
    setSubscription(updated)
    addToast({
      title: 'Subscription Cancelled',
      message: 'Your plan will transition to read-only at the conclusion of the billing period.',
      type: 'warning',
    })
  }

  const calcPercent = (curr: number, limit: number) => {
    if (!limit || limit === 0) return 0
    return Math.min(100, Math.round((curr / limit) * 100))
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
              Salon Owner Billing
            </span>
            <span className="text-text-muted text-xs">•</span>
            <span className="text-text-muted text-xs">Salora Cloud Platform</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary mt-1">
            Subscription & SaaS Plan
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Manage your Salora software tier, monitor resource limits, review platform invoices, and configure billing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsComparisonOpen(true)}
            className="text-xs h-8"
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Compare Plans
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsComparisonOpen(true)}
            className="text-xs h-8"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Upgrade Plan
          </Button>
        </div>
      </div>

      {/* Trial Countdown or Warning Banner */}
      {subscription.status === 'TRIAL' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-primary/10 to-indigo-500/10 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
            <div>
              <p className="font-bold text-text-primary">
                Free Trial Active &bull; {subscription.daysLeftInTrial ?? 11} days remaining
              </p>
              <p className="text-text-muted text-[11px]">
                Your trial of {subscription.planName} concludes on {subscription.trialEndsAt || 'Oct 12, 2026'}. Activate a paid plan to ensure uninterrupted operations.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsComparisonOpen(true)}
            className="text-xs h-7.5 shrink-0 bg-teal-600 hover:bg-teal-700 text-white"
          >
            Activate Plan Now
          </Button>
        </div>
      )}

      {subscription.status === 'PAST_DUE' && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-rose-800 dark:text-rose-200">
              Payment Past Due &bull; Action Required
            </p>
            <p className="text-text-muted leading-relaxed">
              The recurring subscription invoice for {subscription.planName} was not settled. Please update your payment method to restore live client appointments.
            </p>
          </div>
        </div>
      )}

      {/* 2-Column: Current Subscription Profile & Payment Method */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Plan Card (2 cols) */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-text-primary">
                    {currentPlan.name}
                  </h3>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                      subscription.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : subscription.status === 'TRIAL'
                        ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                        : subscription.status === 'PAST_DUE'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        : 'bg-slate-500/15 text-slate-600 border border-slate-500/30'
                    )}
                  >
                    {subscription.status}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-1 max-w-lg">
                  {currentPlan.description}
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-2xl font-extrabold text-text-primary">
                    ₹
                    {(subscription.billingCycle === 'annually'
                      ? Math.round(currentPlan.priceYearly / 12)
                      : currentPlan.price
                    ).toLocaleString('en-IN')}
                  </span>
                  <span className="text-text-muted text-xs">/month</span>
                </div>
                <p className="text-[11px] text-text-muted capitalize">
                  Billed {subscription.billingCycle}
                </p>
              </div>
            </div>

            {/* Billing Details Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-subtle border border-border text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-text-muted block">
                  Next Billing Date:
                </span>
                <p className="font-semibold text-text-primary tabular-nums mt-0.5">
                  {subscription.nextBillingDate}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-text-muted block">
                  Billing Cycle:
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="font-semibold text-text-primary capitalize">
                    {subscription.billingCycle}
                  </p>
                  <button
                    type="button"
                    onClick={handleToggleBillingCycle}
                    className="text-[10px] text-primary hover:underline font-bold"
                  >
                    Switch
                  </button>
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-text-muted block">
                  Workspace Tenant:
                </span>
                <p className="font-semibold text-text-primary truncate mt-0.5">
                  {currentTenant.name}
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsComparisonOpen(true)}
                className="text-xs h-8"
              >
                Change or Upgrade Plan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsComparisonOpen(true)}
                className="text-xs h-8"
              >
                View Comparison
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setIsCancelModalOpen(true)}
              className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-semibold"
            >
              Cancel Subscription
            </button>
          </div>
        </Card>

        {/* Payment Method Card (1 col) */}
        <Card className="p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Payment Method
              </h3>
              <Badge variant="default" className="text-[9px] uppercase font-bold">
                Default
              </Badge>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary text-xs">
                  {subscription.paymentMethod?.brand || 'Visa'} Card
                </span>
                <span className="text-xs font-mono font-bold text-text-secondary">
                  •••• {subscription.paymentMethod?.last4 || '4242'}
                </span>
              </div>
              <p className="text-[11px] text-text-muted">
                Expires {subscription.paymentMethod?.expMonth || 12}/
                {subscription.paymentMethod?.expYear || 2028}
              </p>
            </div>

            <div className="space-y-1 text-xs text-text-muted">
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Auto-debit on renewal
              </p>
              <p className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" />
                Encrypted with PCI-DSS Level 1 Gateway
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              addToast({
                title: 'Payment Gateway',
                message: 'Opening secure payment method update dialog...',
                type: 'info',
              })
            }
            className="w-full text-xs h-8"
          >
            Update Payment Method
          </Button>
        </Card>
      </div>

      {/* SECTION 6: USAGE METERING (Configurable Quotas) */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-primary" />
              Salon Resource Usage & Quota Metering
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Live utilization of your {currentPlan.name} quotas.
            </p>
          </div>
          <span className="text-xs font-mono text-text-muted">
            Overage Policy: <strong className="text-text-primary uppercase">{currentPlan.overagePolicy.replace('_', ' ')}</strong>
          </span>
        </div>

        {/* Metering Progress Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Clients */}
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                Clients
              </span>
              <span className="tabular-nums font-bold text-text-primary">
                {usage.clients.current.toLocaleString()} / {currentPlan.limits.clients.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${calcPercent(usage.clients.current, currentPlan.limits.clients)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted">
              <span>{calcPercent(usage.clients.current, currentPlan.limits.clients)}% used</span>
              <span>{currentPlan.limits.clients - usage.clients.current} available</span>
            </div>
          </div>

          {/* Staff */}
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Staff Members
              </span>
              <span className="tabular-nums font-bold text-text-primary">
                {usage.staff.current} / {currentPlan.limits.staff}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${calcPercent(usage.staff.current, currentPlan.limits.staff)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted">
              <span>{calcPercent(usage.staff.current, currentPlan.limits.staff)}% used</span>
              <span>{currentPlan.limits.staff - usage.staff.current} seats left</span>
            </div>
          </div>

          {/* Branches */}
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-500" />
                Salon Branches
              </span>
              <span className="tabular-nums font-bold text-text-primary">
                {usage.branches.current} / {currentPlan.limits.branches}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all"
                style={{ width: `${calcPercent(usage.branches.current, currentPlan.limits.branches)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted">
              <span>{calcPercent(usage.branches.current, currentPlan.limits.branches)}% used</span>
              <span>{currentPlan.limits.branches - usage.branches.current} branch slot</span>
            </div>
          </div>

          {/* Automations */}
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Active Automations
              </span>
              <span className="tabular-nums font-bold text-text-primary">
                {usage.automations.current} / {currentPlan.limits.automations}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${calcPercent(usage.automations.current, currentPlan.limits.automations)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted">
              <span>{calcPercent(usage.automations.current, currentPlan.limits.automations)}% configured</span>
              <span>{currentPlan.limits.automations - usage.automations.current} rules left</span>
            </div>
          </div>

          {/* AI Inquiries */}
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-teal-600" />
                AI Assistant Queries
              </span>
              <span className="tabular-nums font-bold text-text-primary">
                {usage.aiQueries.current} / {currentPlan.limits.aiUsage}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full transition-all"
                style={{ width: `${calcPercent(usage.aiQueries.current, currentPlan.limits.aiUsage)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted">
              <span>{calcPercent(usage.aiQueries.current, currentPlan.limits.aiUsage)}% queries</span>
              <span>Renews monthly</span>
            </div>
          </div>

          {/* Storage */}
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
                Storage Space
              </span>
              <span className="tabular-nums font-bold text-text-primary">
                {(usage.storageMb.current / 1024).toFixed(1)} GB / {(currentPlan.limits.storageMb / 1024).toFixed(0)} GB
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${calcPercent(usage.storageMb.current, currentPlan.limits.storageMb)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted">
              <span>{calcPercent(usage.storageMb.current, currentPlan.limits.storageMb)}% consumed</span>
              <span>Receipts & client photos</span>
            </div>
          </div>

          {/* Messages */}
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                WhatsApp & SMS
              </span>
              <span className="tabular-nums font-bold text-text-primary">
                {usage.messagesSent.current.toLocaleString()} / {currentPlan.limits.messages.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all"
                style={{ width: `${calcPercent(usage.messagesSent.current, currentPlan.limits.messages)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted">
              <span>{calcPercent(usage.messagesSent.current, currentPlan.limits.messages)}% sent</span>
              <span>Monthly allotment</span>
            </div>
          </div>

          {/* Appointments */}
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Appointments Limit
              </span>
              <span className="tabular-nums font-bold text-text-primary">
                {usage.appointments.current.toLocaleString()} / {currentPlan.limits.appointments.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${calcPercent(usage.appointments.current, currentPlan.limits.appointments)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted">
              <span>{calcPercent(usage.appointments.current, currentPlan.limits.appointments)}% booked</span>
              <span>All branches</span>
            </div>
          </div>
        </div>

        {/* SECTION 7: OVERAGE ARCHITECTURE POLICY DISCLOSURE */}
        <div className="p-3.5 rounded-xl bg-surface-subtle border border-border flex items-start gap-2.5 text-xs text-text-muted">
          <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Overage Guarantee:</strong> Your salon operates under a{' '}
            <strong className="text-text-primary uppercase">{currentPlan.overagePolicy.replace('_', ' ')}</strong> policy.
            If you exceed quota thresholds, Salora will never silently add unexpected charges to your bill. Historical records are permanently preserved.
          </p>
        </div>
      </Card>

      {/* SECTION 8: SALORA SAAS INVOICES TABLE */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Salora SaaS Tax Invoices
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Receipts and invoices for your salon subscription.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-subtle border border-border text-text-secondary">
            {invoices.length} Invoices
          </span>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-secondary">
              <thead className="bg-surface-subtle border-b border-border text-[10px] font-bold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="p-3">Invoice Number</th>
                  <th className="p-3">Plan Description</th>
                  <th className="p-3">Service Period</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-text-muted">
                      No SaaS invoices generated for this workspace yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-text-primary">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-text-primary">{inv.planName}</p>
                        <p className="text-[10px] text-text-muted capitalize">Cycle: {inv.billingCycle}</p>
                      </td>
                      <td className="p-3 text-text-muted">
                        {inv.periodStart} &rarr; {inv.periodEnd}
                      </td>
                      <td className="p-3 font-bold text-text-primary tabular-nums">
                        ₹{inv.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            inv.paymentStatus === 'PAID'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedInvoice(inv)}
                            className="text-xs h-7 px-2"
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInvoice(inv)}
                            className="text-xs h-7 px-2"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Receipt
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Modals */}
      <PlanComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        currentPlanId={subscription.planId}
        currentBillingCycle={subscription.billingCycle}
        onSelectPlan={handleSelectPlan}
      />

      <SaaSInvoiceModal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />

      <CancelSubscriptionModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        planName={currentPlan.name}
        nextBillingDate={subscription.nextBillingDate}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  )
}
