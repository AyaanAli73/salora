import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CreditCard,
  Receipt,
  Search,
  Filter,
  Eye,
  Printer,
  RotateCcw,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  IndianRupee,
  Calendar,
  Download,
} from 'lucide-react'
import { Bill, BillPaymentStatus } from '@/types'
import { useBillingStore } from '@/store/useBillingStore'
import { useToastStore } from '@/store/useToastStore'
import { billingService } from '@/services/billingService'
import { invoiceService } from '@/services/invoiceService'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { BillInvoicePreviewModal, RefundModal, SalesSubNav } from '@/features/billing'

export const BillingHistoryPage: React.FC = () => {
  const { bills, loadHistory } = useBillingStore()
  const { addToast } = useToastStore()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'all' | 'today' | 'week' | 'month'>('all')

  // Modals state
  const [viewingBill, setViewingBill] = useState<Bill | null>(null)
  const [refundingBill, setRefundingBill] = useState<Bill | null>(null)
  const [refundNote, setRefundNote] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Filter bills
  const filteredBills = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const now = Date.now()

    return bills.filter((bill) => {
      // Time range filter
      if (timeRange === 'today') {
        if (!bill.createdAt.startsWith(todayStr)) return false
      } else if (timeRange === 'week') {
        const billTime = new Date(bill.createdAt).getTime()
        if (now - billTime > 7 * 86400000) return false
      } else if (timeRange === 'month') {
        const billTime = new Date(bill.createdAt).getTime()
        if (now - billTime > 30 * 86400000) return false
      }

      // Status filter
      if (selectedStatus !== 'all' && bill.paymentStatus !== selectedStatus) {
        return false
      }

      // Search (invoiceNumber, clientName, clientPhone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesInvoice = bill.invoiceNumber.toLowerCase().includes(q)
        const matchesClient = bill.clientName.toLowerCase().includes(q)
        const matchesPhone = (bill.clientPhone || '').includes(q)
        if (!matchesInvoice && !matchesClient && !matchesPhone) return false
      }

      return true
    })
  }, [bills, timeRange, selectedStatus, searchQuery])

  // Paginated bills
  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredBills.slice(start, start + pageSize)
  }, [filteredBills, currentPage, pageSize])

  // History stats
  const stats = useMemo(() => {
    const total = filteredBills.length
    const totalRevenue = filteredBills
      .filter((b) => b.paymentStatus !== 'REFUNDED')
      .reduce((sum, b) => sum + (b.paidAmount || 0), 0)
    const totalDue = filteredBills
      .filter((b) => b.paymentStatus !== 'REFUNDED')
      .reduce((sum, b) => sum + (b.dueAmount || 0), 0)
    const totalRefunds = filteredBills
      .filter((b) => b.paymentStatus === 'REFUNDED')
      .reduce((sum, b) => sum + (b.grandTotal || 0), 0)

    return { total, totalRevenue, totalDue, totalRefunds }
  }, [filteredBills])

  const handleConfirmRefund = async () => {
    if (!refundingBill) return
    try {
      await billingService.refundBill(refundingBill.id, refundNote)
      await loadHistory()
      addToast({
        title: 'Invoice Refunded',
        message: `Invoice ${refundingBill.invoiceNumber} marked as refunded.`,
        type: 'warning',
      })
      setRefundingBill(null)
      setRefundNote('')
    } catch {
      addToast({
        title: 'Refund Error',
        message: 'Could not process invoice refund.',
        type: 'danger',
      })
    }
  }

  const getStatusBadge = (status: BillPaymentStatus) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">Paid</Badge>
      case 'PARTIAL':
        return <Badge variant="warning">Partial</Badge>
      case 'UNPAID':
        return <Badge variant="danger">Unpaid</Badge>
      case 'REFUNDED':
        return <Badge variant="default">Refunded</Badge>
      default:
        return <Badge variant="default">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Unified Sales Sub-Navigation Bar */}
      <SalesSubNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
              Billing History & Invoices
            </h1>
            <Badge variant="primary" size="sm">
              {filteredBills.length} Invoices
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Audit settled salon invoices, review client dues, reprints, and refund logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/sales">
            <Button variant="outline" size="sm">
              Sales Dashboard
            </Button>
          </Link>

          <Link to="/sales/billing">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              className="shadow-glow-primary/30"
            >
              + New POS Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card hoverEffect>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Total Invoices
            </span>
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              {stats.total}
            </p>
            <p className="text-[10px] text-text-muted">Issued in filter</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Total Collected
            </span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(stats.totalRevenue)}
            </p>
            <p className="text-[10px] text-text-muted">Settled revenues</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Outstanding Dues
            </span>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {formatCurrency(stats.totalDue)}
            </p>
            <p className="text-[10px] text-text-muted">Customer credit balance</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Total Refunded
            </span>
            <p className="text-2xl font-bold text-rose-500 tabular-nums">
              {formatCurrency(stats.totalRefunds)}
            </p>
            <p className="text-[10px] text-text-muted">Reversals and voids</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="md:col-span-2">
              <SearchInput
                placeholder="Search invoice #, customer name, phone…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                onClear={() => setSearchQuery('')}
              />
            </div>

            {/* Time Range Filter */}
            <div>
              <select
                aria-label="Timeframe Range"
                value={timeRange}
                onChange={(e) => {
                  setTimeRange(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">Past 7 Days</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                aria-label="Payment Status"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="all">All Payment Statuses</option>
                <option value="PAID">Paid in Full</option>
                <option value="PARTIAL">Partially Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-subtle/50 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Specialist</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
                <th className="py-3 px-3 text-right">Discount</th>
                <th className="py-3 px-3 text-right">Tax</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-3 text-right">Paid</th>
                <th className="py-3 px-3 text-right">Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedBills.length > 0 ? (
                paginatedBills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="hover:bg-surface-hover/70 transition-colors group cursor-pointer"
                    onClick={() => setViewingBill(bill)}
                  >
                    {/* Invoice # */}
                    <td className="py-3 px-4 font-bold">
                      <span className="font-mono text-primary font-bold">
                        {bill.invoiceNumber}
                      </span>
                      <span className="text-[10px] text-text-muted font-normal block">
                        {bill.items.length} items • {bill.paymentMethod}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 tabular-nums text-text-secondary">
                      {formatDate(bill.createdAt)}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-text-primary truncate">
                        {bill.clientName}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {bill.clientPhone || 'No phone'}
                      </p>
                    </td>

                    {/* Specialist */}
                    <td className="py-3 px-4 text-text-secondary font-medium">
                      {bill.staffName}
                    </td>

                    {/* Financials */}
                    <td className="py-3 px-3 text-right tabular-nums text-text-secondary">
                      {formatCurrency(bill.subtotal)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-emerald-600">
                      {bill.discount > 0 ? `-${formatCurrency(bill.discount)}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-text-secondary">
                      {formatCurrency(bill.tax)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-black text-text-primary">
                      {formatCurrency(bill.grandTotal)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold text-emerald-600">
                      {formatCurrency(bill.paidAmount)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold">
                      {bill.dueAmount > 0 ? (
                        <span className="text-amber-600">
                          {formatCurrency(bill.dueAmount)}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3 px-4">{getStatusBadge(bill.paymentStatus)}</td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="View Invoice"
                          onClick={() => setViewingBill(bill)}
                          className="h-7 w-7 p-0"
                          title="View & Print Layout"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Print Invoice"
                          onClick={() => setViewingBill(bill)}
                          className="h-7 w-7 p-0 text-text-secondary hover:text-primary relative"
                          title="Print / Reprint"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          {(bill.reprintCount || 0) > 0 && (
                            <span className="absolute -top-1 -right-1 text-[8px] bg-amber-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                              {bill.reprintCount}
                            </span>
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Download PDF"
                          onClick={() => {
                            invoiceService.downloadPDF(bill, 'a4')
                            addToast({
                              title: 'PDF Exported',
                              message: `Saved invoice #${bill.invoiceNumber}.`,
                              type: 'success',
                            })
                          }}
                          className="h-7 w-7 p-0 text-text-secondary hover:text-primary"
                          title="Download PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>

                        {bill.paymentStatus !== 'REFUNDED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Refund Invoice"
                            onClick={() => setRefundingBill(bill)}
                            className="h-7 w-7 p-0 text-text-muted hover:text-rose-500"
                            title="Refund"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-text-muted">
                    <Receipt className="h-8 w-8 mx-auto mb-2 text-text-muted/40" />
                    <p className="text-sm font-semibold text-text-primary">
                      No Invoices Found
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      No bills match the selected time range or payment status.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredBills.length > pageSize && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-text-muted">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredBills.length)} of{' '}
              {filteredBills.length} invoices
            </span>

            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredBills.length / pageSize)}
              totalItems={filteredBills.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* INVOICE PREVIEW MODAL */}
      {viewingBill && (
        <BillInvoicePreviewModal
          isOpen={Boolean(viewingBill)}
          onClose={() => setViewingBill(null)}
          bill={viewingBill}
          onReprint={() => loadHistory()}
        />
      )}

      {/* COMPREHENSIVE REFUND MODAL */}
      {refundingBill && (
        <RefundModal
          isOpen={Boolean(refundingBill)}
          onClose={() => {
            setRefundingBill(null)
            setRefundNote('')
          }}
          bill={refundingBill}
          onRefundCompleted={() => {
            loadHistory()
          }}
        />
      )}
    </div>
  )
}
