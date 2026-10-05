import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { Appointment, TimeSlot, Staff } from '@/types'
import { staffService } from '@/services/staffService'
import { appointmentService } from '@/services/appointmentService'
import { customerPortalService } from '@/services/customerPortalService'
import { useSalonStore } from '@/store/useSalonStore'
import { useToastStore } from '@/store/useToastStore'
import {
  getAvailableSlots,
  canRescheduleAppointment,
  isDateSelectable,
  formatTime12Hour,
} from '@/utils/availability'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

interface CustomerRescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onSuccess: (updated: Appointment) => void
}

export const CustomerRescheduleModal: React.FC<CustomerRescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}) => {
  const { salon } = useSalonStore()
  const { addToast } = useToastStore()

  const [staff, setStaff] = useState<Staff | null>(null)
  const [newDate, setNewDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [rescheduleNotes, setRescheduleNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Policy check
  const policyCheck = useMemo(() => {
    if (!appointment) return { allowed: false, warning: '' }
    return canRescheduleAppointment(appointment, salon.bookingSettings)
  }, [appointment, salon.bookingSettings])

  useEffect(() => {
    if (!appointment || !isOpen) return

    // Pre-set next day as initial target date
    const target = new Date(appointment.date)
    target.setDate(target.getDate() + 1)
    const initialDateStr = target.toISOString().split('T')[0]
    setNewDate(initialDateStr)
    setSelectedSlot(null)
    setErrorMsg(null)

    staffService.getById(appointment.staffId).then((st) => {
      if (st) setStaff(st)
    })
  }, [appointment, isOpen])

  // Available slots for target staff on newDate
  const availableSlots = useMemo(() => {
    if (!appointment || !staff || !newDate) return []
    const appts = appointmentService.getAllSync()
    const dur = appointment.duration || appointment.serviceDuration || 45
    return getAvailableSlots(staff, newDate, dur, appts, salon, 10, 30, 2)
  }, [appointment, staff, newDate, salon])

  if (!isOpen || !appointment) return null

  const handleConfirmReschedule = async () => {
    if (!selectedSlot || !newDate) return
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const updated = await customerPortalService.rescheduleAppointment({
        appointmentId: appointment.id,
        date: newDate,
        startTime: selectedSlot.time,
        notes: rescheduleNotes ? `Rescheduled: ${rescheduleNotes}` : appointment.notes,
      })
      onSuccess(updated)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reschedule appointment.'
      setErrorMsg(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5 text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <span>Reschedule Appointment</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a new date and time with {appointment.staffName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Policy Warning if disallowed */}
        {!policyCheck.allowed && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Rescheduling Notice</p>
              <p className="text-[11px] text-amber-400/90 mt-0.5">{policyCheck.warning}</p>
            </div>
          </div>
        )}

        {/* Current appointment summary */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Current Booking</span>
            <strong className="text-white">{appointment.serviceName}</strong>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {appointment.date} at {formatTime12Hour(appointment.startTime)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Stylist</span>
            <span className="text-primary font-medium">{appointment.staffName}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Select New Date */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Choose New Date
            </label>
            <input
              type="date"
              value={newDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setNewDate(e.target.value)
                setSelectedSlot(null)
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
            />
          </div>

          {/* Time Slots */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Time Slot
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
              {availableSlots.map((slot) => {
                const isSelected = selectedSlot?.time === slot.time
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      'p-2 rounded-xl text-center text-xs font-bold border transition-colors',
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : slot.isAvailable
                        ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-primary hover:text-primary cursor-pointer'
                        : 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed opacity-40'
                    )}
                  >
                    <span>{formatTime12Hour(slot.time)}</span>
                  </button>
                )
              })}
            </div>
            {availableSlots.length === 0 && (
              <p className="text-xs text-slate-500 py-3 text-center">
                No slots available on this date. Please pick another date.
              </p>
            )}
          </div>

          {/* Reason notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason for Rescheduling <span className="text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Schedule conflict, travel delay…"
              value={rescheduleNotes}
              onChange={(e) => setRescheduleNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-slate-400">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!policyCheck.allowed || !selectedSlot || !newDate}
            isLoading={isSubmitting}
            onClick={handleConfirmReschedule}
            className="text-xs font-bold"
          >
            Confirm New Time
          </Button>
        </div>
      </div>
    </div>
  )
}
