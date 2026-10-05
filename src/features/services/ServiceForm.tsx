import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Users,
  Clock,
  Sparkles,
  IndianRupee,
  ShieldCheck,
  Globe,
  Scissors,
} from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { Service, ServiceCategoryType, Staff } from '@/types'
import { staffService } from '@/services/staffService'
import { cn } from '@/utils/cn'

const serviceSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  categoryName: z.enum([
    'Hair',
    'Skin',
    'Nails',
    'Makeup',
    'Spa',
    'Beard',
    'Bridal',
    'Packages',
  ]),
  description: z.string().min(5, 'Please provide a short description of the treatment'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  discountPrice: z.coerce.number().optional(),
  duration: z.coerce.number().min(5, 'Duration must be at least 5 minutes'),
  bufferTime: z.coerce.number().min(0, 'Buffer time cannot be negative'),
  taxRate: z.coerce.number().min(0, 'Tax rate cannot be negative'),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean(),
  isOnlineBookingEnabled: z.boolean(),
  requireDeposit: z.boolean(),
  depositAmount: z.coerce.number().optional(),
  allowWalkIns: z.boolean(),
  showOnWebsite: z.boolean(),
})

export type ServiceFormData = z.infer<typeof serviceSchema>

interface ServiceFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<Service>) => Promise<void>
  initialData?: Service | null
}

const PRESET_IMAGES = [
  { label: 'Hair Cut & Styling', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop&q=80' },
  { label: 'Balayage & Color', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80' },
  { label: 'Skin & Facial', url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80' },
  { label: 'Nails & Manicure', url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500&auto=format&fit=crop&q=80' },
  { label: 'Bridal Glamour', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&auto=format&fit=crop&q=80' },
  { label: 'Beard Sculpting', url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop&q=80' },
]

export const ServiceForm: React.FC<ServiceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEditMode = Boolean(initialData)

  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [previewImage, setPreviewImage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      categoryName: 'Hair',
      description: '',
      price: 499,
      discountPrice: undefined,
      duration: 45,
      bufferTime: 10,
      taxRate: 18,
      commissionRate: 40,
      imageUrl: '',
      isActive: true,
      isOnlineBookingEnabled: true,
      requireDeposit: false,
      depositAmount: 0,
      allowWalkIns: true,
      showOnWebsite: true,
    },
  })

  const watchRequireDeposit = watch('requireDeposit')
  const watchImageUrl = watch('imageUrl')

  // Fetch staff list for assignment
  useEffect(() => {
    staffService.getAll().then((data) => setStaffList(data))
  }, [])

  // Sync initialData
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        categoryName: initialData.categoryName,
        description: initialData.description,
        price: initialData.price,
        discountPrice: initialData.discountPrice,
        duration: initialData.duration,
        bufferTime: initialData.bufferTime || 10,
        taxRate: initialData.taxRate || 18,
        commissionRate: initialData.commissionRate || 40,
        imageUrl: initialData.imageUrl || '',
        isActive: initialData.isActive,
        isOnlineBookingEnabled: initialData.isOnlineBookingEnabled,
        requireDeposit: initialData.requireDeposit,
        depositAmount: initialData.depositAmount || 0,
        allowWalkIns: initialData.allowWalkIns,
        showOnWebsite: initialData.showOnWebsite,
      })
      setSelectedStaffIds(initialData.assignedStaffIds || [])
      setPreviewImage(initialData.imageUrl || '')
    } else {
      reset({
        name: '',
        categoryName: 'Hair',
        description: '',
        price: 499,
        discountPrice: undefined,
        duration: 45,
        bufferTime: 10,
        taxRate: 18,
        commissionRate: 40,
        imageUrl: PRESET_IMAGES[0].url,
        isActive: true,
        isOnlineBookingEnabled: true,
        requireDeposit: false,
        depositAmount: 0,
        allowWalkIns: true,
        showOnWebsite: true,
      })
      setSelectedStaffIds(['staff-1', 'staff-2'])
      setPreviewImage(PRESET_IMAGES[0].url)
    }
  }, [initialData, reset, isOpen])

  const toggleStaff = (id: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectPresetImage = (url: string) => {
    setValue('imageUrl', url)
    setPreviewImage(url)
  }

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const simulatedUrl = URL.createObjectURL(file)
      setValue('imageUrl', simulatedUrl)
      setPreviewImage(simulatedUrl)
    }
  }

  const onFormSubmit = async (values: ServiceFormData) => {
    setIsSubmitting(true)
    try {
      const payload: Partial<Service> = {
        name: values.name,
        categoryName: values.categoryName as ServiceCategoryType,
        description: values.description,
        price: values.price,
        discountPrice: values.discountPrice ? Number(values.discountPrice) : undefined,
        duration: values.duration,
        bufferTime: values.bufferTime,
        taxRate: values.taxRate,
        commissionRate: values.commissionRate,
        imageUrl: previewImage || values.imageUrl,
        assignedStaffIds: selectedStaffIds.length ? selectedStaffIds : ['staff-1'],
        isActive: values.isActive,
        isOnlineBookingEnabled: values.isOnlineBookingEnabled,
        requireDeposit: values.requireDeposit,
        depositAmount: values.depositAmount,
        allowWalkIns: values.allowWalkIns,
        showOnWebsite: values.showOnWebsite,
      }

      await onSubmit(payload)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Salon Service' : 'Add New Salon Service'}
      description={
        isEditMode
          ? `Modify treatment parameters, pricing, and assigned staff for ${initialData?.name}`
          : 'Define a new service, set duration, assign specialists, and configure booking rules.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* 1. Basic Service Information */}
        <div className="space-y-3.5">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            General Information
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Service Name *"
              placeholder="e.g. Hair Cut"
              error={errors.name?.message}
              {...register('name')}
            />

            <Select
              label="Category *"
              options={[
                { value: 'Hair', label: 'Hair' },
                { value: 'Skin', label: 'Skin' },
                { value: 'Nails', label: 'Nails' },
                { value: 'Makeup', label: 'Makeup' },
                { value: 'Spa', label: 'Spa' },
                { value: 'Beard', label: 'Beard' },
                { value: 'Bridal', label: 'Bridal' },
                { value: 'Packages', label: 'Packages' },
              ]}
              error={errors.categoryName?.message}
              {...register('categoryName')}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
              Description *
            </label>
            <textarea
              rows={3}
              placeholder="Detailed treatment description, steps, and guest benefits…"
              className="w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-[11px] text-danger">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* 2. Pricing & Duration Grid */}
        <div className="space-y-3.5">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Pricing, Timing & Tax
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              label="Standard Price (₹) *"
              type="number"
              placeholder="499"
              error={errors.price?.message}
              {...register('price')}
            />

            <Input
              label="Discount Price (₹)"
              type="number"
              placeholder="449"
              error={errors.discountPrice?.message}
              {...register('discountPrice')}
            />

            <Input
              label="Duration (minutes) *"
              type="number"
              placeholder="45"
              error={errors.duration?.message}
              {...register('duration')}
            />

            <Input
              label="Buffer Time (min)"
              type="number"
              placeholder="10"
              error={errors.bufferTime?.message}
              {...register('bufferTime')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="GST / Tax Rate (%)"
              type="number"
              placeholder="18"
              error={errors.taxRate?.message}
              {...register('taxRate')}
            />

            <Input
              label="Staff Commission Rate (%)"
              type="number"
              placeholder="40"
              error={errors.commissionRate?.message}
              {...register('commissionRate')}
            />
          </div>
        </div>

        {/* 3. Image Upload & Selection */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Service Image
          </h4>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Live Preview */}
            <div className="h-28 w-36 rounded-2xl overflow-hidden border border-border bg-surface-subtle shrink-0 relative group">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-text-muted">
                  <ImageIcon className="h-8 w-8" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Upload & Preset Options */}
            <div className="flex-1 space-y-2.5">
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface border border-border hover:border-primary/50 cursor-pointer transition-[border-color]">
                <Upload className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>Upload Custom Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleCustomImageUpload}
                />
              </label>

              <span className="text-[11px] text-text-muted block">Or choose a luxury salon preset:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectPresetImage(preset.url)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-[background-color,border-color]',
                      previewImage === preset.url
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface-subtle text-text-secondary hover:text-text-primary border border-border'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Staff Assignment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Staff Assignment
            </h4>
            <span className="text-xs text-text-muted">
              {selectedStaffIds.length} specialists selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {staffList.map((staff) => {
              const isSelected = selectedStaffIds.includes(staff.id)
              return (
                <div
                  key={staff.id}
                  onClick={() => toggleStaff(staff.id)}
                  className={cn(
                    'p-3 rounded-2xl border transition-[background-color,border-color] cursor-pointer flex items-center justify-between gap-3',
                    isSelected
                      ? 'bg-primary-50/40 border-primary dark:bg-primary-950/30'
                      : 'bg-surface border-border hover:border-border/80'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={staff.name} src={staff.avatarUrl} size="sm" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-text-primary truncate">
                        {staff.name}
                      </span>
                      <span className="text-[11px] text-text-muted truncate">
                        {staff.role}
                      </span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'h-5 w-5 rounded-md flex items-center justify-center border transition-colors shrink-0',
                      isSelected
                        ? 'bg-primary border-primary text-white'
                        : 'border-border bg-surface'
                    )}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 5. Service Settings & Online Booking Rules */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-4">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Booking & Availability Settings
          </h4>

          <div className="space-y-3">
            {/* Online booking */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-text-primary">
                  Can customers book online?
                </span>
                <span className="text-[11px] text-text-muted">
                  Make available on web booking portal and client widget
                </span>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                {...register('isOnlineBookingEnabled')}
              />
            </label>

            {/* Require deposit */}
            <div className="pt-2 border-t border-border/60">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary">
                    Require deposit for confirmation?
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Guests must pay upfront deposit to reserve slot
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  {...register('requireDeposit')}
                />
              </label>

              {watchRequireDeposit && (
                <div className="mt-3 pl-4 border-l-2 border-primary">
                  <Input
                    label="Deposit Amount (₹)"
                    type="number"
                    placeholder="500"
                    error={errors.depositAmount?.message}
                    {...register('depositAmount')}
                  />
                </div>
              )}
            </div>

            {/* Allow walk-ins */}
            <div className="pt-2 border-t border-border/60">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary">
                    Allow walk-ins without prior booking?
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Permit receptionists to quick check-in walk-in patrons
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  {...register('allowWalkIns')}
                />
              </label>
            </div>

            {/* Show on website */}
            <div className="pt-2 border-t border-border/60">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary">
                    Show in public salon pricing menu?
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Publish treatment on website and social links
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  {...register('showOnWebsite')}
                />
              </label>
            </div>

            {/* Active Status */}
            <div className="pt-2 border-t border-border/60">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary">
                    Active Service Status
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Deactivated treatments are hidden from daily booking schedule
                  </span>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  {...register('isActive')}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
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
            {isEditMode ? 'Update Service' : 'Save New Service'}
          </Button>
        </div>
      </form>
    </Drawer>
  )
}
