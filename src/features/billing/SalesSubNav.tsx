import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  Landmark,
  History,
  Zap,
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface TabItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const TABS: TabItem[] = [
  { name: 'Overview', href: '/sales', icon: LayoutDashboard },
  { name: 'POS Billing', href: '/sales/billing', icon: Zap },
  { name: 'Payments Ledger', href: '/sales/payments', icon: Receipt },
  { name: 'Cash Register', href: '/sales/register', icon: Landmark },
  { name: 'Invoices & History', href: '/sales/history', icon: History },
]

export const SalesSubNav: React.FC = () => {
  const location = useLocation()

  return (
    <div className="flex items-center gap-1.5 p-1 bg-surface-subtle border border-border rounded-2xl overflow-x-auto no-scrollbar">
      {TABS.map((tab) => {
        const isActive =
          tab.href === '/sales'
            ? location.pathname === '/sales'
            : location.pathname.startsWith(tab.href)

        const Icon = tab.icon

        return (
          <NavLink
            key={tab.href}
            to={tab.href}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive
                ? 'bg-primary text-white shadow-glow-primary/30 font-bold'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            )}
          >
            <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-white' : 'text-text-muted')} />
            <span>{tab.name}</span>
            {tab.badge && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                )}
              >
                {tab.badge}
              </span>
            )}
          </NavLink>
        )
      })}
    </div>
  )
}
