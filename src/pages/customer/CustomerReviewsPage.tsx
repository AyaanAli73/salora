import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Star,
  Sparkles,
  MessageSquare,
  Award,
  PlusCircle,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Heart,
  ShieldCheck,
} from 'lucide-react'
import { reviewService } from '@/services/reviewService'
import { customerPortalService } from '@/services/customerPortalService'
import { Review, CustomerExperienceScore, Appointment } from '@/types'
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

export const CustomerReviewsPage: React.FC = () => {
  const { customer } = useCustomerAuthStore()
  const [allReviews, setAllReviews] = useState<Review[]>([])
  const [experienceScore, setExperienceScore] = useState<CustomerExperienceScore | null>(null)
  const [recentCompletedAppt, setRecentCompletedAppt] = useState<Appointment | null>(null)
  const [activeTab, setActiveTab] = useState<'community' | 'my-reviews'>('community')
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setIsLoading(true)
      try {
        const [reviewsData, scoreData, history] = await Promise.all([
          reviewService.getAllReviews(),
          reviewService.getExperienceScore(),
          customer ? customerPortalService.getAppointmentHistory(customer.id) : Promise.resolve([]),
        ])

        if (!isMounted) return
        setAllReviews(reviewsData)
        setExperienceScore(scoreData)

        // Find recent completed appointment to prompt
        const completed = history.filter((a) => a.status === 'completed')
        if (completed.length > 0) {
          setRecentCompletedAppt(completed[0])
        }
      } catch (err) {
        console.error('Failed to load customer reviews page:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [customer])

  // Filter reviews
  const publishedReviews = allReviews.filter((r) => r.status === 'PUBLISHED')
  const myReviews = allReviews.filter(
    (r) =>
      customer &&
      (r.clientId.toLowerCase() === customer.id.toLowerCase() ||
        (customer.id === 'cli-6' && r.clientId.toLowerCase() === 'cli-priya') ||
        (customer.id === 'cli-priya' && r.clientId.toLowerCase() === 'cli-6'))
  )

  const activeReviewSet = activeTab === 'community' ? publishedReviews : myReviews

  const filteredReviews = activeReviewSet.filter((r) => {
    if (ratingFilter === '5') return r.rating >= 4.8
    if (ratingFilter === '4') return r.rating >= 3.8 && r.rating < 4.8
    if (ratingFilter === '3') return r.rating < 3.8
    return true
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-violet-950/60 to-slate-900 border border-violet-800/30 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl space-y-2 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-semibold">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Verified Guest Experiences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Reviews & Salon Ratings
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Read verified experiences from our luxury salon guests. Share feedback on your recent appointments to earn exclusive loyalty rewards.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10 shrink-0">
          <Link
            to="/customer/reviews/new"
            className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-violet-600/30 transition-all hover:scale-102"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Write a Review (+100 Pts)</span>
          </Link>
        </div>
      </div>

      {/* Review Prompt Banner for Completed Appointment */}
      {recentCompletedAppt && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-pink-500/10 to-violet-500/15 border border-amber-500/30 p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                Appointment Completed • Feedback Request
              </span>
              <p className="text-sm font-semibold text-white">
                How was your recent <span className="text-pink-300">{recentCompletedAppt.serviceName}</span> with{' '}
                <span className="text-violet-300">{recentCompletedAppt.staffName || 'Rahul Verma'}</span>?
              </p>
              <span className="text-xs text-slate-400">
                Share your experience now and earn +100 Loyalty Reward Points!
              </span>
            </div>
          </div>

          <Link
            to={`/customer/reviews/new?appointmentId=${recentCompletedAppt.id}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0"
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Rate & Review (+100 Pts)</span>
          </Link>
        </div>
      )}

      {/* Customer Experience Scorecard Summary (Requirement 7) */}
      {experienceScore && (
        <div className="rounded-3xl bg-surface border border-border p-6 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <span>Customer Experience Scorecard</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  {experienceScore.totalReviews} Verified Ratings
                </span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Aggregated satisfaction scores calculated across all completed treatments
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto bg-surface-subtle px-4 py-2 rounded-2xl border border-border">
              <div className="text-2xl font-black text-text-primary tabular-nums">
                {experienceScore.overall}
              </div>
              <div>
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">
                  Overall Score
                </span>
              </div>
            </div>
          </div>

          {/* 4 Category Score Pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-surface-subtle border border-border/80 space-y-1">
              <span className="text-xs text-text-muted font-medium block">Service Quality</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-text-primary tabular-nums">
                  {experienceScore.serviceQuality}
                </span>
                <span className="text-xs text-amber-500 font-semibold">★ 5.0 scale</span>
              </div>
              <div className="w-full bg-border/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${(experienceScore.serviceQuality / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-subtle border border-border/80 space-y-1">
              <span className="text-xs text-text-muted font-medium block">Staff & Stylists</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-text-primary tabular-nums">
                  {experienceScore.staff}
                </span>
                <span className="text-xs text-amber-500 font-semibold">★ 5.0 scale</span>
              </div>
              <div className="w-full bg-border/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-accent h-full rounded-full"
                  style={{ width: `${(experienceScore.staff / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-subtle border border-border/80 space-y-1">
              <span className="text-xs text-text-muted font-medium block">Cleanliness & Hygiene</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-text-primary tabular-nums">
                  {experienceScore.cleanliness}
                </span>
                <span className="text-xs text-amber-500 font-semibold">★ 5.0 scale</span>
              </div>
              <div className="w-full bg-border/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${(experienceScore.cleanliness / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-subtle border border-border/80 space-y-1">
              <span className="text-xs text-text-muted font-medium block">Value for Money</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-text-primary tabular-nums">
                  {experienceScore.value}
                </span>
                <span className="text-xs text-amber-500 font-semibold">★ 5.0 scale</span>
              </div>
              <div className="w-full bg-border/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-pink-500 h-full rounded-full"
                  style={{ width: `${(experienceScore.value / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setActiveTab('community')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'community'
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            Salon Guest Reviews ({publishedReviews.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my-reviews')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
              activeTab === 'my-reviews'
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            <span>My Submitted Reviews</span>
            {myReviews.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary text-white">
                {myReviews.length}
              </span>
            )}
          </button>
        </div>

        {/* Rating Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-xs text-text-muted font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          <button
            type="button"
            onClick={() => setRatingFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-xl font-medium transition-all',
              ratingFilter === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-subtle text-text-muted hover:text-text-primary border border-border'
            )}
          >
            All Ratings
          </button>
          <button
            type="button"
            onClick={() => setRatingFilter('5')}
            className={cn(
              'px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1',
              ratingFilter === '5'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-subtle text-text-muted hover:text-text-primary border border-border'
            )}
          >
            <span>5 Stars</span>
            <Star className="w-3 h-3 fill-current text-amber-400" />
          </button>
          <button
            type="button"
            onClick={() => setRatingFilter('4')}
            className={cn(
              'px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1',
              ratingFilter === '4'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-subtle text-text-muted hover:text-text-primary border border-border'
            )}
          >
            <span>4 Stars</span>
            <Star className="w-3 h-3 fill-current text-amber-400" />
          </button>
        </div>
      </div>

      {/* Reviews Grid */}
      {filteredReviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredReviews.map((rev) => (
            <ReviewCard key={rev.id} review={rev} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center space-y-4 rounded-3xl bg-surface border border-border">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">No reviews found</h3>
            <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
              {activeTab === 'my-reviews'
                ? "You haven't submitted any reviews yet. Share your thoughts after your next salon treatment to earn 100 loyalty points!"
                : 'No reviews match your selected filter criteria.'}
            </p>
          </div>
          {activeTab === 'my-reviews' && (
            <Link
              to="/customer/reviews/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Write Your First Review</span>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
