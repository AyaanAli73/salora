import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Phone,
  MapPin,
  RotateCcw,
  Printer,
  Download,
} from 'lucide-react'
import { customerPortalService } from '@/services/customerPortalService'
import { printService } from '@/services/printService'
import { Appointment, Bill } from '@/types'
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore'
import { useSalonStore } from '@/store/useSalonStore'
import { useToastStore } from '@/store/useToastStore'
import { canCancelAppointment } from '@/utils/availability'
import { createGoogleCalendarUrl, downloadIcsFile } from '@/utils/calendarExport'
import { CustomerRescheduleModal } from '@/components/customer/CustomerRescheduleModal'

export const CustomerAppointmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { customer } = useCustomerAuthStore()
  const { salon } = useSalonStore()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [invoice, setInvoice] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)

  const fetchDetail = async () => {
    if (!id || !customer) return
    setLoading(true)
    try {
      const appt = await customerPortalService.getAppointmentById(id)
      if (appt && appt.clientId === customer.id) {
        setAppointment(appt)
        if (appt.billId || appt.paymentStatus === 'paid') {
          const invoices = await customerPortalService.getCustomerInvoices(customer.id)
          const matchedInv = invoices.find(
            (i) => i.id === appt.billId || i.appointmentId === appt.id
          )
          if (matchedInv) setInvoice(matchedInv)
        }
      }
    } catch (err) {
      console.error('Failed to load appointment details:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [id, customer])

  const handlePrintInvoice = () => {
    if (invoice) {
      printService.printInvoice(invoice)
    }
  }

  const handleCancel = async () => {
    if (!appointment) return
    const policy = canCancelAppointment(appointment, salon.bookingSettings)
    let promptMsg = 'Are you sure you wish to cancel this booking?'
    if (policy.warning) {
      promptMsg = `${policy.warning}\n\nDo you still wish to cancel this booking?`
    }

    if (!window.confirm(promptMsg)) return
    await customerPortalService.cancelAppointment(
      appointment.id,
      'Cancelled by guest from portal.'
    )
    navigate('/customer/appointments')
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Retrieving appointment record…</p>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="py-16 text-center rounded-3xl bg-slate-900 border border-slate-800 p-8 max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Appointment Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">
          This booking could not be located or belongs to another guest profile.
        </p>
        <Link
          to="/customer/appointments"
          className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Appointments</span>
        </Link>
      </div>
    )
  }

  const isConfirmed = appointment.status === 'confirmed'
  const isCompleted = appointment.status === 'completed'

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/customer/appointments"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Appointments</span>
        </Link>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
            isCompleted
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : isConfirmed
              ? 'bg-violet-500/10 text-violet-300 border border-violet-500/30'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}
        >
          {appointment.status.replace('_', ' ')}
        </span>
      </div>

      {/* Main Appointment Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-xs text-violet-400 font-semibold mb-1">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>{appointment.serviceCategory || 'Bespoke Beauty Care'}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">{appointment.serviceName}</h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Booking Ref: #{appointment.appointmentId || appointment.id}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">Total Investment</span>
            <span className="text-2xl font-bold text-white tabular-nums">
              ₹{appointment.price.toLocaleString('en-IN')}
            </span>
            <span className="block text-[11px] text-emerald-400 font-medium">
              Payment Status: {appointment.paymentStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Schedule & Specialist Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase">
              <Calendar className="w-4 h-4 text-pink-400" />
              <span>Date & Time</span>
            </div>
            <p className="text-base font-bold text-white">{appointment.date}</p>
            <p className="text-xs text-slate-300">
              Start: {appointment.startTime} (Duration: {appointment.serviceDuration} minutes)
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase">
              <User className="w-4 h-4 text-violet-400" />
              <span>Designated Stylist</span>
            </div>
            <p className="text-base font-bold text-white">{appointment.staffName}</p>
            <p className="text-xs text-pink-300">Senior Aesthetic Specialist</p>
          </div>
        </div>

        {/* Token Card if present */}
        {appointment.tokenNumber && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/60 to-pink-950/60 border border-violet-600/40 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-pink-300">
                Salon Entry Token
              </span>
              <p className="text-2xl font-extrabold text-white mt-0.5">
                Token #{appointment.tokenNumber}
              </p>
              <p className="text-[11px] text-slate-400">
                Present this token code at the lounge reception desk upon arrival.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-violet-600/30 text-amber-300 flex items-center justify-center font-bold text-lg border border-violet-500/50">
              #{appointment.tokenNumber}
            </div>
          </div>
        )}

        {/* Salon Location Details */}
        <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 space-y-1.5">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>SALORA Flagship Salon & Spa</span>
          </div>
          <p>A-304, Emerald Heights, Linking Road, Bandra West, Mumbai 400050</p>
          <div className="flex items-center space-x-2 text-slate-400 pt-1">
            <Phone className="w-3.5 h-3.5 text-violet-400" />
            <span>Concierge: +91 98765 43210</span>
          </div>
        </div>

        {/* Calendar Export & Action Buttons */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Calendar additions */}
            <div className="flex items-center gap-2">
              <a
                href={createGoogleCalendarUrl(appointment, salon.name, salon.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Google Calendar</span>
              </a>

              <button
                type="button"
                onClick={() => downloadIcsFile(appointment, salon.name, salon.address)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Download .ics</span>
              </button>
            </div>

            {/* Invoices & Re-booking */}
            <div className="flex items-center space-x-2">
              {invoice && (
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-semibold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
              )}

              {isCompleted && (
                <Link
                  to={`/customer/book?serviceId=${appointment.serviceId}`}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white border border-pink-500/30 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Book Again</span>
                </Link>
              )}

              {isConfirmed && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsRescheduleOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-medium transition-colors"
                  >
                    Reschedule
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors"
                  >
                    Cancel Appointment
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      <CustomerRescheduleModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        appointment={appointment}
        onSuccess={(updated) => {
          setAppointment(updated)
          fetchDetail()
        }}
      />
    </div>
  )
}
