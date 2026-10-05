import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarCheck2,
  Users,
  CreditCard,
  Layers,
  Plus,
  Menu,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'
import { MobileMoreDrawer } from './MobileMoreDrawer'
import { cn } from '@/utils/cn'

export const MobileNav: React.FC = () => {
  const { user } = useAuthStore()
  const { openNewAppointmentModal } = useUIStore()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const currentRole = user?.role || 'owner'
  const isReceptionist = currentRole === 'receptionist'

  return (
    <>
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-surface/95 backdrop-blur-lg border-t border-border px-2 py-2 flex items-center justify-around shadow-2xl pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        {/* 1. Home */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors min-w-[56px]',
              isActive ? 'text-primary font-bold' : 'text-text-muted hover:text-text-primary'
            )
          }
        >
          <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px]">Home</span>
        </NavLink>

        {/* 2. Queue (Receptionist) or Appointments (Admin) */}
        {isReceptionist ? (
          <NavLink
            to="/appointments/queue"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors min-w-[56px]',
                isActive ? 'text-primary font-bold' : 'text-text-muted hover:text-text-primary'
              )
            }
          >
            <Layers className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px]">Queue</span>
          </NavLink>
        ) : (
          <NavLink
            to="/appointments"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors min-w-[56px]',
                isActive ? 'text-primary font-bold' : 'text-text-muted hover:text-text-primary'
              )
            }
          >
            <CalendarCheck2 className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px]">Appointments</span>
          </NavLink>
        )}

        {/* 3. Floating Quick Action Button */}
        <button
          type="button"
          onClick={openNewAppointmentModal}
          aria-label="Book new appointment"
          className="-mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-accent text-white shadow-glow-primary/50 border-2 border-surface active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer shrink-0"
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* 4. Appointments (Receptionist) or Clients (Admin) */}
        {isReceptionist ? (
          <NavLink
            to="/appointments"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors min-w-[56px]',
                isActive ? 'text-primary font-bold' : 'text-text-muted hover:text-text-primary'
              )
            }
          >
            <CalendarCheck2 className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px]">Appointments</span>
          </NavLink>
        ) : (
          <NavLink
            to="/clients"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors min-w-[56px]',
                isActive ? 'text-primary font-bold' : 'text-text-muted hover:text-text-primary'
              )
            }
          >
            <Users className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px]">Clients</span>
          </NavLink>
        )}

        {/* 5. Billing */}
        <NavLink
          to="/sales"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 p-1 rounded-xl transition-colors min-w-[56px]',
              isActive ? 'text-primary font-bold' : 'text-text-muted hover:text-text-primary'
            )
          }
        >
          <CreditCard className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px]">Billing</span>
        </NavLink>

        {/* 6. More (Opens Full Drawer) */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          aria-label="Open more tools and settings"
          className="flex flex-col items-center gap-1 p-1 rounded-xl text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none cursor-pointer min-w-[56px]"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px]">More</span>
        </button>
      </nav>

      {/* More Bottom Sheet Drawer */}
      <MobileMoreDrawer
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
      />
    </>
  )
}
