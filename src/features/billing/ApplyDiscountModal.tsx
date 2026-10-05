import React, { useState, useEffect } from 'react'
import { DiscountType, MarketingOffer } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { AVAILABLE_COUPONS, calculateBillLevelDiscount } from '@/utils/billingUtils'
import { offerService } from '@/services/offerService'
import { formatCurrency } from '@/utils/formatters'
import { Tag, Percent, IndianRupee, Ticket, Sparkles, Check, AlertCircle, Gift } from 'lucide-react'

interface ApplyDiscountModalProps {
  isOpen: boolean
  onClose: () => void
  subtotal: number
  currentType: DiscountType
  currentValue: number
  currentCoupon?: string
  onApply: (type: DiscountType, value: number, couponCode?: string) => void
}

export const ApplyDiscountModal: React.FC<ApplyDiscountModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  currentType,
  currentValue,
  currentCoupon = '',
  onApply,
}) => {
  const [tab, setTab] = useState<DiscountType>(currentType)
  const [percentage, setPercentage] = useState(
    currentType === 'percentage' && currentValue > 0 ? currentValue.toString() : ''
  )
  const [fixedAmount, setFixedAmount] = useState(
    currentType === 'fixed' && currentValue > 0 ? currentValue.toString() : ''
  )
  const [couponCode, setCouponCode] = useState(currentCoupon)
  const [error, setError] = useState<string | null>(null)
  const [marketingOffers, setMarketingOffers] = useState<MarketingOffer[]>([])

  useEffect(() => {
    offerService.getActive().then((offers) => {
      setMarketingOffers(offers)
    })
  }, [])

  // Calculate preview discount amount
  const getPreview = (): { amount: number; error?: string } => {
    if (tab === 'percentage') {
      const val = parseFloat(percentage) || 0
      if (val < 0) return { amount: 0, error: 'Discount cannot be negative.' }
      if (val > 100) return { amount: 0, error: 'Percentage cannot exceed 100%.' }
      const amt = Math.round(((subtotal * val) / 100) * 100) / 100
      return { amount: Math.min(subtotal, amt) }
    }

    if (tab === 'fixed') {
      const val = parseFloat(fixedAmount) || 0
      if (val < 0) return { amount: 0, error: 'Discount cannot be negative.' }
      if (val > subtotal) {
        return {
          amount: subtotal,
          error: `Discount (₹${val}) cannot exceed bill subtotal (${formatCurrency(subtotal)}).`,
        }
      }
      return { amount: val }
    }

    if (tab === 'coupon') {
      const res = calculateBillLevelDiscount(subtotal, 'coupon', 0, couponCode)
      return { amount: res.discountAmount, error: res.error }
    }

    return { amount: 0 }
  }

  const preview = getPreview()

  const handleApply = () => {
    setError(null)
    if (preview.error) {
      setError(preview.error)
      return
    }

    if (tab === 'percentage') {
      const val = parseFloat(percentage) || 0
      if (val < 0 || val > 100) {
        setError('Percentage must be between 0% and 100%.')
        return
      }
      onApply('percentage', val, '')
    } else if (tab === 'fixed') {
      const val = parseFloat(fixedAmount) || 0
      if (val < 0) {
        setError('Discount cannot be negative.')
        return
      }
      if (val > subtotal) {
        setError('Discount cannot exceed bill subtotal.')
        return
      }
      onApply('fixed', val, '')
    } else if (tab === 'coupon') {
      if (!couponCode.trim()) {
        setError('Please enter or select a coupon code.')
        return
      }
      onApply('coupon', 0, couponCode.trim().toUpperCase())
    }

    onClose()
  }

  const handleRemoveDiscount = () => {
    onApply('percentage', 0, '')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply Order Discount"
      description={`Subtotal: ${formatCurrency(subtotal)} • Discount cannot exceed subtotal.`}
      size="md"
    >
      <div className="space-y-4">
        {/* Discount Type Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-subtle border border-border">
          <button
            type="button"
            onClick={() => {
              setTab('percentage')
              setError(null)
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              tab === 'percentage'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Percent className="h-3.5 w-3.5" />
            <span>Percentage</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('fixed')
              setError(null)
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              tab === 'fixed'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <IndianRupee className="h-3.5 w-3.5" />
            <span>Fixed ₹</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('coupon')
              setError(null)
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              tab === 'coupon'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Ticket className="h-3.5 w-3.5" />
            <span>Coupon Code</span>
          </button>
        </div>

        {/* Tab 1: Percentage */}
        {tab === 'percentage' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">
                Discount Percentage (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 10"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="w-full h-10 px-3 pr-8 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold tabular-nums"
                />
                <Percent className="h-4 w-4 text-text-muted absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Quick % buttons */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-muted">Quick:</span>
              {[5, 10, 15, 20, 25].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setPercentage(pct.toString())}
                  className="px-2.5 py-1 rounded-lg bg-surface-subtle border border-border text-xs font-bold hover:border-primary/50 text-text-primary transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Fixed Amount */}
        {tab === 'fixed' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">
                Fixed Discount Amount (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  placeholder="e.g. 250"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  className="w-full h-10 px-3 pr-8 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold tabular-nums"
                />
                <IndianRupee className="h-4 w-4 text-text-muted absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Quick Fixed buttons */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-muted">Quick:</span>
              {[100, 250, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setFixedAmount(amt.toString())}
                  className="px-2.5 py-1 rounded-lg bg-surface-subtle border border-border text-xs font-bold hover:border-primary/50 text-text-primary transition-colors"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Coupon Code */}
        {tab === 'coupon' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">
                Salon Promo Coupon
              </label>
              <input
                type="text"
                placeholder="e.g. GLOW10 or VIP20"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold font-mono uppercase"
              />
            </div>

            {/* Predefined active salon coupons & Marketing Offers */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Available Salon Promotional Coupons:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                {marketingOffers.map((off) => {
                  const isSelected = couponCode === off.code
                  return (
                    <div
                      key={off.id}
                      onClick={() => setCouponCode(off.code)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border bg-surface hover:bg-surface-hover'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-primary">
                          {off.code}
                        </span>
                        <Badge variant="accent" size="sm">
                          {off.type === 'PERCENTAGE_DISCOUNT' && `${off.value}% OFF`}
                          {off.type === 'FIXED_DISCOUNT' && `₹${off.value} OFF`}
                          {off.type === 'BUY_ONE_GET_ONE' && 'BOGO'}
                          {off.type === 'FREE_SERVICE' && 'FREE'}
                          {off.type === 'BONUS_POINTS' && `+${off.value} PTS`}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5 truncate">{off.name}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Active Customer Loyalty Vouchers */}
            {(() => {
              try {
                const raw = localStorage.getItem('salora_reward_redemptions')
                const vouchers = raw ? JSON.parse(raw) : []
                const active = vouchers.filter((v: any) => v.status === 'ACTIVE' && new Date(v.expiresAt) >= new Date())
                if (active.length === 0) return null
                return (
                  <div className="space-y-1.5 pt-2 border-t border-border">
                    <span className="text-[11px] font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-wider flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" />
                      Active Loyalty Reward Vouchers:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {active.map((v: any) => (
                        <div
                          key={v.id}
                          onClick={() => setCouponCode(v.code)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            couponCode === v.code
                              ? 'border-pink-500 bg-pink-500/10 ring-1 ring-pink-500/30'
                              : 'border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-pink-600 dark:text-pink-300">
                              {v.code}
                            </span>
                            <Badge variant="accent" size="sm">
                              {v.type === 'DISCOUNT_VOUCHER' ? `₹${v.value} OFF` : 'Free Ritual'}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-text-muted mt-0.5">{v.rewardName} ({v.clientName})</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              } catch (e) {
                return null
              }
            })()}
          </div>
        )}

        {/* Live Calculation Preview Banner */}
        <div className="p-3.5 rounded-xl bg-surface-subtle border border-border text-xs flex items-center justify-between">
          <div>
            <span className="text-text-muted">Estimated Discount:</span>
            <p className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              -{formatCurrency(preview.amount)}
            </p>
          </div>

          <div className="text-right">
            <span className="text-text-muted">Payable Subtotal:</span>
            <p className="text-sm font-bold text-text-primary tabular-nums">
              {formatCurrency(Math.max(0, subtotal - preview.amount))}
            </p>
          </div>
        </div>

        {/* Error notice if discount exceeds subtotal */}
        {(error || preview.error) && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error || preview.error}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveDiscount}
            className="text-text-muted hover:text-rose-500 text-xs"
          >
            Remove Discount
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApply}
              className="shadow-glow-primary/20"
            >
              Apply Discount
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
