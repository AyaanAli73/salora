import React, { useEffect } from 'react'
import { useQueueStore } from '@/store/useQueueStore'
import { Volume2, X, Sparkles, CheckCircle2, User } from 'lucide-react'

export const CallingAnnouncementBanner: React.FC = () => {
  const { callingAnnouncement, dismissCallingAnnouncement } = useQueueStore()

  useEffect(() => {
    if (!callingAnnouncement) return
    const timer = setTimeout(() => {
      dismissCallingAnnouncement()
    }, 6000)
    return () => clearTimeout(timer)
  }, [callingAnnouncement, dismissCallingAnnouncement])

  if (!callingAnnouncement) return null

  const { token } = callingAnnouncement

  return (
    <aside
      aria-label="Calling announcement"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-zinc-950 text-white p-5 rounded-2xl shadow-2xl border-2 border-primary/50 animate-in fade-in slide-in-from-bottom-5 duration-300 backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center animate-bounce">
            <Volume2 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
              NOW CALLING TO STATION
            </span>
            <h4 className="text-2xl font-black tracking-tight font-sans text-white">
              {token.displayNumber}
            </h4>
          </div>
        </div>

        <button
          type="button"
          aria-label="Close calling announcement"
          onClick={dismissCallingAnnouncement}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-1">
        <p className="text-sm font-bold text-zinc-100">{token.clientName}</p>
        <p className="text-xs text-zinc-400">
          {token.serviceName} • Specialist:{' '}
          <strong className="text-zinc-200">{token.staffName}</strong>
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800">
        <span>Please proceed to styling station</span>
        <span className="text-emerald-400 font-semibold flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Chime Played
        </span>
      </div>
    </aside>
  )
}
