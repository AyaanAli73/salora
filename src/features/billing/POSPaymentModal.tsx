import React, { useState, useEffect } from 'react'
import {
  BillPaymentMethod,
  Payment,
  PaymentStatus,
  Bill,
} from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/formatters'
import { paymentService } from '@/services/paymentService'
import { paymentGatewayService } from '@/services/paymentGatewayService'
import { useToastStore } from '@/store/useToastStore'
import {
  IndianRupee,
  QrCode,
  CreditCard,
  Building,
  Wallet,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

interface SplitRow {
  id: string
  method: BillPaymentMethod
  amount: number
  reference?: string
}

interface POSPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  grandTotal: number
  clientName: string
  clientPhone?: string
  initialPaidAmount?: number
  initialMethod?: BillPaymentMethod
  onConfirmPayment: (result: {
    method: BillPaymentMethod
    paidAmount: number
    dueAmount: number
    payments: Omit<Payment, 'id' | 'paidAt'>[]
    notes?: string
  }) => Promise<void>
  isProcessing?: boolean
}

export const POSPaymentModal: React.FC<POSPaymentModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  clientName,
  clientPhone,
  initialPaidAmount,
  initialMethod = 'cash',
  onConfirmPayment,
  isProcessing = false,
}) => {
  const { addToast } = useToastStore()

  // Primary mode: 'single' or 'split'
  const [activeMethod, setActiveMethod] = useState<BillPaymentMethod>(
    initialMethod === 'split' ? 'split' : initialMethod || 'cash'
  )

  // Paid amount for single tender
  const [tenderAmount, setTenderAmount] = useState<number>(
    initialPaidAmount !== undefined ? initialPaidAmount : grandTotal
  )

  // Cash change helpers
  const [cashReceived, setCashReceived] = useState<number>(
    tenderAmount || grandTotal
  )

  // UPI state
  const [upiSimulated, setUpiSimulated] = useState<boolean>(false)
  const [isVerifyingUpi, setIsVerifyingUpi] = useState<boolean>(false)

  // Card state
  const [cardRef, setCardRef] = useState<string>('AUTH-' + Math.floor(100000 + Math.random() * 900000))
  const [cardLast4, setCardLast4] = useState<string>('4242')
  const [cardStatus, setCardStatus] = useState<PaymentStatus>('COMPLETED')

  // Split state
  const [splitRows, setSplitRows] = useState<SplitRow[]>([
    { id: 's1', method: 'cash', amount: Math.floor(grandTotal / 2) },
    { id: 's2', method: 'upi', amount: grandTotal - Math.floor(grandTotal / 2) },
  ])

  // Checkout notes & reference
  const [paymentNote, setPaymentNote] = useState<string>('')

  // Sync state if grandTotal changes
  useEffect(() => {
    if (tenderAmount === 0 && grandTotal > 0) {
      setTenderAmount(grandTotal)
      setCashReceived(grandTotal)
    }
  }, [grandTotal])

  // Compute live due & change
  const effectivePaid =
    activeMethod === 'split'
      ? splitRows.reduce((sum, r) => sum + (r.amount || 0), 0)
      : Math.min(grandTotal, tenderAmount)

  const dueAmount = Math.max(0, Math.round((grandTotal - effectivePaid) * 100) / 100)
  const changeDue = Math.max(0, Math.round((cashReceived - tenderAmount) * 100) / 100)

  // Split row operations
  const handleAddSplitRow = () => {
    const currentSum = splitRows.reduce((sum, r) => sum + (r.amount || 0), 0)
    const remaining = Math.max(0, grandTotal - currentSum)
    setSplitRows([
      ...splitRows,
      {
        id: `s-${Date.now()}`,
        method: 'upi',
        amount: remaining,
      },
    ])
  }

  const handleUpdateSplitRow = (
    id: string,
    field: 'method' | 'amount' | 'reference',
    val: any
  ) => {
    setSplitRows((rows) =>
      rows.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    )
  }

  const handleRemoveSplitRow = (id: string) => {
    if (splitRows.length <= 1) return
    setSplitRows((rows) => rows.filter((r) => r.id !== id))
  }

  // Quick cash increment
  const handleAddCash = (inc: number) => {
    setCashReceived((prev) => prev + inc)
  }

  const handleSetExact = () => {
    setTenderAmount(grandTotal)
    setCashReceived(grandTotal)
  }

  // Simulate UPI verification
  const handleVerifyUpi = async () => {
    setIsVerifyingUpi(true)
    await new Promise((res) => setTimeout(res, 600))
    setUpiSimulated(true)
    setIsVerifyingUpi(false)
    addToast({
      title: 'UPI Payment Confirmed',
      message: '₹' + tenderAmount + ' received via UPI Gateway.',
      type: 'success',
    })
  }

  // Handle final submission
  const handleSubmit = async () => {
    if (activeMethod === 'split') {
      const splitValidation = paymentService.validateSplitPayments(splitRows, grandTotal)
      if (!splitValidation.isValid) {
        addToast({
          title: 'Split Payment Error',
          message: splitValidation.error || 'Invalid split amounts.',
          type: 'danger',
        })
        return
      }

      const payments: Omit<Payment, 'id' | 'paidAt'>[] = splitRows.map((row) => ({
        billId: '',
        invoiceNumber: '',
        clientName,
        method: row.method,
        amount: row.amount,
        reference: row.reference || `SPLIT-${row.method.toUpperCase()}`,
        status: 'COMPLETED',
        notes: paymentNote,
      }))

      await onConfirmPayment({
        method: 'split',
        paidAmount: splitValidation.allocatedTotal,
        dueAmount: splitValidation.remainingDue,
        payments,
        notes: paymentNote,
      })
    } else {
      if (tenderAmount > grandTotal) {
        addToast({
          title: 'Invalid Amount',
          message: 'Paid amount cannot exceed grand total. Return change to customer.',
          type: 'warning',
        })
      }

      const singlePayment: Omit<Payment, 'id' | 'paidAt'> = {
        billId: '',
        invoiceNumber: '',
        clientName,
        method: activeMethod,
        amount: effectivePaid,
        reference:
          activeMethod === 'card'
            ? cardRef
            : activeMethod === 'upi'
            ? 'UPI-APP-' + Math.floor(100000 + Math.random() * 900000)
            : `CASH-${Date.now()}`,
        cardLast4: activeMethod === 'card' ? cardLast4 : undefined,
        status: activeMethod === 'card' ? cardStatus : 'COMPLETED',
        notes: paymentNote,
      }

      await onConfirmPayment({
        method: activeMethod,
        paidAmount: effectivePaid,
        dueAmount,
        payments: [singlePayment],
        notes: paymentNote,
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settle Payment & Checkout"
      description={`Customer: ${clientName} ${clientPhone ? `(${clientPhone})` : ''}`}
      size="lg"
    >
      <div className="space-y-5">
        {/* FINANCIAL SUMMARY HIGHLIGHT CARD */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-gradient-to-br from-primary/[0.08] to-violet-500/[0.02] border-2 border-primary/20">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted block">
              Grand Total
            </span>
            <span className="text-xl sm:text-2xl font-black text-text-primary tabular-nums">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
              Paid Amount
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums">
              {formatCurrency(effectivePaid)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 block">
              Due Amount
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-500 tabular-nums">
              {formatCurrency(dueAmount)}
            </span>
          </div>
        </div>

        {/* PAYMENT METHOD SELECTOR TABS */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-primary block">
            Select Payment Method
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {[
              { id: 'cash', label: 'Cash', icon: <IndianRupee className="h-4 w-4" /> },
              { id: 'upi', label: 'UPI / QR', icon: <QrCode className="h-4 w-4" /> },
              { id: 'card', label: 'Card', icon: <CreditCard className="h-4 w-4" /> },
              { id: 'bank_transfer', label: 'NetBank', icon: <Building className="h-4 w-4" /> },
              { id: 'wallet', label: 'Wallet', icon: <Wallet className="h-4 w-4" /> },
              { id: 'split', label: 'Split Pay', icon: <Layers className="h-4 w-4" /> },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMethod(m.id as any)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  activeMethod === m.id
                    ? 'border-primary bg-primary text-white shadow-xs scale-[1.02]'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-hover hover:border-primary/40'
                }`}
              >
                {m.icon}
                <span className="truncate">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 1. CASH PAYMENT PANEL */}
        {activeMethod === 'cash' && (
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-4 animate-in fade-in duration-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary">
                Cash Tender & Change Return
              </span>
              <button
                type="button"
                onClick={handleSetExact}
                className="text-xs text-primary font-bold hover:underline"
              >
                Exact Cash (₹{grandTotal})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Amount to Pay */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-muted">
                  Amount Due
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-text-muted">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={tenderAmount || ''}
                    onChange={(e) => setTenderAmount(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 pl-7 pr-3 rounded-xl bg-surface border border-border text-base font-black tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Cash Received */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-muted">
                  Cash Received
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-text-muted">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 pl-7 pr-3 rounded-xl bg-surface border border-border text-base font-black tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Change Return Box */}
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Change to Return
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ₹{changeDue}
                </span>
                <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80">
                  {cashReceived >= tenderAmount ? 'Sufficient cash tendered' : 'Partial tender'}
                </span>
              </div>
            </div>

            {/* Quick Cash Add Buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              {[100, 200, 500, 1000, 2000].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleAddCash(inc)}
                  className="flex-1 py-1.5 rounded-lg bg-surface border border-border text-xs font-bold text-text-secondary hover:border-primary/50 hover:text-primary transition-colors"
                >
                  +{inc}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. UPI / QR PANEL */}
        {activeMethod === 'upi' && (
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-4 animate-in fade-in duration-100">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Dynamic QR Box */}
              <div className="w-36 h-36 bg-white p-2.5 rounded-2xl border-2 border-neutral-300 shadow-xs flex flex-col items-center justify-between shrink-0">
                {/* Visual SVG QR representation */}
                <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-white p-2 rounded-xl text-center">
                  <QrCode className="h-16 w-16 text-white" />
                  <span className="text-[8px] font-mono tracking-widest text-emerald-400 mt-1 uppercase">
                    Scan with UPI App
                  </span>
                </div>
              </div>

              {/* UPI Details & Verification */}
              <div className="space-y-2 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">Salon UPI VPA</span>
                  <Badge variant="primary" size="sm">
                    Verified
                  </Badge>
                </div>
                <div className="p-2 rounded-xl bg-surface border border-border font-mono text-text-primary font-bold">
                  SALORA.salon@icici
                </div>
                <p className="text-[11px] text-text-muted">
                  Customer can scan using Google Pay, PhonePe, Paytm, or BHIM.
                </p>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVerifyUpi}
                    isLoading={isVerifyingUpi}
                    leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                    className="text-xs"
                  >
                    Simulate Payment Verification
                  </Button>
                  {upiSimulated && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Received
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. CARD PAYMENT PANEL */}
        {activeMethod === 'card' && (
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-3 animate-in fade-in duration-100 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-text-primary">Card Amount</label>
                <input
                  type="number"
                  value={tenderAmount || ''}
                  onChange={(e) => setTenderAmount(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-base font-black tabular-nums text-text-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-primary">POS Reference / Auth #</label>
                <input
                  type="text"
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-border font-mono text-xs text-text-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-primary">Last 4 Digits</label>
                <input
                  type="text"
                  maxLength={4}
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-border font-mono text-xs text-text-primary"
                  placeholder="4242"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="font-semibold text-text-muted">POS Terminal Status:</span>
              <div className="flex items-center gap-1.5">
                {(['COMPLETED', 'PENDING', 'FAILED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setCardStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      cardStatus === st
                        ? st === 'COMPLETED'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : st === 'PENDING'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'border-border bg-surface text-text-secondary'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. SPLIT PAYMENT PANEL */}
        {activeMethod === 'split' && (
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-3 animate-in fade-in duration-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-text-primary block">
                  Multi-Tender Split Allocation
                </span>
                <span className="text-[11px] text-text-muted">
                  Combine cash, UPI, and card payments on a single checkout
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSplitRow}
                leftIcon={<Plus className="h-3 w-3" />}
                className="text-xs"
              >
                + Add Method
              </Button>
            </div>

            <div className="space-y-2">
              {splitRows.map((row, idx) => (
                <div
                  key={row.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-border"
                >
                  <span className="text-xs font-bold text-text-muted w-5 text-center">
                    #{idx + 1}
                  </span>

                  <select
                    value={row.method}
                    onChange={(e) =>
                      handleUpdateSplitRow(row.id, 'method', e.target.value as any)
                    }
                    className="h-9 px-2.5 rounded-lg bg-surface border border-border text-xs font-bold text-text-primary focus:outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / QR</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">NetBanking</option>
                    <option value="wallet">Wallet</option>
                    <option value="other">Other</option>
                  </select>

                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-2 text-text-muted font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={row.amount || ''}
                      onChange={(e) =>
                        handleUpdateSplitRow(
                          row.id,
                          'amount',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full h-9 pl-6 pr-2.5 rounded-lg bg-surface border border-border text-xs font-black tabular-nums text-text-primary"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Ref / Note…"
                    value={row.reference || ''}
                    onChange={(e) =>
                      handleUpdateSplitRow(row.id, 'reference', e.target.value)
                    }
                    className="w-28 h-9 px-2 rounded-lg bg-surface border border-border text-[11px] text-text-secondary placeholder:text-text-muted"
                  />

                  {splitRows.length > 1 && (
                    <button
                      type="button"
                      aria-label="Remove split line"
                      onClick={() => handleRemoveSplitRow(row.id)}
                      className="p-1.5 text-text-muted hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Split status footer */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
              <span className="text-text-muted">
                Allocated:{' '}
                <strong className="text-text-primary font-bold">
                  ₹{effectivePaid}
                </strong>{' '}
                of ₹{grandTotal}
              </span>
              <span
                className={`font-bold ${
                  effectivePaid === grandTotal
                    ? 'text-emerald-600'
                    : effectivePaid > grandTotal
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }`}
              >
                {effectivePaid === grandTotal
                  ? '✓ Balanced'
                  : effectivePaid > grandTotal
                  ? `Overallocated by ₹${effectivePaid - grandTotal}`
                  : `Remaining Due: ₹${dueAmount}`}
              </span>
            </div>
          </div>
        )}

        {/* 5. BANK / WALLET / OTHER */}
        {(activeMethod === 'bank_transfer' ||
          activeMethod === 'wallet' ||
          activeMethod === 'other') && (
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-3 text-xs animate-in fade-in duration-100">
            <div className="flex justify-between items-center">
              <span className="font-bold text-text-primary uppercase">
                {activeMethod.replace('_', ' ')} Settlement
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-text-muted">Amount Received</label>
                <input
                  type="number"
                  value={tenderAmount || ''}
                  onChange={(e) => setTenderAmount(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-border font-black text-text-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-text-muted">Transaction ID / Transfer Ref</label>
                <input
                  type="text"
                  placeholder="UTR / IMPS / Wallet Ref…"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* PARTIAL PAYMENT DUE WARNING */}
        {dueAmount > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Partial Payment: ₹{dueAmount} remaining will be added to {clientName}'s credit ledger.
            </span>
            <Badge variant="warning" size="sm">
              Partial
            </Badge>
          </div>
        )}

        {/* BOTTOM ACTION BUTTONS */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
          <Button variant="outline" size="md" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            isLoading={isProcessing}
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
            className="shadow-glow-primary/30 font-bold"
          >
            Confirm & Settle ₹{effectivePaid}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
