import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CreditCard,
  Plus,
  Receipt,
  History,
  TrendingUp,
  Clock,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  PauseCircle,
  Eye,
  Printer,
  Zap,
  ArrowRight,
  Sparkles,
  Landmark,
} from 'lucide-react'
import { Bill } from '@/types'
import { useBillingStore } from '@/store/useBillingStore'
import { useToastStore } from '@/store/useToastStore'
import { paymentService } from '@/services/paymentService'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { HeldBillsDrawer, BillInvoicePreviewModal, SalesSubNav } from '@/features/billing'

export const SalesPage: React.FC = () => {
  const navigate = useNavigate()
  const { bills, stats, heldBills, loadHistory, loadStats, loadHeldBills, resumeHeldBill, deleteHeldBill } =
    useBillingStore()
  const { addToast } = useToastStore()

  const [isHeldDrawerOpen, setIsHeldDrawerOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)

  useEffect(() => {
    loadHistory()
    loadStats()
    loadHeldBills()
  }, [loadHistory, loadStats, loadHeldBills])

  // Today's recent bills
  const todayStr = new Date().toISOString().split('T')[0]
  const todayBills = useMemo(() => {
    return bills.filter((b) => b.createdAt.startsWith(todayStr))
  }, [bills, todayStr])

  // Payment methods breakdown (Section 16: Cash, UPI, Card, Other)
  const paymentBreakdown = useMemo(() => {
    const rawPayments = paymentService.getAll()
    const todayPayments = rawPayments.filter((p) => p.paidAt.startsWith(todayStr))

    const breakdown = {
      cash: 0,
      upi: 0,
      card: 0,
      other: 0,
    }

    if (todayPayments.length > 0) {
      todayPayments.forEach((p) => {
        if (p.method === 'cash') breakdown.cash += p.amount
        else if (p.method === 'upi') breakdown.upi += p.amount
        else if (p.method === 'card') breakdown.card += p.amount
        else breakdown.other += p.amount
      })
    } else {
      todayBills.forEach((b) => {
        const m = b.paymentMethod || 'cash'
        const amt = b.paidAmount || 0
        if (m === 'cash') breakdown.cash += amt
        else if (m === 'upi') breakdown.upi += amt
        else if (m === 'card') breakdown.card += amt
        else breakdown.other += amt
      })
    }

    const total = (breakdown.cash + breakdown.upi + breakdown.card + breakdown.other) || 1
    const pct = {
      cash: Math.round((breakdown.cash / total) * 100),
      upi: Math.round((breakdown.upi / total) * 100),
      card: Math.round((breakdown.card / total) * 100),
      other: Math.round((breakdown.other / total) * 100),
    }

    return {
      amounts: breakdown,
      pct,
      total: breakdown.cash + breakdown.upi + breakdown.card + breakdown.other,
    }
  }, [todayBills, todayStr])

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Unified Sales Sub-Navigation Bar */}
      <SalesSubNav />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
              Sales & Payments
            </h1>
            <Badge variant="primary" size="sm">
              Today: {todayStr}
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Monitor salon cash flow, daily collections, customer dues, and billing registers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Cash Register Link */}
          <Link to="/sales/register">
            <Button
              variant="outline"
              leftIcon={<Landmark className="h-4 w-4 text-emerald-600" />}
              className="text-xs"
            >
              Cash Drawer
            </Button>
          </Link>

          {/* Payments Ledger Link */}
          <Link to="/sales/payments">
            <Button
              variant="outline"
              leftIcon={<Receipt className="h-4 w-4 text-primary" />}
              className="text-xs"
            >
              Payments Ledger
            </Button>
          </Link>

          {/* Held Bills button */}
          <Button
            variant="outline"
            onClick={() => setIsHeldDrawerOpen(true)}
            leftIcon={<PauseCircle className="h-4 w-4 text-amber-500" />}
            className="text-xs"
          >
            Held ({heldBills.length})
          </Button>

          {/* Open POS */}
          <Link to="/sales/billing">
            <Button
              variant="primary"
              leftIcon={<CreditCard className="h-4 w-4" />}
              className="shadow-glow-primary/30 text-xs"
            >
              Open POS Billing
            </Button>
          </Link>
        </div>
      </div>

      {/* 5 Top Stat Cards (Requested in Section 1) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Today's Revenue */}
        <Card hoverEffect>
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Today's Revenue
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                +14.5%
              </span>
            </div>
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              {formatCurrency(stats.todayRevenue)}
            </p>
            <p className="text-[10px] text-text-muted">Total settled today</p>
          </CardContent>
        </Card>

        {/* 2. Today's Bills */}
        <Card hoverEffect>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Today's Bills
            </span>
            <p className="text-2xl font-bold text-primary tabular-nums">
              {stats.todayBillsCount}
            </p>
            <p className="text-[10px] text-text-muted">Invoices processed</p>
          </CardContent>
        </Card>

        {/* 3. Paid Amount */}
        <Card hoverEffect>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Paid Amount
            </span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(stats.paidAmount)}
            </p>
            <p className="text-[10px] text-text-muted">Collected tender</p>
          </CardContent>
        </Card>

        {/* 4. Due Amount */}
        <Card hoverEffect>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Due Amount
            </span>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {formatCurrency(stats.dueAmount)}
            </p>
            <p className="text-[10px] text-text-muted">Customer receivables</p>
          </CardContent>
        </Card>

        {/* 5. Refunds */}
        <Card hoverEffect>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Refunds
            </span>
            <p className="text-2xl font-bold text-rose-500 tabular-nums">
              {formatCurrency(stats.refundAmount)}
            </p>
            <p className="text-[10px] text-text-muted">Reversals today</p>
          </CardContent>
        </Card>
      </div>

      {/* Held Bills Notification Alert Banner if any held bills */}
      {heldBills.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <PauseCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-sm">
                You have {heldBills.length} held bill(s) waiting at the reception register.
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-400">
                Latest: <strong>{heldBills[0].clientName}</strong> ({formatCurrency(heldBills[0].estimatedTotal)})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHeldDrawerOpen(true)}
              className="text-xs bg-surface"
            >
              View Held List
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                resumeHeldBill(heldBills[0].id)
                navigate('/sales/billing')
              }}
              className="text-xs shadow-glow-primary/20"
            >
              Resume #{heldBills[0].draftBill.clientName}
            </Button>
          </div>
        </div>
      )}

      {/* Main Grid: Recent Bills (8 cols) + Payment Methods (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT: Recent Bills Today */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">Today's Transactions</CardTitle>
                  <CardDescription className="text-xs">
                    Live stream of invoices processed across counters
                  </CardDescription>
                </div>

                <Link
                  to="/sales/history"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>All Invoices</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface-subtle/50 text-[11px] font-bold text-text-muted uppercase">
                      <th className="py-2.5 px-4">Invoice #</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-right">Paid</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {todayBills.length > 0 ? (
                      todayBills.slice(0, 6).map((bill) => (
                        <tr
                          key={bill.id}
                          onClick={() => setSelectedBill(bill)}
                          className="hover:bg-surface-hover/70 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-primary">
                            {bill.invoiceNumber}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-text-primary truncate">{bill.clientName}</p>
                            <p className="text-[10px] text-text-muted">{bill.staffName}</p>
                          </td>
                          <td className="py-3 px-3 uppercase text-[11px] font-bold text-text-secondary">
                            {bill.paymentMethod}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-text-primary tabular-nums">
                            {formatCurrency(bill.grandTotal)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-600 tabular-nums">
                            {formatCurrency(bill.paidAmount)}
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={
                                bill.paymentStatus === 'PAID'
                                  ? 'success'
                                  : bill.paymentStatus === 'PARTIAL'
                                  ? 'warning'
                                  : bill.paymentStatus === 'REFUNDED'
                                  ? 'default'
                                  : 'danger'
                              }
                              size="sm"
                            >
                              {bill.paymentStatus}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="View Invoice Details"
                              onClick={() => setSelectedBill(bill)}
                              className="h-7 w-7 p-0"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-xs text-text-muted">
                          No transactions recorded yet today.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Payment Channels & Shortcuts (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Payment Channels Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">Payment Methods Breakdown</CardTitle>
                  <CardDescription className="text-xs">Settled tenders today</CardDescription>
                </div>
                <Link
                  to="/sales/payments"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Ledger →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              {/* Cash */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    Cash
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted font-bold">{paymentBreakdown.pct.cash}%</span>
                    <span className="font-bold text-text-primary tabular-nums">
                      {formatCurrency(paymentBreakdown.amounts.cash)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${paymentBreakdown.pct.cash}%` }}
                  />
                </div>
              </div>

              {/* UPI */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                    UPI / QR
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted font-bold">{paymentBreakdown.pct.upi}%</span>
                    <span className="font-bold text-text-primary tabular-nums">
                      {formatCurrency(paymentBreakdown.amounts.upi)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${paymentBreakdown.pct.upi}%` }}
                  />
                </div>
              </div>

              {/* Card */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                    Card (Credit/Debit)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted font-bold">{paymentBreakdown.pct.card}%</span>
                    <span className="font-bold text-text-primary tabular-nums">
                      {formatCurrency(paymentBreakdown.amounts.card)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-300"
                    style={{ width: `${paymentBreakdown.pct.card}%` }}
                  />
                </div>
              </div>

              {/* Other */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    Other (NetBanking/Wallet)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted font-bold">{paymentBreakdown.pct.other}%</span>
                    <span className="font-bold text-text-primary tabular-nums">
                      {formatCurrency(paymentBreakdown.amounts.other)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${paymentBreakdown.pct.other}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border/80 font-black text-text-primary">
                <span>Total Collected:</span>
                <span className="tabular-nums text-emerald-600">
                  {formatCurrency(paymentBreakdown.total || stats.paidAmount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Fast Front-Desk Action Card */}
          <Card className="border border-primary/30 bg-primary/[0.03]">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="font-bold text-sm text-text-primary">Fast Reception Checkout</h4>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Check out scheduled appointments, queue tickets, or walk-in guests with GST calculation and instant invoicing.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/sales/billing')}
                className="w-full shadow-glow-primary/20 text-xs"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Launch POS Register
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Held Bills Drawer */}
      <HeldBillsDrawer
        isOpen={isHeldDrawerOpen}
        onClose={() => setIsHeldDrawerOpen(false)}
        heldBills={heldBills}
        onResumeBill={(id) => {
          resumeHeldBill(id)
          navigate('/sales/billing')
        }}
        onDeleteBill={(id) => {
          deleteHeldBill(id)
          addToast({
            title: 'Held Bill Discarded',
            message: 'Paused order was deleted.',
            type: 'warning',
          })
        }}
      />

      {/* Bill Preview Modal */}
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
