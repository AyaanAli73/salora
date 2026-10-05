import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Package,
  CalendarClock,
  Users,
  Store,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { billingService } from '@/services/billingService'
import { inventoryService } from '@/services/inventoryService'
import { appointmentService } from '@/services/appointmentService'
import { cashRegisterService } from '@/services/cashRegisterService'
import { useQueueStore } from '@/store/useQueueStore'
import { cn } from '@/utils/cn'

interface TodaysAttentionWidgetProps {
  className?: string
}

export const TodaysAttentionWidget: React.FC<TodaysAttentionWidgetProps> = ({ className }) => {
  const navigate = useNavigate()
  const { tokens } = useQueueStore()

  // Real operational metrics (no mock or fake fallback counts)
  const unpaidBills = billingService
    .getAllBills()
    .filter((b) => b.paymentStatus === 'UNPAID' || b.paymentStatus === 'PARTIAL')
  const unpaidCount = unpaidBills.length

  const products = inventoryService.getAllSync()
  const lowStockItems = products.filter((p) => p.active && p.currentStock <= p.minimumStock)
  const lowStockCount = lowStockItems.length

  const todayAppts = appointmentService.getTodayAppointments()
  const pendingAppts = todayAppts.filter((a) => a.status === 'pending' || a.status === 'requested')
  const confirmationCount = pendingAppts.length

  const waitingTokens = tokens.filter((t) => t.status === 'WAITING')
  const waitingCount = waitingTokens.length

  const registerSession = cashRegisterService.getTodaySession()
  const hasRegisterSales =
    ((registerSession?.cashSales || 0) +
      (registerSession?.cardSales || 0) +
      (registerSession?.upiSales || 0)) > 0
  const isRegisterOpen = registerSession?.status === 'OPEN' && hasRegisterSales

  const alertItems = [
    ...(unpaidCount > 0
      ? [
          {
            id: 'unpaid-bills',
            color: 'bg-rose-500',
            dotColor: 'text-rose-500',
            badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900',
            icon: <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />,
            label: `${unpaidCount} unpaid bill${unpaidCount > 1 ? 's' : ''}`,
            subtitle: 'Outstanding tickets require settlement or reconciliation',
            link: '/sales/history',
          },
        ]
      : []),
    ...(lowStockCount > 0
      ? [
          {
            id: 'low-stock',
            color: 'bg-amber-500',
            dotColor: 'text-amber-500',
            badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900',
            icon: <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />,
            label: `${lowStockCount} low-stock product${lowStockCount > 1 ? 's' : ''}`,
            subtitle: 'SKUs have breached minimum safety stock levels',
            link: '/inventory/products',
          },
        ]
      : []),
    ...(confirmationCount > 0
      ? [
          {
            id: 'appointment-confirm',
            color: 'bg-yellow-500',
            dotColor: 'text-yellow-500',
            badgeBg: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900',
            icon: <CalendarClock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />,
            label: `${confirmationCount} appointment${confirmationCount > 1 ? 's' : ''} need${confirmationCount === 1 ? 's' : ''} confirmation`,
            subtitle: 'Customer booking pending stylist or slot confirmation',
            link: '/appointments',
          },
        ]
      : []),
    ...(waitingCount > 0
      ? [
          {
            id: 'waiting-customers',
            color: 'bg-blue-500',
            dotColor: 'text-blue-500',
            badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900',
            icon: <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />,
            label: `${waitingCount} customer${waitingCount > 1 ? 's' : ''} waiting`,
            subtitle: 'Active tokens waiting in lounge area for station assignment',
            link: '/appointments/queue',
          },
        ]
      : []),
    ...(isRegisterOpen
      ? [
          {
            id: 'register-closing',
            color: 'bg-indigo-500',
            dotColor: 'text-indigo-500',
            badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
            icon: <Store className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />,
            label: 'Register reconciliation pending',
            subtitle: 'Till session is open. End-of-day balance reconciliation pending',
            link: '/sales/register',
          },
        ]
      : []),
  ]

  const activeAlertsCount = alertItems.length

  return (
    <Card className={cn('border-border/80 shadow-sm overflow-hidden flex flex-col', className)}>
      <CardHeader className="pb-3 border-b border-border/60 bg-surface-subtle/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-2.5 w-2.5 rounded-full',
                activeAlertsCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
              )}
            />
            <CardTitle className="text-sm font-bold text-text-primary">
              Today's Attention
            </CardTitle>
            {activeAlertsCount > 0 ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                {activeAlertsCount} Action{activeAlertsCount !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                All Clear
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/reports/daily-closing')}
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>Closing Checklist</span>
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
        <CardDescription className="text-xs text-text-muted mt-0.5">
          Priority operational items requiring reception & management resolution
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-border/50">
        {activeAlertsCount > 0 ? (
          alertItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.link)}
              className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface-subtle transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Icon Container */}
                <div
                  className={cn(
                    'h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                    item.badgeBg
                  )}
                >
                  {item.icon}
                </div>

                {/* Text */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', item.color)} />
                    <p className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                      {item.label}
                    </p>
                  </div>
                  <p className="text-[11px] text-text-secondary truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <ArrowRight
                className="h-4 w-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
                aria-hidden="true"
              />
            </div>
          ))
        ) : (
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2.5">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold text-text-primary">All Caught Up</p>
            <p className="text-[11px] text-text-muted mt-0.5 max-w-[260px]">
              No urgent operational alerts right now. Salon operations are running smoothly.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

