import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, Scissors, Sparkle, Palette, Heart, Hand } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { PopularService } from '@/types'
import { cn } from '@/utils/cn'

interface PopularServicesCardProps {
  services: PopularService[]
  className?: string
}

export const PopularServicesCard: React.FC<PopularServicesCardProps> = ({
  services,
  className,
}) => {
  // Service category color and icon mappings
  const getServiceIcon = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('hair cut') || lower.includes('haircut')) {
      return <Scissors className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
    }
    if (lower.includes('facial')) {
      return <Sparkle className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
    }
    if (lower.includes('color') || lower.includes('balayage')) {
      return <Palette className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
    }
    if (lower.includes('mani')) {
      return <Hand className="h-3.5 w-3.5 text-pink-500" aria-hidden="true" />
    }
    return <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
  }

  const getProgressColor = (idx: number) => {
    const colors = [
      'bg-primary',
      'bg-accent',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-amber-500',
    ]
    return colors[idx % colors.length]
  }

  // Calculate highest booking count for relative proportion if needed
  const maxBookings = Math.max(...services.map((s) => s.bookingCount), 1)

  return (
    <Card className={cn('flex flex-col justify-between', className)}>
      <div>
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Popular Services</CardTitle>
              <CardDescription>Most requested treatments by booking volume</CardDescription>
            </div>
            <Link
              to="/services"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Services</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-3">
          {services.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-muted">
              No service bookings recorded yet
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((srv, idx) => {
                const widthPercentage = Math.round((srv.bookingCount / maxBookings) * 100)
                return (
                  <div key={srv.id} className="space-y-1.5 group">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded-md bg-surface-subtle border border-border/80 shrink-0">
                          {getServiceIcon(srv.name)}
                        </div>
                        <span className="font-semibold text-text-primary truncate">
                          {srv.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-text-primary tabular-nums">
                          {srv.bookingCount} bookings
                        </span>
                        <span className="text-[11px] text-text-muted tabular-nums w-8 text-right">
                          {srv.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Horizontal Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-surface-subtle overflow-hidden border border-border/40">
                      <div
                        className={cn('h-full rounded-full transition-[width] duration-500 ease-out', getProgressColor(idx))}
                        style={{ width: `${widthPercentage}%` }}
                        role="progressbar"
                        aria-valuenow={srv.bookingCount}
                        aria-valuemin={0}
                        aria-valuemax={maxBookings}
                        aria-label={`${srv.name}: ${srv.bookingCount} bookings`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="pt-2 pb-3">
        <Link
          to="/services"
          className="w-full text-center text-xs font-semibold text-text-secondary hover:text-primary transition-[color] py-1"
        >
          View All Services & Pricing Menu &rarr;
        </Link>
      </CardFooter>
    </Card>
  )
}
