import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, Gift, Sparkles, User } from 'lucide-react'

export const CustomerMobileNav: React.FC = () => {
  const location = useLocation()

  const tabs = [
    { label: 'Home', path: '/customer/dashboard', icon: Home },
    { label: 'Bookings', path: '/customer/appointments', icon: Calendar },
    { label: 'Rewards', path: '/customer/rewards', icon: Gift },
    { label: 'Offers', path: '/customer/packages', icon: Sparkles },
    { label: 'Profile', path: '/customer/profile', icon: User },
  ]

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-[env(safe-area-inset-bottom)] shadow-2xl"
      aria-label="Customer Mobile Navigation"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive =
            tab.path === '/customer/dashboard'
              ? location.pathname === '/customer/dashboard'
              : location.pathname.startsWith(tab.path)
          const Icon = tab.icon

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center py-1 transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 ${
                isActive ? 'text-violet-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] mt-1">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
