import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Scissors,
  Users,
  BarChart3,
  Gift,
  Award,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useSalonStore } from '@/store/useSalonStore'
import { useUIStore } from '@/store/useUIStore'
import { useAIStore } from '@/store/useAIStore'
import { useToastStore } from '@/store/useToastStore'
import { appointmentService } from '@/services/appointmentService'
import { dashboardService } from '@/services/dashboardService'
import { loyaltyService } from '@/services/loyaltyService'
import {
  TimeframeFilter,
  DashboardStats,
  Appointment,
  Product,
  PopularService,
  ClientGrowthPoint,
  Review,
  LoyaltyDashboardStats,
} from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { Drawer } from '@/components/ui/Drawer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import {
  DashboardHeader,
  DashboardStatCards,
  QuickActionsBar,
  AppointmentsTodayCard,
  PromotionalBanner,
  RevenueOverviewCard,
  UpcomingAppointmentsCard,
  LowStockAlertsCard,
  PopularServicesCard,
  ClientGrowthCard,
  RecentReviewsCard,
  LiveQueueWidget,
  TodaysAttentionWidget,
  DashboardReportsWidgetArea,
} from '@/features/dashboard'
import { DashboardInsightsWidget } from '@/components/insights/DashboardInsightsWidget'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { salon } = useSalonStore()
  const { openNewAppointmentModal, openNewClientModal } = useUIStore()
  const { openDrawer } = useAIStore()
  const { addToast } = useToastStore()

  // State
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('today')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [popularServices, setPopularServices] = useState<PopularService[]>([])
  const [clientGrowth, setClientGrowth] = useState<ClientGrowthPoint[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loyaltyStats, setLoyaltyStats] = useState<LoyaltyDashboardStats | null>(null)
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch initial data
  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    Promise.all([
      dashboardService.getStats(timeframe),
      appointmentService.getAll(),
      dashboardService.getLowStockAlerts(),
      dashboardService.getPopularServices(),
      dashboardService.getClientGrowth(),
      dashboardService.getRecentReviews(),
      loyaltyService.getDashboardStats(),
    ])
      .then(([statsData, appts, lowStock, services, growth, revs, lytStats]) => {
        if (!isMounted) return
        setStats(statsData)
        setAppointments(appts)
        setProducts(lowStock)
        setPopularServices(services)
        setClientGrowth(growth)
        setReviews(revs)
        setLoyaltyStats(lytStats)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err)
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Handle timeframe change (reacting to mock data)
  const handleTimeframeChange = async (tf: TimeframeFilter) => {
    setTimeframe(tf)
    try {
      const updatedStats = await dashboardService.getStats(tf)
      setStats(updatedStats)
      addToast({
        title: 'Filter Applied',
        message: `Showing metrics for ${tf === 'today' ? 'Today' : tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : 'Custom Range'}.`,
        type: 'info',
      })
    } catch {
      addToast({
        title: 'Filter Error',
        message: 'Could not load metrics for selected timeframe.',
        type: 'danger',
      })
    }
  }

  // Handle appointment status update
  const handleUpdateStatus = async (apptId: string, status: Appointment['status']) => {
    try {
      const updated = await appointmentService.updateStatus(apptId, status)
      setAppointments((prev) => prev.map((a) => (a.id === apptId ? updated : a)))
      if (selectedAppt && selectedAppt.id === apptId) {
        setSelectedAppt(updated)
      }
      addToast({
        title: 'Status Updated',
        message: `Appointment marked as ${status}.`,
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Update Failed',
        message: 'Could not update appointment status.',
        type: 'danger',
      })
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Dashboard Header */}
      <DashboardHeader
        userName={user?.name || 'there'}
        activeTimeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        onNewAppointment={openNewAppointmentModal}
      />

      {/* 2. KPI Stat Cards */}
      {stats ? (
        <DashboardStatCards stats={stats} currency="INR" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-3xl bg-surface border border-border animate-pulse p-6"
            />
          ))}
        </div>
      )}

      {/* 2.5. Loyalty, Rewards & Referral Metrics (Phase 3 Part 4) */}
      {loyaltyStats && (
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/5 to-surface border border-pink-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
              <Gift className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-text-primary">
                  Loyalty Circle &amp; Referral Growth
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-500/20 text-pink-600 dark:text-pink-300">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Reward member engagement, point redemptions, and friend-to-friend customer acquisition.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <div>
              <span className="text-[9px] uppercase font-bold text-text-muted block">
                Loyalty Members
              </span>
              <span className="text-sm sm:text-base font-bold text-text-primary tabular-nums">
                {loyaltyStats.activeMembers} clients
              </span>
            </div>

            <div className="h-6 w-px bg-border hidden sm:block" />

            <div>
              <span className="text-[9px] uppercase font-bold text-text-muted block">
                Points Redeemed
              </span>
              <span className="text-sm sm:text-base font-bold text-pink-600 dark:text-pink-300 tabular-nums">
                {loyaltyStats.pointsRedeemed.toLocaleString()} pts
              </span>
            </div>

            <div className="h-6 w-px bg-border hidden sm:block" />

            <div>
              <span className="text-[9px] uppercase font-bold text-text-muted block">
                Referral Conversions
              </span>
              <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {loyaltyStats.completedReferrals} / {loyaltyStats.totalReferrals}{' '}
                <span className="text-[11px] font-semibold text-text-muted">
                  ({loyaltyStats.totalReferrals > 0 ? Math.round((loyaltyStats.completedReferrals / loyaltyStats.totalReferrals) * 100) : 0}%)
                </span>
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/rewards')}
              className="text-xs h-8 px-2.5 border-pink-500/30 hover:border-pink-500 text-pink-700 dark:text-pink-300"
            >
              <span>Rewards Desk</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* 2.8 Salora AI Assistant Quick Cockpit */}
      <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/5 to-surface border border-primary/20 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-text-primary">
                Salora AI Business Assistant
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/20 text-primary">
                Live Data Connected
              </span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              Ask questions about your salon appointments, revenue, client retention, or inventory stock.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            "How did we perform this month?",
            "Show today's pending payments.",
            "How many clients haven't visited recently?",
          ].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => openDrawer(prompt, { sourcePage: 'dashboard' })}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-surface border border-border hover:border-primary text-text-secondary hover:text-primary transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3 h-3 text-primary shrink-0" />
              <span className="truncate max-w-[140px] sm:max-w-[180px]">{prompt}</span>
            </button>
          ))}
          <Button
            size="sm"
            variant="primary"
            onClick={() => openDrawer(undefined, { sourcePage: 'dashboard' })}
            className="text-xs h-8 px-2.5"
          >
            <span>Ask AI</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* 3. Quick Actions Compact Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
            Quick Actions
          </span>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <button
              type="button"
              onClick={() => navigate('/appointments')}
              className="hover:text-primary transition-[color]"
            >
              All Appointments
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => navigate('/clients')}
              className="hover:text-primary transition-[color]"
            >
              Clients
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => navigate('/services')}
              className="hover:text-primary transition-[color]"
            >
              Services
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="hover:text-primary transition-[color]"
            >
              Reports
            </button>
          </div>
        </div>
        <QuickActionsBar />
      </div>

      {/* 4. Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* LEFT COLUMN: Appointments Today Card */}
        <div className="lg:col-span-1 xl:col-span-4 flex flex-col min-w-0">
          <AppointmentsTodayCard
            appointments={appointments}
            onSelectAppointment={(appt) => setSelectedAppt(appt)}
            onUpdateStatus={handleUpdateStatus}
          />
        </div>

        {/* MIDDLE COLUMN: Promotional Salon Banner & Revenue Overview Chart */}
        <div className="lg:col-span-1 xl:col-span-5 flex flex-col gap-4 sm:gap-5 min-w-0">
          <PromotionalBanner />
          <RevenueOverviewCard currency="INR" />
        </div>

        {/* RIGHT COLUMN: Live Queue, Upcoming Appointments & Low Stock Alerts */}
        <div className="lg:col-span-2 xl:col-span-3 flex flex-col gap-4 sm:gap-5 min-w-0">
          <TodaysAttentionWidget />
          <LiveQueueWidget />
          <UpcomingAppointmentsCard
            appointments={appointments}
            onSelectAppointment={(appt) => setSelectedAppt(appt)}
          />
          <LowStockAlertsCard products={products} />
        </div>
      </div>

      {/* Pinned Business Intelligence & Analytics Report Widgets */}
      <DashboardReportsWidgetArea />

      {/* 4.8 Salora AI Insights Dashboard Card (Phase 5 Part 2) */}
      <DashboardInsightsWidget />

      {/* 5. Bottom Section: Popular Services, Client Growth, Recent Reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Popular Services with horizontal progress bars */}
        <div className="min-w-0 overflow-hidden">
          <PopularServicesCard services={popularServices} />
        </div>

        {/* Client Growth with 6-month Bar Chart */}
        <div className="min-w-0 overflow-hidden">
          <ClientGrowthCard growthData={clientGrowth} />
        </div>

        {/* Recent Guest Reviews */}
        <div className="min-w-0 overflow-hidden md:col-span-2 lg:col-span-1">
          <RecentReviewsCard reviews={reviews} />
        </div>
      </div>

      {/* 6. Interactive Appointment Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedAppt)}
        onClose={() => setSelectedAppt(null)}
        title={selectedAppt?.serviceName || 'Appointment Details'}
        description={`Scheduled for ${selectedAppt?.clientName}`}
        size="md"
        footer={
          selectedAppt && (
            <div className="w-full flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus(selectedAppt.id, 'cancelled')}
              >
                Cancel Appt
              </Button>
              <div className="flex items-center gap-2">
                {selectedAppt.status !== 'in-progress' && selectedAppt.status !== 'completed' && (
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedAppt.id, 'in-progress')}
                  >
                    Check In Guest
                  </Button>
                )}
                {selectedAppt.status !== 'completed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedAppt.id, 'completed')}
                  >
                    Complete & Invoice
                  </Button>
                )}
              </div>
            </div>
          )
        }
      >
        {selectedAppt && (
          <div className="space-y-6">
            {/* Status and Pricing overview */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-border">
              <div>
                <span className="text-xs text-text-muted">Current Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedAppt.status} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-text-muted">Total Charge</span>
                <p className="text-base font-bold text-text-primary tabular-nums mt-0.5">
                  {formatCurrency(selectedAppt.totalAmount, 'INR')}
                </p>
              </div>
            </div>

            {/* Client Profile Snippet */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Client Profile
              </h4>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-surface">
                <Avatar name={selectedAppt.clientName} src={selectedAppt.clientAvatar} size="md" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-text-primary truncate">
                    {selectedAppt.clientName}
                  </span>
                  <span className="text-xs text-text-muted">{selectedAppt.clientPhone}</span>
                </div>
              </div>
            </div>

            {/* Appointment Schedule Info */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Schedule & Location
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl border border-border bg-surface">
                  <span className="text-text-muted">Date & Time</span>
                  <p className="font-semibold text-text-primary mt-1 tabular-nums">
                    {selectedAppt.date} at {selectedAppt.startTime}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl border border-border bg-surface">
                  <span className="text-text-muted">Assigned Station</span>
                  <p className="font-semibold text-text-primary mt-1">
                    {selectedAppt.roomOrStation || 'Styling Chair 01'}
                  </p>
                </div>
              </div>
            </div>

            {/* Specialist Info */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Assigned Specialist
              </h4>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-surface">
                <Avatar name={selectedAppt.staffName} src={selectedAppt.staffAvatar} size="sm" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary">{selectedAppt.staffName}</span>
                  <span className="text-[11px] text-text-muted">Senior Stylist & Aesthetician</span>
                </div>
              </div>
            </div>

            {/* Stylist Treatment Notes */}
            {selectedAppt.notes && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Stylist Notes & Formula
                </h4>
                <div className="p-3.5 rounded-2xl border border-border bg-surface-subtle/80 text-xs text-text-secondary leading-relaxed">
                  {selectedAppt.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
