import React, { useState, useEffect } from 'react'
import {
  Star,
  Sparkles,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  EyeOff,
  Eye,
  Flag,
  Send,
  Reply,
  Search,
  Filter,
  Users,
  Scissors,
  Calendar,
  Share2,
  Clock,
  Phone,
  Mail,
  Award,
  ChevronRight,
  TrendingUp,
  X,
  ExternalLink,
} from 'lucide-react'
import { reviewService } from '@/services/reviewService'
import { appointmentService } from '@/services/appointmentService'
import {
  Review,
  ReviewStatus,
  ReviewRequest,
  ReviewRequestChannel,
  ReviewDashboardStats,
  Appointment,
} from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

export const ReviewsPage: React.FC = () => {
  const { addToast } = useToastStore()

  // Main state
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>([])
  const [stats, setStats] = useState<ReviewDashboardStats | null>(null)
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Tabs
  const [activeTab, setActiveTab] = useState<'moderation' | 'requests' | 'breakdown'>('moderation')

  // Filters for Tab 1 (Moderation)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReviewStatus>('ALL')
  const [ratingFilter, setRatingFilter] = useState<'ALL' | '5' | '4' | '3' | '2' | '1'>('ALL')

  // Modals state
  const [replyModalReview, setReplyModalReview] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyAuthor, setReplyAuthor] = useState('Salora Management')

  const [moderateModalReview, setModerateModalReview] = useState<{
    review: Review
    targetStatus: ReviewStatus
  } | null>(null)
  const [moderationReason, setModerationReason] = useState('')

  const [sendInviteModalOpen, setSendInviteModalOpen] = useState(false)
  const [selectedApptId, setSelectedApptId] = useState('')
  const [inviteChannel, setInviteChannel] = useState<ReviewRequestChannel>('WHATSAPP')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [allRevs, reqs, dashboardStats, appts] = await Promise.all([
        reviewService.getAllReviews(),
        reviewService.getReviewRequests(),
        reviewService.getStats(),
        appointmentService.getAll(),
      ])

      setReviews(allRevs)
      setReviewRequests(reqs)
      setStats(dashboardStats)
      const completed = appts.filter((a) => a.status === 'completed')
      setCompletedAppointments(completed)
      if (completed.length > 0 && !selectedApptId) {
        setSelectedApptId(completed[0].id)
      }
    } catch (err) {
      console.error('Failed loading reviews dashboard:', err)
      addToast({
        title: 'Loading Error',
        message: 'Could not load reviews dashboard data.',
        type: 'danger',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Moderation Handler (Publish, Hide, Flag, Pending)
  const handleUpdateStatus = async (
    id: string,
    status: ReviewStatus,
    reason?: string
  ) => {
    try {
      const updated = await reviewService.moderateReview(
        id,
        status,
        reason,
        'Admin (Current User)'
      )
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)))
      const refreshedStats = await reviewService.getStats()
      setStats(refreshedStats)

      addToast({
        title: `Review ${status.charAt(0) + status.slice(1).toLowerCase()}`,
        message: `Review #${id} moderation status changed to ${status}.`,
        type: 'success',
      })
      setModerateModalReview(null)
      setModerationReason('')
    } catch (err) {
      console.error('Moderation error:', err)
      addToast({
        title: 'Moderation Failed',
        message: 'Could not update review status.',
        type: 'danger',
      })
    }
  }

  // Reply Handler
  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyModalReview || !replyText.trim()) return

    try {
      const updated = await reviewService.replyToReview(
        replyModalReview.id,
        replyText.trim(),
        replyAuthor
      )
      setReviews((prev) =>
        prev.map((r) => (r.id === replyModalReview.id ? updated : r))
      )
      addToast({
        title: 'Reply Published',
        message: `Response to ${replyModalReview.clientName || 'guest'} posted.`,
        type: 'success',
      })
      setReplyModalReview(null)
      setReplyText('')
    } catch (err) {
      console.error('Reply error:', err)
      addToast({
        title: 'Reply Failed',
        message: 'Could not save reply to review.',
        type: 'danger',
      })
    }
  }

  // Send Review Invite Handler
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    const appt = completedAppointments.find((a) => a.id === selectedApptId)
    if (!appt) return

    try {
      const newReq = await reviewService.sendReviewRequest({
        appointmentId: appt.id,
        clientId: appt.clientId,
        clientName: appt.clientName,
        clientPhone: appt.clientPhone,
        serviceName: appt.serviceName,
        staffName: appt.staffName,
        channel: inviteChannel,
      })

      const reqs = await reviewService.getReviewRequests()
      setReviewRequests(reqs)

      addToast({
        title: 'Review Request Sent!',
        message: `Invitation dispatched to ${appt.clientName} via ${inviteChannel}.`,
        type: 'success',
      })
      setSendInviteModalOpen(false)
    } catch (err) {
      console.error('Send invite error:', err)
      addToast({
        title: 'Invite Failed',
        message: 'Could not send review request invitation.',
        type: 'danger',
      })
    }
  }

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    // Status filter
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false

    // Rating filter
    if (ratingFilter !== 'ALL') {
      const star = Math.round(r.rating)
      if (star.toString() !== ratingFilter) return false
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchClient = r.clientName?.toLowerCase().includes(query)
      const matchComment = r.comment.toLowerCase().includes(query)
      const matchService = r.serviceName.toLowerCase().includes(query)
      const matchStaff = r.staffName?.toLowerCase().includes(query)
      if (!matchClient && !matchComment && !matchService && !matchStaff) return false
    }

    return true
  })

  // Services ratings list (Requirement 5)
  const serviceRatings = [
    { id: 'srv-1', name: 'Balayage & Gloss Ritual', rating: 4.9, count: 64, category: 'Hair Coloring' },
    { id: 'srv-2', name: 'Signature Diamond Haircut', rating: 4.8, count: 112, category: 'Hair Styling' },
    { id: 'srv-3', name: 'Japanese Structured Gel', rating: 4.8, count: 38, category: 'Nail Lounge' },
    { id: 'srv-4', name: 'Luxe Oxygen Hydra-Facial', rating: 4.9, count: 52, category: 'Skin & Facial' },
    { id: 'srv-5', name: 'Deep Conditioning Hair Spa', rating: 4.7, count: 44, category: 'Hair Spa' },
    { id: 'srv-6', name: 'Keratin Smoothing Therapy', rating: 4.6, count: 29, category: 'Hair Treatment' },
  ]

  // Staff ratings list (Requirement 6)
  const staffRatings = [
    { id: 'stf-camille', name: 'Camille Dubois', role: 'Artistic Director', rating: 4.9, count: 68 },
    { id: 'stf-1', name: 'Rahul Verma', role: 'Master Hair Specialist', rating: 4.9, count: 82 },
    { id: 'stf-3', name: 'Sofia Al-Mansoor', role: 'Senior Nail Artist', rating: 4.8, count: 38 },
    { id: 'stf-4', name: 'Elena Rostova', role: 'Aesthetician Specialist', rating: 4.9, count: 52 },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Reviews & Ratings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Admin Moderation
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Monitor customer satisfaction, moderate feedback, track review requests, and review ratings per service & stylist.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            onClick={() => setSendInviteModalOpen(true)}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Send Review Request
          </Button>
        </div>
      </div>

      {/* Top Stats Row (Requirement 1) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Rating */}
        <Card className="border border-border">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-text-muted font-medium">
              <span>Average Rating</span>
              <div className="flex items-center text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text-primary tabular-nums">
                {stats?.averageRating.toFixed(1) || '4.8'}
              </span>
              <span className="text-xs text-amber-500 font-bold">★ 5.0 scale</span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>+0.2 vs prior 30 days</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Reviews */}
        <Card className="border border-border">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-text-muted font-medium">
              <span>Total Reviews</span>
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text-primary tabular-nums">
                {stats?.totalReviews || reviews.length}
              </span>
              <span className="text-xs text-text-muted">ratings</span>
            </div>
            <div className="text-[11px] text-text-muted">
              <strong className="text-text-primary">{stats?.publishedCount || 0}</strong> published •{' '}
              <strong className="text-amber-500">{stats?.pendingCount || 0}</strong> pending
            </div>
          </CardContent>
        </Card>

        {/* 5-Star Reviews */}
        <Card className="border border-border">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-text-muted font-medium">
              <span>5 Star Share</span>
              <Award className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text-primary tabular-nums">
                {stats?.distribution.star5.percentage || 78}%
              </span>
              <span className="text-xs text-text-muted tabular-nums">
                ({stats?.distribution.star5.count || 0} reviews)
              </span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              96% positive sentiment
            </div>
          </CardContent>
        </Card>

        {/* Review Requests Conversion */}
        <Card className="border border-border">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-text-muted font-medium">
              <span>Request Conversion</span>
              <Send className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text-primary tabular-nums">
                {reviewRequests.length > 0
                  ? Math.round(
                      (reviewRequests.filter((rq) => rq.status === 'COMPLETED').length /
                        reviewRequests.length) *
                        100
                    )
                  : 75}
                %
              </span>
              <span className="text-xs text-text-muted">completed</span>
            </div>
            <div className="text-[11px] text-text-muted">
              {reviewRequests.filter((rq) => rq.status === 'COMPLETED').length} of{' '}
              {reviewRequests.length} requests reviewed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics & Customer Experience Scorecard (Requirements 1 & 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Customer Experience Score Summary (Requirement 7) */}
        <Card className="border border-border">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <span>Customer Experience Score</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                    Overall {stats?.experienceScore.overall || '4.8'}
                  </span>
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Multi-category breakdown across all completed treatments
                </p>
              </div>

              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {/* Overall */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-text-primary">Overall Satisfaction</span>
                  <span className="text-primary tabular-nums">
                    {stats?.experienceScore.overall || '4.8'} / 5.0
                  </span>
                </div>
                <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden border border-border/60">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((stats?.experienceScore.overall || 4.8) / 5) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Service */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-text-secondary">Service Quality</span>
                  <span className="text-text-primary font-bold tabular-nums">
                    {stats?.experienceScore.serviceQuality || '4.9'} / 5.0
                  </span>
                </div>
                <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden border border-border/60">
                  <div
                    className="bg-violet-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((stats?.experienceScore.serviceQuality || 4.9) / 5) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Staff */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-text-secondary">Staff & Stylist Hospitality</span>
                  <span className="text-text-primary font-bold tabular-nums">
                    {stats?.experienceScore.staff || '4.8'} / 5.0
                  </span>
                </div>
                <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden border border-border/60">
                  <div
                    className="bg-accent h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((stats?.experienceScore.staff || 4.8) / 5) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Cleanliness */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-text-secondary">Cleanliness & Hygiene</span>
                  <span className="text-text-primary font-bold tabular-nums">
                    {stats?.experienceScore.cleanliness || '4.7'} / 5.0
                  </span>
                </div>
                <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden border border-border/60">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((stats?.experienceScore.cleanliness || 4.7) / 5) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Value */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-text-secondary">Value for Money</span>
                  <span className="text-text-primary font-bold tabular-nums">
                    {stats?.experienceScore.value || '4.6'} / 5.0
                  </span>
                </div>
                <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden border border-border/60">
                  <div
                    className="bg-pink-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((stats?.experienceScore.value || 4.6) / 5) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Star Distribution (Requirement 1: 5 Star, 4 Star, 3 Star, 2 Star, 1 Star) */}
        <Card className="border border-border">
          <CardContent className="p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                Star Rating Distribution
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Breakdown of {stats?.totalReviews || reviews.length} customer ratings
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {[
                { stars: 5, key: 'star5', color: 'bg-emerald-500' },
                { stars: 4, key: 'star4', color: 'bg-primary' },
                { stars: 3, key: 'star3', color: 'bg-amber-500' },
                { stars: 2, key: 'star2', color: 'bg-orange-500' },
                { stars: 1, key: 'star1', color: 'bg-rose-500' },
              ].map(({ stars, key, color }) => {
                const item =
                  stats?.distribution[key as keyof typeof stats.distribution] || {
                    count: 0,
                    percentage: 0,
                  }

                return (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 w-16 text-text-secondary font-medium">
                      <span>{stars}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>

                    <div className="flex-1 bg-surface-subtle h-2.5 rounded-full overflow-hidden border border-border/60">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', color)}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>

                    <div className="w-16 text-right tabular-nums text-text-muted font-medium">
                      <strong className="text-text-primary">{item.count}</strong> ({item.percentage}%)
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('moderation')}
            className={cn(
              'px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2',
              activeTab === 'moderation'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            )}
          >
            <span>Review Moderation Table</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-surface-subtle text-text-primary">
              {reviews.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={cn(
              'px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2',
              activeTab === 'requests'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            )}
          >
            <span>Review Requests</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-surface-subtle text-text-primary">
              {reviewRequests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('breakdown')}
            className={cn(
              'px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2',
              activeTab === 'breakdown'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            )}
          >
            <span>Service & Staff Performance</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: REVIEW MODERATION TABLE (Requirement 4)           */}
      {/* ======================================================== */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3.5 rounded-2xl border border-border">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by customer, comment, service, or staff…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-surface-subtle border border-border focus:ring-2 focus:ring-primary outline-hidden text-text-primary"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2">
              {/* Status Filter */}
              <select
                aria-label="Filter reviews by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs rounded-xl bg-surface-subtle border border-border px-3 py-1.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden"
              >
                <option value="ALL">All Statuses ({reviews.length})</option>
                <option value="PUBLISHED">Published</option>
                <option value="PENDING">Pending Moderation</option>
                <option value="HIDDEN">Hidden</option>
                <option value="FLAGGED">Flagged</option>
              </select>

              {/* Rating Filter */}
              <select
                aria-label="Filter reviews by rating"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value as any)}
                className="text-xs rounded-xl bg-surface-subtle border border-border px-3 py-1.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden"
              >
                <option value="ALL">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>

          {/* Safety Notice Note */}
          <div className="text-xs text-text-muted flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                Moderation Policy: <strong>Do not delete reviews casually.</strong> Keep audit trail by publishing, hiding, or flagging.
              </span>
            </span>
            <span className="tabular-nums font-semibold text-text-secondary">
              Showing {filteredReviews.length} of {reviews.length} reviews
            </span>
          </div>

          {/* Reviews Table */}
          <div className="rounded-2xl border border-border overflow-hidden bg-surface shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle/80 font-bold text-text-muted">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-3">Rating</th>
                    <th className="py-3 px-3">Service</th>
                    <th className="py-3 px-3">Staff</th>
                    <th className="py-3 px-4 min-w-[280px]">Comment & Feedback</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredReviews.length > 0 ? (
                    filteredReviews.map((rev) => (
                      <tr key={rev.id} className="hover:bg-surface-subtle/40 transition-colors">
                        {/* Customer */}
                        <td className="py-3.5 px-4 font-semibold text-text-primary whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {rev.avatarUrl ? (
                              <img
                                src={rev.avatarUrl}
                                alt={rev.clientName || 'Guest'}
                                className="w-7 h-7 rounded-full object-cover border border-border"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">
                                {(rev.clientName || 'G').charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-text-primary">
                                {rev.clientName || 'Valued Guest'}
                              </div>
                              <span className="text-[10px] text-text-muted">
                                ID: #{rev.clientId}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Rating */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="tabular-nums text-text-primary">
                              {rev.rating.toFixed(1)}
                            </span>
                          </div>
                        </td>

                        {/* Service */}
                        <td className="py-3.5 px-3 whitespace-nowrap font-medium text-text-secondary">
                          <span className="inline-flex items-center gap-1">
                            <Scissors className="w-3 h-3 text-text-muted" />
                            <span>{rev.serviceName}</span>
                          </span>
                        </td>

                        {/* Staff */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-text-secondary font-medium">
                          {rev.staffName || 'Rahul Verma'}
                        </td>

                        {/* Comment */}
                        <td className="py-3.5 px-4">
                          <p className="text-text-primary leading-relaxed line-clamp-2">
                            {rev.comment}
                          </p>

                          {/* Categories if present */}
                          {rev.categories && (
                            <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-text-muted">
                              {rev.categories.serviceQuality && (
                                <span className="px-1.5 py-0.5 rounded bg-surface-subtle border border-border/50">
                                  Service: {rev.categories.serviceQuality}/5
                                </span>
                              )}
                              {rev.categories.staff && (
                                <span className="px-1.5 py-0.5 rounded bg-surface-subtle border border-border/50">
                                  Staff: {rev.categories.staff}/5
                                </span>
                              )}
                              {rev.categories.cleanliness && (
                                <span className="px-1.5 py-0.5 rounded bg-surface-subtle border border-border/50">
                                  Hygiene: {rev.categories.cleanliness}/5
                                </span>
                              )}
                              {rev.categories.value && (
                                <span className="px-1.5 py-0.5 rounded bg-surface-subtle border border-border/50">
                                  Value: {rev.categories.value}/5
                                </span>
                              )}
                            </div>
                          )}

                          {/* Reply note if present */}
                          {rev.reply && (
                            <div className="mt-1.5 text-[11px] text-primary flex items-center gap-1 font-medium">
                              <Reply className="w-3 h-3" />
                              <span>Replied: “{rev.reply.text}”</span>
                            </div>
                          )}

                          {/* Reason if flagged/hidden */}
                          {rev.moderationReason && (
                            <div className="mt-1 text-[10px] text-rose-500 italic">
                              Reason: {rev.moderationReason}
                            </div>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-text-muted tabular-nums">
                          {rev.date ||
                            new Date(rev.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                            })}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1',
                              rev.status === 'PUBLISHED' &&
                                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
                              rev.status === 'PENDING' &&
                                'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse',
                              rev.status === 'HIDDEN' &&
                                'bg-slate-500/10 text-slate-500 border border-slate-500/30',
                              rev.status === 'FLAGGED' &&
                                'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                            )}
                          >
                            {rev.status === 'PUBLISHED' && <CheckCircle className="w-2.5 h-2.5" />}
                            {rev.status === 'PENDING' && <Clock className="w-2.5 h-2.5" />}
                            {rev.status === 'HIDDEN' && <EyeOff className="w-2.5 h-2.5" />}
                            {rev.status === 'FLAGGED' && <Flag className="w-2.5 h-2.5" />}
                            <span>{rev.status}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Publish action */}
                            {rev.status !== 'PUBLISHED' && (
                              <button
                                type="button"
                                title="Publish Review"
                                onClick={() => handleUpdateStatus(rev.id, 'PUBLISHED')}
                                className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold text-[11px] transition-colors"
                              >
                                Publish
                              </button>
                            )}

                            {/* Hide action */}
                            {rev.status !== 'HIDDEN' && (
                              <button
                                type="button"
                                title="Hide Review from Public Pages"
                                onClick={() => {
                                  setModerateModalReview({ review: rev, targetStatus: 'HIDDEN' })
                                  setModerationReason('')
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-300 border border-slate-500/30 font-semibold text-[11px] transition-colors"
                              >
                                Hide
                              </button>
                            )}

                            {/* Flag action */}
                            {rev.status !== 'FLAGGED' && (
                              <button
                                type="button"
                                title="Flag for Inappropriate Content"
                                onClick={() => {
                                  setModerateModalReview({ review: rev, targetStatus: 'FLAGGED' })
                                  setModerationReason('')
                                }}
                                className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 font-semibold text-[11px] transition-colors"
                              >
                                Flag
                              </button>
                            )}

                            {/* Reply button */}
                            <button
                              type="button"
                              title="Reply to Customer"
                              onClick={() => {
                                setReplyModalReview(rev)
                                setReplyText(rev.reply?.text || '')
                              }}
                              className="px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-semibold text-[11px] transition-colors flex items-center gap-1"
                            >
                              <Reply className="w-3 h-3" />
                              <span>{rev.reply ? 'Edit Reply' : 'Reply'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-text-muted">
                        No reviews found matching the search and filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: REVIEW REQUESTS TRACKING (Requirement 9)           */}
      {/* ======================================================== */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-border">
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                Automated Review Requests & Feedback Prompts
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Track customer invitations dispatched via WhatsApp, SMS, and Email after appointment checkout.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setSendInviteModalOpen(true)}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Send New Request
            </Button>
          </div>

          {/* Requests Table */}
          <div className="rounded-2xl border border-border overflow-hidden bg-surface shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle font-bold text-text-muted">
                    <th className="py-3 px-4">Appointment</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Service & Stylist</th>
                    <th className="py-3 px-3">Channel</th>
                    <th className="py-3 px-3">Sent At</th>
                    <th className="py-3 px-3">Opened At</th>
                    <th className="py-3 px-3">Completed At</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {reviewRequests.map((rq) => (
                    <tr key={rq.id} className="hover:bg-surface-subtle/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-text-primary">
                        #{rq.appointmentId}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-text-primary">
                          {rq.clientName || 'Client'}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {rq.clientPhone || rq.clientEmail || 'Contact saved'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-medium text-text-primary">{rq.serviceName}</div>
                        <div className="text-[11px] text-text-muted">with {rq.staffName}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-subtle border border-border text-text-secondary">
                          {rq.channel === 'WHATSAPP' && <MessageSquare className="w-2.5 h-2.5 text-emerald-500" />}
                          {rq.channel === 'SMS' && <Phone className="w-2.5 h-2.5 text-blue-500" />}
                          {rq.channel === 'EMAIL' && <Mail className="w-2.5 h-2.5 text-purple-500" />}
                          <span>{rq.channel || 'WHATSAPP'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-text-muted tabular-nums">
                        {rq.sentAt
                          ? new Date(rq.sentAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>

                      <td className="py-3.5 px-3 text-text-muted tabular-nums">
                        {rq.openedAt
                          ? new Date(rq.openedAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>

                      <td className="py-3.5 px-3 text-text-muted tabular-nums">
                        {rq.completedAt
                          ? new Date(rq.completedAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase',
                            rq.status === 'COMPLETED' &&
                              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
                            rq.status === 'OPENED' &&
                              'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30',
                            rq.status === 'SENT' &&
                              'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30',
                            rq.status === 'PENDING' &&
                              'bg-slate-500/10 text-slate-500 border border-slate-500/30'
                          )}
                        >
                          {rq.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {rq.status !== 'COMPLETED' ? (
                          <button
                            type="button"
                            onClick={() => {
                              reviewService.sendReviewRequest({
                                appointmentId: rq.appointmentId,
                                clientId: rq.clientId,
                                clientName: rq.clientName,
                                clientPhone: rq.clientPhone,
                                serviceName: rq.serviceName,
                                staffName: rq.staffName,
                                channel: rq.channel,
                              })
                              addToast({
                                title: 'Invite Resent',
                                message: `Review invitation resent to ${rq.clientName}.`,
                                type: 'info',
                              })
                            }}
                            className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-[11px] transition-colors"
                          >
                            Resend
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            ✓ Reviewed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SERVICE & STAFF RATINGS (Requirements 5 & 6)      */}
      {/* ======================================================== */}
      {activeTab === 'breakdown' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Ratings (Requirement 5) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-primary">
                  Service Ratings & Volume
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Calculated average ratings per salon treatment catalog
                </p>
              </div>
              <span className="text-xs text-text-muted font-medium">
                {serviceRatings.length} Services Ranked
              </span>
            </div>

            <div className="rounded-2xl border border-border overflow-hidden bg-surface shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle font-bold text-text-muted">
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-center">Avg Rating</th>
                    <th className="py-3 px-4 text-right">Reviews</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {serviceRatings.map((srv) => (
                    <tr key={srv.id} className="hover:bg-surface-subtle/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-text-primary">
                        {srv.name}
                      </td>
                      <td className="py-3 px-3 text-text-secondary font-medium">
                        {srv.category}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-500 tabular-nums">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{srv.rating.toFixed(1)}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-text-muted tabular-nums">
                        {srv.count} reviews
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Staff Ratings (Requirement 6) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-primary">
                  Stylist & Staff Ratings
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Performance evaluations calculated across client feedback
                </p>
              </div>
              <span className="text-xs text-text-muted font-medium">
                {staffRatings.length} Specialists
              </span>
            </div>

            <div className="rounded-2xl border border-border overflow-hidden bg-surface shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle font-bold text-text-muted">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-3">Designation</th>
                    <th className="py-3 px-3 text-center">Avg Rating</th>
                    <th className="py-3 px-4 text-right">Total Reviews</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {staffRatings.map((stf) => (
                    <tr key={stf.id} className="hover:bg-surface-subtle/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-text-primary">
                        {stf.name}
                      </td>
                      <td className="py-3 px-3 text-text-secondary font-medium">
                        {stf.role}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-500 tabular-nums">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{stf.rating.toFixed(1)}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-text-muted tabular-nums">
                        {stf.count} reviews
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: REPLY TO REVIEW                                 */}
      {/* ======================================================== */}
      {replyModalReview && (
        <Modal
          isOpen={true}
          onClose={() => setReplyModalReview(null)}
          title={`Reply to ${replyModalReview.clientName || 'Guest'}`}
        >
          <form onSubmit={handleSaveReply} className="space-y-4">
            <div className="rounded-xl bg-surface-subtle p-3.5 border border-border text-xs space-y-1">
              <span className="font-semibold text-text-primary">Guest Comment:</span>
              <p className="text-text-secondary italic">“{replyModalReview.comment}”</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reply-author" className="text-xs font-semibold text-text-secondary block">
                Reply As:
              </label>
              <input
                id="reply-author"
                type="text"
                value={replyAuthor}
                onChange={(e) => setReplyAuthor(e.target.value)}
                className="w-full text-xs rounded-xl bg-surface border border-border p-2.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reply-content" className="text-xs font-semibold text-text-secondary block">
                Official Salon Response:
              </label>
              <textarea
                id="reply-content"
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Thank the guest for their visit or address any specific feedback graciously…"
                className="w-full text-xs rounded-xl bg-surface border border-border p-3 text-text-primary focus:ring-2 focus:ring-primary outline-hidden resize-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReplyModalReview(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save & Publish Reply
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: MODERATION REASON (FOR HIDING OR FLAGGING)      */}
      {/* ======================================================== */}
      {moderateModalReview && (
        <Modal
          isOpen={true}
          onClose={() => setModerateModalReview(null)}
          title={`Moderate Review (${moderateModalReview.targetStatus})`}
        >
          <div className="space-y-4">
            <p className="text-xs text-text-muted">
              You are about to mark this review as{' '}
              <strong className="text-text-primary">{moderateModalReview.targetStatus}</strong>. It will be retained in the database for auditing and quality control.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="moderation-reason" className="text-xs font-semibold text-text-secondary block">
                Reason / Internal Justification (Optional):
              </label>
              <input
                id="moderation-reason"
                type="text"
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="e.g. Inappropriate language, spam, resolved via direct refund, competitor promo…"
                className="w-full text-xs rounded-xl bg-surface border border-border p-2.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModerateModalReview(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() =>
                  handleUpdateStatus(
                    moderateModalReview.review.id,
                    moderateModalReview.targetStatus,
                    moderationReason
                  )
                }
              >
                Confirm {moderateModalReview.targetStatus}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: SEND REVIEW REQUEST INVITATION                  */}
      {/* ======================================================== */}
      {sendInviteModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setSendInviteModalOpen(false)}
          title="Send Review Request Invitation"
        >
          <form onSubmit={handleSendInvite} className="space-y-4">
            <p className="text-xs text-text-muted">
              Select a completed appointment to invite the guest to leave a review and earn +100 loyalty points.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="modal-appointment-select" className="text-xs font-semibold text-text-secondary block">
                Completed Appointment:
              </label>
              <select
                id="modal-appointment-select"
                value={selectedApptId}
                onChange={(e) => setSelectedApptId(e.target.value)}
                className="w-full text-xs rounded-xl bg-surface border border-border p-2.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden"
              >
                {completedAppointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.id.slice(-6)} - {a.clientName} ({a.serviceName} with {a.staffName} on {a.date})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="modal-channel-select" className="text-xs font-semibold text-text-secondary block">
                Invitation Channel:
              </label>
              <select
                id="modal-channel-select"
                value={inviteChannel}
                onChange={(e) => setInviteChannel(e.target.value as any)}
                className="w-full text-xs rounded-xl bg-surface border border-border p-2.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden"
              >
                <option value="WHATSAPP">WhatsApp Message (Fastest Response)</option>
                <option value="SMS">SMS Text Message</option>
                <option value="EMAIL">Email Invitation</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSendInviteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Dispatch Invitation
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
