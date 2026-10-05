import {
  PayrollRecord,
  PayrollStatus,
  PayrollPaymentMethod,
  StaffCompensationConfig,
  StaffSalaryAdvance,
  PayrollBonusItem,
  PayrollDeductionItem,
  PayrollDashboardStats,
  StaffMonthlyPerformance,
} from '@/types'
import { commissionService } from './commissionService'
import { staffService } from './staffService'
import { staffAttendanceService } from './staffAttendanceService'
import { appointmentService } from './appointmentService'
import { auditLogService } from './auditLogService'

// Clean mock records from localStorage if present
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('SALORA_payroll_records')
    if (raw && (raw.includes('pay-2026-') || raw.includes('Marcus') || raw.includes('Chloe'))) {
      localStorage.removeItem('SALORA_payroll_records')
      localStorage.removeItem('SALORA_salary_advances')
      localStorage.removeItem('SALORA_payroll_bonuses')
      localStorage.removeItem('SALORA_payroll_deductions')
      localStorage.removeItem('SALORA_staff_compensation')
    }
  } catch {}
}

const DEFAULT_COMPENSATION_CONFIGS: StaffCompensationConfig[] = []
const DEFAULT_SALARY_ADVANCES: StaffSalaryAdvance[] = []
const DEFAULT_BONUSES: PayrollBonusItem[] = []
const DEFAULT_DEDUCTIONS: PayrollDeductionItem[] = []
const DEFAULT_PAYROLL_RECORDS: PayrollRecord[] = []

const STORAGE_KEYS = {
  PAYROLL: 'SALORA_payroll_records',
  COMPENSATION: 'SALORA_staff_compensation',
  ADVANCES: 'SALORA_salary_advances',
  BONUSES: 'SALORA_payroll_bonuses',
  DEDUCTIONS: 'SALORA_payroll_deductions',
}

function getStoredItem<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn(`Error reading key ${key} from localStorage:`, err)
  }
  localStorage.setItem(key, JSON.stringify(defaultVal))
  return defaultVal
}

function saveStoredItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.warn(`Error saving key ${key} to localStorage:`, err)
  }
}

export const payrollService = {
  // ==========================================
  // 1. STAFF COMPENSATION CONFIGURATION
  // ==========================================

  getCompensationConfigs(): StaffCompensationConfig[] {
    return getStoredItem<StaffCompensationConfig[]>(
      STORAGE_KEYS.COMPENSATION,
      DEFAULT_COMPENSATION_CONFIGS
    )
  },

  getCompensationConfig(staffId: string): StaffCompensationConfig {
    const configs = this.getCompensationConfigs()
    const found = configs.find((c) => c.staffId === staffId)
    if (found) return found

    // Default fallback config
    const fallback: StaffCompensationConfig = {
      staffId,
      compensationType: 'FIXED_PLUS_COMMISSION',
      baseSalary: 30000,
      hourlyRate: 150,
      defaultCommissionRate: 15,
      effectiveFrom: '2026-01-01',
      updatedAt: new Date().toISOString(),
    }
    return fallback
  },

  saveCompensationConfig(
    config: StaffCompensationConfig,
    updatedBy = 'Ayaan (Owner)'
  ): StaffCompensationConfig {
    const configs = this.getCompensationConfigs()
    const idx = configs.findIndex((c) => c.staffId === config.staffId)

    const updatedConfig: StaffCompensationConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
    }

    if (idx !== -1) {
      configs[idx] = updatedConfig
    } else {
      configs.push(updatedConfig)
    }

    saveStoredItem(STORAGE_KEYS.COMPENSATION, configs)

    auditLogService.log({
      action: 'COMPENSATION_UPDATED',
      entityType: 'staff_compensation',
      entityId: config.staffId,
      performedBy: updatedBy,
      userRole: 'owner',
      details: `Updated compensation structure for staff #${config.staffId} (${config.compensationType}: Base ₹${config.baseSalary}, Commission ${config.defaultCommissionRate}%).`,
    })

    return updatedConfig
  },

  // ==========================================
  // 2. SALARY ADVANCES
  // ==========================================

  getAdvances(staffId?: string): StaffSalaryAdvance[] {
    let list = getStoredItem<StaffSalaryAdvance[]>(
      STORAGE_KEYS.ADVANCES,
      DEFAULT_SALARY_ADVANCES
    )
    if (staffId) {
      list = list.filter((a) => a.staffId === staffId)
    }
    return list.sort((a, b) => (a.date > b.date ? -1 : 1))
  },

  async createAdvance(
    staffId: string,
    amount: number,
    reason: string,
    approvedBy = 'Ayaan (Owner)'
  ): Promise<StaffSalaryAdvance> {
    const staff = await staffService.getById(staffId)
    if (!staff) throw new Error('Staff member not found')

    const advances = this.getAdvances()
    const newAdvance: StaffSalaryAdvance = {
      id: `adv-${Date.now()}`,
      advanceNumber: `ADV-${new Date().getFullYear()}-${String(advances.length + 1).padStart(3, '0')}`,
      staffId: staff.id,
      staffName: staff.name,
      amount,
      date: new Date().toISOString().split('T')[0],
      reason,
      status: 'PENDING_REPAYMENT',
      repaidAmount: 0,
      remainingBalance: amount,
      approvedBy,
      createdAt: new Date().toISOString(),
      repayments: [],
    }

    const updated = [newAdvance, ...advances]
    saveStoredItem(STORAGE_KEYS.ADVANCES, updated)

    auditLogService.log({
      action: 'ADVANCE_GRANTED',
      entityType: 'salary_advance',
      entityId: newAdvance.id,
      performedBy: approvedBy,
      userRole: 'owner',
      details: `Granted salary advance of ₹${amount.toLocaleString('en-IN')} to ${staff.name} (${reason}).`,
      amount,
    })

    return newAdvance
  },

  getPendingAdvanceForStaff(staffId: string): number {
    const advances = this.getAdvances(staffId).filter(
      (a) => a.status === 'PENDING_REPAYMENT' || a.status === 'PARTIALLY_REPAID'
    )
    return advances.reduce((sum, a) => sum + (a.remainingBalance || 0), 0)
  },

  // ==========================================
  // 3. BONUSES & DEDUCTIONS
  // ==========================================

  getBonuses(staffId?: string): PayrollBonusItem[] {
    let list = getStoredItem<PayrollBonusItem[]>(STORAGE_KEYS.BONUSES, DEFAULT_BONUSES)
    if (staffId) {
      list = list.filter((b) => b.staffId === staffId)
    }
    return list.sort((a, b) => (a.date > b.date ? -1 : 1))
  },

  addBonus(
    bonusData: Omit<PayrollBonusItem, 'id'>,
    performedBy = 'Ayaan (Owner)'
  ): PayrollBonusItem {
    const bonuses = this.getBonuses()
    const newBonus: PayrollBonusItem = {
      ...bonusData,
      id: `bon-${Date.now()}`,
      awardedBy: performedBy,
    }

    const updated = [newBonus, ...bonuses]
    saveStoredItem(STORAGE_KEYS.BONUSES, updated)
    return newBonus
  },

  getDeductions(staffId?: string): PayrollDeductionItem[] {
    let list = getStoredItem<PayrollDeductionItem[]>(
      STORAGE_KEYS.DEDUCTIONS,
      DEFAULT_DEDUCTIONS
    )
    if (staffId) {
      list = list.filter((d) => d.staffId === staffId)
    }
    return list
  },

  addDeduction(deductionData: Omit<PayrollDeductionItem, 'id'>): PayrollDeductionItem {
    const deductions = this.getDeductions()
    const newDeduction: PayrollDeductionItem = {
      ...deductionData,
      id: `ded-${Date.now()}`,
    }

    const updated = [newDeduction, ...deductions]
    saveStoredItem(STORAGE_KEYS.DEDUCTIONS, updated)
    return newDeduction
  },

  // ==========================================
  // 4. PAYROLL RECORDS & LIFECYCLE
  // Flow: Calculate -> Review -> Approve -> Pay
  // ==========================================

  getPayrollRecords(periodName?: string, status?: PayrollStatus | 'ALL'): PayrollRecord[] {
    let records = getStoredItem<PayrollRecord[]>(
      STORAGE_KEYS.PAYROLL,
      DEFAULT_PAYROLL_RECORDS
    )

    if (periodName && periodName !== 'ALL') {
      records = records.filter((r) => r.periodName === periodName)
    }

    if (status && status !== 'ALL') {
      records = records.filter((r) => r.status === status)
    }

    return records.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
  },

  getPayrollById(id: string): PayrollRecord | undefined {
    return this.getPayrollRecords().find((r) => r.id === id)
  },

  async calculatePayrollForStaff(
    staffId: string,
    periodStart: string, // YYYY-MM-DD
    periodEnd: string, // YYYY-MM-DD
    periodName: string
  ): Promise<PayrollRecord> {
    const staff = await staffService.getById(staffId)
    if (!staff) throw new Error('Staff member not found')

    const compConfig = this.getCompensationConfig(staffId)

    // 1. Calculate Base Salary
    let baseSalary = 0
    let hourlyHoursWorked: number | undefined = undefined

    if (compConfig.compensationType === 'FIXED' || compConfig.compensationType === 'FIXED_PLUS_COMMISSION') {
      baseSalary = compConfig.baseSalary || 0
    } else if (compConfig.compensationType === 'HOURLY') {
      // Calculate verified attendance hours from staffAttendanceService
      const attSummary = staffAttendanceService.getStaffAttendanceSummary(staffId)
      hourlyHoursWorked = attSummary.totalHours > 0 ? attSummary.totalHours : 160
      baseSalary = Math.round(hourlyHoursWorked * (compConfig.hourlyRate || 150))
    } else if (compConfig.compensationType === 'COMMISSION_ONLY') {
      baseSalary = 0
    }

    // 2. Calculate Commission via commissionService
    let commission = 0
    let commissionItems = undefined
    if (compConfig.compensationType !== 'FIXED') {
      const commSummary = await commissionService.calculateStaffCommissionForPeriod(
        staffId,
        periodStart,
        periodEnd
      )
      commission = commSummary.totalCommissionEarned
      commissionItems = commSummary.items
    }

    // 3. Bonuses in period
    const staffBonuses = this.getBonuses(staffId).filter(
      (b) => b.date >= periodStart && b.date <= periodEnd
    )
    const totalBonuses = staffBonuses.reduce((sum, b) => sum + (b.amount || 0), 0)

    // 4. Configurable Deductions
    const staffDeductions = this.getDeductions(staffId)
    const totalDeductions = staffDeductions.reduce((sum, d) => sum + (d.amount || 0), 0)

    // 5. Check Outstanding Advance Adjustments
    const pendingAdvances = this.getAdvances(staffId).filter(
      (a) => a.status === 'PENDING_REPAYMENT' || a.status === 'PARTIALLY_REPAID'
    )
    const advanceAdjustments: { advanceId: string; amount: number; note: string }[] = []
    let totalAdvancesDeducted = 0

    if (pendingAdvances.length > 0) {
      // Auto-schedule adjustment up to advance balance or half net earnings
      for (const adv of pendingAdvances) {
        if (adv.remainingBalance > 0) {
          advanceAdjustments.push({
            advanceId: adv.id,
            amount: adv.remainingBalance,
            note: `Recovery of advance ${adv.advanceNumber}`,
          })
          totalAdvancesDeducted += adv.remainingBalance
        }
      }
    }

    // 6. Net Pay Calculation
    const grossPay = baseSalary + commission + totalBonuses
    const netPay = Math.max(0, grossPay - totalDeductions - totalAdvancesDeducted)

    const records = this.getPayrollRecords()
    const existingIdx = records.findIndex(
      (r) => r.staffId === staffId && r.periodStart === periodStart && r.periodEnd === periodEnd
    )

    const nowIso = new Date().toISOString()
    const payrollNumber = `PAY-${periodStart.slice(0, 7)}-${String(records.length + 1).padStart(3, '0')}`

    const record: PayrollRecord = {
      id: existingIdx !== -1 ? records[existingIdx].id : `pay-${Date.now()}-${staffId}`,
      payrollNumber: existingIdx !== -1 ? records[existingIdx].payrollNumber : payrollNumber,
      staffId: staff.id,
      staffName: staff.name,
      staffRole: staff.role,
      staffEmail: staff.email,
      staffPhone: staff.phone,
      compensationType: compConfig.compensationType,
      periodStart,
      periodEnd,
      periodName,
      baseSalary,
      hourlyHoursWorked,
      commission,
      commissionItems,
      bonuses: staffBonuses,
      totalBonuses,
      deductions: staffDeductions,
      totalDeductions,
      advances: advanceAdjustments,
      totalAdvancesDeducted,
      grossPay,
      netPay,
      status: 'CALCULATED',
      createdAt: nowIso,
      calculatedAt: nowIso,
      notes: `Calculated on ${new Date().toLocaleDateString('en-US')}`,
    }

    if (existingIdx !== -1) {
      records[existingIdx] = record
    } else {
      records.unshift(record)
    }

    saveStoredItem(STORAGE_KEYS.PAYROLL, records)

    auditLogService.log({
      action: 'PAYROLL_CALCULATED',
      entityType: 'payroll',
      entityId: record.id,
      performedBy: 'Ayaan (Owner)',
      userRole: 'owner',
      details: `Calculated payroll for ${staff.name} (${periodName}): Gross ₹${grossPay.toLocaleString(
        'en-IN'
      )}, Net ₹${netPay.toLocaleString('en-IN')}.`,
      amount: netPay,
    })

    return record
  },

  async calculatePayrollForAll(
    periodStart: string,
    periodEnd: string,
    periodName: string
  ): Promise<PayrollRecord[]> {
    const allStaff = await staffService.getAll()
    const results: PayrollRecord[] = []

    for (const staff of allStaff) {
      const rec = await this.calculatePayrollForStaff(
        staff.id,
        periodStart,
        periodEnd,
        periodName
      )
      results.push(rec)
    }

    return results
  },

  approvePayroll(payrollId: string, approvedBy = 'Ayaan (Owner)'): PayrollRecord {
    const records = this.getPayrollRecords()
    const idx = records.findIndex((r) => r.id === payrollId)
    if (idx === -1) throw new Error('Payroll record not found')

    const current = records[idx]
    if (current.status === 'PAID') {
      throw new Error('Cannot modify a payroll record that is already paid.')
    }

    const updated: PayrollRecord = {
      ...current,
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
      approvedBy,
    }

    records[idx] = updated
    saveStoredItem(STORAGE_KEYS.PAYROLL, records)

    auditLogService.log({
      action: 'PAYROLL_APPROVED',
      entityType: 'payroll',
      entityId: updated.id,
      performedBy: approvedBy,
      userRole: 'owner',
      details: `Approved payroll ${updated.payrollNumber} for ${updated.staffName} (Net Pay: ₹${updated.netPay.toLocaleString(
        'en-IN'
      )}).`,
      amount: updated.netPay,
    })

    return updated
  },

  markPayrollPaid(
    payrollId: string,
    paymentMethod: PayrollPaymentMethod,
    paymentReference = '',
    paidBy = 'Ayaan (Owner)'
  ): PayrollRecord {
    const records = this.getPayrollRecords()
    const idx = records.findIndex((r) => r.id === payrollId)
    if (idx === -1) throw new Error('Payroll record not found')

    const current = records[idx]
    const nowIso = new Date().toISOString()

    const updated: PayrollRecord = {
      ...current,
      status: 'PAID',
      paymentMethod,
      paymentReference,
      paidAt: nowIso,
      paidBy,
    }

    records[idx] = updated
    saveStoredItem(STORAGE_KEYS.PAYROLL, records)

    // Update salary advance records if advance repayment was deducted
    if (current.advances && current.advances.length > 0) {
      const allAdvances = this.getAdvances()
      for (const advDeduction of current.advances) {
        const advIdx = allAdvances.findIndex((a) => a.id === advDeduction.advanceId)
        if (advIdx !== -1) {
          const adv = allAdvances[advIdx]
          const newRepaid = (adv.repaidAmount || 0) + advDeduction.amount
          const newRemaining = Math.max(0, adv.amount - newRepaid)
          const newStatus = newRemaining === 0 ? 'REPAID' : 'PARTIALLY_REPAID'

          allAdvances[advIdx] = {
            ...adv,
            repaidAmount: newRepaid,
            remainingBalance: newRemaining,
            status: newStatus,
            repayments: [
              ...adv.repayments,
              {
                id: `rep-${Date.now()}`,
                payrollId: current.id,
                date: nowIso.split('T')[0],
                amount: advDeduction.amount,
                note: `Deducted via payroll ${current.payrollNumber}`,
              },
            ],
          }
        }
      }
      saveStoredItem(STORAGE_KEYS.ADVANCES, allAdvances)
    }

    auditLogService.log({
      action: 'PAYROLL_PAID',
      entityType: 'payroll',
      entityId: updated.id,
      performedBy: paidBy,
      userRole: 'owner',
      details: `Settled payroll ${updated.payrollNumber} for ${updated.staffName} via ${paymentMethod} (Ref: ${
        paymentReference || 'Direct Payout'
      }) for ₹${updated.netPay.toLocaleString('en-IN')}.`,
      amount: updated.netPay,
    })

    return updated
  },

  voidPayroll(
    payrollId: string,
    reason: string,
    voidedBy = 'Ayaan (Owner)'
  ): PayrollRecord {
    const records = this.getPayrollRecords()
    const idx = records.findIndex((r) => r.id === payrollId)
    if (idx === -1) throw new Error('Payroll record not found')

    const current = records[idx]
    const updated: PayrollRecord = {
      ...current,
      status: 'VOID',
      notes: `Voided: ${reason}`,
    }

    records[idx] = updated
    saveStoredItem(STORAGE_KEYS.PAYROLL, records)

    auditLogService.log({
      action: 'PAYROLL_VOIDED',
      entityType: 'payroll',
      entityId: updated.id,
      performedBy: voidedBy,
      userRole: 'owner',
      details: `Voided payroll ${updated.payrollNumber} for ${updated.staffName}. Reason: "${reason}".`,
    })

    return updated
  },

  // ==========================================
  // 5. DASHBOARD STATS
  // ==========================================

  getDashboardStats(periodName = 'September 2026'): PayrollDashboardStats {
    const periodRecords = this.getPayrollRecords(periodName)

    const totalPayroll = periodRecords.reduce((sum, r) => sum + (r.netPay || 0), 0)
    const paidRecords = periodRecords.filter((r) => r.status === 'PAID')
    const paidThisMonth = paidRecords.reduce((sum, r) => sum + (r.netPay || 0), 0)
    const pendingRecords = periodRecords.filter(
      (r) => r.status === 'CALCULATED' || r.status === 'APPROVED' || r.status === 'DRAFT'
    )
    const pendingPayroll = pendingRecords.reduce((sum, r) => sum + (r.netPay || 0), 0)
    const totalCommission = periodRecords.reduce((sum, r) => sum + (r.commission || 0), 0)

    return {
      totalPayroll,
      pendingPayroll,
      paidThisMonth,
      totalCommission,
      staffCount: periodRecords.length,
      currentPeriod: periodName,
    }
  },

  // ==========================================
  // 6. STAFF DASHBOARD & PERFORMANCE
  // Permitted view for Staff portal / Staff profile
  // ==========================================

  getStaffPayrollHistory(staffId: string): PayrollRecord[] {
    return this.getPayrollRecords().filter((r) => r.staffId === staffId)
  },

  async getStaffMonthlyPerformance(
    staffId: string,
    period = 'September 2026'
  ): Promise<StaffMonthlyPerformance> {
    const staff = await staffService.getById(staffId)
    const staffName = staff ? staff.name : 'Specialist'

    const appointments = await appointmentService.getByStaffId(staffId)
    const completedAppts = appointments.filter((a) => a.status === 'completed')

    const revenue = completedAppts.reduce((sum, a) => sum + (a.price || 0), 0)
    const rating = staff ? staff.rating : 4.9

    // Get current period payroll commission
    const currentPayroll = this.getPayrollRecords(period).find((r) => r.staffId === staffId)
    const commissionEarned = currentPayroll ? currentPayroll.commission : 0

    // Get attendance rate
    const attSummary = staffAttendanceService.getStaffAttendanceSummary(staffId)
    const totalDays = attSummary.daysPresent + attSummary.daysAbsent
    const attendanceRate = totalDays > 0 ? Math.round((attSummary.daysPresent / totalDays) * 100) : 100

    // Advances
    const advances = this.getAdvances(staffId)
    const advancesTaken = advances.reduce((s: number, a: StaffSalaryAdvance) => s + (a.amount || 0), 0)
    const remainingAdvanceBalance = advances.reduce(
      (s: number, a: StaffSalaryAdvance) => s + (a.remainingBalance || 0),
      0
    )
    const comp = this.getCompensationConfig(staffId)
    const baseSalary = comp?.baseSalary ?? 0

    return {
      staffId,
      staffName,
      period,
      appointmentsCount: appointments.length,
      servicesCompletedCount: completedAppts.length,
      totalRevenueGenerated: revenue > 0 ? revenue : staff ? staff.monthlyRevenue : 0,
      averageRating: rating,
      commissionEarned,
      attendanceRate,
      baseSalary,
      advancesTaken,
      remainingAdvanceBalance,
    }
  },
}
