import React, { useState, useEffect } from 'react'
import {
  Gift,
  Award,
  Sparkles,
  Users,
  TrendingUp,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Share2,
  ArrowRight,
  Filter,
  DollarSign,
  Tag,
  AlertCircle,
  Percent,
  Sliders,
  Calendar,
  Check,
  Edit,
  Trash2,
  RefreshCw,
  Coins,
} from 'lucide-react'
import {
  LoyaltyRuleConfig,
  Reward,
  LoyaltyTransaction,
  Referral,
  LoyaltyDashboardStats,
  RewardType,
} from '@/types'
import { loyaltyService } from '@/services/loyaltyService'
import { clientService } from '@/services/clientService'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

export const RewardsPage: React.FC = () => {
  const { addToast } = useToastStore()

  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'catalog' | 'referrals'>(
    'overview'
  )
  const [stats, setStats] = useState<LoyaltyDashboardStats>({
    totalPointsIssued: 0,
    pointsRedeemed: 0,
    activeMembers: 0,
    rewardRedemptions: 0,
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
  })

  const [rules, setRules] = useState<LoyaltyRuleConfig | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters & Modals
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateRewardModalOpen, setIsCreateRewardModalOpen] = useState(false)
  const [isAdjustPointsModalOpen, setIsAdjustPointsModalOpen] = useState(false)

  // Adjust Points Form
  const [adjustClientId, setAdjustClientId] = useState('')
  const [adjustClientName, setAdjustClientName] = useState('')
  const [adjustPoints, setAdjustPoints] = useState<number>(100)
  const [adjustType, setAdjustType] = useState<'ADJUSTED' | 'BONUS'>('BONUS')
  const [adjustReason, setAdjustReason] = useState('')

  // Create Reward Form
  const [newRewardName, setNewRewardName] = useState('')
  const [newRewardDesc, setNewRewardDesc] = useState('')
  const [newRewardType, setNewRewardType] = useState<RewardType>('DISCOUNT_VOUCHER')
  const [newRewardValue, setNewRewardValue] = useState<number>(250)
  const [newRewardPoints, setNewRewardPoints] = useState<number>(500)
  const [newRewardValidDays, setNewRewardValidDays] = useState<number>(60)
  const [newRewardPopular, setNewRewardPopular] = useState(false)

  // Rules form local state
  const [rulePointsPer100, setRulePointsPer100] = useState(10)
  const [ruleBookingReward, setRuleBookingReward] = useState(50)
  const [ruleBirthdayReward, setRuleBirthdayReward] = useState(250)
  const [ruleReferralReferrer, setRuleReferralReferrer] = useState(500)
  const [ruleReferralReferred, setRuleReferralReferred] = useState(200)
  const [ruleReviewReward, setRuleReviewReward] = useState(100)
  const [ruleCampaignActive, setRuleCampaignActive] = useState(true)
  const [ruleCampaignPoints, setRuleCampaignPoints] = useState(150)
  const [ruleCampaignName, setRuleCampaignName] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [s, r, rwd, tx, ref] = await Promise.all([
        loyaltyService.getDashboardStats(),
        loyaltyService.getRules(),
        loyaltyService.getRewards(),
        loyaltyService.getAllTransactions(),
        loyaltyService.getAllReferrals(),
      ])
      setStats(s)
      setRules(r)
      setRewards(rwd)
      setTransactions(tx)
      setReferrals(ref)

      // Sync rules form
      if (r) {
        setRulePointsPer100(Math.round(r.pointsPerRupee * 100))
        setRuleBookingReward(r.bookingRewardPoints)
        setRuleBirthdayReward(r.birthdayRewardPoints)
        setRuleReferralReferrer(r.referralRewardReferrer)
        setRuleReferralReferred(r.referralRewardReferred)
        setRuleReviewReward(r.reviewRewardPoints)
        setRuleCampaignActive(r.campaignActive)
        setRuleCampaignPoints(r.campaignBonusPoints)
        setRuleCampaignName(r.campaignName || '')
      }
    } catch (err) {
      console.error('Failed to load loyalty dashboard:', err)
      addToast({
        title: 'Loading Error',
        message: 'Could not load loyalty records.',
        type: 'danger',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Save Rules Handler
  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const updated = await loyaltyService.updateRules({
        pointsPerRupee: rulePointsPer100 / 100,
        bookingRewardPoints: ruleBookingReward,
        birthdayRewardPoints: ruleBirthdayReward,
        referralRewardReferrer: ruleReferralReferrer,
        referralRewardReferred: ruleReferralReferred,
        reviewRewardPoints: ruleReviewReward,
        campaignActive: ruleCampaignActive,
        campaignBonusPoints: ruleCampaignPoints,
        campaignName: ruleCampaignName,
      })
      setRules(updated)
      addToast({
        title: 'Rule Engine Updated',
        message: 'Loyalty calculation rules saved and activated across POS and booking.',
        type: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save rules.'
      addToast({
        title: 'Update Error',
        message: msg,
        type: 'danger',
      })
    }
  }

  // Create Reward Handler
  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRewardName.trim()) {
      addToast({ title: 'Missing Name', message: 'Provide a reward name.', type: 'warning' })
      return
    }

    try {
      const created = await loyaltyService.createReward({
        name: newRewardName.trim(),
        description: newRewardDesc.trim(),
        type: newRewardType,
        value: Number(newRewardValue),
        pointsRequired: Number(newRewardPoints),
        validDays: Number(newRewardValidDays),
        active: true,
        popular: newRewardPopular,
      })

      setRewards([created, ...rewards])
      setIsCreateRewardModalOpen(false)
      // reset
      setNewRewardName('')
      setNewRewardDesc('')
      setNewRewardPoints(500)
      setNewRewardValue(250)

      addToast({
        title: 'Reward Added to Catalog',
        message: `${created.name} is now redeemable by clients for ${created.pointsRequired} points.`,
        type: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create reward.'
      addToast({ title: 'Error', message: msg, type: 'danger' })
    }
  }

  // Adjust Points Handler
  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustClientName.trim()) {
      addToast({ title: 'Missing Client', message: 'Specify client name.', type: 'warning' })
      return
    }

    try {
      const finalPoints = adjustType === 'ADJUSTED' && adjustPoints < 0 ? adjustPoints : Math.abs(adjustPoints)
      await loyaltyService.addTransaction({
        clientId: adjustClientId.trim() || `cli-${Date.now().toString().slice(-4)}`,
        clientName: adjustClientName.trim(),
        type: adjustType,
        points: finalPoints,
        reason: adjustReason.trim() || 'Manual Salon Admin Adjustment',
      })

      setIsAdjustPointsModalOpen(false)
      setAdjustClientName('')
      setAdjustReason('')
      loadData()

      addToast({
        title: 'Points Adjusted',
        message: `Updated points for ${adjustClientName} (${finalPoints > 0 ? '+' : ''}${finalPoints} points).`,
        type: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to adjust points.'
      addToast({ title: 'Adjustment Failed', message: msg, type: 'danger' })
    }
  }

  // Toggle Reward Active State
  const handleToggleReward = async (reward: Reward) => {
    try {
      const updated = await loyaltyService.updateReward(reward.id, { active: !reward.active })
      setRewards(rewards.map((r) => (r.id === reward.id ? updated : r)))
      addToast({
        title: updated.active ? 'Reward Activated' : 'Reward Paused',
        message: `${updated.name} has been ${updated.active ? 'published' : 'hidden'}.`,
        type: 'info',
      })
    } catch {
      addToast({ title: 'Error', message: 'Could not update reward.', type: 'danger' })
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      t.clientName.toLowerCase().includes(q) ||
      t.reason.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
              Loyalty, Rewards &amp; Referrals
            </h1>
            <Badge variant="primary" size="sm">
              Phase 3
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Automated points ledger, dynamic redemption catalog, configurable reward multipliers, and friend referral attribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdjustPointsModalOpen(true)}
            leftIcon={<Coins className="h-4 w-4 text-amber-500" />}
            className="text-xs"
          >
            Adjust Points
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateRewardModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
            className="text-xs"
          >
            Create Reward
          </Button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Points Issued */}
        <Card className="p-5 border border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Total Points Issued</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-text-primary mt-2 tabular-nums">
            {stats.totalPointsIssued.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 font-medium">
            <TrendingUp className="h-3 w-3" />
            <span>Automated on POS &amp; appointments</span>
          </div>
        </Card>

        {/* Points Redeemed */}
        <Card className="p-5 border border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Points Redeemed</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Gift className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-text-primary mt-2 tabular-nums">
            {stats.pointsRedeemed.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-text-muted">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span>Vouchers &amp; free service perks</span>
          </div>
        </Card>

        {/* Active Members */}
        <Card className="p-5 border border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Active Members</span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-text-primary mt-2 tabular-nums">
            {stats.activeMembers}
          </p>
          <p className="text-[11px] text-text-muted mt-1">Earning rewards across visits</p>
        </Card>

        {/* Reward Redemptions & Referrals */}
        <Card className="p-5 border border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Reward Redemptions</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-text-primary mt-2 tabular-nums">
            {stats.rewardRedemptions}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            {stats.completedReferrals} successful friend referrals
          </p>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border/80">
        <div className="flex items-center gap-2 overflow-x-auto pb-px" role="tablist">
          {[
            { id: 'overview', label: 'Point Ledger & Activity', count: transactions.length },
            { id: 'rules', label: 'Point Earning Rules' },
            { id: 'catalog', label: 'Reward Catalog', count: rewards.length },
            { id: 'referrals', label: 'Referral Reports', count: referrals.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-1.5 py-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-[color,border-color]',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full tabular-nums',
                      isActive
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300'
                        : 'bg-surface-subtle text-text-muted'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── TAB 1: POINT LEDGER & ACTIVITY ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search transactions by client, reason, or type…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              className="text-xs"
            >
              Refresh Ledger
            </Button>
          </div>

          <Card className="overflow-hidden border border-border/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle/50 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Transaction Type</th>
                    <th className="py-3 px-4 text-right">Points</th>
                    <th className="py-3 px-4">Reason / Reference</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((tx) => {
                    const isPositive = tx.points > 0
                    return (
                      <tr key={tx.id} className="hover:bg-surface-subtle/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-text-primary">
                          {tx.clientName}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider',
                              tx.type === 'EARNED'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                : tx.type === 'REDEEMED'
                                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                : tx.type === 'BONUS'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                : 'bg-primary/10 text-primary'
                            )}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td
                          className={cn(
                            'py-3 px-4 text-right font-black tabular-nums text-sm',
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {isPositive ? `+${tx.points}` : tx.points}
                        </td>
                        <td className="py-3 px-4 text-text-secondary">
                          <span>{tx.reason}</span>
                          {tx.referenceId && (
                            <span className="ml-1.5 text-[10px] text-text-muted font-mono bg-surface-subtle px-1.5 py-0.2 rounded border border-border">
                              {tx.referenceId}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-text-muted tabular-nums">
                          {formatDate(tx.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ─── TAB 2: POINT EARNING RULES ─── */}
      {activeTab === 'rules' && (
        <form onSubmit={handleSaveRules} className="space-y-6">
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Configurable Point Rule Engine
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Set baseline points per rupee spent, automated milestone triggers, and VIP membership bonus multipliers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Spend Rule */}
              <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-2">
                <label className="font-bold text-text-primary block">
                  Points per ₹100 Spent
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={rulePointsPer100}
                    onChange={(e) => setRulePointsPer100(Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-xl bg-surface border border-border font-bold text-text-primary tabular-nums"
                  />
                  <span className="text-text-muted">
                    Points (Current: ₹100 spend = {rulePointsPer100} points)
                  </span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Automatically awarded at checkout upon invoice completion.
                </p>
              </div>

              {/* Online Booking Reward */}
              <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-2">
                <label className="font-bold text-text-primary block">
                  Online Booking Reward
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={ruleBookingReward}
                    onChange={(e) => setRuleBookingReward(Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-xl bg-surface border border-border font-bold text-text-primary tabular-nums"
                  />
                  <span className="text-text-muted">Points awarded per confirmed web booking</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Incentivizes clients to reserve appointments via the self-service customer portal.
                </p>
              </div>

              {/* Birthday Celebration */}
              <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-2">
                <label className="font-bold text-text-primary block">
                  Birthday Celebration Reward
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={ruleBirthdayReward}
                    onChange={(e) => setRuleBirthdayReward(Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-xl bg-surface border border-border font-bold text-text-primary tabular-nums"
                  />
                  <span className="text-text-muted">Points on client birthday</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Triggered during the client&apos;s birthday month to boost retention.
                </p>
              </div>

              {/* Review Feedback Reward */}
              <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-2">
                <label className="font-bold text-text-primary block">
                  Verified Review Reward
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={ruleReviewReward}
                    onChange={(e) => setRuleReviewReward(Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-xl bg-surface border border-border font-bold text-text-primary tabular-nums"
                  />
                  <span className="text-text-muted">Points for verified service review</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Encourages rating specialist consultations and treatment results.
                </p>
              </div>
            </div>

            {/* Referral Reward Multipliers */}
            <div className="pt-4 border-t border-border space-y-3">
              <h4 className="text-sm font-bold text-text-primary">
                Referral Reward Allocation
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl border border-border bg-surface-subtle">
                  <label className="font-semibold text-text-primary block mb-1">
                    New Customer Welcome Bonus
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={ruleReferralReferred}
                      onChange={(e) => setRuleReferralReferred(Number(e.target.value))}
                      className="w-24 px-3 py-1.5 rounded-xl bg-surface border border-border font-bold text-text-primary tabular-nums"
                    />
                    <span className="text-text-muted">Points credited upon entering friend&apos;s code</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-surface-subtle">
                  <label className="font-semibold text-text-primary block mb-1">
                    Referrer Reward (After 1st Completed Visit)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={ruleReferralReferrer}
                      onChange={(e) => setRuleReferralReferrer(Number(e.target.value))}
                      className="w-24 px-3 py-1.5 rounded-xl bg-surface border border-border font-bold text-text-primary tabular-nums"
                    />
                    <span className="text-text-muted">Points awarded only after friend completes visit</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Bonus */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-text-primary">
                    Seasonal Campaign Bonus
                  </h4>
                  <p className="text-xs text-text-muted">
                    Temporary point booster for weekend promotions or festival periods
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ruleCampaignActive}
                    onChange={(e) => setRuleCampaignActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {ruleCampaignActive && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                  <div>
                    <label className="font-semibold text-text-secondary block mb-1">
                      Campaign Banner Title
                    </label>
                    <input
                      type="text"
                      value={ruleCampaignName}
                      onChange={(e) => setRuleCampaignName(e.target.value)}
                      placeholder="e.g. Weekend Glamour Booster (+150 Pts)"
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-text-secondary block mb-1">
                      Extra Bonus Points per Checkout
                    </label>
                    <input
                      type="number"
                      value={ruleCampaignPoints}
                      onChange={(e) => setRuleCampaignPoints(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-xs text-text-primary font-bold tabular-nums"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button variant="primary" size="md" type="submit">
                Save &amp; Activate Rules
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* ─── TAB 3: REWARD CATALOG ─── */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-text-primary">Reward Catalog Menu</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Perks, service complimentary vouchers, and bill credits redeemable by loyalty members
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateRewardModalOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Reward
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rewards.map((reward) => (
              <Card
                key={reward.id}
                className={cn(
                  'p-5 space-y-4 border transition-all',
                  reward.active
                    ? 'border-border/80 hover:border-primary/40'
                    : 'border-border/40 opacity-60 bg-surface-subtle/50'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Gift className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary leading-snug">
                        {reward.name}
                      </h4>
                      <span className="text-[10px] font-bold text-primary uppercase">
                        {reward.type === 'DISCOUNT_VOUCHER'
                          ? 'Bill Credit'
                          : reward.type === 'FREE_SERVICE'
                          ? 'Complimentary Service'
                          : 'Retail Gift'}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={reward.active ? 'success' : 'default'}
                    size="sm"
                    className="uppercase text-[9px] font-black"
                  >
                    {reward.active ? 'Active' : 'Paused'}
                  </Badge>
                </div>

                <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                  {reward.description}
                </p>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-text-muted block">Points Cost</span>
                    <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                      {reward.pointsRequired.toLocaleString('en-IN')} pts
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-text-muted block">Validity</span>
                    <span className="font-bold text-text-primary tabular-nums">
                      {reward.validDays} days
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleReward(reward)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {reward.active ? 'Pause Reward' : 'Publish Reward'}
                  </button>

                  <span className="text-[11px] text-text-muted font-mono">
                    ID: {reward.id}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: REFERRAL REPORTS ─── */}
      {activeTab === 'referrals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Customer Referral Attribution Ledger
              </h3>
              <p className="text-xs text-text-muted">
                Track advocates, friends invited, first-appointment completion status, and point rewards
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="accent" size="md">
                {referrals.filter((r) => r.status === 'COMPLETED').length} Completed
              </Badge>
              <Badge variant="warning" size="md">
                {referrals.filter((r) => r.status === 'PENDING').length} Pending
              </Badge>
            </div>
          </div>

          <Card className="overflow-hidden border border-border/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle/50 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    <th className="py-3 px-4">Referrer (Advocate)</th>
                    <th className="py-3 px-4">Referral Code</th>
                    <th className="py-3 px-4">Referred Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Reward Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-surface-subtle/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-text-primary">
                        {ref.referrerName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                          {ref.referrerCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-primary font-medium">
                        {ref.referredClientName}
                        {ref.referredClientPhone && (
                          <span className="text-[10px] text-text-muted block">
                            {ref.referredClientPhone}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-muted tabular-nums">
                        {ref.referralDate}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={ref.status === 'COMPLETED' ? 'success' : 'warning'}
                          size="sm"
                          className="uppercase text-[9px] font-black"
                        >
                          {ref.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        +{ref.rewardPointsReferrer} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ─── MODAL: CREATE REWARD ─── */}
      <Modal
        isOpen={isCreateRewardModalOpen}
        onClose={() => setIsCreateRewardModalOpen(false)}
        title="Create Loyalty Reward"
        description="Add a new perk or treatment voucher to the customer redemption catalog."
        size="md"
      >
        <form onSubmit={handleCreateReward} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-text-primary block mb-1">Reward Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. ₹500 Luxury Salon Credit or Free Hair Spa"
              value={newRewardName}
              onChange={(e) => setNewRewardName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary"
            />
          </div>

          <div>
            <label className="font-bold text-text-primary block mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Terms and services applicable for this reward…"
              value={newRewardDesc}
              onChange={(e) => setNewRewardDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-primary block mb-1">Reward Type</label>
              <select
                value={newRewardType}
                onChange={(e) => setNewRewardType(e.target.value as RewardType)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary"
              >
                <option value="DISCOUNT_VOUCHER">₹ Bill Discount</option>
                <option value="FREE_SERVICE">Complimentary Service</option>
                <option value="FREE_PRODUCT">Free Retail Product</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-text-primary block mb-1">Benefit Value (₹)</label>
              <input
                type="number"
                min="0"
                value={newRewardValue}
                onChange={(e) => setNewRewardValue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary font-bold tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-primary block mb-1">Points Required *</label>
              <input
                type="number"
                min="10"
                step="10"
                required
                value={newRewardPoints}
                onChange={(e) => setNewRewardPoints(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary font-bold tabular-nums"
              />
            </div>

            <div>
              <label className="font-bold text-text-primary block mb-1">Validity (Days)</label>
              <input
                type="number"
                min="7"
                max="365"
                value={newRewardValidDays}
                onChange={(e) => setNewRewardValidDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary tabular-nums"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="popularCheck"
              checked={newRewardPopular}
              onChange={(e) => setNewRewardPopular(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
            />
            <label htmlFor="popularCheck" className="text-xs font-semibold text-text-secondary">
              Highlight as &quot;Popular Choice&quot; in Customer Portal
            </label>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setIsCreateRewardModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Publish Reward
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: ADJUST POINTS ─── */}
      <Modal
        isOpen={isAdjustPointsModalOpen}
        onClose={() => setIsAdjustPointsModalOpen(false)}
        title="Manual Points Adjustment"
        description="Append or deduct loyalty points with immutable audit record."
        size="sm"
      >
        <form onSubmit={handleAdjustPoints} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-text-primary block mb-1">Client Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Priya Sharma"
              value={adjustClientName}
              onChange={(e) => setAdjustClientName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-text-primary block mb-1">Adjustment Type</label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as 'ADJUSTED' | 'BONUS')}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary"
              >
                <option value="BONUS">Bonus Reward (+)</option>
                <option value="ADJUSTED">Manual Adjustment</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-text-primary block mb-1">Points</label>
              <input
                type="number"
                required
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary font-bold tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-text-primary block mb-1">Reason / Note *</label>
            <input
              type="text"
              required
              placeholder="e.g. Compensation for wait time / VIP Goodwill"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setIsAdjustPointsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
