import React, { useState } from 'react'
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  ArrowUpDown,
  MoreVertical,
  Plus,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Expense,
  ExpenseCategory,
  ExpenseFilter,
  ExpensePaymentMethod,
  ExpenseStatus,
  Supplier,
} from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface ExpenseHistoryViewProps {
  expenses: Expense[]
  categories: ExpenseCategory[]
  suppliers: Supplier[]
  onAddExpense: () => void
  onViewExpense: (expense: Expense) => void
  onEditExpense: (expense: Expense) => void
  onMarkPaid: (expense: Expense) => void
  onCancelExpense: (expense: Expense) => void
}

export const ExpenseHistoryView: React.FC<ExpenseHistoryViewProps> = ({
  expenses,
  categories,
  suppliers,
  onAddExpense,
  onViewExpense,
  onEditExpense,
  onMarkPaid,
  onCancelExpense,
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'>('ALL')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Filter computation
  const filteredExpenses = expenses.filter((e) => {
    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      const matches =
        e.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.referenceNumber?.toLowerCase().includes(q) ||
        e.supplierName?.toLowerCase().includes(q) ||
        e.categoryName.toLowerCase().includes(q)
      if (!matches) return false
    }

    // Category
    if (categoryFilter !== 'ALL' && e.categoryId !== categoryFilter) {
      return false
    }

    // Payment Method
    if (paymentMethodFilter !== 'ALL' && e.paymentMethod !== paymentMethodFilter) {
      return false
    }

    // Status
    if (statusFilter !== 'ALL' && e.status !== statusFilter) {
      return false
    }

    // Date range
    const todayStr = new Date().toISOString().split('T')[0]
    if (dateFilter === 'TODAY' && e.date !== todayStr) return false
    if (dateFilter === 'THIS_MONTH') {
      const monthPrefix = todayStr.substring(0, 7)
      if (!e.date.startsWith(monthPrefix)) return false
    }
    if (dateFilter === 'CUSTOM') {
      if (customStartDate && e.date < customStartDate) return false
      if (customEndDate && e.date > customEndDate) return false
    }

    return true
  })

  // Pagination slicing
  const totalPages = Math.ceil(filteredExpenses.length / pageSize) || 1
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Voucher ID',
      'Date',
      'Name',
      'Category',
      'Supplier',
      'Amount (INR)',
      'Payment Method',
      'Status',
      'Reference Number',
      'Created By',
    ]

    const rows = filteredExpenses.map((e) => [
      e.id,
      e.date,
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.categoryName}"`,
      `"${(e.supplierName || 'General Payee').replace(/"/g, '""')}"`,
      e.amount,
      e.paymentMethod,
      e.status,
      `"${e.referenceNumber || 'N/A'}"`,
      `"${e.createdBy}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `SALORA_Expense_Ledger_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters Bar */}
      <Card className="border-border/80 p-4">
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search expense name, ref #, supplier, or ID..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                <span>Export CSV</span>
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={onAddExpense} className="text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>Add Expense</span>
              </Button>
            </div>
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/60">
            {/* Category Filter */}
            <div>
              <label htmlFor="filter-cat" className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                Category
              </label>
              <select
                id="filter-cat"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label htmlFor="filter-pm" className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                Payment Method
              </label>
              <select
                id="filter-pm"
                value={paymentMethodFilter}
                onChange={(e) => {
                  setPaymentMethodFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                <option value="ALL">All Payment Types</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="filter-status" className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                Obligation Status
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Date Range Preset */}
            <div>
              <label htmlFor="filter-date" className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                Period
              </label>
              <select
                id="filter-date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="CUSTOM">Custom Date Range</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {dateFilter === 'CUSTOM' && (
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 py-1 text-xs rounded border border-border bg-surface"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 py-1 text-xs rounded border border-border bg-surface"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Main Expenses Table */}
      <Card className="border-border/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle/70 border-b border-border/80 text-[11px] font-bold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="py-3 px-4">Voucher ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4">Expense Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Supplier / Payee</th>
                <th className="py-3 px-3 text-right">Amount (₹)</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Created By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-text-muted">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-text-muted opacity-50" />
                    <p className="font-semibold text-sm">No expense records match your filters</p>
                    <p className="text-xs mt-1">Try clearing search terms or resetting filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-surface-subtle/50 transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-text-primary whitespace-nowrap">
                      {e.id}
                    </td>
                    <td className="py-3 px-3 font-mono text-text-muted whitespace-nowrap">
                      {e.date}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-bold text-text-primary truncate">{e.name}</p>
                      {e.referenceNumber && (
                        <p className="font-mono text-[10px] text-text-muted truncate">
                          Ref: {e.referenceNumber}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-medium text-text-primary">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              categories.find((c) => c.id === e.categoryId)?.color || '#94A3B8',
                          }}
                        />
                        {e.categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-text-secondary whitespace-nowrap truncate max-w-[140px]">
                      {e.supplierName || 'General Payee'}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-right text-text-primary tabular-nums whitespace-nowrap">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="py-3 px-3 text-text-secondary whitespace-nowrap">
                      {e.paymentMethod}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                          e.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : e.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 line-through'
                        )}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-text-muted whitespace-nowrap truncate max-w-[120px]">
                      {e.createdBy}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onViewExpense(e)}
                          className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                          title="View Voucher"
                          aria-label={`View voucher ${e.id}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {e.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => onEditExpense(e)}
                            className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                            title="Edit Expense"
                            aria-label={`Edit ${e.id}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {e.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => onMarkPaid(e)}
                            className="p-1.5 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors font-bold text-[10px]"
                            title="Mark as Paid"
                            aria-label={`Mark ${e.id} paid`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {e.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => onCancelExpense(e)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                            title="Cancel Expense Voucher"
                            aria-label={`Cancel ${e.id}`}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredExpenses.length > pageSize && (
          <div className="p-3 border-t border-border/80 bg-surface flex items-center justify-between text-xs text-text-muted">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredExpenses.length)} of{' '}
              {filteredExpenses.length} entries
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="text-xs"
              >
                Previous
              </Button>
              <span className="px-2 font-bold text-text-primary font-mono">
                {currentPage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
