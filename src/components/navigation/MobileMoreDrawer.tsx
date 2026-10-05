import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  X,
  PackageCheck,
  BarChart3,
  UserCheck,
  Megaphone,
  Building2,
  Brain,
  Sliders,
  Crown,
  Zap,
  Download,
  Bell,
  Camera,
  ListOrdered,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useToastStore } from '@/store/useToastStore'
import { pwaService } from '@/services/pwaService'
import { ROLE_LABELS } from '@/utils/permissions'
import { CameraScanModal } from '@/components/pwa/CameraScanModal'
import { PushNotificationModal } from '@/components/pwa/PushNotificationModal'
import { cn } from '@/utils/cn'

interface MobileMoreDrawerProps {
  isOpen: boolean
  onClose: () => void
  onOpenSyncQueue?: () => void
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({
  isOpen,
  onClose,
  onOpenSyncQueue,
}) => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { addToast } = useToastStore()

  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isPushOpen, setIsPushOpen] = useState(false)

  if (!isOpen) return null

  const handleInstallApp = async () => {
    onClose()
    const outcome = await pwaService.promptInstall()
    if (outcome === 'accepted') {
      addToast({ title: 'Salora Installed', message: 'App icon added to your home screen.', type: 'success' })
    }
  }

  const handleLogout = () => {
    logout()
    onClose()
    navigate('/login')
  }

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Salon menu and quick tools"
        className="fixed inset-0 z-50 flex flex-col justify-end md:hidden"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Bottom Sheet Container */}
        <div className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-surface p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <img src="/salora.png" alt="Salora" className="h-6 w-6 object-contain" width={24} height={24} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text-primary">More Modules &amp; Tools</h2>
                <p className="text-[11px] text-text-muted">
                  Logged in as <strong className="text-text-primary capitalize">{user?.name || 'Staff'}</strong> ({ROLE_LABELS[user?.role || 'owner']})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu sheet"
              className="rounded-xl p-1.5 text-text-muted hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Quick Utility Strip */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-surface-subtle p-2.5 text-text-primary active:scale-95 transition-transform cursor-pointer"
            >
              <Camera className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="text-[10px] font-semibold">Scan QR</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPushOpen(true)}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-surface-subtle p-2.5 text-text-primary active:scale-95 transition-transform cursor-pointer"
            >
              <Bell className="h-5 w-5 text-amber-500" aria-hidden="true" />
              <span className="text-[10px] font-semibold">Push Alerts</span>
            </button>

            <button
              type="button"
              onClick={handleInstallApp}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-surface-subtle p-2.5 text-text-primary active:scale-95 transition-transform cursor-pointer"
            >
              <Download className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              <span className="text-[10px] font-semibold">Install App</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-surface-subtle p-2.5 text-text-primary active:scale-95 transition-transform cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5 text-violet-500" aria-hidden="true" />
              )}
              <span className="text-[10px] font-semibold">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          {/* Navigation Grid */}
          <div className="mt-5 space-y-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted px-1 mb-2">
              Management &amp; Analytics
            </span>

            {[
              { to: '/inventory', label: 'Inventory & Stock', icon: PackageCheck, color: 'text-emerald-500' },
              { to: '/reports', label: 'Financial & Sales Reports', icon: BarChart3, color: 'text-blue-500' },
              { to: '/staff', label: 'Staff & Roster', icon: UserCheck, color: 'text-violet-500' },
              { to: '/memberships', label: 'Memberships & Packages', icon: Crown, color: 'text-amber-500' },
              { to: '/marketing', label: 'Marketing & Campaigns', icon: Megaphone, color: 'text-pink-500' },
              { to: '/ai-assistant', label: 'AI Business Assistant', icon: Brain, color: 'text-primary' },
              { to: '/settings/integrations', label: 'Integrations Hub', icon: Zap, color: 'text-indigo-500' },
              { to: '/settings', label: 'Salon Settings', icon: Sliders, color: 'text-slate-500' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-text-primary hover:bg-surface-subtle transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-4 w-4', item.color)} aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-muted" aria-hidden="true" />
                </Link>
              )
            })}
          </div>

          {/* Sign Out Action */}
          <div className="mt-5 pt-3 border-t border-border flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Sign Out Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Camera Scan Modal */}
      <CameraScanModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        mode="barcode"
        onCapture={(data) => {
          addToast({ title: 'Code Scanned', message: `Value: ${data.value}`, type: 'success' })
        }}
      />

      {/* Push Notification Modal */}
      <PushNotificationModal
        isOpen={isPushOpen}
        onClose={() => setIsPushOpen(false)}
      />
    </>
  )
}
