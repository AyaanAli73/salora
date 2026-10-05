import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Check,
  Layers,
  Scissors,
} from 'lucide-react'
import { packageService } from '@/services/packageService'
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore'
import { ServicePackage, ClientPackageWallet } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/formatters'
import { useToastStore } from '@/store/useToastStore'

export const CustomerPackagesPage: React.FC = () => {
  const { customer } = useCustomerAuthStore()
  const { addToast } = useToastStore()

  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [wallets, setWallets] = useState<ClientPackageWallet[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Purchase Modal
  const [selectedPkg, setSelectedPkg] = useState<ServicePackage | null>(null)
  const [purchaseStep, setPurchaseStep] = useState<'review' | 'payment' | 'success'>('review')
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi')
  const [isProcessing, setIsProcessing] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [allPkgs, userWallets] = await Promise.all([
        packageService.getAllPackages(),
        customer ? packageService.getClientWallets(customer.id) : [],
      ])
      setPackages(allPkgs)
      setWallets(userWallets)
    } catch (err) {
      console.error('Failed to load packages:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [customer?.id])

  const handleOpenPurchase = (pkg: ServicePackage) => {
    setSelectedPkg(pkg)
    setPurchaseStep('review')
  }

  const handleConfirmPurchase = async () => {
    if (!selectedPkg || !customer) return
    setIsProcessing(true)

    try {
      await new Promise((r) => setTimeout(r, 700))

      const paymentLabel =
        paymentMethod === 'upi' ? 'UPI Instant / PhonePe' : paymentMethod === 'card' ? 'Credit Card' : 'Net Banking'

      const newWallet = await packageService.purchasePackage({
        clientId: customer.id,
        clientName: customer.fullName,
        packageId: selectedPkg.id,
        paymentMethod: paymentLabel,
      })

      setWallets([newWallet, ...wallets])
      setPurchaseStep('success')

      addToast({
        title: 'Package Credited to Wallet',
        message: `${selectedPkg.name} is now available in your digital wallet.`,
        type: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed'
      addToast({ title: 'Error', message: msg, type: 'danger' })
    } finally {
      setIsProcessing(false)
    }
  }

  const activeWallets = wallets.filter((w) => w.status === 'active')

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-pink-950/40 to-slate-900 border border-pink-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-semibold">
            <Package className="w-3.5 h-3.5" />
            <span>Bundled Treatment Passes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
            Service Packages & Digital Wallet
          </h1>
          <p className="text-slate-300 text-sm">
            Save up to 35% with prepaid treatment bundles, multi-session hair therapies, and wedding glow regimens. Sessions are stored in your wallet and auto-redeemed upon visit completion.
          </p>
        </div>

        {/* CUSTOMER PACKAGE WALLET (Requirement 10: Package, Remaining per service) */}
        {activeWallets.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold text-pink-300 tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Your Active Digital Wallet Passes ({activeWallets.length})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeWallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="p-5 rounded-2xl bg-slate-950/90 border border-pink-500/40 shadow-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Active Pass
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          #{wallet.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-white mt-1">{wallet.packageName}</h2>
                      <span className="text-[11px] text-slate-400">
                        Valid until {wallet.expiryDate}
                      </span>
                    </div>

                    <Link
                      to="/customer/book"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-md shadow-pink-600/30 transition-colors shrink-0"
                    >
                      <span>Book Session</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Remaining session breakdown (Requirement 10: Hair Spa 2/3, Hair Cut 1/2) */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Remaining Sessions in Wallet
                    </span>
                    <div className="space-y-2">
                      {wallet.items.map((item, idx) => {
                        const percent = Math.round((item.remainingQuantity / item.totalQuantity) * 100)
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-200 font-semibold">{item.serviceName}</span>
                              <span className="text-pink-300 font-bold tabular-nums">
                                {item.remainingQuantity} / {item.totalQuantity} Remaining
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-pink-500 to-amber-400 h-full rounded-full transition-all duration-300"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Available Packages Catalog (Requirement 8) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white">Curated Multi-Session Passes</h2>
          <p className="text-xs text-slate-400">
            Purchase multi-treatment passes for yourself or family. Sessions never expire prematurely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-pink-500/40 p-6 sm:p-7 shadow-xl flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-pink-300 transition-colors">
                      {pkg.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{pkg.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-white tabular-nums">
                      {formatCurrency(pkg.packagePrice)}
                    </span>
                    <span className="block text-[11px] text-emerald-400 font-semibold">
                      Save {formatCurrency(pkg.savingsAmount)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-violet-400" />
                    <span>{pkg.items.reduce((s, i) => s + i.quantity, 0)} Total Sessions</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Valid {pkg.validityDays} Days</span>
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Included Treatments
                  </span>
                  <div className="space-y-1.5">
                    {pkg.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-200">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                          <span>{it.serviceName}</span>
                        </div>
                        <span className="text-pink-300 font-bold tabular-nums">
                          {it.quantity} {it.quantity === 1 ? 'Session' : 'Sessions'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Auto-credited to digital wallet</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenPurchase(pkg)}
                  className="text-xs font-bold"
                >
                  Buy Pass ({formatCurrency(pkg.packagePrice)})
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PACKAGE PURCHASE MODAL */}
      {selectedPkg && (
        <Modal
          isOpen={Boolean(selectedPkg)}
          onClose={() => setSelectedPkg(null)}
          title={purchaseStep === 'success' ? 'Pass Activated!' : `Buy ${selectedPkg.name}`}
          description={
            purchaseStep === 'review'
              ? 'Review inclusions and wallet validity.'
              : purchaseStep === 'payment'
              ? 'Complete checkout using your preferred payment method.'
              : 'Pass is ready for redemption.'
          }
          size="md"
        >
          {purchaseStep === 'review' && (
            <div className="space-y-4 text-xs text-slate-200">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-white text-base">{selectedPkg.name}</span>
                  <span className="text-xl font-extrabold text-pink-400 tabular-nums">
                    {formatCurrency(selectedPkg.packagePrice)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Regular Service Price</span>
                  <span className="line-through">{formatCurrency(selectedPkg.normalPrice)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Instant Package Savings</span>
                  <span>Save {formatCurrency(selectedPkg.savingsAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Pass Validity Horizon</span>
                  <span className="text-white font-medium">{selectedPkg.validityDays} Days</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-300 block">Sessions to be Credited</span>
                <div className="space-y-1.5">
                  {selectedPkg.items.map((it, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between">
                      <span>{it.serviceName}</span>
                      <span className="font-bold text-pink-300">× {it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedPkg(null)}>
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
                <span className="text-lg font-black text-pink-400 tabular-nums">
                  {formatCurrency(selectedPkg.packagePrice)}
                </span>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-300 block">Select Payment Method</span>
                <div className="space-y-2">
                  {[
                    { id: 'upi', title: 'UPI / QR Intent', desc: 'Google Pay, PhonePe, Paytm' },
                    { id: 'card', title: 'Credit / Debit Card', desc: 'Instant authorization' },
                    { id: 'netbanking', title: 'Net Banking', desc: 'Direct bank transfer' },
                  ].map((m) => (
                    <label
                      key={m.id}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        paymentMethod === m.id
                          ? 'border-pink-400 bg-pink-500/10 text-white'
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
                      {paymentMethod === m.id && <Check className="w-4 h-4 text-pink-400" />}
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
                  {isProcessing ? 'Processing…' : `Pay ${formatCurrency(selectedPkg.packagePrice)}`}
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
                <h3 className="text-lg font-bold text-white">Pass Added to Wallet!</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Your <strong className="text-pink-300">{selectedPkg.name}</strong> is now credited to your digital wallet.
                  When booking online or visiting the salon, your available sessions will automatically be recognized.
                </p>
              </div>

              <div className="pt-2">
                <Button variant="primary" size="md" onClick={() => setSelectedPkg(null)} className="w-full">
                  View Wallet
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
