import {
  Review,
  ReviewStatus,
  ReviewRequest,
  ReviewRequestStatus,
  ReviewRequestChannel,
  CustomerExperienceScore,
  ReviewDashboardStats,
  RatingDistribution,
} from '@/types'
import { loyaltyService } from './loyaltyService'

const REVIEWS_STORAGE_KEY = 'salora_reviews_store_v1'
const REQUESTS_STORAGE_KEY = 'salora_review_requests_store_v1'

// Clear mock reviews from localStorage if present
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY)
    if (raw && raw.includes('rev-')) {
      localStorage.removeItem(REVIEWS_STORAGE_KEY)
      localStorage.removeItem(REQUESTS_STORAGE_KEY)
    }
  } catch {}
}

function getStoredReviews(): Review[] {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed to parse reviews from localStorage:', err)
  }
  return []
}

function saveReviews(reviews: Review[]): void {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews))
  } catch (err) {
    console.error('Failed to save reviews to localStorage:', err)
  }
}

function getStoredRequests(): ReviewRequest[] {
  try {
    const raw = localStorage.getItem(REQUESTS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed to parse review requests from localStorage:', err)
  }
  return []
}

function saveRequests(requests: ReviewRequest[]): void {
  try {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests))
  } catch (err) {
    console.error('Failed to save review requests to localStorage:', err)
  }
}

export const reviewService = {
  // ─── 1. REVIEWS RETRIEVAL ───
  async getAllReviews(): Promise<Review[]> {
    await new Promise((res) => setTimeout(res, 30))
    const list = getStoredReviews()
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  async getPublishedReviews(): Promise<Review[]> {
    const all = await this.getAllReviews()
    return all.filter((r) => r.status === 'PUBLISHED')
  },

  async getReviewById(id: string): Promise<Review | undefined> {
    const all = await this.getAllReviews()
    return all.find((r) => r.id === id)
  },

  async getReviewsByClient(clientId: string): Promise<Review[]> {
    const all = await this.getAllReviews()
    const target = clientId.toLowerCase()
    return all.filter(
      (r) =>
        r.clientId.toLowerCase() === target ||
        (target === 'cli-6' && r.clientId.toLowerCase() === 'cli-priya') ||
        (target === 'cli-priya' && r.clientId.toLowerCase() === 'cli-6')
    )
  },

  async getReviewsByStaff(staffId: string): Promise<Review[]> {
    const all = await this.getAllReviews()
    return all.filter((r) => r.staffId === staffId && r.status === 'PUBLISHED')
  },

  async getReviewsByService(serviceId: string): Promise<Review[]> {
    const all = await this.getAllReviews()
    return all.filter((r) => r.serviceId === serviceId && r.status === 'PUBLISHED')
  },

  // ─── 2. RATINGS CALCULATION (SERVICE & STAFF) ───
  async getStaffRating(staffId: string): Promise<{ rating: number; reviewCount: number }> {
    const reviews = await this.getReviewsByStaff(staffId)
    if (reviews.length === 0) {
      return { rating: 0, reviewCount: 0 }
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    const avg = Math.round((sum / reviews.length) * 10) / 10
    return { rating: avg, reviewCount: reviews.length }
  },

  async getServiceRating(serviceId: string): Promise<{ rating: number; reviewCount: number }> {
    const reviews = await this.getReviewsByService(serviceId)
    if (reviews.length === 0) {
      return { rating: 0, reviewCount: 0 }
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    const avg = Math.round((sum / reviews.length) * 10) / 10
    return { rating: avg, reviewCount: reviews.length }
  },

  // ─── 3. CUSTOMER EXPERIENCE SCORE & DASHBOARD STATS ───
  async getExperienceScore(): Promise<CustomerExperienceScore> {
    const all = await this.getAllReviews()
    const valid = all.filter((r) => r.status === 'PUBLISHED' || r.status === 'PENDING')

    if (valid.length === 0) {
      return {
        overall: 0,
        serviceQuality: 0,
        staff: 0,
        cleanliness: 0,
        value: 0,
        totalReviews: 0,
      }
    }

    let sqSum = 0
    let sqCount = 0
    let stSum = 0
    let stCount = 0
    let clSum = 0
    let clCount = 0
    let valSum = 0
    let valCount = 0
    let overallSum = 0

    valid.forEach((r) => {
      overallSum += r.rating
      if (r.categories?.serviceQuality) {
        sqSum += r.categories.serviceQuality
        sqCount++
      }
      if (r.categories?.staff) {
        stSum += r.categories.staff
        stCount++
      }
      if (r.categories?.cleanliness) {
        clSum += r.categories.cleanliness
        clCount++
      }
      if (r.categories?.value) {
        valSum += r.categories.value
        valCount++
      }
    })

    return {
      overall: Math.round((overallSum / valid.length) * 10) / 10 || 0,
      serviceQuality: sqCount > 0 ? Math.round((sqSum / sqCount) * 10) / 10 : 0,
      staff: stCount > 0 ? Math.round((stSum / stCount) * 10) / 10 : 0,
      cleanliness: clCount > 0 ? Math.round((clSum / clCount) * 10) / 10 : 0,
      value: valCount > 0 ? Math.round((valSum / valCount) * 10) / 10 : 0,
      totalReviews: valid.length,
    }
  },

  async getStats(): Promise<ReviewDashboardStats> {
    const all = await this.getAllReviews()
    const published = all.filter((r) => r.status === 'PUBLISHED')
    const pending = all.filter((r) => r.status === 'PENDING')
    const hidden = all.filter((r) => r.status === 'HIDDEN')
    const flagged = all.filter((r) => r.status === 'FLAGGED')

    // Rating star counts
    let c5 = 0
    let c4 = 0
    let c3 = 0
    let c2 = 0
    let c1 = 0

    all.forEach((r) => {
      const star = Math.round(r.rating)
      if (star >= 5) c5++
      else if (star === 4) c4++
      else if (star === 3) c3++
      else if (star === 2) c2++
      else c1++
    })

    const total = all.length || 1
    const distribution: RatingDistribution = {
      star5: { count: c5, percentage: Math.round((c5 / total) * 100) },
      star4: { count: c4, percentage: Math.round((c4 / total) * 100) },
      star3: { count: c3, percentage: Math.round((c3 / total) * 100) },
      star2: { count: c2, percentage: Math.round((c2 / total) * 100) },
      star1: { count: c1, percentage: Math.round((c1 / total) * 100) },
    }

    const expScore = await this.getExperienceScore()
    const overallSum = all.reduce((sum, r) => sum + r.rating, 0)
    const avg = all.length > 0 ? Math.round((overallSum / all.length) * 10) / 10 : 0

    return {
      averageRating: avg,
      totalReviews: all.length,
      publishedCount: published.length,
      pendingCount: pending.length,
      hiddenCount: hidden.length,
      flaggedCount: flagged.length,
      distribution,
      experienceScore: expScore,
    }
  },

  // ─── 4. REVIEW SUBMISSION & LOYALTY REWARD ───
  async createReview(
    data: Omit<Review, 'id' | 'createdAt' | 'status'> & { status?: ReviewStatus }
  ): Promise<Review> {
    const list = getStoredReviews()
    const id = `rev-${Date.now()}`
    const now = new Date()

    const newReview: Review = {
      ...data,
      id,
      status: data.status || 'PUBLISHED',
      createdAt: now.toISOString(),
      date: 'Just now',
      verifiedVisit: true,
    }

    list.unshift(newReview)
    saveReviews(list)

    // 1. If appointmentId matches a ReviewRequest, mark request COMPLETED
    if (data.appointmentId) {
      const requests = getStoredRequests()
      const reqIdx = requests.findIndex((rq) => rq.appointmentId === data.appointmentId)
      if (reqIdx !== -1) {
        requests[reqIdx] = {
          ...requests[reqIdx],
          status: 'COMPLETED',
          completedAt: now.toISOString(),
        }
        saveRequests(requests)
      }
    }

    // 2. Award 100 loyalty reward points automatically
    try {
      await loyaltyService.addTransaction({
        clientId: newReview.clientId,
        clientName: newReview.clientName || 'Valued Guest',
        type: 'EARNED',
        points: 100,
        reason: 'Verified Salon Review Reward (+100 Pts)',
        referenceId: newReview.id,
      })
    } catch (err) {
      console.warn('Loyalty reward point transaction skipped:', err)
    }

    return newReview
  },

  // ─── 5. MODERATION & ADMIN ACTIONS ───
  async moderateReview(
    id: string,
    status: ReviewStatus,
    reason?: string,
    moderatedBy: string = 'Salon Manager'
  ): Promise<Review> {
    const list = getStoredReviews()
    const idx = list.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error(`Review ${id} not found`)

    const updated: Review = {
      ...list[idx],
      status,
      moderatedAt: new Date().toISOString(),
      moderatedBy,
      ...(reason ? { moderationReason: reason } : {}),
    }

    list[idx] = updated
    saveReviews(list)
    return updated
  },

  async replyToReview(id: string, replyText: string, staffName: string = 'Salora Team'): Promise<Review> {
    const list = getStoredReviews()
    const idx = list.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error(`Review ${id} not found`)

    const updated: Review = {
      ...list[idx],
      reply: {
        text: replyText.trim(),
        repliedAt: new Date().toISOString(),
        staffName,
      },
    }

    list[idx] = updated
    saveReviews(list)
    return updated
  },

  // ─── 6. REVIEW REQUESTS TRACKING ───
  async getReviewRequests(): Promise<ReviewRequest[]> {
    await new Promise((res) => setTimeout(res, 25))
    const list = getStoredRequests()
    return [...list]
  },

  async sendReviewRequest(data: {
    appointmentId: string
    clientId: string
    clientName?: string
    clientPhone?: string
    clientEmail?: string
    serviceName?: string
    staffName?: string
    channel?: ReviewRequestChannel
  }): Promise<ReviewRequest> {
    const list = getStoredRequests()
    const existingIdx = list.findIndex((rq) => rq.appointmentId === data.appointmentId)

    const now = new Date().toISOString()

    if (existingIdx !== -1) {
      const updated: ReviewRequest = {
        ...list[existingIdx],
        status: 'SENT',
        sentAt: now,
        channel: data.channel || list[existingIdx].channel || 'WHATSAPP',
      }
      list[existingIdx] = updated
      saveRequests(list)
      return updated
    }

    const newRequest: ReviewRequest = {
      id: `rq-${Date.now()}`,
      appointmentId: data.appointmentId,
      clientId: data.clientId,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      clientEmail: data.clientEmail,
      serviceName: data.serviceName,
      staffName: data.staffName,
      sentAt: now,
      status: 'SENT',
      channel: data.channel || 'WHATSAPP',
    }

    list.unshift(newRequest)
    saveRequests(list)
    return newRequest
  },

  async markRequestOpened(id: string): Promise<ReviewRequest | null> {
    const list = getStoredRequests()
    const idx = list.findIndex((rq) => rq.id === id || rq.appointmentId === id)
    if (idx === -1) return null

    if (list[idx].status === 'SENT' || list[idx].status === 'PENDING') {
      list[idx] = {
        ...list[idx],
        status: 'OPENED',
        openedAt: new Date().toISOString(),
      }
      saveRequests(list)
    }
    return list[idx]
  },

  async markRequestCompleted(appointmentId: string): Promise<ReviewRequest | null> {
    const list = getStoredRequests()
    const idx = list.findIndex((rq) => rq.appointmentId === appointmentId)
    if (idx === -1) return null

    list[idx] = {
      ...list[idx],
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    }
    saveRequests(list)
    return list[idx]
  },
}
