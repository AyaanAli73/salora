import { Branch, ConsolidatedBusinessSummary, CrossBranchComparisonMetric, Client } from '@/types'
import { billingService } from './billingService'
import { appointmentService } from './appointmentService'
import { clientService } from './clientService'
import { staffService } from './staffService'
import { expenseService } from './expenseService'
import { inventoryService } from './inventoryService'

const STORAGE_KEY = 'SALORA_salon_branches'

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'branch-jodhpur',
    name: 'Salora Jodhpur',
    code: 'GP-JDH',
    phone: '+91 291 264 5501',
    email: 'jodhpur@salora.in',
    address: '14, Residency Road, Sardarpura',
    city: 'Jodhpur',
    state: 'Rajasthan',
    pincode: '342003',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    status: 'ACTIVE',
    isHeadquarters: true,
    invoicePrefix: 'INV-JDH',
    managerName: 'Priya Rathore',
    managerPhone: '+91 98290 11223',
    staffCount: 8,
    openingHours: [
      { day: 'Monday', open: '09:00', close: '20:30', closed: false },
      { day: 'Tuesday', open: '09:00', close: '20:30', closed: false },
      { day: 'Wednesday', open: '09:00', close: '20:30', closed: false },
      { day: 'Thursday', open: '09:00', close: '20:30', closed: false },
      { day: 'Friday', open: '09:00', close: '21:00', closed: false },
      { day: 'Saturday', open: '09:00', close: '21:00', closed: false },
      { day: 'Sunday', open: '10:00', close: '18:00', closed: false },
    ],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    taxInfo: {
      gstin: '08AAACG1234F1Z1',
      taxRate: 18,
      taxRegistrationNumber: 'RJ-JOD-2024-88',
      pan: 'AAACG1234F',
    },
    bookingSettings: {
      allowOnlineBooking: true,
      slotDurationMinutes: 30,
      advanceBookingDays: 30,
      autoConfirm: true,
      bufferTimeMinutes: 15,
    },
    createdAt: '2024-03-01T08:00:00Z',
  },
  {
    id: 'branch-jaipur',
    name: 'Salora Jaipur',
    code: 'GP-JAI',
    phone: '+91 141 274 8820',
    email: 'jaipur@salora.in',
    address: 'B-28, Sahakar Marg, Lal Kothi',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302015',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    status: 'ACTIVE',
    isHeadquarters: false,
    invoicePrefix: 'INV-JAI',
    managerName: 'Amit Saxena',
    managerPhone: '+91 94140 22334',
    staffCount: 6,
    openingHours: [
      { day: 'Monday', open: '09:30', close: '20:30', closed: false },
      { day: 'Tuesday', open: '09:30', close: '20:30', closed: false },
      { day: 'Wednesday', open: '09:30', close: '20:30', closed: false },
      { day: 'Thursday', open: '09:30', close: '20:30', closed: false },
      { day: 'Friday', open: '09:30', close: '21:00', closed: false },
      { day: 'Saturday', open: '09:30', close: '21:00', closed: false },
      { day: 'Sunday', open: '10:00', close: '19:00', closed: false },
    ],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    taxInfo: {
      gstin: '08AAACG1234F2Z2',
      taxRate: 18,
      taxRegistrationNumber: 'RJ-JAI-2024-19',
      pan: 'AAACG1234F',
    },
    bookingSettings: {
      allowOnlineBooking: true,
      slotDurationMinutes: 30,
      advanceBookingDays: 30,
      autoConfirm: true,
      bufferTimeMinutes: 15,
    },
    createdAt: '2024-09-15T09:00:00Z',
  },
  {
    id: 'branch-bikaner',
    name: 'Salora Bikaner',
    code: 'GP-BIK',
    phone: '+91 151 220 1199',
    email: 'bikaner@salora.in',
    address: 'Plot 42, Rani Bazar Commercial Hub',
    city: 'Bikaner',
    state: 'Rajasthan',
    pincode: '334001',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    status: 'ACTIVE',
    isHeadquarters: false,
    invoicePrefix: 'INV-BIK',
    managerName: 'Deepak Purohit',
    managerPhone: '+91 98292 44556',
    staffCount: 5,
    openingHours: [
      { day: 'Monday', open: '10:00', close: '20:00', closed: false },
      { day: 'Tuesday', open: '10:00', close: '20:00', closed: false },
      { day: 'Wednesday', open: '10:00', close: '20:00', closed: false },
      { day: 'Thursday', open: '10:00', close: '20:00', closed: false },
      { day: 'Friday', open: '10:00', close: '20:00', closed: false },
      { day: 'Saturday', open: '10:00', close: '20:00', closed: false },
      { day: 'Sunday', open: '10:00', close: '17:00', closed: false },
    ],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    taxInfo: {
      gstin: '08AAACG1234F3Z3',
      taxRate: 18,
      taxRegistrationNumber: 'RJ-BIK-2025-05',
      pan: 'AAACG1234F',
    },
    bookingSettings: {
      allowOnlineBooking: true,
      slotDurationMinutes: 30,
      advanceBookingDays: 30,
      autoConfirm: true,
      bufferTimeMinutes: 15,
    },
    createdAt: '2025-02-10T10:00:00Z',
  },
  {
    id: 'branch-udaipur',
    name: 'Salora Udaipur',
    code: 'GP-UDR',
    phone: '+91 294 242 7700',
    email: 'udaipur@salora.in',
    address: 'Lake Palace Road, Near Gulab Bagh',
    city: 'Udaipur',
    state: 'Rajasthan',
    pincode: '313001',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    status: 'ACTIVE',
    isHeadquarters: false,
    invoicePrefix: 'INV-UDR',
    managerName: 'Sunita Chauhan',
    managerPhone: '+91 94142 66778',
    staffCount: 5,
    openingHours: [
      { day: 'Monday', open: '09:30', close: '20:00', closed: false },
      { day: 'Tuesday', open: '09:30', close: '20:00', closed: false },
      { day: 'Wednesday', open: '09:30', close: '20:00', closed: false },
      { day: 'Thursday', open: '09:30', close: '20:00', closed: false },
      { day: 'Friday', open: '09:30', close: '20:00', closed: false },
      { day: 'Saturday', open: '09:30', close: '20:00', closed: false },
      { day: 'Sunday', open: '10:00', close: '18:00', closed: false },
    ],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    taxInfo: {
      gstin: '08AAACG1234F4Z4',
      taxRate: 18,
      taxRegistrationNumber: 'RJ-UDR-2025-11',
      pan: 'AAACG1234F',
    },
    bookingSettings: {
      allowOnlineBooking: true,
      slotDurationMinutes: 30,
      advanceBookingDays: 30,
      autoConfirm: true,
      bufferTimeMinutes: 15,
    },
    createdAt: '2025-06-20T09:00:00Z',
  },
]

class BranchService {
  private branches: Branch[] = []

  constructor() {
    this.loadBranches()
  }

  private loadBranches(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.branches = parsed
            return
          }
        }
      } catch (err) {
        console.error('Failed to load branches from storage:', err)
      }
    }
    this.branches = [...INITIAL_BRANCHES]
    this.persist()
  }

  private persist(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.branches))
      } catch (err) {
        console.error('Failed to save branches:', err)
      }
    }
  }

  public getAllBranches(): Branch[] {
    return [...this.branches]
  }

  public getActiveBranches(): Branch[] {
    return this.branches.filter((b) => b.status === 'ACTIVE')
  }

  public getBranchById(id: string): Branch | undefined {
    return this.branches.find((b) => b.id === id)
  }

  public getDefaultBranch(): Branch {
    return (
      this.branches.find((b) => b.isHeadquarters) ||
      this.branches.find((b) => b.status === 'ACTIVE') ||
      INITIAL_BRANCHES[0]
    )
  }

  public createBranch(data: Omit<Branch, 'id' | 'createdAt'>): Branch {
    const newId = `branch-${data.code.toLowerCase().replace(/[^a-z0-9]/g, '') || Date.now()}`
    const newBranch: Branch = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.branches.push(newBranch)
    this.persist()
    return newBranch
  }

  public updateBranch(id: string, updates: Partial<Branch>): Branch | null {
    const idx = this.branches.findIndex((b) => b.id === id)
    if (idx === -1) return null

    this.branches[idx] = {
      ...this.branches[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.persist()
    return this.branches[idx]
  }

  public toggleBranchStatus(id: string): Branch | null {
    const branch = this.getBranchById(id)
    if (!branch) return null
    const nextStatus = branch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    return this.updateBranch(id, { status: nextStatus })
  }

  public deleteBranch(id: string): boolean {
    const initialLen = this.branches.length
    this.branches = this.branches.filter((b) => b.id !== id || b.isHeadquarters)
    if (this.branches.length !== initialLen) {
      this.persist()
      return true
    }
    return false
  }

  // ==========================================
  // CONSOLIDATED CROSS-BRANCH OWNER BUSINESS REPORT
  // ==========================================

  public getConsolidatedBusinessSummary(): ConsolidatedBusinessSummary {
    const allBills = billingService.getAllBills()
    const allAppts = appointmentService.getAppointments()
    const allClients = clientService.getAllClients()
    const allExpenses = expenseService.getAllExpenses()
    const allStaff = staffService.getAllStaff()
    const allProducts = inventoryService.getAllProducts()

    const activeBranches = this.getActiveBranches()

    const branchComparisons: CrossBranchComparisonMetric[] = activeBranches.map((branch, idx) => {
      // Deterministically attribute operational records across branches
      // Jodhpur (primary) gets first chunk, Jaipur second, Bikaner third, Udaipur fourth
      const branchBills = allBills.filter((b) => {
        if (b.branchId) return b.branchId === branch.id
        // Fallback distribution for existing unassigned demo bills
        const hash = (b.id.charCodeAt(b.id.length - 1) || 0) % activeBranches.length
        return hash === idx
      })

      const branchAppts = allAppts.filter((a) => {
        if (a.branchId) return a.branchId === branch.id
        const hash = (a.id.charCodeAt(a.id.length - 1) || 0) % activeBranches.length
        return hash === idx
      })

      const branchExpenses = allExpenses.filter((e) => {
        if (e.branchId) return e.branchId === branch.id
        const hash = (e.id.charCodeAt(e.id.length - 1) || 0) % activeBranches.length
        return hash === idx
      })

      const branchStaff = allStaff.filter((s) => {
        if (s.branchIds && s.branchIds.length > 0) return s.branchIds.includes(branch.id)
        if (idx === 0) return true // Jodhpur has full team
        const hash = (s.id.charCodeAt(s.id.length - 1) || 0) % activeBranches.length
        return hash === idx
      })

      const branchClients = allClients.filter((c: Client) => {
        if (c.primaryBranchId) return c.primaryBranchId === branch.id
        const hash = (c.id.charCodeAt(c.id.length - 1) || 0) % activeBranches.length
        return hash === idx
      })

      const revenue = branchBills.reduce((acc, b) => acc + (b.paidAmount || b.grandTotal || 0), 0)
      const expenses = branchExpenses.reduce((acc, e) => acc + (e.amount || 0), 0)
      const operatingResult = revenue - expenses

      const totalApptsCount = branchAppts.length
      const completedApptsCount = branchAppts.filter((a) => a.status === 'completed').length
      const completionRate =
        totalApptsCount > 0 ? Math.round((completedApptsCount / totalApptsCount) * 100) : 85

      const averageBillValue =
        branchBills.length > 0 ? Math.round(revenue / branchBills.length) : 1650

      // Calculate branch inventory stock value
      const inventoryStockValue = allProducts.reduce((sum, p) => {
        const branchQty =
          p.branchStock && p.branchStock[branch.id] !== undefined
            ? p.branchStock[branch.id]
            : Math.round((p.currentStock || 10) / (activeBranches.length || 1))
        return sum + branchQty * (p.purchasePrice || p.price || 500)
      }, 0)

      return {
        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.code,
        revenue: Math.round(revenue),
        appointments: totalApptsCount,
        completedAppointments: completedApptsCount,
        completionRate,
        clients: branchClients.length,
        expenses: Math.round(expenses),
        operatingResult: Math.round(operatingResult),
        staffCount: branchStaff.length,
        inventoryStockValue: Math.round(inventoryStockValue),
        averageBillValue,
      }
    })

    const totalRevenue = branchComparisons.reduce((acc, b) => acc + b.revenue, 0)
    const totalAppointments = branchComparisons.reduce((acc, b) => acc + b.appointments, 0)
    const totalClients = allClients.length
    const totalExpenses = branchComparisons.reduce((acc, b) => acc + b.expenses, 0)
    const totalStaff = allStaff.length
    const consolidatedOperatingResult = totalRevenue - totalExpenses
    const averageBillValue =
      allBills.length > 0 ? Math.round(totalRevenue / allBills.length) : 1850

    return {
      totalRevenue,
      totalAppointments,
      totalClients,
      totalExpenses,
      totalStaff,
      consolidatedOperatingResult,
      averageBillValue,
      branchComparisons,
    }
  }
}

export const branchService = new BranchService()
