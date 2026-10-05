import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Tag,
  Sparkles,
  Copy,
  Check,
  Calendar,
  ArrowRight,
  Clock,
  Gift,
  Heart,
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react'
import { MarketingOffer, PersonalizedRecommendation } from '@/types'
import { offerService } from '@/services/offerService'
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

export const CustomerOffersPage: React.FC = () => {
  const navigate = useNavigate()
  const { customer } = useCustomerAuthStore()
  const { addToast } = useToastStore()

  const [activeTab, setActiveTab] = useState<'available' | 'expiring' | 'personalized'>('available')
  const [allOffers, setAllOffers] = useState<MarketingOffer[]>([])
  const [personalizedOffers, setPersonalizedOffers] = useState<PersonalizedRecommendation[]>([])
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [selectedTermsOffer, setSelectedTermsOffer] = useState<MarketingOffer | null>(null)

  useEffect(() => {
    offerService.getActive().then((offers) => {
      setAllOffers(offers)
    })
    const recs = offerService.getPersonalizedRecommendations(customer as any)
    setPersonalizedOffers(recs)
  }, [customer])

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    addToast({
      title: 'Coupon Code Copied',
      message: `Code "${code}" copied to clipboard! Paste at checkout.`,
      type: 'success',
      duration: 3000,
    })
    setTimeout(() => setCopiedCode(null), 2500)
  }

  const handleUseOffer = (code: string) => {
    handleCopy(code)
    // Direct link to appointment booking with promo code pre-applied
    navigate(`/customer/appointments?promoCode=${code}`)
  }

  // Filter expiring soon (validity within 60 days for salon prototype demonstration)
  const expiringOffers = allOffers.filter((o) => {
    if (!o.endDate) return false
    const end = new Date(o.endDate).getTime()
    const now = new Date().getTime()
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return diffDays > 0 && diffDays <= 45
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-pink-950/40 to-slate-900 border border-pink-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-semibold">
            <Tag className="w-3.5 h-3.5" />
            <span>Curated Privileges & Savings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
            Special Salon Offers & Vouchers
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Exclusive seasonal discounts, festive beauty indulgences, and personalized rewards designed exclusively for SALORA guests.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('available')}
          className={cn(
            'flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap',
            activeTab === 'available'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>Available Offers ({allOffers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('personalized')}
          className={cn(
            'flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap',
            activeTab === 'personalized'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          )}
        >
          <Heart className="w-4 h-4 text-pink-400" />
          <span>Personalized For You ({personalizedOffers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expiring')}
          className={cn(
            'flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap',
            activeTab === 'expiring'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          )}
        >
          <Clock className="w-4 h-4" />
          <span>Expiring Soon ({expiringOffers.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: AVAILABLE OFFERS ─── */}
      {activeTab === 'available' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allOffers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-pink-500/40 p-6 shadow-xl flex flex-col justify-between transition-[border-color,transform] hover:-translate-y-0.5 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
                    {offer.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-semibold text-amber-300 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Valid until {offer.endDate}</span>
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-2xl font-black text-white font-sans tabular-nums">
                    {offer.type === 'PERCENTAGE_DISCOUNT' && `${offer.value}% OFF`}
                    {offer.type === 'FIXED_DISCOUNT' && `₹${offer.value.toLocaleString('en-IN')} OFF`}
                    {offer.type === 'BUY_ONE_GET_ONE' && 'BUY 1 GET 1'}
                    {offer.type === 'FREE_SERVICE' && 'FREE SERVICE'}
                    {offer.type === 'BONUS_POINTS' && `+${offer.value} PTS`}
                  </div>
                  <h2 className="text-sm font-bold text-white mt-1 group-hover:text-pink-300 transition-colors">
                    {offer.name}
                  </h2>
                </div>

                {offer.minimumSpend && (
                  <p className="text-[11px] text-slate-400 mt-2">
                    Minimum spend: ₹{offer.minimumSpend.toLocaleString('en-IN')}
                    {offer.maximumDiscount && ` • Capped at ₹${offer.maximumDiscount.toLocaleString('en-IN')}`}
                  </p>
                )}

                {offer.terms && (
                  <button
                    type="button"
                    onClick={() => setSelectedTermsOffer(offer)}
                    className="mt-2 text-[11px] text-pink-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Info className="w-3 h-3" />
                    <span>View Terms & Conditions</span>
                  </button>
                )}
              </div>

              {/* Bottom Coupon Box & CTA */}
              <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="font-mono text-sm font-bold text-amber-300 tracking-wider">
                    {offer.code}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(offer.code)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1 transition-colors"
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

                <button
                  type="button"
                  onClick={() => handleUseOffer(offer.code)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-pink-600/30 transition-transform active:scale-98"
                >
                  <span>Use Offer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── TAB 2: PERSONALIZED OFFERS ─── */}
      {activeTab === 'personalized' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-xs text-violet-200 flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-violet-400 shrink-0" />
            <div>
              <strong className="block font-bold text-white">Dynamic AI Personalization:</strong>
              These privileges are curated automatically from your visit frequency, favorite salon rituals, and membership status.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personalizedOffers.map((rec, idx) => (
              <div
                key={idx}
                className="rounded-3xl bg-gradient-to-b from-slate-900 to-violet-950/30 border border-violet-500/30 p-6 shadow-xl flex flex-col justify-between transition-all hover:border-violet-500/60"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-300 bg-violet-500/20 px-2.5 py-0.5 rounded-full border border-violet-500/30">
                      {rec.badge}
                    </span>
                    <span className="text-xs text-slate-400">
                      Until {rec.offer.endDate}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="text-2xl font-black text-white font-sans tabular-nums">
                      {rec.offer.type === 'PERCENTAGE_DISCOUNT' && `${rec.offer.value}% OFF`}
                      {rec.offer.type === 'FIXED_DISCOUNT' && `₹${rec.offer.value.toLocaleString('en-IN')} OFF`}
                      {rec.offer.type === 'BUY_ONE_GET_ONE' && 'BUY 1 GET 1'}
                      {rec.offer.type === 'FREE_SERVICE' && 'FREE SERVICE'}
                    </div>
                    <h2 className="text-sm font-bold text-white mt-1">{rec.offer.name}</h2>
                  </div>

                  {/* Explicit customer reasoning banner */}
                  <div className="mt-3 p-3 rounded-xl bg-violet-950/60 border border-violet-500/20 text-xs text-violet-200 leading-relaxed">
                    <span className="font-semibold block text-violet-300 mb-0.5">Why you received this:</span>
                    {rec.reason}
                  </div>

                  {rec.offer.terms && (
                    <button
                      type="button"
                      onClick={() => setSelectedTermsOffer(rec.offer)}
                      className="mt-2 text-[11px] text-violet-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Info className="w-3 h-3" />
                      <span>View Terms & Conditions</span>
                    </button>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="font-mono text-sm font-bold text-amber-300 tracking-wider">
                      {rec.offer.code}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(rec.offer.code)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1"
                    >
                      {copiedCode === rec.offer.code ? (
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

                  <button
                    type="button"
                    onClick={() => handleUseOffer(rec.offer.code)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-violet-600/30"
                  >
                    <span>{rec.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: EXPIRING SOON ─── */}
      {activeTab === 'expiring' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expiringOffers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-3xl bg-slate-900/90 border border-amber-500/40 p-6 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    Expiring Soon
                  </span>
                  <span className="text-xs font-bold text-amber-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Ends {offer.endDate}</span>
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-2xl font-black text-white font-sans tabular-nums">
                    {offer.type === 'PERCENTAGE_DISCOUNT' && `${offer.value}% OFF`}
                    {offer.type === 'FIXED_DISCOUNT' && `₹${offer.value.toLocaleString('en-IN')} OFF`}
                    {offer.type === 'BUY_ONE_GET_ONE' && 'BUY 1 GET 1'}
                  </div>
                  <h2 className="text-sm font-bold text-white mt-1">{offer.name}</h2>
                </div>

                <p className="text-xs text-slate-400 mt-2">{offer.terms}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="font-mono text-sm font-bold text-amber-300 tracking-wider">
                    {offer.code}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(offer.code)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    {copiedCode === offer.code ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleUseOffer(offer.code)}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-amber-600/30"
                >
                  <span>Book Before Expiry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Terms & Conditions Modal */}
      {selectedTermsOffer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Info className="w-5 h-5 text-pink-400" />
              <span>Terms & Eligibility: {selectedTermsOffer.code}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedTermsOffer.terms || 'Standard salon promotional policy applies. Cannot be converted to cash.'}
            </p>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Stackable with Loyalty:</span>
                <span className="font-semibold text-white">
                  {selectedTermsOffer.canStackWithLoyalty ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Stackable with Membership:</span>
                <span className="font-semibold text-white">
                  {selectedTermsOffer.canStackWithMembershipDiscount ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedTermsOffer(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
