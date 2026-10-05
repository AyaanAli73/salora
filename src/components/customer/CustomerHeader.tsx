import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Calendar,
  Compass,
  Gift,
  Award,
  FileText,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Tag,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react'
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore'
import { customerAuthService } from '@/services/customerAuthService'
import { CustomerNotificationDropdown } from './CustomerNotificationDropdown'

export const CustomerHeader: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { customer, isAuthenticated } = useCustomerAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const navLinks = [
    { label: 'Home', path: '/customer/dashboard' },
    { label: 'Book Now', path: '/customer/book' },
    { label: 'Services', path: '/customer/services' },
    { label: 'My Appointments', path: '/customer/appointments' },
    { label: 'Memberships', path: '/customer/memberships' },
    { label: 'Rewards', path: '/customer/rewards' },
    { label: 'Offers', path: '/customer/offers' },
    { label: 'Invoices', path: '/customer/invoices' },
  ]

  const handleLogout = () => {
    setProfileDropdownOpen(false)
    customerAuthService.logout()
    navigate('/customer/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-900/90 backdrop-blur-md text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link
              to="/customer/dashboard"
              className="flex items-center space-x-3 group focus-visible:ring-2 focus-visible:ring-violet-400 rounded-lg p-1"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-pink-200 bg-clip-text text-transparent">
                  SALORA
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-pink-400">
                  Customer Lounge
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Customer Navigation">
            {navLinks.map((item) => {
              const isActive =
                item.path === '/customer/dashboard'
                  ? location.pathname === '/customer/dashboard'
                  : location.pathname.startsWith(item.path)

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 ${
                    isActive
                      ? 'bg-violet-600/20 text-violet-300 font-semibold border border-violet-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Right Header Area */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Link to Salon Staff/Admin Portal */}
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-full px-3 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-violet-400"
              title="Switch to Salon Admin / Staff Management System"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>Admin Mode</span>
            </Link>

            {/* Notifications */}
            {isAuthenticated && <CustomerNotificationDropdown />}

            {/* Profile Dropdown or Login CTA */}
            {isAuthenticated && customer ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-400 transition-colors"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                  aria-label="Customer Account Menu"
                >
                  <img
                    src={customer.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'}
                    alt={customer.fullName}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-500/40"
                  />
                  <div className="hidden md:flex flex-col items-start text-left">
                    <span className="text-xs font-semibold text-slate-100 max-w-[100px] truncate">
                      {customer.firstName}
                    </span>
                    <span className="text-[10px] text-amber-300 font-medium flex items-center">
                      ★ {customer.membershipTier} Member
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" aria-hidden="true" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    role="menu"
                  >
                    <div className="px-4 py-3 border-b border-slate-800">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{customer.fullName}</p>
                      <p className="text-xs text-violet-400 truncate">{customer.email}</p>
                      <div className="mt-2 flex items-center justify-between text-xs bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/50">
                        <span className="text-slate-400">Reward Balance:</span>
                        <span className="font-bold text-amber-300 tabular-nums">
                          {customer.rewardPoints} pts
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/customer/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        role="menuitem"
                      >
                        <User className="w-4 h-4 text-violet-400" aria-hidden="true" />
                        <span>My Profile & Preferences</span>
                      </Link>
                      <Link
                        to="/customer/appointments"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        role="menuitem"
                      >
                        <Calendar className="w-4 h-4 text-pink-400" aria-hidden="true" />
                        <span>My Appointments</span>
                      </Link>
                      <Link
                        to="/customer/rewards"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        role="menuitem"
                      >
                        <Gift className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        <span>Rewards & Points</span>
                      </Link>
                      <Link
                        to="/customer/invoices"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        role="menuitem"
                      >
                        <FileText className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                        <span>Bills & Invoices</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-800 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2.5 px-4 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/customer/login"
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/customer/register"
                  className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 rounded-lg shadow-md shadow-violet-500/20 transition-all hover:scale-102"
                >
                  Join VIP
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-400"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-900/95 backdrop-blur-lg px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 gap-2 pt-2 pb-3 border-b border-slate-800">
            <Link
              to="/customer/book"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold text-sm shadow-md shadow-violet-600/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>Book Ritual</span>
            </Link>
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-medium text-sm"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Admin Switch</span>
            </Link>
          </div>

          <div className="space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5"
              >
                <span>{item.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
            ))}
          </div>

          {isAuthenticated && (
            <div className="pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="flex items-center space-x-2 text-rose-400 text-sm font-medium px-3 py-2 w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({customer?.firstName})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
