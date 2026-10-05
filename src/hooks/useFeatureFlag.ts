import { useState, useEffect } from 'react'
import { featureFlagService, FeatureFlagKey } from '@/services/featureFlagService'

export function useFeatureFlag(flagKey: FeatureFlagKey): boolean {
  const [enabled, setEnabled] = useState<boolean>(featureFlagService.isEnabled(flagKey))

  useEffect(() => {
    const unsubscribe = featureFlagService.subscribe(() => {
      setEnabled(featureFlagService.isEnabled(flagKey))
    })
    return unsubscribe
  }, [flagKey])

  return enabled
}

export function useAllFeatureFlags() {
  const [flags, setFlags] = useState(featureFlagService.getAllFlags())

  useEffect(() => {
    const unsubscribe = featureFlagService.subscribe(() => {
      setFlags(featureFlagService.getAllFlags())
    })
    return unsubscribe
  }, [])

  return {
    flags,
    toggleFlag: (key: FeatureFlagKey) => featureFlagService.toggleFlag(key),
    setFlag: (key: FeatureFlagKey, enabled: boolean) => featureFlagService.setFlag(key, enabled),
    resetDefaults: () => featureFlagService.resetDefaults(),
  }
}
