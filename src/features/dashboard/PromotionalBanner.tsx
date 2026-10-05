import React from 'react'
import { Sparkles, ArrowRight, Crown, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/store/useUIStore'

export const PromotionalBanner: React.FC = () => {
  const { openNewAppointmentModal } = useUIStore()

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, #0F0A2E 0%, #1A1145 25%, #2D1B69 50%, #1F1250 75%, #150D35 100%)',
      }}
    >
      {/* Animated gradient orbs */}
      <div
        className="absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl pointer-events-none opacity-60"
        aria-hidden="true"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(168,85,247,0.15) 50%, transparent 70%)' }}
      />
      <div
        className="absolute left-1/4 -bottom-16 h-56 w-56 rounded-full blur-3xl pointer-events-none opacity-40"
        aria-hidden="true"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.35) 0%, rgba(219,39,119,0.1) 50%, transparent 70%)' }}
      />
      <div
        className="absolute right-1/3 top-1/4 h-32 w-32 rounded-full blur-2xl pointer-events-none opacity-30"
        aria-hidden="true"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)' }}
      />

      {/* Glass mesh overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Decorative flowing curves */}
      <svg
        className="absolute right-0 top-0 h-full w-2/5 opacity-15 pointer-events-none"
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M100 0C160 80 220 120 300 100V300H0V200C40 140 80 60 100 0Z"
          fill="url(#promo-grad-1)"
        />
        <path
          d="M180 0C220 100 260 200 320 250V300H140V180C150 100 165 40 180 0Z"
          fill="url(#promo-grad-2)"
        />
        <defs>
          <linearGradient id="promo-grad-1" x1="0" y1="0" x2="300" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EC4899" stopOpacity="0.6" />
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="promo-grad-2" x1="100" y1="0" x2="320" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A855F7" stopOpacity="0.5" />
            <stop offset="1" stopColor="#6366F1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-5">
        <div>
          {/* Glass badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(251,191,36,0.9)',
            }}
          >
            <Crown className="h-3.5 w-3.5" aria-hidden="true" />
            <span>SALORA Signature Experience</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-white leading-tight">
            Look Good{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #F9A8D4, #C4B5FD, #FDE68A)' }}
            >
              Feel Better
            </span>
          </h2>

          <p className="mt-2.5 text-sm text-white/50 max-w-md leading-relaxed">
            Delight your salon guests with premium hair spa treatments,
            organic facials, and personalized beauty care.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openNewAppointmentModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
            style={{
              background: 'linear-gradient(135deg, #EC4899, #D946EF)',
              boxShadow: '0 0 24px rgba(236,72,153,0.3), 0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Book Promo Package
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="h-3 w-3 text-amber-400 fill-amber-400"
                aria-hidden="true"
              />
            ))}
            <span className="text-[11px] text-white/40 font-medium ml-1">
              Trusted by 500+ salons
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
