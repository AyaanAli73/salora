import React, { useState, useEffect } from 'react'
import { Download, X, Share2, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react'
import { pwaService } from '@/services/pwaService'

const DISMISS_KEY = 'salora_pwa_dismissed_until'
const COOLDOWN_DAYS = 7

interface InstallPwaPromptProps {
  forceShow?: boolean
  onCloseForce?: () => void
}

export const InstallPwaPrompt: React.FC<InstallPwaPromptProps> = ({ forceShow, onCloseForce }) => {
  const [canInstall, setCanInstall] = useState(false)
  const [isDismissed, setIsDismissed] = useState(true)
  const [isIOS, setIsIOS] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)

  useEffect(() => {
    // Standalone check: already installed
    if (pwaService.isStandalone()) {
      setIsDismissed(true)
      return
    }

    setIsIOS(pwaService.isIOS())

    // Cooldown check
    const dismissedUntil = localStorage.getItem(DISMISS_KEY)
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      setIsDismissed(true)
    } else {
      setIsDismissed(false)
    }

    const unsub = pwaService.subscribeInstallChange((installable) => {
      setCanInstall(installable)
    })
    return unsub
  }, [])

  const handleDismiss = () => {
    const cooldownMs = Date.now() + 1000 * 60 * 60 * 24 * COOLDOWN_DAYS
    localStorage.setItem(DISMISS_KEY, String(cooldownMs))
    setIsDismissed(true)
    if (onCloseForce) onCloseForce()
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide(true)
      return
    }

    const outcome = await pwaService.promptInstall()
    if (outcome === 'accepted' || outcome === 'dismissed') {
      handleDismiss()
    }
  }

  // Should we render?
  const shouldRender = forceShow || (!isDismissed && (canInstall || isIOS))
  if (!shouldRender) return null

  return (
    <aside
      aria-label="Install Salora Progressive Web App"
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 rounded-2xl border border-primary/20 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-primary/30 dark:bg-gray-900/95 transition-all animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-accent text-white shadow-lg shadow-primary/20">
          <img src="/salora.png" alt="Salora" className="h-8 w-8 object-contain" width={32} height={32} />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-slate-900">
            ★
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight flex items-center gap-1.5">
              <span>Install Salora</span>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded-full">
                App
              </span>
            </h3>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 leading-snug">
            Add to home screen for fast offline appointment viewing, instant alerts, and smooth touch interactions.
          </p>

          {/* iOS Safari Installation Guide */}
          {showIosGuide && isIOS ? (
            <div className="mt-3 rounded-xl bg-violet-50 p-2.5 text-xs text-violet-900 dark:bg-violet-950/40 dark:text-violet-200 space-y-1.5 border border-violet-200/60 dark:border-violet-800/40">
              <div className="font-semibold flex items-center gap-1">
                <span>To install on iPhone / iPad:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-1">
                  1. Tap the <Share2 className="h-3 w-3 inline text-primary" /> <strong>Share</strong> icon below
                </li>
                <li className="flex items-center gap-1">
                  2. Scroll down &amp; tap <PlusSquare className="h-3 w-3 inline text-primary" /> <strong>Add to Home Screen</strong>
                </li>
              </ol>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Install App</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                Not Now
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
