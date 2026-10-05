import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  Users,
  MoreVertical,
  Edit2,
  Copy,
  Power,
  Trash2,
  Globe,
  Sparkles,
  Tag,
  Scissors,
  CheckCircle2,
} from 'lucide-react'
import { Service } from '@/types'
import { Card } from '@/components/ui/Card'
import { Dropdown } from '@/components/ui/Dropdown'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface ServiceCardProps {
  service: Service
  onEdit: (service: Service) => void
  onDuplicate: (id: string) => void
  onToggleActive: (id: string) => void
  onDelete: (id: string) => void
  currency?: string
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete,
  currency = 'INR',
}) => {
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate(`/services/${service.id}`)
  }

  return (
    <Card
      hoverEffect
      onClick={handleCardClick}
      className={cn(
        'group flex flex-col justify-between overflow-hidden cursor-pointer relative transition-[border-color,box-shadow]',
        !service.isActive && 'opacity-65 grayscale-[30%]'
      )}
    >
      <div>
        {/* Service Header Image / Banner */}
        <div className="relative h-40 w-full overflow-hidden bg-surface-subtle">
          {service.imageUrl ? (
            <img
              src={service.imageUrl}
              alt={service.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <Sparkles className="h-10 w-10 text-primary/40" aria-hidden="true" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {/* Badges on Image */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
            {/* Category Badge */}
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/90 dark:bg-black/80 backdrop-blur-md text-text-primary shadow-xs">
              {service.categoryName}
            </span>

            {/* Package Badge if applicable */}
            {service.isPackage && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-white shadow-xs">
                Package Bundle
              </span>
            )}
          </div>

          {/* Three-dot dropdown menu */}
          <div
            className="absolute top-3 right-3"
            onClick={(e) => e.stopPropagation()}
          >
            <Dropdown
              trigger={
                <button
                  type="button"
                  aria-label={`Options for ${service.name}`}
                  className="h-8 w-8 rounded-full bg-surface/90 hover:bg-surface text-text-primary flex items-center justify-center shadow-md backdrop-blur-md transition-colors"
                >
                  <MoreVertical className="h-4 w-4" aria-hidden="true" />
                </button>
              }
              items={[
                {
                  id: 'edit',
                  label: 'Edit Service',
                  icon: <Edit2 className="h-3.5 w-3.5" />,
                  onClick: () => onEdit(service),
                },
                {
                  id: 'duplicate',
                  label: 'Duplicate',
                  icon: <Copy className="h-3.5 w-3.5" />,
                  onClick: () => onDuplicate(service.id),
                },
                {
                  id: 'toggle-active',
                  label: service.isActive ? 'Deactivate' : 'Activate',
                  icon: <Power className="h-3.5 w-3.5 text-warning" />,
                  onClick: () => onToggleActive(service.id),
                },
                {
                  id: 'delete',
                  label: 'Delete Service',
                  danger: true,
                  icon: <Trash2 className="h-3.5 w-3.5" />,
                  onClick: () => onDelete(service.id),
                },
              ]}
            />
          </div>

          {/* Bottom Overlay Info (Duration & Online Badge) */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs font-semibold">
            <span className="flex items-center gap-1 drop-shadow-sm tabular-nums">
              <Clock className="h-3.5 w-3.5 text-white/90" aria-hidden="true" />
              <span>{service.duration} min</span>
              {service.bufferTime ? (
                <span className="text-[10px] text-white/75 font-normal">
                  (+{service.bufferTime}m buffer)
                </span>
              ) : null}
            </span>

            {/* Online booking badge */}
            {service.isOnlineBookingEnabled ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white backdrop-blur-sm">
                <Globe className="h-2.5 w-2.5" aria-hidden="true" />
                <span>Online</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-600/90 text-white backdrop-blur-sm">
                <span>In-Salon</span>
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 space-y-3">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-[color] line-clamp-1 font-sans">
                {service.name}
              </h3>
            </div>
            <p className="mt-1 text-xs text-text-muted line-clamp-2 leading-relaxed">
              {service.description || 'Premium salon treatment with tailored consultation.'}
            </p>
          </div>

          {/* Price & Discount */}
          <div className="flex items-baseline gap-2 pt-1 border-t border-border/60">
            <span className="text-xl font-extrabold text-text-primary tabular-nums font-sans">
              {formatCurrency(service.price, currency)}
            </span>
            {service.discountPrice && service.discountPrice < service.price && (
              <span className="text-xs text-text-muted line-through tabular-nums">
                {formatCurrency(service.discountPrice, currency)}
              </span>
            )}
            {service.taxRate ? (
              <span className="text-[10px] text-text-muted font-medium ml-auto">
                +{service.taxRate}% GST
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Card Footer: Staff count & Active Status */}
      <div className="px-4 py-3 bg-surface-subtle/50 border-t border-border/60 flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span className="tabular-nums font-semibold text-text-secondary">
            {service.assignedStaffIds.length}{' '}
            {service.assignedStaffIds.length === 1 ? 'Specialist' : 'Specialists'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'h-2 w-2 rounded-full shrink-0',
              service.isActive ? 'bg-success' : 'bg-slate-400'
            )}
            aria-hidden="true"
          />
          <span className="text-[11px] font-semibold text-text-secondary">
            {service.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </Card>
  )
}
