import React from 'react'
import { Flag, X, Check, RotateCcw, Sparkles, MessageSquare, Building2, Gift, Smartphone, BarChart3 } from 'lucide-react'
import { useAllFeatureFlags } from '@/hooks/useFeatureFlag'
import { FeatureFlagKey } from '@/services/featureFlagService'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

interface FeatureFlagsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const FeatureFlagsModal: React.FC<FeatureFlagsModalProps> = ({ isOpen, onClose }) => {
  const { flags, toggleFlag, resetDefaults } = useAllFeatureFlags()
  const { addToast } = useToastStore()

  if (!isOpen) return null

  const getFlagIcon = (key: FeatureFlagKey) => {
    switch (key) {
      case 'AI':
        return <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
      case 'WhatsApp':
        return <MessageSquare className="h-5 w-5 text-emerald-500" aria-hidden="true" />
      case 'MultiBranch':
        return <Building2 className="h-5 w-5 text-amber-500" aria-hidden="true" />
      case 'Loyalty':
        return <Gift className="h-5 w-5 text-pink-500" aria-hidden="true" />
      case 'PWA':
        return <Smartphone className="h-5 w-5 text-violet-500" aria-hidden="true" />
      case 'AdvancedReports':
        return <BarChart3 className="h-5 w-5 text-blue-500" aria-hidden="true" />
    }
  }

  const handleToggle = (key: FeatureFlagKey) => {
    const newState = toggleFlag(key)
    addToast({
      title: `Feature Flag: ${key}`,
      message: `${key} is now ${newState ? 'ENABLED' : 'DISABLED'}.`,
      type: newState ? 'success' : 'warning',
    })
  }

  const handleReset = () => {
    resetDefaults()
    addToast({
      title: 'Feature Flags Reset',
      message: 'All feature flags restored to factory defaults.',
      type: 'info',
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-flags-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-2xl z-10 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Flag className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="feature-flags-title" className="text-base font-bold text-text-primary">
                Feature Flags &amp; Rollout Controls
              </h2>
              <p className="text-xs text-text-muted">
                Enable or disable experimental or tiered system capabilities.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close feature flags modal"
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-subtle hover:text-text-primary cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Flags List */}
        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {flags.map((flag) => (
            <div
              key={flag.key}
              className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-border bg-surface-subtle/50 hover:bg-surface-subtle transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 shrink-0">{getFlagIcon(flag.key)}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary">{flag.name}</span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted">
                      {flag.key}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-1 leading-snug">
                    {flag.description}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={flag.enabled}
                aria-label={`Toggle ${flag.name}`}
                onClick={() => handleToggle(flag.key)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  flag.enabled ? 'bg-primary' : 'bg-border'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                    flag.enabled ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
