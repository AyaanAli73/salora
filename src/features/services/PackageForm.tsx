import React, { useState } from 'react'
import { Check, Plus, PackageCheck, Clock, Sparkles } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Service, ServicePackageItem } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface PackageFormProps {
  isOpen: boolean
  onClose: () => void
  existingServices: Service[]
  onSubmit: (packageData: Partial<Service>) => Promise<void>
  currency?: string
}

export const PackageForm: React.FC<PackageFormProps> = ({
  isOpen,
  onClose,
  existingServices,
  onSubmit,
  currency = 'INR',
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [customPrice, setCustomPrice] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const nonPackageServices = existingServices.filter((s) => !s.isPackage)

  const selectedServices = nonPackageServices.filter((s) =>
    selectedServiceIds.includes(s.id)
  )

  const totalIndividualPrice = selectedServices.reduce(
    (acc, curr) => acc + curr.price,
    0
  )
  const totalDuration = selectedServices.reduce(
    (acc, curr) => acc + curr.duration,
    0
  )

  const toggleSelectService = (id: string) => {
    setSelectedServiceIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]

      // Automatically recommend 15% discount price if creating
      const currentSelected = nonPackageServices.filter((s) => next.includes(s.id))
      const sum = currentSelected.reduce((acc, curr) => acc + curr.price, 0)
      setCustomPrice(Math.round(sum * 0.85))
      return next
    })
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || selectedServiceIds.length === 0) return

    setIsSubmitting(true)
    try {
      const packageItems: ServicePackageItem[] = selectedServices.map((s) => ({
        serviceId: s.id,
        serviceName: s.name,
        duration: s.duration,
        individualPrice: s.price,
      }))

      // Aggregate assigned staff from included services
      const allStaff = Array.from(
        new Set(selectedServices.flatMap((s) => s.assignedStaffIds))
      )

      await onSubmit({
        name,
        categoryName: 'Packages',
        description,
        price: customPrice || totalIndividualPrice,
        discountPrice: totalIndividualPrice,
        duration: totalDuration,
        bufferTime: 20,
        taxRate: 18,
        imageUrl:
          'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&auto=format&fit=crop&q=80',
        isActive: true,
        isOnlineBookingEnabled: true,
        requireDeposit: true,
        depositAmount: 500,
        allowWalkIns: false,
        showOnWebsite: true,
        isPackage: true,
        packageServices: packageItems,
        assignedStaffIds: allStaff.length ? allStaff : ['staff-1'],
      })

      // Reset
      setName('')
      setDescription('')
      setSelectedServiceIds([])
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const savings = totalIndividualPrice - (customPrice || totalIndividualPrice)

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Create Service Package Bundle"
      description="Bundle multiple salon treatments into an enticing promotional package with special pricing."
      size="lg"
    >
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Package Basic Information */}
        <div className="space-y-3.5">
          <Input
            label="Package Name *"
            placeholder="e.g. Total Salon Glow & Rejuvenation Ritual"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
              Package Description
            </label>
            <textarea
              rows={2}
              placeholder="Describe the experience, complimentary treatments, and who it is perfect for…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Treatment Checklist Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Select Treatments to Include *
            </h4>
            <span className="text-xs text-text-muted">
              {selectedServiceIds.length} services selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {nonPackageServices.map((service) => {
              const isSelected = selectedServiceIds.includes(service.id)
              return (
                <div
                  key={service.id}
                  onClick={() => toggleSelectService(service.id)}
                  className={cn(
                    'p-3 rounded-2xl border transition-[background-color,border-color] cursor-pointer flex items-center justify-between gap-3',
                    isSelected
                      ? 'bg-primary-50/40 border-primary dark:bg-primary-950/30'
                      : 'bg-surface border-border hover:border-border/80'
                  )}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-text-primary truncate">
                      {service.name}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {service.duration}m • {formatCurrency(service.price, currency)}
                    </span>
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

        {/* Pricing & Savings Summary Card */}
        {selectedServiceIds.length > 0 && (
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-4">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>Bundle Pricing & Client Value</span>
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface border border-border">
                <span className="text-text-muted">Individual Services Sum:</span>
                <p className="text-base font-bold text-text-primary tabular-nums mt-0.5">
                  {formatCurrency(totalIndividualPrice, currency)}
                </p>
                <span className="text-[10px] text-text-muted mt-1 block">
                  Total duration: {totalDuration} min
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-border">
                <span className="text-text-muted">Bundle Offer Price (₹):</span>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Number(e.target.value))}
                  className="w-full mt-1 font-bold text-base text-primary bg-transparent focus:outline-none border-b border-primary"
                />
                {savings > 0 && (
                  <span className="text-[10px] font-bold text-success mt-1 block">
                    Clients save {formatCurrency(savings, currency)} (
                    {Math.round((savings / totalIndividualPrice) * 100)}%)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!name.trim() || selectedServiceIds.length === 0}
            isLoading={isSubmitting}
            leftIcon={<PackageCheck className="h-4 w-4" />}
          >
            Create Package Bundle
          </Button>
        </div>
      </form>
    </Drawer>
  )
}
