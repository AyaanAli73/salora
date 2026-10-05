import {
  RegisterSession,
  CashAdjustment,
  CashAdjustmentType,
  Payment,
  Refund,
} from '@/types'
import { auditLogService } from './auditLogService'
import { useToastStore } from '@/store/useToastStore'
import { useNotificationStore } from '@/store/useNotificationStore'

const REGISTER_STORAGE_KEY = 'SALORA_cash_register_sessions'
const CURRENT_SESSION_ID_KEY = 'SALORA_current_register_session_id'

const todayStr = new Date().toISOString().split('T')[0]
const nowIso = new Date().toISOString()

const INITIAL_SESSIONS: RegisterSession[] = []

function getStoredSessions(): RegisterSession[] {
  try {
    const raw = localStorage.getItem(REGISTER_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Could not read register sessions:', err)
  }
  return []
}

function saveSessions(sessions: RegisterSession[]): void {
  try {
    localStorage.setItem(REGISTER_STORAGE_KEY, JSON.stringify(sessions))
  } catch (err) {
    console.warn('Could not persist register sessions:', err)
  }
}

export const cashRegisterService = {
  getAllSessions(): RegisterSession[] {
    return getStoredSessions()
  },

  getCurrentSession(): RegisterSession {
    const sessions = getStoredSessions()
    const active = sessions.find((s) => s.status === 'OPEN')
    if (active) return active

    // Auto-create today's session if none is open
    return this.openSession(5000, 'Reception Desk')
  },

  openSession(openingCash: number, openedBy: string): RegisterSession {
    const sessions = getStoredSessions()
    const newSession: RegisterSession = {
      id: `reg-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      openedAt: new Date().toISOString(),
      openedBy,
      openingCash,
      cashSales: 0,
      cardSales: 0,
      upiSales: 0,
      bankSales: 0,
      otherSales: 0,
      cashRefunds: 0,
      digitalRefunds: 0,
      cashInAdjustments: 0,
      cashOutAdjustments: 0,
      expectedCash: openingCash,
      status: 'OPEN',
      adjustments: [],
    }

    const updated = [newSession, ...sessions]
    saveSessions(updated)

    auditLogService.log({
      action: 'REGISTER_OPENED',
      entityType: 'register',
      entityId: newSession.id,
      performedBy: openedBy,
      userRole: 'receptionist',
      details: `Opened register session with starting cash float of ₹${openingCash}.`,
      amount: openingCash,
    })

    return newSession
  },

  addCashAdjustment(
    sessionId: string,
    type: CashAdjustmentType,
    amount: number,
    reason: string,
    performedBy: string
  ): RegisterSession {
    const sessions = getStoredSessions()
    const idx = sessions.findIndex((s) => s.id === sessionId)
    if (idx === -1) throw new Error('Register session not found')

    const session = { ...sessions[idx] }
    if (session.status === 'CLOSED') {
      throw new Error('Cannot adjust a closed register session.')
    }

    const adjustment: CashAdjustment = {
      id: `adj-${Date.now()}`,
      registerSessionId: session.id,
      type,
      amount,
      reason,
      performedBy,
      createdAt: new Date().toISOString(),
    }

    session.adjustments = [adjustment, ...(session.adjustments || [])]
    if (type === 'CASH_IN') {
      session.cashInAdjustments = (session.cashInAdjustments || 0) + amount
    } else {
      session.cashOutAdjustments = (session.cashOutAdjustments || 0) + amount
    }

    // Expected Cash = Opening Cash + Cash Sales - Cash Refunds + Cash In - Cash Out
    session.expectedCash =
      session.openingCash +
      session.cashSales -
      session.cashRefunds +
      session.cashInAdjustments -
      session.cashOutAdjustments

    sessions[idx] = session
    saveSessions(sessions)

    auditLogService.log({
      action: 'CASH_ADJUSTMENT',
      entityType: 'register',
      entityId: session.id,
      performedBy,
      userRole: 'manager',
      details: `${type === 'CASH_IN' ? 'Cash In (Deposit)' : 'Cash Out (Payout)'} of ₹${amount} for "${reason}".`,
      amount,
      metadata: { type, reason },
    })

    return session
  },

  recordSaleTransaction(payment: Payment): void {
    const sessions = getStoredSessions()
    const idx = sessions.findIndex((s) => s.status === 'OPEN')
    if (idx === -1) return

    const session = { ...sessions[idx] }
    const method = payment.method.toLowerCase()

    if (method === 'cash') {
      session.cashSales = (session.cashSales || 0) + payment.amount
    } else if (method === 'card') {
      session.cardSales = (session.cardSales || 0) + payment.amount
    } else if (method === 'upi') {
      session.upiSales = (session.upiSales || 0) + payment.amount
    } else if (method === 'netbanking' || method === 'bank_transfer') {
      session.bankSales = (session.bankSales || 0) + payment.amount
    } else {
      session.otherSales = (session.otherSales || 0) + payment.amount
    }

    session.expectedCash =
      session.openingCash +
      session.cashSales -
      session.cashRefunds +
      (session.cashInAdjustments || 0) -
      (session.cashOutAdjustments || 0)

    sessions[idx] = session
    saveSessions(sessions)
  },

  recordRefundTransaction(refund: Refund): void {
    const sessions = getStoredSessions()
    const idx = sessions.findIndex((s) => s.status === 'OPEN')
    if (idx === -1) return

    const session = { ...sessions[idx] }
    if (refund.method.toLowerCase() === 'cash') {
      session.cashRefunds = (session.cashRefunds || 0) + refund.amount
    } else {
      session.digitalRefunds = (session.digitalRefunds || 0) + refund.amount
    }

    session.expectedCash =
      session.openingCash +
      session.cashSales -
      session.cashRefunds +
      (session.cashInAdjustments || 0) -
      (session.cashOutAdjustments || 0)

    sessions[idx] = session
    saveSessions(sessions)
  },

  closeSession(
    sessionId: string,
    actualCash: number,
    closedBy: string,
    closingNotes?: string
  ): RegisterSession {
    const sessions = getStoredSessions()
    const idx = sessions.findIndex((s) => s.id === sessionId)
    if (idx === -1) throw new Error('Register session not found')

    const session = { ...sessions[idx] }
    const difference = actualCash - session.expectedCash

    session.status = 'CLOSED'
    session.closedAt = new Date().toISOString()
    session.closedBy = closedBy
    session.actualCash = actualCash
    session.difference = Math.round(difference * 100) / 100
    session.closingNotes = closingNotes

    sessions[idx] = session
    saveSessions(sessions)

    auditLogService.log({
      action: 'REGISTER_CLOSED',
      entityType: 'register',
      entityId: session.id,
      performedBy: closedBy,
      userRole: 'owner',
      details: `Closed cash drawer. Expected: ₹${session.expectedCash}, Actual Counted: ₹${actualCash}, Difference: ${difference >= 0 ? '+' : ''}₹${difference}.`,
      amount: actualCash,
      metadata: { expected: session.expectedCash, difference, closingNotes },
    })

    // Immediate action toast matching Requirement 4
    useToastStore.getState().addToast({
      title: 'Register closed successfully.',
      message: `Cash drawer reconciled with ${difference >= 0 ? '+' : ''}₹${difference} variance.`,
      type: 'success',
    })

    // Persistent notification matching Requirement 1
    useNotificationStore.getState().addNotification({
      type: 'SYSTEM',
      title: 'Cash Register Closed',
      message: `Daily register closed by ${closedBy}. Counted: ₹${actualCash.toLocaleString('en-IN')}.`,
      priority: 'medium',
      relatedId: session.id,
      targetRole: 'owner',
      actionUrl: '/reports/daily-closing',
    })

    return session
  },

  getTodaySession(): RegisterSession {
    return this.getCurrentSession()
  },
}
