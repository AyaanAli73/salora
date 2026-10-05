import React, { useState, useEffect } from 'react'
import {
  Sliders,
  Percent,
  Plus,
  Edit2,
  Trash2,
  ShieldAlert,
  Sparkles,
  CreditCard,
  Building2,
  User,
  ArrowRight,
  HelpCircle,
} from 'lucide-react'
import {
  Staff,
  StaffCompensationConfig,
  CommissionRule,
  CommissionRuleScope,
} from '@/types'
import { payrollService } from '@/services/payrollService'
import { commissionService } from '@/services/commissionService'
import { staffService } from '@/services/staffService'
import { formatCurrency } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { CompensationConfigModal } from './CompensationConfigModal'
import { CommissionRuleModal } from './CommissionRuleModal'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

export const StaffCompensationView: React.FC = () => {
  const { addToast } = useToastStore()
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [configs, setConfigs] = useState<StaffCompensationConfig[]>([])
  const [rules, setRules] = useState<CommissionRule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null)

  const loadData = async () => {
    try {
      const [allStaff, allConfigs, allRules] = await Promise.all([
        staffService.getAll(),
        Promise.resolve(payrollService.getCompensationConfigs()),
        Promise.resolve(commissionService.getRules()),
      ])
      setStaffList(allStaff)
      setConfigs(allConfigs)
      setRules(allRules)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDeleteRule = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove rule "${name}"?`)) {
      commissionService.deleteRule(id)
      addToast({
        title: 'Rule Deleted',
        message: `Commission rule "${name}" has been removed.`,
        type: 'info',
      })
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Staff Compensation & Commission Models</h2>
          <p className="text-xs text-text-muted">
            Configure base salaries, hourly attendance rates, and deterministic multi-tier commission hierarchies.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingRule(null)
            setIsRuleModalOpen(true)
          }}
          leftIcon={<Plus className="h-4 w-4" />}
          className="shadow-glow-primary/20"
        >
          New Commission Rule
        </Button>
      </div>

      {/* 2. Staff Compensation Profiles Table */}
      <Card>
        <CardHeader className="p-4 pb-2 border-b border-border">
          <CardTitle className="text-sm font-bold text-text-primary">
            Active Specialist Remuneration Packages
          </CardTitle>
          <p className="text-xs text-text-muted">
            Directly manages base pay models and default commission splits
          </p>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-text-muted font-semibold select-none">
              <tr>
                <th className="py-3 px-4">Specialist</th>
                <th className="py-3 px-4">Compensation Structure</th>
                <th className="py-3 px-4">Base / Hourly Rate</th>
                <th className="py-3 px-4">Baseline Commission</th>
                <th className="py-3 px-4">Payout Account Details</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staffList.map((st) => {
                const conf =
                  configs.find((c) => c.staffId === st.id) ||
                  payrollService.getCompensationConfig(st.id)

                return (
                  <tr key={st.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={st.name} src={st.avatarUrl} size="sm" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary truncate">
                            {st.name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">{st.role}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          conf.compensationType === 'FIXED_PLUS_COMMISSION'
                            ? 'primary'
                            : conf.compensationType === 'COMMISSION_ONLY'
                            ? 'accent'
                            : conf.compensationType === 'HOURLY'
                            ? 'warning'
                            : 'default'
                        }
                        size="sm"
                      >
                        {conf.compensationType.replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-medium text-text-primary tabular-nums">
                      {conf.compensationType === 'HOURLY' ? (
                        <span>{formatCurrency(conf.hourlyRate)} / hr</span>
                      ) : conf.compensationType === 'COMMISSION_ONLY' ? (
                        <span className="text-text-muted italic">Volume only</span>
                      ) : (
                        <span>{formatCurrency(conf.baseSalary)} / mo</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap tabular-nums">
                      {conf.compensationType !== 'FIXED' ? (
                        <span className="font-bold text-primary">
                          {conf.defaultCommissionRate}%
                        </span>
                      ) : (
                        <span className="text-text-muted italic">None (Fixed)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-[220px]">
                      {conf.bankDetails?.bankName ? (
                        <div className="text-[11px] truncate">
                          <span className="font-semibold text-text-primary">
                            {conf.bankDetails.bankName}
                          </span>
                          <span className="text-text-muted block font-mono text-[10px] truncate">
                            {conf.bankDetails.accountNumber} • {conf.bankDetails.ifscCode}
                          </span>
                        </div>
                      ) : conf.bankDetails?.upiId ? (
                        <span className="font-mono text-xs text-text-primary">
                          {conf.bankDetails.upiId}
                        </span>
                      ) : (
                        <span className="text-text-muted italic">Not configured</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingStaff(st)}
                        leftIcon={<Sliders className="h-3 w-3" />}
                        className="text-xs h-7 px-2.5"
                      >
                        Configure Terms
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 3. Deterministic Commission Rule Hierarchy Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-bold text-text-primary">
              Deterministic Rule Hierarchy & Resolution Order
            </h3>
          </div>
          <span className="text-xs text-text-muted">
            Evaluated top-to-bottom upon bill completion
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Priority 1 */}
          <div className="p-3.5 rounded-xl border border-border bg-primary/5 space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-primary font-mono">PRIORITY 1</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary text-white">
                Highest
              </span>
            </div>
            <h4 className="font-bold text-xs text-text-primary">Staff-Specific Rule</h4>
            <p className="text-[11px] text-text-muted leading-tight">
              Overrides all general rules when a designated specialist performs a treatment.
            </p>
          </div>

          {/* Priority 2 */}
          <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-text-muted font-mono">PRIORITY 2</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-muted text-text-muted">
                High
              </span>
            </div>
            <h4 className="font-bold text-xs text-text-primary">Service-Specific Rule</h4>
            <p className="text-[11px] text-text-muted leading-tight">
              Applies a custom % or fixed INR bounty to an individual salon service.
            </p>
          </div>

          {/* Priority 3 */}
          <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-text-muted font-mono">PRIORITY 3</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-muted text-text-muted">
                Category
              </span>
            </div>
            <h4 className="font-bold text-xs text-text-primary">Category Rule</h4>
            <p className="text-[11px] text-text-muted leading-tight">
              Applies uniform commission across entire departments (Hair, Spa, Nails).
            </p>
          </div>

          {/* Priority 4 */}
          <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-text-muted font-mono">PRIORITY 4</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-muted text-text-muted">
                Baseline
              </span>
            </div>
            <h4 className="font-bold text-xs text-text-primary">Salon Default Rule</h4>
            <p className="text-[11px] text-text-muted leading-tight">
              Fallback baseline percentage applied to any eligible unmapped transaction.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Active Commission Rules Table */}
      <Card>
        <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-text-primary">
            Active Commission Rules Register ({rules.length})
          </CardTitle>
          <span className="text-xs text-text-muted">
            Ranked deterministically by priority
          </span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-text-muted font-semibold select-none">
              <tr>
                <th className="py-3 px-4">Priority & Scope</th>
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-4">Incentive Rate</th>
                <th className="py-3 px-4">Target Mapping</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rules.map((rule) => {
                const targetStaff = staffList.find((s) => s.id === rule.staffId)

                return (
                  <tr key={rule.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-muted text-text-primary">
                          P{rule.priority}
                        </span>
                        <Badge
                          variant={
                            rule.scope === 'STAFF_SPECIFIC'
                              ? 'primary'
                              : rule.scope === 'SERVICE_SPECIFIC'
                              ? 'accent'
                              : rule.scope === 'CATEGORY'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {rule.scope.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-text-primary">
                      {rule.name}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap tabular-nums">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {rule.ruleType === 'PERCENTAGE'
                          ? `${rule.value}%`
                          : formatCurrency(rule.value)}
                      </span>
                      <span className="text-[10px] text-text-muted block">
                        {rule.ruleType === 'PERCENTAGE' ? 'of service price' : 'per treatment'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {rule.scope === 'STAFF_SPECIFIC' ? (
                        <span className="font-medium text-text-primary">
                          {targetStaff?.name || rule.staffId}
                          {rule.serviceCategory && ` (${rule.serviceCategory})`}
                        </span>
                      ) : rule.scope === 'CATEGORY' ? (
                        <span className="font-medium text-text-primary">
                          {rule.serviceCategory} Category
                        </span>
                      ) : rule.scope === 'SERVICE_SPECIFIC' ? (
                        <span className="font-mono text-[11px] text-text-primary">
                          {rule.serviceId}
                        </span>
                      ) : (
                        <span className="text-text-muted italic">All General Services</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-text-muted max-w-[200px] truncate" title={rule.description}>
                      {rule.description || '—'}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRule(rule)
                            setIsRuleModalOpen(true)
                          }}
                          aria-label={`Edit rule ${rule.name}`}
                          className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        {rule.scope !== 'DEFAULT' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule.id, rule.name)}
                            aria-label={`Delete rule ${rule.name}`}
                            className="p-1 rounded text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      {editingStaff && (
        <CompensationConfigModal
          isOpen={Boolean(editingStaff)}
          onClose={() => setEditingStaff(null)}
          onSuccess={loadData}
          staff={editingStaff}
        />
      )}

      {isRuleModalOpen && (
        <CommissionRuleModal
          isOpen={isRuleModalOpen}
          onClose={() => setIsRuleModalOpen(false)}
          onSuccess={loadData}
          staffList={staffList}
          ruleToEdit={editingRule}
        />
      )}
    </div>
  )
}
