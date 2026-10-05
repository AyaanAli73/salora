import React from 'react'
import {
  Users,
  UserPlus,
  UserCheck,
  Crown,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { ClientStatsSummary } from '@/types'
import { formatNumber } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface ClientStatsProps {
  stats: ClientStatsSummary
  className?: string
  showChart?: boolean
}

export const ClientStats: React.FC<ClientStatsProps> = ({
  stats,
  className,
  showChart = true,
}) => {
  const cards = [
    {
      id: 'stat-total',
      title: 'Total Clients',
      value: formatNumber(stats.totalClients),
      change: stats.totalClientsChange,
      isPositive: stats.totalClientsChangePositive,
      comparison: 'vs last month',
      icon: <Users className="h-6 w-6 text-primary" aria-hidden="true" />,
      iconBg: 'bg-primary-50 text-primary dark:bg-primary-950 dark:text-primary-300',
    },
    {
      id: 'stat-new',
      title: 'New Clients',
      value: formatNumber(stats.newClients),
      change: stats.newClientsChange,
      isPositive: stats.newClientsChangePositive,
      comparison: 'vs last month',
      icon: <UserPlus className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      id: 'stat-returning',
      title: 'Returning Clients',
      value: formatNumber(stats.returningClients),
      change: stats.returningClientsChange,
      isPositive: stats.returningClientsChangePositive,
      comparison: 'vs last month',
      icon: <UserCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
    },
    {
      id: 'stat-vip',
      title: 'VIP Clients',
      value: formatNumber(stats.vipClients),
      change: stats.vipClientsChange,
      isPositive: stats.vipClientsChangePositive,
      comparison: 'vs last month',
      icon: <Crown className="h-6 w-6 text-accent" aria-hidden="true" />,
      iconBg: 'bg-accent-50 text-accent dark:bg-accent-950 dark:text-accent-300',
    },
  ]

  const chartData = stats.statusDistribution

  return (
    <div className={cn('space-y-6', className)}>
      {/* 4 Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cards.map((card) => (
          <Card
            key={card.id}
            hoverEffect
            className="p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider truncate">
                  {card.title}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary tabular-nums mt-1 font-sans">
                  {card.value}
                </div>
              </div>

              <div
                className={cn(
                  'h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs',
                  card.iconBg
                )}
              >
                {card.icon}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-border/60">
              <div
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums',
                  card.isPositive
                    ? 'bg-success-light text-success-fg'
                    : 'bg-danger-light text-danger-fg'
                )}
              >
                {card.isPositive ? (
                  <TrendingUp className="h-3 w-3 shrink-0" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3 w-3 shrink-0" aria-hidden="true" />
                )}
                <span>{card.change}</span>
              </div>
              <span className="text-xs text-text-muted">{card.comparison}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Donut Chart: Client Status Distribution */}
      {showChart && (
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-1 max-w-sm">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-bold text-text-primary">
                  Client Database Distribution
                </h3>
              </div>
              <p className="text-xs text-text-muted">
                Breakdown of active salon patrons, VIP loyalty members, recent first-timers, and inactive records.
              </p>
            </div>

            {/* Recharts Donut & Legend */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-28 w-28 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={48}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'rgb(var(--color-surface))',
                        borderColor: 'rgb(var(--color-border))',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: any) => [`${val} clients`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center total number */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-text-primary tabular-nums">
                    {stats.totalClients}
                  </span>
                  <span className="text-[9px] text-text-muted">Total</span>
                </div>
              </div>

              {/* Status Badges Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-text-secondary">{item.name}</span>
                    <span className="font-bold text-text-primary tabular-nums ml-auto pl-2">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
