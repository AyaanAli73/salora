/**
 * Feature Flag Service
 * Supports gradual rollout and progressive activation of major platform features:
 * - AI
 * - WhatsApp
 * - MultiBranch
 * - Loyalty
 * - PWA
 * - AdvancedReports
 */

export type FeatureFlagKey =
  | 'AI'
  | 'WhatsApp'
  | 'MultiBranch'
  | 'Loyalty'
  | 'PWA'
  | 'AdvancedReports'

export interface FeatureFlagConfig {
  key: FeatureFlagKey
  name: string
  description: string
  category: 'core' | 'communication' | 'intelligence' | 'enterprise'
  enabled: boolean
  defaultState: boolean
}

const STORAGE_KEY = 'SALORA_feature_flags_v1'

const DEFAULT_FLAGS: Record<FeatureFlagKey, FeatureFlagConfig> = {
  AI: {
    key: 'AI',
    name: 'Salora AI Intelligence',
    description: 'Autonomous assistant, conversational scheduling, business diagnostics, and predictive insights.',
    category: 'intelligence',
    enabled: true,
    defaultState: true,
  },
  WhatsApp: {
    key: 'WhatsApp',
    name: 'WhatsApp Business API',
    description: 'Instant booking confirmations, appointment reminders, and digital PDF receipts via WhatsApp.',
    category: 'communication',
    enabled: true,
    defaultState: true,
  },
  MultiBranch: {
    key: 'MultiBranch',
    name: 'Enterprise Multi-Branch',
    description: 'Multi-location switching, cross-branch inventory transfers, and consolidated headquarters reporting.',
    category: 'enterprise',
    enabled: true,
    defaultState: true,
  },
  Loyalty: {
    key: 'Loyalty',
    name: 'Client Loyalty & Rewards',
    description: 'Points accumulation, VIP tiers, redeemable rewards, and package wallet balances.',
    category: 'core',
    enabled: true,
    defaultState: true,
  },
  PWA: {
    key: 'PWA',
    name: 'Progressive Web App (PWA)',
    description: 'Installable mobile app prompt, offline cache fallback, and background sync queue.',
    category: 'core',
    enabled: true,
    defaultState: true,
  },
  AdvancedReports: {
    key: 'AdvancedReports',
    name: 'Advanced Business Reports',
    description: 'Staff commission drilldowns, tax settlement spreadsheets, inventory valuation, and CSV export.',
    category: 'enterprise',
    enabled: true,
    defaultState: true,
  },
}

class FeatureFlagService {
  private flags: Record<FeatureFlagKey, FeatureFlagConfig> = { ...DEFAULT_FLAGS }
  private listeners: Array<() => void> = []

  constructor() {
    this.load()
  }

  private load() {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const storedStates = JSON.parse(raw) as Partial<Record<FeatureFlagKey, boolean>>
        for (const [key, enabled] of Object.entries(storedStates)) {
          const flagKey = key as FeatureFlagKey
          if (this.flags[flagKey]) {
            this.flags[flagKey].enabled = Boolean(enabled)
          }
        }
      }
    } catch {
      // Use defaults
    }
  }

  private persist() {
    if (typeof window === 'undefined') return
    try {
      const states: Partial<Record<FeatureFlagKey, boolean>> = {}
      for (const [key, config] of Object.entries(this.flags)) {
        states[key as FeatureFlagKey] = config.enabled
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(states))
    } catch {
      // Storage unavailable
    }
    this.notify()
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach((l) => l())
  }

  public isEnabled(key: FeatureFlagKey): boolean {
    return Boolean(this.flags[key]?.enabled)
  }

  public setFlag(key: FeatureFlagKey, enabled: boolean): void {
    if (this.flags[key]) {
      this.flags[key].enabled = enabled
      this.persist()
    }
  }

  public toggleFlag(key: FeatureFlagKey): boolean {
    if (this.flags[key]) {
      this.flags[key].enabled = !this.flags[key].enabled
      this.persist()
      return this.flags[key].enabled
    }
    return false
  }

  public getAllFlags(): FeatureFlagConfig[] {
    return Object.values(this.flags)
  }

  public resetDefaults(): void {
    for (const [key, def] of Object.entries(DEFAULT_FLAGS)) {
      this.flags[key as FeatureFlagKey] = { ...def }
    }
    this.persist()
  }
}

export const featureFlagService = new FeatureFlagService()
