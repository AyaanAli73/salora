import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Staff, StaffRole, Service } from '@/types'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToastStore } from '@/store/useToastStore'
import { serviceService } from '@/services/serviceService'

const staffRoles: StaffRole[] = [
  'Master Stylist',
  'Senior Colorist',
  'Nail Artist',
  'Esthetician',
  'Massage Therapist',
  'Salon Manager',
]

const weekDays = [
  { id: 'Mon', label: 'Mon' },
  { id: 'Tue', label: 'Tue' },
  { id: 'Wed', label: 'Wed' },
  { id: 'Thu', label: 'Thu' },
  { id: 'Fri', label: 'Fri' },
  { id: 'Sat', label: 'Sat' },
  { id: 'Sun', label: 'Sun' },
]

const staffFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(6, 'Valid phone number required'),
  email: z.string().email('Valid email address required'),
  avatarUrl: z.string().optional(),
  role: z.string().min(1, 'Please select a role'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  status: z.enum(['available', 'busy', 'on-leave', 'off-duty']),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  breakStart: z.string().min(1, 'Break start time is required'),
  breakEnd: z.string().min(1, 'Break end time is required'),
  commissionRate: z.number().min(0).max(100),
  hourlyRate: z.number().min(0).optional(),
  specialties: z.string().optional(),
  bio: z.string().optional(),
})

type StaffFormData = z.infer<typeof staffFormSchema>

interface StaffFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (savedStaff: Staff) => void
  initialStaff?: Staff | null
}

export const StaffForm: React.FC<StaffFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialStaff,
}) => {
  const { addToast } = useToastStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableServices, setAvailableServices] = useState<Service[]>([])
  const [selectedDays, setSelectedDays] = useState<string[]>(
    initialStaff?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  )
  const [selectedServices, setSelectedServices] = useState<string[]>(
    initialStaff?.serviceIds || []
  )

  useEffect(() => {
    serviceService.getAll().then((list) => {
      setAvailableServices(list)
    })
  }, [])

  const defaultStatus: 'available' | 'busy' | 'on-leave' | 'off-duty' = 
    initialStaff?.todayStatus || (initialStaff?.status === 'on-leave' ? 'on-leave' : initialStaff?.status === 'off-duty' ? 'off-duty' : 'available')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: initialStaff?.name || '',
      phone: initialStaff?.phone || '',
      email: initialStaff?.email || '',
      avatarUrl: initialStaff?.avatarUrl || '',
      role: initialStaff?.role || 'Master Stylist',
      joiningDate: initialStaff?.joiningDate || new Date().toISOString().split('T')[0],
      status: defaultStatus,
      startTime: initialStaff?.startTime || '09:00',
      endTime: initialStaff?.endTime || '18:00',
      breakStart: initialStaff?.breakTime?.startTime || '13:00',
      breakEnd: initialStaff?.breakTime?.endTime || '14:00',
      commissionRate: initialStaff?.commissionRate ?? 50,
      hourlyRate: initialStaff?.hourlyRate ?? 80,
      specialties: initialStaff?.specialties?.join(', ') || '',
      bio: initialStaff?.bio || '',
    },
  })

  // Toggle working day
  const toggleDay = (dayId: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    )
  }

  // Toggle assigned service
  const toggleService = (srvId: string) => {
    setSelectedServices((prev) =>
      prev.includes(srvId) ? prev.filter((id) => id !== srvId) : [...prev, srvId]
    )
  }

  const onSubmit = async (data: StaffFormData) => {
    if (selectedDays.length === 0) {
      addToast({
        title: 'Validation Error',
        message: 'Please select at least one working day.',
        type: 'danger',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const specs = data.specialties
        ? data.specialties.split(',').map((s) => s.trim()).filter(Boolean)
        : ['Signature Styling', 'Consultation']

      const assignedServiceNames = availableServices
        .filter((s) => selectedServices.includes(s.id))
        .map((s) => s.name)

      const weeklySchedule = weekDays.map((wd) => ({
        day: wd.id,
        isWorking: selectedDays.includes(wd.id),
        startTime: data.startTime,
        endTime: data.endTime,
        breakTime: {
          name: 'Lunch Break',
          startTime: data.breakStart,
          endTime: data.breakEnd,
        },
      }))

      const staffPayload: Staff = {
        id: initialStaff?.id || `staff-${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatarUrl:
          data.avatarUrl ||
          `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150&auto=format&fit=crop&q=80`,
        role: data.role as StaffRole,
        specialties: specs.length ? specs : ['Expert Styling'],
        serviceIds: selectedServices,
        services: assignedServiceNames,
        rating: initialStaff?.rating || 5.0,
        reviewCount: initialStaff?.reviewCount || 0,
        hourlyRate: data.hourlyRate,
        commissionRate: data.commissionRate,
        status: data.status,
        todayStatus: data.status,
        appointmentsToday: initialStaff?.appointmentsToday || 0,
        joiningDate: data.joiningDate,
        workingDays: selectedDays,
        startTime: data.startTime,
        endTime: data.endTime,
        breakTime: {
          name: 'Lunch Break',
          startTime: data.breakStart,
          endTime: data.breakEnd,
        },
        bio: data.bio,
        weeklySchedule,
        monthlyRevenue: initialStaff?.monthlyRevenue || 0,
        appointmentsCompleted: initialStaff?.appointmentsCompleted || 0,
      }

      onSuccess(staffPayload)
      addToast({
        title: initialStaff ? 'Specialist Updated' : 'Specialist Added',
        message: `${staffPayload.name} has been successfully saved.`,
        type: 'success',
      })
      onClose()
    } catch {
      addToast({
        title: 'Error',
        message: 'Failed to save specialist profile.',
        type: 'danger',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={initialStaff ? 'Edit Staff Specialist' : 'Add Staff Specialist'}
      description="Configure stylist profile, specialties, weekly roster, and active services."
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="staff-details-form"
            variant="primary"
            isLoading={isSubmitting}
          >
            {initialStaff ? 'Save Changes' : 'Add Specialist'}
          </Button>
        </div>
      }
    >
      <form
        id="staff-details-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 pb-6"
      >
        {/* Personal & Contact Information */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Personal & Contact Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. Camille Dupré"
              error={errors.name?.message}
              {...register('name')}
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="e.g. +91 98200 12345"
              error={errors.phone?.message}
              {...register('phone')}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. camille@salora.com"
              error={errors.email?.message}
              {...register('email')}
              required
            />
            <Input
              label="Joining Date"
              type="date"
              error={errors.joiningDate?.message}
              {...register('joiningDate')}
              required
            />
          </div>

          <Input
            label="Photo URL (Optional)"
            placeholder="https://images.unsplash.com/..."
            error={errors.avatarUrl?.message}
            {...register('avatarUrl')}
          />
        </div>

        {/* Role & Status */}
        <div className="space-y-4 pt-2 border-t border-border">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Role, Rates & Status
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="staff-role-select" className="block text-xs font-medium text-text-secondary mb-1.5">
                Staff Role <span className="text-danger">*</span>
              </label>
              <select
                id="staff-role-select"
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                {...register('role')}
              >
                {staffRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="staff-status-select" className="block text-xs font-medium text-text-secondary mb-1.5">
                Status <span className="text-danger">*</span>
              </label>
              <select
                id="staff-status-select"
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                {...register('status')}
              >
                <option value="available">Available (On Duty)</option>
                <option value="busy">Busy (In Session)</option>
                <option value="on-leave">On Leave</option>
                <option value="off-duty">Off Duty</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Commission Rate (%)"
              type="number"
              placeholder="50"
              error={errors.commissionRate?.message}
              {...register('commissionRate', { valueAsNumber: true })}
            />
            <Input
              label="Hourly Rate (₹)"
              type="number"
              placeholder="80"
              error={errors.hourlyRate?.message}
              {...register('hourlyRate', { valueAsNumber: true })}
            />
          </div>

          <Input
            label="Specialties (Comma Separated)"
            placeholder="e.g. Balayage, Precision Cut, Silk Blowouts"
            error={errors.specialties?.message}
            {...register('specialties')}
          />
        </div>

        {/* Schedule & Working Hours */}
        <div className="space-y-4 pt-2 border-t border-border">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Working Schedule & Daily Break
          </h2>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Working Days
            </label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((wd) => {
                const isSelected = selectedDays.includes(wd.id)
                return (
                  <button
                    key={wd.id}
                    type="button"
                    onClick={() => toggleDay(wd.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isSelected
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface-subtle text-text-secondary border border-border hover:bg-surface-hover'
                    }`}
                  >
                    {wd.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Shift Start Time"
              type="time"
              error={errors.startTime?.message}
              {...register('startTime')}
              required
            />
            <Input
              label="Shift End Time"
              type="time"
              error={errors.endTime?.message}
              {...register('endTime')}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Break Start Time"
              type="time"
              error={errors.breakStart?.message}
              {...register('breakStart')}
              required
            />
            <Input
              label="Break End Time"
              type="time"
              error={errors.breakEnd?.message}
              {...register('breakEnd')}
              required
            />
          </div>
        </div>

        {/* Services Multi-Select */}
        <div className="space-y-4 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Assigned Services ({selectedServices.length} selected)
            </h2>
            {availableServices.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (selectedServices.length === availableServices.length) {
                    setSelectedServices([])
                  } else {
                    setSelectedServices(availableServices.map((s) => s.id))
                  }
                }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {selectedServices.length === availableServices.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {availableServices.length === 0 ? (
            <p className="text-xs text-text-muted py-2">
              No services created in salon menu yet. You can add services under Services &amp; Treatments.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {availableServices.map((service) => {
                const checked = selectedServices.includes(service.id)
                return (
                  <label
                    key={service.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      checked
                        ? 'border-primary/50 bg-primary/5 text-text-primary'
                        : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(service.id)}
                      className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-text-primary truncate">{service.name}</span>
                      <span className="text-[11px] text-text-muted">
                        {service.categoryName} • {service.duration} mins • ₹{service.price}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </form>
    </Drawer>
  )
}
