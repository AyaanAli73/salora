import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Users,
  CalendarCheck2,
  ReceiptText,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Layers,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Scissors,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Sliders,
  DollarSign,
  Package,
  Calendar,
  Filter,
  BarChart3,
  Percent,
} from 'lucide-react'
import { businessIntelligenceService, RetentionThresholds, DEFAULT_RETENTION_THRESHOLDS } from '@/services/businessIntelligenceService'
import { branchService } from '@/services/branchService'
import { useBranchStore } from '@/store/useBranchStore'
import { useToastStore } from '@/store/useToastStore'
import { useAIStore } from '@/store/useAIStore'
import { TimeGranularity } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { exportToCSV, exportToExcelCSV, printReportDocument } from '@/utils/reportExportUtils'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export const ConsolidatedBusinessPage: React.FC = () => {
  const navigate = useNavigate()
  const { currentBranchId, branches, switchBranch } = useBranchStore()
  const { addToast } = useToastStore()
  const { openDrawer } = useAIStore()

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'retention' | 'services' | 'staff' | 'branches'>('overview')

  // Filters & Granularity
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [granularity, setGranularity] = useState<TimeGranularity>('monthly')
  const [retentionThresholds, setRetentionThresholds] = useState<RetentionThresholds>(DEFAULT_RETENTION_THRESHOLDS)
  const [serviceSearch, setServiceSearch] = useState('')
  const [staffSearch, setStaffSearch] = useState('')

  // Intelligence Data queries
  const branchFilterArg = selectedBranch === 'all' ? undefined : selectedBranch
  const kpis = useMemo(() => businessIntelligenceService.getBusinessKPIs(branchFilterArg), [branchFilterArg])
  const trends = useMemo(() => businessIntelligenceService.getBusinessTrends(granularity, branchFilterArg), [granularity, branchFilterArg])
  const retentionSegments = useMemo(() => businessIntelligenceService.getRetentionSegments(retentionThresholds), [retentionThresholds])
  const customerValue = useMemo(() => businessIntelligenceService.getCustomerValueMetrics(), [])
  const serviceMetrics = useMemo(() => businessIntelligenceService.getServiceBusinessAnalysis(branchFilterArg), [branchFilterArg])
  const staffMetrics = useMemo(() => businessIntelligenceService.getStaffBusinessAnalysis(branchFilterArg), [branchFilterArg])
  const ruleAlerts = useMemo(() => businessIntelligenceService.getRuleBasedAlerts(), [])
  const actionItems = useMemo(() => businessIntelligenceService.getOwnerActionItems(), [])
  const branchSummary = useMemo(() => branchService.getConsolidatedBusinessSummary(), [])

  // Filtered Services & Staff
  const filteredServices = useMemo(() => {
    return serviceMetrics.filter(
      (s) =>
        s.serviceName.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.category.toLowerCase().includes(serviceSearch.toLowerCase())
    )
  }, [serviceMetrics, serviceSearch])

  const filteredStaff = useMemo(() => {
    return staffMetrics.filter(
      (st) =>
        st.staffName.toLowerCase().includes(staffSearch.toLowerCase()) ||
        st.role.toLowerCase().includes(staffSearch.toLowerCase())
    )
  }, [staffMetrics, staffSearch])

  const handleExportBusinessReport = (excelReady = false) => {
    const filename = `Salora_Business_Intelligence_${new Date().toISOString().split('T')[0]}`
    const headers = ['KPI Metric', 'Current Value', 'Previous Period Value', 'Change (%)', 'Date Range', 'Source Metric']
    const rows = kpis.map((k) => [
      k.label,
      k.format === 'currency' ? `₹${k.currentValue.toLocaleString('en-IN')}` : k.format === 'percentage' ? `${k.currentValue}%` : k.currentValue,
      k.format === 'currency' ? `₹${k.previousValue.toLocaleString('en-IN')}` : k.format === 'percentage' ? `${k.previousValue}%` : k.previousValue,
      `${k.changePercentage > 0 ? '+' : ''}${k.changePercentage}%`,
      k.dateRange,
      k.sourceMetric,
    ])

    if (excelReady) {
      exportToExcelCSV(filename, headers, rows)
    } else {
      exportToCSV(filename, headers, rows)
    }

    addToast({
      title: 'Report Downloaded',
      message: 'Business intelligence dataset exported successfully.',
      type: 'success',
    })
  }

  const handlePrint = () => {
    printReportDocument('Salora Salon - Owner Business Intelligence Report')
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Context */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
              Phase 4 Control Layer
            </span>
            <span className="text-xs text-slate-400">• Multi-Period Longitudinal Audit</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-primary" />
            Owner Business Intelligence Command
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Evaluate long-term salon performance, customer cohort retention, staff productivity, and cross-branch operating margins.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Branch Filter */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <Store className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All Branches (Consolidated)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportBusinessReport(true)}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print Audit Dossier
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => openDrawer("Summarize this week's salon performance.", { sourcePage: 'business' })}
            className="shadow-xs"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Ask Salora AI
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit overflow-x-auto max-w-full">
        {[
          { id: 'overview', label: 'Overview & KPIs', icon: BarChart3 },
          { id: 'trends', label: 'Business Trends', icon: TrendingUp },
          { id: 'retention', label: 'Retention & CLV', icon: Users },
          { id: 'services', label: 'Service Intelligence', icon: Scissors },
          { id: 'staff', label: 'Staff Performance', icon: UserCheck },
          { id: 'branches', label: 'Branch Benchmarks', icon: Store },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                isActive
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: OVERVIEW & 9 CONFIGURABLE BUSINESS KPIs                      */}
      {/* ==================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Section 10: OWNER ACTION CENTER */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Owner Action Center</h2>
                  <p className="text-xs text-slate-500">Immediate operational checkpoints requiring managerial sign-off</p>
                </div>
              </div>
              <Badge variant="default" className="text-xs font-semibold text-slate-600">
                {actionItems.length} Pending Actions
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(item.route)}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {item.category.replace('_', ' ')}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded',
                          item.urgency === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {item.count} items
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-900 mt-1.5 group-hover:text-primary transition-colors">
                      {item.title}
                    </div>
                    {item.amount && (
                      <div className="text-xs font-mono font-bold text-slate-700 mt-1">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-primary font-semibold">
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 9: OBJECTIVE RULE-BASED ALERTS / INSIGHTS */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Automated Objective Insights (Audit Rule Engine)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ruleAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-start gap-3 shadow-2xs"
                >
                  <div className="mt-0.5 shrink-0">
                    {alert.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{alert.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{alert.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{alert.description}</p>
                    <div className="pt-1">
                      <button
                        onClick={() => navigate(alert.actionRoute)}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        {alert.actionLabel}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: 9 CONFIGURABLE BUSINESS KPIs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Key Longitudinal Business Indicators</h2>
                <p className="text-xs text-slate-500">Every KPI includes comparative variance, baseline period, and audited source metric</p>
              </div>
              <span className="text-xs font-mono text-slate-400">Range: {kpis[0]?.dateRange}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpis.map((kpi) => {
                const isPositive = kpi.changePercentage >= 0
                const isExpenseOrNegative = kpi.key === 'expenses'

                return (
                  <div
                    key={kpi.key}
                    className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{kpi.label}</span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded',
                            isExpenseOrNegative
                              ? 'text-slate-700 bg-slate-100'
                              : isPositive
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-rose-700 bg-rose-50'
                          )}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          {isPositive ? '+' : ''}
                          {kpi.changePercentage}%
                        </span>
                      </div>

                      <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2 font-mono">
                        {kpi.format === 'currency'
                          ? `₹${kpi.currentValue.toLocaleString('en-IN')}`
                          : kpi.format === 'percentage'
                          ? `${kpi.currentValue}%`
                          : kpi.currentValue.toLocaleString('en-IN')}
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <span className="text-slate-400">Previous Period:</span>
                        <span className="font-semibold font-mono text-slate-700">
                          {kpi.format === 'currency'
                            ? `₹${kpi.previousValue.toLocaleString('en-IN')}`
                            : kpi.format === 'percentage'
                            ? `${kpi.previousValue}%`
                            : kpi.previousValue.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-400">
                      <span className="truncate max-w-[200px]" title={kpi.sourceMetric}>
                        Src: {kpi.sourceMetric}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">Audited</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Chart Preview in Overview */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Revenue vs Operating Expenses & Result</h3>
                <p className="text-xs text-slate-500">Trajectory across selected timeframe</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                {(['daily', 'weekly', 'monthly', 'quarterly'] as TimeGranularity[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGranularity(g)}
                    className={cn(
                      'px-2.5 py-1 rounded capitalize transition-all',
                      granularity === g ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="operatingResult" name="Operating Result (EBITDA)" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRes)" />
                  <Line type="monotone" dataKey="expenses" name="Operating Expenses" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: BUSINESS TRENDS (Daily, Weekly, Monthly, Quarterly)           */}
      {/* ==================================================================== */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Granularity Controls */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Trend Interval Granularity</h2>
              <p className="text-xs text-slate-500">Toggle between day-level cash flow and quarterly macro growth</p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {(['daily', 'weekly', 'monthly', 'quarterly'] as TimeGranularity[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all',
                    granularity === g ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {g} Trends
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Trend Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Revenue vs Expense */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Revenue & Operating Margin Trend</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip formatter={(val: any) => `₹${Number(val).toLocaleString('en-IN')}`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Appointments & Client Growth */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Appointments & Client Volume</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="appointments" name="Total Appointments" stroke="#6366f1" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="returningClients" name="Returning Clients" stroke="#0d9488" strokeWidth={2} />
                    <Line type="monotone" dataKey="newClients" name="New Clients" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Average Bill Value Trend */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Average Bill Value (Ticket Size)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val}`} domain={['dataMin - 100', 'dataMax + 100']} />
                    <Tooltip formatter={(val: any) => `₹${Number(val).toLocaleString('en-IN')}`} />
                    <Line type="monotone" dataKey="averageBillValue" name="Average Ticket (INR)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Operating Result (EBITDA) */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Net Operating Surplus (EBITDA)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <Tooltip formatter={(val: any) => `₹${Number(val).toLocaleString('en-IN')}`} />
                    <Area type="monotone" dataKey="operatingResult" name="Operating Result" stroke="#10b981" fill="#ecfdf5" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: CUSTOMER RETENTION & ESTIMATED LIFETIME VALUE (CLV)           */}
      {/* ==================================================================== */}
      {activeTab === 'retention' && (
        <div className="space-y-6">
          {/* Configurable Thresholds Bar */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Centralized Retention Cohort Parameters</h2>
                <p className="text-xs text-slate-500">Configure elapsed inactivity days without hardcoding values into UI views</p>
              </div>
              <Badge variant="info" className="text-xs font-mono">
                System Standard: 30 / 60 / 90 Days
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                <label className="font-semibold text-slate-800 block">Active Returning Threshold</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="15"
                    max="45"
                    value={retentionThresholds.activeDays}
                    onChange={(e) =>
                      setRetentionThresholds({ ...retentionThresholds, activeDays: Number(e.target.value) })
                    }
                    className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-center font-bold text-primary font-mono"
                  />
                  <span className="text-slate-500">days since last visit</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                <label className="font-semibold text-slate-800 block">At-Risk Churn Threshold</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="45"
                    max="80"
                    value={retentionThresholds.atRiskDays}
                    onChange={(e) =>
                      setRetentionThresholds({ ...retentionThresholds, atRiskDays: Number(e.target.value) })
                    }
                    className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-center font-bold text-amber-600 font-mono"
                  />
                  <span className="text-slate-500">days inactivity window</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                <label className="font-semibold text-slate-800 block">Dormant / Inactive Cutoff</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="75"
                    max="180"
                    value={retentionThresholds.inactiveDays}
                    onChange={(e) =>
                      setRetentionThresholds({ ...retentionThresholds, inactiveDays: Number(e.target.value) })
                    }
                    className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-center font-bold text-rose-600 font-mono"
                  />
                  <span className="text-slate-500">days without booking</span>
                </div>
              </div>
            </div>
          </div>

          {/* Retention Cohorts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {retentionSegments.map((seg) => {
              const badgeColors: Record<string, string> = {
                new: 'text-blue-700 bg-blue-50 border-blue-200',
                returning: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                at_risk: 'text-amber-700 bg-amber-50 border-amber-200',
                inactive: 'text-rose-700 bg-rose-50 border-rose-200',
              }

              return (
                <div
                  key={seg.id}
                  className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{seg.label}</span>
                    <span className={cn('text-[10px] uppercase font-bold px-2 py-0.5 rounded border', badgeColors[seg.id])}>
                      {seg.percentage}% of Clients
                    </span>
                  </div>

                  <div>
                    <div className="text-2xl font-bold font-mono text-slate-900">{seg.clientCount}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Profiles categorized</div>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200/60 leading-relaxed">
                    {seg.thresholdDescription}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Revenue Contribution:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      ₹{seg.revenueContributed.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Section 5: CUSTOMER VALUE & CLV APPROXIMATION MODEL */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Customer Lifetime Value (CLV) Approximation Engine</h3>
                <p className="text-xs text-slate-500">Economic model based on visit cadence and realized ticket sizes</p>
              </div>
              <Badge variant="default" className="text-xs font-semibold">
                Approximation Model
              </Badge>
            </div>

            {/* Disclaimer Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-950 block">Actuarial Disclaimer:</span>
                <p className="text-amber-800 leading-relaxed">{customerValue.calculationNotice}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-medium">Average Visit Value</span>
                <div className="text-2xl font-bold font-mono text-slate-900">
                  ₹{customerValue.averageVisitValue.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-slate-400">Total Spend ÷ Total Visits</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-medium">Annual Visit Frequency</span>
                <div className="text-2xl font-bold font-mono text-slate-900">
                  {customerValue.visitFrequency}x
                </div>
                <span className="text-[11px] text-slate-400">Visits per client per year</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-medium">Client Retention Rate</span>
                <div className="text-2xl font-bold font-mono text-emerald-700">
                  {customerValue.retentionRatePercentage}%
                </div>
                <span className="text-[11px] text-slate-400">Repeat customer proportion</span>
              </div>

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-1">
                <span className="text-primary font-bold block">Estimated CLV Projection</span>
                <div className="text-2xl font-bold font-mono text-primary">
                  ₹{customerValue.estimatedLifetimeValue.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-primary/70">Per acquired client (18mo horizon)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: SERVICE BUSINESS ANALYSIS                                    */}
      {/* ==================================================================== */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Service Performance & Ticket Intelligence</h2>
              <p className="text-xs text-slate-500">Booking volume, revenue yield, repeat usage, and cancellation telemetry</p>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search services or categories…"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Service Treatment</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Volume</th>
                    <th className="py-3 px-4 text-right">Revenue (INR)</th>
                    <th className="py-3 px-4 text-right">Avg Ticket</th>
                    <th className="py-3 px-4 text-right">Repeat %</th>
                    <th className="py-3 px-4 text-right">Cancel %</th>
                    <th className="py-3 px-4 text-right">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredServices.map((srv) => (
                    <tr key={srv.serviceId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{srv.serviceName}</td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {srv.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium">{srv.bookingVolume}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{srv.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        ₹{srv.averageTicket.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                        {srv.repeatUsagePercent}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {srv.cancellationRatePercent}%
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600">
                        ★ {srv.averageRating}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: STAFF BUSINESS ANALYSIS                                      */}
      {/* ==================================================================== */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Staff Contribution & Commercial Yield</h2>
              <p className="text-xs text-slate-500">Bookings, revenue generated, completion rate, commission, and attendance</p>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search team member…"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-right">Appointments</th>
                    <th className="py-3 px-4 text-right">Revenue Generated</th>
                    <th className="py-3 px-4 text-right">Completion Rate</th>
                    <th className="py-3 px-4 text-right">Attendance</th>
                    <th className="py-3 px-4 text-right">Commission Earned</th>
                    <th className="py-3 px-4 text-right">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredStaff.map((st) => (
                    <tr key={st.staffId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{st.staffName}</td>
                      <td className="py-3 px-4 text-slate-500 capitalize">{st.role}</td>
                      <td className="py-3 px-4 text-right font-mono font-medium">{st.appointments}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{st.revenueGenerated.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                        {st.completionRate}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {st.attendanceRate}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-indigo-700 font-bold">
                        ₹{st.totalCommission.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600">
                        ★ {st.averageRating}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: BRANCH BUSINESS BENCHMARKS                                   */}
      {/* ==================================================================== */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Comparative Branch Benchmarking Matrix</h2>
              <p className="text-xs text-slate-500">Cross-branch operational financial results and inventory valuations</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Salon Branch</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4 text-right">Revenue (INR)</th>
                    <th className="py-3 px-4 text-right">Expenses (INR)</th>
                    <th className="py-3 px-4 text-right">Operating Result</th>
                    <th className="py-3 px-4 text-right">Appointments</th>
                    <th className="py-3 px-4 text-right">Clients</th>
                    <th className="py-3 px-4 text-right">Avg Bill Value</th>
                    <th className="py-3 px-4 text-right">Inventory Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {branchSummary.branchComparisons.map((b) => (
                    <tr key={b.branchId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{b.branchName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{b.branchCode}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{b.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600">
                        ₹{b.expenses.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹{b.operatingResult.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">{b.appointments}</td>
                      <td className="py-3 px-4 text-right font-mono">{b.clients}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800">
                        ₹{b.averageBillValue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-indigo-700 font-semibold">
                        ₹{b.inventoryStockValue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
