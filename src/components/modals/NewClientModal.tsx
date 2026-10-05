import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useUIStore } from '@/store/useUIStore'
import { useToastStore } from '@/store/useToastStore'
import { clientService } from '@/services/clientService'

const clientSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  status: z.enum(['new', 'active', 'vip', 'inactive']),
  notes: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

export const NewClientModal: React.FC = () => {
  const { isNewClientModalOpen, closeNewClientModal } = useUIStore()
  const { addToast } = useToastStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      status: 'new',
      notes: '',
    },
  })

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true)
    try {
      const client = await clientService.create({
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        status: data.status,
        tags: [data.status === 'vip' ? 'VIP' : 'New Client'],
        notes: data.notes,
      })

      addToast({
        title: 'Client Profile Created',
        message: `${client.fullName} has been added to your client book.`,
        type: 'success',
      })

      reset()
      closeNewClientModal()
    } catch {
      addToast({
        title: 'Creation Failed',
        message: 'Unable to create client. Please try again.',
        type: 'danger',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isNewClientModalOpen}
      onClose={closeNewClientModal}
      title="Add New Client"
      description="Create a client record with contact details and preferences."
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="e.g. Seraphina"
            error={errors.firstName?.message}
            {...register('firstName')}
          />

          <Input
            label="Last Name"
            placeholder="e.g. Laurent"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="email"
            label="Email Address"
            placeholder="client@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            type="tel"
            label="Phone Number"
            placeholder="(310) 555-0100"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <Select
          label="Client Tier / Status"
          error={errors.status?.message}
          {...register('status')}
          options={[
            { value: 'new', label: 'New Client' },
            { value: 'active', label: 'Active Regular' },
            { value: 'vip', label: 'VIP Client' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />

        <Input
          label="Allergies / Scalp Notes / Preferences (Optional)"
          placeholder="e.g. Prefers sparkling water, sensitive to ammonia…"
          {...register('notes')}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={closeNewClientModal}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            Save Client
          </Button>
        </div>
      </form>
    </Modal>
  )
}
