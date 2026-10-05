import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  History,
  Tag,
  Repeat,
  Plus,
  IndianRupee,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  ExpenseDashboardView,
  ExpenseHistoryView,
  ExpenseCategoriesView,
  RecurringExpensesView,
  AddEditExpenseModal,
  ExpenseDetailModal,
  CancelExpenseModal,
  AddCategoryModal,
  AddRecurringExpenseModal,
} from '@/features/expenses'
import { expenseService } from '@/services/expenseService'
import { inventoryService } from '@/services/inventoryService'
import {
  Expense,
  ExpenseCategory,
  RecurringExpense,
  ExpenseDashboardStats,
  Supplier,
  ExpensePaymentMethod,
} from '@/types'
import { useToastStore } from '@/store/useToastStore'
import { useAuthStore } from '@/store/useAuthStore'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/cn'

type ExpenseTab = 'dashboard' | 'history' | 'categories' | 'recurring'

export const ExpensesPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { addToast } = useToastStore()

  // Determine active tab from URL path
  const getTabFromPath = (): ExpenseTab => {
    const path = location.pathname.toLowerCase()
    if (path.includes('/expenses/categories')) return 'categories'
    if (path.includes('/expenses/history')) return 'history'
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('tab') === 'recurring') return 'recurring'
    return 'dashboard'
  }

  const [activeTab, setActiveTab] = useState<ExpenseTab>(getTabFromPath())

  // Data State
  const [stats, setStats] = useState<ExpenseDashboardStats>(expenseService.getDashboardStats())
  const [expenses, setExpenses] = useState<Expense[]>(expenseService.getAllExpenses())
  const [categories, setCategories] = useState<ExpenseCategory[]>(expenseService.getCategories())
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(
    expenseService.getRecurringExpenses()
  )
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  // Modal states
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [cancellingExpense, setCancellingExpense] = useState<Expense | null>(null)
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [isAddRecurringOpen, setIsAddRecurringOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null)

  // Quick Mark Paid Modal State
  const [markingPaidExpense, setMarkingPaidExpense] = useState<Expense | null>(null)
  const [quickPaymentMethod, setQuickPaymentMethod] = useState<ExpensePaymentMethod>('Cash')
  const [quickRefNumber, setQuickRefNumber] = useState('')

  // Sync state on URL change
  useEffect(() => {
    setActiveTab(getTabFromPath())
  }, [location.pathname, location.search])

  const refreshData = () => {
    setStats(expenseService.getDashboardStats())
    setExpenses(expenseService.getAllExpenses())
    setCategories(expenseService.getCategories())
    setRecurringExpenses(expenseService.getRecurringExpenses())
    try {
      setSuppliers(inventoryService.getSuppliers().filter((s) => s.active))
    } catch (e) {
      setSuppliers([])
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  const handleTabChange = (tab: ExpenseTab) => {
    setActiveTab(tab)
    if (tab === 'dashboard') navigate('/expenses')
    else if (tab === 'history') navigate('/expenses/history')
    else if (tab === 'categories') navigate('/expenses/categories')
    else if (tab === 'recurring') navigate('/expenses?tab=recurring')
  }

  // Action handlers
  const handleMarkPaidConfirm = () => {
    if (!markingPaidExpense) return
    try {
      const updated = expenseService.markAsPaid(
        markingPaidExpense.id,
        quickPaymentMethod,
        { name: user?.name || 'Ayaan (Owner)', role: user?.role, id: user?.id },
        quickRefNumber.trim() || undefined
      )
      addToast({
        title: 'Expense Paid',
        message: `Voucher ${updated.id} settled via ${quickPaymentMethod}.`,
        type: 'success',
      })
      setMarkingPaidExpense(null)
      setQuickRefNumber('')
      refreshData()
    } catch (err: any) {
      addToast({
        title: 'Payment Error',
        message: err.message || 'Could not mark expense as paid.',
        type: 'danger',
      })
    }
  }

  const handleApproveExpense = (exp: Expense) => {
    try {
      expenseService.approveExpense(exp.id, {
        name: user?.name || 'Ayaan (Owner)',
        role: user?.role,
        id: user?.id,
      })
      addToast({
        title: 'Voucher Approved',
        message: `Expense ${exp.id} approved for disbursement.`,
        type: 'success',
      })
      setSelectedExpense(null)
      refreshData()
    } catch (err: any) {
      addToast({ title: 'Approval Failed', message: err.message, type: 'danger' })
    }
  }

  const handleRejectExpense = (exp: Expense) => {
    const reason = prompt(`Reason for rejecting expense ${exp.id}:`)
    if (!reason || !reason.trim()) return
    try {
      expenseService.rejectExpense(exp.id, reason.trim(), {
        name: user?.name || 'Ayaan (Owner)',
        role: user?.role,
        id: user?.id,
      })
      addToast({
        title: 'Voucher Rejected',
        message: `Expense ${exp.id} rejected and cancelled.`,
        type: 'info',
      })
      setSelectedExpense(null)
      refreshData()
    } catch (err: any) {
      addToast({ title: 'Rejection Error', message: err.message, type: 'danger' })
    }
  }

  const handleConfirmCancel = (expenseId: string, reason: string) => {
    try {
      expenseService.cancelExpense(expenseId, reason, {
        name: user?.name || 'Ayaan (Owner)',
        role: user?.role,
        id: user?.id,
      })
      addToast({
        title: 'Expense Cancelled',
        message: `Voucher ${expenseId} cancelled. Financial records preserved in audit logs.`,
        type: 'info',
      })
      setSelectedExpense(null)
      refreshData()
    } catch (err: any) {
      addToast({ title: 'Cancellation Error', message: err.message, type: 'danger' })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
              Expense Management & Financial Controls
            </h1>
            {stats.pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <Clock className="h-3 w-3" />
                <span>{stats.pendingCount} Pending Obligations</span>
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Track salon operating expenditures, till cash outflows, vendor disbursements, recurring leases, and audit receipts.
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setEditingExpense(null)
              setIsAddExpenseOpen(true)
            }}
            className="shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>+ Add Expense</span>
          </Button>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex border-b border-border overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => handleTabChange('dashboard')}
          className={cn(
            'flex items-center gap-2 py-2.5 px-4 border-b-2 text-xs font-bold transition-all whitespace-nowrap',
            activeTab === 'dashboard'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Expense Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={cn(
            'flex items-center gap-2 py-2.5 px-4 border-b-2 text-xs font-bold transition-all whitespace-nowrap',
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <History className="h-4 w-4" />
          <span>Expense History</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-subtle border border-border">
            {expenses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('categories')}
          className={cn(
            'flex items-center gap-2 py-2.5 px-4 border-b-2 text-xs font-bold transition-all whitespace-nowrap',
            activeTab === 'categories'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <Tag className="h-4 w-4" />
          <span>Expense Categories</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-subtle border border-border">
            {categories.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('recurring')}
          className={cn(
            'flex items-center gap-2 py-2.5 px-4 border-b-2 text-xs font-bold transition-all whitespace-nowrap',
            activeTab === 'recurring'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <Repeat className="h-4 w-4" />
          <span>Recurring Overhead</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-subtle border border-border">
            {recurringExpenses.filter((r) => r.active).length}
          </span>
        </button>
      </div>

      {/* 3. Main Views */}
      {activeTab === 'dashboard' && (
        <ExpenseDashboardView
          stats={stats}
          recentExpenses={expenses}
          onAddExpense={() => {
            setEditingExpense(null)
            setIsAddExpenseOpen(true)
          }}
          onViewExpense={(e) => setSelectedExpense(e)}
          onMarkPaid={(e) => setMarkingPaidExpense(e)}
          onNavigateToHistory={() => handleTabChange('history')}
          onNavigateToCategories={() => handleTabChange('categories')}
        />
      )}

      {activeTab === 'history' && (
        <ExpenseHistoryView
          expenses={expenses}
          categories={categories}
          suppliers={suppliers}
          onAddExpense={() => {
            setEditingExpense(null)
            setIsAddExpenseOpen(true)
          }}
          onViewExpense={(e) => setSelectedExpense(e)}
          onEditExpense={(e) => {
            setEditingExpense(e)
            setIsAddExpenseOpen(true)
          }}
          onMarkPaid={(e) => setMarkingPaidExpense(e)}
          onCancelExpense={(e) => setCancellingExpense(e)}
        />
      )}

      {activeTab === 'categories' && (
        <ExpenseCategoriesView
          categories={categories}
          expenses={expenses}
          onAddCategory={() => {
            setEditingCategory(null)
            setIsAddCategoryOpen(true)
          }}
          onEditCategory={(c) => {
            setEditingCategory(c)
            setIsAddCategoryOpen(true)
          }}
          onToggleCategory={(c) => {
            expenseService.updateCategory(c.id, { active: !c.active })
            refreshData()
          }}
        />
      )}

      {activeTab === 'recurring' && (
        <RecurringExpensesView
          recurringExpenses={recurringExpenses}
          categories={categories}
          onAddRecurring={() => {
            setEditingRecurring(null)
            setIsAddRecurringOpen(true)
          }}
          onEditRecurring={(r) => {
            setEditingRecurring(r)
            setIsAddRecurringOpen(true)
          }}
          onRefresh={refreshData}
        />
      )}

      {/* 4. Modals */}
      {/* Add / Edit Expense Modal */}
      <AddEditExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false)
          setEditingExpense(null)
        }}
        onSuccess={() => refreshData()}
        initialExpense={editingExpense}
      />

      {/* Expense Detail Modal */}
      <ExpenseDetailModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        onEdit={(e) => {
          setSelectedExpense(null)
          setEditingExpense(e)
          setIsAddExpenseOpen(true)
        }}
        onMarkPaid={(e) => {
          setSelectedExpense(null)
          setMarkingPaidExpense(e)
        }}
        onApprove={handleApproveExpense}
        onReject={handleRejectExpense}
        onCancel={(e) => {
          setSelectedExpense(null)
          setCancellingExpense(e)
        }}
      />

      {/* Cancel Expense Modal (Audit requirement: never delete silently) */}
      <CancelExpenseModal
        isOpen={!!cancellingExpense}
        onClose={() => setCancellingExpense(null)}
        expense={cancellingExpense}
        onConfirm={handleConfirmCancel}
      />

      {/* Add / Edit Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => {
          setIsAddCategoryOpen(false)
          setEditingCategory(null)
        }}
        onSuccess={() => refreshData()}
        initialCategory={editingCategory}
      />

      {/* Add / Edit Recurring Expense Modal */}
      <AddRecurringExpenseModal
        isOpen={isAddRecurringOpen}
        onClose={() => {
          setIsAddRecurringOpen(false)
          setEditingRecurring(null)
        }}
        onSuccess={() => refreshData()}
        initialRecurring={editingRecurring}
      />

      {/* Quick Mark as Paid Modal */}
      {markingPaidExpense && (
        <Modal
          isOpen={true}
          onClose={() => setMarkingPaidExpense(null)}
          title={`Settle Pending Liability: ${markingPaidExpense.id}`}
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-surface-subtle text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-text-muted">Expense:</span>
                <span className="font-bold text-text-primary">{markingPaidExpense.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Payee:</span>
                <span className="font-bold text-text-primary">
                  {markingPaidExpense.supplierName || 'General Payee'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Amount Due:</span>
                <span className="font-bold text-emerald-600 text-sm">
                  {formatCurrency(markingPaidExpense.amount)}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="quick-pm" className="block text-xs font-bold text-text-primary mb-1">
                Disbursement Payment Method
              </label>
              <select
                id="quick-pm"
                value={quickPaymentMethod}
                onChange={(e) => setQuickPaymentMethod(e.target.value as ExpensePaymentMethod)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="Cash">Cash (Deduct from Register Till)</option>
                <option value="UPI">UPI Digital Payment</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Bank Transfer">Bank Wire / NEFT</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="quick-ref" className="block text-xs font-bold text-text-primary mb-1">
                Payment Ref / UTR / Cheque #
              </label>
              <input
                id="quick-ref"
                type="text"
                value={quickRefNumber}
                onChange={(e) => setQuickRefNumber(e.target.value)}
                placeholder="e.g. UTR-09281902"
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMarkingPaidExpense(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleMarkPaidConfirm}
              >
                Confirm Payment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
