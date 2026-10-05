import React, { useState } from 'react'
import {
  Check,
  Zap,
  Building2,
  Users,
  HardDrive,
  MessageSquare,
  Bot,
  Calendar,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle,
} from 'lucide-react'
import { SaaSPlan, TenantPlanTier } from '@/types'
import { saasBillingService } from '@/services/saasBillingService'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface PlanComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlanId: TenantPlanTier
  currentBillingCycle?: 'monthly' | 'annually'
  onSelectPlan: (planId: TenantPlanTier, cycle: 'monthly' | 'annually') => void
}

export const PlanComparisonModal: React.FC<PlanComparisonModalProps> = ({
  isOpen,
  onClose,
  currentPlanId,
  currentBillingCycle = 'monthly',
  onSelectPlan,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>(currentBillingCycle)
  const plans: SaaSPlan[] = saasBillingService.getAllPlans()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Salora SaaS Plans & Tier Comparison"
      size="xl"
    >
      <div className="space-y-6 text-xs">
        {/* Billing Cycle Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-subtle border border-border">
          <div>
            <p className="font-bold text-sm text-text-primary">
              Choose the right subscription tier for your salon
            </p>
            <p className="text-text-muted text-xs mt-0.5">
              Transparent quotas, no hidden fees, instant prorated activation.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="inline-flex p-1 rounded-xl bg-surface border border-border">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                  billingCycle === 'monthly'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annually')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5',
                  billingCycle === 'annually'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                <span>Annual Billing</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold uppercase">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Plans Side-by-Side Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId
            const price = billingCycle === 'annually' ? Math.round(plan.priceYearly / 12) : plan.price
            const isUpgrade =
              (currentPlanId === 'starter' && plan.id !== 'starter') ||
              (currentPlanId === 'professional' && (plan.id === 'business' || plan.id === 'enterprise')) ||
              (currentPlanId === 'business' && plan.id === 'enterprise')

            return (
              <div
                key={plan.id}
                className={cn(
                  'p-4 rounded-2xl border flex flex-col justify-between gap-4 transition-all relative',
                  isCurrent
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : plan.isPopular
                    ? 'border-teal-500/40 bg-surface shadow-md'
                    : 'border-border bg-surface'
                )}
              >
                {/* Popular / Current Badges */}
                <div className="flex items-center justify-between min-h-[22px]">
                  {isCurrent ? (
                    <Badge variant="primary" className="text-[10px] uppercase font-bold">
                      Current Plan
                    </Badge>
                  ) : plan.isPopular ? (
                    <Badge variant="default" className="text-[10px] uppercase font-bold bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30">
                      Most Popular
                    </Badge>
                  ) : (
                    <span />
                  )}
                  <span className="text-[10px] font-mono text-text-muted uppercase">
                    {plan.overagePolicy.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-base font-extrabold text-text-primary">
                      {plan.name}
                    </h4>
                    <p className="text-[11px] text-text-muted mt-1 leading-snug">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-text-primary">
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-text-muted text-[11px]">/mo</span>
                    </div>
                    {billingCycle === 'annually' && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        ₹{plan.priceYearly.toLocaleString('en-IN')} billed annually
                      </p>
                    )}
                  </div>

                  {/* Quotas & Limits (Section 2 & 6) */}
                  <div className="p-2.5 rounded-xl bg-surface-subtle border border-border space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Branches:</span>
                      <span className="font-bold text-text-primary">{plan.limits.branches} location(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Staff:</span>
                      <span className="font-bold text-text-primary">{plan.limits.staff} members</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Clients:</span>
                      <span className="font-bold text-text-primary">{plan.limits.clients.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Storage:</span>
                      <span className="font-bold text-text-primary">{(plan.limits.storageMb / 1024).toFixed(0)} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Messages:</span>
                      <span className="font-bold text-text-primary">{plan.limits.messages.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Automations:</span>
                      <span className="font-bold text-text-primary">{plan.limits.automations} rules</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">AI Queries:</span>
                      <span className="font-bold text-text-primary">{plan.limits.aiUsage} /mo</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
                      Core Features:
                    </span>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-text-secondary leading-tight">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Selection Action */}
                <div className="pt-3 border-t border-border">
                  {isCurrent ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="w-full text-xs h-8 bg-surface-subtle"
                    >
                      Active Plan
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        onSelectPlan(plan.id, billingCycle)
                        onClose()
                      }}
                      className={cn(
                        'w-full text-xs h-8',
                        isUpgrade
                          ? 'bg-primary hover:bg-primary-hover text-white'
                          : 'bg-surface border border-border text-text-primary hover:bg-surface-subtle'
                      )}
                    >
                      {isUpgrade ? 'Upgrade to ' + plan.name : 'Downgrade to ' + plan.name}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Historical Data Protection Notice (Section 2) */}
        <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-start gap-2.5 text-xs text-text-muted">
          <Shield className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Historical Data Guarantee:</strong> When switching plans, your existing client records, appointment history, invoices, and staff logs are permanently preserved and never deleted or locked.
          </p>
        </div>
      </div>
    </Modal>
  )
}
