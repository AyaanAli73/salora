import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Sparkles,
  Gift,
  Award,
  ArrowRight,
  User,
  Star,
  Tag,
  CheckCircle2,
  ChevronRight,
  Copy,
  Check,
  Scissors,
  Flame,
  Zap,
} from 'lucide-react'
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore'
import { customerPortalService } from '@/services/customerPortalService'
import { Appointment, CustomerOffer, Service } from '@/types'
import { useToastStore } from '@/store/useToastStore'

export const CustomerDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { customer } = useCustomerAuthStore()
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null)
  const [recentAppointment, setRecentAppointment] = useState<Appointment | null>(null)
  const [recommendedServices, setRecommendedServices] = useState<Service[]>([])
  const [offers, setOffers] = useState<CustomerOffer[]>([])
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Dynamic Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!customer) return
      setLoading(true)
      try {
        const next = await customerPortalService.getNextAppointment(customer.id)
        const history = await customerPortalService.getAppointmentHistory(customer.id)
        const completed = history.filter((a) => a.status === 'completed')
        const rec = await customerPortalService.getRecommendedServices()
        const activeOffers = customerPortalService.getOffers()

        setNextAppointment(next)
        setRecentAppointment(completed[0] || null)
        setRecommendedServices(rec.slice(0, 3))
        setOffers(activeOffers.slice(0, 2))
      } catch (err) {
        console.error('Failed to load customer dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [customer])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    useToastStore.getState().addToast({
      title: 'Coupon Copied',
      message: `Promo code ${code} copied to clipboard!`,
      type: 'success',
      duration: 3000,
    })
    setTimeout(() => setCopiedCode(null), 2500)
  }

  const customerName = customer?.firstName || 'Guest'

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Greeting & Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-violet-950/70 to-slate-900 border border-violet-800/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" aria-hidden="true" />
              <span>SALORA Guest Lounge</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              {getGreeting()}, {customerName} 👋
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl">
              Welcome back to your personalized beauty haven. Your hair & aesthetic care is curated by top stylists.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/customer/book"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:from-violet-500 hover:via-pink-500 hover:to-amber-400 text-white font-semibold text-sm shadow-xl shadow-violet-600/30 hover:scale-102 transition-all focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>Book An Appointment</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              to="/customer/services"
              className="inline-flex items-center space-x-2 px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-colors focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <span>Explore Services</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Next Appointment */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-violet-500/40 transition-colors shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Next Appointment
            </span>
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            {nextAppointment ? (
              <div>
                <p className="text-lg font-bold text-white truncate">{nextAppointment.serviceName}</p>
                <p className="text-xs text-violet-300 font-medium mt-0.5">
                  {nextAppointment.date === '2026-09-25' ? 'Today' : nextAppointment.date} at {nextAppointment.startTime}
                </p>
                <p className="text-xs text-slate-400 mt-1">with {nextAppointment.staffName}</p>
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold text-slate-300">No scheduled visit</p>
                <p className="text-xs text-slate-500 mt-0.5">Book your next beauty session</p>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            {nextAppointment ? (
              <Link
                to={`/customer/appointments/${nextAppointment.id}`}
                className="text-pink-400 hover:text-pink-300 font-semibold inline-flex items-center space-x-1"
              >
                <span>View Appointment</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/customer/book"
                className="text-violet-400 hover:text-violet-300 font-semibold inline-flex items-center space-x-1"
              >
                <span>Book Slot</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* 2. Current Membership */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-colors shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Current Membership
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold text-amber-300">{customer?.membershipTier || 'Gold'}</span>
              <span className="text-xs text-slate-400">VIP Tier</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">15% off all rituals & free styling</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Valid until {customer?.membershipExpiry || '2027-04-30'}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <Link
              to="/customer/memberships"
              className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center space-x-1"
            >
              <span>View Privileges</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3. Reward Points */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-pink-500/40 transition-colors shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Reward Points
            </span>
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <Gift className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-white tabular-nums">
                {customer?.rewardPoints || 1450}
              </span>
              <span className="text-xs text-pink-400 font-semibold">pts</span>
            </div>
            <p className="text-xs text-emerald-400 font-medium mt-1">
              Worth ₹{Math.floor((customer?.rewardPoints || 1450) / 2)} instant redemption
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">+100 pts on your next review</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <Link
              to="/customer/rewards"
              className="text-pink-400 hover:text-pink-300 font-semibold inline-flex items-center space-x-1"
            >
              <span>Redeem Rewards</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4. Total Visits */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-colors shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Visits
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white tabular-nums">
                {customer?.totalVisits || 18}
              </span>
              <span className="text-xs text-cyan-400 font-medium">Salon Visits</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">Loyal Guest since Feb 2025</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Top Stylist: Rahul Verma</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <Link
              to="/customer/invoices"
              className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center space-x-1"
            >
              <span>Receipt History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Next Appointment Showcase + Recommended Rituals */}
        <div className="lg:col-span-2 space-y-8">
          {/* Highlighted Next Appointment Box */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-200">
                  Upcoming Appointment
                </h2>
              </div>
              {nextAppointment && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  Confirmed
                </span>
              )}
            </div>

            {nextAppointment ? (
              <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 flex flex-col items-center justify-center text-white shrink-0 shadow-md shadow-violet-600/30">
                    <span className="text-xs uppercase font-bold tracking-tight">Today</span>
                    <span className="text-sm font-extrabold">{nextAppointment.startTime}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{nextAppointment.serviceName}</h3>
                    <p className="text-sm text-slate-300 mt-0.5">
                      Stylist:{' '}
                      <span className="text-pink-300 font-medium">{nextAppointment.staffName}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-violet-400" />
                        <span>{nextAppointment.serviceDuration} Mins</span>
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-amber-300 font-bold tabular-nums">
                        ₹{nextAppointment.price.toLocaleString('en-IN')}
                      </span>
                      {nextAppointment.tokenNumber && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded font-mono font-semibold">
                            Token #{nextAppointment.tokenNumber}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <Link
                    to={`/customer/appointments/${nextAppointment.id}`}
                    className="flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition-colors"
                  >
                    View Appointment
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">You have no upcoming appointment</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Choose from our bespoke hair styling, luxury scalp rituals, and aesthetic treatments.
                </p>
                <Link
                  to="/customer/book"
                  className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Book Appointment Now</span>
                </Link>
              </div>
            )}

            {/* Recent Visit Quick Note */}
            {recentAppointment && (
              <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2 text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Last visited on {recentAppointment.date}:{' '}
                    <strong className="text-slate-200">{recentAppointment.serviceName}</strong> with{' '}
                    {recentAppointment.staffName}
                  </span>
                </div>
                <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                  <Link
                    to={`/customer/reviews/new?appointmentId=${recentAppointment.id}`}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white border border-amber-500/30 font-semibold transition-colors flex items-center space-x-1"
                  >
                    <Star className="w-3 h-3 fill-current" />
                    <span>Review (+100 Pts)</span>
                  </Link>
                  <Link
                    to={`/customer/book?serviceId=${recentAppointment.serviceId}`}
                    className="text-pink-400 hover:text-pink-300 font-semibold"
                  >
                    Rebook Ritual
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Recommended Services Catalog Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-400" aria-hidden="true" />
                  <span>Recommended for You</span>
                </h2>
                <p className="text-xs text-slate-400">Curated based on your hair and beauty profile</p>
              </div>
              <Link
                to="/customer/services"
                className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center space-x-1"
              >
                <span>View Full Menu</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedServices.map((service) => (
                <div
                  key={service.id}
                  className="group rounded-2xl bg-slate-900 border border-slate-800 hover:border-violet-500/40 p-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
                        {service.categoryName}
                      </span>
                      <div className="flex items-center text-amber-400 text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                        <span className="font-bold">4.9</span>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-2 group-hover:text-violet-300 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {service.description || 'Exclusive restorative ritual using salon-grade organic formulas.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">{service.duration} mins</span>
                      <span className="text-sm font-bold text-white tabular-nums">
                        ₹{service.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <Link
                      to={`/customer/book?serviceId=${service.id}`}
                      className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 text-xs font-semibold transition-colors"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Active Offers & Reward Tier Status */}
        <div className="space-y-6">
          {/* Active Offers */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Tag className="w-4 h-4 text-pink-400" aria-hidden="true" />
                <span>Current Offers</span>
              </h2>
              <Link
                to="/customer/offers"
                className="text-xs text-pink-400 hover:text-pink-300 font-semibold"
              >
                All Offers
              </Link>
            </div>

            <div className="space-y-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-pink-500/20 hover:border-pink-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pink-300">{offer.title}</span>
                    <span className="text-[10px] text-slate-400">Valid: {offer.validUntil}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{offer.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 font-mono text-xs font-bold text-amber-300 tracking-wider">
                      {offer.code}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(offer.code)}
                      className="text-xs flex items-center space-x-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                      aria-label={`Copy coupon code ${offer.code}`}
                    >
                      {copiedCode === offer.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Loyalty Level Progress */}
          <div className="rounded-3xl bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-900 border border-violet-700/30 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold tracking-wider text-amber-400">
                Tier Progress
              </span>
              <span className="text-xs text-slate-400">Next: Platinum Royale</span>
            </div>

            <div>
              <div className="flex justify-between items-baseline text-sm mb-1.5">
                <span className="font-bold text-white">{customer?.rewardPoints || 1450} Points</span>
                <span className="text-xs text-violet-400 font-medium">550 pts to Platinum</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-500 via-pink-500 to-amber-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: '72%' }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Platinum members enjoy <strong className="text-slate-200">20% off</strong> all services, priority waitlist, and 6 complimentary scalp detox sessions annually.
            </p>

            <Link
              to="/customer/rewards"
              className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              <span>Explore Rewards Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
