import React, { useState } from 'react'
import {
  FileText,
  Calendar,
  CreditCard,
  Building2,
  Tag,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Printer,
  Download,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Eye,
  FileCheck,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Expense, ExpensePaymentMethod } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/useAuthStore'

interface ExpenseDetailModalProps {
  isOpen: boolean
  onClose: () => void
  expense: Expense | null
  onEdit: (expense: Expense) => void
  onMarkPaid: (expense: Expense) => void
  onApprove: (expense: Expense) => void
  onReject: (expense: Expense) => void
  onCancel: (expense: Expense) => void
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  isOpen,
  onClose,
  expense,
  onEdit,
  onMarkPaid,
  onApprove,
  onReject,
  onCancel,
}) => {
  const { user } = useAuthStore()
  const [selectedAttachmentUrl, setSelectedAttachmentUrl] = useState<string | null>(null)

  if (!expense) return null

  const isOwnerOrManager = ['owner', 'admin', 'manager'].includes(user?.role || '')

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Financial Expense Voucher: ${expense.id}`}
      size="lg"
    >
      <div className="space-y-6 print:p-0">
        {/* Top Header Card */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-text-muted">{expense.id}</span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider',
                  expense.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : expense.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                )}
              >
                {expense.status === 'PAID' && <CheckCircle2 className="h-3 w-3" />}
                {expense.status === 'PENDING' && <Clock className="h-3 w-3" />}
                {expense.status === 'CANCELLED' && <XCircle className="h-3 w-3" />}
                <span>{expense.status}</span>
              </span>

              {expense.approvalStatus && expense.approvalStatus !== 'PAID' && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
                    expense.approvalStatus === 'APPROVED'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : expense.approvalStatus === 'PENDING_APPROVAL'
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                  )}
                >
                  {expense.approvalStatus.replace('_', ' ')}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-text-primary">{expense.name}</h2>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Disbursed Amount
            </span>
            <p className="text-2xl font-black text-text-primary tabular-nums mt-0.5 font-mono">
              {formatCurrency(expense.amount)}
            </p>
          </div>
        </div>

        {/* Cancellation Notice Banner */}
        {expense.status === 'CANCELLED' && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-rose-900 dark:text-rose-200">
                Cancelled by {expense.cancelledBy || 'Authorized Staff'} on{' '}
                {expense.cancelledAt ? formatDate(expense.cancelledAt) : 'N/A'}:
              </span>
              <p className="text-rose-700 dark:text-rose-300 mt-0.5 font-mono italic">
                "{expense.cancelReason || 'No reason specified'}"
              </p>
            </div>
          </div>
        )}

        {/* Voucher Fields Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-sans">
          <div className="p-3 rounded-xl border border-border/80 bg-surface">
            <span className="text-text-muted font-medium flex items-center gap-1 mb-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Voucher Date</span>
            </span>
            <p className="font-bold text-text-primary font-mono">{formatDate(expense.date)}</p>
          </div>

          <div className="p-3 rounded-xl border border-border/80 bg-surface">
            <span className="text-text-muted font-medium flex items-center gap-1 mb-1">
              <Tag className="h-3.5 w-3.5 text-accent" />
              <span>Category</span>
            </span>
            <p className="font-bold text-text-primary">{expense.categoryName}</p>
          </div>

          <div className="p-3 rounded-xl border border-border/80 bg-surface">
            <span className="text-text-muted font-medium flex items-center gap-1 mb-1">
              <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
              <span>Payment Method</span>
            </span>
            <p className="font-bold text-text-primary">{expense.paymentMethod}</p>
          </div>

          <div className="p-3 rounded-xl border border-border/80 bg-surface">
            <span className="text-text-muted font-medium flex items-center gap-1 mb-1">
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Supplier / Payee</span>
            </span>
            <p className="font-bold text-text-primary truncate">
              {expense.supplierName || 'General Payee'}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-border/80 bg-surface">
            <span className="text-text-muted font-medium flex items-center gap-1 mb-1">
              <FileCheck className="h-3.5 w-3.5 text-teal-600" />
              <span>Reference Number</span>
            </span>
            <p className="font-bold text-text-primary font-mono truncate">
              {expense.referenceNumber || 'N/A'}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-border/80 bg-surface">
            <span className="text-text-muted font-medium flex items-center gap-1 mb-1">
              <UserCheck className="h-3.5 w-3.5 text-purple-600" />
              <span>Created By</span>
            </span>
            <p className="font-bold text-text-primary truncate">{expense.createdBy}</p>
          </div>
        </div>

        {/* Description / Business Justification */}
        {expense.description && (
          <div className="p-3 rounded-xl border border-border bg-surface-subtle/40">
            <span className="text-[11px] font-bold text-text-muted block mb-1">
              Business Justification & Notes:
            </span>
            <p className="text-xs text-text-primary leading-relaxed">{expense.description}</p>
          </div>
        )}

        {/* Audit & Compliance Signature Trail */}
        <div className="p-3.5 rounded-xl border border-border bg-surface text-xs space-y-2">
          <div className="flex items-center justify-between text-text-muted text-[11px] font-bold border-b border-border/60 pb-1.5">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>SALORA Operational Audit Trail</span>
            </span>
            <span>Recorded at {formatDate(expense.createdAt, { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-text-muted">Approved By: </span>
              <span className="font-semibold text-text-primary">
                {expense.approvedBy || (expense.approvalStatus === 'PENDING_APPROVAL' ? 'Pending Review' : 'Auto-Verified')}
              </span>
            </div>
            <div>
              <span className="text-text-muted">Paid By: </span>
              <span className="font-semibold text-text-primary">
                {expense.paidBy || (expense.status === 'PAID' ? expense.createdBy : 'Unpaid')}
              </span>
            </div>
          </div>
        </div>

        {/* Receipts & Attachments Preview */}
        {expense.attachments && expense.attachments.length > 0 && (
          <div>
            <span className="text-xs font-bold text-text-primary block mb-2">
              Attached Receipts & Verification Invoices ({expense.attachments.length})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {expense.attachments.map((att) => {
                const isImg =
                  att.fileType.startsWith('image/') ||
                  att.url.startsWith('data:image') ||
                  att.url.includes('unsplash')
                return (
                  <div
                    key={att.id}
                    onClick={() => setSelectedAttachmentUrl(att.url)}
                    className="p-2.5 rounded-xl border border-border bg-surface hover:border-primary transition-colors cursor-pointer group flex flex-col justify-between"
                  >
                    {isImg ? (
                      <div className="h-24 w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-2">
                        <img
                          src={att.url}
                          alt={att.fileName}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="h-24 w-full rounded-lg flex items-center justify-center bg-primary/5 text-primary mb-2">
                        <FileText className="h-8 w-8" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">{att.fileName}</p>
                      <span className="text-[10px] text-text-muted">
                        {(att.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5 mr-1" />
              <span>Print Voucher</span>
            </Button>
            {expense.status !== 'CANCELLED' && (
              <Button type="button" variant="outline" size="sm" onClick={() => onEdit(expense)}>
                Edit Details
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Approval Actions */}
            {isOwnerOrManager && expense.approvalStatus === 'PENDING_APPROVAL' && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-rose-600 border-rose-300 hover:bg-rose-50"
                  onClick={() => onReject(expense)}
                >
                  Reject
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => onApprove(expense)}
                >
                  Approve Voucher
                </Button>
              </>
            )}

            {/* Mark as Paid Action */}
            {expense.status === 'PENDING' && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => onMarkPaid(expense)}
              >
                Mark Paid
              </Button>
            )}

            {/* Cancel Action */}
            {expense.status !== 'CANCELLED' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => onCancel(expense)}
              >
                Cancel Expense
              </Button>
            )}

            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Attachment Fullscreen Viewer Modal */}
      {selectedAttachmentUrl && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAttachmentUrl(null)}
          title="Document Preview"
          size="lg"
        >
          <div className="p-4 flex flex-col items-center justify-center">
            <img
              src={selectedAttachmentUrl}
              alt="Receipt Attachment Preview"
              className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-lg"
            />
          </div>
        </Modal>
      )}
    </Modal>
  )
}
