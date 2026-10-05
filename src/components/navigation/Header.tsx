import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  User,
  Sliders,
  LogOut,
  Calendar,
  Sparkles,
  Plus,
  Camera,
} from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useAIStore } from '@/store/useAIStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useToastStore } from '@/store/useToastStore'
import { NotificationCenterDropdown } from './NotificationCenterDropdown'
import { CameraScanModal } from '@/components/pwa/CameraScanModal'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const {
    openSearch,
    toggleMobileSidebar,
    openNewAppointmentModal,
  } = useUIStore()
  const { openDrawer: openAIDrawer } = useAIStore()
  const { theme, toggleTheme } = useThemeStore()
  const { user, logout } = useAuthStore()

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isScanOpen, setIsScanOpen] = useState(false)
  const { addToast } = useToastStore()
  const profileRef = useRef<HTMLDivElement>(null)

  const todayFormatted = formatDate(new Date(), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 min-h-[62px] border-b border-border bg-surface/90 backdrop-blur-md px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 sm:gap-3 max-w-full overflow-hidden">
      {/* Left: Mobile hamburger & Global Search Trigger */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-[120px] max-w-md">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          aria-label="Open mobile navigation menu"
          className="flex md:hidden p-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Global Search Button */}
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search clients, appointments, services, products"
          className={cn(
            'flex items-center justify-between w-full h-9 sm:h-9.5 px-3 rounded-xl border border-border bg-surface-subtle/50 text-text-muted hover:border-border-strong hover:bg-surface-subtle',
            'transition-[border-color,background-color,box-shadow] duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-medium text-text-muted truncate">
              Search clients, appointments, services…
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 shrink-0 ml-1.5">
            <kbd className="inline-flex items-center gap-0.5 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[9px] font-semibold text-text-secondary shadow-xs">
              <span className="text-[10px]">Ctrl</span> K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Ask Salora AI Button */}
        <button
          type="button"
          onClick={() => openAIDrawer()}
          className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-primary/10 via-teal-500/10 to-primary/10 border border-primary/25 hover:border-primary text-primary hover:bg-primary/15 transition-all text-xs font-bold shadow-2xs group shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary group-hover:rotate-12 transition-transform shrink-0" />
          <span className="hidden sm:inline">Ask AI</span>
          <span className="hidden xl:inline"> Salora</span>
        </button>

        {/* Quick Booking Action Button - on wide screens only to prevent header clutter */}
        <Button
          variant="primary"
          size="sm"
          onClick={openNewAppointmentModal}
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          className="hidden 2xl:inline-flex h-9 shrink-0 text-xs"
        >
          Book Appointment
        </Button>

        {/* Date Display - on 2xl screens only */}
        <div className="hidden 2xl:flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-surface-subtle text-xs font-semibold text-text-secondary border border-border/60 shrink-0">
          <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span className="tabular-nums">{todayFormatted}</span>
        </div>

        {/* Action icons row */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Camera / Barcode Scanner */}
          <button
            type="button"
            onClick={() => setIsScanOpen(true)}
            title="Scan product barcode or upload receipt photo"
            aria-label="Scan barcode or capture photo"
            className="h-8.5 w-8.5 sm:h-9 sm:w-9 flex items-center justify-center rounded-xl border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer shrink-0"
          >
            <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" aria-hidden="true" />
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="h-8.5 w-8.5 sm:h-9 sm:w-9 flex items-center justify-center rounded-xl border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500" aria-hidden="true" />
            )}
          </button>

          {/* Notifications Center */}
          <NotificationCenterDropdown />
        </div>

        {/* User Profile Dropdown */}
        <div className="relative pl-1 border-l border-border shrink-0" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-label="User account menu"
            aria-expanded={isProfileOpen}
            className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-xl hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Avatar name={user?.name || 'User'} src={user?.avatarUrl} size="sm" status="online" />
            <div className="hidden 2xl:flex flex-col text-left">
              <span className="text-xs font-bold text-text-primary leading-tight truncate max-w-[90px]">
                {user?.name || 'Ayaan'}
              </span>
              <span className="text-[10px] font-medium text-text-muted capitalize">
                {user?.role || 'owner'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-text-muted hidden sm:inline-block shrink-0" aria-hidden="true" />
          </button>

          {isProfileOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-surface shadow-2xl p-2 z-50 animate-in fade-in duration-150"
            >
              <div className="px-3 py-2 border-b border-border/80">
                <p className="text-xs font-bold text-text-primary truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-text-muted truncate">{user?.email || 'user@salon.com'}</p>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-text-primary hover:bg-surface-subtle transition-colors focus-visible:outline-none"
                >
                  <User className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  <span>My Profile</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsProfileOpen(false)
                    navigate('/settings')
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-text-primary hover:bg-surface-subtle transition-colors focus-visible:outline-none"
                >
                  <Sliders className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  <span>Salon Settings</span>
                </button>
              </div>

              <div className="border-t border-border/80 pt-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsProfileOpen(false)
                    logout()
                    navigate('/login')
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-danger hover:bg-danger-light hover:text-danger-fg transition-colors focus-visible:outline-none"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Camera Barcode / Photo Scanner Modal */}
      <CameraScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        mode="barcode"
        onCapture={(data) => {
          addToast({
            title: 'Scan Successful',
            message: `Captured barcode: ${data.value}`,
            type: 'success',
          })
        }}
      />
    </header>
  )
}
