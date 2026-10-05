import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  Printer,
  Download,
  Receipt,
  RotateCcw,
  IndianRupee,
  QrCode,
  Building,
  Wallet,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { Payment, BillPaymentMethod, PaymentStatus, Bill } from '@/types'
import { paymentService } from '@/services/paymentService'
import { billingService } from '@/services/billingService'
import { printService } from '@/services/printService'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { useToastStore } from '@/store/useToastStore'
import { BillInvoicePreviewModal, SalesSubNav } from '@/features/billing'

export const PaymentHistoryPage: React.FC = () => {
  const { addToast } = useToastStore()
  const [payments, setPayments] = useState<Payment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Preview modal for linked bill
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)

  const loadPayments = () => {
    setPayments(paymentService.getAll())
  }

  useEffect(() => {
    loadPayments()
  }, [])

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((pay) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesInv = pay.invoiceNumber.toLowerCase().includes(q)
        const matchesClient = pay.clientName.toLowerCase().includes(q)
        const matchesRef = (pay.reference || '').toLowerCase().includes(q)
        const matchesId = pay.id.toLowerCase().includes(q)
        if (!matchesInv && !matchesClient && !matchesRef && !matchesId) return false
      }

      // 2. Method
      if (selectedMethod !== 'all' && pay.method !== selectedMethod) return false

      // 3. Status
      if (selectedStatus !== 'all' && pay.status !== selectedStatus) return false

      // 4. Time Range
      if (timeRange !== 'all') {
        const payDate = new Date(pay.paidAt)
        const now = new Date()
        if (timeRange === 'today') {
          if (payDate.toDateString() !== now.toDateString()) return false
        } else if (timeRange === 'week') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000)
          if (payDate < sevenDaysAgo) return false
        } else if (timeRange === 'month') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
          if (payDate < thirtyDaysAgo) return false
        }
      }

      return true
    })
  }, [payments, searchQuery, selectedMethod, selectedStatus, timeRange])

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredPayments.slice(start, start + pageSize)
  }, [filteredPayments, currentPage, pageSize])

  // Metric cards
  const stats = useMemo(() => {
    const totalVolume = filteredPayments.reduce((sum, p) => sum + p.amount, 0)
    const cashTotal = filteredPayments
      .filter((p) => p.method === 'cash')
      .reduce((sum, p) => sum + p.amount, 0)
    const upiTotal = filteredPayments
      .filter((p) => p.method === 'upi')
      .reduce((sum, p) => sum + p.amount, 0)
    const cardTotal = filteredPayments
      .filter((p) => p.method === 'card')
      .reduce((sum, p) => sum + p.amount, 0)

    return { totalVolume, cashTotal, upiTotal, cardTotal }
  }, [filteredPayments])

  const getMethodBadge = (m: BillPaymentMethod) => {
    switch (m) {
      case 'upi':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200">
            <QrCode className="h-3 w-3" />
            UPI
          </span>
        )
      case 'card':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200">
            <CreditCard className="h-3 w-3" />
            Card
          </span>
        )
      case 'cash':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
            <IndianRupee className="h-3 w-3" />
            Cash
          </span>
        )
      case 'bank_transfer':
      case 'netbanking':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
            <Building className="h-3 w-3" />
            NetBank
          </span>
        )
      case 'wallet':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-200">
            <Wallet className="h-3 w-3" />
            Wallet
          </span>
        )
      case 'split':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200">
            <Layers className="h-3 w-3" />
            Split
          </span>
        )
      default:
        return <Badge variant="default">{m}</Badge>
    }
  }

  const handleOpenBill = async (billId: string, invoiceNumber: string) => {
    const all = await billingService.getAll()
    const found = all.find((b) => b.id === billId || b.invoiceNumber === invoiceNumber)
    if (found) {
      setSelectedBill(found)
    } else {
      addToast({
        title: 'Invoice Record',
        message: `Linked invoice #${invoiceNumber} found in payment ledger.`,
        type: 'info',
      })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Unified Sales Sub-Navigation Bar */}
      <SalesSubNav />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
              Payment Transactions
            </h1>
            <Badge variant="primary" size="sm">
              Live Gateway Ledger
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Real-time audit log of all settled tenders across cash drawers, UPI QR, and POS terminals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/sales/register">
            <Button variant="outline" size="sm" leftIcon={<IndianRupee className="h-4 w-4" />}>
              Cash Register
            </Button>
          </Link>
          <Link to="/sales/billing">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              className="shadow-glow-primary/30 font-bold"
            >
              + New Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Settled Volume
            </span>
            <div className="text-2xl font-black text-text-primary tabular-nums font-sans">
              {formatCurrency(stats.totalVolume)}
            </div>
            <span className="text-[10px] text-text-muted">
              {filteredPayments.length} successful transactions
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              Cash Drawer Sales
            </span>
            <div className="text-2xl font-black text-emerald-600 tabular-nums font-sans">
              {formatCurrency(stats.cashTotal)}
            </div>
            <span className="text-[10px] text-text-muted">Direct counter notes</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">
              UPI Collections
            </span>
            <div className="text-2xl font-black text-violet-600 tabular-nums font-sans">
              {formatCurrency(stats.upiTotal)}
            </div>
            <span className="text-[10px] text-text-muted">Instant bank transfers</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
              Card Terminal
            </span>
            <div className="text-2xl font-black text-sky-600 tabular-nums font-sans">
              {formatCurrency(stats.cardTotal)}
            </div>
            <span className="text-[10px] text-text-muted">Visa / Mastercard / RuPay</span>
          </CardContent>
        </Card>
      </div>

      {/* FILTERS & SEARCH BAR */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex-1">
              <SearchInput
                placeholder="Search payment ID, invoice number, customer name, or auth ref…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Method Filter */}
              <select
                value={selectedMethod}
                onChange={(e) => {
                  setSelectedMethod(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI / QR</option>
                <option value="card">Card POS</option>
                <option value="bank_transfer">NetBanking</option>
                <option value="wallet">Wallet</option>
                <option value="split">Split</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>

              {/* Time Range Filter */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-subtle border border-border">
                {(['all', 'today', 'week', 'month'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setTimeRange(r)
                      setCurrentPage(1)
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      timeRange === r
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PAYMENTS TABLE */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-subtle/50 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((pay) => (
                  <tr
                    key={pay.id}
                    className="hover:bg-surface-hover/70 transition-colors"
                  >
                    {/* Payment ID */}
                    <td className="py-3 px-4 font-mono font-bold text-text-muted text-[11px]">
                      {pay.id}
                    </td>

                    {/* Invoice */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleOpenBill(pay.billId, pay.invoiceNumber)}
                        className="font-mono font-bold text-primary hover:underline text-xs"
                      >
                        {pay.invoiceNumber}
                      </button>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4 font-bold text-text-primary">
                      {pay.clientName}
                    </td>

                    {/* Method */}
                    <td className="py-3 px-4">{getMethodBadge(pay.method)}</td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-black text-text-primary tabular-nums text-sm">
                      {formatCurrency(pay.amount)}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-text-secondary tabular-nums">
                      {new Date(pay.paidAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Reference */}
                    <td className="py-3 px-4 font-mono text-[11px] text-text-muted truncate max-w-[140px]">
                      {pay.reference || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pay.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : pay.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}
                      >
                        {pay.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3" />}
                        {pay.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="View Invoice Slip"
                        onClick={() => handleOpenBill(pay.billId, pay.invoiceNumber)}
                        className="h-7 w-7 p-0"
                        title="View Linked Invoice"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-muted">
                    <Receipt className="h-8 w-8 mx-auto mb-2 text-text-muted/40" />
                    <p className="text-sm font-semibold text-text-primary">
                      No Payments Recorded
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      No payment records match the selected filter criteria.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredPayments.length > pageSize && (
          <div className="p-4 border-t border-border">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredPayments.length / pageSize)}
              totalItems={filteredPayments.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* Linked Invoice Preview Modal */}
      {selectedBill && (
        <BillInvoicePreviewModal
          isOpen={Boolean(selectedBill)}
          onClose={() => setSelectedBill(null)}
          bill={selectedBill}
        />
      )}
    </div>
  )
}
