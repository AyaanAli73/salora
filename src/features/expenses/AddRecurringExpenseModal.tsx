import React, { useState, useEffect } from 'react'
import { Repeat, Calendar, IndianRupee, Tag, CreditCard, Building2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { RecurringExpense, ExpenseCategory, ExpensePaymentMethod, RecurringFrequency, Supplier } from '@/types'
import { expenseService } from '@/services/expenseService'
import { inventoryService } from '@/services/inventoryService'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

interface AddRecurringExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (recurring: RecurringExpense) => void
  initialRecurring?: RecurringExpense | null
}

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
]

const PAYMENT_METHODS: ExpensePaymentMethod[] = [
  'Bank Transfer',
  'UPI',
  'Card',
  'Cash',
  'Other',
]

export const AddRecurringExpenseModal: React.FC<AddRecurringExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRecurring,
}) => {
  const { addToast } = useToastStore()
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  const [expenseName, setExpenseName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('Bank Transfer')
  const [supplierName, setSupplierName] = useState('')
  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0])
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [referenceNumber, setReferenceNumber] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const cats = expenseService.getCategories().filter((c) => c.active)
      setCategories(cats)
      try {
        setSuppliers(inventoryService.getSuppliers().filter((s) => s.active))
      } catch (e) {
        setSuppliers([])
      }

      if (initialRecurring) {
        setExpenseName(initialRecurring.expenseName)
        setCategoryId(initialRecurring.categoryId)
        setAmount(initialRecurring.amount.toString())
        setPaymentMethod(initialRecurring.paymentMethod)
        setSupplierName(initialRecurring.supplierName || '')
        setFrequency(initialRecurring.frequency)
        setStartDate(initialRecurring.startDate)
        setNextDueDate(initialRecurring.nextDueDate)
        setAutoGenerate(initialRecurring.autoGenerate)
        setReferenceNumber(initialRecurring.referenceNumber || '')
        setDescription(initialRecurring.description || '')
      } else {
        setExpenseName('')
        setCategoryId(cats[0]?.id || '')
        setAmount('')
        setPaymentMethod('Bank Transfer')
        setSupplierName('')
        setFrequency('MONTHLY')
        const today = new Date().toISOString().split('T')[0]
        setStartDate(today)
        setNextDueDate(today)
        setAutoGenerate(true)
        setReferenceNumber('')
        setDescription('')
      }
      setErrors({})
    }
  }, [isOpen, initialRecurring])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!expenseName.trim()) errs.expenseName = 'Name is required'
    if (!categoryId) errs.categoryId = 'Category is required'
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) errs.amount = 'Valid positive amount required'
    if (!nextDueDate) errs.nextDueDate = 'Next due date required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const cat = categories.find((c) => c.id === categoryId)
      let saved: RecurringExpense
      if (initialRecurring) {
        saved = expenseService.updateRecurringExpense(initialRecurring.id, {
          expenseName: expenseName.trim(),
          categoryId,
          categoryName: cat?.name || 'Miscellaneous',
          amount: parseFloat(amount),
          paymentMethod,
          supplierName: supplierName.trim() || undefined,
          frequency,
          startDate,
          nextDueDate,
          autoGenerate,
          referenceNumber: referenceNumber.trim() || undefined,
          description: description.trim() || undefined,
        })
        addToast({
          title: 'Recurring Schedule Updated',
          message: `Saved changes to "${saved.expenseName}".`,
          type: 'success',
        })
      } else {
        saved = expenseService.createRecurringExpense({
          expenseName: expenseName.trim(),
          categoryId,
          categoryName: cat?.name || 'Miscellaneous',
          amount: parseFloat(amount),
          paymentMethod,
          supplierName: supplierName.trim() || undefined,
          frequency,
          startDate,
          nextDueDate,
          autoGenerate,
          active: true,
          referenceNumber: referenceNumber.trim() || undefined,
          description: description.trim() || undefined,
        })
        addToast({
          title: 'Recurring Plan Scheduled',
          message: `Scheduled ${frequency.toLowerCase()} expense "${saved.expenseName}".`,
          type: 'success',
        })
      }

      onSuccess(saved)
      onClose()
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save recurring plan' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialRecurring ? 'Edit Recurring Schedule' : 'Schedule Recurring Expense'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {errors.form}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8">
            <label htmlFor="rec-name" className="block text-xs font-bold text-text-primary mb-1">
              Recurring Expense Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="rec-name"
              type="text"
              value={expenseName}
              onChange={(e) => setExpenseName(e.target.value)}
              placeholder="e.g., Salon Premises Monthly Lease Rent"
              className={cn(
                'w-full px-3 py-2 text-sm rounded-xl border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                errors.expenseName ? 'border-rose-500' : 'border-border'
              )}
            />
            {errors.expenseName && <p className="text-[11px] text-rose-500 mt-1">{errors.expenseName}</p>}
          </div>

          <div className="md:col-span-4">
            <label htmlFor="rec-amount" className="block text-xs font-bold text-text-primary mb-1">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-text-muted text-xs font-bold">₹</span>
              <input
                id="rec-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold rounded-xl border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary tabular-nums"
              />
            </div>
            {errors.amount && <p className="text-[11px] text-rose-500 mt-1">{errors.amount}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label htmlFor="rec-category" className="block text-xs font-bold text-text-primary mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="rec-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rec-freq" className="block text-xs font-bold text-text-primary mb-1">
              Recurrence Cadence <span className="text-rose-500">*</span>
            </label>
            <select
              id="rec-freq"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rec-paymethod" className="block text-xs font-bold text-text-primary mb-1">
              Default Payment Method
            </label>
            <select
              id="rec-paymethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as ExpensePaymentMethod)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="rec-supplier" className="block text-xs font-bold text-text-primary mb-1">
              Payee / Vendor Name
            </label>
            <input
              id="rec-supplier"
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. Prestige Commercial Realty / Airtel Commercial"
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="rec-ref" className="block text-xs font-bold text-text-primary mb-1">
              Contract / Account Reference
            </label>
            <input
              id="rec-ref"
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., LEASE-AGR-401 / CIR-90192"
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="rec-start" className="block text-xs font-bold text-text-primary mb-1">
              Start Date
            </label>
            <input
              id="rec-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="rec-due" className="block text-xs font-bold text-text-primary mb-1">
              Next Due Date <span className="text-rose-500">*</span>
            </label>
            <input
              id="rec-due"
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-surface-subtle/50 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-text-primary">Automated Generation</span>
            <p className="text-[10px] text-text-muted">
              Auto-generate pending expense obligations when the due date arrives
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoGenerate}
              onChange={(e) => setAutoGenerate(e.target.checked)}
              className="sr-only peer"
              aria-label="Toggle auto generation"
            />
            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {initialRecurring ? 'Save Schedule' : 'Schedule Recurring Plan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
