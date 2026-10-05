import React, { useState, useEffect } from 'react'
import { useQueueStore } from '@/store/useQueueStore'
import {
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  Volume2,
  Scissors,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

export const QueueDisplayPage: React.FC = () => {
  const { tokens, loadTokens } = useQueueStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-refresh queue data every 5 seconds for TV screen
  useEffect(() => {
    loadTokens()
    const pollTimer = setInterval(() => {
      loadTokens()
    }, 5000)
    return () => clearInterval(pollTimer)
  }, [loadTokens])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Tokens categorisation
  const nowServingTokens = tokens.filter(
    (t) => t.status === 'IN_SERVICE' || t.status === 'CALLED'
  )
  const primaryServing = nowServingTokens[0]

  const nextTokens = tokens
    .filter((t) => t.status === 'WAITING' || t.status === 'HOLD')
    .slice(0, 4)

  const completedTokens = tokens
    .filter((t) => t.status === 'COMPLETED')
    .slice(0, 4)

  const timeFormatted = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  const dateFormatted = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen w-full bg-[#0a0d14] text-slate-100 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/10 blur-[140px] pointer-events-none" />

      {/* TOP BAR: BRANDING + CLOCK + FULLSCREEN */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/30">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-widest uppercase bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent font-sans">
              SALORA
            </h1>
            <p className="text-xs text-primary font-semibold tracking-wider uppercase">
              Luxury Salon & Spa Concierge
            </p>
          </div>
        </div>

        {/* Live Clock & Fullscreen Toggle */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight font-sans">
              {timeFormatted}
            </div>
            <div className="text-xs text-slate-400 font-medium">{dateFormatted}</div>
          </div>

          <button
            type="button"
            aria-label="Toggle Fullscreen TV Mode"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* MAIN SCREEN AREA */}
      <main className="relative z-10 my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* CENTERPIECE: NOW SERVING (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border-2 border-primary/40 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Animated Glow Halo */}
          <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />

          <div className="relative z-10 space-y-4 w-full">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm font-black tracking-widest uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              NOW SERVING
            </div>

            {primaryServing ? (
              <div className="space-y-3">
                {/* Big Token Number */}
                <div className="text-8xl sm:text-9xl lg:text-[11rem] font-black tracking-tighter text-white font-sans drop-shadow-2xl leading-none">
                  {primaryServing.displayNumber}
                </div>

                {/* Treatment & Specialist */}
                <div className="space-y-1 pt-2">
                  <p className="text-2xl sm:text-3xl font-bold text-slate-100">
                    {primaryServing.serviceName}
                  </p>
                  <p className="text-base text-primary font-medium">
                    Assigned to Specialist: <strong className="text-white font-bold">{primaryServing.staffName}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 space-y-3">
                <p className="text-5xl font-black text-slate-500">READY</p>
                <p className="text-base text-slate-400">Next client will be called shortly</p>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR: NEXT IN LINE & RECENTLY COMPLETED (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Next Tokens */}
          <div className="p-6 rounded-3xl bg-white/[0.05] border border-white/10 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-300">
                NEXT IN QUEUE
              </h2>
              <span className="text-xs font-semibold text-primary">
                {nextTokens.length} Preparing
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {nextTokens.length > 0 ? (
                nextTokens.map((t, idx) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 flex flex-col items-center justify-center text-center space-y-1 group hover:border-primary/50 transition-colors"
                  >
                    <span className="text-xs text-slate-400 uppercase font-bold">
                      Position #{idx + 1}
                    </span>
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight font-sans">
                      {t.displayNumber}
                    </span>
                    <span className="text-[11px] text-slate-300 font-medium truncate max-w-full">
                      {t.serviceName}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-6 text-center text-xs text-slate-500">
                  No upcoming clients in line.
                </div>
              )}
            </div>
          </div>

          {/* Recently Completed */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Recently Completed</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {completedTokens.length > 0 ? (
                completedTokens.map((t) => (
                  <span
                    key={t.id}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-sm tracking-tight font-sans"
                  >
                    {t.displayNumber}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">No completed sessions yet today</span>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER MESSAGE */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-white/10 text-center sm:text-left gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>Please wait comfortably in our lounge until your token number is announced.</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Customer Privacy Protected Display</span>
        </div>
      </footer>
    </div>
  )
}
