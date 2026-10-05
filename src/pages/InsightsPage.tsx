import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Users,
  Scissors,
  Package,
  Wallet,
  UserCheck,
  Megaphone,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  HelpCircle,
  Filter,
  RefreshCw,
  ShoppingBag,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react'
import {
  insightsService,
  InsightFilterParams,
} from '@/services/insightsService'
import {
  BusinessInsight,
  InsightCategory,
  ServiceMetricInsight,
  StaffMetricInsight,
  InventoryMovementInsight,
} from '@/types'
import { useAIStore } from '@/store/useAIStore'
import { useToastStore } from '@/store/useToastStore'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { InsightCard } from '@/components/insights/InsightCard'
import { InsightExplainModal } from '@/components/insights/InsightExplainModal'
import { RebookingListTable } from '@/components/insights/RebookingListTable'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export const InsightsPage: React.FC = () => {
  const { openDrawer } = useAIStore()
  const { addToast } = useToastStore()

  // State
  const [period, setPeriod] = useState<InsightFilterParams['period']>('this_month')
  const [activeCategory, setActiveCategory] = useState<'all' | InsightCategory>('all')
  const [selectedInsight, setSelectedInsight] = useState<BusinessInsight | null>(null)

  // Compute live dataset
  const data = useMemo(() => {
    return insightsService.getAllInsights({ period })
  }, [period])

  // Filter insights by category tab
  const displayedInsights = useMemo(() => {
    if (activeCategory === 'all') return data.allInsights
    return data.allInsights.filter((ins) => ins.category === activeCategory)
  }, [data.allInsights, activeCategory])

  const handlePeriodChange = (newPeriod: InsightFilterParams['period']) => {
    setPeriod(newPeriod)
    addToast({
      title: 'Insights Recalculated',
      message: `Analyzing data metrics for ${newPeriod.replace('_', ' ')}.`,
      type: 'info',
    })
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* 1. Header & Context */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
              Phase 5 Intelligence Layer
            </span>
            <span className="text-xs text-text-muted">• Rule-based + AI-assisted signals</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary mt-1 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-primary" />
            AI Customer &amp; Business Insights Center
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Verified analytical signals derived from booking frequency, inventory drawdowns, customer return spacing, and net revenue.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Period Filter Bar */}
          <div className="flex items-center bg-surface border border-border rounded-xl px-2 py-1 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-text-muted mr-1.5" />
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value as any)}
              className="text-xs font-semibold text-text-primary bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_quarter">This Quarter</option>
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              openDrawer("Summarize this month's salon performance.", {
                sourcePage: 'insights',
                dateRange: period,
              })
            }
            className="shadow-xs"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Ask Salora AI
          </Button>
        </div>
      </div>

      {/* 2. Category Sub-tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-subtle border border-border w-fit overflow-x-auto max-w-full">
        {[
          { id: 'all', label: 'All Insights', icon: Layers, count: data.allInsights.length },
          { id: 'customer', label: 'Customer Insights', icon: Users, count: data.customer.insights.length },
          { id: 'service', label: 'Service Insights', icon: Scissors, count: data.service.insights.length },
          { id: 'inventory', label: 'Inventory Insights', icon: Package, count: data.inventory.insights.length },
          { id: 'financial', label: 'Financial Insights', icon: Wallet, count: data.financial.insights.length },
          { id: 'staff', label: 'Staff Insights', icon: UserCheck, count: data.staff.insights.length },
          { id: 'marketing', label: 'Marketing Insights', icon: Megaphone, count: data.marketing.insights.length },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeCategory === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                  isActive ? 'bg-white/20 text-white' : 'bg-surface border border-border text-text-muted'
                )}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* 3. High-Priority Insights Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Verified Insight Cards ({displayedInsights.length})
          </span>
          <span className="text-[11px] text-text-muted">
            Click "Why am I seeing this?" for transparency &amp; calculation steps
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onExplain={(ins) => setSelectedInsight(ins)}
            />
          ))}
        </div>
      </div>

      {/* 4. DOMAIN SPECIFIC SECTIONS */}

      {/* A. Customer Insights Section (Cohorts + Rebooking List) */}
      {(activeCategory === 'all' || activeCategory === 'customer') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Customer Retention Cohorts &amp; Rebooking Intelligence
            </h3>
            <Link to="/clients">
              <Button variant="outline" size="sm" className="text-xs">
                <span>View Full Client Roster</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Cohort KPI Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'New Clients', count: data.customer.cohortCounts.newClients, color: 'text-emerald-600' },
              { label: 'Returning', count: data.customer.cohortCounts.returningClients, color: 'text-primary' },
              { label: 'At Risk (45-60d)', count: data.customer.cohortCounts.atRiskClients, color: 'text-amber-600' },
              { label: 'Inactive (60d+)', count: data.customer.cohortCounts.inactiveClients, color: 'text-rose-600' },
              { label: 'VIP Clients', count: data.customer.cohortCounts.vipClients, color: 'text-purple-600' },
              { label: 'High Spenders', count: data.customer.cohortCounts.highSpendingClients, color: 'text-blue-600' },
              { label: 'Frequent (6+)', count: data.customer.cohortCounts.frequentVisitors, color: 'text-teal-600' },
            ].map((cohort, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-surface border border-border shadow-2xs space-y-1"
              >
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                  {cohort.label}
                </span>
                <span className={cn('text-xl font-black tabular-nums block', cohort.color)}>
                  {cohort.count}
                </span>
              </div>
            ))}
          </div>

          {/* Potential Rebooking List Table */}
          <RebookingListTable clients={data.customer.rebookingList} />
        </div>
      )}

      {/* B. Service Insights Section (Volume, Revenue, Average Ticket, Repeat Rate, Cancellation Rate) */}
      {(activeCategory === 'all' || activeCategory === 'service') && (
        <Card className="space-y-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-primary" />
                  Service Intelligence &amp; Verified Booking Metrics
                </CardTitle>
                <CardDescription>
                  Evaluates booking volumes, repeat rebooking ratios, cancellation rates, and factual volume trends.
                </CardDescription>
              </div>
              <Link to="/services">
                <Button variant="outline" size="sm" className="text-xs">
                  <span>Manage Catalog</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-y border-border bg-surface-subtle text-text-muted font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Bookings</th>
                    <th className="py-3 px-4 text-right">Revenue</th>
                    <th className="py-3 px-4 text-center">Avg Ticket</th>
                    <th className="py-3 px-4 text-center">Repeat Rate</th>
                    <th className="py-3 px-4 text-center">Cancel Rate</th>
                    <th className="py-3 px-4 text-center">Rating</th>
                    <th className="py-3 px-4">Factual Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.service.serviceMetrics.map((sm) => (
                    <tr key={sm.serviceId} className="hover:bg-surface-subtle/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-text-primary">
                        {sm.serviceName}
                      </td>
                      <td className="py-3 px-4 text-text-muted">
                        <Badge variant="default" className="text-[10px]">
                          {sm.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-bold tabular-nums">
                        {sm.bookingVolume}{' '}
                        <span className="text-[10px] font-normal text-text-muted">
                          ({sm.volumeChangePercent > 0 ? '+' : ''}{sm.volumeChangePercent}%)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-text-primary tabular-nums">
                        ₹{sm.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-text-secondary tabular-nums">
                        ₹{sm.averageBill.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-text-secondary tabular-nums">
                        {sm.repeatRate}%
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-rose-600 tabular-nums">
                        {sm.cancellationRate}%
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-600 tabular-nums">
                        {sm.rating} ★
                      </td>
                      <td className="py-3 px-4 text-[11px] text-text-muted max-w-xs leading-relaxed">
                        {sm.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* C. Staff Insights Section (Appointments, Completed, Revenue, Rating, Attendance, Commission) */}
      {(activeCategory === 'all' || activeCategory === 'staff') && (
        <Card className="space-y-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Staff Operational Metrics (Objective Auditing)
                </CardTitle>
                <CardDescription>
                  Strictly records verified appointments, revenue attributed, client ratings, and attendance without subjective employee labeling.
                </CardDescription>
              </div>
              <Link to="/staff">
                <Button variant="outline" size="sm" className="text-xs">
                  <span>View Staff Team</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-y border-border bg-surface-subtle text-text-muted font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Specialist</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-center">Appointments</th>
                    <th className="py-3 px-4 text-center">Completed Visits</th>
                    <th className="py-3 px-4 text-right">Revenue Generated</th>
                    <th className="py-3 px-4 text-center">Rating</th>
                    <th className="py-3 px-4 text-center">Attendance</th>
                    <th className="py-3 px-4 text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.staff.staffMetrics.map((st) => (
                    <tr key={st.staffId} className="hover:bg-surface-subtle/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-text-primary">
                        {st.staffName}
                      </td>
                      <td className="py-3 px-4 text-text-muted">
                        <Badge variant="default" className="text-[10px]">
                          {st.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold tabular-nums">
                        {st.appointmentsCount}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600 tabular-nums">
                        {st.completedServicesCount}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-text-primary tabular-nums">
                        ₹{st.revenueGenerated.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-600 tabular-nums">
                        {st.rating} ★
                      </td>
                      <td className="py-3 px-4 text-center font-medium tabular-nums text-text-secondary">
                        {st.attendanceRate}%
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-text-secondary tabular-nums">
                        ₹{st.commissionEarned.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* D. Inventory Insights Section (Velocity, Stockout, Consumption % Change) */}
      {(activeCategory === 'all' || activeCategory === 'inventory') && (
        <Card className="space-y-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Inventory Stock Velocities &amp; Drawdowns
                </CardTitle>
                <CardDescription>
                  Tracks stock consumption percentage reductions, depleted items, and reorder levels.
                </CardDescription>
              </div>
              <Link to="/inventory">
                <Button variant="outline" size="sm" className="text-xs">
                  <span>Open Warehouse</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-y border-border bg-surface-subtle text-text-muted font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">On-Hand Stock</th>
                    <th className="py-3 px-4 text-center">Min Safety Stock</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Consumption %</th>
                    <th className="py-3 px-4">Factual Audit Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.inventory.movementItems.map((item) => (
                    <tr key={item.productId} className="hover:bg-surface-subtle/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-text-primary">
                        {item.productName}
                      </td>
                      <td className="py-3 px-4 text-text-muted">
                        <Badge variant="default" className="text-[10px]">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-bold tabular-nums">
                        {item.currentStock} units
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-text-secondary tabular-nums">
                        {item.minStock} units
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            item.status === 'out_of_stock'
                              ? 'danger'
                              : item.status === 'low_stock'
                              ? 'warning'
                              : item.status === 'fast_moving'
                              ? 'primary'
                              : 'default'
                          }
                          className="text-[10px] capitalize"
                        >
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-bold tabular-nums">
                        {item.consumptionPercentChange > 0 ? `-${item.consumptionPercentChange}%` : '0%'}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-text-muted max-w-xs leading-relaxed">
                        {item.factualNote}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* E. Financial Insights Section (Revenue vs Expense Trend, Payment Mix, Refunds & Discounts) */}
      {(activeCategory === 'all' || activeCategory === 'financial') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 space-y-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Financial Audit &amp; Period Longitudinal Comparison
              </CardTitle>
              <CardDescription>
                Factual comparison between current evaluated period and previous benchmark window.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-surface-subtle border border-border">
                  <span className="text-[10px] font-bold uppercase text-text-muted block">
                    Current Revenue
                  </span>
                  <span className="text-lg font-black text-text-primary tabular-nums block">
                    ₹{data.financial.summary.currentRevenue.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-text-muted">
                    {data.financial.summary.revenueChangePercent > 0 ? '+' : ''}
                    {data.financial.summary.revenueChangePercent}% vs previous
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-subtle border border-border">
                  <span className="text-[10px] font-bold uppercase text-text-muted block">
                    Recorded Expenses
                  </span>
                  <span className="text-lg font-black text-text-primary tabular-nums block">
                    ₹{data.financial.summary.currentExpenses.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-text-muted">Operating draw</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-subtle border border-border">
                  <span className="text-[10px] font-bold uppercase text-text-muted block">
                    Net Operating Result
                  </span>
                  <span className="text-lg font-black text-emerald-600 tabular-nums block">
                    ₹{data.financial.summary.netOperatingResult.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-text-muted">Revenue - Expenses</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-subtle border border-border">
                  <span className="text-[10px] font-bold uppercase text-text-muted block">
                    Average Bill Value
                  </span>
                  <span className="text-lg font-black text-text-primary tabular-nums block">
                    ₹{data.financial.summary.averageBillValue.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-text-muted">Settled invoices</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 text-xs leading-relaxed text-text-muted">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-text-primary block">
                    Audited Pattern Narrative:
                  </span>
                  <span>
                    Revenue was ₹{data.financial.summary.currentRevenue.toLocaleString('en-IN')} compared with ₹
                    {data.financial.summary.previousRevenue.toLocaleString('en-IN')} in the previous comparative period. Total recorded discounts were ₹
                    {data.financial.summary.totalDiscounts.toLocaleString('en-IN')} and customer refunds totaled ₹
                    {data.financial.summary.totalRefunds.toLocaleString('en-IN')}.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Mix Distribution */}
          <Card className="space-y-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-text-primary">
                Tender &amp; Payment Mix
              </CardTitle>
              <CardDescription className="text-xs">
                Distribution of settled collections by channel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.financial.summary.paymentMix.length === 0 ? (
                <div className="text-xs text-text-muted py-4 text-center">
                  No payment transactions recorded for this period.
                </div>
              ) : (
                data.financial.summary.paymentMix.map((pm, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-text-primary">{pm.method}</span>
                      <span className="text-text-muted tabular-nums">
                        ₹{pm.amount.toLocaleString('en-IN')} ({pm.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${pm.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Explainability Transparency Modal */}
      <InsightExplainModal
        insight={selectedInsight}
        isOpen={Boolean(selectedInsight)}
        onClose={() => setSelectedInsight(null)}
      />
    </div>
  )
}
