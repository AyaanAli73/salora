import React, { useState, useRef, useEffect } from 'react'
import { Building2, ChevronDown, Check, Globe, MapPin, Shield } from 'lucide-react'
import { useBranchStore } from '@/store/useBranchStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

export const BranchSwitcher: React.FC = () => {
  const {
    branches,
    currentBranchId,
    currentBranch,
    isAllBranches,
    switchBranch,
    getAccessibleBranches,
  } = useBranchStore()
  const { user } = useAuthStore()
  const { addToast } = useToastStore()

  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const userRole = user?.role || 'owner'
  const accessibleBranches = getAccessibleBranches(userRole, user?.branchIds)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectBranch = (branchId: string, branchName: string) => {
    switchBranch(branchId)
    setIsOpen(false)
    addToast({
      title: 'Active Branch Switched',
      message: `Operational workspace switched to ${branchName}.`,
      type: 'info',
    })
  }

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin'

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Switcher Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Switch salon branch"
        aria-expanded={isOpen}
        className={cn(
          'flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-2 sm:px-2.5 rounded-xl border border-border bg-surface hover:bg-surface-subtle',
          'transition-[border-color,background-color,box-shadow] duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isOpen && 'border-primary ring-2 ring-primary/20'
        )}
      >
        <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-primary/10 text-primary shrink-0">
          {isAllBranches ? (
            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </div>

        <div className="hidden sm:flex flex-col text-left">
          <span className="text-[9px] uppercase font-bold tracking-wider text-text-muted leading-none hidden 2xl:block">
            Current Branch
          </span>
          <span className="text-xs font-bold text-text-primary leading-tight flex items-center gap-1.5 truncate max-w-[80px] md:max-w-[110px] xl:max-w-[140px]">
            {isAllBranches ? 'All Branches' : currentBranch?.name || 'Salora Jodhpur'}
          </span>
        </div>

        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-text-muted transition-transform duration-200 shrink-0 ml-0.5',
            isOpen && 'rotate-180 text-primary'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 rounded-2xl border border-border bg-surface shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Note */}
          <div className="px-3 py-2 border-b border-border/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-text-primary">Salon Locations</p>
              <p className="text-[11px] text-text-muted">
                {isOwnerOrAdmin
                  ? 'All network locations unlocked'
                  : `Assigned as ${userRole}`}
              </p>
            </div>
            {isOwnerOrAdmin && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                <Shield className="h-3 w-3" aria-hidden="true" />
                Multi-Branch
              </span>
            )}
          </div>

          <div className="py-1.5 space-y-1 max-h-72 overflow-y-auto">
            {/* Option: All Branches (Owner / Admin only) */}
            {isOwnerOrAdmin && (
              <button
                type="button"
                role="menuitem"
                onClick={() => handleSelectBranch('all', 'All Branches (Consolidated)')}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                  isAllBranches
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-text-primary hover:bg-surface-subtle'
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                      isAllBranches
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-subtle text-text-muted'
                    )}
                  >
                    <Globe className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold leading-tight truncate">All Branches</p>
                    <p className="text-[10px] text-text-muted leading-tight">
                      Consolidated cross-branch view
                    </p>
                  </div>
                </div>
                {isAllBranches && <Check className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />}
              </button>
            )}

            {/* Individual Branches */}
            {branches.map((b) => {
              const isSelected = !isAllBranches && currentBranchId === b.id
              const isAccessible = accessibleBranches.some((ab) => ab.id === b.id)

              return (
                <button
                  key={b.id}
                  type="button"
                  role="menuitem"
                  disabled={!isAccessible}
                  onClick={() => handleSelectBranch(b.id, b.name)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : isAccessible
                      ? 'text-text-primary hover:bg-surface-subtle'
                      : 'opacity-40 cursor-not-allowed text-text-muted'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                        isSelected
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-surface-subtle text-text-muted'
                      )}
                    >
                      <Building2 className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold leading-tight truncate">{b.name}</p>
                        <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-border text-text-secondary">
                          {b.code}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted leading-tight flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {b.city}, {b.state}
                        </span>
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0 ml-2" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Quick link to Branch Settings */}
          {isOwnerOrAdmin && (
            <div className="pt-1.5 border-t border-border/80 mt-1">
              <a
                href="/settings/branches"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-primary hover:underline focus-visible:outline-none"
              >
                Manage Network Locations →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
