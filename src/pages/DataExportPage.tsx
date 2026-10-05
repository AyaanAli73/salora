import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Download,
  Users,
  CalendarCheck2,
  Scissors,
  UserCheck,
  Receipt,
  CreditCard,
  Package,
  TrendingDown,
  BarChart3,
  ShieldAlert,
  ChevronLeft,
  FileSpreadsheet,
  CheckCircle2,
  HardDriveDownload,
  Info,
} from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useToastStore } from '@/store/useToastStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { clientService } from '@/services/clientService'
import { appointmentService } from '@/services/appointmentService'
import { serviceService } from '@/services/serviceService'
import { staffService } from '@/services/staffService'
import { billingService } from '@/services/billingService'
import { paymentService } from '@/services/paymentService'
import { inventoryService } from '@/services/inventoryService'
import { expenseService } from '@/services/expenseService'
import { auditLogService } from '@/services/auditLogService'
import { useAuthStore } from '@/store/useAuthStore'
import { canExportData } from '@/utils/permissions'

interface ExportModuleDef {
  key: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  getCount: () => number
  unit: string
}

export const DataExportPage: React.FC = () => {
  const { user } = useAuthStore()
  const { exportModule } = useSettingsStore()
  const { addToast } = useToastStore()
  const [exportingKey, setExportingKey] = useState<string | null>(null)

  if (!canExportData(user?.role || 'staff')) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 space-y-3 max-w-md mx-auto my-12">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Access Restricted</h2>
        <p className="text-xs text-gray-500">
          Database CSV export is restricted to Salon Owners and Administrators to preserve client privacy and business security.
        </p>
      </div>
    )
  }

  const modules: ExportModuleDef[] = [
    {
      key: 'clients',
      title: 'Clients Directory',
      description: 'Client profiles, phone numbers, email, total visits, total spend, and CRM tags.',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      getCount: () => clientService.getAllClients().length,
      unit: 'clients',
    },
    {
      key: 'appointments',
      title: 'Appointments Register',
      description: 'Historical and upcoming bookings, assigned specialists, service dates, and statuses.',
      icon: CalendarCheck2,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      getCount: () => appointmentService.getAppointments().length,
      unit: 'appointments',
    },
    {
      key: 'services',
      title: 'Services Catalogue',
      description: 'Master service list, categories, treatment durations, base pricing, and gender targeting.',
      icon: Scissors,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      getCount: () => serviceService.getAllSync().length,
      unit: 'services',
    },
    {
      key: 'staff',
      title: 'Staff & Team Roster',
      description: 'Team members, assigned roles, contact details, base compensation, and commission rates.',
      icon: UserCheck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      getCount: () => staffService.getAllStaff().length,
      unit: 'members',
    },
    {
      key: 'bills',
      title: 'Billing & Invoices',
      description: 'POS sales invoices, itemized tax records, gross bill values, and payment statuses.',
      icon: Receipt,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      getCount: () => billingService.getAllBills().length,
      unit: 'invoices',
    },
    {
      key: 'payments',
      title: 'Payments & Transactions',
      description: 'Payment settlement ledger, payment methods (Cash, Card, UPI), and transaction IDs.',
      icon: CreditCard,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      getCount: () => paymentService.getAll().length,
      unit: 'payments',
    },
    {
      key: 'inventory',
      title: 'Inventory & Products',
      description: 'Current stock levels, safety thresholds, cost prices, retail selling rates, and suppliers.',
      icon: Package,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      getCount: () => inventoryService.getAllSync().length,
      unit: 'products',
    },
    {
      key: 'expenses',
      title: 'Expense Ledger',
      description: 'Operational expenses, vendor payments, expense categories, and manager approval states.',
      icon: TrendingDown,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      getCount: () => expenseService.getAllExpenses().length,
      unit: 'records',
    },
    {
      key: 'reports',
      title: 'Financial Reports Summary',
      description: 'Aggregated revenue totals, operational expense summaries, and EBITDA benchmarks.',
      icon: BarChart3,
      color: 'text-fuchsia-600',
      bgColor: 'bg-fuchsia-50',
      getCount: () => 3,
      unit: 'summaries',
    },
    {
      key: 'audit',
      title: 'Security & Audit Trail',
      description: 'Immutable record of staff logins, billing cancellations, price edits, and role changes.',
      icon: ShieldAlert,
      color: 'text-slate-700',
      bgColor: 'bg-slate-100',
      getCount: () => auditLogService.getAll().length,
      unit: 'log events',
    },
  ]

  const handleExport = (moduleKey: string, title: string) => {
    setExportingKey(moduleKey)
    try {
      exportModule(moduleKey)
      addToast({
        title: 'Export Complete',
        message: `${title} exported successfully as CSV.`,
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Export Failed',
        message: 'An error occurred while compiling the CSV dataset.',
        type: 'danger',
      })
    } finally {
      setTimeout(() => setExportingKey(null), 600)
    }
  }

  const handleExportAll = () => {
    modules.forEach((mod, idx) => {
      setTimeout(() => {
        exportModule(mod.key)
      }, idx * 400)
    })
    addToast({
      title: 'Bulk Export Triggered',
      message: 'Generating CSV exports for all system modules sequentially.',
      type: 'info',
    })
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link to="/settings" className="hover:text-primary transition-colors flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              Settings
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Data Export</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-primary" />
            System Data Export Center
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Download your salon business records in standard CSV format compatible with Microsoft Excel, Apple Numbers, and Google Sheets.
          </p>
        </div>

        <div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportAll}
            className="shadow-sm"
          >
            <HardDriveDownload className="w-4 h-4 mr-1.5" />
            Export Complete Archive (All CSVs)
          </Button>
        </div>
      </div>

      {/* Info notice */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-800">Export Encoding & Security Standards:</span>
          <p className="leading-relaxed">
            All files are generated with UTF-8 byte order mark (BOM) for seamless rendering of special characters, currency symbols (₹), and regional numerals. All data extraction events are cryptographically referenced in the system audit log.
          </p>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod) => {
          const Icon = mod.icon
          const count = mod.getCount()
          const isExporting = exportingKey === mod.key

          return (
            <div
              key={mod.key}
              className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${mod.bgColor} ${mod.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="default" className="font-mono text-xs px-2 py-0.5">
                    {count} {mod.unit}
                  </Badge>
                </div>

                <h2 className="font-bold text-slate-900 text-sm">{mod.title}</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {mod.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">Format: .CSV (Excel)</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isExporting}
                  onClick={() => handleExport(mod.key, mod.title)}
                  className="text-xs text-slate-700 hover:text-primary hover:border-primary"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  {isExporting ? 'Compiling…' : 'Download'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
