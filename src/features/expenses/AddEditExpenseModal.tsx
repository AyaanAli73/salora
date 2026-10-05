import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Upload,
  FileText,
  Trash2,
  Calendar,
  IndianRupee,
  Building2,
  Tag,
  CreditCard,
  FileCheck,
  Repeat,
  AlertCircle,
  Eye,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import {
  Expense,
  ExpenseCategory,
  ExpensePaymentMethod,
  ExpenseStatus,
  ExpenseApprovalStatus,
  RecurringFrequency,
  ExpenseReceiptAttachment,
  Supplier,
} from '@/types'
import { expenseService } from '@/services/expenseService'
import { inventoryService } from '@/services/inventoryService'
import { receiptStorage } from '@/services/storage/receiptStorage'
import { useAuthStore } from '@/store/useAuthStore'
import { useToastStore } from '@/store/useToastStore'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface AddEditExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (expense: Expense) => void
  initialExpense?: Expense | null
}

const PAYMENT_METHODS: ExpensePaymentMethod[] = [
  'Cash',
  'UPI',
  'Card',
  'Bank Transfer',
  'Other',
]

const RECURRING_FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
]

export const AddEditExpenseModal: React.FC<AddEditExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialExpense,
}) => {
  const { user } = useAuthStore()
  const { addToast } = useToastStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  // Form Fields
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('Cash')
  const [supplierMode, setSupplierMode] = useState<'SELECT' | 'CUSTOM'>('SELECT')
  const [supplierId, setSupplierId] = useState('')
  const [customSupplierName, setCustomSupplierName] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [description, setDescription] = useState('')

  // Status & Approval
  const [status, setStatus] = useState<ExpenseStatus>('PAID')
  const [requireApproval, setRequireApproval] = useState(false)

  // Recurring options
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('MONTHLY')

  // Attachments
  const [attachments, setAttachments] = useState<ExpenseReceiptAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState<ExpenseReceiptAttachment | null>(null)

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const cats = expenseService.getCategories().filter((c) => c.active)
      setCategories(cats)
      try {
        const sups = inventoryService.getSuppliers().filter((s) => s.active)
        setSuppliers(sups)
      } catch (err) {
        setSuppliers([])
      }

      if (initialExpense) {
        setName(initialExpense.name)
        setCategoryId(initialExpense.categoryId)
        setAmount(initialExpense.amount.toString())
        setDate(initialExpense.date)
        setPaymentMethod(initialExpense.paymentMethod)
        if (initialExpense.supplierId) {
          setSupplierMode('SELECT')
          setSupplierId(initialExpense.supplierId)
          setCustomSupplierName('')
        } else if (initialExpense.supplierName) {
          setSupplierMode('CUSTOM')
          setCustomSupplierName(initialExpense.supplierName)
          setSupplierId('')
        } else {
          setSupplierMode('SELECT')
          setSupplierId('')
          setCustomSupplierName('')
        }
        setReferenceNumber(initialExpense.referenceNumber || '')
        setDescription(initialExpense.description || '')
        setStatus(initialExpense.status)
        setRequireApproval(initialExpense.approvalStatus === 'PENDING_APPROVAL')
        setIsRecurring(initialExpense.isRecurring)
        setRecurringFrequency(initialExpense.recurringFrequency || 'MONTHLY')
        setAttachments(initialExpense.attachments || [])
      } else {
        // Reset defaults
        setName('')
        setCategoryId(cats[0]?.id || '')
        setAmount('')
        setDate(new Date().toISOString().split('T')[0])
        setPaymentMethod('Cash')
        setSupplierMode('SELECT')
        setSupplierId('')
        setCustomSupplierName('')
        setReferenceNumber('')
        setDescription('')
        setStatus('PAID')
        setRequireApproval(false)
        setIsRecurring(false)
        setRecurringFrequency('MONTHLY')
        setAttachments([])
      }
      setErrors({})
    }
  }, [isOpen, initialExpense])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const newAttachments: ExpenseReceiptAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const uploaded = await receiptStorage.uploadReceipt(file)
        newAttachments.push(uploaded)
      }
      setAttachments((prev) => [...prev, ...newAttachments])
      addToast({
        title: 'Receipt Attached',
        message: `Successfully attached ${files.length} document${files.length > 1 ? 's' : ''}.`,
        type: 'success',
      })
    } catch (err: any) {
      addToast({
        title: 'Attachment Failed',
        message: err.message || 'Could not process receipt file.',
        type: 'danger',
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Expense name is required'
    if (!categoryId) errs.categoryId = 'Category selection is required'
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Please enter a valid positive amount'
    }
    if (!date) errs.date = 'Expense date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const selectedSupplier =
        supplierMode === 'SELECT'
          ? suppliers.find((s) => s.id === supplierId)
          : null
      const supplierName =
        supplierMode === 'SELECT'
          ? selectedSupplier?.name
          : customSupplierName.trim() || undefined

      const effectiveApproval: ExpenseApprovalStatus = requireApproval
        ? 'PENDING_APPROVAL'
        : status === 'PAID'
        ? 'PAID'
        : 'APPROVED'

      let savedExpense: Expense
      if (initialExpense) {
        savedExpense = expenseService.updateExpense(
          initialExpense.id,
          {
            name: name.trim(),
            categoryId,
            categoryName: categories.find((c) => c.id === categoryId)?.name || 'Miscellaneous',
            amount: parseFloat(amount),
            date,
            paymentMethod,
            supplierId: supplierMode === 'SELECT' ? supplierId || undefined : undefined,
            supplierName,
            referenceNumber: referenceNumber.trim() || undefined,
            description: description.trim() || undefined,
            status,
            approvalStatus: effectiveApproval,
            isRecurring,
            recurringFrequency: isRecurring ? recurringFrequency : undefined,
            attachments,
          },
          { name: user?.name || 'Ayaan (Owner)', role: user?.role, id: user?.id }
        )
        addToast({
          title: 'Expense Updated',
          message: `Updated voucher ${savedExpense.id} successfully.`,
          type: 'success',
        })
      } else {
        savedExpense = expenseService.createExpense(
          {
            name: name.trim(),
            categoryId,
            amount: parseFloat(amount),
            date,
            paymentMethod,
            supplierId: supplierMode === 'SELECT' ? supplierId || undefined : undefined,
            supplierName,
            referenceNumber: referenceNumber.trim() || undefined,
            description: description.trim() || undefined,
            status,
            approvalStatus: effectiveApproval,
            isRecurring,
            recurringFrequency: isRecurring ? recurringFrequency : undefined,
            attachments,
          },
          { name: user?.name || 'Ayaan (Owner)', role: user?.role, id: user?.id }
        )
        addToast({
          title: 'Expense Recorded',
          message: `Created voucher ${savedExpense.id} for ${formatCurrency(savedExpense.amount)}.`,
          type: 'success',
        })
      }

      onSuccess(savedExpense)
      onClose()
    } catch (err: any) {
      addToast({
        title: 'Error Saving Expense',
        message: err.message || 'An unexpected error occurred.',
        type: 'danger',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialExpense ? `Edit Expense: ${initialExpense.id}` : 'Record New Expense'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name & Amount Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <label htmlFor="expense-name" className="block text-xs font-bold text-text-primary mb-1">
              Expense Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="expense-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., LOréal Absolut Repair Color Tubes Batch"
              className={cn(
                'w-full px-3 py-2 text-sm rounded-xl border bg-surface text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                errors.name ? 'border-rose-500' : 'border-border'
              )}
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
          </div>

          <div className="md:col-span-4">
            <label htmlFor="expense-amount" className="block text-xs font-bold text-text-primary mb-1">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-text-muted text-sm font-bold">₹</span>
              <input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={cn(
                  'w-full pl-8 pr-3 py-2 text-sm font-mono font-bold rounded-xl border bg-surface text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary tabular-nums',
                  errors.amount ? 'border-rose-500' : 'border-border'
                )}
              />
            </div>
            {errors.amount && <p className="text-[11px] text-rose-500 mt-1">{errors.amount}</p>}
          </div>
        </div>

        {/* Category, Date & Payment Method */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="expense-category" className="block text-xs font-bold text-text-primary mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="expense-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={cn(
                'w-full px-3 py-2 text-sm rounded-xl border bg-surface text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                errors.categoryId ? 'border-rose-500' : 'border-border'
              )}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="expense-date" className="block text-xs font-bold text-text-primary mb-1">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              id="expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-mono text-xs"
            />
          </div>

          <div>
            <label htmlFor="expense-payment-method" className="block text-xs font-bold text-text-primary mb-1">
              Payment Method
            </label>
            <select
              id="expense-payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as ExpensePaymentMethod)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Supplier & Reference Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="expense-supplier-select" className="text-xs font-bold text-text-primary">
                Supplier / Payee
              </label>
              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setSupplierMode('SELECT')}
                  className={cn(
                    'px-2 py-0.5 rounded-md font-semibold transition-colors',
                    supplierMode === 'SELECT'
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  Existing Supplier
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => setSupplierMode('CUSTOM')}
                  className={cn(
                    'px-2 py-0.5 rounded-md font-semibold transition-colors',
                    supplierMode === 'CUSTOM'
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  Other Payee
                </button>
              </div>
            </div>

            {supplierMode === 'SELECT' ? (
              <select
                id="expense-supplier-select"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">-- Select Registered Supplier (Optional) --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.contactPerson ? `(${s.contactPerson})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="expense-supplier-custom"
                type="text"
                value={customSupplierName}
                onChange={(e) => setCustomSupplierName(e.target.value)}
                placeholder="e.g. City Electricity Board / Landlord"
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            )}
          </div>

          <div>
            <label htmlFor="expense-reference" className="block text-xs font-bold text-text-primary mb-1">
              Invoice / Reference #
            </label>
            <input
              id="expense-reference"
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., INV-9921 / UTR-098231 / Cheque #8812"
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-mono text-xs"
            />
          </div>
        </div>

        {/* Description / Notes */}
        <div>
          <label htmlFor="expense-description" className="block text-xs font-bold text-text-primary mb-1">
            Description & Purpose
          </label>
          <textarea
            id="expense-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Operational notes, business justification, or expense context..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
          />
        </div>

        {/* Financial Obligation Status & Approval Workflow */}
        <div className="p-3.5 rounded-xl border border-border/70 bg-surface-subtle/50 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">Payment Status</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatus('PAID')}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border',
                  status === 'PAID'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : 'bg-surface border-border text-text-muted hover:text-text-primary'
                )}
              >
                Paid Immediately
              </button>
              <button
                type="button"
                onClick={() => setStatus('PENDING')}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border',
                  status === 'PENDING'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-surface border-border text-text-muted hover:text-text-primary'
                )}
              >
                Pending Obligation
              </button>
            </div>
            <p className="text-[10px] text-text-muted mt-1">
              {status === 'PAID'
                ? paymentMethod === 'Cash'
                  ? 'Will record a Cash Out payout in the open register drawer.'
                  : 'Recorded as paid via chosen payment method.'
                : 'Recorded as a pending liability to be settled later.'}
            </p>
          </div>

          <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-border/70 pt-3 md:pt-0 md:pl-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus-visible:ring-primary"
              />
              <span className="text-xs font-bold text-text-primary">
                Route Through Approval Workflow
              </span>
            </label>
            <p className="text-[10px] text-text-muted">
              {requireApproval
                ? 'Expense will be queued for Manager/Admin review before final sign-off.'
                : 'Standard verified voucher (direct approval).'}
            </p>
          </div>
        </div>

        {/* Recurring Expense Toggle */}
        <div className="p-3.5 rounded-xl border border-border/70 bg-surface-subtle/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-primary" aria-hidden="true" />
              <div>
                <span className="text-xs font-bold text-text-primary">Recurring Expense</span>
                <p className="text-[10px] text-text-muted">
                  Automatically schedules rent, utility bills, or periodic contracts
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="sr-only peer"
                aria-label="Toggle recurring schedule"
              />
              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          {isRecurring && (
            <div className="pt-2 border-t border-border/60 flex items-center gap-4">
              <div className="w-1/2">
                <label className="block text-[11px] font-semibold text-text-muted mb-1">
                  Schedule Cadence
                </label>
                <select
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value as RecurringFrequency)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  {RECURRING_FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-1/2 text-[11px] text-text-secondary pt-4">
                Will be registered in the Recurring Expense engine with automated due-date monitoring.
              </div>
            </div>
          )}
        </div>

        {/* Attachments Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Receipts & Invoices</span>
            </span>
            <span className="text-[10px] text-text-muted">Supports JPG, PNG, PDF up to 10MB</span>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 hover:bg-surface-subtle transition-colors cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-1.5">
              <Upload className="h-5 w-5 text-text-muted group-hover:text-primary transition-colors" />
              <p className="text-xs text-text-secondary">
                <span className="font-bold text-primary">Click to upload</span> or drag and drop receipt
              </p>
              <p className="text-[10px] text-text-muted">Cloud storage abstraction ready</p>
            </div>
          </div>

          {/* Uploaded Attachments Chips */}
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate font-medium text-text-primary">{att.fileName}</span>
                    <span className="text-[10px] text-text-muted shrink-0 tabular-nums">
                      ({(att.fileSize / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewAttachment(att)}
                      className="p-1 text-text-muted hover:text-text-primary rounded"
                      aria-label={`Preview ${att.fileName}`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 rounded"
                      aria-label={`Remove ${att.fileName}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {initialExpense ? 'Save Changes' : 'Confirm & Save Expense'}
          </Button>
        </div>
      </form>

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewAttachment(null)}
          title={`Attachment: ${previewAttachment.fileName}`}
          size="lg"
        >
          <div className="p-4 flex flex-col items-center justify-center">
            {previewAttachment.fileType.startsWith('image/') ||
            previewAttachment.url.startsWith('data:image') ||
            previewAttachment.url.includes('unsplash') ? (
              <img
                src={previewAttachment.url}
                alt={previewAttachment.fileName}
                className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-md"
              />
            ) : (
              <div className="p-8 text-center space-y-3">
                <FileText className="h-16 w-16 text-primary mx-auto" />
                <p className="text-sm font-bold text-text-primary">{previewAttachment.fileName}</p>
                <a
                  href={previewAttachment.url}
                  download={previewAttachment.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary/90 transition-colors"
                >
                  Download / Open Document
                </a>
              </div>
            )}
          </div>
        </Modal>
      )}
    </Modal>
  )
}
