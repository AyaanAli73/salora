import React, { useState, useMemo } from 'react'
import {
  Package,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  MoreVertical,
  Copy,
  Edit2,
  Archive,
  ArrowLeftRight,
  Barcode,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Download,
} from 'lucide-react'
import { Product, Supplier } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'

interface ProductsCatalogViewProps {
  products: Product[]
  suppliers: Supplier[]
  categories: string[]
  onOpenAddProduct: () => void
  onOpenEditProduct: (product: Product) => void
  onOpenDuplicateProduct: (product: Product) => void
  onOpenQuickAdjustment: (product: Product) => void
  onArchiveProduct: (product: Product) => void
  onOpenServiceIngredients: () => void
}

export const ProductsCatalogView: React.FC<ProductsCatalogViewProps> = ({
  products,
  suppliers,
  categories,
  onOpenAddProduct,
  onOpenEditProduct,
  onOpenDuplicateProduct,
  onOpenQuickAdjustment,
  onArchiveProduct,
  onOpenServiceIngredients,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price' | 'expiry'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search Query (name, sku, barcode, brand)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = p.name.toLowerCase().includes(q)
        const matchesSku = p.sku.toLowerCase().includes(q)
        const matchesBarcode = (p.barcode || '').toLowerCase().includes(q)
        const matchesBrand = (p.brand || '').toLowerCase().includes(q)
        if (!matchesName && !matchesSku && !matchesBarcode && !matchesBrand) return false
      }

      // 2. Category
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false

      // 3. Status
      if (selectedStatus === 'in-stock' && p.currentStock <= p.minimumStock) return false
      if (selectedStatus === 'low-stock' && (p.currentStock === 0 || p.currentStock > p.minimumStock)) return false
      if (selectedStatus === 'out-of-stock' && p.currentStock !== 0) return false
      if (selectedStatus === 'archived' && p.active) return false
      if (selectedStatus === 'active' && !p.active) return false

      // 4. Supplier
      if (selectedSupplier !== 'all' && p.supplierId !== selectedSupplier) return false

      return true
    })
  }, [products, searchQuery, selectedCategory, selectedStatus, selectedSupplier])

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortBy === 'stock') cmp = a.currentStock - b.currentStock
      else if (sortBy === 'price') cmp = a.sellingPrice - b.sellingPrice
      else if (sortBy === 'expiry') {
        const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : 9999999999999
        const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : 9999999999999
        cmp = dateA - dateB
      }
      return sortOrder === 'asc' ? cmp : -cmp
    })
  }, [filteredProducts, sortBy, sortOrder])

  // Pagination
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedProducts.slice(start, start + pageSize)
  }, [sortedProducts, currentPage, pageSize])

  const handleSort = (field: 'name' | 'stock' | 'price' | 'expiry') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex-1">
              <SearchInput
                placeholder="Search products by Name, SKU, Barcode, or Supplier…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="all">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="all">All Stock Statuses</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock (Threshold Breached)</option>
                <option value="out-of-stock">Out of Stock (0 units)</option>
              </select>

              {/* Supplier Filter */}
              <select
                value={selectedSupplier}
                onChange={(e) => {
                  setSelectedSupplier(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="all">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Service Consumables Configuration Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenServiceIngredients}
                className="text-xs"
              >
                Service Recipes
              </Button>

              {/* Add Product Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenAddProduct}
                leftIcon={<Plus className="h-4 w-4" />}
                className="shadow-glow-primary/20 text-xs"
              >
                + Add Product
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Inventory Table Card (Section 15 Specification) */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-subtle/50 text-[11px] font-bold text-text-muted uppercase">
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Product & SKU</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Category</th>
                  <th
                    className="py-3 px-3 text-right cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort('stock')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Stock / Unit</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Purchase (Cost)</th>
                  <th
                    className="py-3 px-3 text-right cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Selling (Retail)</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Supplier</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-text-primary select-none"
                    onClick={() => handleSort('expiry')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Expiry Date</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((p) => {
                    const isZero = p.currentStock === 0
                    const isLow = !isZero && p.currentStock <= p.minimumStock
                    const isExpired = p.expiryDate ? new Date(p.expiryDate).getTime() <= Date.now() : false

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-surface-hover/70 transition-colors group"
                      >
                        {/* 1. Product & SKU */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-border flex items-center justify-center shrink-0 text-text-muted">
                              <Package className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-text-primary truncate">{p.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono mt-0.5">
                                <span className="font-bold text-primary">{p.sku}</span>
                                {p.barcode && <span>• EAN: {p.barcode}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Category */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-surface-subtle border border-border text-[11px] font-semibold text-text-secondary whitespace-nowrap">
                            {p.category}
                          </span>
                        </td>

                        {/* 3. Stock & Unit */}
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`font-black text-sm tabular-nums block ${
                              isZero
                                ? 'text-rose-500'
                                : isLow
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-text-primary'
                            }`}
                          >
                            {p.currentStock}{' '}
                            <span className="text-[11px] font-normal text-text-muted">{p.unit}s</span>
                          </span>
                          <span className="text-[10px] text-text-muted">
                            Min: {p.minimumStock}
                          </span>
                        </td>

                        {/* 4. Purchase Price */}
                        <td className="py-3 px-3 text-right font-medium text-text-muted tabular-nums">
                          {formatCurrency(p.purchasePrice)}
                        </td>

                        {/* 5. Selling Price */}
                        <td className="py-3 px-3 text-right font-black text-text-primary tabular-nums">
                          {formatCurrency(p.sellingPrice)}
                        </td>

                        {/* 6. Supplier */}
                        <td className="py-3 px-3 text-text-secondary truncate max-w-[140px]">
                          {p.supplierName}
                        </td>

                        {/* 7. Expiry */}
                        <td className="py-3 px-3 font-mono text-[11px]">
                          {p.expiryDate ? (
                            <span className={isExpired ? 'text-rose-600 font-bold' : 'text-text-secondary'}>
                              {p.expiryDate}
                              {isExpired && ' (Expired)'}
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>

                        {/* 8. Status */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isZero
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : isLow
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                            }`}
                          >
                            {isZero ? 'Out of stock' : isLow ? 'Low stock' : 'In stock'}
                          </span>
                        </td>

                        {/* 9. Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Stock In / Out"
                              onClick={() => onOpenQuickAdjustment(p)}
                              className="h-7 w-7 p-0"
                            >
                              <ArrowLeftRight className="h-3.5 w-3.5 text-text-muted hover:text-primary" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit Product"
                              onClick={() => onOpenEditProduct(p)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-text-muted hover:text-text-primary" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              title="Duplicate Product"
                              onClick={() => onOpenDuplicateProduct(p)}
                              className="h-7 w-7 p-0"
                            >
                              <Copy className="h-3.5 w-3.5 text-text-muted hover:text-text-primary" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              title="Archive Product"
                              onClick={() => onArchiveProduct(p)}
                              className="h-7 w-7 p-0 hover:text-rose-500"
                            >
                              <Archive className="h-3.5 w-3.5 text-text-muted" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-text-muted">
                      No products match your search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {sortedProducts.length > pageSize && (
            <div className="p-4 border-t border-border">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(sortedProducts.length / pageSize)}
                totalItems={sortedProducts.length}
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
