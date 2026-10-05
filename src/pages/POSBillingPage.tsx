import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  CreditCard,
  PauseCircle,
  Clock,
  History,
  ArrowLeft,
  Sparkles,
  Zap,
  ShoppingBag,
  Lock,
} from 'lucide-react'
import { Bill, BillPaymentMethod, Payment } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useBillingStore } from '@/store/useBillingStore'
import { useToastStore } from '@/store/useToastStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { appointmentService } from '@/services/appointmentService'
import { tokenService } from '@/services/tokenService'
import { clientService } from '@/services/clientService'
import { paymentService } from '@/services/paymentService'
import { businessDayService } from '@/services/businessDayService'
import { auditLogService } from '@/services/auditLogService'
import {
  POSCustomerCard,
  POSCartTable,
  POSSummaryPanel,
  AddServiceModal,
  AddProductModal,
  ApplyDiscountModal,
  HeldBillsDrawer,
  BillInvoicePreviewModal,
  PaymentSuccessModal,
  POSPaymentModal,
  SalesSubNav,
} from '@/features/billing'
import { printService } from '@/services/printService'
import { calculateBillSummary } from '@/utils/billingUtils'
import { pricingBenefitService } from '@/services/pricingBenefitService'
import { loyaltyService } from '@/services/loyaltyService'

export const POSBillingPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToast } = useToastStore()
  const { user } = useAuthStore()

  const {
    client,
    isWalkIn,
    walkInName,
    walkInPhone,
    appointmentId,
    tokenId,
    staffId,
    staffName,
    items,
    discountType,
    discountValue,
    couponCode,
    taxRate,
    roundingMode,
    paidAmount,
    paymentMethod,
    notes,
    heldBills,
    isSubmitting,

    setClient,
    setWalkIn,
    setStaff,
    loadFromAppointment,
    loadFromToken,
    addItem,
    updateItemQty,
    updateItemDiscount,
    removeItem,
    setBillDiscount,
    setTaxRate,
    setRoundingMode,
    setPaidAmount,
    setPaymentMethod,
    setNotes,
    clearCart,
    holdBill,
    resumeHeldBill,
    deleteHeldBill,
    checkoutBill,
    loadHeldBills,
  } = useBillingStore()

  // Modals state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false)
  const [isHeldDrawerOpen, setIsHeldDrawerOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [completedBill, setCompletedBill] = useState<Bill | null>(null)

  // Load held bills on mount
  useEffect(() => {
    loadHeldBills()
  }, [loadHeldBills])

  // Process query params
  useEffect(() => {
    const apptId = searchParams.get('appointmentId')
    const tokId = searchParams.get('tokenId')
    const cliId = searchParams.get('clientId')
    const resumeId = searchParams.get('resumeHeld')

    if (resumeId) {
      resumeHeldBill(resumeId)
      return
    }

    if (apptId) {
      appointmentService.getById(apptId).then((appt) => {
        if (appt) {
          loadFromAppointment(appt)
          addToast({
            title: 'Appointment Loaded',
            message: `Loaded appointment details for ${appt.clientName}.`,
            type: 'info',
          })
        }
      })
      return
    }

    if (tokId) {
      tokenService.getById(tokId).then((tok) => {
        if (tok) {
          loadFromToken(tok)
          addToast({
            title: 'Queue Token Loaded',
            message: `Loaded Token #${tok.displayNumber} for ${tok.clientName}.`,
            type: 'info',
          })
        }
      })
      return
    }

    if (cliId) {
      clientService.getById(cliId).then((c) => {
        if (c) {
          setClient(c)
          addToast({
            title: 'Client Loaded',
            message: `Selected client ${c.fullName}.`,
            type: 'info',
          })
        }
      })
    }
  }, [searchParams])

  const summary = calculateBillSummary({
    items,
    billDiscountType: discountType,
    billDiscountValue: discountValue,
    couponCode,
    taxRate,
    roundingMode,
    paidAmount,
  })

  const handleHold = async () => {
    try {
      const held = await holdBill()
      addToast({
        title: 'Bill Held',
        message: `Order for ${held.clientName} has been paused.`,
        type: 'warning',
      })
    } catch (err: any) {
      addToast({
        title: 'Hold Failed',
        message: err.message || 'Could not hold bill.',
        type: 'danger',
      })
    }
  }

  // Open checkout settlement modal
  const handleOpenPayment = () => {
    if (businessDayService.isTodayClosed()) {
      addToast({
        title: 'Business Day Session Locked',
        message: 'Daily financial session is closed. Reopen session from Daily Closing to process new checkouts.',
        type: 'danger',
      })
      return
    }

    if (items.length === 0) {
      addToast({
        title: 'Cart is Empty',
        message: 'Add at least one service or retail product before settling checkout.',
        type: 'warning',
      })
      return
    }
    setIsPaymentModalOpen(true)
  }

  // Complete checkout settlement with payment records
  const handleConfirmPayment = async (result: {
    method: BillPaymentMethod
    paidAmount: number
    dueAmount: number
    payments: Omit<Payment, 'id' | 'paidAt'>[]
    notes?: string
  }) => {
    if (businessDayService.isTodayClosed()) {
      addToast({
        title: 'Session Locked',
        message: 'Business day is closed. Financial transactions are locked for this session.',
        type: 'danger',
      })
      return
    }

    setIsProcessingPayment(true)
    try {
      // 1. Sync store values
      setPaidAmount(result.paidAmount)
      setPaymentMethod(result.method)
      if (result.notes) {
        setNotes(notes ? `${notes} | ${result.notes}` : result.notes)
      }

      // 2. Checkout bill record
      const bill = await checkoutBill()

      // 3. Record each payment into paymentService ledger & cash drawer
      if (result.payments && result.payments.length > 0) {
        for (const p of result.payments) {
          paymentService.recordPayment({
            ...p,
            billId: bill.id,
            invoiceNumber: bill.invoiceNumber,
            clientId: bill.clientId,
            clientName: bill.clientName,
          })
        }
      } else {
        paymentService.recordPayment({
          billId: bill.id,
          invoiceNumber: bill.invoiceNumber,
          clientId: bill.clientId,
          clientName: bill.clientName,
          method: result.method,
          amount: result.paidAmount,
          status: 'COMPLETED',
          notes: result.notes,
        })
      }

      // 3b. Automatically decrement package wallet sessions or record membership benefit usages
      for (const item of items) {
        if (item.appliedBenefit) {
          if (item.appliedBenefit.type === 'PACKAGE' && item.appliedBenefit.walletId) {
            await pricingBenefitService.consumePackageSession(
              item.appliedBenefit.walletId,
              item.serviceId || item.name
            )
          } else if (
            item.appliedBenefit.type === 'MEMBERSHIP' &&
            item.appliedBenefit.membershipId &&
            item.appliedBenefit.benefitId &&
            item.appliedBenefit.isFreeService
          ) {
            await pricingBenefitService.recordMembershipBenefitUsage(
              item.appliedBenefit.membershipId,
              item.appliedBenefit.benefitId
            )
          }
        }
      }

      // 3.5. Mark loyalty voucher as USED if applied
      if (couponCode && couponCode.toUpperCase().startsWith('RWD-')) {
        try {
          await loyaltyService.applyVoucherAtCheckout(couponCode, bill.invoiceNumber)
        } catch (voucherErr) {
          console.warn('Could not mark voucher used:', voucherErr)
        }
      }

      // 3.6. Loyalty Points Spend Earning & Referral Completion
      if (client?.id) {
        try {
          const earned = await loyaltyService.awardSpendPoints({
            clientId: client.id,
            clientName: client.fullName,
            billId: bill.invoiceNumber,
            grandTotal: bill.grandTotal,
            membershipTier: (client as any).membershipTier || 'Standard',
          })

          await loyaltyService.completeReferralOnFirstAppointment(client.id, bill.invoiceNumber)

          if (earned > 0) {
            addToast({
              title: `+${earned} Loyalty Points Earned!`,
              message: `${client.fullName} received loyalty points on this invoice.`,
              type: 'info',
            })
          }
        } catch (loyaltyErr) {
          console.warn('Error awarding loyalty points on checkout:', loyaltyErr)
        }
      }

      // 4. Operational Audit Logging (Requirement 15)
      auditLogService.log({
        action: 'BILL_CREATED',
        entityType: 'invoice',
        entityId: bill.invoiceNumber,
        performedBy: user?.name ? `${user.name} (${user.role})` : 'Ayaan (Owner)',
        userRole: user?.role || 'owner',
        details: `Created invoice ${bill.invoiceNumber} for ${bill.clientName} (Total: ₹${bill.grandTotal}).`,
        amount: bill.grandTotal,
        metadata: { invoiceNumber: bill.invoiceNumber, itemsCount: bill.items.length },
      })

      auditLogService.log({
        action: 'PAYMENT_CREATED',
        entityType: 'payment',
        entityId: bill.id,
        performedBy: user?.name ? `${user.name} (${user.role})` : 'Ayaan (Owner)',
        userRole: user?.role || 'owner',
        details: `Captured ${bill.paymentMethod.toUpperCase()} payment of ₹${bill.paidAmount} for ${bill.invoiceNumber}.`,
        amount: bill.paidAmount,
        metadata: { invoiceNumber: bill.invoiceNumber, method: bill.paymentMethod },
      })

      setIsPaymentModalOpen(false)
      setCompletedBill(bill)

      // 5. Immediate Action Toasts (Requirement 4)
      addToast({
        title: `Invoice ${bill.invoiceNumber} created.`,
        message: `Payment received: ₹${bill.paidAmount.toLocaleString('en-IN')}.`,
        type: 'success',
      })

      // 6. Persistent Notification (Requirement 1 & 2)
      useNotificationStore.getState().addNotification({
        type: 'PAYMENT',
        title: `Payment Received: ₹${bill.paidAmount.toLocaleString('en-IN')}`,
        message: `Captured ${bill.paymentMethod.toUpperCase()} payment from ${bill.clientName} for invoice ${bill.invoiceNumber}.`,
        priority: 'medium',
        relatedId: bill.invoiceNumber,
        targetRole: 'owner',
        actionUrl: '/sales/history',
      })

      const settings = printService.getSettings()
      if (settings.autoPrintInvoice) {
        printService.printInvoice(bill)
      }
    } catch (err: any) {
      addToast({
        title: 'Checkout Failed',
        message: err.message || 'Could not complete checkout.',
        type: 'danger',
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleQuickBill = () => {
    clearCart()
    setWalkIn('Walk-In Guest')
    addToast({
      title: 'Quick Bill Started',
      message: 'Fresh walk-in customer checkout ready.',
      type: 'info',
    })
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Unified Sales Sub-Navigation Bar */}
      <SalesSubNav />

      {/* Business Day Session Locked Warning Banner (Requirement 10) */}
      {businessDayService.isTodayClosed() && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-3 text-rose-800 dark:text-rose-200 text-xs">
          <div className="flex items-center gap-2.5">
            <Lock className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
            <span>
              <strong>Business Day Locked:</strong> Today’s financial session has been closed. New billing checkout is disabled.
            </span>
          </div>
          <Link
            to="/reports/daily-closing"
            className="font-bold underline hover:text-rose-950 dark:hover:text-rose-100 shrink-0 inline-flex items-center gap-1"
          >
            <span>Review Closing Checklist</span>
            <ArrowLeft className="h-3 w-3 rotate-180" aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
              POS Billing & Checkout
            </h1>
            <Badge variant="primary" size="sm">
              Terminal #01
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Real-time salon register, service additions, retail product sales, and tax settlement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Held Bills button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHeldDrawerOpen(true)}
            leftIcon={<PauseCircle className="h-4 w-4 text-amber-500" />}
            className="text-xs"
          >
            Held Bills
            {heldBills.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 font-bold text-[10px]">
                {heldBills.length}
              </span>
            )}
          </Button>

          {/* Quick Bill button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickBill}
            leftIcon={<Zap className="h-4 w-4 text-primary" />}
            className="text-xs"
          >
            Quick Bill
          </Button>

          {/* Billing History Link */}
          <Link to="/sales/history">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<History className="h-4 w-4" />}
              className="text-xs"
            >
              History
            </Button>
          </Link>

          {/* Sales Overview Link */}
          <Link to="/sales">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CreditCard className="h-4 w-4" />}
              className="text-xs"
            >
              Sales Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* 3-COLUMN DESKTOP POS WORKSTATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT COLUMN: Customer & Specialist Information (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <POSCustomerCard
            client={client}
            isWalkIn={isWalkIn}
            walkInName={walkInName}
            walkInPhone={walkInPhone}
            appointmentId={appointmentId}
            tokenId={tokenId}
            staffId={staffId}
            staffName={staffName}
            onSelectClient={setClient}
            onSetWalkIn={setWalkIn}
            onSelectStaff={setStaff}
          />
        </div>

        {/* CENTER COLUMN: Bill Line Items (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 min-h-[420px]">
          <POSCartTable
            items={items}
            onUpdateQty={updateItemQty}
            onUpdateDiscount={updateItemDiscount}
            onRemoveItem={removeItem}
            onOpenAddService={() => setIsServiceModalOpen(true)}
            onOpenAddProduct={() => setIsProductModalOpen(true)}
            onClearCart={clearCart}
          />
        </div>

        {/* RIGHT COLUMN: Payment Summary, Tax, Rounding & Checkout (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <POSSummaryPanel
            items={items}
            discountType={discountType}
            discountValue={discountValue}
            couponCode={couponCode}
            taxRate={taxRate}
            roundingMode={roundingMode}
            paidAmount={paidAmount}
            paymentMethod={paymentMethod}
            notes={notes}
            isSubmitting={isSubmitting}
            onOpenDiscountModal={() => setIsDiscountModalOpen(true)}
            onChangeTaxRate={setTaxRate}
            onChangeRounding={setRoundingMode}
            onChangePaidAmount={setPaidAmount}
            onChangePaymentMethod={setPaymentMethod}
            onChangeNotes={setNotes}
            onHoldBill={handleHold}
            onCheckout={handleOpenPayment}
          />
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Add Service Modal */}
      {isServiceModalOpen && (
        <AddServiceModal
          isOpen={isServiceModalOpen}
          onClose={() => setIsServiceModalOpen(false)}
          defaultStaffId={staffId}
          onAddService={async (service, qty, sId, sName) => {
            const benefitResult = await pricingBenefitService.calculatePriceWithBenefits({
              clientId: client?.id,
              clientName: client?.fullName || walkInName,
              serviceId: service.id,
              serviceName: service.name,
              regularPrice: service.price,
              categoryId: service.categoryId,
            })

            const appliedDiscount = benefitResult.discountAmount * qty
            const lineTotal = Math.max(0, service.price * qty - appliedDiscount)

            addItem({
              type: 'service',
              serviceId: service.id,
              name: service.name,
              quantity: qty,
              unitPrice: service.price,
              duration: service.duration,
              discount: appliedDiscount,
              discountType: 'fixed',
              discountValue: appliedDiscount,
              taxRate: taxRate,
              tax: Math.round(((lineTotal * taxRate) / 100) * 100) / 100,
              staffId: sId || staffId,
              staffName: sName || staffName,
              appliedBenefit: benefitResult.appliedBenefit,
            })

            if (benefitResult.appliedBenefit) {
              addToast({
                title:
                  benefitResult.appliedBenefit.type === 'PACKAGE'
                    ? 'Package Pass Applied'
                    : 'Member Benefit Applied',
                message: `${benefitResult.appliedBenefit.description}`,
                type: 'success',
              })
            } else {
              addToast({
                title: 'Service Added',
                message: `${service.name} added to bill.`,
                type: 'success',
              })
            }
          }}
        />
      )}

      {/* 2. Add Product Modal */}
      {isProductModalOpen && (
        <AddProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onAddProduct={(product, qty) => {
            addItem({
              type: 'product',
              productId: product.id,
              name: product.name,
              quantity: qty,
              unitPrice: product.price,
              availableStock: product.stockQuantity,
              taxRate: taxRate,
              tax: Math.round(((product.price * qty * taxRate) / 100) * 100) / 100,
            })
            addToast({
              title: 'Product Added',
              message: `${product.name} (x${qty}) added to bill.`,
              type: 'success',
            })
          }}
        />
      )}

      {/* 3. Apply Discount Modal */}
      {isDiscountModalOpen && (
        <ApplyDiscountModal
          isOpen={isDiscountModalOpen}
          onClose={() => setIsDiscountModalOpen(false)}
          subtotal={summary.subtotal}
          currentType={discountType}
          currentValue={discountValue}
          currentCoupon={couponCode}
          onApply={(type, val, code) => {
            setBillDiscount(type, val, code)
            addToast({
              title: 'Discount Applied',
              message: `Order discount updated.`,
              type: 'success',
            })
          }}
        />
      )}

      {/* 4. Held Bills Drawer */}
      <HeldBillsDrawer
        isOpen={isHeldDrawerOpen}
        onClose={() => setIsHeldDrawerOpen(false)}
        heldBills={heldBills}
        onResumeBill={(id) => {
          resumeHeldBill(id)
          addToast({
            title: 'Bill Resumed',
            message: 'Paused order restored to active workstation.',
            type: 'info',
          })
        }}
        onDeleteBill={(id) => {
          deleteHeldBill(id)
          addToast({
            title: 'Held Bill Discarded',
            message: 'Paused order was deleted.',
            type: 'warning',
          })
        }}
      />

      {/* 5. POS Payment Settlement Modal */}
      {isPaymentModalOpen && (
        <POSPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          grandTotal={summary.grandTotal}
          clientName={client?.fullName || walkInName || 'Walk-In Customer'}
          clientPhone={client?.phone || walkInPhone}
          initialPaidAmount={summary.grandTotal}
          initialMethod={paymentMethod}
          isProcessing={isProcessingPayment}
          onConfirmPayment={handleConfirmPayment}
        />
      )}

      {/* 6. Payment Success & Invoice Dispatch Modal */}
      {completedBill && (
        <PaymentSuccessModal
          isOpen={Boolean(completedBill)}
          onClose={() => setCompletedBill(null)}
          bill={completedBill}
        />
      )}
    </div>
  )
}
