import { AuditLogEntry, AuditAction } from '@/types'

const AUDIT_STORAGE_KEY = 'SALORA_operational_audit_logs'

export interface AuditFilterParams {
  user?: string
  module?: string
  action?: string
  branch?: string
  branchId?: string
  dateRange?: { start?: string; end?: string }
  startDate?: string
  endDate?: string
  search?: string
}

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: new Date(Date.now() - 7 * 3600000).toISOString(),
    action: 'LOGIN',
    module: 'Auth',
    entityType: 'auth',
    entity: 'auth_session',
    entityId: 'user-001',
    performedBy: 'Ayaan (Owner)',
    userRole: 'owner',
    branchId: 'branch-jodhpur',
    branchName: 'Salora Jodhpur',
    details: 'User authenticated successfully via Web Admin portal with multi-factor passkey.',
    ipAddress: '192.168.1.10 (Manager Workstation)',
    deviceInfo: 'Chrome 128 / Windows 11',
    result: 'SUCCESS',
  },
  {
    id: 'aud-002',
    timestamp: new Date(Date.now() - 6.5 * 3600000).toISOString(),
    action: 'REGISTER_OPENED',
    module: 'Billing',
    entityType: 'register',
    entity: 'cash_register',
    entityId: 'reg-session-today',
    performedBy: 'Ayaan (Owner)',
    userRole: 'owner',
    branchId: 'branch-jodhpur',
    branchName: 'Salora Jodhpur',
    details: 'Opened daily cash drawer with verified opening cash float of ₹5,000.',
    amount: 5000,
    beforeState: { status: 'CLOSED', openingCash: 0 },
    afterState: { status: 'OPEN', openingCash: 5000 },
    ipAddress: '192.168.1.14 (POS Terminal 1)',
    deviceInfo: 'Firefox 130 / POS Counter',
    result: 'SUCCESS',
  },
  {
    id: 'aud-003',
    timestamp: new Date(Date.now() - 5.5 * 3600000).toISOString(),
    action: 'TOKEN_GENERATED',
    module: 'Appointments',
    entityType: 'token',
    entity: 'queue_token',
    entityId: 'T001',
    performedBy: 'Reception Desk',
    userRole: 'receptionist',
    branchId: 'branch-jodhpur',
    branchName: 'Salora Jodhpur',
    details: 'Generated Token #001 for Priya Sharma (Hair Spa Ritual & Blowout).',
    afterState: { tokenNumber: '001', status: 'WAITING', service: 'Hair Spa Ritual' },
    ipAddress: '192.168.1.18 (Reception Tablet)',
    deviceInfo: 'Safari / iPad OS 17',
    result: 'SUCCESS',
  },
  {
    id: 'aud-004',
    timestamp: new Date(Date.now() - 4.5 * 3600000).toISOString(),
    action: 'APPOINTMENT_STATUS_CHANGE',
    module: 'Appointments',
    entityType: 'appointment',
    entity: 'appointment',
    entityId: 'appt-101',
    performedBy: 'Camille Dupré',
    userRole: 'stylist',
    branchId: 'branch-jodhpur',
    branchName: 'Salora Jodhpur',
    details: 'Appointment marked as COMPLETED for Priya Sharma.',
    beforeState: { status: 'in-progress' },
    afterState: { status: 'completed', completedAt: new Date(Date.now() - 4.5 * 3600000).toISOString() },
    ipAddress: '192.168.1.22 (Stylist Bay Tablet)',
    deviceInfo: 'Edge 128 / Android Tablet',
    result: 'SUCCESS',
  },
  {
    id: 'aud-005',
    timestamp: new Date(Date.now() - 3.8 * 3600000).toISOString(),
    action: 'BILL_CREATED',
    module: 'Billing',
    entityType: 'invoice',
    entity: 'bill_invoice',
    entityId: 'INV-JDH-2026-0042',
    performedBy: 'Ayaan (Owner)',
    userRole: 'owner',
    branchId: 'branch-jodhpur',
    branchName: 'Salora Jodhpur',
    details: 'Generated branch invoice INV-JDH-2026-0042 for ₹1,850 with 18% GST.',
    amount: 1850,
    afterState: { invoiceNumber: 'INV-JDH-2026-0042', total: 1850, tax: 282.2, paymentStatus: 'unpaid' },
    ipAddress: '192.168.1.14 (POS Terminal 1)',
    deviceInfo: 'Chrome 128 / Windows 11',
    result: 'SUCCESS',
  },
  {
    id: 'aud-006',
    timestamp: new Date(Date.now() - 3.7 * 3600000).toISOString(),
    action: 'PAYMENT_CREATED',
    module: 'Billing',
    entityType: 'payment',
    entity: 'payment_transaction',
    entityId: 'pay-101',
    performedBy: 'Ayaan (Owner)',
    userRole: 'owner',
    branchId: 'branch-jodhpur',
    branchName: 'Salora Jodhpur',
    details: 'Captured UPI electronic payment for Invoice #INV-JDH-2026-0042.',
    amount: 1850,
    beforeState: { paymentStatus: 'unpaid', paidAmount: 0 },
    afterState: { paymentStatus: 'paid', paidAmount: 1850, method: 'upi' },
    ipAddress: '192.168.1.14 (POS Terminal 1)',
    deviceInfo: 'Chrome 128 / Windows 11',
    result: 'SUCCESS',
  },
  {
    id: 'aud-007',
    timestamp: new Date(Date.now() - 2.5 * 3600000).toISOString(),
    action: 'INVENTORY_ADJUSTMENT',
    module: 'Inventory',
    entityType: 'goods_receipt',
    entity: 'stock_receipt',
    entityId: 'GRN-2026-0042',
    performedBy: 'Kavita Sen',
    userRole: 'manager',
    branchId: 'branch-jaipur',
    branchName: 'Salora Jaipur',
    details: 'Goods Receipt GRN-2026-0042: Received 15 units of Dermalogica Microfoliant into Jaipur stock.',
    beforeState: { branchStock: 2 },
    afterState: { branchStock: 17, receivedQuantity: 15 },
    ipAddress: '192.168.2.10 (Jaipur Store Counter)',
    deviceInfo: 'Chrome 128 / Windows 10',
    result: 'SUCCESS',
  },
  {
    id: 'aud-008',
    timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(),
    action: 'REFUND_CREATED',
    module: 'Billing',
    entityType: 'refund',
    entity: 'refund_voucher',
    entityId: 'ref-001',
    performedBy: 'Ayaan (Owner)',
    userRole: 'owner',
    branchId: 'branch-jodhpur',
    branchName: 'Salora Jodhpur',
    details: 'Processed UPI refund of ₹350 for damaged retail return.',
    amount: 350,
    beforeState: { status: 'paid', netTotal: 1850 },
    afterState: { status: 'partial_refunded', refundAmount: 350 },
    ipAddress: '192.168.1.10 (Manager Workstation)',
    deviceInfo: 'Chrome 128 / Windows 11',
    result: 'SUCCESS',
  },
  {
    id: 'aud-009',
    timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
    action: 'COMPENSATION_UPDATED',
    module: 'Payroll',
    entityType: 'staff_compensation',
    entity: 'compensation_plan',
    entityId: 'staff-1',
    performedBy: 'Ayaan (Owner)',
    userRole: 'owner',
    branchId: 'branch-jodhpur',
    branchName: 'Salora Jodhpur',
    details: 'Updated monthly compensation package for Senior Stylist Camille Dupré: Base ₹35,000 + 10% Service Commission.',
    beforeState: { baseSalary: 30000, commissionRate: 8 },
    afterState: { baseSalary: 35000, commissionRate: 10 },
    ipAddress: '192.168.1.10 (Manager Workstation)',
    deviceInfo: 'Chrome 128 / Windows 11',
    result: 'SUCCESS',
  },
  {
    id: 'aud-010',
    timestamp: new Date(Date.now() - 0.5 * 3600000).toISOString(),
    action: 'EXPENSE_APPROVED',
    module: 'Expenses',
    entityType: 'expense',
    entity: 'operating_expense',
    entityId: 'EXP-2026-042',
    performedBy: 'Ayaan (Owner)',
    userRole: 'owner',
    branchId: 'branch-jaipur',
    branchName: 'Salora Jaipur',
    details: 'Approved supplier disbursement of ₹25,000 to Dermalogica Skin Health Co. for PO #PO-2026-0042.',
    amount: 25000,
    beforeState: { approvalStatus: 'PENDING' },
    afterState: { approvalStatus: 'APPROVED', status: 'PAID' },
    ipAddress: '192.168.1.10 (Manager Workstation)',
    deviceInfo: 'Chrome 128 / Windows 11',
    result: 'SUCCESS',
  },
]

function getStoredLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Could not read operational audit logs:', err)
  }
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS))
  return INITIAL_AUDIT_LOGS
}

function saveLogs(logs: AuditLogEntry[]): void {
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs.slice(0, 1000)))
  } catch (err) {
    console.warn('Could not persist operational audit logs:', err)
  }
}

export const auditLogService = {
  getAll(): AuditLogEntry[] {
    return getStoredLogs()
  },

  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const logs = getStoredLogs()
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      result: entry.result || 'SUCCESS',
      ipAddress: entry.ipAddress || '192.168.1.10 (Salon Workstation)',
      deviceInfo: entry.deviceInfo || 'Chrome 128 / Windows 11',
    }
    const updated = [newEntry, ...logs]
    saveLogs(updated)
    return newEntry
  },

  getFiltered(params: AuditFilterParams = {}): AuditLogEntry[] {
    let logs = this.getAll()

    if (params.user && params.user !== 'ALL') {
      const u = params.user.toLowerCase()
      logs = logs.filter((l) => l.performedBy.toLowerCase().includes(u) || l.userRole.toLowerCase() === u)
    }

    if (params.module && params.module !== 'ALL') {
      logs = logs.filter((l) => l.module === params.module)
    }

    if (params.action && params.action !== 'ALL') {
      logs = logs.filter((l) => l.action === params.action)
    }

    if ((params.branchId && params.branchId !== 'all') || (params.branch && params.branch !== 'all')) {
      const b = (params.branchId || params.branch)!.toLowerCase()
      logs = logs.filter(
        (l) =>
          (l.branchId && l.branchId.toLowerCase() === b) ||
          (l.branchName && l.branchName.toLowerCase().includes(b))
      )
    }

    if (params.startDate) {
      logs = logs.filter((l) => l.timestamp >= params.startDate!)
    }

    if (params.endDate) {
      logs = logs.filter((l) => l.timestamp <= params.endDate!)
    }

    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim()
      logs = logs.filter(
        (l) =>
          l.entityId.toLowerCase().includes(q) ||
          l.performedBy.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          (l.module && l.module.toLowerCase().includes(q))
      )
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  },

  getByEntity(entityType: string, entityId?: string): AuditLogEntry[] {
    const logs = getStoredLogs()
    return logs.filter((l) => {
      if (entityId) {
        return l.entityType === entityType && l.entityId === entityId
      }
      return l.entityType === entityType
    })
  },

  getByAction(action: AuditAction): AuditLogEntry[] {
    const logs = getStoredLogs()
    return logs.filter((l) => l.action === action)
  },

  getUniqueUsers(): string[] {
    const logs = this.getAll()
    return Array.from(new Set(logs.map((l) => l.performedBy))).filter(Boolean)
  },

  getUniqueModules(): string[] {
    const logs = this.getAll()
    return Array.from(new Set(logs.map((l) => l.module || l.entityType || 'General'))).filter(Boolean)
  },

  getUniqueActions(): string[] {
    const logs = this.getAll()
    return Array.from(new Set(logs.map((l) => l.action))).filter(Boolean)
  },
}
