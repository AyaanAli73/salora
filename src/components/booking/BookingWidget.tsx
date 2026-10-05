import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  User,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Phone,
  ShieldCheck,
} from 'lucide-react'
import { serviceService } from '@/services/serviceService'
import { staffService } from '@/services/staffService'
import { appointmentService } from '@/services/appointmentService'
import { Service, Staff, TimeSlot } from '@/types'
import { formatTime12Hour, getAvailableSlotsForAnyStaff, calculateEndTime } from '@/utils/availability'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export interface BookingWidgetProps {
  className?: string
  initialServiceId?: string
  title?: string
  subtitle?: string
  compact?: boolean
  onBookingSuccess?: (appointmentId: string) => void
}

export const BookingWidget: React.FC<BookingWidgetProps> = ({
  className,
  initialServiceId,
  title = 'Book Your Appointment',
  subtitle = 'Experience luxury salon treatments crafted by master stylists',
  compact = false,
  onBookingSuccess,
}) => {
  const navigate = useNavigate()
  const [services, setServices] = useState<Service[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId || '')
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [selectedTime, setSelectedTime] = useState<string>('11:00')
  const [customerName, setCustomerName] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmedId, setConfirmedId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([serviceService.getAll(), staffService.getAll()]).then(([servs, staffs]) => {
      setServices(servs)
      setStaffList(staffs.filter((s) => s.status === 'active' || s.status === undefined))
      if (initialServiceId && servs.some((s) => s.id === initialServiceId)) {
        setSelectedServiceId(initialServiceId)
      } else if (servs.length > 0 && !selectedServiceId) {
        setSelectedServiceId(servs[0].id)
      }
    })
  }, [initialServiceId])

  const selectedService = services.find((s) => s.id === selectedServiceId)

  // Quick slot preview
  const availableSlots = React.useMemo(() => {
    if (!selectedService || !selectedDate) return []
    const appts = appointmentService.getAllSync()
    const slots = getAvailableSlotsForAnyStaff(
      staffList,
      selectedDate,
      selectedService.duration || 45,
      appts
    )
    return slots.filter((s) => s.isAvailable).slice(0, 8)
  }, [selectedService, selectedDate, staffList])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService || !selectedDate || !selectedTime) return
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Please provide your name and phone number.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      const duration = selectedService.duration || 45
      const calculatedEnd = calculateEndTime(selectedTime, duration)

      const appt = await appointmentService.create({
        appointmentId: `SLR-${Math.floor(1000 + Math.random() * 9000)}`,
        clientId: `cli-web-${Date.now()}`,
        clientName: customerName.trim(),
        clientPhone: customerPhone.trim(),
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceCategory: selectedService.categoryName || 'Hair Care',
        serviceDuration: duration,
        price: selectedService.price,
        servicePrice: selectedService.price,
        totalAmount: selectedService.price,
        staffId: staffList[0]?.id || 'staff-1',
        staffName: staffList[0]?.name || 'Professional Stylist',
        date: selectedDate,
        startTime: selectedTime,
        endTime: calculatedEnd,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        bookingSource: 'ONLINE',
      })

      setConfirmedId(appt.appointmentId || appt.id)
      onBookingSuccess?.(appt.id)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Booking failed. Please try again.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (confirmedId) {
    return (
      <div
        className={cn(
          'rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 text-center space-y-4 shadow-2xl',
          className
        )}
      >
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Your appointment is confirmed</h3>
          <p className="text-xs text-slate-400 mt-1">
            Reference code: <span className="text-primary font-mono font-bold">#{confirmedId}</span>
          </p>
        </div>
        <p className="text-xs text-slate-300">
          We will send SMS confirmation and directions to {customerPhone}.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to="/customer/book"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>Open Full Booking Wizard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-3xl bg-slate-900/95 border border-slate-800 p-5 sm:p-7 shadow-2xl space-y-5 text-left',
        className
      )}
    >
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Quick Reservation</span>
        </div>
        <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">{title}</h3>
        {!compact && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Choose Service */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Choose Treatment
          </label>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                {s.name} ({s.duration}m) — ₹{s.price.toLocaleString('en-IN')}
              </option>
            ))}
          </select>
        </div>

        {/* Date and Time preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Preferred Date
            </label>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Available Slots
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              {availableSlots.length > 0 ? (
                availableSlots.map((slot) => (
                  <option key={slot.time} value={slot.time} className="bg-slate-900 text-white">
                    {formatTime12Hour(slot.time)}
                  </option>
                ))
              ) : (
                <option value="11:00">11:00 AM</option>
              )}
            </select>
          </div>
        </div>

        {/* Guest Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Name</label>
            <input
              type="text"
              placeholder="e.g. Priya Sharma"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-2 space-y-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full font-bold shadow-md shadow-primary/20 text-xs"
            isLoading={isSubmitting}
          >
            Instant Reserve Appointment
          </Button>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant Confirmation</span>
            </span>
            <Link
              to={selectedServiceId ? `/customer/book?serviceId=${selectedServiceId}` : '/customer/book'}
              className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
            >
              <span>Full Wizard</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
