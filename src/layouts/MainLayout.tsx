import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from '@/components/navigation/Sidebar'
import { Header } from '@/components/navigation/Header'
import { MobileNav } from '@/components/navigation/MobileNav'
import { ReceptionMobileQuickActions } from '@/components/navigation/ReceptionMobileQuickActions'
import { OfflineStatusBar } from '@/components/pwa/OfflineStatusBar'
import { InstallPwaPrompt } from '@/components/pwa/InstallPwaPrompt'
import { MobilePOSModal } from '@/components/pos/MobilePOSModal'
import { MobileFastAppointmentDrawer } from '@/components/booking/MobileFastAppointmentDrawer'
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal'
import { NewAppointmentModal } from '@/components/modals/NewAppointmentModal'
import { NewClientModal } from '@/components/modals/NewClientModal'
import { AIAssistantDrawer } from '@/components/ai/AIAssistantDrawer'
import { ToastContainer } from '@/components/ui/Toast'
import { useUIStore } from '@/store/useUIStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useThemeStore } from '@/store/useThemeStore'
import { cn } from '@/utils/cn'

export const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isSidebarCollapsed, openSearch } = useUIStore()
  const { theme } = useThemeStore()
  const [isMobilePOSOpen, setIsMobilePOSOpen] = useState(false)
  const [isFastAptOpen, setIsFastAptOpen] = useState(false)

  // Initialize theme class on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
  }, [theme])

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openSearch])

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Offline Status & Sync Alert Bar */}
      <OfflineStatusBar />

      <div className="flex flex-1 min-w-0 w-full overflow-x-hidden">
        {/* Fixed Left Sidebar */}
        <Sidebar />

        {/* Main Column */}
        <div
          className={cn(
            'flex flex-col flex-1 min-w-0 w-full overflow-x-hidden transition-[padding-left] duration-200 ease-out',
            isSidebarCollapsed ? 'md:pl-20' : 'md:pl-[256px]'
          )}
        >
          {/* Sticky Header */}
          <Header />

          {/* Mobile Reception Quick Actions (Touch Strip) */}
          {user?.role === 'receptionist' && (
            <ReceptionMobileQuickActions onOpenMobilePOS={() => setIsMobilePOSOpen(true)} />
          )}

          {/* Page Content Viewport */}
          <main
            id="main-content"
            className="flex-1 w-full max-w-7xl mx-auto p-3.5 sm:p-5 lg:p-6 pb-24 md:pb-10 min-w-0 overflow-x-hidden"
          >
            <Outlet />
          </main>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <MobileNav />

      {/* Mobile Modals & Touch Drawers */}
      <MobilePOSModal
        isOpen={isMobilePOSOpen}
        onClose={() => setIsMobilePOSOpen(false)}
      />
      <MobileFastAppointmentDrawer
        isOpen={isFastAptOpen}
        onClose={() => setIsFastAptOpen(false)}
      />

      {/* Elegant PWA Install Prompt Banner */}
      <InstallPwaPrompt />

      {/* Global Modals, Drawer & Notifications */}
      <GlobalSearchModal />
      <NewAppointmentModal />
      <NewClientModal />
      <AIAssistantDrawer />
      <ToastContainer />
    </div>
  )
}
