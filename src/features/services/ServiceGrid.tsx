import React from 'react'
import { Sparkles, Plus } from 'lucide-react'
import { Service } from '@/types'
import { ServiceCard } from './ServiceCard'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

interface ServiceGridProps {
  services: Service[]
  isLoading?: boolean
  onEdit: (service: Service) => void
  onDuplicate: (id: string) => void
  onToggleActive: (id: string) => void
  onDelete: (id: string) => void
  onAddService?: () => void
  currency?: string
  className?: string
}

export const ServiceGrid: React.FC<ServiceGridProps> = ({
  services,
  isLoading = false,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete,
  onAddService,
  currency = 'INR',
  className,
}) => {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-border bg-surface overflow-hidden animate-pulse flex flex-col justify-between h-80"
          >
            <div className="h-40 bg-surface-subtle" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-surface-subtle rounded-md w-3/4" />
              <div className="h-3 bg-surface-subtle rounded-md w-full" />
              <div className="h-3 bg-surface-subtle rounded-md w-2/3" />
            </div>
            <div className="h-10 bg-surface-subtle border-t border-border" />
          </div>
        ))}
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-surface/50 p-8">
        <div className="h-12 w-12 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary flex items-center justify-center shadow-xs">
          <Sparkles className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-sm font-bold text-text-primary">No Services Found</h3>
          <p className="text-xs text-text-muted">
            No services match the selected category or filter options. Adjust your filters or create a new treatment.
          </p>
        </div>
        {onAddService && (
          <Button
            variant="primary"
            size="sm"
            onClick={onAddService}
            leftIcon={<Plus className="h-4 w-4" />}
            className="mt-2"
          >
            Add New Service
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
          currency={currency}
        />
      ))}
    </div>
  )
}
