import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Printer,
  Download,
  FileSpreadsheet,
  DollarSign,
  CreditCard,
  Banknote,
  Receipt,
  Users,
  Package,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { businessDayService } from '@/services/businessDayService'
import { useAuthStore } from '@/store/useAuthStore'
import { useToastStore } from '@/store/useToastStore'
import { BusinessDay, DailyClosingSummary, ClosingChecklistItem } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export const DailyClosingPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { addToast } = useToastStore()

  const [session, setSession] = useState<BusinessDay>(businessDayService.getTodaySession())
  const [summary, setSummary] = useState<DailyClosingSummary>(businessDayService.getLiveSummary())
  const [checklist, setChecklist] = useState<ClosingChecklistItem[]>(businessDayService.getClosingChecklist())

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false)
  const [closeConfirmationChecked, setCloseConfirmationChecked] = useState(false)
  const [closingNotes, setClosingNotes] = useState('')
  const [copied, setCopied] = useState(false)

  // Reload data
  const refreshData = () => {
    setSession(businessDayService.getTodaySession())
    setSummary(businessDayService.getLiveSummary())
    setChecklist(businessDayService.getClosingChecklist())
  }

  useEffect(() => {
    refreshData()
  }, [])

  const isClosed = session.status === 'CLOSED'
  const incompleteChecklistCount = checklist.filter((c) => !c.completed).length

  // Close business day handler
  const handleConfirmCloseDay = () => {
    const updated = businessDayService.closeBusinessDay(
      user?.name ? `${user.name} (${user.role})` : 'Ayaan (Owner)',
      closingNotes
    )
    setSession(updated)
    setSummary(updated.summary)
    setChecklist(businessDayService.getClosingChecklist())
    setIsCloseModalOpen(false)
    setCloseConfirmationChecked(false)
    setClosingNotes('')
  }

  // Reopen business day handler
  const handleConfirmReopenDay = () => {
    const updated = businessDayService.reopenBusinessDay(
      user?.name ? `${user.name} (${user.role})` : 'Ayaan (Owner)'
    )
    setSession(updated)
    setSummary(updated.summary)
    setChecklist(businessDayService.getClosingChecklist())
    setIsReopenModalOpen(false)
  }

  // Copy summary to clipboard
  const handleCopySummary = () => {
    const text = `SALORA Daily Summary
Date: ${summary.date}
Appointments: ${summary.totalAppointments}
Completed: ${summary.completedAppointments}
Revenue: ${formatCurrency(summary.revenue)}
Expenses: ${formatCurrency(summary.expensesTotal || 0)}
Net Operating Result: ${formatCurrency(summary.netOperatingResult !== undefined ? summary.netOperatingResult : (summary.revenue - (summary.expensesTotal || 0)))}
Cash: ${formatCurrency(summary.cash)}
UPI: ${formatCurrency(summary.upi)}
Card: ${formatCurrency(summary.card)}
Refunds: ${formatCurrency(summary.refundsAmount)}
New Clients: ${summary.newClients}
Products Sold: ${summary.productsSold}`

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      addToast({
        title: 'Summary Copied',
        message: 'Daily operational summary copied to clipboard.',
        type: 'info',
      })
    })
  }

  // Print summary
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150 print:p-0">
      {/* 1. Header with Breadcrumbs & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
              Daily Closing & Operational Control
            </h1>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider',
                isClosed
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              )}
            >
              {isClosed ? (
                <>
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Session Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Session Open</span>
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Reconcile daily appointments, verify multi-channel collections, complete closing checklist, and lock the business session.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="h-4 w-4" />}
          >
            Print Summary
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => businessDayService.exportSummaryCSV(summary)}
            leftIcon={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
          >
            Export CSV
          </Button>

          {!isClosed ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCloseModalOpen(true)}
              leftIcon={<Lock className="h-4 w-4" />}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Close Business Day
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReopenModalOpen(true)}
              leftIcon={<Unlock className="h-4 w-4 text-amber-500" />}
              className="border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            >
              Reopen Session
            </Button>
          )}
        </div>
      </div>

      {/* 2. Business Day Locked Status Banner */}
      {isClosed && (
        <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-start gap-3 print:hidden">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 shrink-0">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Business Day for {summary.date} is LOCKED
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300/90 mt-0.5 leading-relaxed">
              Financial edits and new billing transactions on this session are strictly blocked.
              All invoices remain viewable, reprints are available, and new bills will belong to the next business day.
              Closed by <span className="font-bold">{session.closedBy || 'Ayaan'}</span> at {session.closedAt ? formatDate(session.closedAt, { hour: '2-digit', minute: '2-digit' }) : 'End of day'}.
            </p>
          </div>
        </div>
      )}

      {/* 3. Top Metrics Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue Card */}
        <Card className="border-border/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Total Gross Revenue</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-text-primary tabular-nums mt-1">
              {formatCurrency(summary.revenue)}
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-text-secondary">
              <span className="font-bold text-emerald-600">Cash: {formatCurrency(summary.cash)}</span>
              <span>•</span>
              <span className="font-bold text-primary">UPI: {formatCurrency(summary.upi)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Processed */}
        <Card className="border-border/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Today's Appointments</span>
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-text-primary tabular-nums mt-1">
              {summary.completedAppointments}{' '}
              <span className="text-sm font-semibold text-text-muted">/ {summary.totalAppointments}</span>
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-text-secondary">
              <span className="text-rose-500 font-bold">{summary.cancelledAppointments} Cancelled</span>
              <span>•</span>
              <span className="text-amber-500 font-bold">{summary.noShowAppointments} No-Show</span>
            </div>
          </CardContent>
        </Card>

        {/* Tickets & Invoices */}
        <Card className="border-border/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Bills & Tickets</span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-text-primary tabular-nums mt-1">
              {summary.billsCount}
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-text-secondary">
              <span className="text-teal-600 font-bold">
                Avg: {formatCurrency(summary.billsCount > 0 ? Math.round(summary.revenue / summary.billsCount) : 0)}
              </span>
              <span>•</span>
              <span>GST: {formatCurrency(summary.taxAmount)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Clients & Products */}
        <Card className="border-border/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Clients & Retail</span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-text-primary tabular-nums mt-1">
              {summary.newClients} New Clients
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-text-secondary">
              <span className="text-blue-600 font-bold">{summary.productsSold} Products Sold</span>
              <span>•</span>
              <span className="text-amber-600 font-bold">{summary.stockAlertsCount} Low Stock</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Core Layout: Checklist & Breakdown (Left) vs Daily Summary & Reconciliation (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Checklist & Payment Channels */}
        <div className="lg:col-span-7 space-y-6">
          {/* Daily Closing Checklist */}
          <Card className="border-border/80">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>Daily Closing Checklist</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-text-muted mt-0.5">
                    Essential reconciliation checkpoints before locking today's register
                  </CardDescription>
                </div>
                {incompleteChecklistCount > 0 ? (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {incompleteChecklistCount} Incomplete
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Ready to Close</span>
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-border/60">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 flex items-start justify-between gap-3 hover:bg-surface-subtle transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        'h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        item.completed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      )}
                    >
                      {item.completed ? (
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={cn(
                          'text-xs font-bold',
                          item.completed ? 'text-text-primary' : 'text-amber-600 dark:text-amber-400'
                        )}
                      >
                        {item.title}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {item.actionUrl && !item.completed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(item.actionUrl!)}
                      className="shrink-0 text-[11px] h-7 px-2.5 font-bold"
                    >
                      {item.actionLabel || 'Resolve'}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Revenue By Payment Method Breakdown */}
          <Card className="border-border/80">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-bold text-text-primary">
                Collections by Tender Method
              </CardTitle>
              <CardDescription className="text-xs text-text-muted">
                Audit breakdown across digital, card, and physical drawer cash
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {[
                {
                  label: 'UPI (QR / App)',
                  amount: summary.upi,
                  pct: summary.revenue > 0 ? Math.round((summary.upi / summary.revenue) * 100) : 0,
                  icon: <CreditCard className="h-4 w-4 text-primary" />,
                  color: 'bg-primary',
                },
                {
                  label: 'Cash in Drawer',
                  amount: summary.cash,
                  pct: summary.revenue > 0 ? Math.round((summary.cash / summary.revenue) * 100) : 0,
                  icon: <Banknote className="h-4 w-4 text-emerald-600" />,
                  color: 'bg-emerald-500',
                },
                {
                  label: 'Card POS (Debit / Credit)',
                  amount: summary.card,
                  pct: summary.revenue > 0 ? Math.round((summary.card / summary.revenue) * 100) : 0,
                  icon: <CreditCard className="h-4 w-4 text-sky-600" />,
                  color: 'bg-sky-500',
                },
                {
                  label: 'Other / NetBanking',
                  amount: summary.other,
                  pct: summary.revenue > 0 ? Math.round((summary.other / summary.revenue) * 100) : 0,
                  icon: <Receipt className="h-4 w-4 text-text-muted" />,
                  color: 'bg-slate-400',
                },
              ].map((m) => (
                <div key={m.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary flex items-center gap-2">
                      {m.icon}
                      <span>{m.label}</span>
                    </span>
                    <span className="font-bold tabular-nums text-text-primary">
                      {formatCurrency(m.amount)}{' '}
                      <span className="text-[11px] text-text-muted font-normal">({m.pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-subtle overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', m.color)}
                      style={{ width: `${Math.max(m.pct, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: SALORA Daily Summary Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* SALORA Daily Summary (Matching Prompt Exactly) */}
          <Card className="border-border/80 shadow-md bg-surface">
            <CardHeader className="pb-3 border-b border-border/80 bg-surface-subtle/40">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-text-primary font-sans">
                    SALORA Daily Summary
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Official salon business closing snapshot
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  aria-label="Copy summary to clipboard"
                  className="p-1.5 rounded-lg border border-border bg-surface text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-5 font-mono text-xs space-y-2.5">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-text-muted">Date:</span>
                <span className="font-bold text-text-primary">{summary.date}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-text-muted">Appointments:</span>
                <span className="font-bold text-text-primary tabular-nums">{summary.totalAppointments}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-text-muted">Completed:</span>
                <span className="font-bold text-emerald-600 tabular-nums">{summary.completedAppointments}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-text-muted">Revenue:</span>
                <span className="font-black text-text-primary tabular-nums text-sm">
                  {formatCurrency(summary.revenue)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-text-muted">Expenses (Today):</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  -{formatCurrency(summary.expensesTotal || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 px-2 my-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex flex-col">
                  <span className="font-bold text-text-primary text-[11px]">Net Operating Result:</span>
                  <span className="text-[9px] text-text-muted">Revenue - Expenses</span>
                </div>
                <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums text-sm">
                  {formatCurrency(
                    summary.netOperatingResult !== undefined
                      ? summary.netOperatingResult
                      : summary.revenue - (summary.expensesTotal || 0)
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-text-muted">Cash:</span>
                <span className="font-bold text-text-primary tabular-nums">{formatCurrency(summary.cash)}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-text-muted">UPI:</span>
                <span className="font-bold text-text-primary tabular-nums">{formatCurrency(summary.upi)}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-text-muted">Card:</span>
                <span className="font-bold text-text-primary tabular-nums">{formatCurrency(summary.card)}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-text-muted">Refunds:</span>
                <span className="font-bold text-rose-500 tabular-nums">{formatCurrency(summary.refundsAmount)}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-text-muted">New Clients:</span>
                <span className="font-bold text-primary tabular-nums">{summary.newClients}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-text-muted">Products Sold:</span>
                <span className="font-bold text-text-primary tabular-nums">{summary.productsSold}</span>
              </div>
            </CardContent>

            <CardFooter className="pt-2 pb-4 border-t border-border/60 bg-surface-subtle/20 flex items-center justify-between">
              <span className="text-[10px] text-text-muted">Verified by SALORA Audit Log</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="h-3.5 w-3.5" />}
                className="text-xs h-8"
              >
                Print Slip
              </Button>
            </CardFooter>
          </Card>

          {/* Taxes & Discounts Summary */}
          <Card className="border-border/80">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-xs font-bold text-text-primary">
                Tax, Discounts & Adjustments Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Promotional Discounts:</span>
                <span className="font-bold text-amber-600 tabular-nums">
                  -{formatCurrency(summary.discountsAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">GST Collected (18% / 12%):</span>
                <span className="font-bold text-text-primary tabular-nums">
                  {formatCurrency(summary.taxAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Total Refunds Disbursed:</span>
                <span className="font-bold text-rose-500 tabular-nums">
                  -{formatCurrency(summary.refundsAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal: Close Business Day */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="Close Business Day"
        description={`Lock daily financial records and finalize session for ${summary.date}`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsCloseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!closeConfirmationChecked}
              onClick={handleConfirmCloseDay}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Lock & Close Day
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              <span>Important Session Lock Notice</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Closing the business day will lock the daily financial session. Invoices for {summary.date} cannot be edited,
              and future transactions will belong to the next business day. Historical records remain fully viewable and reprintable.
            </p>
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-text-primary block">
              Closing Notes (Optional)
            </label>
            <textarea
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="e.g. Till reconciled, cash deposited to safe, all 24 clients serviced successfully…"
              rows={3}
              className="w-full p-2.5 rounded-xl border border-border bg-surface text-text-primary text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-surface-subtle cursor-pointer select-none">
            <input
              type="checkbox"
              checked={closeConfirmationChecked}
              onChange={(e) => setCloseConfirmationChecked(e.target.checked)}
              className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
            />
            <span className="font-medium text-text-primary text-xs leading-snug">
              I confirm that physical cash drawer funds have been verified and all operational appointments have concluded.
            </span>
          </label>
        </div>
      </Modal>

      {/* Confirmation Modal: Reopen Business Day */}
      <Modal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        title="Reopen Business Day Session"
        description={`Unlock daily session for ${summary.date}`}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsReopenModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmReopenDay}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Reopen Session
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-text-secondary leading-relaxed">
            Reopening the business day unlocks the daily financial session, allowing managers to process late adjustments,
            settle pending invoices, or update drawer records.
          </p>
        </div>
      </Modal>
    </div>
  )
}
