import {
  SecuritySettings,
  SystemStatusItem,
  PrinterSettings,
  ActiveSession,
} from '@/types'
import { clientService } from './clientService'
import { appointmentService } from './appointmentService'
import { serviceService } from './serviceService'
import { staffService } from './staffService'
import { billingService } from './billingService'
import { paymentService } from './paymentService'
import { inventoryService } from './inventoryService'
import { expenseService } from './expenseService'
import { auditLogService } from './auditLogService'
import { exportToCSV, sanitizeCsvCell } from '@/utils/reportExportUtils'

const STORAGE_KEYS = {
  BUSINESS_PROFILE: 'SALORA_settings_business_profile',
  SECURITY: 'SALORA_settings_security',
  SYSTEM_STATUS: 'SALORA_settings_system_status',
}

export interface BusinessProfileSettings {
  salonName: string
  legalEntityName: string
  tagline: string
  phone: string
  email: string
  supportEmail: string
  website: string
  address: string
  city: string
  state: string
  pincode: string
  country: string
  currency: string
  currencySymbol: string
  timezone: string
  gstin: string
  pan: string
  businessRegNo: string
  financialYearStart: string // e.g. "04-01" (April 1st)
}

export const INITIAL_BUSINESS_PROFILE: BusinessProfileSettings = {
  salonName: 'Salora Salon & Luxury Spa',
  legalEntityName: 'Salora Aesthetics & Wellness Pvt. Ltd.',
  tagline: 'Modern High-Street Salon & Aesthetic Care Network',
  phone: '+91 291 264 5501',
  email: 'concierge@salora.in',
  supportEmail: 'care@salora.in',
  website: 'https://salora.in',
  address: '14, Residency Road, Sardarpura',
  city: 'Jodhpur',
  state: 'Rajasthan',
  pincode: '342003',
  country: 'India',
  currency: 'INR',
  currencySymbol: '₹',
  timezone: 'Asia/Kolkata',
  gstin: '08AABCG1234F1Z5',
  pan: 'AABCG1234F',
  businessRegNo: 'U74999RJ2024PTC081290',
  financialYearStart: '04-01',
}

export const INITIAL_SECURITY_SETTINGS: SecuritySettings = {
  sessionTimeoutMinutes: 60,
  minPasswordLength: 8,
  requireSpecialChars: true,
  requireNumbers: true,
  passwordExpiryDays: 90,
  maxFailedLogins: 5,
  lockoutDurationMinutes: 15,
  twoFactorEnforced: false,
  twoFactorMethod: 'authenticator',
  activeSessions: [
    {
      id: 'sess-1',
      device: 'MacBook Pro 16"',
      browser: 'Chrome 128',
      ipAddress: '192.168.1.10',
      location: 'Jodhpur, Rajasthan, India',
      lastActive: 'Active now',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      device: 'iPad Pro (Front Desk POS)',
      browser: 'Safari Mobile 17',
      ipAddress: '192.168.1.14',
      location: 'Jodhpur, Rajasthan, India',
      lastActive: '12 minutes ago',
      isCurrent: false,
    },
    {
      id: 'sess-3',
      device: 'Windows 11 Workstation',
      browser: 'Firefox 130',
      ipAddress: '192.168.2.45',
      location: 'Jaipur, Rajasthan, India',
      lastActive: '3 hours ago',
      isCurrent: false,
    },
  ],
}

export const INITIAL_SYSTEM_STATUS: SystemStatusItem[] = [
  {
    id: 'stat-db',
    component: 'Primary Database & Storage',
    category: 'database',
    status: 'ONLINE',
    latencyMs: 14,
    lastChecked: 'Just now',
    details: 'PostgreSQL Operational Cluster & Indexed Local State Storage operational with 99.98% uptime.',
  },
  {
    id: 'stat-notif',
    component: 'Cloud Notification Gateway',
    category: 'notifications',
    status: 'CONFIGURED',
    latencyMs: 42,
    lastChecked: '2 minutes ago',
    details: 'Transactional email engine, push notifications, and reminder schedulers active.',
  },
  {
    id: 'stat-print',
    component: 'ESC/POS Thermal Printing Spooler',
    category: 'printer',
    status: 'ONLINE',
    latencyMs: 5,
    lastChecked: '1 minute ago',
    details: 'Thermal 80mm & 58mm slip drivers responding; auto-cut commands verified.',
  },
  {
    id: 'stat-pay',
    component: 'Payment Gateway & UPI POS Terminal',
    category: 'payments',
    status: 'CONFIGURED',
    latencyMs: 88,
    lastChecked: '5 minutes ago',
    details: 'Integrated UPI dynamic QR, PineLabs POS terminal, and Razorpay webhook listener online.',
  },
  {
    id: 'stat-wa',
    component: 'WhatsApp Business API Gateway',
    category: 'messaging',
    status: 'ONLINE',
    latencyMs: 110,
    lastChecked: '3 minutes ago',
    details: 'Verified Meta Business Account: Auto-booking confirmations and digital bill slips delivering.',
  },
  {
    id: 'stat-storage',
    component: 'Document Storage Abstraction',
    category: 'storage',
    status: 'ONLINE',
    latencyMs: 22,
    lastChecked: 'Just now',
    details: 'Vendor invoice attachments, receipt PDFs, and rate contract store available.',
  },
]

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn(`Error reading localStorage key ${key}:`, err)
  }
  localStorage.setItem(key, JSON.stringify(defaultVal))
  return defaultVal
}

function saveStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.warn(`Error saving to localStorage key ${key}:`, err)
  }
}

class SettingsService {
  // ==========================================
  // 1. BUSINESS PROFILE
  // ==========================================

  public getBusinessProfile(): BusinessProfileSettings {
    return getStored<BusinessProfileSettings>(STORAGE_KEYS.BUSINESS_PROFILE, INITIAL_BUSINESS_PROFILE)
  }

  public updateBusinessProfile(updates: Partial<BusinessProfileSettings>): BusinessProfileSettings {
    const current = this.getBusinessProfile()
    const updated = { ...current, ...updates }
    saveStored(STORAGE_KEYS.BUSINESS_PROFILE, updated)
    auditLogService.log({
      action: 'EXPENSE_EDITED',
      module: 'Settings',
      entityType: 'settings',
      entityId: 'business_profile',
      performedBy: 'Ayaan (Owner)',
      userRole: 'owner',
      details: 'Updated salon business profile, contact credentials, and tax identifiers.',
    })
    return updated
  }

  // ==========================================
  // 2. SECURITY SETTINGS & SESSIONS
  // ==========================================

  public getSecuritySettings(): SecuritySettings {
    return getStored<SecuritySettings>(STORAGE_KEYS.SECURITY, INITIAL_SECURITY_SETTINGS)
  }

  public updateSecuritySettings(updates: Partial<SecuritySettings>): SecuritySettings {
    const current = this.getSecuritySettings()
    const updated = { ...current, ...updates }
    saveStored(STORAGE_KEYS.SECURITY, updated)
    auditLogService.log({
      action: 'LOGIN',
      module: 'Settings',
      entityType: 'security_policy',
      entityId: 'security_settings',
      performedBy: 'Ayaan (Owner)',
      userRole: 'owner',
      details: 'Updated salon security rules, password policy, and session timeout thresholds.',
    })
    return updated
  }

  public terminateSession(sessionId: string): SecuritySettings {
    const current = this.getSecuritySettings()
    const updatedSessions = current.activeSessions.filter((s) => s.id !== sessionId)
    return this.updateSecuritySettings({ activeSessions: updatedSessions })
  }

  public terminateAllOtherSessions(): SecuritySettings {
    const current = this.getSecuritySettings()
    const updatedSessions = current.activeSessions.filter((s) => s.isCurrent)
    auditLogService.log({
      action: 'LOGOUT',
      module: 'Auth',
      entityType: 'auth_session',
      entityId: 'all_sessions',
      performedBy: 'Ayaan (Owner)',
      userRole: 'owner',
      details: 'Terminated all remote user sessions across network terminals.',
    })
    return this.updateSecuritySettings({ activeSessions: updatedSessions })
  }

  // ==========================================
  // 3. SYSTEM STATUS TELEMETRY
  // ==========================================

  public getSystemStatus(): SystemStatusItem[] {
    return getStored<SystemStatusItem[]>(STORAGE_KEYS.SYSTEM_STATUS, INITIAL_SYSTEM_STATUS)
  }

  public refreshSystemStatus(): SystemStatusItem[] {
    const current = this.getSystemStatus()
    const refreshed = current.map((item) => ({
      ...item,
      latencyMs: Math.floor(10 + Math.random() * 40),
      lastChecked: 'Just now',
    }))
    saveStored(STORAGE_KEYS.SYSTEM_STATUS, refreshed)
    return refreshed
  }

  // ==========================================
  // 4. DATA EXPORT SERVICE
  // Generates clean CSV exports for all core salon modules.
  // ==========================================

  public exportModuleData(moduleKey: string): void {
    const timestamp = new Date().toISOString().split('T')[0]

    switch (moduleKey) {
      case 'clients': {
        const clients = clientService.getAllClients()
        const headers = ['ID', 'Full Name', 'Phone', 'Email', 'Gender', 'Total Visits', 'Total Spent', 'Status', 'Tags']
        const rows = clients.map((c: any) => [
          c.id,
          c.fullName,
          c.phone,
          c.email,
          c.gender || 'Not specified',
          c.totalVisits,
          c.totalSpent,
          c.status,
          (c.tags || []).join('; '),
        ])
        exportToCSV(`Salora_Clients_${timestamp}`, headers, rows)
        break
      }

      case 'appointments': {
        const appts = appointmentService.getAppointments()
        const headers = ['ID', 'Date', 'Start Time', 'Client', 'Phone', 'Service', 'Specialist', 'Branch', 'Status', 'Amount']
        const rows = appts.map((a) => [
          a.id,
          a.date,
          a.startTime,
          a.clientName,
          a.clientPhone || '',
          a.serviceName,
          a.staffName,
          a.branchName || 'Salora Jodhpur',
          a.status,
          a.totalAmount || a.price,
        ])
        exportToCSV(`Salora_Appointments_${timestamp}`, headers, rows)
        break
      }

      case 'services': {
        const services = serviceService.getAllSync()
        const headers = ['ID', 'Service Name', 'Category', 'Duration (min)', 'Price (INR)', 'Active', 'Gender']
        const rows = services.map((s) => [
          s.id,
          s.name,
          s.categoryName || s.categoryId || '',
          s.duration,
          s.price,
          s.isActive ? 'Yes' : 'No',
          (s as any).gender || 'All',
        ])
        exportToCSV(`Salora_Services_${timestamp}`, headers, rows)
        break
      }

      case 'staff': {
        const staffList = staffService.getAllStaff()
        const headers = ['ID', 'Name', 'Role', 'Email', 'Phone', 'Status', 'Commission %', 'Base Salary']
        const rows = staffList.map((st) => [
          st.id,
          st.name,
          st.role,
          st.email,
          st.phone,
          st.status,
          st.commissionRate || 0,
          (st as any).baseSalary || (st as any).salary || 0,
        ])
        exportToCSV(`Salora_Staff_${timestamp}`, headers, rows)
        break
      }

      case 'bills': {
        const bills = billingService.getAllBills()
        const headers = ['Invoice Number', 'Date', 'Client', 'Branch', 'Subtotal', 'Tax', 'Grand Total', 'Paid Amount', 'Status']
        const rows = bills.map((b) => [
          b.invoiceNumber,
          b.createdAt ? b.createdAt.split('T')[0] : '',
          b.clientName,
          b.branchName || 'Salora Salon',
          b.subtotal,
          (b as any).taxTotal || (b as any).taxAmount || (b as any).tax || 0,
          b.grandTotal,
          b.paidAmount,
          b.status,
        ])
        exportToCSV(`Salora_Invoices_${timestamp}`, headers, rows)
        break
      }

      case 'payments': {
        const payments = paymentService.getAll()
        const headers = ['Payment ID', 'Invoice Number', 'Date', 'Method', 'Amount', 'Status', 'Transaction Ref']
        const rows = payments.map((p) => [
          p.id,
          p.billId || 'INV-000',
          p.paidAt || (p as any).createdAt || new Date().toISOString(),
          p.method,
          p.amount,
          (p as any).status || 'SUCCESS',
          p.reference || 'CASH-TRX',
        ])
        exportToCSV(`Salora_Payments_${timestamp}`, headers, rows)
        break
      }

      case 'reports': {
        const reportBills = billingService.getAllBills()
        const reportExpenses = expenseService.getAllExpenses()
        const rev = reportBills.reduce((acc, b) => acc + (b.paidAmount || b.grandTotal || 0), 0)
        const exp = reportExpenses.reduce((acc, e) => acc + (e.amount || 0), 0)
        const headers = ['Metric Category', 'Aggregate Value (INR)', 'Record Count', 'Calculation Basis']
        const rows = [
          ['Gross Realized Revenue', rev, reportBills.length, 'Settled POS Billing Transactions'],
          ['Operating Expenses', exp, reportExpenses.length, 'Approved and Disbursed Operational Expenses'],
          ['Net Operating Result (EBITDA)', rev - exp, reportBills.length + reportExpenses.length, 'Gross Revenue less Total Operating Expenses'],
        ]
        exportToCSV(`Salora_Consolidated_Financial_Report_${timestamp}`, headers, rows)
        break
      }

      case 'inventory': {
        const products = inventoryService.getAllSync()
        const headers = ['SKU', 'Product Name', 'Category', 'Stock Quantity', 'Safety Min', 'Cost Price', 'Selling Price', 'Supplier']
        const rows = products.map((p) => [
          p.sku,
          p.name,
          p.category,
          p.currentStock,
          p.minimumStock,
          p.costPrice || p.purchasePrice,
          p.price || p.sellingPrice,
          p.supplierName || p.supplier || 'Direct',
        ])
        exportToCSV(`Salora_Inventory_${timestamp}`, headers, rows)
        break
      }

      case 'expenses': {
        const expenses = expenseService.getAllExpenses()
        const headers = ['ID', 'Expense Name', 'Category', 'Date', 'Amount', 'Payment Method', 'Supplier', 'Status']
        const rows = expenses.map((e) => [
          e.id,
          e.name,
          e.categoryName,
          e.date,
          e.amount,
          e.paymentMethod,
          e.supplierName || '—',
          e.status,
        ])
        exportToCSV(`Salora_Expenses_${timestamp}`, headers, rows)
        break
      }

      case 'audit': {
        const logs = auditLogService.getAll()
        const headers = ['Timestamp', 'Performed By', 'User Role', 'Action', 'Module', 'Entity ID', 'Branch', 'Result', 'Details']
        const rows = logs.map((l) => [
          l.timestamp,
          l.performedBy,
          l.userRole,
          l.action,
          l.module || l.entityType,
          l.entityId,
          l.branchName || 'Salora Jodhpur',
          l.result || 'SUCCESS',
          l.details,
        ])
        exportToCSV(`Salora_AuditLogs_${timestamp}`, headers, rows)
        break
      }

      default:
        console.warn(`Unknown export module ${moduleKey}`)
    }

    auditLogService.log({
      action: 'EXPENSE_EDITED',
      module: 'Settings',
      entityType: 'data_export',
      entityId: `export-${moduleKey}`,
      performedBy: 'Ayaan (Owner)',
      userRole: 'owner',
      details: `Generated and downloaded CSV data export for ${moduleKey.toUpperCase()} registry.`,
    })
  }
}

export const settingsService = new SettingsService()
