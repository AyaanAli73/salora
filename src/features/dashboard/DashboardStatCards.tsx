import React from 'react'
import { CalendarCheck2, Users, IndianRupee, Star, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { DashboardStats } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface DashboardStatCardsProps {
  stats: DashboardStats
  currency?: string
}

export const DashboardStatCards: React.FC<DashboardStatCardsProps> = ({
  stats,
  currency = 'INR',
}) => {
  const cards = [
    {
      id: 'stat-appointments',
      title: "Today's Appointments",
      value: formatNumber(stats.todayAppointments),
      change: stats.appointmentsChange,
      isPositive: stats.appointmentsChangePositive,
      comparison: 'vs yesterday',
      icon: <CalendarCheck2 className="h-5 w-5 text-primary" aria-hidden="true" />,
      iconBg: 'bg-primary-50 text-primary dark:bg-primary-950 dark:text-primary-300',
    },
    {
      id: 'stat-clients',
      title: 'Total Clients',
      value: formatNumber(stats.totalClients),
      change: stats.clientsChange,
      isPositive: stats.clientsChangePositive,
      comparison: 'vs last month',
      icon: <Users className="h-5 w-5 text-accent" aria-hidden="true" />,
      iconBg: 'bg-accent-50 text-accent dark:bg-accent-950 dark:text-accent-300',
    },
    {
      id: 'stat-revenue',
      title: "Today's Revenue",
      value: formatCurrency(stats.revenue, currency),
      change: stats.revenueChange,
      isPositive: stats.revenueChangePositive,
      comparison: 'vs yesterday',
      icon: <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      id: 'stat-rating',
      title: 'Average Rating',
      value: stats.rating.toFixed(1),
      change: stats.ratingChange,
      isPositive: true,
      comparison: `from ${stats.ratingCount} reviews`,
      icon: <Star className="h-5 w-5 text-amber-500 fill-amber-500" aria-hidden="true" />,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => (
        <Card
          key={card.id}
          hoverEffect
          className="p-4 sm:p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider truncate">
                {card.title}
              </span>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary tabular-nums mt-0.5 font-sans">
                {card.value}
              </div>
            </div>

            <div
              className={cn(
                'h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs',
                card.iconBg
              )}
            >
              {card.icon}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 pt-2.5 border-t border-border/50">
            <div
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums',
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

            <span className="text-[11px] text-text-muted font-medium truncate">
              {card.comparison}
            </span>
          </div>
        </Card>
      ))}
    </div>
  )
}
