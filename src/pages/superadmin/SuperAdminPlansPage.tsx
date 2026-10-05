import React, { useState } from 'react'
import {
  Layers,
  Edit2,
  Check,
  Plus,
  Shield,
  HardDrive,
  Users,
  Building2,
  Bot,
  Zap,
  MessageSquare,
  Calendar,
  Save,
  CheckCircle2,
} from 'lucide-react'
import { saasBillingService } from '@/services/saasBillingService'
import { SaaSPlan, TenantPlanTier, OveragePolicy } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

export const SuperAdminPlansPage: React.FC = () => {
  const { addToast } = useToastStore()
  const [plans, setPlans] = useState<SaaSPlan[]>(() => saasBillingService.getAllPlans())
  const [editingPlan, setEditingPlan] = useState<SaaSPlan | null>(null)

  // Edit form state
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState(0)
  const [formPriceYearly, setFormPriceYearly] = useState(0)
  const [formOverage, setFormOverage] = useState<OveragePolicy>('soft_limit')
  const [formLimits, setFormLimits] = useState<SaaSPlan['limits']>({
    branches: 1,
    staff: 5,
    clients: 1000,
    appointments: 2500,
    storageMb: 2048,
    messages: 1000,
    automations: 10,
    aiUsage: 50,
  })

  const handleOpenEdit = (plan: SaaSPlan) => {
    setEditingPlan(plan)
    setFormName(plan.name)
    setFormPrice(plan.price)
    setFormPriceYearly(plan.priceYearly)
    setFormOverage(plan.overagePolicy)
    setFormLimits({ ...plan.limits })
  }

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlan) return

    try {
      const updated = saasBillingService.updatePlan(editingPlan.id, {
        name: formName,
        price: Number(formPrice),
        priceYearly: Number(formPriceYearly),
        overagePolicy: formOverage,
        limits: formLimits,
      })

      setPlans(saasBillingService.getAllPlans())
      setEditingPlan(null)

      addToast({
        title: 'Plan Updated',
        message: `${updated.name} quotas and pricing saved to database.`,
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Error',
        message: 'Could not save plan modifications.',
        type: 'danger',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="text-[10px] font-mono uppercase font-bold">
              Super Admin
            </Badge>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-400 text-xs font-mono">/super-admin/plans</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1 tracking-tight">
            SaaS Plan Management & Quota Policy
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure pricing tiers, resource ceilings, and overage policies across all salon workspaces.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-teal-400 font-mono">
            {plans.length} Configured Tiers
          </span>
        </div>
      </div>

      {/* Plan Cards Grid (Read dynamically from saasBillingService) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              'p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all',
              plan.isPopular
                ? 'bg-slate-900 border-teal-500/50 shadow-xl'
                : 'bg-slate-900 border-slate-800'
            )}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-base">{plan.name}</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-teal-400 font-mono text-[9px] uppercase font-bold border border-slate-700">
                  {plan.status}
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-white tabular-nums">
                  ₹{plan.price.toLocaleString('en-IN')}
                </span>
                <span className="text-slate-400 text-xs">/month</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Annual: ₹{plan.priceYearly.toLocaleString('en-IN')}/yr
              </p>

              {/* Limits Table */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Branches:</span>
                  <span className="font-semibold text-white">{plan.limits.branches}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Staff Limit:</span>
                  <span className="font-semibold text-white">{plan.limits.staff}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Clients:</span>
                  <span className="font-semibold text-white">{plan.limits.clients.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Appointments:</span>
                  <span className="font-semibold text-white">{plan.limits.appointments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Storage:</span>
                  <span className="font-semibold text-white">{(plan.limits.storageMb / 1024).toFixed(0)} GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Messages:</span>
                  <span className="font-semibold text-white">{plan.limits.messages.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Automations:</span>
                  <span className="font-semibold text-white">{plan.limits.automations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AI Queries:</span>
                  <span className="font-semibold text-white">{plan.limits.aiUsage} /mo</span>
                </div>
                <div className="pt-1 border-t border-slate-800 flex justify-between text-[11px]">
                  <span className="text-slate-500">Overage:</span>
                  <span className="font-mono text-teal-400 uppercase font-bold text-[10px]">
                    {plan.overagePolicy}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEdit(plan)}
              className="w-full border-slate-700 bg-slate-800 text-slate-200 hover:text-white text-xs h-8"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
              Edit Plan Quotas
            </Button>
          </div>
        ))}
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <Modal
          isOpen={Boolean(editingPlan)}
          onClose={() => setEditingPlan(null)}
          title={`Configure Quotas — ${editingPlan.name}`}
          size="md"
        >
          <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-text-primary block mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-text-primary block mb-1">
                  Overage Policy (Section 7)
                </label>
                <select
                  value={formOverage}
                  onChange={(e) => setFormOverage(e.target.value as OveragePolicy)}
                  className="w-full rounded-xl border border-border bg-surface px-2.5 py-1.5 text-text-primary focus:outline-none"
                >
                  <option value="soft_limit">Soft Limit (Grace notifications)</option>
                  <option value="blocked">Blocked (Strict paywall)</option>
                  <option value="paid_overage">Paid Overage (Metered add-on)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-text-primary block mb-1">
                  Monthly Price (INR)
                </label>
                <input
                  type="number"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-text-primary block mb-1">
                  Annual Price (INR)
                </label>
                <input
                  type="number"
                  required
                  value={formPriceYearly}
                  onChange={(e) => setFormPriceYearly(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-text-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Quota Fields */}
            <div className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-3">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
                Resource Limit Configuration (Section 2)
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-text-muted block mb-0.5">
                    Branches
                  </label>
                  <input
                    type="number"
                    value={formLimits.branches}
                    onChange={(e) =>
                      setFormLimits({ ...formLimits, branches: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-text-muted block mb-0.5">
                    Staff Seats
                  </label>
                  <input
                    type="number"
                    value={formLimits.staff}
                    onChange={(e) =>
                      setFormLimits({ ...formLimits, staff: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-text-muted block mb-0.5">
                    Client Quota
                  </label>
                  <input
                    type="number"
                    value={formLimits.clients}
                    onChange={(e) =>
                      setFormLimits({ ...formLimits, clients: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-text-muted block mb-0.5">
                    Appointments
                  </label>
                  <input
                    type="number"
                    value={formLimits.appointments}
                    onChange={(e) =>
                      setFormLimits({ ...formLimits, appointments: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-text-muted block mb-0.5">
                    Storage (MB)
                  </label>
                  <input
                    type="number"
                    value={formLimits.storageMb}
                    onChange={(e) =>
                      setFormLimits({ ...formLimits, storageMb: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-text-muted block mb-0.5">
                    WhatsApp & SMS
                  </label>
                  <input
                    type="number"
                    value={formLimits.messages}
                    onChange={(e) =>
                      setFormLimits({ ...formLimits, messages: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-text-muted block mb-0.5">
                    Automations
                  </label>
                  <input
                    type="number"
                    value={formLimits.automations}
                    onChange={(e) =>
                      setFormLimits({ ...formLimits, automations: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-text-muted block mb-0.5">
                    AI Queries / Month
                  </label>
                  <input
                    type="number"
                    value={formLimits.aiUsage}
                    onChange={(e) =>
                      setFormLimits({ ...formLimits, aiUsage: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-text-primary"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingPlan(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Plan Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
