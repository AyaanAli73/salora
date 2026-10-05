import React, { useState, useEffect } from 'react'
import {
  Award,
  Sparkles,
  CheckCircle2,
  Star,
  ShieldCheck,
  ArrowRight,
  Gift,
  Clock,
  Crown,
  AlertTriangle,
  CreditCard,
  Check,
  Zap,
} from 'lucide-react'
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore'
import { membershipService } from '@/services/membershipService'
import { MembershipPlan, ClientMembership } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/formatters'
import { useToastStore } from '@/store/useToastStore'

export const CustomerMembershipsPage: React.FC = () => {
  const { customer, updateProfile } = useCustomerAuthStore()
  const { addToast } = useToastStore()

  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [activeMembership, setActiveMembership] = useState<ClientMembership | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Purchase Wizard Modal State
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  const [purchaseStep, setPurchaseStep] = useState<'review' | 'payment' | 'success'>('review')
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi')
  const [isProcessing, setIsProcessing] = useState(false)

  const loadMembershipData = async () => {
    setIsLoading(true)
    try {
      const [allPlans, currentMem] = await Promise.all([
        membershipService.getAllPlans(),
        customer ? membershipService.getClientActiveMembership(customer.id) : null,
      ])
      setPlans(allPlans)
      setActiveMembership(currentMem)
    } catch (err) {
      console.error('Failed to load memberships:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMembershipData()
  }, [customer?.id])

  const handleOpenPurchase = (plan: MembershipPlan) => {
    setSelectedPlan(plan)
    setPurchaseStep('review')
  }

  const handleConfirmPurchase = async () => {
    if (!selectedPlan || !customer) return
    setIsProcessing(true)

    try {
      // Simulate existing payment gateway processing (e.g. Razorpay / UPI intent)
      await new Promise((resolve) => setTimeout(resolve, 800))

      const paymentLabel =
        paymentMethod === 'upi'
          ? 'UPI Instant / Google Pay'
          : paymentMethod === 'card'
          ? 'Credit / Debit Card'
          : 'Net Banking'

      const newMembership = await membershipService.purchaseMembership({
        clientId: customer.id,
        clientName: customer.fullName,
        clientPhone: customer.phone,
        planId: selectedPlan.id,
        paymentMethod: paymentLabel,
      })

      // Update customer auth profile
      updateProfile({
        membershipTier: selectedPlan.tier as any,
        membershipExpiry: newMembership.expiryDate,
      })

      setActiveMembership(newMembership)
      setPurchaseStep('success')

      addToast({
        title: 'Privilege Activated',
        message: `Welcome to the SALORA ${selectedPlan.tier} Privilege Club!`,
        type: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment authorization failed'
      addToast({ title: 'Payment Error', message: msg, type: 'danger' })
    } finally {
      setIsProcessing(false)
    }
  }

  const totalBenefitsCount = activeMembership
    ? activeMembership.benefits.reduce((acc, b) => acc + (b.limit || (b.value > 0 ? 1 : 0)), 0)
    : 10

  const usedBenefitsCount = activeMembership
    ? activeMembership.benefits.reduce((acc, b) => acc + (b.usedCount || 0), 0)
    : 3

  const isExpiringSoon = activeMembership?.status === 'EXPIRING'

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>SALORA VIP Privilege Club</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
            Exclusive Membership Tiers
          </h1>
          <p className="text-slate-300 text-sm">
            Elevate your salon journey with curated annual privileges, dedicated styling suites, complimentary treatments, and preferred booking priority.
          </p>
        </div>

        {/* CURRENT ACTIVE PLAN CARD (Requirement 5: Current Plan, Start Date, Expiry Date, Benefits, Usage) */}
        {activeMembership && (
          <div className="mt-6 p-5 rounded-2xl bg-slate-950/90 border border-amber-500/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/20">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                      Current Active Plan
                    </span>
                    {isExpiringSoon && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        Expiring Soon
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold text-white">{activeMembership.planName}</h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {activeMembership.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Metrics: Start Date, Expiry Date, Visits, Benefits Used (Requirement 5) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Member Since</span>
                <span className="font-bold text-white tabular-nums text-sm">
                  {activeMembership.startDate || '25 Apr 2026'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Expiry Date</span>
                <span className={`font-bold tabular-nums text-sm ${isExpiringSoon ? 'text-amber-400' : 'text-white'}`}>
                  {activeMembership.expiryDate || '25 Sep 2027'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Salon Visits</span>
                <span className="font-bold text-white tabular-nums text-sm">
                  {activeMembership.visitsCount || 8} Visits
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Benefits Used</span>
                <span className="font-bold text-amber-400 tabular-nums text-sm">
                  {usedBenefitsCount} / {totalBenefitsCount}
                </span>
              </div>
            </div>

            {/* Active Entitlements Breakdown */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Your Included Privileges
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeMembership.benefits.map((b) => (
                  <div
                    key={b.id}
                    className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-slate-200 font-medium">{b.name}</span>
                    </div>
                    {Boolean(b.limit) && (
                      <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        {b.limit! - (b.usedCount || 0)} / {b.limit} Left
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Available Plans Catalog (Requirement 2 & 6: Choose Membership) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white">Select a VIP Privilege Tier</h2>
          <p className="text-xs text-slate-400">
            Compare benefits, savings, and complimentary treatment allowances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = activeMembership?.planId === plan.id

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between border transition-all duration-200 relative ${
                  plan.popular
                    ? 'bg-slate-900/95 border-amber-500/60 ring-2 ring-amber-500/30'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-pink-500 text-slate-950 text-[10px] uppercase font-black tracking-wider px-3.5 py-1 rounded-full shadow-md">
                    Most Popular Choice
                  </span>
                )}

                <div>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <span className="text-xs text-slate-400">{plan.durationMonths} Months</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 min-h-[36px]">{plan.description}</p>

                  <div className="mt-5 pb-5 border-b border-slate-800">
                    <span className="text-3xl font-extrabold text-white tabular-nums">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-xs text-slate-400"> / {plan.durationMonths} Months</span>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Included Privileges
                    </span>
                    {plan.benefits.map((b) => (
                      <div key={b.id} className="flex items-start space-x-2.5 text-xs text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">{b.name}</span>
                          {b.description && (
                            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{b.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800">
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center">
                      Current Active Membership
                    </div>
                  ) : (
                    <Button
                      variant={plan.popular ? 'primary' : 'outline'}
                      size="md"
                      onClick={() => handleOpenPurchase(plan)}
                      className="w-full text-xs font-bold"
                    >
                      Choose {plan.tier} Plan <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MEMBERSHIP PURCHASE MODAL (Requirement 6: Choose -> Review -> Payment -> Activate) */}
      {selectedPlan && (
        <Modal
          isOpen={Boolean(selectedPlan)}
          onClose={() => setSelectedPlan(null)}
          title={
            purchaseStep === 'success'
              ? 'Membership Activated!'
              : `Join ${selectedPlan.name}`
          }
          description={
            purchaseStep === 'review'
              ? 'Review your plan details and included privileges.'
              : purchaseStep === 'payment'
              ? 'Select your preferred checkout method to finalize activation.'
              : 'Your new VIP membership tier is now active.'
          }
          size="md"
        >
          {purchaseStep === 'review' && (
            <div className="space-y-4 text-xs text-slate-200">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-white text-base">{selectedPlan.name}</span>
                  <span className="text-xl font-extrabold text-amber-400 tabular-nums">
                    {formatCurrency(selectedPlan.price)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Validity Horizon</span>
                  <span className="font-semibold text-white">{selectedPlan.durationMonths} Months</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Primary Discount</span>
                  <span className="font-semibold text-emerald-400">
                    {selectedPlan.benefits.find((b) => b.type === 'SERVICE_DISCOUNT')?.value || 15}% Off Rituals
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-300 block text-xs uppercase tracking-wider">
                  Summary of Privileges
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedPlan.benefits.map((b) => (
                    <div key={b.id} className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-xs text-slate-200">{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedPlan(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={() => setPurchaseStep('payment')}>
                  Proceed to Payment <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {purchaseStep === 'payment' && (
            <div className="space-y-4 text-xs text-slate-200">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span>Total Amount Due:</span>
                <span className="text-lg font-black text-amber-400 tabular-nums">
                  {formatCurrency(selectedPlan.price)}
                </span>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-300 block">Select Payment Gateway / Method</span>
                <div className="space-y-2">
                  {[
                    { id: 'upi', title: 'UPI / QR Intent', desc: 'Google Pay, PhonePe, Paytm, BHIM' },
                    { id: 'card', title: 'Credit / Debit Card', desc: 'Visa, MasterCard, RuPay' },
                    { id: 'netbanking', title: 'Net Banking', desc: 'HDFC, ICICI, SBI, Axis' },
                  ].map((m) => (
                    <label
                      key={m.id}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        paymentMethod === m.id
                          ? 'border-amber-400 bg-amber-500/10 text-white'
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div>
                        <span className="font-bold block">{m.title}</span>
                        <span className="text-[11px] text-slate-400">{m.desc}</span>
                      </div>
                      <input
                        type="radio"
                        name="payMethod"
                        value={m.id}
                        checked={paymentMethod === m.id}
                        onChange={() => setPaymentMethod(m.id as any)}
                        className="sr-only"
                      />
                      {paymentMethod === m.id && <Check className="w-4 h-4 text-amber-400" />}
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <Button variant="ghost" size="sm" onClick={() => setPurchaseStep('review')}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmPurchase}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Authorizing Payment…' : `Pay ${formatCurrency(selectedPlan.price)} & Activate`}
                </Button>
              </div>
            </div>
          )}

          {purchaseStep === 'success' && (
            <div className="text-center py-4 space-y-4 text-xs text-slate-300">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Congratulations, {customer?.firstName}!</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Your <strong className="text-amber-300">{selectedPlan.name}</strong> is now officially active.
                  All discounts and privileges will automatically apply during your bookings and salon checkout.
                </p>
              </div>

              <div className="pt-2">
                <Button variant="primary" size="md" onClick={() => setSelectedPlan(null)} className="w-full">
                  Return to Dashboard
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
