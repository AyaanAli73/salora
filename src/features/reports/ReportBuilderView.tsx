import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Sliders,
  Play,
  Pin,
  Check,
  Download,
  FileSpreadsheet,
  Layers,
  Sparkles,
  BarChart3,
} from 'lucide-react'
import {
  CustomReportConfig,
  CustomReportResult,
  ReportMetric,
  ReportDimension,
  DateRangePreset,
  Staff,
} from '@/types'
import { reportService } from '@/services/reportService'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/utils/formatters'
import { exportToCSV, exportToExcelCSV } from '@/utils/reportExportUtils'
import { useToastStore } from '@/store/useToastStore'

interface ReportBuilderViewProps {
  staffList?: Staff[]
}

const CHART_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6', '#14B8A6']

export const ReportBuilderView: React.FC<ReportBuilderViewProps> = ({ staffList = [] }) => {
  const { addToast } = useToastStore()

  const [metric, setMetric] = useState<ReportMetric>('revenue')
  const [dimension, setDimension] = useState<ReportDimension>('staff')
  const [datePreset, setDatePreset] = useState<DateRangePreset>('this_month')
  const [chartType, setChartType] = useState<'bar' | 'area' | 'pie' | 'table'>('bar')
  const [reportTitle, setReportTitle] = useState('Revenue by Specialist')

  const [result, setResult] = useState<CustomReportResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  // Auto title generator
  const getAutoTitle = (m: ReportMetric, d: ReportDimension) => {
    const mLabel =
      m === 'revenue'
        ? 'Revenue'
        : m === 'bills_count'
        ? 'Invoices'
        : m === 'appointments'
        ? 'Appointments'
        : m === 'avg_bill_value'
        ? 'Average Bill Value'
        : m === 'discounts'
        ? 'Discounts'
        : 'Expenses'
    const dLabel =
      d === 'staff'
        ? 'Specialist'
        : d === 'service'
        ? 'Service'
        : d === 'category'
        ? 'Department'
        : d === 'payment_method'
        ? 'Payment Tender'
        : d === 'date_day'
        ? 'Day'
        : 'Month'
    return `${mLabel} by ${dLabel}`
  }

  const runReport = async () => {
    setIsGenerating(true)
    try {
      const config: CustomReportConfig = {
        id: `custom-${Date.now()}`,
        title: reportTitle || getAutoTitle(metric, dimension),
        metric,
        dimension,
        datePreset,
        startDate: '',
        endDate: '',
        chartType,
      }
      const res = await reportService.generateCustomReport(config)
      setResult(res)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    runReport()
  }, [metric, dimension, datePreset, chartType])

  const handleMetricChange = (newMetric: ReportMetric) => {
    setMetric(newMetric)
    setReportTitle(getAutoTitle(newMetric, dimension))
  }

  const handleDimensionChange = (newDimension: ReportDimension) => {
    setDimension(newDimension)
    setReportTitle(getAutoTitle(metric, newDimension))
  }

  const handlePinToDashboard = () => {
    reportService.addDashboardWidget({
      id: `widget-${Date.now()}`,
      title: reportTitle,
      reportType: 'builder',
      metric,
      dimension,
      chartType: chartType === 'table' ? 'bar' : chartType,
      enabled: true,
      order: 99,
      size: 'medium',
    })
    setIsPinned(true)
    addToast({
      title: 'Pinned to Dashboard',
      message: `"${reportTitle}" will now appear on your main dashboard workspace.`,
      type: 'success',
    })
  }

  const handleExportCSV = () => {
    if (!result) return
    const headers = ['Dimension', 'Value', 'Count']
    const rows = result.data.map((d) => [d.label, d.value, d.count || 0])
    exportToCSV(reportTitle.replace(/\s+/g, '_'), headers, rows)
  }

  const handleExportExcel = () => {
    if (!result) return
    const headers = ['Dimension', 'Value', 'Count']
    const rows = result.data.map((d) => [d.label, d.value, d.count || 0])
    exportToExcelCSV(reportTitle.replace(/\s+/g, '_'), headers, rows)
  }

  return (
    <div className="space-y-6">
      {/* 1. Report Builder Configuration Panel */}
      <Card className="border-primary/20 bg-surface">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-bold">Custom Report Builder</CardTitle>
            </div>
            <span className="text-xs text-text-muted">Interactive Analytics Studio</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric Selector */}
            <div>
              <label htmlFor="builder-metric" className="block text-xs font-semibold text-text-muted mb-1.5">
                Primary Metric
              </label>
              <select
                id="builder-metric"
                value={metric}
                onChange={(e) => handleMetricChange(e.target.value as ReportMetric)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-medium"
              >
                <option value="revenue">Gross Revenue (INR)</option>
                <option value="bills_count">Invoice Volume</option>
                <option value="appointments">Appointment Volume</option>
                <option value="avg_bill_value">Average Bill Value</option>
                <option value="discounts">Discounts Conceded</option>
                <option value="expenses">Operating Expenses</option>
              </select>
            </div>

            {/* Dimension Selector */}
            <div>
              <label htmlFor="builder-dimension" className="block text-xs font-semibold text-text-muted mb-1.5">
                Group Dimension
              </label>
              <select
                id="builder-dimension"
                value={dimension}
                onChange={(e) => handleDimensionChange(e.target.value as ReportDimension)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-medium"
              >
                <option value="staff">By Specialist (Staff Member)</option>
                <option value="service">By Individual Service</option>
                <option value="category">By Department Category</option>
                <option value="payment_method">By Payment Tender</option>
                <option value="date_day">By Calendar Day</option>
                <option value="date_month">By Month</option>
              </select>
            </div>

            {/* Date Range Preset */}
            <div>
              <label htmlFor="builder-date-preset" className="block text-xs font-semibold text-text-muted mb-1.5">
                Reporting Horizon
              </label>
              <select
                id="builder-date-preset"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as DateRangePreset)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-medium"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="this_year">This Year</option>
              </select>
            </div>

            {/* Visualization Mode */}
            <div>
              <label htmlFor="builder-chart-type" className="block text-xs font-semibold text-text-muted mb-1.5">
                Visualization Type
              </label>
              <select
                id="builder-chart-type"
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-medium"
              >
                <option value="bar">Bar Chart</option>
                <option value="area">Area Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="table">Table Only</option>
              </select>
            </div>
          </div>

          {/* Report Title & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-muted">Report Title:</span>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-lg border border-border bg-surface text-text-primary font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary w-64"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="text-xs h-8 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="text-xs h-8 flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel</span>
              </Button>

              <Button
                variant={isPinned ? 'outline' : 'primary'}
                size="sm"
                onClick={handlePinToDashboard}
                className="text-xs h-8 flex items-center gap-1.5 shadow-xs"
              >
                {isPinned ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pinned to Dashboard</span>
                  </>
                ) : (
                  <>
                    <Pin className="w-3.5 h-3.5" />
                    <span>Pin to Dashboard</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Live Generated Report Results */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-text-muted">Total Aggregation</span>
                <p className="text-2xl font-bold text-primary tabular-nums">
                  {metric === 'revenue' || metric === 'discounts' || metric === 'expenses' || metric === 'avg_bill_value'
                    ? formatCurrency(result.totalValue)
                    : result.totalValue.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-text-muted">Cumulative metric value</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-text-muted">Average per Group</span>
                <p className="text-2xl font-bold text-text-primary tabular-nums">
                  {metric === 'revenue' || metric === 'discounts' || metric === 'expenses' || metric === 'avg_bill_value'
                    ? formatCurrency(result.averageValue)
                    : result.averageValue.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-text-muted">Arithmetic mean</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-text-muted">Total Cohorts / Segments</span>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {result.data.length}
                </p>
                <span className="text-[10px] text-text-muted">Distinct grouped entities</span>
              </CardContent>
            </Card>
          </div>

          {/* Visualization Section */}
          {chartType !== 'table' && (
            <Card>
              <CardHeader className="pb-2 border-b border-border">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>{reportTitle}</span>
                  <span className="text-xs text-text-muted capitalize">
                    {chartType} Visualization
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 w-full">
                  {chartType === 'bar' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="label" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                        <YAxis
                          stroke="#9CA3AF"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(v) =>
                            metric === 'revenue' || metric === 'expenses' ? `₹${(v / 1000).toFixed(0)}k` : v
                          }
                        />
                        <RechartsTooltip
                          formatter={(v: any) => [
                            metric === 'revenue' || metric === 'expenses' || metric === 'discounts'
                              ? formatCurrency(Number(v))
                              : v,
                            'Value',
                          ]}
                          contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                        />
                        <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {chartType === 'area' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={result.data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="label" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                        <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                        <RechartsTooltip
                          formatter={(v: any) => [
                            metric === 'revenue' || metric === 'expenses'
                              ? formatCurrency(Number(v))
                              : v,
                            'Value',
                          ]}
                          contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#6366F1"
                          strokeWidth={2}
                          fill="#6366F1"
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}

                  {chartType === 'pie' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={result.data}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {result.data.map((_, idx) => (
                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(v: any) => [
                            metric === 'revenue' || metric === 'expenses'
                              ? formatCurrency(Number(v))
                              : v,
                            'Value',
                          ]}
                          contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Data Table */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold">Generated Report Records</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-hover/50 text-text-muted font-semibold border-b border-border">
                    <tr>
                      <th className="py-2.5 px-4">#</th>
                      <th className="py-2.5 px-4">Dimension Group</th>
                      <th className="py-2.5 px-4 text-right">Metric Value</th>
                      <th className="py-2.5 px-4 text-right">Transactions Count</th>
                      <th className="py-2.5 px-4 text-right">Share of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.data.map((row, idx) => {
                      const share = result.totalValue > 0 ? Math.round((row.value / result.totalValue) * 100) : 0
                      return (
                        <tr key={idx} className="hover:bg-surface-hover/40 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-text-muted">{idx + 1}</td>
                          <td className="py-2.5 px-4 font-semibold text-text-primary">{row.label}</td>
                          <td className="py-2.5 px-4 text-right tabular-nums font-bold text-text-primary">
                            {metric === 'revenue' || metric === 'expenses' || metric === 'discounts'
                              ? formatCurrency(row.value)
                              : row.value.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-text-muted">
                            {row.count || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-text-muted">
                            {share}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
