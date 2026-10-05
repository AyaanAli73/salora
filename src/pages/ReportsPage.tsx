import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  Wallet,
  Users,
  CalendarCheck2,
  Scissors,
  Package,
  ReceiptText,
  Megaphone,
  Sliders,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react'
import {
  ReportCategory,
  ReportFilter,
  SalesReportData,
  PaymentReportData,
  OperatingResultReportData,
  CustomerReportData,
  AppointmentReportData,
  ServiceReportData,
  StaffReportData,
  InventoryReportData,
  ExpenseReportData,
  MarketingReportData,
  Staff,
  ServiceCategory,
} from '@/types'
import { reportService, resolveDateRange } from '@/services/reportService'
import { staffService } from '@/services/staffService'
import { serviceService } from '@/services/serviceService'
import {
  GlobalReportFilterBar,
  SalesReportView,
  FinanceReportView,
  CustomerReportView,
  AppointmentReportView,
  ServiceReportView,
  StaffReportView,
  InventoryReportView,
  ExpenseReportView,
  MarketingReportView,
  ReportBuilderView,
  DashboardWidgetManagerModal,
} from '@/features/reports'
import { Button } from '@/components/ui/Button'
import { exportToCSV, exportToExcelCSV, printReportDocument } from '@/utils/reportExportUtils'
import { useToastStore } from '@/store/useToastStore'
import { useAIStore } from '@/store/useAIStore'
import { cn } from '@/utils/cn'

const CATEGORY_TABS: { id: ReportCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'sales', label: 'Sales', icon: TrendingUp },
  { id: 'finance', label: 'Finance & P&L', icon: Wallet },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'appointments', label: 'Appointments', icon: CalendarCheck2 },
  { id: 'staff', label: 'Staff', icon: BarChart3 },
  { id: 'services', label: 'Services', icon: Scissors },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'builder', label: 'Report Builder', icon: Sliders },
]

export const ReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { addToast } = useToastStore()
  const { openDrawer } = useAIStore()

  const tabParam = (searchParams.get('tab') as ReportCategory) || 'sales'
  const [activeCategory, setActiveCategory] = useState<ReportCategory>(tabParam)

  const defaultRange = resolveDateRange('this_month')
  const [filter, setFilter] = useState<ReportFilter>({
    preset: 'this_month',
    startDate: defaultRange.startDate,
    endDate: defaultRange.endDate,
    branchId: 'all',
    staffId: 'all',
    categoryId: 'all',
  })

  // Dimensional metadata
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false)

  // Report datasets
  const [salesData, setSalesData] = useState<SalesReportData | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentReportData | null>(null)
  const [operatingData, setOperatingData] = useState<OperatingResultReportData | null>(null)
  const [customerData, setCustomerData] = useState<CustomerReportData | null>(null)
  const [appointmentData, setAppointmentData] = useState<AppointmentReportData | null>(null)
  const [serviceData, setServiceData] = useState<ServiceReportData | null>(null)
  const [staffData, setStaffData] = useState<StaffReportData | null>(null)
  const [inventoryData, setInventoryData] = useState<InventoryReportData | null>(null)
  const [expenseData, setExpenseData] = useState<ExpenseReportData | null>(null)
  const [marketingData, setMarketingData] = useState<MarketingReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Sync tab with URL
  useEffect(() => {
    if (tabParam && tabParam !== activeCategory) {
      setActiveCategory(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (cat: ReportCategory) => {
    setActiveCategory(cat)
    setSearchParams({ tab: cat })
  }

  // Load staff & categories once
  useEffect(() => {
    Promise.all([staffService.getAll(), serviceService.getCategories()]).then(([st, cats]) => {
      setStaffList(st)
      setCategories(cats)
    })
  }, [])

  // Fetch report data on filter or category change
  const loadActiveReport = async () => {
    setIsLoading(true)
    try {
      if (activeCategory === 'sales') {
        const res = await reportService.getSalesReport(filter)
        setSalesData(res)
      } else if (activeCategory === 'finance') {
        const [pay, op] = await Promise.all([
          reportService.getPaymentReport(filter),
          reportService.getOperatingResultReport(filter),
        ])
        setPaymentData(pay)
        setOperatingData(op)
      } else if (activeCategory === 'customers') {
        const res = await reportService.getCustomerReport(filter)
        setCustomerData(res)
      } else if (activeCategory === 'appointments') {
        const res = await reportService.getAppointmentReport(filter)
        setAppointmentData(res)
      } else if (activeCategory === 'services') {
        const res = await reportService.getServiceReport(filter)
        setServiceData(res)
      } else if (activeCategory === 'staff') {
        const res = await reportService.getStaffReport(filter)
        setStaffData(res)
      } else if (activeCategory === 'inventory') {
        const res = await reportService.getInventoryReport(filter)
        setInventoryData(res)
      } else if (activeCategory === 'marketing') {
        const res = await reportService.getMarketingReport(filter)
        setMarketingData(res)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadActiveReport()
  }, [activeCategory, filter])

  // Export handlers
  const handleExportCSV = () => {
    const filename = `SALORA_${activeCategory}_report_${new Date().toISOString().split('T')[0]}`

    if (activeCategory === 'sales' && salesData) {
      const headers = ['Invoice', 'Date', 'Client', 'Specialist', 'Gross', 'Discount', 'Tax', 'Net', 'Payment', 'Status']
      const rows = salesData.items.map((i) => [
        i.billNumber,
        i.date,
        i.clientName,
        i.staffName,
        i.grossAmount,
        i.discount,
        i.tax,
        i.netAmount,
        i.paymentMethod,
        i.status,
      ])
      exportToCSV(filename, headers, rows)
    } else if (activeCategory === 'finance' && paymentData) {
      const headers = ['Bill Number', 'Date', 'Client', 'Payment Method', 'Amount', 'Status']
      const rows = paymentData.transactions.map((t) => [
        t.billNumber,
        t.date,
        t.clientName,
        t.paymentMethod,
        t.amount,
        t.status,
      ])
      exportToCSV(filename, headers, rows)
    } else if (activeCategory === 'customers' && customerData) {
      const headers = ['Client Name', 'Phone', 'Status', 'Total Visits', 'Total Spent', 'Last Visit', 'Avg Ticket']
      const rows = customerData.clientsList.map((c) => [
        c.name,
        c.phone,
        c.status,
        c.totalVisits,
        c.totalSpent,
        c.lastVisit,
        c.avgTicket,
      ])
      exportToCSV(filename, headers, rows)
    } else if (activeCategory === 'appointments' && appointmentData) {
      const headers = ['Date', 'Time', 'Client', 'Service', 'Specialist', 'Price', 'Status']
      const rows = appointmentData.items.map((a) => [
        a.date,
        a.time,
        a.clientName,
        a.serviceName,
        a.staffName,
        a.price,
        a.status,
      ])
      exportToCSV(filename, headers, rows)
    } else if (activeCategory === 'services' && serviceData) {
      const headers = ['Service Name', 'Category', 'Bookings', 'Revenue', 'Price', 'Rating', 'Cancellation Rate %']
      const rows = serviceData.services.map((s) => [
        s.serviceName,
        s.categoryName,
        s.bookingsCount,
        s.revenue,
        s.averagePrice,
        s.averageRating,
        s.cancellationRate,
      ])
      exportToCSV(filename, headers, rows)
    } else if (activeCategory === 'staff' && staffData) {
      const headers = ['Specialist', 'Role', 'Services Completed', 'Revenue Generated', 'Rating', 'Attendance %', 'Commission']
      const rows = staffData.staffList.map((s) => [
        s.staffName,
        s.role,
        s.completedServices,
        s.revenueGenerated,
        s.averageRating,
        s.attendanceRate,
        s.commissionEarned,
      ])
      exportToCSV(filename, headers, rows)
    } else if (activeCategory === 'inventory' && inventoryData) {
      const headers = ['Product Name', 'SKU', 'Current Stock', 'Min Stock', 'Unit Cost', 'Retail Price']
      const rows = inventoryData.lowStockItems.map((p) => [
        p.name,
        p.sku,
        p.currentStock,
        p.minStock,
        p.costPrice,
        p.retailPrice,
      ])
      exportToCSV(filename, headers, rows)
    } else {
      addToast({
        title: 'Export Generated',
        message: `Exported ${activeCategory} analytical snapshot.`,
        type: 'success',
      })
    }
  }

  const handleExportExcel = () => {
    const filename = `SALORA_${activeCategory}_report_${new Date().toISOString().split('T')[0]}`

    if (activeCategory === 'sales' && salesData) {
      const headers = ['Invoice', 'Date', 'Client', 'Specialist', 'Gross', 'Discount', 'Tax', 'Net', 'Payment', 'Status']
      const rows = salesData.items.map((i) => [
        i.billNumber,
        i.date,
        i.clientName,
        i.staffName,
        i.grossAmount,
        i.discount,
        i.tax,
        i.netAmount,
        i.paymentMethod,
        i.status,
      ])
      exportToExcelCSV(filename, headers, rows)
    } else if (activeCategory === 'finance' && paymentData) {
      const headers = ['Bill Number', 'Date', 'Client', 'Payment Method', 'Amount', 'Status']
      const rows = paymentData.transactions.map((t) => [
        t.billNumber,
        t.date,
        t.clientName,
        t.paymentMethod,
        t.amount,
        t.status,
      ])
      exportToExcelCSV(filename, headers, rows)
    } else {
      handleExportCSV()
    }
  }

  const handlePrint = () => {
    printReportDocument(`SALORA ${activeCategory.toUpperCase()} Report`)
    addToast({
      title: 'Print Dialog Opened',
      message: 'Generating clean report layout for print / PDF output.',
      type: 'info',
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header & Title with Dashboard Widget Manager Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
            Report Center & Business Analytics
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Operational intelligence derived from real billing, specialist appointments, client roster, and inventory movements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWidgetModalOpen(true)}
            className="text-xs h-8.5 flex items-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4 text-primary" />
            <span>Dashboard Widgets</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => openDrawer("Which services generated the most revenue?", { sourcePage: 'reports' })}
            className="text-xs h-8.5 flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask AI Analyst</span>
          </Button>
        </div>
      </div>

      {/* 2. Report Category Tabs */}
      <div className="border-b border-border">
        <nav
          className="flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-none"
          aria-label="Report Categories"
        >
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeCategory === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* 3. Global Filter Bar (Hidden when inside Report Builder) */}
      {activeCategory !== 'builder' && (
        <GlobalReportFilterBar
          filter={filter}
          onChange={setFilter}
          staffList={staffList}
          categories={categories}
          onExportCSV={handleExportCSV}
          onExportExcel={handleExportExcel}
          onPrint={handlePrint}
          reportTitle={`SALORA ${activeCategory.toUpperCase()} Report`}
        />
      )}

      {/* 4. Active Category Report Content */}
      <div className="pt-1">
        {isLoading && activeCategory !== 'builder' ? (
          <div className="p-16 text-center text-text-muted text-xs animate-pulse space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p>Compiling live analytical report from salon operations…</p>
          </div>
        ) : (
          <>
            {activeCategory === 'sales' && salesData && <SalesReportView data={salesData} />}

            {activeCategory === 'finance' && paymentData && operatingData && (
              <FinanceReportView paymentData={paymentData} operatingData={operatingData} />
            )}

            {activeCategory === 'customers' && customerData && (
              <CustomerReportView data={customerData} />
            )}

            {activeCategory === 'appointments' && appointmentData && (
              <AppointmentReportView data={appointmentData} />
            )}

            {activeCategory === 'services' && serviceData && (
              <ServiceReportView data={serviceData} />
            )}

            {activeCategory === 'staff' && staffData && <StaffReportView data={staffData} />}

            {activeCategory === 'inventory' && inventoryData && (
              <InventoryReportView data={inventoryData} />
            )}

            {activeCategory === 'marketing' && marketingData && (
              <MarketingReportView data={marketingData} />
            )}

            {activeCategory === 'builder' && <ReportBuilderView staffList={staffList} />}
          </>
        )}
      </div>

      {/* Dashboard Widget Configuration Modal */}
      <DashboardWidgetManagerModal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
      />
    </div>
  )
}
