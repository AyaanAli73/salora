import React, { useState, useEffect, useMemo } from 'react'
import { Appointment, Client, Service, Staff, BookingSource, Token } from '@/types'
import { clientService } from '@/services/clientService'
import { serviceService } from '@/services/serviceService'
import { staffService } from '@/services/staffService'
import { appointmentService } from '@/services/appointmentService'
import { useToastStore } from '@/store/useToastStore'
import { useQueueStore } from '@/store/useQueueStore'
import { ClientCombobox } from './ClientCombobox'
import { QuickClientCreateModal } from './QuickClientCreateModal'
import { ServiceCombobox } from './ServiceCombobox'
import { StaffSelector } from './StaffSelector'
import { TimeSlotSelector } from './TimeSlotSelector'
import { AppointmentSummary } from './AppointmentSummary'
import { calculateEndTime, formatTime12Hour } from '@/utils/availability'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'
import {
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  Ticket,
  Plus,
} from 'lucide-react'

interface QuickAppointmentFormProps {
  onSuccess?: (newAppointment: Appointment) => void
  onCancel?: () => void
  initialDate?: string
  initialStaffId?: string
  initialClientId?: string
  isModal?: boolean
  className?: string
}

export const QuickAppointmentForm: React.FC<QuickAppointmentFormProps> = ({
  onSuccess,
  onCancel,
  initialDate,
  initialStaffId,
  initialClientId,
  isModal = false,
  className = '',
}) => {
  const { addToast } = useToastStore()
  const { checkInAppointment } = useQueueStore()

  // Form State
  const [client, setClient] = useState<Client | null>(null)
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false)

  const [service, setService] = useState<Service | null>(null)
  const [services, setServices] = useState<Service[]>([])

  const [staffId, setStaffId] = useState<string>(initialStaffId || 'any')
  const [staffList, setStaffList] = useState<Staff[]>([])

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const [date, setDate] = useState<string>(initialDate || todayStr)
  const [time, setTime] = useState<string>('')

  // Derive calculated end time directly from selected time and service duration
  const calculatedEndTime = useMemo(() => {
    if (!time || !service) return ''
    return calculateEndTime(time, service.duration || 45)
  }, [time, service])

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [bookingSource, setBookingSource] = useState<BookingSource>('ADMIN')

  // Optional "More Details"
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [notes, setNotes] = useState('')
  const [customerRequest, setCustomerRequest] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [generateToken, setGenerateToken] = useState(false)

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null)
  const [createdToken, setCreatedToken] = useState<Token | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load Initial Reference Data
  useEffect(() => {
    let isMounted = true
    Promise.all([
      clientService.getAll(),
      serviceService.getAll(),
      staffService.getAll(),
      appointmentService.getAll(),
    ]).then(([cl, sv, st, ap]) => {
      if (!isMounted) return
      setServices(sv)
      setStaffList(st)
      setAppointments(ap)

      // Set initial service if none selected
      if (sv.length > 0) {
        setService((prev) => prev || sv[0])
      }

      // Set initial client if provided
      if (initialClientId) {
        const found = cl.find((c) => c.id === initialClientId)
        if (found) setClient(found)
      }
    })

    return () => {
      isMounted = false
    }
  }, [initialClientId])

  const handleBookingSourceChange = (src: BookingSource) => {
    setBookingSource(src)
    if (src === 'WALK_IN' && date === todayStr) {
      setGenerateToken(true)
    }
  }

  // Escape key closes modal if in modal mode and inline client modal is not open
  useEffect(() => {
    if (!isModal || !onCancel) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isNewClientModalOpen) {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModal, onCancel, isNewClientModalOpen])

  // Handle new client creation completion
  const handleClientCreated = (newClient: Client) => {
    setClient(newClient)
    if (errors.client) setErrors((prev) => ({ ...prev, client: '' }))
  }

  // Handle service change
  const handleServiceChange = (selected: Service) => {
    setService(selected)
    if (errors.service) setErrors((prev) => ({ ...prev, service: '' }))
  }

  // Handle time slot selection
  const handleTimeSelect = (slotTime: string) => {
    setTime(slotTime)
    if (errors.time) setErrors((prev) => ({ ...prev, time: '' }))
  }

  // Validation
  const validate = () => {
    const errs: Record<string, string> = {}
    if (!client) errs.client = 'Please select or create a customer.'
    if (!service) errs.service = 'Please select a service.'
    if (!time) errs.time = 'Please select an available time slot.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Submit appointment creation
  const handleBookAppointment = async () => {
    if (!validate() || !client || !service || !time) {
      addToast({
        title: 'Missing Required Fields',
        message: 'Please select a customer, service, and available time slot.',
        type: 'danger',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const duration = service.duration || 45
      const calculatedEnd = calculatedEndTime || calculateEndTime(time, duration)

      // Resolve staff if "any" was selected
      let assignedStaffId = staffId
      let assignedStaffName = 'Any Available Stylist'
      let assignedStaffAvatar: string | undefined = undefined

      if (staffId === 'any') {
        const availableStaff = staffList.find(
          (s) => s.status === 'available' || s.status === 'active' || !s.status
        ) || staffList[0]
        if (availableStaff) {
          assignedStaffId = availableStaff.id
          assignedStaffName = availableStaff.name
          assignedStaffAvatar = availableStaff.avatarUrl
        }
      } else {
        const found = staffList.find((s) => s.id === staffId)
        if (found) {
          assignedStaffName = found.name
          assignedStaffAvatar = found.avatarUrl
        }
      }

      const basePrice = service.price || 0
      const tax = Math.round(basePrice * 0.18 * 10) / 10
      const totalAmount = Math.round((basePrice + tax) * 10) / 10

      const newAppt = await appointmentService.create({
        clientId: client.id,
        clientName: client.fullName,
        clientPhone: client.phone,
        clientAvatar: client.avatarUrl,
        serviceId: service.id,
        serviceName: service.name,
        serviceDuration: duration,
        duration,
        servicePrice: basePrice,
        price: basePrice,
        discount: 0,
        tax,
        totalAmount,
        staffId: assignedStaffId,
        staffName: assignedStaffName,
        staffAvatar: assignedStaffAvatar,
        date,
        startTime: time,
        endTime: calculatedEnd,
        status: bookingSource === 'WALK_IN' ? 'checked-in' : 'confirmed',
        paymentStatus: 'unpaid',
        bookingSource,
        notes: notes.trim() || undefined,
        customerRequest: customerRequest.trim() || undefined,
        internalNote: internalNote.trim() || undefined,
      })

      // Phase 2 Token Functionality: Generate live queue token if requested or walk-in
      let tokenResult: Token | null = null
      if (generateToken && (bookingSource === 'WALK_IN' || date === todayStr)) {
        try {
          tokenResult = await checkInAppointment(newAppt)
        } catch (tokenErr) {
          console.warn('Queue token generation skipped:', tokenErr)
        }
      }

      // Success toast adhering to requirement 13
      addToast({
        title: 'Appointment booked successfully.',
        message: `ID: ${newAppt.appointmentId || newAppt.id} | ${newAppt.clientName} for ${newAppt.serviceName} with ${newAppt.staffName} on ${formatDate(newAppt.date)} at ${formatTime12Hour(newAppt.startTime)}.`,
        type: 'success',
      })

      setCreatedAppointment(newAppt)
      setCreatedToken(tokenResult)

      if (onSuccess) {
        onSuccess(newAppt)
      }
    } catch (err: any) {
      addToast({
        title: 'Booking Conflict',
        message: err.message || 'Unable to schedule appointment. Please try a different slot.',
        type: 'danger',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form for next booking
  const handleResetForNext = () => {
    setCreatedAppointment(null)
    setCreatedToken(null)
    setClient(null)
    setTime('')
    setNotes('')
    setCustomerRequest('')
    setInternalNote('')
    setGenerateToken(false)
    setErrors({})
    // Reload latest appointments to ensure slots reflect newly booked item
    appointmentService.getAll().then((ap) => setAppointments(ap))
  }

  // SUCCESS SCREEN
  if (createdAppointment) {
    return (
      <div className="p-6 rounded-2xl border border-primary/20 bg-surface shadow-xl space-y-6 text-center max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-success/15 text-success flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-text-primary">Appointment Booked Successfully</h2>
          <p className="text-xs text-text-muted">
            The booking has been scheduled and synchronized across the salon schedule.
          </p>
        </div>

        {/* Detailed Appointment Card */}
        <div className="p-4 rounded-xl bg-surface-hover/60 border border-border text-left space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-text-muted">Appointment ID:</span>
            <span className="font-mono font-bold text-primary">
              {createdAppointment.appointmentId || createdAppointment.id}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Client:</span>
            <span className="font-semibold text-text-primary">
              {createdAppointment.clientName} ({createdAppointment.clientPhone})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Service:</span>
            <span className="font-semibold text-text-primary">{createdAppointment.serviceName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Staff:</span>
            <span className="font-semibold text-text-primary">{createdAppointment.staffName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Date & Time:</span>
            <span className="font-semibold text-text-primary font-mono tabular-nums">
              {formatDate(createdAppointment.date)} at {formatTime12Hour(createdAppointment.startTime)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-text-muted">Total Price:</span>
            <span className="font-bold text-text-primary tabular-nums">
              {formatCurrency(createdAppointment.totalAmount, 'INR')}
            </span>
          </div>

          {createdToken && (
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between text-xs mt-2">
              <span className="text-primary font-medium flex items-center gap-1.5">
                <Ticket className="h-4 w-4" />
                Live Queue Token Issued:
              </span>
              <span className="font-mono font-extrabold text-primary text-sm">
                #{createdToken.displayNumber}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetForNext}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Book Another Appointment
          </Button>
          {onCancel && (
            <Button type="button" variant="primary" onClick={onCancel}>
              Done
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* STEP 1: CUSTOMER COMBICOMBOBOX + INLINE MODAL */}
      <ClientCombobox
        selectedClient={client}
        onSelectClient={(c) => {
          setClient(c)
          if (errors.client) setErrors((prev) => ({ ...prev, client: '' }))
        }}
        onOpenNewClientModal={() => setIsNewClientModalOpen(true)}
        autoFocus={!client}
        error={errors.client}
      />

      {/* STEP 2: SERVICE COMBICOMBOBOX */}
      <ServiceCombobox
        selectedServiceId={service?.id || ''}
        onSelectService={handleServiceChange}
        services={services}
        error={errors.service}
      />

      {/* STEP 3: STAFF SELECTOR */}
      <StaffSelector
        selectedStaffId={staffId}
        onSelectStaff={(id) => setStaffId(id)}
        staffList={staffList}
        selectedDate={date}
        error={errors.staff}
      />

      {/* STEP 4: DATE & TIME SELECTOR */}
      <TimeSlotSelector
        selectedDate={date}
        onDateChange={(d) => {
          setDate(d)
          setTime('')
        }}
        selectedTime={time}
        onSelectTime={handleTimeSelect}
        staffId={staffId}
        staffList={staffList}
        service={service}
        appointments={appointments}
        error={errors.time}
      />

      {/* STEP 5: OPTIONAL "MORE DETAILS" SECTION */}
      <div className="border border-border rounded-xl bg-surface/40 overflow-hidden transition-colors">
        <button
          type="button"
          onClick={() => setShowMoreDetails(!showMoreDetails)}
          className="w-full p-3 flex items-center justify-between text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-text-muted" />
            More Details (Optional: Notes, Booking Source, Customer Request)
          </span>
          {showMoreDetails ? (
            <ChevronUp className="h-4 w-4 text-text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-muted" />
          )}
        </button>

        {showMoreDetails && (
          <div className="p-3.5 pt-1 space-y-3.5 border-t border-border animate-in fade-in duration-150">
            {/* Booking Source Options: ADMIN (default), PHONE, ONLINE, WALK_IN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="booking-source-select"
                  className="block text-xs font-semibold text-text-secondary mb-1"
                >
                  Booking Source
                </label>
                <select
                  id="booking-source-select"
                  value={bookingSource}
                  onChange={(e) => handleBookingSourceChange(e.target.value as BookingSource)}
                  className="w-full h-9 px-2.5 rounded-lg border border-border bg-surface text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="ADMIN">ADMIN (Reception Desk)</option>
                  <option value="PHONE">PHONE (Call Booking)</option>
                  <option value="ONLINE">ONLINE (Web / App)</option>
                  <option value="WALK_IN">WALK_IN (In-Salon Arrival)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="customer-request-input"
                  className="block text-xs font-semibold text-text-secondary mb-1"
                >
                  Customer Request / Style
                </label>
                <input
                  id="customer-request-input"
                  type="text"
                  value={customerRequest}
                  onChange={(e) => setCustomerRequest(e.target.value)}
                  placeholder="e.g. As seen on Instagram, trim ends only…"
                  className="w-full h-9 px-2.5 rounded-lg border border-border bg-surface text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Appointment Notes & Internal Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="appointment-notes"
                  className="block text-xs font-semibold text-text-secondary mb-1"
                >
                  Client Visible Notes
                </label>
                <textarea
                  id="appointment-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions, styling preferences…"
                  className="w-full p-2 rounded-lg border border-border bg-surface text-xs text-text-primary resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="internal-notes"
                  className="block text-xs font-semibold text-text-secondary mb-1"
                >
                  Internal Staff Note
                </label>
                <textarea
                  id="internal-notes"
                  rows={2}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Front desk remarks, allergy alert, VIP alert…"
                  className="w-full p-2 rounded-lg border border-border bg-surface text-xs text-text-primary resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 6: APPOINTMENT SUMMARY + QUICK BOOK BUTTON */}
      <AppointmentSummary
        client={client}
        service={service}
        staff={staffList.find((s) => s.id === staffId) || null}
        staffId={staffId}
        date={date}
        time={time}
        duration={service?.duration || 45}
        price={service?.price || 0}
        bookingSource={bookingSource}
        generateToken={generateToken}
        onToggleGenerateToken={(val) => setGenerateToken(val)}
        isSubmitting={isSubmitting}
        onBook={handleBookAppointment}
      />

      {/* COMPACT INLINE MODAL FOR + NEW CLIENT (DO NOT NAVIGATE AWAY) */}
      <QuickClientCreateModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onClientCreated={handleClientCreated}
      />
    </div>
  )
}
