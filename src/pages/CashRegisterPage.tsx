import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  IndianRupee,
  Lock,
  Unlock,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Receipt,
  FileText,
  RotateCcw,
  History,
  TrendingUp,
  ArrowRight,
  CreditCard,
} from 'lucide-react'
import {
  RegisterSession,
  CashAdjustmentType,
  AuditLogEntry,
} from '@/types'
import { cashRegisterService } from '@/services/cashRegisterService'
import { auditService } from '@/services/auditService'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useToastStore } from '@/store/useToastStore'
import { SalesSubNav } from '@/features/billing'

export const CashRegisterPage: React.FC = () => {
  const { addToast } = useToastStore()

  const [currentSession, setCurrentSession] = useState<RegisterSession>(
    cashRegisterService.getCurrentSession()
  )
  const [allSessions, setAllSessions] = useState<RegisterSession[]>(
    cashRegisterService.getAllSessions()
  )
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(
    auditService.getAll()
  )

  // Modals state
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [adjustType, setAdjustType] = useState<CashAdjustmentType>('CASH_OUT')
  const [adjustAmount, setAdjustAmount] = useState<number>(500)
  const [adjustReason, setAdjustReason] = useState<string>('')
  const [adjustError, setAdjustError] = useState<string | null>(null)

  // Daily Closing Modal state
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
  const [countedCash, setCountedCash] = useState<number>(0)
  const [closingNotes, setClosingNotes] = useState<string>('')
  const [closedByName, setClosedByName] = useState<string>('Ayaan (Owner)')

  // Open New Register Session Modal
  const [isOpenNewModalOpen, setIsOpenNewModalOpen] = useState(false)
  const [newOpeningCash, setNewOpeningCash] = useState<number>(5000)
  const [newOpenedByName, setNewOpenedByName] = useState<string>('Ayaan (Owner)')

  const reloadData = () => {
    setCurrentSession(cashRegisterService.getCurrentSession())
    setAllSessions(cashRegisterService.getAllSessions())
    setAuditLogs(auditService.getAll())
  }

  useEffect(() => {
    reloadData()
  }, [])

  // Handle Cash In / Cash Out Adjustment
  const handleSaveAdjustment = () => {
    setAdjustError(null)
    if (!adjustReason.trim()) {
      setAdjustError('A detailed reason is required for accounting verification.')
      return
    }
    if (adjustAmount <= 0) {
      setAdjustError('Adjustment amount must be greater than ₹0.')
      return
    }

    try {
      cashRegisterService.addCashAdjustment(
        currentSession.id,
        adjustType,
        adjustAmount,
        adjustReason.trim(),
        'Receptionist'
      )
      addToast({
        title: adjustType === 'CASH_IN' ? 'Cash In Recorded' : 'Cash Out Recorded',
        message: `₹${adjustAmount} ${adjustType === 'CASH_IN' ? 'added to' : 'paid out from'} cash drawer.`,
        type: 'success',
      })
      setIsAdjustOpen(false)
      setAdjustReason('')
      reloadData()
    } catch (err: any) {
      setAdjustError(err.message || 'Could not record cash adjustment.')
    }
  }

  // Handle Close Register
  const handleConfirmClose = () => {
    try {
      cashRegisterService.closeSession(
        currentSession.id,
        countedCash,
        closedByName,
        closingNotes
      )
      addToast({
        title: 'Daily Register Session Closed',
        message: `Drawer finalized with ₹${countedCash} counted cash.`,
        type: 'success',
      })
      setIsCloseModalOpen(false)
      reloadData()
    } catch (err: any) {
      addToast({
        title: 'Closing Failed',
        message: err.message || 'Could not close register session.',
        type: 'danger',
      })
    }
  }

  // Handle Open New Session
  const handleConfirmOpenNew = () => {
    try {
      cashRegisterService.openSession(newOpeningCash, newOpenedByName)
      addToast({
        title: 'Register Drawer Opened',
        message: `Started new session with ₹${newOpeningCash} float.`,
        type: 'success',
      })
      setIsOpenNewModalOpen(false)
      reloadData()
    } catch (err: any) {
      addToast({
        title: 'Opening Failed',
        message: err.message || 'Could not start new register session.',
        type: 'danger',
      })
    }
  }

  // Live differences
  const difference = (countedCash || 0) - currentSession.expectedCash

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Unified Sales Sub-Navigation Bar */}
      <SalesSubNav />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
              Cash Register & Drawer Management
            </h1>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                currentSession.status === 'OPEN'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              {currentSession.status === 'OPEN' ? (
                <>
                  <Unlock className="h-3 w-3" />
                  Drawer Active (OPEN)
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  Drawer Closed
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Track opening floats, cash drawer sales, petty cash payouts, and end-of-day reconciliation.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-2">
          {currentSession.status === 'OPEN' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAdjustType('CASH_OUT')
                  setIsAdjustOpen(true)
                }}
                leftIcon={<Minus className="h-3.5 w-3.5 text-rose-500" />}
              >
                Cash Out (Payout)
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAdjustType('CASH_IN')
                  setIsAdjustOpen(true)
                }}
                leftIcon={<Plus className="h-3.5 w-3.5 text-emerald-600" />}
              >
                Cash In (Deposit)
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCountedCash(currentSession.expectedCash)
                  setIsCloseModalOpen(true)
                }}
                leftIcon={<Lock className="h-3.5 w-3.5" />}
                className="shadow-glow-primary/30 font-bold"
              >
                Close Register
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsOpenNewModalOpen(true)}
              leftIcon={<Unlock className="h-3.5 w-3.5" />}
              className="shadow-glow-primary/30 font-bold"
            >
              Open New Session
            </Button>
          )}
        </div>
      </div>

      {/* METRIC ROW: FORMULA DISPLAY */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Opening Cash */}
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Opening Float
            </span>
            <div className="text-2xl font-black text-text-primary tabular-nums font-sans">
              {formatCurrency(currentSession.openingCash)}
            </div>
            <span className="text-[10px] text-text-muted">
              Opened by {currentSession.openedBy.split(' ')[0]}
            </span>
          </CardContent>
        </Card>

        {/* 2. Cash Sales */}
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              + Cash Sales
            </span>
            <div className="text-2xl font-black text-emerald-600 tabular-nums font-sans">
              {formatCurrency(currentSession.cashSales)}
            </div>
            <span className="text-[10px] text-text-muted">Collected tender</span>
          </CardContent>
        </Card>

        {/* 3. Cash Refunds */}
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
              - Cash Refunds
            </span>
            <div className="text-2xl font-black text-rose-500 tabular-nums font-sans">
              {formatCurrency(currentSession.cashRefunds)}
            </div>
            <span className="text-[10px] text-text-muted">Returned to guests</span>
          </CardContent>
        </Card>

        {/* 4. Cash Adjustments */}
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              +/- Adjustments
            </span>
            <div className="text-2xl font-black text-text-primary tabular-nums font-sans">
              {currentSession.cashInAdjustments - currentSession.cashOutAdjustments >= 0 ? '+' : ''}
              {formatCurrency(
                currentSession.cashInAdjustments - currentSession.cashOutAdjustments
              )}
            </div>
            <span className="text-[10px] text-text-muted">
              +{currentSession.cashInAdjustments} in / -{currentSession.cashOutAdjustments} out
            </span>
          </CardContent>
        </Card>

        {/* 5. Expected Cash in Drawer */}
        <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/[0.08] to-violet-500/[0.02]">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              = Expected in Drawer
            </span>
            <div className="text-2xl sm:text-3xl font-black text-text-primary tabular-nums font-sans">
              {formatCurrency(currentSession.expectedCash)}
            </div>
            <span className="text-[10px] text-text-muted font-bold">
              Formula reconciled
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ACTIVE SESSION CASH MOVEMENTS & PETTY CASH ADJUSTMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Adjustments Table (7 cols) */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">
                Today's Petty Cash Adjustments
              </CardTitle>
              <CardDescription>
                Manual drawer cash-ins, float additions, and salon supply payouts
              </CardDescription>
            </div>
            {currentSession.status === 'OPEN' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdjustOpen(true)}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                className="text-xs"
              >
                Add Adjustment
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {currentSession.adjustments && currentSession.adjustments.length > 0 ? (
              <div className="divide-y divide-border">
                {currentSession.adjustments.map((adj) => (
                  <div
                    key={adj.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface-subtle/50 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                          adj.type === 'CASH_IN'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}
                      >
                        {adj.type === 'CASH_IN' ? '+' : '-'}
                      </div>
                      <div>
                        <p className="font-bold text-text-primary">{adj.reason}</p>
                        <p className="text-[11px] text-text-muted">
                          By {adj.performedBy} •{' '}
                          {new Date(adj.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-black tabular-nums text-sm ${
                          adj.type === 'CASH_IN' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {adj.type === 'CASH_IN' ? '+' : '-'}
                        {formatCurrency(adj.amount)}
                      </span>
                      <span className="block text-[10px] text-text-muted uppercase font-bold">
                        {adj.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-text-muted text-xs">
                No petty cash adjustments recorded for this drawer session.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Revenue by Tender Distribution (5 cols) */}
        <Card className="lg:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Tender Reconciliations</CardTitle>
            <CardDescription>All payment channels collected during active shift</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-surface-subtle">
                <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                  <IndianRupee className="h-4 w-4 text-emerald-600" />
                  Cash Sales
                </span>
                <span className="font-black text-text-primary tabular-nums">
                  {formatCurrency(currentSession.cashSales)}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-surface-subtle">
                <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-sky-600" />
                  Card POS Sales
                </span>
                <span className="font-black text-text-primary tabular-nums">
                  {formatCurrency(currentSession.cardSales)}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-surface-subtle">
                <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                  UPI Collections
                </span>
                <span className="font-black text-text-primary tabular-nums">
                  {formatCurrency(currentSession.upiSales)}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-surface-subtle">
                <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                  <RotateCcw className="h-4 w-4 text-rose-500" />
                  Total Refunds Issued
                </span>
                <span className="font-black text-rose-500 tabular-nums">
                  -{formatCurrency(currentSession.cashRefunds + currentSession.digitalRefunds)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface border border-border text-[11px] text-text-muted flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                Daily register closing calculates expected drawer balance against actual counted cash. Any variances are stamped to the audit log.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* REGISTER SESSION HISTORY TABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Previous Register Sessions History
          </CardTitle>
          <CardDescription>
            Audited daily cash drawers, opening balances, closing times and reconciled variances
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-subtle/50 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Opened By</th>
                <th className="py-3 px-4 text-right">Opening Float</th>
                <th className="py-3 px-4 text-right">Cash Sales</th>
                <th className="py-3 px-4 text-right">Expected</th>
                <th className="py-3 px-4 text-right">Actual Counted</th>
                <th className="py-3 px-4 text-right">Difference</th>
                <th className="py-3 px-4">Closed By</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allSessions.map((session) => (
                <tr key={session.id} className="hover:bg-surface-hover/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-text-primary">
                    {formatDate(session.date)}
                  </td>
                  <td className="py-3 px-4 text-text-secondary">{session.openedBy}</td>
                  <td className="py-3 px-4 text-right tabular-nums">
                    {formatCurrency(session.openingCash)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-emerald-600 font-bold">
                    {formatCurrency(session.cashSales)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-bold">
                    {formatCurrency(session.expectedCash)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-bold">
                    {session.actualCash !== undefined
                      ? formatCurrency(session.actualCash)
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-black">
                    {session.difference !== undefined ? (
                      <span
                        className={
                          session.difference === 0
                            ? 'text-emerald-600'
                            : session.difference > 0
                            ? 'text-sky-600'
                            : 'text-rose-600'
                        }
                      >
                        {session.difference >= 0 ? '+' : ''}
                        {formatCurrency(session.difference)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4 text-text-secondary">
                    {session.closedBy || 'Currently Open'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        session.status === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                          : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}
                    >
                      {session.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* FINANCIAL AUDIT TRAIL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Financial Audit Trail
          </CardTitle>
          <CardDescription>
            Immutable event log tracking all financial creations, adjustments, refunds, and drawer locks
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {auditLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="p-3.5 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm" className="font-mono text-[9.5px]">
                      {log.action}
                    </Badge>
                    <span className="font-semibold text-text-primary">{log.details}</span>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Logged by <strong>{log.performedBy}</strong> •{' '}
                    {new Date(log.timestamp).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {log.amount !== undefined && (
                  <span className="font-black text-text-primary tabular-nums shrink-0">
                    {formatCurrency(log.amount)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* MODAL 1: CASH ADJUSTMENT (CASH IN / CASH OUT) */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title="Record Cash Adjustment"
        description="Add cash or record petty cash expenditures from active drawer."
        size="md"
      >
        <div className="space-y-4 text-xs">
          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAdjustType('CASH_OUT')}
              className={`p-3 rounded-xl border font-bold text-left transition-all ${
                adjustType === 'CASH_OUT'
                  ? 'border-rose-500 bg-rose-500/10 text-rose-600'
                  : 'border-border bg-surface text-text-secondary'
              }`}
            >
              <div>Cash Out (Payout)</div>
              <div className="text-[10px] text-text-muted font-normal mt-0.5">
                Supplies, petty expenses
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAdjustType('CASH_IN')}
              className={`p-3 rounded-xl border font-bold text-left transition-all ${
                adjustType === 'CASH_IN'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                  : 'border-border bg-surface text-text-secondary'
              }`}
            >
              <div>Cash In (Deposit)</div>
              <div className="text-[10px] text-text-muted font-normal mt-0.5">
                Float addition, coins
              </div>
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <label className="font-bold text-text-primary">Adjustment Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 font-bold text-text-muted">₹</span>
              <input
                type="number"
                min="1"
                value={adjustAmount || ''}
                onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                className="w-full h-10 pl-7 pr-3 rounded-xl bg-surface border border-border text-base font-black tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1">
            <label className="font-bold text-text-primary">
              Justification Reason <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="E.g. Salon cleaning supplies, laundry courier, change replenish…"
              className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {adjustError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs flex items-center gap-1.5 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{adjustError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsAdjustOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveAdjustment} className="font-bold">
              Save Adjustment
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: CLOSE REGISTER (DAILY CLOSING) */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="Daily Register Session Closing"
        description="Reconcile expected cash against physical count and finalize the drawer."
        size="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Detailed Closing Reconciliation Breakdown */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-2">
            <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider mb-2">
              Reconciliation Summary
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-3 border-b border-border/80">
              <div>
                <span className="text-text-muted block text-[10px]">Opening Float</span>
                <span className="font-bold text-text-primary">
                  {formatCurrency(currentSession.openingCash)}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">Cash Sales</span>
                <span className="font-bold text-emerald-600">
                  +{formatCurrency(currentSession.cashSales)}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">Cash Refunds</span>
                <span className="font-bold text-rose-600">
                  -{formatCurrency(currentSession.cashRefunds)}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">Net Adjustments</span>
                <span className="font-bold text-text-primary">
                  {formatCurrency(
                    currentSession.cashInAdjustments - currentSession.cashOutAdjustments
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="font-black text-sm text-text-primary">
                EXPECTED CASH IN DRAWER:
              </span>
              <span className="font-black text-xl text-primary tabular-nums">
                {formatCurrency(currentSession.expectedCash)}
              </span>
            </div>
          </div>

          {/* Actual Cash Count Input */}
          <div className="space-y-1">
            <label className="font-bold text-text-primary block text-sm">
              Actual Counted Cash (Physical Count)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-bold text-text-muted text-base">
                ₹
              </span>
              <input
                type="number"
                min="0"
                value={countedCash || ''}
                onChange={(e) => setCountedCash(parseFloat(e.target.value) || 0)}
                className="w-full h-11 pl-8 pr-3 rounded-xl bg-surface border border-border text-xl font-black tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Variance Notice Box */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
              difference === 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : difference > 0
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            <span>Drawer Variance (Difference):</span>
            <span className="text-base tabular-nums">
              {difference >= 0 ? '+' : ''}
              {formatCurrency(difference)}{' '}
              {difference === 0 ? '(Balanced)' : difference > 0 ? '(Cash Over)' : '(Cash Short)'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-text-primary block">Closing Manager</label>
              <input
                type="text"
                value={closedByName}
                onChange={(e) => setClosedByName(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-text-primary block">Closing Notes</label>
              <input
                type="text"
                placeholder="Discrepancy explanations, bank deposit slip #…"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCloseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmClose} className="font-bold">
              Confirm & Close Register
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: OPEN NEW REGISTER SESSION */}
      <Modal
        isOpen={isOpenNewModalOpen}
        onClose={() => setIsOpenNewModalOpen(false)}
        title="Open New Daily Cash Drawer"
        description="Initialize drawer session with starting float cash."
        size="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-text-primary block">Starting Float (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 font-bold text-text-muted">₹</span>
              <input
                type="number"
                min="0"
                value={newOpeningCash || ''}
                onChange={(e) => setNewOpeningCash(parseFloat(e.target.value) || 0)}
                className="w-full h-10 pl-7 pr-3 rounded-xl bg-surface border border-border text-base font-black tabular-nums text-text-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-text-primary block">Opened By</label>
            <input
              type="text"
              value={newOpenedByName}
              onChange={(e) => setNewOpenedByName(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsOpenNewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmOpenNew} className="font-bold">
              Start Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
