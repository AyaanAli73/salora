import React, { useState } from 'react'
import {
  X,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  Banknote,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
} from 'lucide-react'
import { serviceService } from '@/services/serviceService'
import { inventoryService } from '@/services/inventoryService'
import { useToastStore } from '@/store/useToastStore'
import { billingService } from '@/services/billingService'
import { printService } from '@/services/printService'
import { syncQueueService } from '@/services/syncQueueService'
import { BillItem, Service, Product } from '@/types'
import { cn } from '@/utils/cn'

interface MobilePOSModalProps {
  isOpen: boolean
  onClose: () => void
  onBillCreated?: () => void
}

interface CartItem extends BillItem {
  category?: string
}

export const MobilePOSModal: React.FC<MobilePOSModalProps> = ({
  isOpen,
  onClose,
  onBillCreated,
}) => {
  const services: Service[] = serviceService.getAllSync()
  const products: Product[] = inventoryService.getAllProducts()
  const { addToast } = useToastStore()

  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'upi' | 'card'>('upi')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const isOffline = syncQueueService.getNetworkStatus() === 'offline'

  // Filter services & products
  const filteredServices = services.filter((s: Service) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredProducts = products.filter((p: Product) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addToCart = (item: { id: string; name: string; price: number; type: 'service' | 'product' }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
            : i
        )
      }
      return [
        ...prev,
        {
          id: item.id,
          type: item.type,
          serviceId: item.type === 'service' ? item.id : undefined,
          productId: item.type === 'product' ? item.id : undefined,
          name: item.name,
          quantity: 1,
          unitPrice: item.price,
          discount: 0,
          tax: 0,
          total: item.price,
        },
      ]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const nextQty = i.quantity + delta
            if (nextQty <= 0) return null
            return { ...i, quantity: nextQty, total: nextQty * i.unitPrice }
          }
          return i
        })
        .filter(Boolean) as CartItem[]
    )
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id))
  }

  const subtotal = cart.reduce((sum, i) => sum + i.total, 0)
  const tax = Math.round(subtotal * 0.18)
  const grandTotal = subtotal + tax

  const handleCheckout = async () => {
    if (cart.length === 0) return

    // CRITICAL: Prevent fake offline financial writes!
    if (isOffline) {
      addToast({
        title: 'Offline Checkout Blocked',
        message: 'Cannot process fiscal payments while offline. Connect to internet to confirm transaction.',
        type: 'danger',
      })
      return
    }

    setIsProcessing(true)
    try {
      const newBill = await billingService.createBill({
        appointmentId: `pos-mob-${Date.now()}`,
        clientId: 'walk-in-customer',
        clientName: 'Walk-in Guest',
        clientPhone: '+91 98290 11223',
        staffId: 'staff-1',
        staffName: 'Reception Cashier',
        items: cart,
        subtotal,
        taxableAmount: subtotal,
        tax,
        taxRate: 18,
        discount: 0,
        rounding: 0,
        roundingMode: 'none',
        grandTotal,
        paidAmount: grandTotal,
        dueAmount: 0,
        paymentMethod: selectedPaymentMethod,
        paymentStatus: 'PAID',
        status: 'completed',
        notes: 'Mobile POS Quick Checkout',
      })

      // Dispatch receipt print
      try {
        printService.printInvoice(newBill as any, '80mm')
      } catch {
        // Ignored
      }

      addToast({
        title: `Bill #${newBill.invoiceNumber} Settled!`,
        message: `₹${grandTotal.toLocaleString('en-IN')} paid via ${selectedPaymentMethod.toUpperCase()}.`,
        type: 'success',
      })

      if (onBillCreated) onBillCreated()
      onClose()
    } catch (err: any) {
      addToast({
        title: 'Payment Failed',
        message: err?.message || 'Transaction could not be recorded.',
        type: 'danger',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-pos-title"
      className="fixed inset-0 z-50 flex flex-col justify-end md:hidden bg-background text-text-primary"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Receipt className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="mobile-pos-title" className="text-sm font-bold text-text-primary">
              Mobile Touch POS
            </h2>
            <p className="text-[11px] text-text-muted">Fast workstation &amp; quick checkout</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Mobile POS"
          className="rounded-xl p-2 text-text-muted hover:bg-surface-subtle hover:text-text-primary cursor-pointer"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Offline Alert Strip */}
      {isOffline && (
        <div className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 text-xs font-semibold shrink-0">
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Offline: Payment completion is disabled until internet is restored.</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search & Tabs */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services or retail products…"
              className="block w-full rounded-2xl border border-border bg-surface pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-muted"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer',
                activeTab === 'services'
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-surface text-text-muted'
              )}
            >
              Services ({filteredServices.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer',
                activeTab === 'products'
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-surface text-text-muted'
              )}
            >
              Products ({filteredProducts.length})
            </button>
          </div>
        </div>

        {/* Catalog Items Grid (Large Touch Targets >= 48px) */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {activeTab === 'services'
            ? filteredServices.map((srv: Service) => (
                <div
                  key={srv.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface shadow-xs min-h-[52px]"
                >
                  <div className="min-w-0 pr-2">
                    <h3 className="text-xs font-bold text-text-primary truncate">{srv.name}</h3>
                    <p className="text-[11px] text-primary font-bold">₹{srv.price}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart({ id: srv.id, name: srv.name, price: srv.price, type: 'service' })}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white active:scale-95 transition-transform cursor-pointer"
                  >
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              ))
            : filteredProducts.map((prod: Product) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface shadow-xs min-h-[52px]"
                >
                  <div className="min-w-0 pr-2">
                    <h3 className="text-xs font-bold text-text-primary truncate">{prod.name}</h3>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      ₹{prod.sellingPrice} ({prod.stockQuantity} in stock)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart({ id: prod.id, name: prod.name, price: prod.sellingPrice, type: 'product' })}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white active:scale-95 transition-transform cursor-pointer"
                  >
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              ))}
        </div>

        {/* Cart Review Section */}
        {cart.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Current Cart ({cart.length} items)
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-surface-subtle border border-border text-xs"
                >
                  <div className="min-w-0 flex-1 truncate pr-2">
                    <span className="font-semibold text-text-primary truncate block">{item.name}</span>
                    <span className="text-[10px] text-text-muted">₹{item.unitPrice} each</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 rounded-lg bg-surface border border-border text-text-primary active:scale-90"
                    >
                      <Minus className="h-3 w-3" aria-hidden="true" />
                    </button>
                    <span className="font-bold text-text-primary min-w-[16px] text-center" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 rounded-lg bg-surface border border-border text-text-primary active:scale-90"
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 ml-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Sticky Bottom Checkout Bar ─── */}
      <div className="border-t border-border bg-surface p-4 space-y-3 shrink-0 shadow-2xl">
        {/* Payment Methods */}
        <div className="grid grid-cols-3 gap-2">
          {(['upi', 'card', 'cash'] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setSelectedPaymentMethod(method)}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer',
                selectedPaymentMethod === method
                  ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                  : 'border-border bg-surface-subtle text-text-muted'
              )}
            >
              {method === 'upi' ? (
                <QrCode className="h-4 w-4" aria-hidden="true" />
              ) : method === 'card' ? (
                <CreditCard className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Banknote className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="uppercase">{method}</span>
            </button>
          ))}
        </div>

        {/* Total & Checkout CTA */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-text-muted uppercase font-semibold">Total with 18% GST</span>
            <div className="text-xl font-black text-text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
              ₹{grandTotal.toLocaleString('en-IN')}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing || isOffline}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>{isProcessing ? 'Settling…' : `Collect ₹${grandTotal.toLocaleString('en-IN')}`}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
