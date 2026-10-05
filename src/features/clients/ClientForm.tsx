import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Crown, Plus, X, Sparkles, MapPin, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Client, ClientGender, ClientStatus } from '@/types'
import { cn } from '@/utils/cn'

const clientFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number (min 10 digits)'),
  email: z.string().email('Please enter a valid email address'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['female', 'male', 'non-binary', 'other', 'prefer-not-to-say']),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
  isVip: z.boolean(),
  status: z.enum(['new', 'active', 'vip', 'inactive']),
})

export type ClientFormValues = z.infer<typeof clientFormSchema>

interface ClientFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (clientData: Partial<Client>) => Promise<void>
  initialData?: Client | null
  asDrawer?: boolean
}

export const ClientForm: React.FC<ClientFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  asDrawer = true,
}) => {
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditMode = Boolean(initialData)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      dateOfBirth: '',
      gender: 'female',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      notes: '',
      isVip: false,
      status: 'new',
    },
  })

  const watchIsVip = watch('isVip')

  useEffect(() => {
    if (initialData) {
      const address =
        typeof initialData.address === 'object' ? initialData.address : undefined
      reset({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        phone: initialData.phone,
        email: initialData.email,
        dateOfBirth: initialData.dateOfBirth || initialData.birthday || '',
        gender: (initialData.gender as ClientGender) || 'female',
        street: address?.street || '',
        city: address?.city || '',
        state: address?.state || '',
        postalCode: address?.postalCode || '',
        notes: initialData.notes || '',
        isVip: initialData.isVip || initialData.status === 'vip',
        status: initialData.status || 'active',
      })
      setTags(initialData.tags || [])
    } else {
      reset({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        dateOfBirth: '',
        gender: 'female',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        notes: '',
        isVip: false,
        status: 'new',
      })
      setTags([])
    }
  }, [initialData, reset, isOpen])

  const handleAddTag = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return
    if (e) e.preventDefault()
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const onFormSubmit = async (values: ClientFormValues) => {
    setIsSubmitting(true)
    try {
      const payload: Partial<Client> = {
        firstName: values.firstName,
        lastName: values.lastName,
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        phone: values.phone,
        email: values.email,
        dateOfBirth: values.dateOfBirth,
        birthday: values.dateOfBirth,
        gender: values.gender as ClientGender,
        notes: values.notes,
        status: values.isVip ? 'vip' : values.status,
        isVip: values.isVip,
        tags: tags.length ? tags : values.isVip ? ['VIP'] : ['General'],
        address: {
          street: values.street,
          city: values.city,
          state: values.state,
          postalCode: values.postalCode,
        },
      }
      await onSubmit(payload)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* 1. Basic Information */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Basic Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="e.g. +91 98201 44521"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. seraphina.l@gmail.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Date of Birth"
            type="date"
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />
          <Select
            label="Gender"
            options={[
              { value: 'female', label: 'Female' },
              { value: 'male', label: 'Male' },
              { value: 'non-binary', label: 'Non-binary' },
              { value: 'other', label: 'Other' },
              { value: 'prefer-not-to-say', label: 'Prefer not to say' },
            ]}
            error={errors.gender?.message}
            {...register('gender')}
          />
        </div>
      </div>

      {/* 2. VIP Toggle and Status */}
      <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-accent-50 text-accent flex items-center justify-center">
              <Crown className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-bold text-text-primary block">
                VIP Membership Status
              </span>
              <span className="text-[11px] text-text-muted block">
                Grants high-priority booking & signature concierge service
              </span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={watchIsVip}
              onChange={(e) => {
                setValue('isVip', e.target.checked)
                if (e.target.checked) setValue('status', 'vip')
              }}
            />
            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
          </label>
        </div>

        {!watchIsVip && (
          <div className="pt-2 border-t border-border/60">
            <Select
              label="Client Record Status"
              options={[
                { value: 'new', label: 'New Client' },
                { value: 'active', label: 'Active Patron' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              {...register('status')}
            />
          </div>
        )}
      </div>

      {/* 3. Address Details */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider">
          <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>Postal & Residence Address</span>
        </div>

        <Input
          label="Street Address / Residence"
          placeholder="e.g. Flat 402, Sea Green Apartments, Bandra West"
          {...register('street')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="City" placeholder="e.g. Mumbai" {...register('city')} />
          <Input label="State" placeholder="e.g. Maharashtra" {...register('state')} />
          <Input label="PIN / Postal Code" placeholder="e.g. 400050" {...register('postalCode')} />
        </div>
      </div>

      {/* 4. Tags & Preferences */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
          Tags & Preferences
        </label>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Add tag (e.g. Sensitive Scalp, Bridal) and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
          />
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleAddTag}
            disabled={!tagInput.trim()}
          >
            Add
          </Button>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary dark:bg-primary-950/60 dark:text-primary-300 border border-primary/20"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-danger"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 5. Stylist / Internal Salon Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
          Private Stylist & Formula Notes
        </label>
        <textarea
          rows={3}
          placeholder="Client preferences, hair/skin sensitivity, favorite beverage, allergy warnings…"
          className="w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
          {...register('notes')}
        />
      </div>

      {/* Submit / Cancel Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
        <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          leftIcon={<Check className="h-4 w-4" />}
        >
          {isEditMode ? 'Update Client Profile' : 'Save New Client'}
        </Button>
      </div>
    </form>
  )

  if (asDrawer) {
    return (
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={isEditMode ? 'Edit Client Profile' : 'Add New Client'}
        description={
          isEditMode
            ? `Update details and service notes for ${initialData?.fullName}`
            : 'Register a new patron to the SALORA salon database.'
        }
        size="lg"
      >
        {formContent}
      </Drawer>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Client Profile' : 'Add New Client'}
      description={
        isEditMode
          ? `Update details and service notes for ${initialData?.fullName}`
          : 'Register a new patron to the SALORA salon database.'
      }
      size="lg"
    >
      {formContent}
    </Modal>
  )
}
