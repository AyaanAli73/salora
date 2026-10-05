import React, { useState } from 'react'
import {
  Calendar,
  Clock,
  User,
  Phone,
  Scissors,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  XCircle,
  CalendarDays,
  FileText,
  Tag,
  Hash,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { Appointment, AppointmentStatus } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { formatTime12Hour } from '@/utils/availability'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { AppointmentSourceBadge } from './AppointmentSourceBadge'
import { CheckInModal, TokenPrintTemplate } from '@/features/queue'
import { useQueueStore } from '@/store/useQueueStore'
import { printService } from '@/services/printService'
import { useToastStore } from '@/store/useToastStore'
import { Link, useNavigate } from 'react-router-dom'
import { Printer, Pause, Play, Check, SkipForward, Megaphone, CreditCard } from 'lucide-react'

interface AppointmentDetailsProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onUpdateStatus: (id: string, status: AppointmentStatus) => void
  onReschedule: (id: string, date: string, startTime: string) => void
  onEdit?: (appointment: Appointment) => void
}

export const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
  isOpen,
  onClose,
  appointment,
  onUpdateStatus,
  onReschedule,
  onEdit,
}) => {
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [isCheckInOpen, setIsCheckInOpen] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const navigate = useNavigate()

  const {
    tokens,
    callToken,
    recallToken,
    startService,
    completeToken,
    holdToken,
    resumeToken,
    skipToken,
  } = useQueueStore()
  const { addToast } = useToastStore()

  if (!appointment) return null

  // Find linked token
  const linkedToken = tokens.find(
    (t) =>
      t.appointmentId === appointment.id ||
      t.id === appointment.tokenId ||
      (appointment.tokenNumber && t.displayNumber === appointment.tokenNumber)
  )

  const handleStartReschedule = () => {
    setNewDate(appointment.date)
    setNewTime(appointment.startTime)
    setIsRescheduling(true)
  }

  const handleConfirmReschedule = () => {
    if (!newDate || !newTime) return
    onReschedule(appointment.id, newDate, newTime)
    setIsRescheduling(false)
  }

  const handleCall = async () => {
    if (!linkedToken) return
    try {
      await callToken(linkedToken.id)
      onUpdateStatus(appointment.id, 'called')
      addToast({
        title: 'Customer Called',
        message: `${appointment.clientName} (Token ${linkedToken.displayNumber}) called to chair.`,
        type: 'info',
      })
    } catch (err: any) {
      addToast({ title: 'Error', message: err.message, type: 'danger' })
    }
  }

  const handleStart = async () => {
    if (linkedToken) {
      await startService(linkedToken.id)
    }
    onUpdateStatus(appointment.id, 'in-progress')
    addToast({
      title: 'Service Started',
      message: `Treatment for ${appointment.clientName} has started.`,
      type: 'success',
    })
  }

  const handleComplete = async () => {
    if (linkedToken) {
      await completeToken(linkedToken.id)
    }
    onUpdateStatus(appointment.id, 'completed')
    addToast({
      title: 'Service Completed',
      message: `Appointment for ${appointment.clientName} marked as completed.`,
      type: 'success',
    })
  }

  const handleHold = async () => {
    if (!linkedToken) return
    await holdToken(linkedToken.id)
    addToast({
      title: 'Customer On Hold',
      message: `Token ${linkedToken.displayNumber} put on hold.`,
      type: 'warning',
    })
  }

  const handleResume = async () => {
    if (!linkedToken) return
    await resumeToken(linkedToken.id)
    addToast({
      title: 'Customer Resumed',
      message: `Token ${linkedToken.displayNumber} returned to active waiting queue.`,
      type: 'success',
    })
  }

  const handleSkip = async () => {
    if (!linkedToken) return
    await skipToken(linkedToken.id)
    addToast({
      title: 'Customer Skipped',
      message: `Token ${linkedToken.displayNumber} skipped.`,
      type: 'warning',
    })
  }

  const handlePrint = () => {
    if (linkedToken) {
      printService.printToken(linkedToken)
      addToast({
        title: 'Token Printed',
        message: `Token slip for ${linkedToken.displayNumber} sent to printer.`,
        type: 'success',
      })
    }
  }

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={() => {
          setIsRescheduling(false)
          onClose()
        }}
        title="Appointment Details"
        description={`Booking Reference: ${appointment.appointmentId || appointment.id}`}
        size="md"
        footer={
          <div className="w-full flex flex-col gap-2">
            {/* Status lifecycle actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Cancel Action */}
              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateStatus(appointment.id, 'cancelled')}
                  leftIcon={<XCircle className="h-4 w-4 text-rose-500" />}
                >
                  Cancel
                </Button>
              )}

              <div className="flex flex-wrap items-center gap-2 ml-auto">
                {/* Print Token button if token exists */}
                {(linkedToken || appointment.tokenNumber) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    leftIcon={<Printer className="h-4 w-4 text-primary" />}
                    title="Print 58mm Thermal Slip"
                  >
                    Print Slip
                  </Button>
                )}

                {/* Mark Confirmed */}
                {(appointment.status === 'requested' || appointment.status === 'pending') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateStatus(appointment.id, 'confirmed')}
                    leftIcon={<CheckCircle2 className="h-4 w-4 text-primary" />}
                  >
                    Confirm
                  </Button>
                )}

                {/* CHECK IN BUTTON (Phase 2 core feature) */}
                {appointment.status !== 'checked-in' &&
                  appointment.status !== 'called' &&
                  appointment.status !== 'in-progress' &&
                  appointment.status !== 'completed' &&
                  appointment.status !== 'cancelled' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsCheckInOpen(true)}
                      leftIcon={<Clock className="h-4 w-4" />}
                      className="shadow-glow-primary/30"
                    >
                      Check In
                    </Button>
                  )}

                {/* If Waiting */}
                {(appointment.status === 'checked-in' || (linkedToken && linkedToken.status === 'WAITING')) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSkip}
                      leftIcon={<SkipForward className="h-3.5 w-3.5 text-rose-500" />}
                    >
                      Skip
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleHold}
                      leftIcon={<Pause className="h-3.5 w-3.5 text-amber-500" />}
                    >
                      Hold
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCall}
                      leftIcon={<Megaphone className="h-4 w-4" />}
                      className="shadow-glow-primary/30"
                    >
                      Call Customer
                    </Button>
                  </>
                )}

                {/* If On Hold */}
                {linkedToken && linkedToken.status === 'HOLD' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleResume}
                    leftIcon={<Play className="h-4 w-4" />}
                  >
                    Resume
                  </Button>
                )}

                {/* If Called */}
                {(appointment.status === 'called' || (linkedToken && linkedToken.status === 'CALLED')) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCall}
                      leftIcon={<Megaphone className="h-4 w-4 text-primary" />}
                    >
                      Re-call
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleStart}
                      leftIcon={<PlayCircle className="h-4 w-4" />}
                      className="shadow-glow-primary/30"
                    >
                      Start Service
                    </Button>
                  </>
                )}

                {/* If In Progress */}
                {(appointment.status === 'in-progress' || (linkedToken && linkedToken.status === 'IN_SERVICE')) && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleComplete}
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                    className="shadow-glow-primary/30"
                  >
                    Complete Service
                  </Button>
                )}

                {/* If Completed -> Create Bill (Phase 2 Part 2) */}
                {appointment.status === 'completed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onClose()
                      navigate(`/sales/billing?appointmentId=${appointment.id}`)
                    }}
                    leftIcon={<CreditCard className="h-4 w-4" />}
                    className="shadow-glow-primary/30 font-bold"
                  >
                    Create Bill
                  </Button>
                )}
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Top Status & Price Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface-subtle border border-border">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                Booking Status & Source
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <AppointmentStatusBadge status={appointment.status} />
                <AppointmentSourceBadge source={appointment.bookingSource || 'ONLINE'} />
              </div>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                Total Amount
              </span>
              <p className="text-xl font-bold text-text-primary tabular-nums mt-0.5">
                {formatCurrency(appointment.totalAmount)}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5 flex-wrap">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    appointment.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {appointment.paymentStatus === 'paid' ? 'Paid Full' : 'Pay at Desk'}
                </span>
                {Boolean(appointment.depositPaid && appointment.depositPaid > 0) && (
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                    Deposit Paid ({formatCurrency(appointment.depositPaid || 0)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Online Booking Deposit Card (Phase 3 Part 2) */}
          {Boolean(appointment.depositRequired || (appointment.depositPaid && appointment.depositPaid > 0)) && (
            <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Online Booking Deposit</h4>
                  <p className="text-[11px] text-text-muted">
                    Deposit Status: <span className="font-semibold text-teal-700 dark:text-teal-300 uppercase">{appointment.depositStatus || 'PAID'}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300 tabular-nums">
                  {formatCurrency(appointment.depositPaid || 0)} Paid
                </span>
                <span className="block text-[10px] text-text-muted tabular-nums">
                  Remaining: {formatCurrency(Math.max(0, appointment.totalAmount - (appointment.depositPaid || 0)))}
                </span>
              </div>
            </div>
          )}

          {/* TOKEN & QUEUE CARD */}
          {appointment.tokenNumber || linkedToken ? (
            <div className="p-4 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/[0.06] to-violet-500/[0.02] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-primary tracking-widest flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  Live Queue Token
                </span>

                {linkedToken?.priority === 'VIP' && (
                  <Badge variant="accent" size="sm">
                    ⭐ VIP
                  </Badge>
                )}
                {linkedToken?.priority === 'EMERGENCY' && (
                  <Badge variant="danger" size="sm">
                    🔴 Emergency
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-4xl sm:text-5xl font-black text-text-primary font-sans tracking-tight">
                    {linkedToken?.displayNumber || appointment.tokenNumber}
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    {appointment.status === 'called' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                        <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                        Now Serving
                      </span>
                    ) : appointment.status === 'in-progress' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-600">
                        <span className="w-2 h-2 rounded-full bg-violet-600" />
                        In Service
                      </span>
                    ) : appointment.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                        <Clock className="h-3.5 w-3.5" />
                        Waiting in Lounge
                      </span>
                    )}

                    <span className="text-text-muted text-xs">•</span>
                    <span className="text-xs text-text-muted">
                      Est. Wait: ~{linkedToken?.estimatedWaitMinutes || 15} min
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    leftIcon={<Printer className="h-3.5 w-3.5" />}
                    className="text-xs"
                  >
                    Print Slip
                  </Button>

                  <Link
                    to="/appointments/queue"
                    className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    Open Queue <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Check In Callout when not yet checked in */
            <div className="p-3.5 rounded-xl border border-dashed border-primary/40 bg-primary/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                    Guest Arrival Check-In
                  </span>
                  <p className="text-xs font-bold text-text-primary">
                    Customer arrived? Generate token & queue.
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCheckInOpen(true)}
                className="text-xs shadow-glow-primary/20"
              >
                Check In Now
              </Button>
            </div>
          )}

        {/* Client Card */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Client Information
          </span>
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-3">
              <Avatar
                name={appointment.clientName}
                src={appointment.clientAvatar}
                size="md"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">
                  {appointment.clientName}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
                  <Phone className="h-3 w-3" />
                  <span>{appointment.clientPhone}</span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`tel:${appointment.clientPhone}`)}
            >
              Call
            </Button>
          </div>
        </div>

        {/* Service & Specialist Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Scissors className="h-3 w-3 text-primary" />
              Service
            </span>
            <p className="text-xs font-bold text-text-primary truncate">
              {appointment.serviceName}
            </p>
            <p className="text-[11px] text-text-muted tabular-nums">
              {appointment.duration || appointment.serviceDuration} mins
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <User className="h-3 w-3 text-primary" />
              Specialist
            </span>
            <div className="flex items-center gap-2">
              <Avatar
                name={appointment.staffName}
                src={appointment.staffAvatar}
                size="xs"
              />
              <p className="text-xs font-bold text-text-primary truncate">
                {appointment.staffName}
              </p>
            </div>
            {appointment.roomOrStation && (
              <p className="text-[11px] text-text-muted truncate">
                {appointment.roomOrStation}
              </p>
            )}
          </div>
        </div>

        {/* Date, Time & Reschedule */}
        <div className="p-4 rounded-xl border border-border bg-surface space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-text-muted" />
              Schedule Details
            </span>

            {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRescheduling(!isRescheduling)}
                className="text-xs h-7 px-2.5"
              >
                {isRescheduling ? 'Cancel Reschedule' : 'Reschedule'}
              </Button>
            )}
          </div>

          {!isRescheduling ? (
            <div className="grid grid-cols-2 gap-3 text-xs tabular-nums">
              <div>
                <span className="text-text-muted block text-[11px]">Appointment Date</span>
                <span className="font-bold text-text-primary">{appointment.date}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Time Window</span>
                <span className="font-bold text-text-primary">
                  {appointment.startTime} - {appointment.endTime} ({formatTime12Hour(appointment.startTime)})
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-surface-subtle border border-border space-y-3 animate-in fade-in duration-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                    New Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg bg-surface border border-border text-xs text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                    New Start Time
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg bg-surface border border-border text-xs text-text-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRescheduling(false)}
                  className="h-7 text-xs"
                >
                  Discard
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmReschedule}
                  className="h-7 text-xs"
                >
                  Save New Time
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Treatment Notes & Formula */}
        {appointment.notes && (
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-text-muted" />
              Formula & Treatment Notes
            </span>
            <div className="p-3.5 rounded-xl border border-border bg-surface-subtle text-xs text-text-secondary leading-relaxed">
              {appointment.notes}
            </div>
          </div>
        )}

        {/* Price Breakdown */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Charges Breakdown
          </span>
          <div className="p-3.5 rounded-xl border border-border bg-surface space-y-2 text-xs">
            <div className="flex justify-between text-text-muted">
              <span>Treatment Base Rate</span>
              <span className="tabular-nums text-text-primary font-medium">
                {formatCurrency(appointment.price || appointment.servicePrice)}
              </span>
            </div>

            {Boolean(appointment.discount) && (
              <div className="flex justify-between text-emerald-600">
                <span>Promotional Discount</span>
                <span className="tabular-nums font-medium">
                  -{formatCurrency(appointment.discount || 0)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-text-muted">
              <span>GST / Tax (18%)</span>
              <span className="tabular-nums text-text-primary font-medium">
                {formatCurrency(appointment.tax || 0)}
              </span>
            </div>

            <div className="border-t border-border pt-2 flex justify-between font-bold text-sm text-text-primary">
              <span>Total Payable</span>
              <span className="tabular-nums text-primary">
                {formatCurrency(appointment.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Drawer>

    {/* Check In Confirmation Modal */}
    {isCheckInOpen && (
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        appointment={appointment}
        onSuccess={(token) => {
          onUpdateStatus(appointment.id, 'checked-in')
          setIsCheckInOpen(false)
        }}
      />
    )}

    {/* Printable Thermal Receipt Modal */}
    {isPrintModalOpen && linkedToken && (
      <TokenPrintTemplate
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        token={linkedToken}
      />
    )}
  </>
  )
}
