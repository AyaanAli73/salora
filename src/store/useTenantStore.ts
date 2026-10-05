import { create } from 'zustand'
import { Tenant, OrganizationMember, SupportSession } from '@/types'
import { tenantService } from '@/services/tenantService'

interface TenantState {
  currentTenantId: string
  currentTenant: Tenant
  allTenants: Tenant[]
  userMemberships: OrganizationMember[]
  activeSupportSession: SupportSession | null
  isSupportMode: boolean
  isSuspended: boolean

  // Actions
  switchTenant: (tenantId: string) => void
  enterSupportMode: (tenantId: string, reason: string, ticketNumber?: string) => SupportSession
  exitSupportMode: () => void
  refreshTenants: () => void
}

export const useTenantStore = create<TenantState>((set, get) => {
  const currentId = tenantService.getCurrentTenantId()
  const currentTenant = tenantService.getCurrentTenant()
  const allTenants = tenantService.getAllTenants()
  const userMemberships = tenantService.getMembershipsForUser('user-1')
  const activeSupportSession = tenantService.getActiveSupportSession()

  return {
    currentTenantId: currentId,
    currentTenant,
    allTenants,
    userMemberships,
    activeSupportSession,
    isSupportMode: Boolean(activeSupportSession),
    isSuspended: currentTenant.status === 'SUSPENDED',

    switchTenant: (tenantId: string) => {
      tenantService.setCurrentTenantId(tenantId)
      const updatedTenant = tenantService.getTenantById(tenantId) || tenantService.getCurrentTenant()
      set({
        currentTenantId: tenantId,
        currentTenant: updatedTenant,
        isSuspended: updatedTenant.status === 'SUSPENDED',
      })
    },

    enterSupportMode: (tenantId: string, reason: string, ticketNumber?: string) => {
      const session = tenantService.startSupportSession(tenantId, reason, ticketNumber)
      const targetTenant = tenantService.getTenantById(tenantId) || tenantService.getCurrentTenant()
      set({
        currentTenantId: tenantId,
        currentTenant: targetTenant,
        activeSupportSession: session,
        isSupportMode: true,
        isSuspended: targetTenant.status === 'SUSPENDED',
      })
      return session
    },

    exitSupportMode: () => {
      tenantService.endSupportSession()
      const restoredTenant = tenantService.getCurrentTenant()
      set({
        activeSupportSession: null,
        isSupportMode: false,
        currentTenantId: restoredTenant.id,
        currentTenant: restoredTenant,
        isSuspended: restoredTenant.status === 'SUSPENDED',
      })
    },

    refreshTenants: () => {
      const all = tenantService.getAllTenants()
      const current = tenantService.getCurrentTenant()
      const session = tenantService.getActiveSupportSession()
      set({
        allTenants: all,
        currentTenant: current,
        activeSupportSession: session,
        isSupportMode: Boolean(session),
        isSuspended: current.status === 'SUSPENDED',
      })
    },
  }
})
