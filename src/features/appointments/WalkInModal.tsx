import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Ticket,
  Printer,
  Users,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { serviceService } from '@/services/serviceService'
import { staffService } from '@/services/staffService'
import { appointmentService } from '@/services/appointmentService'
import { Appointment, Service, Staff } from '@/types'
import { useToastStore } from '@/store/useToastStore'

interface WalkInModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newAppointment: Appointment) => void
}

export const WalkInModal: React.FC<WalkInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToastStore()
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      serviceService.getAll().then((s) => {
        setServices(s || [])
        if (s && s.length > 0 && !selectedServiceId) {
          setSelectedServiceId(s[0].id)
        }
      }).catch(() => {})

      staffService.getAll().then((st) => {
        setStaffList(st || [])
        if (st && st.length > 0 && !selectedStaffId) {
          setSelectedStaffId(st[0].id)
        }
      }).catch(() => {})
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim()) {
      addToast({
        title: 'Validation Error',
        message: 'Client name is required for walk-in queuing.',
        type: 'danger',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const service = services.find((s) => s.id === selectedServiceId) || services[0]
      const staff = staffList.find((s) => s.id === selectedStaffId) || staffList[0]
      if (!service) {
        addToast({
          title: 'Service Required',
          message: 'Please add services in the Services section before booking.',
          type: 'danger',
        })
        setIsSubmitting(false)
        return
      }
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const mins = Math.floor(now.getMinutes() / 15) * 15
      const startTime = `${hours}:${mins.toString().padStart(2, '0')}`
      const dateStr = now.toISOString().split('T')[0]

      const created = await appointmentService.create({
        clientId: `cli-walkin-${Date.now()}`,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || '(Walk-in Guest)',
        serviceId: service.id,
        serviceName: service.name,
        serviceDuration: service.duration,
        duration: service.duration,
        servicePrice: service.price,
        price: service.price,
        tax: Math.round(service.price * 0.18 * 10) / 10,
        totalAmount: Math.round(service.price * 1.18 * 10) / 10,
        staffId: staff.id,
        staffName: staff.name,
        staffAvatar: staff.avatarUrl,
        date: dateStr,
        startTime,
        endTime: `${hours}:${(mins + 45).toString().padStart(2, '0')}`,
        status: 'checked-in',
        paymentStatus: 'unpaid',
        queueStatus: 'waiting',
        notes: 'Walk-in client issued token ticket.',
      })

      onSuccess(created)
      addToast({
        title: 'Walk-in Ticket Issued',
        message: `Token ${created.tokenNumber || 'TK-101'} created for ${created.clientName}. Ready for Phase 2 Queue & POS.`,
        type: 'success',
      })
      onClose()
    } catch (err: any) {
      addToast({
        title: 'Error',
        message: err.message || 'Could not queue walk-in.',
        type: 'danger',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Walk-in Client"
      description="Quick walk-in queueing, token generation and instant station assignment."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Phase 2 Architecture Callout Banner */}
        <div className="p-3.5 rounded-xl border border-dashed border-primary/40 bg-primary/[0.03] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Sparkles className="h-4 w-4" />
            <span>Phase 2 Compatibility Preview</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Walk-in entries are assigned high-priority tokens (`tokenNumber`) and tagged as `checked-in` in the queue (`queueStatus: 'waiting'`). In Phase 2, this will directly trigger thermal token printing, kiosk self-checkin, and POS checkout without restructuring.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold text-text-muted">
            <span className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded border border-border">
              <Ticket className="h-3 w-3 text-primary" /> Token Slip
            </span>
            <span className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded border border-border">
              <Users className="h-3 w-3 text-emerald-600" /> Queue Display
            </span>
            <span className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded border border-border">
              <CreditCard className="h-3 w-3 text-cyan-600" /> POS Checkout
            </span>
          </div>
        </div>

        {/* Walk-in Form Fields */}
        <div className="space-y-3">
          <Input
            label="Client Name"
            placeholder="e.g. Johnathan Doe"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />

          <Input
            label="Phone Number (Optional)"
            type="tel"
            placeholder="e.g. (310) 555-0144"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="walkin-service-select" className="block text-xs font-medium text-text-secondary mb-1">
                Requested Treatment
              </label>
              <select
                id="walkin-service-select"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {services.length === 0 ? (
                  <option value="">No services added yet</option>
                ) : (
                  services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration}m - ₹{s.price})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label htmlFor="walkin-staff-select" className="block text-xs font-medium text-text-secondary mb-1">
                Assigned Specialist
              </label>
              <select
                id="walkin-staff-select"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {staffList.length === 0 ? (
                  <option value="">No staff added yet</option>
                ) : (
                  staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            className="shadow-glow-primary/30"
          >
            Queue Walk-in Client
          </Button>
        </div>
      </form>
    </Modal>
  )
}
