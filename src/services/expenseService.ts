import {
  Expense,
  ExpenseCategory,
  RecurringExpense,
  ExpenseStatus,
  ExpenseApprovalStatus,
  ExpensePaymentMethod,
  ExpenseFilter,
  ExpenseDashboardStats,
  ExpenseReceiptAttachment,
  RecurringFrequency,
} from '@/types'
import { firestoreService, SALORA_COLLECTIONS } from '@/services/firebase/firestoreService'
import { isFirebaseConfigured } from '@/lib/firebase'
import { auditLogService } from './auditLogService'
import { cashRegisterService } from './cashRegisterService'
import { billingService } from './billingService'

export const DEFAULT_SALON_CATEGORIES: ExpenseCategory[] = [
  {
    id: 'cat-rent',
    name: 'Rent',
    description: 'Salon premises lease, property rental & building maintenance',
    isDefault: true,
    color: '#8B5CF6',
    icon: 'Building',
    monthlyBudget: 0,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-electricity',
    name: 'Electricity',
    description: 'Commercial power utility bills, air conditioning & salon lighting',
    isDefault: true,
    color: '#F59E0B',
    icon: 'Zap',
    monthlyBudget: 0,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-internet',
    name: 'Internet',
    description: 'High-speed fiber broadband, customer Wi-Fi & communication',
    isDefault: true,
    color: '#3B82F6',
    icon: 'Wifi',
    monthlyBudget: 0,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-inventory',
    name: 'Inventory',
    description: 'Professional salon hair care, skin care, colors & retail supply purchases',
    isDefault: true,
    color: '#10B981',
    icon: 'Package',
    monthlyBudget: 0,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-marketing',
    name: 'Marketing',
    description: 'Local promotions, social media campaigns, print collateral & branding',
    isDefault: true,
    color: '#EC4899',
    icon: 'Megaphone',
    monthlyBudget: 0,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-maintenance',
    name: 'Maintenance',
    description: 'Equipment repair, deep salon sanitization, salon chair upholstery & plumbing',
    isDefault: true,
    color: '#6366F1',
    icon: 'Tool',
    monthlyBudget: 0,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-salary',
    name: 'Salary',
    description: 'Staff compensation, specialist monthly payouts and stipends',
    isDefault: true,
    color: '#14B8A6',
    icon: 'Users',
    monthlyBudget: 0,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-other',
    name: 'Other',
    description: 'Miscellaneous operating expenses and petty cash purchases',
    isDefault: true,
    color: '#64748B',
    icon: 'FileText',
    monthlyBudget: 0,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

// In-memory runtime cache synchronized with Cloud Firestore
let expensesCache: Expense[] = []
let categoriesCache: ExpenseCategory[] = [...DEFAULT_SALON_CATEGORIES]
let recurringCache: RecurringExpense[] = []
let isInitialized = false

// Helper to initialize data from Firestore
async function ensureFirestoreSync() {
  if (isInitialized || !isFirebaseConfigured) return
  try {
    const remote = await firestoreService.getAll<Expense>(SALORA_COLLECTIONS.EXPENSES)
    if (remote) {
      expensesCache = remote
    }
    isInitialized = true
  } catch (err) {
    console.warn('[expenseService] Could not pre-fetch expenses from Firestore:', err)
  }
}

export const expenseService = {
  // ==========================================
  // 1. EXPENSE CATEGORIES
  // ==========================================

  getCategories(): ExpenseCategory[] {
    return [...categoriesCache]
  },

  getCategoryById(id: string): ExpenseCategory | undefined {
    return categoriesCache.find((c) => c.id === id)
  },

  createCategory(categoryData: Omit<ExpenseCategory, 'id' | 'createdAt'>): ExpenseCategory {
    const newCategory: ExpenseCategory = {
      ...categoryData,
      id: `cat-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    categoriesCache = [...categoriesCache, newCategory]

    auditLogService.log({
      action: 'EXPENSE_CREATED',
      entityType: 'expense_category',
      entityId: newCategory.id,
      performedBy: 'Owner',
      userRole: 'owner',
      details: `Created new expense category "${newCategory.name}".`,
    })

    return newCategory
  },

  updateCategory(id: string, updates: Partial<ExpenseCategory>): ExpenseCategory {
    const idx = categoriesCache.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Category not found')

    const updatedCat = { ...categoriesCache[idx], ...updates }
    categoriesCache[idx] = updatedCat
    return updatedCat
  },

  deleteCategory(id: string): boolean {
    const target = categoriesCache.find((c) => c.id === id)
    if (!target) return false

    if (target.isDefault) {
      target.active = false
      return true
    }

    categoriesCache = categoriesCache.filter((c) => c.id !== id)
    return true
  },

  // ==========================================
  // 2. RECURRING EXPENSES
  // ==========================================

  getRecurringExpenses(): RecurringExpense[] {
    return [...recurringCache]
  },

  createRecurringExpense(data: Omit<RecurringExpense, 'id' | 'createdAt'>): RecurringExpense {
    const newRec: RecurringExpense = {
      ...data,
      id: `rec-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    recurringCache = [...recurringCache, newRec]

    auditLogService.log({
      action: 'EXPENSE_CREATED',
      entityType: 'recurring_expense',
      entityId: newRec.id,
      performedBy: 'Owner',
      userRole: 'owner',
      details: `Configured recurring expense "${newRec.expenseName}" (${newRec.frequency}, ₹${newRec.amount}).`,
      amount: newRec.amount,
    })

    return newRec
  },

  updateRecurringExpense(id: string, updates: Partial<RecurringExpense>): RecurringExpense {
    const idx = recurringCache.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Recurring expense not found')

    const updatedItem = { ...recurringCache[idx], ...updates }
    recurringCache[idx] = updatedItem
    return updatedItem
  },

  toggleRecurringExpense(id: string, active: boolean): RecurringExpense {
    return this.updateRecurringExpense(id, { active })
  },

  deleteRecurringExpense(id: string): boolean {
    recurringCache = recurringCache.filter((r) => r.id !== id)
    return true
  },

  checkAndGenerateDueRecurring(performedBy = 'System Automation'): Expense[] {
    const recurringList = this.getRecurringExpenses().filter((r) => r.active && r.autoGenerate)
    const today = new Date().toISOString().split('T')[0]
    const generatedExpenses: Expense[] = []

    recurringList.forEach((rec) => {
      if (rec.nextDueDate <= today) {
        const newExpense = this.createExpense(
          {
            name: rec.expenseName,
            categoryId: rec.categoryId,
            amount: rec.amount,
            date: today,
            paymentMethod: rec.paymentMethod,
            supplierId: rec.supplierId,
            supplierName: rec.supplierName,
            referenceNumber: rec.referenceNumber,
            description: `Auto-generated recurring expense (${rec.frequency}). ${rec.description || ''}`.trim(),
            status: 'PENDING',
            approvalStatus: 'APPROVED',
            isRecurring: true,
            recurringExpenseId: rec.id,
            recurringFrequency: rec.frequency,
            attachments: [],
          },
          { name: performedBy, role: 'owner' }
        )

        generatedExpenses.push(newExpense)

        const currentDueDate = new Date(rec.nextDueDate)
        if (rec.frequency === 'WEEKLY') {
          currentDueDate.setDate(currentDueDate.getDate() + 7)
        } else if (rec.frequency === 'MONTHLY') {
          currentDueDate.setMonth(currentDueDate.getMonth() + 1)
        } else if (rec.frequency === 'QUARTERLY') {
          currentDueDate.setMonth(currentDueDate.getMonth() + 3)
        } else if (rec.frequency === 'YEARLY') {
          currentDueDate.setFullYear(currentDueDate.getFullYear() + 1)
        }

        const nextDueStr = currentDueDate.toISOString().split('T')[0]
        this.updateRecurringExpense(rec.id, {
          lastGeneratedDate: today,
          nextDueDate: nextDueStr,
        })
      }
    })

    return generatedExpenses
  },

  // ==========================================
  // 3. EXPENSES CRUD & LIFECYCLE (FIRESTORE PERSISTED)
  // ==========================================

  async syncFromFirestore(): Promise<Expense[]> {
    if (!isFirebaseConfigured) return expensesCache
    try {
      const records = await firestoreService.getAll<Expense>(SALORA_COLLECTIONS.EXPENSES)
      expensesCache = records || []
      isInitialized = true
      return expensesCache
    } catch (err) {
      console.warn('[expenseService.syncFromFirestore] Error loading expenses:', err)
      return expensesCache
    }
  },

  getAllExpenses(_branchFilter?: string): Expense[] {
    ensureFirestoreSync()
    return [...expensesCache]
  },

  getExpenses(filter?: ExpenseFilter): Expense[] {
    let list = this.getAllExpenses()

    if (!filter) {
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    if (filter.search) {
      const q = filter.search.toLowerCase()
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.referenceNumber?.toLowerCase().includes(q) ||
          e.supplierName?.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q)
      )
    }

    if (filter.startDate) {
      list = list.filter((e) => e.date >= filter.startDate!)
    }

    if (filter.endDate) {
      list = list.filter((e) => e.date <= filter.endDate!)
    }

    if (filter.categoryId && filter.categoryId !== 'ALL') {
      list = list.filter((e) => e.categoryId === filter.categoryId)
    }

    if (filter.paymentMethod && filter.paymentMethod !== 'ALL') {
      list = list.filter((e) => e.paymentMethod === filter.paymentMethod)
    }

    if (filter.status && filter.status !== 'ALL') {
      list = list.filter((e) => e.status === filter.status)
    }

    if (filter.approvalStatus && filter.approvalStatus !== 'ALL') {
      list = list.filter((e) => e.approvalStatus === filter.approvalStatus)
    }

    if (filter.supplierId) {
      list = list.filter((e) => e.supplierId === filter.supplierId)
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },

  getExpenseById(id: string): Expense | undefined {
    return this.getAllExpenses().find((e) => e.id === id)
  },

  createExpense(
    data: {
      name: string
      categoryId: string
      amount: number
      date: string
      paymentMethod: ExpensePaymentMethod
      supplierId?: string
      supplierName?: string
      referenceNumber?: string
      description?: string
      isRecurring?: boolean
      recurringExpenseId?: string
      recurringFrequency?: RecurringFrequency
      attachments?: ExpenseReceiptAttachment[]
      status?: ExpenseStatus
      approvalStatus?: ExpenseApprovalStatus
    },
    user?: { name: string; role?: string; id?: string }
  ): Expense {
    const expenses = this.getAllExpenses()
    const categories = this.getCategories()
    const cat = categories.find((c) => c.id === data.categoryId)

    const nextNum = expenses.length + 1
    const expenseId = `EXP-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`
    const nowIso = new Date().toISOString()
    const performer = user?.name || 'Owner'

    const newExpense: Expense = {
      id: expenseId,
      name: data.name,
      categoryId: data.categoryId,
      categoryName: cat?.name || 'Other',
      amount: Number(data.amount) || 0,
      date: data.date,
      paymentMethod: data.paymentMethod,
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      referenceNumber: data.referenceNumber,
      description: data.description,
      status: data.status || 'PAID',
      approvalStatus: data.approvalStatus || (data.status === 'PAID' ? 'PAID' : 'APPROVED'),
      approvedBy: data.approvalStatus === 'PENDING_APPROVAL' ? undefined : performer,
      approvedAt: data.approvalStatus === 'PENDING_APPROVAL' ? undefined : nowIso,
      paidAt: data.status === 'PAID' ? nowIso : undefined,
      paidBy: data.status === 'PAID' ? performer : undefined,
      isRecurring: !!data.isRecurring,
      recurringExpenseId: data.recurringExpenseId,
      recurringFrequency: data.recurringFrequency,
      attachments: data.attachments || [],
      createdBy: performer,
      createdById: user?.id || 'owner-main',
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    if (newExpense.status === 'PAID' && newExpense.paymentMethod === 'Cash') {
      try {
        const session = cashRegisterService.getCurrentSession()
        if (session && session.status === 'OPEN') {
          cashRegisterService.addCashAdjustment(
            session.id,
            'CASH_OUT',
            newExpense.amount,
            `Expense: ${newExpense.name} (${newExpense.id})`,
            performer
          )
          newExpense.registerSessionId = session.id
        }
      } catch (err) {
        console.warn('Could not automatically link expense to cash register session:', err)
      }
    }

    expensesCache = [newExpense, ...expensesCache]

    // Async persist to Cloud Firestore
    if (isFirebaseConfigured) {
      firestoreService.set(SALORA_COLLECTIONS.EXPENSES, newExpense.id, newExpense).catch((err) => {
        console.error('[expenseService.createExpense] Firestore set error:', err)
      })
    }

    auditLogService.log({
      action: 'EXPENSE_CREATED',
      entityType: 'expense',
      entityId: newExpense.id,
      performedBy: performer,
      userRole: 'owner',
      details: `Created expense ${newExpense.id} ("${newExpense.name}", ₹${newExpense.amount}) via ${newExpense.paymentMethod}.`,
      amount: newExpense.amount,
      metadata: {
        category: newExpense.categoryName,
        paymentMethod: newExpense.paymentMethod,
        status: newExpense.status,
      },
    })

    return newExpense
  },

  updateExpense(
    id: string,
    updates: Partial<Expense>,
    user?: { name: string; role?: string; id?: string }
  ): Expense {
    const idx = expensesCache.findIndex((e) => e.id === id)
    if (idx === -1) throw new Error('Expense not found')

    const prev = expensesCache[idx]
    if (prev.status === 'CANCELLED') {
      throw new Error('Cancelled expenses cannot be edited.')
    }

    const performer = user?.name || 'Owner'
    const updatedExpense: Expense = {
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    expensesCache[idx] = updatedExpense

    if (isFirebaseConfigured) {
      firestoreService.update(SALORA_COLLECTIONS.EXPENSES, id, updates).catch((err) => {
        console.error('[expenseService.updateExpense] Firestore update error:', err)
      })
    }

    auditLogService.log({
      action: 'EXPENSE_EDITED',
      entityType: 'expense',
      entityId: updatedExpense.id,
      performedBy: performer,
      userRole: 'owner',
      details: `Updated details for expense ${updatedExpense.id} ("${updatedExpense.name}").`,
      amount: updatedExpense.amount,
    })

    return updatedExpense
  },

  approveExpense(id: string, user?: { name: string; role?: string; id?: string }): Expense {
    const idx = expensesCache.findIndex((e) => e.id === id)
    if (idx === -1) throw new Error('Expense not found')

    const performer = user?.name || 'Owner'
    const nowIso = new Date().toISOString()
    const expense: Expense = {
      ...expensesCache[idx],
      approvalStatus: 'APPROVED' as ExpenseApprovalStatus,
      approvedBy: performer,
      approvedAt: nowIso,
      updatedAt: nowIso,
    }

    expensesCache[idx] = expense

    if (isFirebaseConfigured) {
      firestoreService.update(SALORA_COLLECTIONS.EXPENSES, id, {
        approvalStatus: 'APPROVED',
        approvedBy: performer,
        approvedAt: nowIso,
      }).catch((err) => {
        console.error('[expenseService.approveExpense] Firestore error:', err)
      })
    }

    auditLogService.log({
      action: 'EXPENSE_APPROVED',
      entityType: 'expense',
      entityId: expense.id,
      performedBy: performer,
      userRole: 'owner',
      details: `Approved expense voucher ${expense.id} ("${expense.name}", ₹${expense.amount}).`,
      amount: expense.amount,
    })

    return expense
  },

  rejectExpense(
    id: string,
    reason: string,
    user?: { name: string; role?: string; id?: string }
  ): Expense {
    const idx = expensesCache.findIndex((e) => e.id === id)
    if (idx === -1) throw new Error('Expense not found')

    const performer = user?.name || 'Owner'
    const nowIso = new Date().toISOString()
    const expense: Expense = {
      ...expensesCache[idx],
      status: 'CANCELLED' as ExpenseStatus,
      approvalStatus: 'REJECTED' as ExpenseApprovalStatus,
      rejectionReason: reason,
      cancelReason: `Rejected approval: ${reason}`,
      cancelledAt: nowIso,
      cancelledBy: performer,
      updatedAt: nowIso,
    }

    expensesCache[idx] = expense

    if (isFirebaseConfigured) {
      firestoreService.update(SALORA_COLLECTIONS.EXPENSES, id, {
        status: 'CANCELLED',
        approvalStatus: 'REJECTED',
        rejectionReason: reason,
        cancelReason: `Rejected approval: ${reason}`,
        cancelledAt: nowIso,
        cancelledBy: performer,
      }).catch((err) => {
        console.error('[expenseService.rejectExpense] Firestore error:', err)
      })
    }

    auditLogService.log({
      action: 'EXPENSE_REJECTED',
      entityType: 'expense',
      entityId: expense.id,
      performedBy: performer,
      userRole: 'owner',
      details: `Rejected expense voucher ${expense.id}. Reason: "${reason}".`,
      amount: expense.amount,
    })

    return expense
  },

  markAsPaid(
    id: string,
    paymentMethod: ExpensePaymentMethod,
    user?: { name: string; role?: string; id?: string },
    referenceNumber?: string
  ): Expense {
    const idx = expensesCache.findIndex((e) => e.id === id)
    if (idx === -1) throw new Error('Expense not found')

    const performer = user?.name || 'Owner'
    const nowIso = new Date().toISOString()
    const expense: Expense = {
      ...expensesCache[idx],
      status: 'PAID' as ExpenseStatus,
      approvalStatus: 'PAID' as ExpenseApprovalStatus,
      paymentMethod,
      referenceNumber: referenceNumber || expensesCache[idx].referenceNumber,
      paidAt: nowIso,
      paidBy: performer,
      updatedAt: nowIso,
    }

    if (expense.paymentMethod === 'Cash') {
      try {
        const session = cashRegisterService.getCurrentSession()
        if (session && session.status === 'OPEN') {
          cashRegisterService.addCashAdjustment(
            session.id,
            'CASH_OUT',
            expense.amount,
            `Expense Paid: ${expense.name} (${expense.id})`,
            performer
          )
          expense.registerSessionId = session.id
        }
      } catch (err) {
        console.warn('Could not link cash payout to register session:', err)
      }
    }

    expensesCache[idx] = expense

    if (isFirebaseConfigured) {
      firestoreService.update(SALORA_COLLECTIONS.EXPENSES, id, {
        status: 'PAID',
        approvalStatus: 'PAID',
        paymentMethod,
        referenceNumber: expense.referenceNumber,
        paidAt: nowIso,
        paidBy: performer,
      }).catch((err) => {
        console.error('[expenseService.markAsPaid] Firestore error:', err)
      })
    }

    auditLogService.log({
      action: 'EXPENSE_PAID',
      entityType: 'expense',
      entityId: expense.id,
      performedBy: performer,
      userRole: 'owner',
      details: `Marked expense ${expense.id} as PAID (₹${expense.amount} via ${paymentMethod}).`,
      amount: expense.amount,
      metadata: { paymentMethod, referenceNumber },
    })

    return expense
  },

  cancelExpense(
    id: string,
    reason: string,
    user?: { name: string; role?: string; id?: string }
  ): Expense {
    if (!reason || !reason.trim()) {
      throw new Error('A cancellation reason is required for financial compliance.')
    }

    const idx = expensesCache.findIndex((e) => e.id === id)
    if (idx === -1) throw new Error('Expense not found')

    const prev = expensesCache[idx]
    if (prev.status === 'CANCELLED') {
      throw new Error('This expense is already cancelled.')
    }

    const performer = user?.name || 'Owner'
    const nowIso = new Date().toISOString()

    if (prev.status === 'PAID' && prev.paymentMethod === 'Cash' && prev.registerSessionId) {
      try {
        const currentSession = cashRegisterService.getCurrentSession()
        if (currentSession && currentSession.status === 'OPEN') {
          cashRegisterService.addCashAdjustment(
            currentSession.id,
            'CASH_IN',
            prev.amount,
            `Expense Reversal: ${prev.id} ("${reason}")`,
            performer
          )
        }
      } catch (err) {
        console.warn('Could not record reversal cash adjustment:', err)
      }
    }

    const cancelledExpense: Expense = {
      ...prev,
      status: 'CANCELLED',
      approvalStatus: prev.approvalStatus === 'PENDING_APPROVAL' ? 'REJECTED' : prev.approvalStatus,
      cancelReason: reason,
      cancelledAt: nowIso,
      cancelledBy: performer,
      updatedAt: nowIso,
    }

    expensesCache[idx] = cancelledExpense

    if (isFirebaseConfigured) {
      firestoreService.update(SALORA_COLLECTIONS.EXPENSES, id, {
        status: 'CANCELLED',
        cancelReason: reason,
        cancelledAt: nowIso,
        cancelledBy: performer,
      }).catch((err) => {
        console.error('[expenseService.cancelExpense] Firestore error:', err)
      })
    }

    auditLogService.log({
      action: 'EXPENSE_CANCELLED',
      entityType: 'expense',
      entityId: cancelledExpense.id,
      performedBy: performer,
      userRole: 'owner',
      details: `Cancelled expense ${cancelledExpense.id} (₹${cancelledExpense.amount}). Reason: "${reason}".`,
      amount: cancelledExpense.amount,
      metadata: { reason },
    })

    return cancelledExpense
  },

  // ==========================================
  // 4. FINANCIAL INTEGRATION & ANALYTICS
  // ==========================================

  getDashboardStats(): ExpenseDashboardStats {
    const expenses = this.getAllExpenses()
    const activeExpenses = expenses.filter((e) => e.status !== 'CANCELLED')

    const todayStr = new Date().toISOString().split('T')[0]
    const currentMonthPrefix = todayStr.substring(0, 7) // YYYY-MM

    // Today
    const todayList = activeExpenses.filter((e) => e.date === todayStr && e.status === 'PAID')
    const todayExpenses = todayList.reduce((acc, curr) => acc + curr.amount, 0)

    // This Month
    const thisMonthList = activeExpenses.filter(
      (e) => e.date.startsWith(currentMonthPrefix) && e.status === 'PAID'
    )
    const thisMonthExpenses = thisMonthList.reduce((acc, curr) => acc + curr.amount, 0)

    // Pending Obligations
    const pendingList = activeExpenses.filter((e) => e.status === 'PENDING')
    const pendingExpensesAmount = pendingList.reduce((acc, curr) => acc + curr.amount, 0)

    // Largest Category This Month
    const catMap: Record<string, number> = {}
    thisMonthList.forEach((e) => {
      catMap[e.categoryName] = (catMap[e.categoryName] || 0) + e.amount
    })

    let largestCategoryName = 'None'
    let largestCategoryAmount = 0
    Object.entries(catMap).forEach(([catName, amount]) => {
      if (amount > largestCategoryAmount) {
        largestCategoryName = catName
        largestCategoryAmount = amount
      }
    })

    // Cash vs Non-Cash This Month
    let cashExpensesThisMonth = 0
    let nonCashExpensesThisMonth = 0
    thisMonthList.forEach((e) => {
      if (e.paymentMethod === 'Cash') {
        cashExpensesThisMonth += e.amount
      } else {
        nonCashExpensesThisMonth += e.amount
      }
    })

    // Calculate actual previous month's expenses
    const now = new Date()
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthPrefix = prevMonthDate.toISOString().substring(0, 7)
    const prevMonthList = activeExpenses.filter(
      (e) => e.date.startsWith(prevMonthPrefix) && e.status === 'PAID'
    )
    const previousPeriodExpenses = prevMonthList.reduce((acc, curr) => acc + curr.amount, 0)

    const monthOverMonthChange =
      previousPeriodExpenses > 0
        ? Number(
            (((thisMonthExpenses - previousPeriodExpenses) / previousPeriodExpenses) * 100).toFixed(
              1
            )
          )
        : 0

    return {
      todayExpenses,
      todayCount: todayList.length,
      thisMonthExpenses,
      thisMonthCount: thisMonthList.length,
      pendingExpensesAmount,
      pendingCount: pendingList.length,
      largestCategoryName,
      largestCategoryAmount,
      previousPeriodExpenses,
      monthOverMonthChange,
      cashExpensesThisMonth,
      nonCashExpensesThisMonth,
      totalExpenses: activeExpenses.reduce((acc, curr) => acc + curr.amount, 0),
    }
  },

  getCategoryBreakdown(): { name: string; amount: number; percentage: number; color: string }[] {
    const expenses = this.getAllExpenses().filter((e) => e.status === 'PAID')
    const categories = this.getCategories()
    const total = expenses.reduce((acc, curr) => acc + curr.amount, 0)

    if (total === 0) return []

    const categoryTotals: Record<string, number> = {}
    expenses.forEach((e) => {
      categoryTotals[e.categoryId] = (categoryTotals[e.categoryId] || 0) + e.amount
    })

    return Object.entries(categoryTotals)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId)
        return {
          name: cat?.name || 'Other',
          amount,
          percentage: Number(((amount / total) * 100).toFixed(1)),
          color: cat?.color || '#94A3B8',
        }
      })
      .sort((a, b) => b.amount - a.amount)
  },

  /**
   * Real dynamic monthly trend from verified bills and real expenses
   */
  getMonthlyTrend(months = 6): {
    month: string
    revenue: number
    expenses: number
    netOperatingResult: number
  }[] {
    const allExpenses = this.getAllExpenses().filter((e) => e.status === 'PAID')
    const allBills = billingService.getAllBills().filter((b) => b.paymentStatus !== 'REFUNDED')

    const result = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = d.toLocaleString('en-US', { month: 'short' })

      const monthRevenue = allBills
        .filter((b) => b.createdAt.startsWith(monthPrefix))
        .reduce((sum, b) => sum + (b.paidAmount || 0), 0)

      const monthExpenses = allExpenses
        .filter((e) => e.date.startsWith(monthPrefix))
        .reduce((sum, e) => sum + e.amount, 0)

      result.push({
        month: monthLabel,
        revenue: monthRevenue,
        expenses: monthExpenses,
        netOperatingResult: monthRevenue - monthExpenses,
      })
    }

    return result
  },

  getCashVsNonCash(): { name: string; value: number; color: string }[] {
    const stats = this.getDashboardStats()
    return [
      { name: 'Cash Outflow', value: stats.cashExpensesThisMonth, color: '#F59E0B' },
      { name: 'Digital & Bank Transfers', value: stats.nonCashExpensesThisMonth, color: '#8B5CF6' },
    ]
  },

  // ==========================================
  // 5. DAILY CLOSING & BILLING HOOKS
  // ==========================================

  getTodayExpenses(): Expense[] {
    const todayStr = new Date().toISOString().split('T')[0]
    return this.getAllExpenses().filter((e) => e.date === todayStr && e.status === 'PAID')
  },

  getTodayExpensesTotal(): number {
    return this.getTodayExpenses().reduce((sum, e) => sum + e.amount, 0)
  },

  getTodayCashExpensesTotal(): number {
    return this.getTodayExpenses()
      .filter((e) => e.paymentMethod === 'Cash')
      .reduce((sum, e) => sum + e.amount, 0)
  },

  getNetOperatingResult(revenue: number, expenses: number): number {
    return (Number(revenue) || 0) - (Number(expenses) || 0)
  },
}
