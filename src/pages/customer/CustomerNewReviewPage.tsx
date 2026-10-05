import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  Star,
  Sparkles,
  ArrowLeft,
  Calendar,
  User,
  Scissors,
  Award,
  CheckCircle2,
  Gift,
  Shield,
  Clock,
  Heart,
} from 'lucide-react'
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore'
import { customerPortalService } from '@/services/customerPortalService'
import { reviewService } from '@/services/reviewService'
import { useToastStore } from '@/store/useToastStore'
import { Appointment } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Disappointing — Needs improvement',
  2: 'Fair — Encountered issues',
  3: 'Good — Standard salon experience',
  4: 'Great — Very pleased with results',
  5: 'Exceptional — Highly recommend!',
}

export const CustomerNewReviewPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const appointmentIdParam = searchParams.get('appointmentId')
  const { customer, updateProfile } = useCustomerAuthStore()
  const { addToast } = useToastStore()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Overall rating
  const [overallRating, setOverallRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  // Optional category ratings
  const [serviceQualityRating, setServiceQualityRating] = useState<number>(5)
  const [staffRating, setStaffRating] = useState<number>(5)
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(5)
  const [valueRating, setValueRating] = useState<number>(5)

  // Comment
  const [comment, setComment] = useState('')

  // Load appointments
  useEffect(() => {
    const loadAppointments = async () => {
      if (!customer) return
      setIsLoading(true)
      try {
        const history = await customerPortalService.getAppointmentHistory(customer.id)
        const completed = history.filter((a) => a.status === 'completed')
        setAppointments(completed)

        // Select appointment from query param or fallback to most recent
        if (appointmentIdParam) {
          const matched = completed.find((a) => a.id === appointmentIdParam)
          if (matched) setSelectedAppointment(matched)
          else if (completed.length > 0) setSelectedAppointment(completed[0])
        } else if (completed.length > 0) {
          setSelectedAppointment(completed[0])
        }
      } catch (err) {
        console.error('Failed loading completed appointments:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAppointments()
  }, [customer, appointmentIdParam])

  const handleRatingClick = (rating: number) => {
    setOverallRating(rating)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      addToast({
        title: 'Comment Required',
        message: 'Please tell us a few words about your salon experience.',
        type: 'warning',
      })
      return
    }

    setSubmitting(true)
    try {
      const targetAppt = selectedAppointment

      const createdReview = await reviewService.createReview({
        clientId: customer?.id || 'cli-6',
        clientName: customer?.fullName || 'Priya Sharma',
        avatarUrl: customer?.avatarUrl,
        appointmentId: targetAppt?.id || 'apt-custom',
        serviceId: targetAppt?.serviceId || 'srv-2',
        serviceName: targetAppt?.serviceName || 'Signature Diamond Haircut',
        staffId: targetAppt?.staffId || 'stf-1',
        staffName: targetAppt?.staffName || 'Rahul Verma',
        rating: overallRating,
        comment: comment.trim(),
        categories: {
          serviceQuality: serviceQualityRating,
          staff: staffRating,
          cleanliness: cleanlinessRating,
          value: valueRating,
        },
        status: 'PUBLISHED',
      })

      // Award customer +100 loyalty points in customerAuthStore
      if (customer) {
        const updatedPoints = (customer.rewardPoints || 1450) + 100
        updateProfile({ rewardPoints: updatedPoints })
      }

      addToast({
        title: 'Review Published! (+100 Points)',
        message: 'Thank you for your review. 100 loyalty reward points have been credited to your account!',
        type: 'success',
      })

      navigate('/customer/reviews')
    } catch (err) {
      console.error('Failed submitting review:', err)
      addToast({
        title: 'Submission Error',
        message: 'Unable to submit your review. Please try again.',
        type: 'danger',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Interactive Category Star Bar helper
  const renderCategoryStars = (
    label: string,
    value: number,
    setValue: (v: number) => void
  ) => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-surface-subtle/70 border border-border/60">
        <div>
          <span className="text-xs font-semibold text-text-primary block">{label}</span>
          <span className="text-[11px] text-text-muted">Optional category feedback</span>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`Rate ${label} ${star} out of 5 stars`}
              onClick={() => setValue(star)}
              className={cn(
                'p-1.5 rounded-lg transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary',
                star <= value ? 'text-amber-400' : 'text-border hover:text-amber-300'
              )}
            >
              <Star
                className={cn('w-4 h-4', star <= value ? 'fill-current' : 'fill-transparent')}
                aria-hidden="true"
              />
            </button>
          ))}
          <span className="ml-1 text-xs font-bold text-text-primary tabular-nums min-w-[28px] text-right">
            {value}/5
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/customer/reviews"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reviews</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
          <Gift className="w-3.5 h-3.5" />
          <span>Earn 100 Reward Points</span>
        </span>
      </div>

      {/* Main Review Form Card */}
      <div className="rounded-3xl bg-surface border border-border p-6 sm:p-8 shadow-xl space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            How was your salon experience?
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Your verified review helps our master stylists maintain five-star excellence and earns you instant loyalty points.
          </p>
        </div>

        {/* Appointment Details Selector / Display */}
        {appointments.length > 0 ? (
          <div className="rounded-2xl bg-surface-subtle border border-border p-4.5 space-y-3">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">
              Appointment Details
            </span>

            {appointments.length > 1 ? (
              <div className="space-y-2">
                <label htmlFor="appointment-select" className="text-xs font-semibold text-text-secondary block">
                  Select Completed Appointment:
                </label>
                <select
                  id="appointment-select"
                  value={selectedAppointment?.id || ''}
                  onChange={(e) => {
                    const found = appointments.find((a) => a.id === e.target.value)
                    if (found) setSelectedAppointment(found)
                  }}
                  className="w-full text-xs rounded-xl bg-surface border border-border p-2.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden"
                >
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.serviceName} with {a.staffName} ({a.date})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {selectedAppointment && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-text-secondary">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-text-muted block">Service</span>
                    <strong className="text-text-primary text-xs font-semibold">
                      {selectedAppointment.serviceName}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-text-secondary">
                  <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-text-muted block">Stylist / Staff</span>
                    <strong className="text-text-primary text-xs font-semibold">
                      {selectedAppointment.staffName || 'Rahul Verma'}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-text-secondary">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-text-muted block">Date</span>
                    <strong className="text-text-primary text-xs font-semibold">
                      {selectedAppointment.date}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-surface-subtle border border-border p-4.5 text-xs text-text-secondary flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <div>
              <strong className="text-text-primary block">Hair & Wellness Ritual</strong>
              <span>Reviewing your recent visit at SALORA Luxury Salon</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Rate Overall Experience */}
          <div className="text-center space-y-3 p-6 rounded-2xl bg-gradient-to-b from-primary/5 via-surface to-surface border border-primary/20">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">
              Rate Overall Experience
            </span>

            {/* Big Interactive 5 Stars */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= (hoverRating ?? overallRating)
                return (
                  <button
                    key={star}
                    type="button"
                    aria-label={`Rate ${star} out of 5 stars`}
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 rounded-xl transition-all duration-150 transform hover:scale-125 focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Star
                      className={cn(
                        'w-8 h-8 sm:w-10 sm:h-10 transition-colors',
                        isFilled
                          ? 'fill-amber-400 text-amber-400 drop-shadow-md'
                          : 'text-border fill-transparent'
                      )}
                      aria-hidden="true"
                    />
                  </button>
                )
              })}
            </div>

            <div className="h-6">
              <span className="text-sm font-bold text-primary animate-in fade-in duration-150">
                {RATING_DESCRIPTIONS[hoverRating ?? overallRating]}
              </span>
            </div>
          </div>

          {/* Optional Category Ratings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Detailed Category Ratings (Optional)
              </span>
              <span className="text-[11px] text-text-muted">1 to 5 Stars</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {renderCategoryStars('Service Quality', serviceQualityRating, setServiceQualityRating)}
              {renderCategoryStars('Staff & Hospitality', staffRating, setStaffRating)}
              {renderCategoryStars('Cleanliness & Hygiene', cleanlinessRating, setCleanlinessRating)}
              {renderCategoryStars('Value for Money', valueRating, setValueRating)}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="review-comment" className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Tell us about your experience
              </label>
              <span className="text-[11px] text-text-muted">
                {comment.length} characters
              </span>
            </div>

            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience. How did your styling session go? What did you love most about your appointment?…"
              className="w-full rounded-2xl bg-surface-subtle border border-border p-4 text-sm text-text-primary placeholder:text-text-muted/60 focus:bg-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-hidden transition-all resize-none leading-relaxed"
              required
            />
          </div>

          {/* Reward Point Announcement Box */}
          <div className="rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-violet-500/10 border border-pink-500/20 p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 text-pink-500 dark:text-pink-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-text-primary block">
                Earn 100 Salora Loyalty Points
              </span>
              <p className="text-text-muted">
                Submitting this verified review will immediately deposit 100 reward points into your loyalty lounge balance.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/customer/reviews')}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !comment.trim()}
              isLoading={submitting}
              className="w-full sm:w-auto px-8 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20"
            >
              Submit Review & Earn 100 Pts
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
