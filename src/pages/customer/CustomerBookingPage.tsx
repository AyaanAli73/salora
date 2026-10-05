import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Tag,
  AlertCircle,
  Scissors,
  Star,
  Search,
  Check,
  CreditCard,
  MapPin,
  Phone,
  CalendarPlus,
  Download,
  RotateCcw,
  Users,
  Eye,
  Info,
  DollarSign,
  Crown,
  Package,
} from 'lucide-react'
import { customerPortalService } from '@/services/customerPortalService'
import { staffService } from '@/services/staffService'
import { serviceService } from '@/services/serviceService'
import { appointmentService } from '@/services/appointmentService'
import { pricingBenefitService, PricingBenefitResult } from '@/services/pricingBenefitService'
import { loyaltyService } from '@/services/loyaltyService'
import { Service, Staff, Appointment, TimeSlot, ClientMembership, ClientPackageWallet } from '@/types'
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore'
import { useSalonStore } from '@/store/useSalonStore'
import { useToastStore } from '@/store/useToastStore'
import { formatCurrency } from '@/utils/formatters'
import {
  getAvailableSlots,
  getAvailableSlotsForAnyStaff,
  isDateSelectable,
  formatTime12Hour,
  SALON_HOLIDAYS_2026,
} from '@/utils/availability'
import { createGoogleCalendarUrl, downloadIcsFile } from '@/utils/calendarExport'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'

type BookingStep = 'service' | 'staff' | 'date' | 'time' | 'details' | 'summary' | 'confirmed'

const STEPS: { id: BookingStep; label: string; number: number }[] = [
  { id: 'service', label: 'Service', number: 1 },
  { id: 'staff', label: 'Professional', number: 2 },
  { id: 'date', label: 'Date', number: 3 },
  { id: 'time', label: 'Time Slot', number: 4 },
  { id: 'details', label: 'Details', number: 5 },
  { id: 'summary', label: 'Confirm', number: 6 },
]

export const CustomerBookingPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedServiceId = searchParams.get('serviceId')

  const { customer, isAuthenticated } = useCustomerAuthStore()
  const { salon } = useSalonStore()
  const { addToast } = useToastStore()

  const bookingSettings = salon.bookingSettings

  // Wizard state
  const [currentStep, setCurrentStep] = useState<BookingStep>('service')
  const [services, setServices] = useState<Service[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  // Selections
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedServiceId, setSelectedServiceId] = useState<string>(preselectedServiceId || '')
  const [selectedStaffId, setSelectedStaffId] = useState<string>('any') // 'any' or specific staff ID
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)

  // Calendar View month state
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })

  // Customer Form state
  const [customerName, setCustomerName] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [customerNotes, setCustomerNotes] = useState<string>('')
  const [referralCodeInput, setReferralCodeInput] = useState<string>(() => searchParams.get('ref') || '')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Deposit selection state
  const [depositPaymentMethod, setDepositPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi')

  // Booking result
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 1. Initial Load of dependencies
  useEffect(() => {
    let isMounted = true
    const initData = async () => {
      setLoading(true)
      try {
        const [servs, staffs, appts] = await Promise.all([
          customerPortalService.getPublicServices(),
          staffService.getAll(),
          appointmentService.getAll(),
        ])
        if (!isMounted) return

        setServices(servs)
        const activeStaff = staffs.filter((s) => s.status === 'active' || s.status === undefined)
        setStaffList(activeStaff)
        setAppointments(appts)

        // Pre-fill initial date to today or tomorrow
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const dateStr = tomorrow.toISOString().split('T')[0]
        setSelectedDate(dateStr)

        // Handle URL query parameter pre-selection
        if (preselectedServiceId && servs.some((s) => s.id === preselectedServiceId)) {
          setSelectedServiceId(preselectedServiceId)
        }
      } catch (err) {
        console.error('Failed loading booking data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initData()
    return () => {
      isMounted = false
    }
  }, [preselectedServiceId])

  // 2. Pre-fill customer details if logged in
  useEffect(() => {
    if (customer) {
      setCustomerName(customer.fullName || `${customer.firstName} ${customer.lastName}`.trim())
      setCustomerPhone(customer.phone || '')
      setCustomerEmail(customer.email || '')
      if (customer.preferredStaffId && bookingSettings?.allowPreferredStaff !== false) {
        setSelectedStaffId(customer.preferredStaffId)
      }
    }
  }, [customer, bookingSettings])

  // Selected Entities
  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId),
    [services, selectedServiceId]
  )

  const selectedStaff = useMemo(
    () => (selectedStaffId === 'any' ? null : staffList.find((s) => s.id === selectedStaffId)),
    [staffList, selectedStaffId]
  )

  // Categories list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(services.map((s) => s.categoryName || 'General')))
    return ['all', ...cats]
  }, [services])

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchCat = selectedCategory === 'all' || s.categoryName === selectedCategory
      const matchSearch =
        searchQuery === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCat && matchSearch
    })
  }, [services, selectedCategory, searchQuery])

  // Customer Membership & Package Wallets
  const [customerMembership, setCustomerMembership] = useState<ClientMembership | null>(null)
  const [customerWallets, setCustomerWallets] = useState<ClientPackageWallet[]>([])
  const [pricingResult, setPricingResult] = useState<PricingBenefitResult | null>(null)

  useEffect(() => {
    let isMounted = true
    if (!customer?.id) {
      setCustomerMembership(null)
      setCustomerWallets([])
      return
    }

    Promise.all([
      pricingBenefitService.getClientActiveMembership(customer.id),
      pricingBenefitService.getClientPackageWallets(customer.id),
    ]).then(([mem, wallets]) => {
      if (isMounted) {
        setCustomerMembership(mem)
        setCustomerWallets(wallets)
      }
    })

    return () => {
      isMounted = false
    }
  }, [customer?.id])

  useEffect(() => {
    let isMounted = true
    if (!selectedService) {
      setPricingResult(null)
      return
    }

    pricingBenefitService
      .calculatePriceWithBenefits({
        clientId: customer?.id,
        clientName: customer?.fullName,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        regularPrice: selectedService.price,
        categoryId: selectedService.categoryId,
      })
      .then((res) => {
        if (isMounted) setPricingResult(res)
      })

    return () => {
      isMounted = false
    }
  }, [selectedService, customer?.id])

  // Pricing & Membership / Package Benefits
  const basePrice = selectedService?.price || 0
  const discountAmount = pricingResult ? pricingResult.discountAmount : 0
  const discountPercent = pricingResult ? pricingResult.discountPercent : 0
  const finalPrice = pricingResult ? pricingResult.finalPrice : basePrice
  const appliedBenefit = pricingResult?.appliedBenefit
  const isVip = !!customerMembership || customer?.membershipTier === 'Gold' || customer?.membershipTier === 'Platinum'

  // Deposit calculation
  const depositRequired = useMemo(() => {
    if (!bookingSettings || bookingSettings.depositType === 'none') return 0
    if (bookingSettings.depositType === 'fixed') {
      return Math.min(finalPrice, bookingSettings.depositAmount || 0)
    }
    if (bookingSettings.depositType === 'percentage') {
      return Math.round((finalPrice * (bookingSettings.depositAmount || 0)) / 100)
    }
    return 0
  }, [bookingSettings, finalPrice])

  // Live Slot Generation (Double Booking Prevention & Buffer Time)
  const availableSlots = useMemo(() => {
    if (!selectedService || !selectedDate) return []
    const duration = selectedService.duration || 45
    const buffer = bookingSettings?.bufferTimeMinutes ?? 10
    const minNotice = bookingSettings?.minimumNoticeHours ?? 2

    if (selectedStaffId === 'any') {
      return getAvailableSlotsForAnyStaff(
        staffList,
        selectedDate,
        duration,
        appointments,
        salon,
        buffer,
        30,
        minNotice
      )
    } else if (selectedStaff) {
      return getAvailableSlots(
        selectedStaff,
        selectedDate,
        duration,
        appointments,
        salon,
        buffer,
        30,
        minNotice
      )
    }
    return []
  }, [selectedService, selectedDate, selectedStaffId, selectedStaff, staffList, appointments, salon, bookingSettings])

  // Group slots into Morning, Afternoon, Evening
  const groupedSlots = useMemo(() => {
    const morning: TimeSlot[] = []
    const afternoon: TimeSlot[] = []
    const evening: TimeSlot[] = []

    availableSlots.forEach((slot) => {
      const [h] = slot.time.split(':').map(Number)
      if (h < 12) morning.push(slot)
      else if (h < 17) afternoon.push(slot)
      else evening.push(slot)
    })

    return { morning, afternoon, evening }
  }, [availableSlots])

  // Calendar Day Generation
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Monday as start of week (0=Mon, 6=Sun)
    let startDayOfWeek = firstDay.getDay() - 1
    if (startDayOfWeek === -1) startDayOfWeek = 6

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; selectable: boolean; reason?: string }[] = []

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i
      const prevDate = new Date(year, month - 1, dayNum)
      const dateStr = prevDate.toISOString().split('T')[0]
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        selectable: false,
        reason: 'Previous month',
      })
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const curDate = new Date(year, month, d)
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const check = isDateSelectable(dateStr, salon, selectedStaff, bookingSettings)
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        selectable: check.selectable,
        reason: check.reason,
      })
    }

    return days
  }, [calendarMonth, salon, selectedStaff, bookingSettings])

  // Navigation between months
  const handlePrevMonth = () => {
    const prev = new Date(calendarMonth)
    prev.setMonth(prev.getMonth() - 1)
    const today = new Date()
    today.setDate(1)
    if (prev >= today) setCalendarMonth(prev)
  }

  const handleNextMonth = () => {
    const next = new Date(calendarMonth)
    next.setMonth(next.getMonth() + 1)
    setCalendarMonth(next)
  }

  // Form Validation
  const validateDetailsStep = () => {
    const errors: Record<string, string> = {}
    if (!customerName.trim()) errors.name = 'Please provide your full name'
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number'
    }
    if (customerEmail && !customerEmail.includes('@')) {
      errors.email = 'Please provide a valid email address'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle final confirmation
  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTimeSlot) return

    setSubmitting(true)
    try {
      // Determine assigned staff ID
      const assignedStaffId =
        selectedStaffId === 'any' ? selectedTimeSlot.staffId || staffList[0]?.id || 'staff-1' : selectedStaffId

      const newAppt = await customerPortalService.bookAppointment({
        customerId: customer?.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        serviceId: selectedService.id,
        staffId: assignedStaffId,
        date: selectedDate,
        startTime: selectedTimeSlot.time,
        notes: customerNotes.trim() || undefined,
        price: basePrice,
        discount: discountAmount,
        totalAmount: finalPrice,
        depositPaid: depositRequired,
        depositRequired: depositRequired,
        depositStatus: depositRequired > 0 ? 'paid' : 'none',
      })

      // Automatically decrease package wallet sessions or record membership benefits
      if (appliedBenefit?.type === 'PACKAGE' && appliedBenefit.walletId) {
        await pricingBenefitService.consumePackageSession(
          appliedBenefit.walletId,
          selectedService.id
        )
      } else if (
        appliedBenefit?.type === 'MEMBERSHIP' &&
        appliedBenefit.membershipId &&
        appliedBenefit.benefitId &&
        appliedBenefit.isFreeService
      ) {
        await pricingBenefitService.recordMembershipBenefitUsage(
          appliedBenefit.membershipId,
          appliedBenefit.benefitId
        )
      }

      // Loyalty & Referral System (Phase 3 Part 4)
      const currentClientId = customer?.id || `cli-${customerPhone.replace(/\D/g, '') || 'guest'}`

      // 1. Process Referral Code if entered
      if (referralCodeInput.trim()) {
        try {
          await loyaltyService.applyReferralCode({
            referrerCode: referralCodeInput.trim(),
            referredClientId: currentClientId,
            referredClientName: customerName.trim(),
            referredClientPhone: customerPhone.trim(),
          })
          addToast({
            title: 'Welcome Bonus Claimed!',
            message: '+200 Referral Points added to your account.',
            type: 'success',
          })
        } catch (refErr) {
          console.warn('Referral code process error:', refErr)
        }
      }

      // 2. Award 50 points Booking Reward
      try {
        await loyaltyService.addTransaction({
          clientId: currentClientId,
          clientName: customerName.trim(),
          type: 'BONUS',
          points: 50,
          reason: `Online Booking Reward for ${selectedService.name}`,
          referenceId: newAppt.id,
        })
      } catch (lytErr) {
        console.warn('Booking points award error:', lytErr)
      }

      setConfirmedAppointment(newAppt)
      setCurrentStep('confirmed')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to finalize booking.'
      addToast({
        title: 'Booking Error',
        message: msg,
        type: 'danger',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium">Preparing Salon Booking Concierge…</p>
      </div>
    )
  }

  // If Online Booking is disabled in settings
  if (bookingSettings && bookingSettings.onlineBookingEnabled === false) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-white">Online Booking Temporarily Paused</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Our online appointment reservation is currently undergoing routine maintenance. Please contact our concierge desk directly to book your appointment.
        </p>
        <div className="pt-2">
          <a
            href="tel:+919876543210"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>Call Concierge (+91 98765 43210)</span>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* ─── Top Header & Progress Stepper ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
              <Sparkles className="w-4 h-4" />
              <span>SALORA Online Reservation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Book Your Salon Treatment
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Select your personalized ritual, preferred aesthetician, and convenient time slot
            </p>
          </div>

          {/* Logged in pill */}
          {isAuthenticated && customer && (
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Avatar name={customer.fullName} src={customer.avatarUrl} size="xs" />
              <span>
                Booking as <strong className="text-white">{customer.firstName}</strong> ({customer.membershipTier})
              </span>
            </div>
          )}
        </div>

        {/* Stepper Bar */}
        {currentStep !== 'confirmed' && (
          <nav aria-label="Booking steps" className="border-y border-slate-800 py-3 overflow-x-auto">
            <ol className="flex items-center justify-between min-w-[560px] gap-2">
              {STEPS.map((s, idx) => {
                const currentIdx = STEPS.findIndex((st) => st.id === currentStep)
                const isPassed = idx < currentIdx
                const isCurrent = s.id === currentStep

                return (
                  <li key={s.id} className="flex items-center gap-2 flex-1">
                    <button
                      type="button"
                      disabled={idx > currentIdx}
                      onClick={() => setCurrentStep(s.id)}
                      className={cn(
                        'flex items-center gap-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg py-1 px-1.5',
                        isCurrent
                          ? 'text-primary font-bold'
                          : isPassed
                          ? 'text-slate-300 hover:text-white cursor-pointer'
                          : 'text-slate-600 cursor-not-allowed'
                      )}
                    >
                      <span
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors',
                          isCurrent
                            ? 'bg-primary text-white shadow-xs'
                            : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-500'
                        )}
                      >
                        {isPassed ? <Check className="w-3.5 h-3.5" /> : s.number}
                      </span>
                      <span className="truncate">{s.label}</span>
                    </button>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={cn(
                          'h-[2px] flex-1 min-w-4 transition-colors',
                          idx < currentIdx ? 'bg-emerald-500/60' : 'bg-slate-800'
                        )}
                      />
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}
      </div>

      {/* ─── STEP 1: SERVICE SELECTION ─── */}
      {currentStep === 'service' && (
        <section aria-labelledby="step-service-heading" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 id="step-service-heading" className="text-lg font-bold text-white">
                Step 1: Choose Your Treatment
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Browse our curated menu of hair, skin, nail, and restorative spa experiences
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search treatments…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="tablist">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-medium capitalize transition-colors whitespace-nowrap',
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-xs font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Member / Package Privilege Banner */}
          {(customerMembership || customerWallets.length > 0) && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-transparent border border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-200">
                  {customerMembership ? (
                    <>
                      <strong>{customerMembership.tier} Member Privileges Active:</strong>{' '}
                      {customerMembership.benefits.find((b) => b.type === 'SERVICE_DISCOUNT')?.value || 15}% discount will be automatically applied to your booking.
                    </>
                  ) : (
                    <>
                      <strong>Prepaid Package Wallet Active:</strong> You have {customerWallets.length} active service pass{customerWallets.length > 1 ? 'es' : ''} available to redeem.
                    </>
                  )}
                </span>
              </div>
              {customerWallets.length > 0 && customerMembership && (
                <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-bold text-[11px] flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {customerWallets.length} Package Pass{customerWallets.length > 1 ? 'es' : ''}
                </span>
              )}
            </div>
          )}

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((serv) => {
              const isSelected = selectedServiceId === serv.id

              // Check if matching package wallet session exists
              const matchingWallet = customerWallets.find((w) =>
                w.items.some(
                  (item) =>
                    item.remainingQuantity > 0 &&
                    (item.serviceId === serv.id ||
                      item.serviceName.toLowerCase().trim() === serv.name.toLowerCase().trim() ||
                      serv.name.toLowerCase().includes(item.serviceName.toLowerCase()))
                )
              )
              const matchingItem = matchingWallet?.items.find(
                (item) =>
                  item.remainingQuantity > 0 &&
                  (item.serviceId === serv.id ||
                    item.serviceName.toLowerCase().trim() === serv.name.toLowerCase().trim() ||
                    serv.name.toLowerCase().includes(item.serviceName.toLowerCase()))
              )

              const memberDiscount =
                customerMembership?.benefits.find((b) => b.type === 'SERVICE_DISCOUNT')?.value ||
                (customer?.membershipTier === 'Platinum' ? 20 : customer?.membershipTier === 'Gold' ? 15 : 0)

              return (
                <div
                  key={serv.id}
                  className={cn(
                    'group relative flex flex-col justify-between rounded-2xl border p-5 transition-all text-left bg-slate-900/90 hover:shadow-lg',
                    isSelected
                      ? 'border-primary ring-1 ring-primary bg-primary/5'
                      : 'border-slate-800 hover:border-slate-700'
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          {serv.categoryName || 'Treatment'}
                        </span>
                        <h3 className="text-base font-bold text-white mt-0.5 group-hover:text-primary transition-colors">
                          {serv.name}
                        </h3>
                      </div>

                      {/* Price Badge with Membership & Package Recognition */}
                      {bookingSettings?.showPricing !== false && (
                        <div className="text-right shrink-0">
                          {matchingItem ? (
                            <div>
                              <span className="text-[10px] font-bold text-teal-300 bg-teal-500/20 px-1.5 py-0.5 rounded uppercase block mb-0.5">
                                Pass: {matchingItem.remainingQuantity} left
                              </span>
                              <span className="text-base font-extrabold text-teal-300 tabular-nums block">
                                ₹0
                              </span>
                              <span className="text-[10px] text-slate-400 line-through">
                                ₹{serv.price.toLocaleString('en-IN')}
                              </span>
                            </div>
                          ) : memberDiscount > 0 ? (
                            <div>
                              <span className="text-base font-extrabold text-white tabular-nums block">
                                ₹{Math.round(serv.price * (1 - memberDiscount / 100)).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-slate-400 line-through block">
                                ₹{serv.price.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-400 block">
                                {customerMembership?.tier || customer?.membershipTier || 'Gold'} — {memberDiscount}% applied
                              </span>
                            </div>
                          ) : (
                            <span className="text-base font-extrabold text-white tabular-nums block">
                              ₹{serv.price.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {serv.description}
                    </p>

                    {/* Metadata: Duration & Rating */}
                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      {bookingSettings?.showServiceDuration !== false && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                          <span className="tabular-nums font-medium">{serv.duration} mins</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                        <span className="font-bold text-slate-200">
                          {serv.averageRating ? serv.averageRating.toFixed(1) : '4.9'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({serv.reviewCount || 28})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Select CTA Button */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {isSelected ? 'Ready for stylist selection' : 'Instant booking available'}
                    </span>

                    <Button
                      variant={isSelected ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedServiceId(serv.id)
                        setCurrentStep('staff')
                      }}
                      className={cn(
                        'text-xs font-semibold',
                        isSelected ? 'shadow-xs' : 'border-slate-700 text-slate-200 hover:text-white'
                      )}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <span>Select Treatment</span>
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredServices.length === 0 && (
            <div className="py-12 text-center rounded-2xl bg-slate-900 border border-slate-800 p-6">
              <Scissors className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No treatments found</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing your search query or choosing another category.</p>
            </div>
          )}
        </section>
      )}

      {/* ─── STEP 2: STAFF SELECTION ─── */}
      {currentStep === 'staff' && (
        <section aria-labelledby="step-staff-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="step-staff-heading" className="text-lg font-bold text-white">
                Step 2: Choose Your Professional
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Opt for any available stylist for flexible timing, or select your preferred artisan
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('service')}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              className="text-xs text-slate-400 hover:text-white"
            >
              Back to Services
            </Button>
          </div>

          {/* Staff Option Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* OPTION 1: Any Available Professional */}
            <div
              onClick={() => {
                setSelectedStaffId('any')
                setCurrentStep('date')
              }}
              className={cn(
                'group relative p-5 rounded-2xl border transition-all cursor-pointer bg-slate-900/90 text-left flex flex-col justify-between hover:shadow-lg',
                selectedStaffId === 'any'
                  ? 'border-primary ring-1 ring-primary bg-primary/5'
                  : 'border-slate-800 hover:border-slate-700'
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-teal-400 flex items-center justify-center text-white shadow-md">
                    <Sparkles className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <Badge variant="primary" size="sm" className="font-bold">
                    RECOMMENDED
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">
                    Any Available Professional
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Maximum flexibility. We will assign the top qualified stylist for your selected time.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-medium">All Slots Open</span>
                <span className="font-bold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Select <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* OPTION 2: Specific Staff Members */}
            {staffList.map((staff) => {
              const isSelected = selectedStaffId === staff.id

              return (
                <div
                  key={staff.id}
                  onClick={() => {
                    setSelectedStaffId(staff.id)
                    setCurrentStep('date')
                  }}
                  className={cn(
                    'group relative p-5 rounded-2xl border transition-all cursor-pointer bg-slate-900/90 text-left flex flex-col justify-between hover:shadow-lg',
                    isSelected
                      ? 'border-primary ring-1 ring-primary bg-primary/5'
                      : 'border-slate-800 hover:border-slate-700'
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Avatar
                        name={staff.name}
                        src={staff.avatarUrl}
                        size="lg"
                        className="ring-2 ring-slate-800 group-hover:ring-primary/50 transition-all"
                      />
                      <div className="flex items-center gap-1 text-amber-400 text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-slate-200">
                          {staff.rating ? staff.rating.toFixed(1) : '4.9'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">
                        {staff.name}
                      </h3>
                      <p className="text-xs text-primary font-medium">{staff.role}</p>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {staff.specialties?.join(' · ') || 'Bespoke Styling & Haircare'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {staff.status === 'active' ? 'Active Today' : 'Scheduled'}
                    </span>
                    <span className="font-bold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      {isSelected ? 'Selected' : 'Select'} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ─── STEP 3: DATE SELECTION ─── */}
      {currentStep === 'date' && (
        <section aria-labelledby="step-date-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="step-date-heading" className="text-lg font-bold text-white">
                Step 3: Select Appointment Date
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Salon holidays, closed days, and past dates are automatically disabled
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('staff')}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              className="text-xs text-slate-400 hover:text-white"
            >
              Back to Stylist
            </Button>
          </div>

          {/* Interactive Calendar Card */}
          <div className="max-w-lg mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
            {/* Month Header & Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((d, i) => {
                const isSelected = selectedDate === d.dateStr
                const isHoliday = SALON_HOLIDAYS_2026.includes(d.dateStr)

                return (
                  <button
                    key={`${d.dateStr}-${i}`}
                    type="button"
                    disabled={!d.selectable}
                    title={d.reason}
                    onClick={() => {
                      setSelectedDate(d.dateStr)
                      setCurrentStep('time')
                    }}
                    className={cn(
                      'relative h-11 rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all select-none',
                      isSelected
                        ? 'bg-primary text-white shadow-md ring-2 ring-primary ring-offset-2 ring-offset-slate-900 font-bold'
                        : d.selectable
                        ? 'bg-slate-800/80 text-white hover:bg-primary/20 hover:text-primary hover:border-primary border border-transparent'
                        : 'bg-slate-950/40 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50'
                    )}
                  >
                    <span>{d.dayNum}</span>
                    {isHoliday && (
                      <span className="w-1 h-1 rounded-full bg-amber-400 absolute bottom-1" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Calendar Legend */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Salon Holiday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <span>Closed / Past</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── STEP 4: TIME SLOT SELECTION ─── */}
      {currentStep === 'time' && (
        <section aria-labelledby="step-time-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="step-time-heading" className="text-lg font-bold text-white">
                Step 4: Select Appointment Time
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Showing available times for {selectedDate} · Duration: {selectedService?.duration} mins
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('date')}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              className="text-xs text-slate-400 hover:text-white"
            >
              Change Date
            </Button>
          </div>

          {/* Time Slot Sections */}
          <div className="space-y-6">
            {/* Morning Slots */}
            {groupedSlots.morning.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span>Morning Slots</span>
                  <span className="text-[10px] text-slate-500 font-normal">(Before 12:00 PM)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {groupedSlots.morning.map((slot) => {
                    const isSelected = selectedTimeSlot?.time === slot.time
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => {
                          setSelectedTimeSlot(slot)
                          setCurrentStep('details')
                        }}
                        className={cn(
                          'p-3 rounded-xl text-center text-xs font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-sm font-extrabold'
                            : slot.isAvailable
                            ? 'bg-slate-900 border-slate-800 text-slate-100 hover:border-primary hover:text-primary cursor-pointer'
                            : 'bg-slate-950/60 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                        )}
                      >
                        <span className="block tabular-nums">{formatTime12Hour(slot.time)}</span>
                        {!slot.isAvailable && (
                          <span className="block text-[9px] font-normal text-slate-500 truncate mt-0.5">
                            {slot.reason || 'Booked'}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Afternoon Slots */}
            {groupedSlots.afternoon.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span>Afternoon Slots</span>
                  <span className="text-[10px] text-slate-500 font-normal">(12:00 PM – 5:00 PM)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {groupedSlots.afternoon.map((slot) => {
                    const isSelected = selectedTimeSlot?.time === slot.time
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => {
                          setSelectedTimeSlot(slot)
                          setCurrentStep('details')
                        }}
                        className={cn(
                          'p-3 rounded-xl text-center text-xs font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-sm font-extrabold'
                            : slot.isAvailable
                            ? 'bg-slate-900 border-slate-800 text-slate-100 hover:border-primary hover:text-primary cursor-pointer'
                            : 'bg-slate-950/60 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                        )}
                      >
                        <span className="block tabular-nums">{formatTime12Hour(slot.time)}</span>
                        {!slot.isAvailable && (
                          <span className="block text-[9px] font-normal text-slate-500 truncate mt-0.5">
                            {slot.reason || 'Booked'}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Evening Slots */}
            {groupedSlots.evening.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span>Evening Slots</span>
                  <span className="text-[10px] text-slate-500 font-normal">(After 5:00 PM)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {groupedSlots.evening.map((slot) => {
                    const isSelected = selectedTimeSlot?.time === slot.time
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => {
                          setSelectedTimeSlot(slot)
                          setCurrentStep('details')
                        }}
                        className={cn(
                          'p-3 rounded-xl text-center text-xs font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-sm font-extrabold'
                            : slot.isAvailable
                            ? 'bg-slate-900 border-slate-800 text-slate-100 hover:border-primary hover:text-primary cursor-pointer'
                            : 'bg-slate-950/60 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                        )}
                      >
                        <span className="block tabular-nums">{formatTime12Hour(slot.time)}</span>
                        {!slot.isAvailable && (
                          <span className="block text-[9px] font-normal text-slate-500 truncate mt-0.5">
                            {slot.reason || 'Booked'}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {availableSlots.length === 0 && (
              <div className="py-12 text-center rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-2">
                <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-bold text-white">No available time slots on this date</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Our professionals are fully booked on {selectedDate}. Please select another date or select &quot;Any Available Professional&quot; for greater availability.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep('date')}
                  className="mt-2 text-xs border-slate-700"
                >
                  Choose Different Date
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── STEP 5: CUSTOMER DETAILS ─── */}
      {currentStep === 'details' && (
        <section aria-labelledby="step-details-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="step-details-heading" className="text-lg font-bold text-white">
                Step 5: Guest Details &amp; Requests
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                We will send booking confirmations and token SMS updates to this contact
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('time')}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              className="text-xs text-slate-400 hover:text-white"
            >
              Back to Time
            </Button>
          </div>

          <div className="max-w-xl mx-auto rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-5 shadow-xl">
            {isAuthenticated && customer && (
              <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Auto-filled from your <strong>SALORA VIP</strong> profile
                  </span>
                </div>
                <Badge variant="primary" size="sm">
                  {customer.membershipTier} Member
                </Badge>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma…"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
                />
                {formErrors.name && <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210…"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
                  />
                  {formErrors.phone && <p className="text-[11px] text-rose-400 mt-1">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="priya@example.com…"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
                  />
                  {formErrors.email && <p className="text-[11px] text-rose-400 mt-1">{formErrors.email}</p>}
                </div>
              </div>

              {/* Referral Code Field */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Referral Code <span className="text-slate-500">(Optional)</span></span>
                  <span className="text-[11px] text-pink-400 font-bold">+200 Welcome Bonus Points</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. AYAAN20 or PRIYA20…"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors uppercase font-mono font-bold"
                  />
                  {referralCodeInput && (
                    <span className="absolute right-3 top-2.5 text-[10px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full">
                      Referral Code Applied
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Special Notes or Requests <span className="text-slate-500">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell your specialist about allergies, hair history, scalp sensitivity, or special preferences…"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full font-bold"
                  onClick={() => {
                    if (validateDetailsStep()) {
                      setCurrentStep('summary')
                    }
                  }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Review Booking Summary
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── STEP 6: SUMMARY & CONFIRMATION ─── */}
      {currentStep === 'summary' && selectedService && selectedTimeSlot && (
        <section aria-labelledby="step-summary-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="step-summary-heading" className="text-lg font-bold text-white">
                Step 6: Review &amp; Confirm Booking
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify your appointment details before final confirmation
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('details')}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              className="text-xs text-slate-400 hover:text-white"
            >
              Edit Details
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Details Card */}
            <div className="md:col-span-2 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
              {/* Salon info banner */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{salon.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{salon.address}, {salon.city}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>

              {/* Service & Specialist Breakdown */}
              <div className="space-y-4">
                <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      Selected Treatment
                    </span>
                    <h4 className="text-lg font-bold text-white mt-0.5">{selectedService.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{selectedService.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-slate-400">Duration</span>
                    <p className="text-base font-bold text-white">{selectedService.duration} mins</p>
                  </div>
                </div>

                {/* Appointment Schedule */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Date &amp; Time
                    </span>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      <span>{selectedDate}</span>
                    </p>
                    <p className="text-xs text-slate-300 tabular-nums">
                      {formatTime12Hour(selectedTimeSlot.time)}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Assigned Professional
                    </span>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-teal-400" />
                      <span>
                        {selectedStaffId === 'any'
                          ? `Any Available (${selectedTimeSlot.staffName || 'Assigned Top Stylist'})`
                          : selectedStaff?.name}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {selectedStaff?.role || 'Aesthetic Specialist'}
                    </p>
                  </div>
                </div>

                {/* Guest Contact Details */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Guest Information
                  </span>
                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
                    <span>
                      <strong className="text-white">{customerName}</strong> ({customerPhone})
                    </span>
                    {customerEmail && <span className="text-slate-400">{customerEmail}</span>}
                  </div>
                  {customerNotes && (
                    <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/80 mt-1">
                      Note: &quot;{customerNotes}&quot;
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Price & Deposit Summary */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-5 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
                  Payment Summary
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Treatment Base Price</span>
                    <span className="font-semibold tabular-nums">
                      ₹{basePrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {appliedBenefit && (
                    <div className="pt-1">
                      {appliedBenefit.type === 'PACKAGE' ? (
                        <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs flex items-center justify-between text-teal-300">
                          <span className="flex items-center gap-1.5 font-bold">
                            <Package className="w-3.5 h-3.5 text-teal-400" />
                            {appliedBenefit.title}
                          </span>
                          <span className="font-extrabold text-emerald-400">
                            -₹{discountAmount.toLocaleString('en-IN')} (100% Pass)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-emerald-400">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            {appliedBenefit.title}
                          </span>
                          <span className="font-bold tabular-nums">
                            -₹{discountAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm font-bold text-white">
                    <span>Total Investment</span>
                    <span className="text-base tabular-nums">
                      ₹{finalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Deposit Details if required */}
                {depositRequired > 0 ? (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                      <span>Advance Booking Deposit</span>
                      <span className="text-sm tabular-nums">₹{depositRequired.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Secures your styling station. The remaining ₹{(finalPrice - depositRequired).toLocaleString('en-IN')} will be payable at salon checkout.
                    </p>

                    {/* Mock payment method selector */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Select Payment Mode
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['upi', 'card', 'netbanking'] as const).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setDepositPaymentMethod(method)}
                            className={cn(
                              'py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase transition-colors border text-center',
                              depositPaymentMethod === method
                                ? 'bg-amber-400 text-slate-950 border-amber-400'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            )}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>No advance deposit required. Pay at the salon checkout after service.</span>
                  </div>
                )}
              </div>

              {/* Confirm CTA */}
              <div className="space-y-2 pt-4">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full font-bold shadow-md shadow-primary/20 text-sm"
                  onClick={handleConfirmBooking}
                  isLoading={submitting}
                >
                  {depositRequired > 0
                    ? `Pay Deposit ₹${depositRequired} & Confirm`
                    : 'Confirm Booking'}
                </Button>

                <p className="text-center text-[10px] text-slate-500">
                  By confirming, you agree to our {bookingSettings?.cancellationWindowHours || 24}h cancellation policy.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── STEP 7: BOOKING CONFIRMED ─── */}
      {currentStep === 'confirmed' && confirmedAppointment && (
        <section aria-labelledby="step-confirmed-heading" className="max-w-2xl mx-auto space-y-6">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-10 text-center space-y-6 shadow-2xl">
            {/* Animated Success Badge */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Reservation Finalized
              </span>
              <h2 id="step-confirmed-heading" className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Your appointment is confirmed.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                We have reserved your styling station and sent confirmation details to {customerPhone}.
              </p>
            </div>

            {/* Confirmation Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Booking Reference
                  </span>
                  <p className="text-base font-extrabold text-primary font-mono">
                    #{confirmedAppointment.appointmentId || confirmedAppointment.id}
                  </p>
                </div>

                {confirmedAppointment.tokenNumber && (
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Salon Entry Token
                    </span>
                    <p className="text-base font-extrabold text-amber-400 font-mono">
                      #{confirmedAppointment.tokenNumber}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Service</span>
                  <strong className="text-white text-sm">{confirmedAppointment.serviceName}</strong>
                </div>

                <div>
                  <span className="text-slate-500 block">Professional</span>
                  <strong className="text-white text-sm">{confirmedAppointment.staffName}</strong>
                </div>

                <div>
                  <span className="text-slate-500 block">Date</span>
                  <strong className="text-white">{confirmedAppointment.date}</strong>
                </div>

                <div>
                  <span className="text-slate-500 block">Time</span>
                  <strong className="text-white tabular-nums">
                    {formatTime12Hour(confirmedAppointment.startTime)} ({confirmedAppointment.serviceDuration} mins)
                  </strong>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {/* Google Calendar Link */}
                <a
                  href={createGoogleCalendarUrl(confirmedAppointment, salon.name, salon.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <CalendarPlus className="w-4 h-4 text-primary" />
                  <span>Add to Google Calendar</span>
                </a>

                {/* Download ICS File */}
                <button
                  type="button"
                  onClick={() => downloadIcsFile(confirmedAppointment, salon.name, salon.address)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4 text-teal-400" />
                  <span>Download Calendar (.ics)</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {/* View Appointment Details */}
                <Link
                  to={`/customer/appointments/${confirmedAppointment.id}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Appointment</span>
                </Link>

                {/* Book Another Service */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedServiceId('')
                    setSelectedStaffId('any')
                    setSelectedTimeSlot(null)
                    setConfirmedAppointment(null)
                    setCurrentStep('service')
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Book Another Service</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
