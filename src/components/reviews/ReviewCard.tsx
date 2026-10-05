import React from 'react'
import { Star, CheckCircle, Sparkles, MessageCircle, ShieldCheck } from 'lucide-react'
import { Review } from '@/types'
import { cn } from '@/utils/cn'

export interface ReviewCardProps {
  review: Review
  className?: string
  showCategories?: boolean
  showStaff?: boolean
}

/**
 * Sanitizes customer name to protect privacy on public booking pages.
 * e.g. "Seraphina Laurent" -> "Seraphina L." or "Julian" -> "Julian M."
 */
export function formatPublicClientName(fullName?: string): string {
  if (!fullName || !fullName.trim()) return 'Verified Guest'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const firstName = parts[0]
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase()
  return `${firstName} ${lastInitial}.`
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  className,
  showCategories = true,
  showStaff = true,
}) => {
  const displayName = formatPublicClientName(review.clientName)
  const ratingValue = Math.min(5, Math.max(1, Math.round(review.rating)))

  // Category ratings pills if available
  const hasCategories =
    showCategories &&
    review.categories &&
    (review.categories.serviceQuality ||
      review.categories.staff ||
      review.categories.cleanliness ||
      review.categories.value)

  return (
    <div
      className={cn(
        'group relative rounded-2xl bg-surface border border-border/80 hover:border-primary/40 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4',
        className
      )}
    >
      <div className="space-y-3.5">
        {/* Header: Rating, Service & Verified Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Star rating */}
          <div
            className="flex items-center gap-1 text-amber-400"
            aria-label={`${review.rating} out of 5 stars`}
          >
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  'w-4 h-4',
                  s <= ratingValue
                    ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                    : 'text-border fill-transparent'
                )}
                aria-hidden="true"
              />
            ))}
            <span className="ml-1 text-xs font-bold text-text-primary tabular-nums">
              {review.rating.toFixed(1)}
            </span>
          </div>

          {/* Service badge */}
          {review.serviceName && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3 h-3 text-primary" aria-hidden="true" />
              <span className="truncate max-w-[180px]">{review.serviceName}</span>
            </span>
          )}
        </div>

        {/* Comment */}
        <p className="text-sm text-text-secondary leading-relaxed font-normal">
          {review.comment}
        </p>

        {/* Optional Category Pills */}
        {hasCategories && (
          <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-text-muted">
            {review.categories?.serviceQuality && (
              <span className="px-2 py-0.5 rounded-md bg-surface-subtle border border-border/60">
                Service: <strong className="text-text-primary tabular-nums">{review.categories.serviceQuality}/5</strong>
              </span>
            )}
            {review.categories?.staff && (
              <span className="px-2 py-0.5 rounded-md bg-surface-subtle border border-border/60">
                Staff: <strong className="text-text-primary tabular-nums">{review.categories.staff}/5</strong>
              </span>
            )}
            {review.categories?.cleanliness && (
              <span className="px-2 py-0.5 rounded-md bg-surface-subtle border border-border/60">
                Cleanliness: <strong className="text-text-primary tabular-nums">{review.categories.cleanliness}/5</strong>
              </span>
            )}
            {review.categories?.value && (
              <span className="px-2 py-0.5 rounded-md bg-surface-subtle border border-border/60">
                Value: <strong className="text-text-primary tabular-nums">{review.categories.value}/5</strong>
              </span>
            )}
          </div>
        )}

        {/* Salon Official Reply */}
        {review.reply && (
          <div className="mt-3 rounded-xl bg-primary/5 border border-primary/15 p-3 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Response from {review.reply.staffName || 'Salon Team'}</span>
            </div>
            <p className="text-text-secondary italic">
              “{review.reply.text}”
            </p>
          </div>
        )}
      </div>

      {/* Footer: Public Customer Name & Date (Private data stripped) */}
      <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-2">
          {/* Avatar or Initials placeholder */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-accent text-white font-bold flex items-center justify-center text-[10px] uppercase shadow-xs">
            {displayName.charAt(0)}
          </div>
          <span className="font-semibold text-text-primary">{displayName}</span>
          {review.verifiedVisit !== false && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
              title="Verified Salon Visit"
            >
              <CheckCircle className="w-3 h-3 text-emerald-500 fill-emerald-500/20" aria-hidden="true" />
              <span>Verified</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showStaff && review.staffName && (
            <span className="hidden sm:inline-block text-[11px] text-text-muted">
              by <span className="font-medium text-text-secondary">{review.staffName}</span>
            </span>
          )}
          <span className="tabular-nums text-text-muted">
            {review.date || new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  )
}
