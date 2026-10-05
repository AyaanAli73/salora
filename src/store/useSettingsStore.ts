import { create } from 'zustand'
import {
  settingsService,
  BusinessProfileSettings,
} from '@/services/settingsService'
import { SecuritySettings, SystemStatusItem } from '@/types'

interface SettingsState {
  businessProfile: BusinessProfileSettings
  security: SecuritySettings
  systemStatus: SystemStatusItem[]

  // Actions
  updateBusinessProfile: (updates: Partial<BusinessProfileSettings>) => void
  updateSecurity: (updates: Partial<SecuritySettings>) => void
  terminateSession: (sessionId: string) => void
  terminateAllOtherSessions: () => void
  refreshStatus: () => void
  exportModule: (moduleKey: string) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  businessProfile: settingsService.getBusinessProfile(),
  security: settingsService.getSecuritySettings(),
  systemStatus: settingsService.getSystemStatus(),

  updateBusinessProfile: (updates) => {
    const updated = settingsService.updateBusinessProfile(updates)
    set({ businessProfile: updated })
  },

  updateSecurity: (updates) => {
    const updated = settingsService.updateSecuritySettings(updates)
    set({ security: updated })
  },

  terminateSession: (sessionId) => {
    const updated = settingsService.terminateSession(sessionId)
    set({ security: updated })
  },

  terminateAllOtherSessions: () => {
    const updated = settingsService.terminateAllOtherSessions()
    set({ security: updated })
  },

  refreshStatus: () => {
    const refreshed = settingsService.refreshSystemStatus()
    set({ systemStatus: refreshed })
  },

  exportModule: (moduleKey) => {
    settingsService.exportModuleData(moduleKey)
  },
}))
