import { AuditLogEntry, AuditAction } from '@/types'

const AUDIT_STORAGE_KEY = 'SALORA_financial_audit_logs'

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
    action: 'REGISTER_OPENED',
    entityType: 'register',
    entityId: 'reg-session-today',
    performedBy: 'Ayaan (Owner)',
    userRole: 'owner',
    details: 'Opened daily cash drawer with initial float of ₹5,000.',
    amount: 5000,
  },
  {
    id: 'aud-002',
    timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
    action: 'PAYMENT_CREATED',
    entityType: 'payment',
    entityId: 'pay-101',
    performedBy: 'Camille Dupré',
    userRole: 'stylist',
    details: 'Captured UPI payment for Invoice #INV-000101.',
    amount: 1475,
    metadata: { method: 'upi', invoiceNumber: 'INV-000101' },
  },
  {
    id: 'aud-003',
    timestamp: new Date(Date.now() - 2.5 * 3600000).toISOString(),
    action: 'CASH_ADJUSTMENT',
    entityType: 'register',
    entityId: 'adj-01',
    performedBy: 'Ayaan',
    userRole: 'owner',
    details: 'Cash Out for organic salon refreshments and guest coffee.',
    amount: 350,
    metadata: { type: 'CASH_OUT', reason: 'Guest coffee & supplies' },
  },
]

function getStoredLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Could not read audit logs:', err)
  }
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS))
  return INITIAL_AUDIT_LOGS
}

function saveLogs(logs: AuditLogEntry[]): void {
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs.slice(0, 300)))
  } catch (err) {
    console.warn('Could not persist audit logs:', err)
  }
}

export const auditService = {
  getAll(): AuditLogEntry[] {
    return getStoredLogs()
  },

  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const logs = getStoredLogs()
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    }
    const updated = [newEntry, ...logs]
    saveLogs(updated)
    return newEntry
  },

  getByEntity(entityType: string, entityId: string): AuditLogEntry[] {
    const logs = getStoredLogs()
    return logs.filter((l) => l.entityType === entityType && l.entityId === entityId)
  },
}
