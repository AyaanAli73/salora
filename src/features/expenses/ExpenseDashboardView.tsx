import React, { useState } from 'react'
import {
  TrendingDown,
  TrendingUp,
  Clock,
  Calendar,
  IndianRupee,
  PieChart as PieIcon,
  BarChart3,
  CreditCard,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  AlertCircle,
  Eye,
  CheckCircle2,
  Building,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Expense, ExpenseDashboardStats } from '@/types'
import { expenseService } from '@/services/expenseService'
import { formatCurrency, formatPercent } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface ExpenseDashboardViewProps {
  stats: ExpenseDashboardStats
  recentExpenses: Expense[]
  onAddExpense: () => void
  onViewExpense: (expense: Expense) => void
  onMarkPaid: (expense: Expense) => void
  onNavigateToHistory: () => void
  onNavigateToCategories: () => void
}

export const ExpenseDashboardView: React.FC<ExpenseDashboardViewProps> = ({
  stats,
  recentExpenses,
  onAddExpense,
  onViewExpense,
  onMarkPaid,
  onNavigateToHistory,
  onNavigateToCategories,
}) => {
  const [trendMonths] = useState(6)
  const trendData = expenseService.getMonthlyTrend(trendMonths)
  const categoryData = expenseService.getCategoryBreakdown()
  const cashVsDigital = expenseService.getCashVsNonCash()

  // September current month numbers for financial integration demo
  const currentMonthRevenue = 312000
  const currentMonthExpenses = stats.thisMonthExpenses || 168400
  const netOperatingResult = currentMonthRevenue - currentMonthExpenses

  return (
    <div className="space-y-6">
      {/* 1. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Expenses */}
        <Card className="border-border/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Today's Expenses</span>
              <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-text-primary tabular-nums mt-1 font-mono">
              {formatCurrency(stats.todayExpenses)}
            </p>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-text-muted">
              <span>{stats.todayCount} voucher{stats.todayCount === 1 ? '' : 's'} recorded</span>
              <span className="font-semibold text-text-secondary">Today</span>
            </div>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card className="border-border/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">This Month</span>
              <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-text-primary tabular-nums mt-1 font-mono">
              {formatCurrency(stats.thisMonthExpenses)}
            </p>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px]">
              <span
                className={cn(
                  'font-bold inline-flex items-center',
                  stats.monthOverMonthChange > 0 ? 'text-rose-600' : 'text-emerald-600'
                )}
              >
                {stats.monthOverMonthChange > 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                )}
                {Math.abs(stats.monthOverMonthChange)}%
              </span>
              <span className="text-text-muted">vs last month (₹1.42L)</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Obligations */}
        <Card className="border-border/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Pending Expenses</span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-text-primary tabular-nums mt-1 font-mono">
              {formatCurrency(stats.pendingExpensesAmount)}
            </p>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-text-muted">
              <span className="font-semibold text-amber-600">{stats.pendingCount} unpaid liabilities</span>
              <span>Needs settlement</span>
            </div>
          </CardContent>
        </Card>

        {/* Largest Category */}
        <Card className="border-border/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Largest Category</span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <Building className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-text-primary mt-1 truncate">
              {stats.largestCategoryName}
            </p>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-text-muted">
              <span className="font-mono font-bold text-text-primary">
                {formatCurrency(stats.largestCategoryAmount)}
              </span>
              <span>This month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Financial Integration Hero Banner: Net Operating Result */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-surface to-surface-subtle border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Financial Integration
            </span>
            <span className="text-xs text-text-muted font-medium">Accounting Standard Model</span>
          </div>
          <h3 className="text-lg font-bold text-text-primary">
            Salon Net Operating Result
          </h3>
          <p className="text-xs text-text-muted max-w-xl leading-relaxed">
            Strict accounting formula: <span className="font-mono font-bold text-text-primary">Net Operating Result = Revenue - Expenses</span>.
            Does not make informal profit assumptions before taxes and asset depreciation.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-surface p-3.5 rounded-xl border border-border/80 shadow-xs shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-text-muted block">Gross Revenue</span>
            <span className="text-sm font-bold text-emerald-600 font-mono">
              {formatCurrency(currentMonthRevenue)}
            </span>
          </div>
          <span className="text-text-muted font-bold text-lg">-</span>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-text-muted block">Operating Expenses</span>
            <span className="text-sm font-bold text-rose-600 font-mono">
              {formatCurrency(currentMonthExpenses)}
            </span>
          </div>
          <span className="text-text-muted font-bold text-lg">=</span>
          <div className="text-right pl-2 border-l border-border">
            <span className="text-[10px] uppercase font-bold text-primary block">Net Operating Result</span>
            <span className="text-lg font-black text-primary font-mono tabular-nums">
              {formatCurrency(netOperatingResult)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Bar Chart */}
        <Card className="lg:col-span-8 border-border/80">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span>Monthly Revenue vs Operating Expenses</span>
              </CardTitle>
              <CardDescription className="text-xs text-text-muted mt-0.5">
                Pacing comparison across the past 6 operational months
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-text-secondary">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-text-secondary">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                Expenses
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgb(var(--color-surface))',
                      borderColor: 'rgb(var(--color-border))',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any) => [
                      formatCurrency(Number(val)),
                      name === 'revenue' ? 'Gross Revenue' : 'Operating Expenses',
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cash vs Digital Split */}
        <Card className="lg:col-span-4 border-border/80 flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Banknote className="h-4 w-4 text-amber-500" />
              <span>Cash vs Digital Outflow</span>
            </CardTitle>
            <CardDescription className="text-xs text-text-muted mt-0.5">
              Impact on physical cash drawer till
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex-1 flex flex-col justify-center items-center">
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cashVsDigital}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {cashVsDigital.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full space-y-2.5 mt-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border text-xs">
                <span className="flex items-center gap-1.5 text-text-secondary font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Cash Register Outflows
                </span>
                <span className="font-bold font-mono text-text-primary">
                  {formatCurrency(stats.cashExpensesThisMonth)}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border text-xs">
                <span className="flex items-center gap-1.5 text-text-secondary font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  Digital / Bank / UPI / Cards
                </span>
                <span className="font-bold font-mono text-text-primary">
                  {formatCurrency(stats.nonCashExpensesThisMonth)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Category Breakdown & Recent Expenses Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Category Breakdown Bars */}
        <Card className="lg:col-span-6 border-border/80">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-accent" />
                <span>Expenses by Category</span>
              </CardTitle>
              <CardDescription className="text-xs text-text-muted mt-0.5">
                Top expenditure centers across active vouchers
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onNavigateToCategories}
              className="text-xs"
            >
              Manage Categories
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {categoryData.slice(0, 6).map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-primary flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                  </span>
                  <span className="font-bold font-mono text-text-primary tabular-nums">
                    {formatCurrency(cat.amount)}{' '}
                    <span className="text-[10px] text-text-muted font-normal">({cat.percentage}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(cat.percentage, 100)}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Expenses Table / Activity */}
        <Card className="lg:col-span-6 border-border/80">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-text-primary">
                Recent Financial Expenses
              </CardTitle>
              <CardDescription className="text-xs text-text-muted mt-0.5">
                Latest operational dispatches and vouchers
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onNavigateToHistory}
              className="text-xs"
            >
              View Full History
            </Button>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {recentExpenses.slice(0, 5).map((exp) => (
              <div
                key={exp.id}
                className="p-3.5 hover:bg-surface-subtle/50 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[10px] font-bold text-text-muted">{exp.id}</span>
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded text-[10px] font-bold uppercase',
                        exp.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : exp.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      )}
                    >
                      {exp.status}
                    </span>
                    <span className="text-[10px] text-text-muted">• {exp.categoryName}</span>
                  </div>
                  <p className="font-bold text-text-primary truncate">{exp.name}</p>
                  <p className="text-[10px] text-text-muted truncate mt-0.5">
                    Payee: {exp.supplierName || 'General Payee'} • {exp.paymentMethod}
                  </p>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <span className="font-black font-mono text-sm text-text-primary block">
                      {formatCurrency(exp.amount)}
                    </span>
                    <span className="text-[10px] text-text-muted">{exp.date}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewExpense(exp)}
                    aria-label={`View details of ${exp.name}`}
                    className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
