import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Wallet,
  Sliders,
  History,
  CheckCircle2,
  Calendar,
  Percent,
} from 'lucide-react'
import {
  PayrollDashboardView,
  StaffCompensationView,
  PayrollHistoryView,
} from '@/features/payroll'
import { cn } from '@/utils/cn'

type PayrollTab = 'dashboard' | 'staff' | 'history'

export const PayrollPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const getTabFromPath = (): PayrollTab => {
    const path = location.pathname.toLowerCase()
    if (path.includes('/payroll/staff')) return 'staff'
    if (path.includes('/payroll/history')) return 'history'
    const searchParams = new URLSearchParams(location.search)
    const tabParam = searchParams.get('tab')
    if (tabParam === 'staff') return 'staff'
    if (tabParam === 'history') return 'history'
    return 'dashboard'
  }

  const [activeTab, setActiveTab] = useState<PayrollTab>(getTabFromPath())

  useEffect(() => {
    setActiveTab(getTabFromPath())
  }, [location.pathname, location.search])

  const handleTabChange = (tab: PayrollTab) => {
    setActiveTab(tab)
    if (tab === 'dashboard') navigate('/payroll')
    else if (tab === 'staff') navigate('/payroll/staff')
    else if (tab === 'history') navigate('/payroll/history')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
            Staff Salary & Payroll Management
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Configure specialist compensation, deterministic commission rules, advances, and settle salary disbursements.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <nav
          className="flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-none"
          aria-label="Payroll navigation tabs"
        >
          <button
            type="button"
            onClick={() => handleTabChange('dashboard')}
            className={cn(
              'flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              activeTab === 'dashboard'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
            )}
          >
            <Wallet className="w-4 h-4" aria-hidden="true" />
            <span>Payroll Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('staff')}
            className={cn(
              'flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              activeTab === 'staff'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
            )}
          >
            <Sliders className="w-4 h-4" aria-hidden="true" />
            <span>Staff Compensation & Rules</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('history')}
            className={cn(
              'flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
            )}
          >
            <History className="w-4 h-4" aria-hidden="true" />
            <span>Payroll History & Slips</span>
          </button>
        </nav>
      </div>

      {/* Active Tab View */}
      {activeTab === 'dashboard' && <PayrollDashboardView />}
      {activeTab === 'staff' && <StaffCompensationView />}
      {activeTab === 'history' && <PayrollHistoryView />}
    </div>
  )
}
