import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  User,
  Sparkles,
  ArrowRight,
  FileText,
  AlertCircle,
  XCircle,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  PlusCircle,
  Star,
} from 'lucide-react'
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore'
import { useSalonStore } from '@/store/useSalonStore'
import { customerPortalService } from '@/services/customerPortalService'
import { Appointment } from '@/types'
import { useToastStore } from '@/store/useToastStore'
import { canCancelAppointment } from '@/utils/availability'
import { CustomerRescheduleModal } from '@/components/customer/CustomerRescheduleModal'

export const CustomerAppointmentsPage: React.FC = () => {
  const navigate = useNavigate()
  const { customer } = useCustomerAuthStore()
  const { salon } = useSalonStore()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming')
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null)

  const loadAppointments = async () => {
    if (!customer) return
    setLoading(true)
    try {
      const list = await customerPortalService.getAppointmentHistory(customer.id)
      setAppointments(list)
    } catch (err) {
      console.error('Failed to load customer appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [customer])

  const handleCancelAppointment = async (appt: Appointment) => {
    const policy = canCancelAppointment(appt, salon.bookingSettings)
    let confirmPrompt = 'Are you sure you wish to cancel this appointment?'
    if (policy.warning) {
      confirmPrompt = `${policy.warning}\n\nDo you still wish to proceed with cancellation?`
    }

    if (!window.confirm(confirmPrompt)) {
      return
    }
    try {
      setCancellingId(appt.id)
      await customerPortalService.cancelAppointment(appt.id, 'Cancelled by customer via self-service portal.')
      await loadAppointments()
    } catch (err) {
      console.error(err)
    } finally {
      setCancellingId(null)
    }
  }

  // Filter based on active tab
  const filteredAppointments = appointments.filter((appt) => {
    if (activeTab === 'upcoming') {
      return (
        appt.status === 'confirmed' ||
        appt.status === 'pending' ||
        appt.status === 'in-progress' ||
        appt.status === 'checked-in'
      )
    }
    if (activeTab === 'completed') {
      return appt.status === 'completed'
    }
    if (activeTab === 'cancelled') {
      return appt.status === 'cancelled' || appt.status === 'no-show'
    }
    return true
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center space-x-3">
            <Calendar className="w-7 h-7 text-pink-400" aria-hidden="true" />
            <span>My Salon Appointments</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review your upcoming bookings, check appointment tokens, and browse previous treatments
          </p>
        </div>

        <Link
          to="/customer/book"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-violet-600/30 transition-all hover:scale-102 focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span>Book New Ritual</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-violet-400 ${
            activeTab === 'upcoming'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          Upcoming Bookings (
          {
            appointments.filter(
              (a) =>
                a.status === 'confirmed' ||
                a.status === 'pending' ||
                a.status === 'in-progress' ||
                a.status === 'checked-in'
            ).length
          }
          )
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-violet-400 ${
            activeTab === 'completed'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          Completed Visits ({appointments.filter((a) => a.status === 'completed').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cancelled')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-violet-400 ${
            activeTab === 'cancelled'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          Cancelled ({appointments.filter((a) => a.status === 'cancelled' || a.status === 'no-show').length})
        </button>
      </div>

      {/* Appointment Cards List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading your appointments…</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/60 border border-slate-800 p-8">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">
            No {activeTab} appointments found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {activeTab === 'upcoming'
              ? 'You do not have any upcoming visits scheduled right now. Ready for your next glow up?'
              : `You have no ${activeTab} visits in your history.`}
          </p>
          {activeTab === 'upcoming' && (
            <Link
              to="/customer/book"
              className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map((appt) => {
            const isConfirmed = appt.status === 'confirmed'
            const isCompleted = appt.status === 'completed'
            const isCancelled = appt.status === 'cancelled' || appt.status === 'no-show'
            const isInProgress = appt.status === 'in-progress'

            return (
              <div
                key={appt.id}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-5 shadow-lg flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      ID: #{appt.appointmentId || appt.id.slice(-6)}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : isConfirmed
                          ? 'bg-violet-500/10 text-violet-300 border border-violet-500/30'
                          : isInProgress
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {appt.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-2">{appt.serviceName}</h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <span>
                        Date: <strong className="text-white">{appt.date}</strong> at{' '}
                        <strong className="text-white">{appt.startTime}</strong>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <User className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <span>
                        Stylist:{' '}
                        <strong className="text-pink-300">{appt.staffName || 'Salon Specialist'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        Duration: {appt.serviceDuration} mins • Price:{' '}
                        <strong className="text-white tabular-nums">
                          ₹{appt.price.toLocaleString('en-IN')}
                        </strong>
                      </span>
                    </div>

                    {appt.tokenNumber && (
                      <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-violet-950/80 border border-violet-600/40 text-violet-300">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span className="font-semibold text-xs">
                          Live Token Number: #{appt.tokenNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <Link
                    to={`/customer/appointments/${appt.id}`}
                    className="text-xs font-semibold text-violet-400 hover:text-violet-300 inline-flex items-center space-x-1"
                  >
                    <span>View Full Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                    <div className="flex items-center space-x-2">
                    {isCompleted && (
                      <>
                        <Link
                          to={`/customer/reviews/new?appointmentId=${appt.id}`}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-semibold transition-colors flex items-center space-x-1"
                        >
                          <Star className="w-3 h-3 fill-current" />
                          <span>Rate & Review (+100 Pts)</span>
                        </Link>

                        <Link
                          to={`/customer/book?serviceId=${appt.serviceId}`}
                          className="px-3 py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white border border-pink-500/30 text-xs font-semibold transition-colors flex items-center space-x-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Book Again</span>
                        </Link>
                      </>
                    )}

                    {isConfirmed && (
                      <>
                        <button
                          type="button"
                          onClick={() => setRescheduleAppt(appt)}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-medium transition-colors"
                        >
                          Reschedule
                        </button>

                        <button
                          type="button"
                          disabled={cancellingId === appt.id}
                          onClick={() => handleCancelAppointment(appt)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors"
                        >
                          {cancellingId === appt.id ? 'Cancelling…' : 'Cancel Booking'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      <CustomerRescheduleModal
        isOpen={Boolean(rescheduleAppt)}
        onClose={() => setRescheduleAppt(null)}
        appointment={rescheduleAppt}
        onSuccess={() => loadAppointments()}
      />
    </div>
  )
}
