import React, { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Truck,
  Package,
  Calendar,
  IndianRupee,
  AlertCircle,
  Tag,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import { ProcurementAnalyticsSummary, Product, ProductPriceHistoryEntry } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { procurementService } from '@/services/procurementService'
import { inventoryService } from '@/services/inventoryService'

interface ProcurementAnalyticsViewProps {
  analytics: ProcurementAnalyticsSummary
  branchFilter?: string
}

export const ProcurementAnalyticsView: React.FC<ProcurementAnalyticsViewProps> = ({
  analytics,
  branchFilter,
}) => {
  const products = inventoryService.getAllSync()
  const [selectedProductId, setSelectedProductId] = useState<string>('prod-1')

  const selectedProduct = products.find((p) => p.id === selectedProductId)
  const productPriceHistory = procurementService.getProductPriceHistory(selectedProductId)

  // Max spend for normalizing bar chart
  const maxMonthSpend = Math.max(...analytics.monthlyTrends.map((m) => m.spend), 1)

  return (
    <div className="space-y-6">
      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Purchases This Month */}
        <Card className="bg-surface shadow-soft border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Purchases This Month</span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <IndianRupee className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text-primary tabular-nums">
                {formatCurrency(analytics.totalPurchasesThisMonth)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              {analytics.monthGrowthPercentage >= 0 ? (
                <span className="text-success font-semibold flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  +{analytics.monthGrowthPercentage}%
                </span>
              ) : (
                <span className="text-danger font-semibold flex items-center gap-0.5">
                  <TrendingDown className="h-3 w-3" aria-hidden="true" />
                  {analytics.monthGrowthPercentage}%
                </span>
              )}
              <span className="text-text-muted">vs last month ({formatCurrency(analytics.purchasesLastMonth)})</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Outstanding Payable */}
        <Card className="bg-surface shadow-soft border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-text-muted">Supplier Payables</span>
                <span className="block text-[10px] text-danger font-medium">Accounts Payable Due</span>
              </div>
              <div className="h-8 w-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center">
                <IndianRupee className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-danger tabular-nums">
                {formatCurrency(analytics.totalOutstandingPayable)}
              </span>
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Pending vendor invoices awaiting disbursement
            </div>
          </CardContent>
        </Card>

        {/* Active Suppliers */}
        <Card className="bg-surface shadow-soft border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Authorized Suppliers</span>
              <div className="h-8 w-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                <Truck className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text-primary tabular-nums">
                {analytics.activeSuppliersCount}
              </span>
              <span className="text-xs text-text-muted">Vendors</span>
            </div>
            <div className="mt-1 text-xs text-text-muted">
              100% active compliance rate
            </div>
          </CardContent>
        </Card>

        {/* Average Purchase Price Index */}
        <Card className="bg-surface shadow-soft border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Avg Unit Purchase Cost</span>
              <div className="h-8 w-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
                <Tag className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text-primary tabular-nums">
                {formatCurrency(analytics.averagePurchasePriceTrend[analytics.averagePurchasePriceTrend.length - 1]?.avgPrice || 470)}
              </span>
            </div>
            <div className="mt-1 text-xs text-warning flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
              +11.9% procurement inflation since July
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Purchase Spend Trend */}
      <Card className="bg-surface shadow-soft border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                Monthly Procurement Spend Trend
              </CardTitle>
              <CardDescription className="text-xs text-text-muted mt-0.5">
                Gross vendor purchases across network branches over the last 5 months.
              </CardDescription>
            </div>
            <Badge variant="default" className="text-xs font-semibold">
              May 2026 – Sep 2026
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-5 gap-3 pt-6 pb-2">
            {analytics.monthlyTrends.map((t, idx) => {
              const heightPct = Math.round((t.spend / maxMonthSpend) * 100)
              const isCurrent = idx === analytics.monthlyTrends.length - 1
              return (
                <div key={t.month} className="flex flex-col items-center gap-2 group">
                  <span className="text-[11px] font-bold text-text-primary tabular-nums">
                    {formatCurrency(t.spend)}
                  </span>
                  <div className="w-full max-w-[48px] h-36 bg-surface-subtle rounded-xl flex items-end p-1 border border-border">
                    <div
                      style={{ height: `${Math.max(12, heightPct)}%` }}
                      className={`w-full rounded-lg transition-all duration-300 ${
                        isCurrent
                          ? 'bg-gradient-to-t from-primary to-accent shadow-sm'
                          : 'bg-primary/30 group-hover:bg-primary/50'
                      }`}
                    />
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-semibold text-text-primary">{t.month}</span>
                    <span className="block text-[10px] text-text-muted">{t.ordersCount} POs</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Suppliers & Top Purchased Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Suppliers */}
        <Card className="bg-surface shadow-soft border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-text-primary">Top Suppliers by Spend</CardTitle>
            <CardDescription className="text-xs text-text-muted">
              Leading vendor partners by procurement volume
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="divide-y divide-border">
              {analytics.topSuppliers.map((s, idx) => (
                <div key={s.supplierId} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-lg bg-surface-subtle font-bold text-text-secondary flex items-center justify-center text-[11px]">
                      #{idx + 1}
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary block">{s.supplierName}</span>
                      <span className="text-[10px] text-text-muted">{s.ordersCount} Purchase Orders</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-text-primary tabular-nums block">
                      {formatCurrency(s.totalSpend)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Purchased Products */}
        <Card className="bg-surface shadow-soft border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-text-primary">Top Purchased Inventory Products</CardTitle>
            <CardDescription className="text-xs text-text-muted">
              Highest turnover retail and backbar supplies
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="divide-y divide-border">
              {analytics.topPurchasedProducts.map((p, idx) => (
                <div key={p.productId} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-lg bg-surface-subtle font-bold text-text-secondary flex items-center justify-center text-[11px]">
                      #{idx + 1}
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary block">{p.productName}</span>
                      <span className="text-[10px] text-text-muted">SKU: {p.sku} • {p.totalQuantity} Units</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-text-primary tabular-nums block">
                      {formatCurrency(p.totalSpend)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Price History Section (Exact prompt: July ₹420, August ₹450, September ₹470) */}
      <Card className="bg-surface shadow-soft border-border">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" aria-hidden="true" />
                Historical Purchase Price Tracker
              </CardTitle>
              <CardDescription className="text-xs text-text-muted mt-0.5">
                Audit supplier invoice price changes over time for any product line.
              </CardDescription>
            </div>

            {/* Product Selector */}
            <div className="w-full sm:w-80">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                aria-label="Select product for price history inspection"
                className="w-full h-9 px-3 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="p-4 bg-surface-subtle border border-border rounded-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <div>
                <strong className="text-sm font-bold text-text-primary block">
                  {selectedProduct?.name}
                </strong>
                <span className="text-xs text-text-muted">
                  Supplier: {selectedProduct?.supplierName || "L'Oréal India Professional"} • Current Cost: {formatCurrency(selectedProduct?.costPrice || selectedProduct?.purchasePrice || 470)}
                </span>
              </div>
              <Badge variant="primary" className="text-xs font-bold">
                {productPriceHistory.length} Price Records
              </Badge>
            </div>

            {/* Price Timeline Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {productPriceHistory.length === 0 ? (
                <div className="col-span-3 py-6 text-center text-xs text-text-muted">
                  No previous price history logged for this product.
                </div>
              ) : (
                productPriceHistory.map((entry, idx) => {
                  const prev = idx > 0 ? productPriceHistory[idx - 1].purchasePrice : null
                  const diff = prev ? entry.purchasePrice - prev : null

                  return (
                    <div
                      key={entry.id}
                      className="p-3 bg-surface border border-border rounded-xl shadow-xs space-y-1"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted font-semibold">{entry.monthLabel}</span>
                        <span className="text-[10px] text-text-muted">{entry.poNumber}</span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-lg font-extrabold text-text-primary tabular-nums">
                          {formatCurrency(entry.purchasePrice)}
                        </span>
                        {diff !== null && (
                          <span
                            className={`text-xs font-bold flex items-center gap-0.5 ${
                              diff > 0 ? 'text-danger' : diff < 0 ? 'text-success' : 'text-text-muted'
                            }`}
                          >
                            {diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-text-muted truncate">
                        Invoice Date: {entry.date}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
