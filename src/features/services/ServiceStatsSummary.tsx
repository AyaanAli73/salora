import React from 'react'
import {
  CalendarCheck2,
  IndianRupee,
  Star,
  Percent,
  TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Service } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface ServiceStatsSummaryProps {
  service: Service
  currency?: string
  className?: string
}

export const ServiceStatsSummary: React.FC<ServiceStatsSummaryProps> = ({
  service,
  currency = 'INR',
  className,
}) => {
  const statsCards = [
    {
      label: 'Total Bookings',
      value: formatNumber(service.totalBookings),
      sub: 'Appointments fulfilled',
      icon: <CalendarCheck2 className="h-5 w-5 text-primary" aria-hidden="true" />,
      iconBg: 'bg-primary-50 text-primary dark:bg-primary-950 dark:text-primary-300',
    },
    {
      label: 'Revenue Generated',
      value: formatCurrency(service.totalRevenue, currency),
      sub: 'Lifetime treatment earnings',
      icon: <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      label: 'Average Rating',
      value: `${service.averageRating.toFixed(1)} ★`,
      sub: `from ${service.reviewCount} client reviews`,
      icon: <Star className="h-5 w-5 text-amber-500 fill-amber-500" aria-hidden="true" />,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      label: 'Cancellation Rate',
      value: `${service.cancellationRate}%`,
      sub: 'Low abandonment rate',
      icon: <Percent className="h-5 w-5 text-accent" aria-hidden="true" />,
      iconBg: 'bg-accent-50 text-accent dark:bg-accent-950 dark:text-accent-300',
    },
  ]

  const chartData = service.popularityTrend || [
    { month: 'Apr', bookings: 25, revenue: 12000 },
    { month: 'May', bookings: 32, revenue: 16000 },
    { month: 'Jun', bookings: 38, revenue: 19000 },
    { month: 'Jul', bookings: 44, revenue: 22000 },
    { month: 'Aug', bookings: 48, revenue: 24000 },
    { month: 'Sep', bookings: 52, revenue: 26000 },
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <Card key={card.label} className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  {card.label}
                </span>
                <div className="text-xl sm:text-2xl font-extrabold text-text-primary tabular-nums mt-1 font-sans">
                  {card.value}
                </div>
              </div>
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', card.iconBg)}>
                {card.icon}
              </div>
            </div>
            <span className="text-[11px] text-text-muted mt-3 pt-2 border-t border-border/60">
              {card.sub}
            </span>
          </Card>
        ))}
      </div>

      {/* Popularity Trend Area Chart */}
      <Card>
        <CardHeader className="pb-2 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Booking Volume & Revenue Trend</CardTitle>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-light text-success-fg">
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                <span>Steady Growth</span>
              </span>
            </div>
            <CardDescription>Monthly performance over the last 6 months</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="serviceBookingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--color-surface))',
                    borderColor: 'rgb(var(--color-border))',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(val: any, name: any) => [
                    name === 'revenue' ? formatCurrency(Number(val), currency) : `${val} bookings`,
                    name === 'revenue' ? 'Revenue' : 'Bookings',
                  ]}
                  labelStyle={{ fontWeight: 600, color: 'rgb(var(--color-text-primary))' }}
                />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  name="bookings"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#serviceBookingGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
