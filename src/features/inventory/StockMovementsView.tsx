import React, { useState, useMemo } from 'react'
import {
  ArrowLeftRight,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  User,
  Plus,
  FileText,
} from 'lucide-react'
import { StockMovement, StockMovementType, Product } from '@/types'
import { formatDate } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'

interface StockMovementsViewProps {
  movements: StockMovement[]
  products: Product[]
  onOpenQuickAdjustment: () => void
}

export const StockMovementsView: React.FC<StockMovementsViewProps> = ({
  movements,
  products,
  onOpenQuickAdjustment,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('all')
  const [selectedMovement, setSelectedMovement] = useState('all')
  const [timeRange, setTimeRange] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  const filteredMovements = useMemo(() => {
    const now = Date.now()
    const todayStr = new Date().toISOString().split('T')[0]

    return movements.filter((mov) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesProd = mov.productName.toLowerCase().includes(q)
        const matchesSku = mov.sku.toLowerCase().includes(q)
        const matchesReason = mov.reason.toLowerCase().includes(q)
        const matchesRef = (mov.referenceId || '').toLowerCase().includes(q)
        if (!matchesProd && !matchesSku && !matchesReason && !matchesRef) return false
      }

      // Product
      if (selectedProduct !== 'all' && mov.productId !== selectedProduct) return false

      // Movement Type
      if (selectedMovement !== 'all' && mov.type !== selectedMovement) return false

      // Time Range
      if (timeRange === 'today') {
        if (!mov.createdAt.startsWith(todayStr)) return false
      } else if (timeRange === 'week') {
        const movTime = new Date(mov.createdAt).getTime()
        if (now - movTime > 7 * 86400000) return false
      } else if (timeRange === 'month') {
        const movTime = new Date(mov.createdAt).getTime()
        if (now - movTime > 30 * 86400000) return false
      }

      return true
    })
  }, [movements, searchQuery, selectedProduct, selectedMovement, timeRange])

  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredMovements.slice(start, start + pageSize)
  }, [filteredMovements, currentPage, pageSize])

  const getMovementBadge = (type: StockMovementType) => {
    switch (type) {
      case 'stock_in':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
            <ArrowDownLeft className="h-3 w-3" />
            Stock In
          </span>
        )
      case 'stock_out':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
            <ArrowUpRight className="h-3 w-3" />
            Stock Out
          </span>
        )
      case 'sale':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
            <ArrowUpRight className="h-3 w-3" />
            Retail Sale
          </span>
        )
      case 'service_consumption':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200">
            <ArrowUpRight className="h-3 w-3" />
            Service Consumption
          </span>
        )
      case 'damaged':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200">
            Damaged
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
            Expired Batch
          </span>
        )
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-300">
            Vendor Return
          </span>
        )
      case 'adjustment':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200">
            Audit Adjustment
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex-1">
              <SearchInput
                placeholder="Search stock history by product name, SKU, reason, or reference…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Product Filter */}
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="all">All Products ({products.length})</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Movement Filter */}
              <select
                value={selectedMovement}
                onChange={(e) => {
                  setSelectedMovement(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="all">All Movement Types</option>
                <option value="stock_in">Stock In</option>
                <option value="stock_out">Stock Out</option>
                <option value="sale">Retail Sale</option>
                <option value="service_consumption">Service Consumption</option>
                <option value="adjustment">Cycle Count Adjustment</option>
                <option value="damaged">Damaged / Leak</option>
                <option value="expired">Expired Write-off</option>
                <option value="returned">Vendor Return</option>
              </select>

              {/* Date Filter */}
              <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border text-xs font-semibold">
                {(['all', 'today', 'week', 'month'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setTimeRange(r)
                      setCurrentPage(1)
                    }}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                      timeRange === r
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {r === 'all' ? 'All' : r === 'today' ? 'Today' : r === 'week' ? '7 Days' : '30 Days'}
                  </button>
                ))}
              </div>

              {/* New Stock Movement Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenQuickAdjustment}
                leftIcon={<Plus className="h-4 w-4" />}
                className="shadow-glow-primary/20 text-xs"
              >
                + New Movement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock History Table Card (Section 16 Specification) */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-subtle/50 text-[11px] font-bold text-text-muted uppercase">
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Product & SKU</th>
                  <th className="py-3 px-3">Movement Type</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-3 text-right">Balance</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-3">Reference #</th>
                  <th className="py-3 px-4 text-right">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedMovements.length > 0 ? (
                  paginatedMovements.map((mov) => {
                    const isPositive = mov.quantity > 0
                    return (
                      <tr key={mov.id} className="hover:bg-surface-hover/70 transition-colors">
                        {/* 1. Date */}
                        <td className="py-3 px-4 font-mono text-[11px] text-text-secondary whitespace-nowrap">
                          {formatDate(mov.createdAt, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>

                        {/* 2. Product */}
                        <td className="py-3 px-4">
                          <p className="font-bold text-text-primary truncate">{mov.productName}</p>
                          <span className="text-[10px] font-mono text-primary font-bold">
                            {mov.sku}
                          </span>
                        </td>

                        {/* 3. Movement Type */}
                        <td className="py-3 px-3">{getMovementBadge(mov.type)}</td>

                        {/* 4. Quantity */}
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`font-black text-sm tabular-nums ${
                              isPositive ? 'text-emerald-600' : 'text-rose-500'
                            }`}
                          >
                            {isPositive ? `+${mov.quantity}` : mov.quantity}
                          </span>
                        </td>

                        {/* 5. Balance */}
                        <td className="py-3 px-3 text-right font-black text-text-primary tabular-nums">
                          {mov.newStock}
                        </td>

                        {/* 6. Reason */}
                        <td className="py-3 px-4 text-text-secondary max-w-[220px] truncate">
                          {mov.reason}
                        </td>

                        {/* 7. Reference */}
                        <td className="py-3 px-3 font-mono text-[11px] text-text-muted">
                          {mov.referenceId || '—'}
                        </td>

                        {/* 8. Logged By */}
                        <td className="py-3 px-4 text-right text-text-secondary truncate">
                          {mov.createdBy}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-text-muted">
                      No stock movements found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredMovements.length > pageSize && (
            <div className="p-4 border-t border-border">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredMovements.length / pageSize)}
                totalItems={filteredMovements.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
