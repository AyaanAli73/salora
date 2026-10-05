import React, { useState, useEffect, useMemo } from 'react'
import {
  Wallet,
  Clock,
  CheckCircle2,
  DollarSign,
  Calendar,
  Percent,
  Plus,
  Landmark,
  Gift,
  FileText,
  CreditCard,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import {
  PayrollRecord,
  PayrollStatus,
  PayrollDashboardStats,
  Staff,
} from '@/types'
import { payrollService } from '@/services/payrollService'
import { staffService } from '@/services/staffService'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { PayslipModal } from './PayslipModal'
import { PayrollApprovalModal } from './PayrollApprovalModal'
import { AddAdvanceModal } from './AddAdvanceModal'
import { AddBonusModal } from './AddBonusModal'
import { AddDeductionModal } from './AddDeductionModal'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

const STATUS_BADGE_MAP: Record<
  PayrollStatus,
  { label: string; variant: 'success' | 'warning' | 'primary' | 'danger' | 'default' }
> = {
  DRAFT: { label: 'Draft', variant: 'default' },
  CALCULATED: { label: 'Calculated', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'primary' },
  PAID: { label: 'Paid & Settled', variant: 'success' },
  VOID: { label: 'Void', variant: 'danger' },
}

export const PayrollDashboardView: React.FC = () => {
  const { addToast } = useToastStore()
  const [selectedPeriod, setSelectedPeriod] = useState<string>('September 2026')
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const [stats, setStats] = useState<PayrollDashboardStats | null>(null)
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCalculating, setIsCalculating] = useState(false)

  // Modals
  const [selectedForApproval, setSelectedForApproval] = useState<PayrollRecord | null>(null)
  const [selectedForPayslip, setSelectedForPayslip] = useState<PayrollRecord | null>(null)
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false)
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false)
  const [isDeductionModalOpen, setIsDeductionModalOpen] = useState(false)

  const loadData = async () => {
    try {
      const [allStaff, allRecs, dashboardStats] = await Promise.all([
        staffService.getAll(),
        Promise.resolve(payrollService.getPayrollRecords(selectedPeriod)),
        Promise.resolve(payrollService.getDashboardStats(selectedPeriod)),
      ])
      setStaffList(allStaff)
      setRecords(allRecs)
      setStats(dashboardStats)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedPeriod])

  const handleCalculateAll = async () => {
    setIsCalculating(true)
    try {
      const isAug = selectedPeriod.includes('August')
      const pStart = isAug ? '2026-08-01' : '2026-09-01'
      const pEnd = isAug ? '2026-08-31' : '2026-09-30'

      await payrollService.calculatePayrollForAll(pStart, pEnd, selectedPeriod)
      addToast({
        title: 'Payroll Calculation Complete',
        message: `Calculated payroll, attendance hours, and eligible commissions for all ${staffList.length} specialists.`,
        type: 'success',
      })
      await loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not calculate payroll'
      addToast({ title: 'Calculation Failed', message: msg, type: 'danger' })
    } finally {
      setIsCalculating(false)
    }
  }

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = r.staffName.toLowerCase().includes(q)
        const matchesNum = r.payrollNumber.toLowerCase().includes(q)
        if (!matchesName && !matchesNum) return false
      }
      return true
    })
  }, [records, statusFilter, searchQuery])

  return (
    <div className="space-y-6">
      {/* 1. Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Payroll */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Total Payroll</span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Wallet className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {formatCurrency(stats?.totalPayroll || 0)}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                {selectedPeriod} total liability
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Payroll */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Pending Payroll</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {formatCurrency(stats?.pendingPayroll || 0)}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">Awaiting manager disbursement</p>
            </div>
          </CardContent>
        </Card>

        {/* Paid This Month */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Paid This Month</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(stats?.paidThisMonth || 0)}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">Disbursed & verified</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Commission */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Total Commission</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Percent className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {formatCurrency(stats?.totalCommission || 0)}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">Earned from completed services</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Action Controls & Period Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Period Selector & Search */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="flex items-center gap-2">
                <label htmlFor="payroll-period" className="text-xs font-semibold text-text-muted shrink-0">
                  Pay Period:
                </label>
                <select
                  id="payroll-period"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-bold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                >
                  <option value="September 2026">September 2026 (Current)</option>
                  <option value="August 2026">August 2026 (Historical)</option>
                </select>
              </div>

              <div className="relative min-w-[180px] flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search specialist or pay ID…"
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdvanceModalOpen(true)}
                leftIcon={<Landmark className="h-3.5 w-3.5 text-amber-500" />}
              >
                Salary Advance
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBonusModalOpen(true)}
                leftIcon={<Gift className="h-3.5 w-3.5 text-purple-500" />}
              >
                Award Bonus
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeductionModalOpen(true)}
                leftIcon={<Percent className="h-3.5 w-3.5 text-rose-500" />}
              >
                Deduction
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={isCalculating}
                onClick={handleCalculateAll}
                leftIcon={<RefreshCw className={cn('h-3.5 w-3.5', isCalculating && 'animate-spin')} />}
                className="shadow-glow-primary/20"
              >
                {isCalculating ? 'Computing…' : 'Run / Recalculate'}
              </Button>
            </div>
          </div>

          {/* Secondary Status Filter */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <span className="text-xs font-semibold text-text-muted">Status Filter:</span>
            <div className="flex flex-wrap gap-1.5">
              {(['ALL', 'CALCULATED', 'APPROVED', 'PAID', 'VOID'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    statusFilter === st
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-muted/40 text-text-muted hover:text-text-primary'
                  )}
                >
                  {st === 'ALL' ? 'All Records' : st}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Main Payroll Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-text-muted font-semibold select-none">
              <tr>
                <th className="py-3 px-4">Specialist</th>
                <th className="py-3 px-4">Pay Model</th>
                <th className="py-3 px-4">Base Salary</th>
                <th className="py-3 px-4">Commission</th>
                <th className="py-3 px-4">Bonuses</th>
                <th className="py-3 px-4">Deductions & Adv</th>
                <th className="py-3 px-4">Net Take-Home</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Wallet className="w-8 h-8 text-text-muted/50" aria-hidden="true" />
                      <p className="text-sm font-semibold text-text-primary">
                        No payroll records found for {selectedPeriod}
                      </p>
                      <p className="text-xs">
                        Click &quot;Run / Recalculate&quot; to compute compensation, attendance hours, and eligible commissions.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleCalculateAll}
                        className="mt-2"
                      >
                        Compute {selectedPeriod} Payroll
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const statusCfg = STATUS_BADGE_MAP[r.status] || {
                    label: r.status,
                    variant: 'default',
                  }
                  const totalDeductionsAll = r.totalDeductions + r.totalAdvancesDeducted

                  return (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      {/* Specialist */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.staffName} size="sm" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text-primary truncate">
                              {r.staffName}
                            </span>
                            <span className="text-[10px] text-text-muted truncate">
                              {r.payrollNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Pay Model */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-text-muted uppercase">
                          {r.compensationType.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </td>

                      {/* Base Salary */}
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums font-medium text-text-primary">
                        {formatCurrency(r.baseSalary)}
                        {r.hourlyHoursWorked !== undefined && (
                          <span className="text-[10px] text-text-muted block">
                            ({r.hourlyHoursWorked}h clocked)
                          </span>
                        )}
                      </td>

                      {/* Commission */}
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums">
                        <span className="font-bold text-primary">
                          +{formatCurrency(r.commission)}
                        </span>
                        {r.commissionItems && r.commissionItems.length > 0 && (
                          <span className="text-[10px] text-text-muted block">
                            {r.commissionItems.length} service{r.commissionItems.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </td>

                      {/* Bonuses */}
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums">
                        {r.totalBonuses > 0 ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(r.totalBonuses)}
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>

                      {/* Deductions & Advances */}
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums">
                        {totalDeductionsAll > 0 ? (
                          <div>
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              -{formatCurrency(totalDeductionsAll)}
                            </span>
                            {r.totalAdvancesDeducted > 0 && (
                              <span className="text-[10px] text-text-muted block">
                                (incl. {formatCurrency(r.totalAdvancesDeducted)} adv)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>

                      {/* Net Take-Home */}
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums">
                        <span className="text-sm font-black text-text-primary">
                          {formatCurrency(r.netPay)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant={statusCfg.variant} size="sm">
                          {statusCfg.label}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedForApproval(r)}
                            className="text-xs h-7 px-2"
                          >
                            Review / Pay
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedForPayslip(r)}
                            className="text-xs h-7 px-2"
                            title="Print Salary Slip"
                          >
                            Slip
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
      </Card>

      {/* Modals */}
      {selectedForApproval && (
        <PayrollApprovalModal
          isOpen={Boolean(selectedForApproval)}
          onClose={() => setSelectedForApproval(null)}
          onSuccess={loadData}
          payroll={selectedForApproval}
          onOpenPayslip={(p) => {
            setSelectedForApproval(null)
            setSelectedForPayslip(p)
          }}
        />
      )}

      {selectedForPayslip && (
        <PayslipModal
          isOpen={Boolean(selectedForPayslip)}
          onClose={() => setSelectedForPayslip(null)}
          payroll={selectedForPayslip}
        />
      )}

      {isAdvanceModalOpen && (
        <AddAdvanceModal
          isOpen={isAdvanceModalOpen}
          onClose={() => setIsAdvanceModalOpen(false)}
          onSuccess={loadData}
          staffList={staffList}
        />
      )}

      {isBonusModalOpen && (
        <AddBonusModal
          isOpen={isBonusModalOpen}
          onClose={() => setIsBonusModalOpen(false)}
          onSuccess={loadData}
          staffList={staffList}
        />
      )}

      {isDeductionModalOpen && (
        <AddDeductionModal
          isOpen={isDeductionModalOpen}
          onClose={() => setIsDeductionModalOpen(false)}
          onSuccess={loadData}
          staffList={staffList}
        />
      )}
    </div>
  )
}
