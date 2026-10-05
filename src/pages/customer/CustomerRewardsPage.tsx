import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Gift,
  Award,
  Sparkles,
  Copy,
  Check,
  Share2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  Users,
  Tag,
  Ticket,
  ChevronRight,
  ShieldCheck,
  PartyPopper,
  Flame,
} from 'lucide-react'
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore'
import { useToastStore } from '@/store/useToastStore'
import { loyaltyService } from '@/services/loyaltyService'
import { Reward, RewardRedemption, LoyaltyTransaction, Referral } from '@/types'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

export const CustomerRewardsPage: React.FC = () => {
  const { customer, updateProfile } = useCustomerAuthStore()
  const { addToast } = useToastStore()

  const clientId = customer?.id || 'cli-priya'
  const clientName = customer?.fullName || customer?.firstName || 'Priya Sharma'

  const [activeTab, setActiveTab] = useState<'catalog' | 'vouchers' | 'referrals' | 'history'>('catalog')
  const [balance, setBalance] = useState<number>(850)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [vouchers, setVouchers] = useState<RewardRedemption[]>([])
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [referralCode, setReferralCode] = useState<string>('PRIYA20')

  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // Load customer data from loyalty service
  const loadData = async () => {
    try {
      const [currentBal, rwds, vchs, txs, refs, code] = await Promise.all([
        loyaltyService.getClientBalance(clientId),
        loyaltyService.getActiveRewards(),
        loyaltyService.getClientVouchers(clientId),
        loyaltyService.getClientTransactions(clientId),
        loyaltyService.getClientReferrals(clientId),
        loyaltyService.getClientReferralCode(clientId, clientName),
      ])
      setBalance(currentBal)
      setRewards(rwds)
      setVouchers(vchs)
      setTransactions(txs)
      setReferrals(refs)
      setReferralCode(code)

      // Sync customer user state
      if (customer && customer.rewardPoints !== currentBal) {
        updateProfile({ rewardPoints: currentBal, referralCode: code })
      }
    } catch (err) {
      console.error('Failed to load customer loyalty data:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [clientId])

  // Dynamic milestone calculation:
  // Finds the next closest reward above current points
  const milestone = useMemo(() => {
    const higherRewards = rewards
      .filter((r) => r.pointsRequired > balance)
      .sort((a, b) => a.pointsRequired - b.pointsRequired)

    if (higherRewards.length > 0) {
      const nextRwd = higherRewards[0]
      const diff = nextRwd.pointsRequired - balance
      const progress = Math.min(100, Math.round((balance / nextRwd.pointsRequired) * 100))
      return {
        targetReward: nextRwd,
        pointsNeeded: diff,
        progress,
        message: `You're ${diff} points away from ${nextRwd.name}.`,
      }
    }

    // Default or top tier reached
    return {
      targetReward: null,
      pointsNeeded: 0,
      progress: 100,
      message: "You've unlocked all current reward tiers! Keep earning for future VIP drops.",
    }
  }, [rewards, balance])

  // Referral URL
  const shareableUrl = `${window.location.origin}/customer/register?ref=${referralCode}`

  // Native Share API with fallback
  const handleShareReferral = async () => {
    const shareData = {
      title: 'Join me at SALORA Luxury Salon & Spa!',
      text: `Use my exclusive code ${referralCode} to get 200 Welcome Bonus Reward Points on your first salon visit! ✨`,
      url: shareableUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        addToast({
          title: 'Shared Successfully',
          message: 'Thank you for sharing your referral code!',
          type: 'success',
        })
        return
      } catch (err) {
        // User cancelled or share failed, fallback to clipboard
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareData.text} Sign up here: ${shareableUrl}`)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
      addToast({
        title: 'Referral Link Copied',
        message: 'Your referral code and invite link copied to clipboard.',
        type: 'success',
      })
    } catch (err) {
      addToast({
        title: 'Unable to Copy',
        message: 'Please manually copy the referral code.',
        type: 'danger',
      })
    }
  }

  // Copy voucher or referral code
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2500)
    addToast({
      title: 'Code Copied',
      message: `Code "${code}" copied to clipboard.`,
      type: 'info',
    })
  }

  // Handle Reward Redemption
  const handleConfirmRedeem = async () => {
    if (!selectedReward) return
    setIsRedeeming(true)
    try {
      const voucher = await loyaltyService.redeemReward(clientId, clientName, selectedReward.id)
      await loadData()
      setSelectedReward(null)
      setActiveTab('vouchers')
      addToast({
        title: '🎉 Perk Redeemed Successfully!',
        message: `Your voucher ${voucher.code} is ready in your wallet.`,
        type: 'success',
      })
    } catch (err: any) {
      addToast({
        title: 'Redemption Failed',
        message: err.message || 'Could not redeem reward. Please check your balance.',
        type: 'danger',
      })
    } finally {
      setIsRedeeming(false)
    }
  }

  // Referral Stats
  const completedReferrals = referrals.filter((r) => r.status === 'COMPLETED')
  const pendingReferrals = referrals.filter((r) => r.status === 'PENDING')
  const totalEarnedFromRefs = completedReferrals.reduce(
    (sum, r) => sum + (r.rewardPointsReferrer || 500),
    0
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ─── HERO POINTS BANNER ─── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-pink-950/40 to-slate-950 border border-pink-500/30 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-semibold">
              <Gift className="w-3.5 h-3.5" />
              <span>SALORA Loyalty & VIP Circle</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Points, Perks & Referrals
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed">
              Earn 10 points for every ₹100 spent on any salon ritual or luxury retail item. Redeem
              your points anytime for instant discounts, complimentary rituals, and VIP upgrades.
            </p>

            {/* Dynamic Milestone Card */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-950/70 border border-pink-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-pink-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  {milestone.message}
                </span>
                <span className="font-bold text-white tabular-nums">{milestone.progress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${milestone.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Points Balance Tile */}
          <div className="p-6 rounded-3xl bg-slate-950/90 border border-pink-500/30 text-center sm:text-right shrink-0 shadow-xl space-y-2">
            <div className="flex items-center justify-center sm:justify-end gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Available Balance
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Gold 1.5×
              </span>
            </div>

            <div className="flex items-baseline justify-center sm:justify-end space-x-2">
              <span className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-amber-300 tabular-nums">
                {balance}
              </span>
              <span className="text-base font-bold text-pink-400">PTS</span>
            </div>

            <p className="text-xs text-emerald-400 font-medium">
              ≈ ₹{Math.floor(balance / 2)} Instant Redemption Value
            </p>

            <div className="pt-2 flex items-center justify-center sm:justify-end gap-2 text-xs text-slate-400">
              <Ticket className="w-3.5 h-3.5 text-pink-400" />
              <span>
                {vouchers.filter((v) => v.status === 'ACTIVE').length} Active Vouchers in Wallet
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ─── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all',
            activeTab === 'catalog'
              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          )}
        >
          <Award className="w-4 h-4" />
          <span>Reward Catalog</span>
          <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
            {rewards.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vouchers')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all',
            activeTab === 'vouchers'
              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          )}
        >
          <Ticket className="w-4 h-4" />
          <span>My Vouchers</span>
          {vouchers.filter((v) => v.status === 'ACTIVE').length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[10px]">
              {vouchers.filter((v) => v.status === 'ACTIVE').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('referrals')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all',
            activeTab === 'referrals'
              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          )}
        >
          <Users className="w-4 h-4" />
          <span>Refer & Earn (500 pts)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all',
            activeTab === 'history'
              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          )}
        >
          <Clock className="w-4 h-4" />
          <span>Point Ledger ({transactions.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: REWARD CATALOG ─── */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Available Salon Perks</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Select any reward to redeem points for an instant digital voucher code.
              </p>
            </div>
            <Link
              to="/customer/book"
              className="text-xs font-semibold text-pink-400 hover:text-pink-300 flex items-center gap-1"
            >
              <span>Book Appointment</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rewards.map((reward) => {
              const canAfford = balance >= reward.pointsRequired
              const diff = reward.pointsRequired - balance

              return (
                <div
                  key={reward.id}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-pink-500/40 transition-all p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group"
                >
                  {reward.popular && (
                    <div className="absolute top-4 right-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-pink-400" />
                        Popular
                      </span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
                      <Gift className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-pink-200 transition-colors">
                        {reward.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {reward.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Badge variant="default" className="text-[11px] text-pink-300 border-pink-500/30">
                        {reward.type === 'DISCOUNT_VOUCHER'
                          ? `₹${reward.value} Discount`
                          : reward.type === 'FREE_SERVICE'
                          ? 'Complimentary Ritual'
                          : 'Retail Gift'}
                      </Badge>
                      <Badge variant="default" className="text-[11px] text-slate-400 border-slate-700">
                        Valid {reward.validDays || 60} days
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Cost</span>
                      <span className="text-lg font-black text-amber-400 tabular-nums">
                        {reward.pointsRequired} <span className="text-xs text-slate-400">pts</span>
                      </span>
                    </div>

                    <Button
                      size="sm"
                      disabled={!canAfford}
                      onClick={() => setSelectedReward(reward)}
                      className={cn(
                        'rounded-xl text-xs font-semibold px-4',
                        canAfford
                          ? 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-md shadow-pink-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      )}
                    >
                      {canAfford ? 'Redeem Perk' : `Need ${diff} more`}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 2: MY VOUCHERS WALLET ─── */}
      {activeTab === 'vouchers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-pink-400" />
                <span>My Active & Past Vouchers</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Provide these codes at salon checkout or apply online to claim your perks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className="text-xs font-semibold text-pink-400 hover:text-pink-300"
            >
              + Redeem Another Perk
            </button>
          </div>

          {vouchers.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No Vouchers Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  You have not redeemed any rewards yet. Browse the catalog to claim your first reward!
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setActiveTab('catalog')}
                className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs"
              >
                Browse Reward Catalog
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {vouchers.map((v) => {
                const isExpired = new Date(v.expiresAt) < new Date() || v.status === 'EXPIRED'
                const isUsed = v.status === 'USED'
                const isActive = v.status === 'ACTIVE' && !isExpired

                return (
                  <div
                    key={v.id}
                    className={cn(
                      'p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 shadow-xl',
                      isActive
                        ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-pink-950/20 border-pink-500/40 hover:border-pink-500'
                        : 'bg-slate-900/60 border-slate-800 opacity-60'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        {v.type === 'DISCOUNT_VOUCHER'
                          ? `₹${v.value} OFF`
                          : v.type === 'FREE_SERVICE'
                          ? 'FREE RITUAL'
                          : 'PRODUCT'}
                      </span>
                      <Badge
                        variant={isActive ? 'success' : isUsed ? 'default' : 'danger'}
                        className="text-[10px]"
                      >
                        {isActive ? 'Ready to Use' : isUsed ? 'Redeemed' : 'Expired'}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">{v.rewardName}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Expires: {formatDate(v.expiresAt)}
                      </p>
                    </div>

                    {/* Voucher Code Box */}
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest">
                          VOUCHER CODE
                        </span>
                        <span className="font-mono text-base font-black text-amber-300 tracking-wider">
                          {v.code}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!isActive}
                        onClick={() => handleCopy(v.code)}
                        className="rounded-xl text-xs h-8 px-3"
                      >
                        {copiedCode === v.code ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: REFER & EARN ─── */}
      {activeTab === 'referrals' && (
        <div className="space-y-8">
          {/* Main Referral Share Card */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                <Users className="w-3.5 h-3.5" />
                <span>Give 200 PTS, Get 500 PTS</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Invite Friends to SALORA & Earn 500 Points
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed">
                Share your unique code with family and friends. When they register with your code,
                they instantly receive <strong className="text-pink-400">200 Welcome Points</strong>.
                Once they complete their first salon appointment, you earn{' '}
                <strong className="text-amber-400">500 Bonus Points</strong> directly to your ledger!
              </p>

              {/* Code & Share Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-950 border border-purple-500/30">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
                      YOUR EXCLUSIVE CODE
                    </span>
                    <span className="text-xl font-black text-amber-300 tracking-widest font-mono">
                      {referralCode}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(referralCode)}
                    className="text-xs text-purple-300 hover:text-white"
                  >
                    {copiedCode === referralCode ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <Button
                  onClick={handleShareReferral}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl px-6 py-3 shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Referral Link</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Referral Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Successful Referrals</span>
                <p className="text-2xl font-black text-white tabular-nums">
                  {completedReferrals.length}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Pending 1st Visits</span>
                <p className="text-2xl font-black text-white tabular-nums">
                  {pendingReferrals.length}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Points Earned</span>
                <p className="text-2xl font-black text-amber-300 tabular-nums">
                  +{totalEarnedFromRefs} <span className="text-xs text-slate-400">pts</span>
                </p>
              </div>
            </div>
          </div>

          {/* How It Works Steps */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
              How Referral Rewards Work
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <span className="w-7 h-7 rounded-xl bg-pink-500/20 text-pink-300 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h4 className="text-sm font-bold text-white">Share Your Link</h4>
                <p className="text-xs text-slate-400">
                  Send your personal code or WhatsApp link to your friends and salon enthusiasts.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <span className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h4 className="text-sm font-bold text-white">Friend Gets 200 PTS</h4>
                <p className="text-xs text-slate-400">
                  When they book or register with your code, 200 points are added to their wallet immediately.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h4 className="text-sm font-bold text-white">You Get 500 PTS</h4>
                <p className="text-xs text-slate-400">
                  Upon completion of their first appointment checkout, 500 points automatically land in your account.
                </p>
              </div>
            </div>
          </div>

          {/* Referrals Activity List */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Friends You Referred</span>
            </h3>

            {referrals.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                You haven&apos;t invited any friends yet. Share your code above to get started!
              </p>
            ) : (
              <div className="divide-y divide-slate-800">
                {referrals.map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{r.referredClientName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Referred on {formatDate(r.referralDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        variant={r.status === 'COMPLETED' ? 'success' : 'warning'}
                        className="text-[10px]"
                      >
                        {r.status === 'COMPLETED' ? 'Completed & Paid' : 'Awaiting 1st Visit'}
                      </Badge>
                      <span
                        className={cn(
                          'font-bold tabular-nums',
                          r.status === 'COMPLETED' ? 'text-amber-400' : 'text-slate-500'
                        )}
                      >
                        {r.status === 'COMPLETED' ? `+${r.rewardPointsReferrer} pts` : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: POINT TRANSACTION LEDGER ─── */}
      {activeTab === 'history' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-pink-400" />
                <span>Points Transaction History</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every point earned, redeemed, or adjusted is permanently recorded in your ledger.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Total Transactions: {transactions.length}
            </span>
          </div>

          {transactions.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No points activity yet.</p>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {transactions.map((t) => {
                const isPositive = t.points > 0
                return (
                  <div key={t.id} className="py-3.5 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            t.type === 'EARNED'
                              ? 'success'
                              : t.type === 'REDEEMED'
                              ? 'primary'
                              : t.type === 'BONUS'
                              ? 'accent'
                              : t.type === 'EXPIRED'
                              ? 'danger'
                              : 'default'
                          }
                          className="text-[10px] uppercase font-bold"
                        >
                          {t.type}
                        </Badge>
                        <span className="font-semibold text-white">{t.reason}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{formatDate(t.createdAt)}</span>
                        {t.referenceId && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-500">Ref: {t.referenceId}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={cn(
                          'text-base font-black tabular-nums',
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        )}
                      >
                        {isPositive ? `+${t.points}` : t.points}
                      </span>
                      <span className="text-xs text-slate-400 block font-medium">pts</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── REDEEM REWARD CONFIRMATION MODAL ─── */}
      {selectedReward && (
        <Modal
          isOpen={!!selectedReward}
          onClose={() => setSelectedReward(null)}
          title="Confirm Perk Redemption"
          size="md"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-start gap-3">
              <PartyPopper className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">{selectedReward.name}</h4>
                <p className="text-xs text-slate-300 mt-1">{selectedReward.description}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900">
                <span className="text-slate-400">Points to Deduct:</span>
                <span className="font-black text-rose-400 tabular-nums">
                  -{selectedReward.pointsRequired} pts
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900">
                <span className="text-slate-400">Current Balance:</span>
                <span className="font-bold text-white tabular-nums">{balance} pts</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900">
                <span className="text-slate-400">Balance After Claiming:</span>
                <span className="font-bold text-amber-300 tabular-nums">
                  {balance - selectedReward.pointsRequired} pts
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900">
                <span className="text-slate-400">Voucher Validity:</span>
                <span className="font-semibold text-white">
                  {selectedReward.validDays || 60} days from today
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                variant="ghost"
                onClick={() => setSelectedReward(null)}
                disabled={isRedeeming}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmRedeem}
                disabled={isRedeeming}
                className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold"
              >
                {isRedeeming ? 'Generating Voucher…' : `Confirm & Spend ${selectedReward.pointsRequired} Pts`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
