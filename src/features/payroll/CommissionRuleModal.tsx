import React, { useState } from 'react'
import { Percent, X, Sparkles, AlertCircle } from 'lucide-react'
import {
  CommissionRule,
  CommissionRuleScope,
  CommissionRuleType,
  Staff,
} from '@/types'
import { commissionService } from '@/services/commissionService'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

interface CommissionRuleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staffList: Staff[]
  ruleToEdit?: CommissionRule | null
}

const SCOPE_CONFIG: Record<
  CommissionRuleScope,
  { label: string; priority: number; desc: string }
> = {
  STAFF_SPECIFIC: {
    label: 'Staff-Specific Rule',
    priority: 1,
    desc: 'Highest Priority: Overrides all other rules for a designated specialist.',
  },
  SERVICE_SPECIFIC: {
    label: 'Service-Specific Rule',
    priority: 2,
    desc: 'High Priority: Overrides category & default rules for a specific service.',
  },
  CATEGORY: {
    label: 'Category-Based Rule',
    priority: 3,
    desc: 'Standard Priority: Applies to all services within an entire treatment category.',
  },
  DEFAULT: {
    label: 'Salon Default Rule',
    priority: 4,
    desc: 'Baseline Priority: Fallback percentage across all general services.',
  },
}

export const CommissionRuleModal: React.FC<CommissionRuleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  ruleToEdit,
}) => {
  const { addToast } = useToastStore()
  const isEditing = Boolean(ruleToEdit)

  const [name, setName] = useState(ruleToEdit?.name || '')
  const [scope, setScope] = useState<CommissionRuleScope>(
    ruleToEdit?.scope || 'CATEGORY'
  )
  const [ruleType, setRuleType] = useState<CommissionRuleType>(
    ruleToEdit?.ruleType || 'PERCENTAGE'
  )
  const [value, setValue] = useState<number>(ruleToEdit?.value || 20)
  const [staffId, setStaffId] = useState(ruleToEdit?.staffId || staffList[0]?.id || '')
  const [serviceCategory, setServiceCategory] = useState(
    ruleToEdit?.serviceCategory || 'Hair'
  )
  const [description, setDescription] = useState(ruleToEdit?.description || '')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      addToast({ title: 'Validation Error', message: 'Rule name is required.', type: 'danger' })
      return
    }
    if (value <= 0) {
      addToast({ title: 'Validation Error', message: 'Commission value must be greater than zero.', type: 'danger' })
      return
    }

    try {
      const priority = SCOPE_CONFIG[scope].priority

      if (isEditing && ruleToEdit) {
        commissionService.updateRule(ruleToEdit.id, {
          name,
          scope,
          ruleType,
          value,
          staffId: scope === 'STAFF_SPECIFIC' ? staffId : undefined,
          serviceCategory: scope === 'CATEGORY' || scope === 'STAFF_SPECIFIC' ? serviceCategory : undefined,
          description,
          priority,
        })
        addToast({
          title: 'Rule Updated',
          message: `Commission rule "${name}" updated.`,
          type: 'success',
        })
      } else {
        commissionService.createRule({
          name,
          scope,
          ruleType,
          value,
          staffId: scope === 'STAFF_SPECIFIC' ? staffId : undefined,
          serviceCategory: scope === 'CATEGORY' || scope === 'STAFF_SPECIFIC' ? serviceCategory : undefined,
          isActive: true,
          description,
          priority,
        })
        addToast({
          title: 'Rule Created',
          message: `Commission rule "${name}" created with Priority ${priority}.`,
          type: 'success',
        })
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save commission rule'
      addToast({ title: 'Error', message: msg, type: 'danger' })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rule-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Percent className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="rule-modal-title" className="text-base font-bold text-text-primary">
                {isEditing ? 'Edit Commission Rule' : 'New Commission Rule'}
              </h3>
              <p className="text-xs text-text-muted">
                Define deterministic incentive criteria & hierarchical priority
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rule modal"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Rule Scope Selection (Hierarchy Level) */}
          <div>
            <span className="block text-xs font-semibold text-text-primary mb-1.5">
              Rule Scope & Hierarchy Level *
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(SCOPE_CONFIG) as CommissionRuleScope[]).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setScope(sc)}
                  className={cn(
                    'p-2.5 rounded-xl border text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    scope === sc
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-border text-text-muted hover:text-text-primary bg-muted/20'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{SCOPE_CONFIG[sc].label}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-background font-mono">
                      P{SCOPE_CONFIG[sc].priority}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted block mt-0.5 leading-tight">
                    {SCOPE_CONFIG[sc].desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Rule Name */}
          <div>
            <label htmlFor="rule-name" className="block text-xs font-semibold text-text-primary mb-1">
              Rule Name *
            </label>
            <input
              type="text"
              id="rule-name"
              name="ruleName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Senior Stylist Cuts Bonus, Spa 25% Incentive…"
              required
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          {/* Type and Value */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/30 border border-border">
            <div>
              <label htmlFor="rule-type" className="block text-xs font-semibold text-text-primary mb-1">
                Commission Model *
              </label>
              <select
                id="rule-type"
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as CommissionRuleType)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_PER_SERVICE">Fixed Amount (₹ per service)</option>
              </select>
            </div>

            <div>
              <label htmlFor="rule-val" className="block text-xs font-semibold text-text-primary mb-1">
                Value {ruleType === 'PERCENTAGE' ? '(%)' : '(₹)'} *
              </label>
              <input
                type="number"
                id="rule-val"
                name="ruleVal"
                min="1"
                step={ruleType === 'PERCENTAGE' ? '1' : '50'}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                required
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm font-bold text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Conditional Targets */}
          {scope === 'STAFF_SPECIFIC' && (
            <div>
              <label htmlFor="rule-staff" className="block text-xs font-semibold text-text-primary mb-1">
                Target Specialist *
              </label>
              <select
                id="rule-staff"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} — {st.role}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(scope === 'CATEGORY' || scope === 'STAFF_SPECIFIC') && (
            <div>
              <label htmlFor="rule-cat" className="block text-xs font-semibold text-text-primary mb-1">
                Service Category *
              </label>
              <select
                id="rule-cat"
                value={serviceCategory}
                onChange={(e) => setServiceCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                <option value="Hair">Hair Care & Styling</option>
                <option value="Spa">Spa & Facial Rituals</option>
                <option value="Nails">Nail Art & Manicure</option>
                <option value="Makeup">Bridal & Glam Makeup</option>
                <option value="General">General / All Categories</option>
              </select>
            </div>
          )}

          <div>
            <label htmlFor="rule-desc" className="block text-xs font-semibold text-text-primary mb-1">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              id="rule-desc"
              name="ruleDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Target incentive for premium keratin services…"
              className="w-full h-9 px-3 rounded-xl border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              type="submit"
              variant="primary"
              className="flex-1 justify-center py-2.5 shadow-glow-primary/20"
            >
              {isEditing ? 'Save Rule Changes' : 'Create Commission Rule'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-24 justify-center"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
