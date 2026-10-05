import React from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Package, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Product } from '@/types'
import { cn } from '@/utils/cn'

interface LowStockAlertsCardProps {
  products: Product[]
  className?: string
}

export const LowStockAlertsCard: React.FC<LowStockAlertsCardProps> = ({
  products,
  className,
}) => {
  // Filter products below threshold
  const lowStockItems = products
    .filter((p) => (p.currentStock ?? p.stockQuantity ?? 0) <= (p.minimumStock ?? p.lowStockThreshold ?? 5))
    .slice(0, 3)

  return (
    <Card className={cn('flex flex-col justify-between', className)}>
      <div>
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>Low Stock Alerts</CardTitle>
                  {lowStockItems.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger-light text-danger-fg">
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                      <span>{lowStockItems.length} Low</span>
                    </span>
                  )}
                </div>
                <CardDescription>Supplies needing replenishment</CardDescription>
              </div>
            </div>
            <Link
              to="/inventory"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-3 pb-3">
          {lowStockItems.length === 0 ? (
            <div className="py-6 text-center flex flex-col items-center justify-center gap-2 text-text-muted">
              <CheckCircle2 className="h-7 w-7 text-success" aria-hidden="true" />
              <p className="text-xs">All salon inventory levels are healthy.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {lowStockItems.map((item) => {
                const stock = item.currentStock ?? item.stockQuantity ?? 0
                const min = item.minimumStock ?? item.lowStockThreshold ?? 5
                const isCritical = stock <= 2
                return (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between gap-3 group hover:bg-surface-subtle/50 px-2 rounded-xl transition-[background-color]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                          isCritical
                            ? 'bg-danger-light text-danger-fg'
                            : 'bg-warning-light text-warning-fg'
                        )}
                      >
                        <Package className="h-4 w-4" aria-hidden="true" />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-text-primary truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-text-muted truncate">
                          {item.category} • SKU: {item.sku}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          isCritical
                            ? 'bg-danger-light text-danger-fg'
                            : 'bg-warning-light text-warning-fg'
                        )}
                      >
                        {isCritical ? 'Critical' : 'Low Stock'}
                      </span>
                      <span className="text-[11px] font-semibold text-text-secondary tabular-nums mt-0.5">
                        {stock} left{' '}
                        <span className="text-text-muted font-normal text-[10px]">
                          (Min {min})
                        </span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="pt-1 pb-3">
        <Link
          to="/inventory"
          className="w-full text-center text-xs font-semibold text-text-secondary hover:text-primary transition-[color] py-1"
        >
          View Full Stock Catalog &rarr;
        </Link>
      </CardFooter>
    </Card>
  )
}
