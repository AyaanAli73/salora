import React, { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { RevenueDataPoint } from '@/types'
import { dashboardService } from '@/services/dashboardService'
import { expenseService } from '@/services/expenseService'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface RevenueOverviewCardProps {
  className?: string
  currency?: string
}

export const RevenueOverviewCard: React.FC<RevenueOverviewCardProps> = ({
  className,
  currency = 'INR',
}) => {
  const [interval, setInterval] = useState<'daily' | 'monthly'>('daily')
  const [data, setData] = useState<RevenueDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    dashboardService.getRevenueData(interval).then((points) => {
      if (isMounted) {
        setData(points)
        setIsLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [interval])

  const totalRevenue = data.reduce((acc, curr) => acc + curr.total, 0)
  const totalServices = data.reduce((acc, curr) => acc + curr.services, 0)
  const totalProducts = data.reduce((acc, curr) => acc + curr.products, 0)

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Revenue Overview</CardTitle>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-light text-success-fg">
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                <span>+15.3%</span>
              </span>
            </div>
            <CardDescription>
              {interval === 'daily'
                ? 'Daily performance (Mon — Sun)'
                : 'Last 6 months revenue performance'}
            </CardDescription>
          </div>

          {/* Date / Interval Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-subtle border border-border/70 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setInterval('daily')}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-[background-color,color]',
                interval === 'daily'
                  ? 'bg-surface text-text-primary shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setInterval('monthly')}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-[background-color,color]',
                interval === 'monthly'
                  ? 'bg-surface text-text-primary shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Revenue & Net Result Totals Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-1">
          <div className="flex flex-col">
            <span className="text-[11px] text-text-muted font-medium">Gross Revenue</span>
            <span className="text-base sm:text-lg font-bold text-text-primary tabular-nums">
              {formatCurrency(totalRevenue, currency)}
            </span>
          </div>
          <div className="flex flex-col border-l border-border/60 pl-3">
            <span className="text-[11px] text-text-muted font-medium flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" /> Services
            </span>
            <span className="text-xs sm:text-sm font-bold text-text-primary tabular-nums">
              {formatCurrency(totalServices, currency)}
            </span>
          </div>
          <div className="flex flex-col border-l border-border/60 pl-3">
            <span className="text-[11px] text-text-muted font-medium flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" /> Retail
            </span>
            <span className="text-xs sm:text-sm font-bold text-text-primary tabular-nums">
              {formatCurrency(totalProducts, currency)}
            </span>
          </div>
          <div className="flex flex-col border-l border-border/60 pl-3">
            <span className="text-[11px] text-text-muted font-medium flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" /> Net Operating Result
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(
                interval === 'daily'
                  ? totalRevenue - expenseService.getTodayExpensesTotal()
                  : totalRevenue - (expenseService.getDashboardStats().thisMonthExpenses || 0),
                currency
              )}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 pb-2 min-w-0 overflow-hidden">
        <div className="h-64 sm:h-72 w-full min-w-0 overflow-hidden">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center text-xs text-text-muted">
              Loading revenue chart…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboardRevenueServiceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="dashboardRevenueProductGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  tickFormatter={(val) => `₹${Number(val) >= 1000 ? `${(Number(val) / 1000).toFixed(0)}k` : val}`}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--color-surface))',
                    borderColor: 'rgb(var(--color-border))',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(val: any, name: any) => [
                    formatCurrency(Number(val) || 0, currency),
                    name === 'services' ? 'Services' : name === 'products' ? 'Retail' : 'Total',
                  ]}
                  labelStyle={{ fontWeight: 600, color: 'rgb(var(--color-text-primary))' }}
                />
                <Area
                  type="monotone"
                  dataKey="services"
                  name="services"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dashboardRevenueServiceGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="products"
                  name="products"
                  stroke="#EC4899"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dashboardRevenueProductGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
