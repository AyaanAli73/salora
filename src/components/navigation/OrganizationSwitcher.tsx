import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  ChevronDown,
  Check,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { useTenantStore } from '@/store/useTenantStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useToastStore } from '@/store/useToastStore'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

export const OrganizationSwitcher: React.FC = () => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    currentTenant,
    allTenants,
    switchTenant,
    isSupportMode,
  } = useTenantStore()
  const { user } = useAuthStore()
  const { addToast } = useToastStore()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (tenantId: string) => {
    if (tenantId === currentTenant.id) {
      setIsOpen(false)
      return
    }

    const target = allTenants.find((t) => t.id === tenantId)
    switchTenant(tenantId)
    setIsOpen(false)

    addToast({
      title: 'Switched Salon Context',
      message: `Now operating within "${target?.name}". Data isolated to this tenant.`,
      type: target?.status === 'SUSPENDED' ? 'warning' : 'success',
    })

    // Reload page or state to reflect new tenant data seamlessly
    window.dispatchEvent(new Event('tenant-changed'))
  }

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Switch salon organization"
        aria-expanded={isOpen}
        className={cn(
          'flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-2 sm:px-2.5 rounded-xl border text-xs font-semibold transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isSupportMode
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300'
            : currentTenant.status === 'SUSPENDED'
            ? 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300'
            : 'bg-surface-subtle/80 hover:bg-surface-subtle border-border text-text-primary'
        )}
      >
        <div className="w-5 h-5 rounded-lg overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center">
          {currentTenant.logo ? (
            <img
              src={currentTenant.logo}
              alt=""
              className="w-full h-full object-cover"
              width={20}
              height={20}
            />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          )}
        </div>

        <div className="hidden sm:flex flex-col text-left max-w-[90px] md:max-w-[120px] xl:max-w-[150px] truncate">
          <span className="truncate text-xs font-bold leading-tight">
            {currentTenant.name}
          </span>
          <span className="text-[10px] text-text-muted capitalize leading-none hidden 2xl:block truncate">
            {currentTenant.planId} • {currentTenant.primaryCity || 'Rajasthan'}
          </span>
        </div>

        {currentTenant.status === 'SUSPENDED' ? (
          <span className="px-1.5 py-0.2 rounded-md bg-rose-500 text-white text-[9px] font-bold uppercase tracking-wider">
            Suspended
          </span>
        ) : (
          <Badge
            variant="default"
            className="text-[9px] px-1 py-0 uppercase font-bold tracking-wider hidden 2xl:inline-flex"
          >
            {currentTenant.planId}
          </Badge>
        )}

        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-text-muted transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Available Salon Organizations"
          className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl border border-border bg-surface shadow-2xl p-2 z-50 animate-in fade-in duration-150"
        >
          <div className="px-3 py-2 border-b border-border/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-text-primary">Salon Businesses</p>
              <p className="text-[10px] text-text-muted">
                Multi-Tenant Isolated Workspaces
              </p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {allTenants.length} Salons
            </span>
          </div>

          <div className="py-1.5 max-h-64 overflow-y-auto space-y-1">
            {allTenants.map((t) => {
              const isSelected = t.id === currentTenant.id
              const isSuspended = t.status === 'SUSPENDED'

              return (
                <button
                  key={t.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelect(t.id)}
                  className={cn(
                    'w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors',
                    isSelected
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-surface-subtle border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-border">
                      {t.logo ? (
                        <img
                          src={t.logo}
                          alt=""
                          className="w-full h-full object-cover"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <Building2 className="w-4 h-4 text-text-muted" aria-hidden="true" />
                      )}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-text-primary truncate">
                          {t.name}
                        </span>
                        {isSuspended && (
                          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-text-muted capitalize">
                        {t.primaryCity} • {t.branchesCount} Branches • {t.planId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary" aria-hidden="true" />
                    )}
                    {isSuspended && (
                      <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                        SUSPENDED
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Super Admin Console Entry (Only shown to Platform Admins / Dev Mode) */}
          <div className="border-t border-border/80 pt-1.5 mt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                navigate('/super-admin')
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition-colors focus-visible:outline-none"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>Super Admin Console</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
