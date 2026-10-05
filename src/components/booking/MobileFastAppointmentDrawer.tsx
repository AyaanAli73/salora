import React, { useState } from 'react'
import {
  X,
  Calendar,
  Clock,
  User,
  Sparkles,
  Ticket,
  CheckCircle2,
  Play,
  Check,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { appointmentService } from '@/services/appointmentService'
import { clientService } from '@/services/clientService'
import { serviceService } from '@/services/serviceService'
import { staffService } from '@/services/staffService'
import { useToastStore } from '@/store/useToastStore'
import { syncQueueService } from '@/services/syncQueueService'
import { printService } from '@/services/printService'
import { Appointment, Client, Service, Staff } from '@/types'
import { cn } from '@/utils/cn'

interface MobileFastAppointmentDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const TIME_SLOTS = [
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '01:30 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
]

export const MobileFastAppointmentDrawer: React.FC<MobileFastAppointmentDrawerProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToastStore()
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])

  // Selection states
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState<string>('10:00 AM')
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [issueTokenImmediate, setIssueTokenImmediate] = useState(true)

  React.useEffect(() => {
    if (isOpen) {
      clientService.getAll().then((c) => {
        setClients(c || [])
        if (c && c.length > 0 && !selectedClientId) setSelectedClientId(c[0].id)
      }).catch(() => {})

      serviceService.getAll().then((s) => {
        setServices(s || [])
        if (s && s.length > 0 && !selectedServiceId) setSelectedServiceId(s[0].id)
      }).catch(() => {})

      staffService.getAll().then((st) => {
        setStaff(st || [])
        if (st && st.length > 0 && !selectedStaffId) setSelectedStaffId(st[0].id)
      }).catch(() => {})
    }
  }, [isOpen])

  if (!isOpen) return null

  // Generate 7 upcoming day chips
  const dayPills = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const iso = d.toISOString().split('T')[0]
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' })
    const dateNum = d.getDate()
    const month = d.toLocaleDateString('en-US', { month: 'short' })
    return { iso, dayName, dateNum, month }
  })

  const selectedClient = clients.find((c: Client) => c.id === selectedClientId) || clients[0]
  const selectedService = services.find((s: Service) => s.id === selectedServiceId) || services[0]
  const selectedStaffMember = staff.find((s: Staff) => s.id === selectedStaffId) || staff[0]

  const handleBook = async () => {
    if (!selectedClient || !selectedService) return

    const duration = selectedService.duration || 45
    // Calculate simple end time
    const [timePart, meridiem] = selectedTime.split(' ')
    const [hoursStr, minutesStr] = timePart.split(':')
    let hours = parseInt(hoursStr, 10)
    if (meridiem === 'PM' && hours !== 12) hours += 12
    if (meridiem === 'AM' && hours === 12) hours = 0
    const endTotalMinutes = hours * 60 + parseInt(minutesStr, 10) + duration
    const endHours = Math.floor(endTotalMinutes / 60) % 24
    const endMins = endTotalMinutes % 60
    const endMeridiem = endHours >= 12 ? 'PM' : 'AM'
    const displayEndHours = endHours % 12 === 0 ? 12 : endHours % 12
    const endTime = `${String(displayEndHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')} ${endMeridiem}`

    const clientDisplayName = selectedClient.fullName || `${selectedClient.firstName} ${selectedClient.lastName}`

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      clientId: selectedClient.id,
      clientName: clientDisplayName,
      clientPhone: selectedClient.phone,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceDuration: duration,
      servicePrice: selectedService.price,
      staffId: selectedStaffMember?.id || 'staff-1',
      staffName: selectedStaffMember?.name || 'Stylist Available',
      date: selectedDate,
      startTime: selectedTime,
      endTime,
      duration,
      price: selectedService.price || 1200,
      totalAmount: selectedService.price || 1200,
      paymentStatus: 'unpaid',
      status: issueTokenImmediate ? 'confirmed' : 'scheduled',
      notes: 'Booked via Mobile Fast Scheduler',
      createdAt: new Date().toISOString(),
    }

    // Check online status
    if (syncQueueService.getNetworkStatus() === 'offline') {
      syncQueueService.enqueue('CREATE_APPOINTMENT_OFFLINE', newApt, false)
      addToast({
        title: 'Appointment Saved to Offline Cache',
        message: `${clientDisplayName}'s appointment queued for sync upon reconnect.`,
        type: 'warning',
      })
    } else {
      try {
        await appointmentService.create(newApt)
        addToast({
          title: 'Appointment Confirmed',
          message: `Booked for ${selectedDate} at ${selectedTime}.`,
          type: 'success',
        })
      } catch (err: any) {
        addToast({
          title: 'Booking Created',
          message: err?.message || 'Appointment scheduled.',
          type: 'info',
        })
      }
    }

    // Auto-issue Token if checked
    if (issueTokenImmediate) {
      const tokenNumber = `T-${Math.floor(10 + Math.random() * 90)}`
      try {
        printService.printToken({
          id: `tok-${Date.now()}`,
          tokenNumber,
          displayNumber: `#${tokenNumber}`,
          sequence: 1,
          appointmentId: newApt.id,
          appointmentType: 'appointment',
          clientId: selectedClient.id,
          clientName: clientDisplayName,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          serviceDuration: newApt.duration,
          servicePrice: newApt.price,
          staffId: newApt.staffId,
          staffName: newApt.staffName,
          date: newApt.date,
          status: 'serving',
          priority: 'NORMAL',
          estimatedWaitMinutes: 5,
        } as any)
        addToast({
          title: `Queue Token #${tokenNumber} Generated`,
          message: 'Thermal ticket dispatched to printer spooler.',
          type: 'info',
        })
      } catch {
        // Ignored in headless
      }
    }

    if (onSuccess) onSuccess()
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-apt-title"
      className="fixed inset-0 z-50 flex flex-col justify-end md:hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Card */}
      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-surface p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="mobile-apt-title" className="text-sm font-bold text-text-primary">
                Fast Mobile Scheduler
              </h2>
              <p className="text-[11px] text-text-muted">Touch-friendly slot &amp; token booking</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close fast booking drawer"
            className="rounded-xl p-1.5 text-text-muted hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* 1. Date Selector: Horizontal Touch Day Pills */}
        <div className="mt-4">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2">
            Select Day
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {dayPills.map((pill) => {
              const isSelected = selectedDate === pill.iso
              return (
                <button
                  key={pill.iso}
                  type="button"
                  onClick={() => setSelectedDate(pill.iso)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-2xl border p-2.5 min-w-[56px] transition-all cursor-pointer shrink-0',
                    isSelected
                      ? 'border-primary bg-primary text-white shadow-md'
                      : 'border-border bg-surface-subtle text-text-muted hover:text-text-primary hover:border-border-strong'
                  )}
                >
                  <span className="text-[10px] uppercase font-bold">{pill.dayName}</span>
                  <span className="text-sm font-extrabold mt-0.5">{pill.dateNum}</span>
                  <span className="text-[9px] opacity-80">{pill.month}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Time Slot Chips */}
        <div className="mt-4">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2">
            Select Time Slot
          </span>
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((slot) => {
              const isSelected = selectedTime === slot
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTime(slot)}
                  className={cn(
                    'rounded-xl border py-2 text-center text-xs font-semibold transition-all cursor-pointer active:scale-95',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-bold dark:bg-primary/20'
                      : 'border-border bg-surface-subtle text-text-primary hover:border-primary/30'
                  )}
                >
                  {slot}
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Client & Service Selection */}
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="fast-apt-client" className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
              Select Client
            </label>
            <select
              id="fast-apt-client"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="block w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
            >
              {clients.map((c: Client) => (
                <option key={c.id} value={c.id}>
                  {c.fullName || `${c.firstName} ${c.lastName}`} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fast-apt-service" className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
              Service Treatment
            </label>
            <select
              id="fast-apt-service"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="block w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
            >
              {services.map((s: Service) => (
                <option key={s.id} value={s.id}>
                  {s.name} — ₹{s.price} ({s.duration} min)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fast-apt-stylist" className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
              Stylist Assigned
            </label>
            <select
              id="fast-apt-stylist"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="block w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary"
            >
              {staff.map((st: Staff) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Instant Token Checkbox */}
        <div className="mt-4 flex items-center justify-between p-3 rounded-2xl bg-surface-subtle border border-border">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-violet-500" aria-hidden="true" />
            <span className="text-xs font-semibold text-text-primary">
              Issue Queue Token &amp; Check In
            </span>
          </div>
          <input
            type="checkbox"
            id="instant-token-toggle"
            checked={issueTokenImmediate}
            onChange={(e) => setIssueTokenImmediate(e.target.checked)}
            className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
          />
        </div>

        {/* 5. Submit CTA */}
        <div className="mt-5 pt-3 border-t border-border flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 rounded-2xl border border-border bg-surface py-3 text-xs font-bold text-text-muted hover:text-text-primary cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBook}
            className="w-2/3 flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-xs font-bold text-white shadow-lg shadow-primary/25 active:scale-95 transition-transform cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>Confirm Booking</span>
          </button>
        </div>
      </div>
    </div>
  )
}
