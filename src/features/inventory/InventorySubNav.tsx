import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  ShoppingCart,
  Truck,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface TabItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

interface InventorySubNavProps {
  lowStockCount?: number
  expiringCount?: number
}

export const InventorySubNav: React.FC<InventorySubNavProps> = ({
  lowStockCount,
  expiringCount,
}) => {
  const location = useLocation()

  const tabs: TabItem[] = [
    { name: 'Dashboard', href: '/inventory', icon: LayoutDashboard },
    {
      name: 'Products & Stock',
      href: '/inventory/products',
      icon: Package,
      badge: lowStockCount && lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
    },
    { name: 'Stock Movements', href: '/inventory/stock', icon: ArrowLeftRight },
    { name: 'Purchases & Receiving', href: '/purchases', icon: ShoppingCart },
    { name: 'Suppliers', href: '/suppliers', icon: Truck },
    { name: 'Branch Transfers', href: '/inventory/transfers', icon: ArrowLeftRight },
  ]

  return (
    <div className="flex items-center gap-1.5 p-1 bg-surface-subtle border border-border rounded-2xl overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive =
          tab.href === '/inventory'
            ? location.pathname === '/inventory'
            : location.pathname.startsWith(tab.href) ||
              (tab.href === '/purchases' && location.pathname.startsWith('/inventory/purchases')) ||
              (tab.href === '/suppliers' && location.pathname.startsWith('/inventory/suppliers'))

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
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
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
