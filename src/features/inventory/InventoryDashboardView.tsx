import React from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  AlertTriangle,
  XCircle,
  IndianRupee,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
} from 'lucide-react'
import { Product, StockMovement, InventoryStats } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface ExpiringItem {
  product: Product
  daysRemaining: number
  status: 'expired' | 'critical' | 'warning'
}

interface InventoryDashboardViewProps {
  stats: InventoryStats
  lowStockProducts: Product[]
  expiringProducts: ExpiringItem[]
  recentMovements: StockMovement[]
  topSellingProducts: { product: Product; unitsSold: number; revenue: number }[]
  onOpenAddProduct: () => void
  onOpenQuickAdjustment: (product?: Product) => void
}

export const InventoryDashboardView: React.FC<InventoryDashboardViewProps> = ({
  stats,
  lowStockProducts,
  expiringProducts,
  recentMovements,
  topSellingProducts,
  onOpenAddProduct,
  onOpenQuickAdjustment,
}) => {
  return (
    <div className="space-y-6">
      {/* 4 Top Metric Cards (Section 2 Requirement) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Products */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Total Products
              </span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-text-primary tabular-nums font-sans">
              {stats.totalProducts}
            </p>
            <p className="text-[11px] text-text-muted">Active salon SKUs & consumables</p>
          </CardContent>
        </Card>

        {/* 2. Low Stock */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Low Stock
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums font-sans">
              {stats.lowStockCount}
            </p>
            <p className="text-[11px] text-text-muted">Thresholds breached</p>
          </CardContent>
        </Card>

        {/* 3. Out of Stock */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Out of Stock
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <XCircle className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-rose-500 tabular-nums font-sans">
              {stats.outOfStockCount}
            </p>
            <p className="text-[11px] text-text-muted">Zero shelf units available</p>
          </CardContent>
        </Card>

        {/* 4. Total Inventory Value */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Inventory Value
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums font-sans">
              {formatCurrency(stats.totalInventoryValue)}
            </p>
            <p className="text-[11px] text-text-muted">Current Stock × Purchase Price</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Low Stock Alerts + Expiring Products (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section: Low Stock Alerts */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Low Stock & Depletion Alerts</CardTitle>
                    <CardDescription className="text-xs">
                      Items below or near designated safety thresholds
                    </CardDescription>
                  </div>
                </div>

                <Link
                  to="/inventory/products"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>All SKUs</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {lowStockProducts.length > 0 ? (
                <div className="divide-y divide-border">
                  {lowStockProducts.slice(0, 5).map((p) => {
                    const isZero = p.currentStock === 0
                    const stockRatio = p.minimumStock > 0 ? (p.currentStock / p.minimumStock) * 100 : 0

                    return (
                      <div
                        key={p.id}
                        className="p-3.5 hover:bg-surface-hover/60 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary truncate">{p.name}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                                isZero
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                              }`}
                            >
                              {isZero ? 'OUT OF STOCK' : 'LOW STOCK'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-text-muted">
                            <span>SKU: {p.sku}</span>
                            <span>•</span>
                            <span>Category: {p.category}</span>
                            <span>•</span>
                            <span>Supplier: {p.supplierName}</span>
                          </div>

                          {/* Progress bar towards min threshold */}
                          <div className="w-full max-w-xs h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isZero ? 'bg-rose-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(8, stockRatio))}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-right">
                          <div>
                            <span
                              className={`font-black text-sm tabular-nums block ${
                                isZero ? 'text-rose-500' : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {p.currentStock} {p.unit}s
                            </span>
                            <span className="text-[10px] text-text-muted">
                              Min: {p.minimumStock} {p.unit}s
                            </span>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenQuickAdjustment(p)}
                            className="text-xs h-8"
                          >
                            + Stock In
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-text-muted">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-text-primary">Stock levels are healthy</p>
                  <p className="text-[11px]">No products are currently under minimum safety thresholds.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section: Expiring Products Alerts */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-500">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Expiring & Outdated Batches</CardTitle>
                    <CardDescription className="text-xs">
                      Chemical color tubes, skincare serums & organic treatments
                    </CardDescription>
                  </div>
                </div>

                <Badge variant={expiringProducts.length > 0 ? 'warning' : 'success'} size="sm">
                  {expiringProducts.length} Alert{expiringProducts.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {expiringProducts.length > 0 ? (
                <div className="divide-y divide-border">
                  {expiringProducts.map(({ product: p, daysRemaining, status }) => (
                    <div
                      key={p.id}
                      className="p-3.5 hover:bg-surface-hover/60 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-primary truncate">{p.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              status === 'expired'
                                ? 'bg-rose-500 text-white'
                                : status === 'critical'
                                ? 'bg-amber-500 text-white'
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {status === 'expired'
                              ? 'Expired'
                              : status === 'critical'
                              ? `Expires in ${daysRemaining} days`
                              : `Expires in ${daysRemaining} days`}
                          </span>
                        </div>

                        <p className="text-[11px] text-text-muted">
                          Batch: <strong>{p.batchNumber || 'N/A'}</strong> • Expiry Date:{' '}
                          <span className="font-mono text-rose-600 font-bold">{p.expiryDate}</span> • Shelf
                          Stock: {p.currentStock} {p.unit}s
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenQuickAdjustment(p)}
                          className="text-xs text-rose-600 hover:text-rose-700 h-7"
                        >
                          Mark Expired
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-text-muted">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-text-primary">No batches expiring soon</p>
                  <p className="text-[11px]">All salon inventory is comfortably within manufacturer dates.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Recent Movements + Top Selling Products (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Section: Recent Stock Movements Stream */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Recent Stock Movements</CardTitle>
                    <CardDescription className="text-xs">Live receiving, sales & service logs</CardDescription>
                  </div>
                </div>

                <Link
                  to="/inventory/stock"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>Ledger</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentMovements.slice(0, 6).map((mov) => {
                  const isPositive = mov.quantity > 0
                  return (
                    <div
                      key={mov.id}
                      className="p-3 hover:bg-surface-hover/50 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isPositive
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : 'bg-rose-500/15 text-rose-500'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-text-primary truncate">{mov.productName}</p>
                          <p className="text-[10px] text-text-muted truncate">
                            {mov.reason} • <span className="font-mono">{formatDate(mov.createdAt, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-black text-xs tabular-nums block ${
                            isPositive ? 'text-emerald-600' : 'text-rose-500'
                          }`}
                        >
                          {isPositive ? `+${mov.quantity}` : mov.quantity}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          Balance: {mov.newStock}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Section: Top Selling Retail Products */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Top Retail Movers</CardTitle>
                    <CardDescription className="text-xs">Client favourites this month</CardDescription>
                  </div>
                </div>

                <Badge variant="accent" size="sm">
                  Retail
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-3 pb-3 space-y-3 text-xs">
              {topSellingProducts.map(({ product: p, unitsSold, revenue }, idx) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-surface-subtle border border-border text-[11px] font-black text-text-muted flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-text-primary truncate">{p.name}</p>
                      <p className="text-[10px] text-text-muted">
                        Stock: {p.currentStock} left • {formatCurrency(p.sellingPrice)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-text-primary tabular-nums block">
                      {unitsSold} sold
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 tabular-nums">
                      {formatCurrency(revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
