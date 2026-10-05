import React, { useState, useEffect, useMemo } from 'react'
import {
  History,
  Search,
  Filter,
  FileText,
  Printer,
  Calendar,
  Wallet,
  CheckCircle2,
  Download,
  CreditCard,
} from 'lucide-react'
import { PayrollRecord, PayrollStatus, Staff } from '@/types'
import { payrollService } from '@/services/payrollService'
import { staffService } from '@/services/staffService'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { PayslipModal } from './PayslipModal'
import { cn } from '@/utils/cn'

export const PayrollHistoryView: React.FC = () => {
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    try {
      const [allStaff, allRecs] = await Promise.all([
        staffService.getAll(),
        Promise.resolve(payrollService.getPayrollRecords()),
      ])
      setStaffList(allStaff)
      setRecords(allRecs)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedStaffId !== 'ALL' && r.staffId !== selectedStaffId) return false
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = r.staffName.toLowerCase().includes(q)
        const matchesId = r.payrollNumber.toLowerCase().includes(q)
        const matchesPeriod = r.periodName.toLowerCase().includes(q)
        if (!matchesName && !matchesId && !matchesPeriod) return false
      }
      return true
    })
  }, [records, selectedStaffId, statusFilter, searchQuery])

  // Total Disbursed in this filtered slice
  const totalDisbursed = useMemo(() => {
    return filteredRecords
      .filter((r) => r.status === 'PAID')
      .reduce((sum, r) => sum + (r.netPay || 0), 0)
  }, [filteredRecords])

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Historical Payroll Archive</h2>
          <p className="text-xs text-text-muted">
            Permanent ledger of settled compensation runs, payslips, and compliance disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border text-xs">
          <span className="text-text-muted">Total Filtered Disbursals:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-sm">
            {formatCurrency(totalDisbursed)}
          </span>
        </div>
      </div>

      {/* 2. Filters Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search payroll ID, specialist, or period…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            {/* Specialist Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="hist-staff-filter" className="text-xs font-semibold text-text-muted shrink-0">
                Specialist:
              </label>
              <select
                id="hist-staff-filter"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer min-w-[160px]"
              >
                <option value="ALL">All Specialists</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="hist-status-filter" className="text-xs font-semibold text-text-muted shrink-0">
                Status:
              </label>
              <select
                id="hist-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PayrollStatus | 'ALL')}
                className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer min-w-[130px]"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid Only</option>
                <option value="APPROVED">Approved Only</option>
                <option value="CALCULATED">Calculated</option>
                <option value="VOID">Voided</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. History Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-text-muted font-semibold select-none">
              <tr>
                <th className="py-3 px-4">Payroll #</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Specialist</th>
                <th className="py-3 px-4">Gross Earnings</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Disbursed</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Disbursal Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-text-muted">
                    No historical payroll records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-text-primary whitespace-nowrap">
                      {r.payrollNumber}
                    </td>

                    <td className="py-3 px-4 font-medium text-text-primary whitespace-nowrap">
                      {r.periodName}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.staffName} size="xs" />
                        <span className="font-semibold text-text-primary">{r.staffName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap tabular-nums font-medium text-text-primary">
                      {formatCurrency(r.grossPay)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap tabular-nums font-medium text-rose-600 dark:text-rose-400">
                      -{formatCurrency(r.totalDeductions + r.totalAdvancesDeducted)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap tabular-nums font-black text-text-primary text-sm">
                      {formatCurrency(r.netPay)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {r.paymentMethod ? (
                        <div className="text-[11px]">
                          <span className="font-semibold text-text-primary">
                            {r.paymentMethod}
                          </span>
                          {r.paymentReference && (
                            <span className="text-[10px] text-text-muted block truncate max-w-[120px]">
                              {r.paymentReference}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-text-muted italic">Unsettled</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-text-muted tabular-nums">
                      {r.paidAt ? formatDate(r.paidAt) : '—'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          r.status === 'PAID'
                            ? 'success'
                            : r.status === 'APPROVED'
                            ? 'primary'
                            : r.status === 'VOID'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {r.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPayslip(r)}
                        leftIcon={<FileText className="w-3.5 h-3.5" />}
                        className="text-xs h-7 px-2.5"
                      >
                        View Slip
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payslip Modal */}
      {selectedPayslip && (
        <PayslipModal
          isOpen={Boolean(selectedPayslip)}
          onClose={() => setSelectedPayslip(null)}
          payroll={selectedPayslip}
        />
      )}
    </div>
  )
}
