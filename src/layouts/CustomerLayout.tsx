import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { CustomerHeader } from '@/components/customer/CustomerHeader'
import { CustomerMobileNav } from '@/components/customer/CustomerMobileNav'
import { CustomerMobileQuickActions } from '@/components/customer/CustomerMobileQuickActions'
import { OfflineStatusBar } from '@/components/pwa/OfflineStatusBar'
import { InstallPwaPrompt } from '@/components/pwa/InstallPwaPrompt'
import { ToastContainer } from '@/components/ui/Toast'
import { Sparkles, Phone, MapPin, Clock, Heart, Shield } from 'lucide-react'

export const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-pink-500/30 selection:text-pink-200">
      {/* Offline Status & Sync Alert Bar */}
      <OfflineStatusBar />

      {/* Subtle luxury ambient glows */}
      <div
        className="fixed top-0 left-1/4 -z-10 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="fixed top-1/3 right-10 -z-10 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-10 left-10 -z-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Customer Header */}
      <CustomerHeader />

      {/* Mobile Customer Touch Quick Actions (Book, View Booking, Rewards) */}
      <CustomerMobileQuickActions />

      {/* Main Viewport */}
      <main id="customer-main" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 lg:pb-12 min-w-0">
        <Outlet />
      </main>

      {/* Customer Mobile Bottom Navigation */}
      <CustomerMobileNav />

      {/* Install Salora PWA Prompt Banner */}
      <InstallPwaPrompt />

      {/* Luxury Customer Lounge Footer */}
      <footer className="hidden lg:block border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-sm mt-auto text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <span className="text-sm font-bold text-white tracking-wide">SALORA Luxury Salon</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-xs">
                Premium bespoke beauty, haircare, and aesthetic wellness designed for an elevated personal experience.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Boutique Hours</h4>
              <div className="flex items-start space-x-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" aria-hidden="true" />
                <span>Mon – Sun: 09:30 AM – 09:00 PM</span>
              </div>
              <p className="text-[11px] text-slate-500">Valet parking & VIP styling suites available.</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Concierge Desk</h4>
              <div className="flex items-center space-x-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-pink-400 shrink-0" aria-hidden="true" />
                <span>+91 98765 43210 / (022) 2640-GLOW</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                <span>Emerald Heights, Linking Rd, Bandra West, Mumbai</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Self-Service Portals</h4>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link to="/customer/services" className="hover:text-white transition-colors">
                    Service Catalog & Rituals
                  </Link>
                </li>
                <li>
                  <Link to="/customer/memberships" className="hover:text-white transition-colors">
                    VIP Club Membership Tiers
                  </Link>
                </li>
                <li>
                  <Link to="/customer/rewards" className="hover:text-white transition-colors">
                    Loyalty Points & Rewards
                  </Link>
                </li>
                <li>
                  <Link to="/customer/invoices" className="hover:text-white transition-colors">
                    Official Invoices & Tax Slips
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px]">
            <p>© {new Date().getFullYear()} SALORA Salon Systems. Client Data Privacy & Strict Encryption Protected.</p>
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
              <span className="flex items-center space-x-1">
                <Shield className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                <span>256-Bit SSL Secure</span>
              </span>
              <span className="flex items-center space-x-1">
                <Heart className="w-3 h-3 text-pink-400" aria-hidden="true" />
                <span>Crafted for Beauty Enthusiasts</span>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Shared Toast Container */}
      <ToastContainer />
    </div>
  )
}
