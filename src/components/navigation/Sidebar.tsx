import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarCheck2,
  Users,
  Sparkles,
  UserCheck,
  PackageCheck,
  CreditCard,
  BarChart3,
  Megaphone,
  Sliders,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  X,
  Layers,
  Landmark,
  ReceiptText,
  Crown,
  Package,
  Gift,
  Star,
  Wallet,
  Globe,
  ShoppingCart,
  Truck,
  Building2,
  Brain,
  Zap,
} from 'lucide-react'
import { NAVIGATION_ITEMS, APP_VERSION } from '@/constants'
import { useUIStore } from '@/store/useUIStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useSalonStore } from '@/store/useSalonStore'
import { useToastStore } from '@/store/useToastStore'
import { ROLE_LABELS } from '@/utils/permissions'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Role } from '@/types'
import { cn } from '@/utils/cn'

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  CalendarCheck2: <CalendarCheck2 className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  Layers: <Layers className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  Users: <Users className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  Sparkles: <Sparkles className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  Crown: <Crown className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  Package: <Package className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  Gift: <Gift className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  Star: <Star className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  UserCheck: <UserCheck className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  PackageCheck: <PackageCheck className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  ShoppingCart: <ShoppingCart className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  Truck: <Truck className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  CreditCard: <CreditCard className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  Landmark: <Landmark className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  ReceiptText: <ReceiptText className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  Wallet: <Wallet className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  BarChart3: <BarChart3 className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  Megaphone: <Megaphone className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  Building2: <Building2 className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  Brain: <Brain className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  Zap: <Zap className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  Globe: <Globe className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
  Sliders: <Sliders className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />,
}

export const Sidebar: React.FC = () => {
  const { isSidebarCollapsed, toggleSidebar, isMobileSidebarOpen, setMobileSidebarOpen } = useUIStore()
  const { user, logout } = useAuthStore()
  const { salon } = useSalonStore()
  const { addToast } = useToastStore()
  const location = useLocation()
  const navigate = useNavigate()

  const currentRole: Role = 'owner'

  // Single-salon primary user: full access to navigation items
  const visibleNavItems = NAVIGATION_ITEMS

  const handleLogout = () => {
    logout()
    addToast({
      title: 'Signed Out',
      message: 'You have been signed out of your salon session.',
      type: 'info',
    })
    navigate('/login')
  }

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container — Clean Solid */}
      <aside
        aria-label="Main Navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white text-gray-600 select-none',
          'transition-[width,transform] duration-200 ease-out',
          isSidebarCollapsed ? 'w-[72px]' : 'w-[256px]',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* ─── Top Branding ─── */}
        <div className="flex min-h-[68px] items-center justify-between px-4 border-b border-gray-100 shrink-0">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-0.5"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
              <img
                src="/salora.png"
                alt="Salora"
                className="h-7 w-7 object-contain"
                width={28}
                height={28}
              />
            </div>

            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-[15px] tracking-tight text-gray-900 leading-tight" translate="no">
                  Salora
                </span>
                <span className="text-[10px] text-gray-400 truncate leading-tight font-medium">
                  Luxury Salon Management
                </span>
              </div>
            )}
          </NavLink>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close mobile menu"
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 md:hidden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Desktop Collapse toggle */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* ─── Navigation Links ─── */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 overscroll-contain" style={{ scrollbarWidth: 'thin', scrollbarColor: '#E5E7EB transparent' }}>
          <div className="space-y-0.5">
            {visibleNavItems.map((item) => {
              const isMatch =
                item.href === '/dashboard'
                  ? location.pathname === '/' || location.pathname === '/dashboard'
                  : location.pathname === item.href || location.pathname.startsWith(item.href + '/')

              // Prevent prefix collision (e.g. /appointments vs /appointments/queue)
              const hasMoreSpecificMatch = visibleNavItems.some(
                (other) =>
                  other.href !== item.href &&
                  other.href.startsWith(item.href) &&
                  (location.pathname === other.href || location.pathname.startsWith(other.href + '/'))
              )

              const isActive = isMatch && !hasMoreSpecificMatch

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  title={isSidebarCollapsed ? item.name : undefined}
                  className={cn(
                    'group relative flex items-center rounded-lg text-[13px] font-medium select-none',
                    'transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isSidebarCollapsed ? 'h-10 justify-center px-0 mx-auto w-10' : 'h-10 px-3 gap-3',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <span
                    className={cn(
                      'shrink-0 transition-colors',
                      isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                    )}
                  >
                    {ICON_MAP[item.iconName]}
                  </span>

                  {!isSidebarCollapsed && (
                    <>
                      <span className="truncate flex-1">{item.name}</span>
                      {item.badge !== undefined && (
                        <Badge
                          variant={item.badgeColor || 'primary'}
                          size="sm"
                          className={cn(
                            'font-bold tabular-nums text-[10px] px-1.5',
                            isActive ? '' : ''
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* ─── Bottom Section ─── */}
        <div className="border-t border-gray-100 bg-gray-50/50 p-3 space-y-2 shrink-0">

          {/* Profile pill */}
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-lg p-2 bg-white border border-gray-200',
              isSidebarCollapsed && 'justify-center p-1.5'
            )}
          >
            <Avatar
              name={user?.name || 'Ayaan'}
              src={user?.avatarUrl}
              size={isSidebarCollapsed ? 'sm' : 'md'}
              status="online"
            />
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
                  {user?.name || 'Ayaan'}
                </span>
                <span className="text-[10px] text-gray-400 font-medium capitalize truncate leading-tight">
                  {ROLE_LABELS[currentRole]}
                </span>
              </div>
            )}
            {!isSidebarCollapsed && (
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
                title="Sign Out"
                className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {!isSidebarCollapsed && (
            <div className="flex items-center justify-between px-2 pt-0.5 text-[10px] text-gray-300">
              <span className="font-semibold tracking-widest uppercase" translate="no">Salora</span>
              <span className="tabular-nums font-mono">{APP_VERSION}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
