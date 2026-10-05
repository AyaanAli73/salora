import React, { useState, useEffect, useMemo } from 'react'
import { Product } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { Badge } from '@/components/ui/Badge'
import { inventoryService } from '@/services/inventoryService'
import { formatCurrency } from '@/utils/formatters'
import { Package, AlertCircle, Plus, Check, Barcode, AlertTriangle } from 'lucide-react'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onAddProduct: (product: Product, quantity: number) => void
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)

  // Load latest inventory on open
  useEffect(() => {
    if (isOpen) {
      inventoryService.getAll().then((data) => {
        const activeOnly = data.filter((p) => p.active)
        setProducts(activeOnly)
        const firstAvailable = activeOnly.find(
          (p) => p.currentStock > 0 && !inventoryService.isExpired(p.expiryDate)
        )
        setSelectedProduct(firstAvailable || null)
        setQuantity(1)
      })
    }
  }, [isOpen])

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category))
    return ['all', ...Array.from(set)]
  }, [products])

  // Auto-select on exact barcode scan / match
  useEffect(() => {
    if (searchQuery.trim()) {
      const clean = searchQuery.trim().toLowerCase()
      const exactMatch = products.find(
        (p) => (p.barcode && p.barcode.toLowerCase() === clean) || p.sku.toLowerCase() === clean
      )
      if (exactMatch && !inventoryService.isExpired(exactMatch.expiryDate)) {
        setSelectedProduct(exactMatch)
      }
    }
  }, [searchQuery, products])

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = p.name.toLowerCase().includes(q)
        const matchesSku = p.sku.toLowerCase().includes(q)
        const matchesBarcode = (p.barcode || '').toLowerCase().includes(q)
        const matchesSupplier = (p.supplierName || '').toLowerCase().includes(q)
        if (!matchesName && !matchesSku && !matchesBarcode && !matchesSupplier) return false
      }
      return true
    })
  }, [products, searchQuery, selectedCategory])

  const maxStock = selectedProduct ? selectedProduct.currentStock : 0
  const isSelectedExpired = selectedProduct
    ? inventoryService.isExpired(selectedProduct.expiryDate)
    : false

  const handleSelect = (prod: Product) => {
    if (inventoryService.isExpired(prod.expiryDate)) return
    setSelectedProduct(prod)
    setQuantity(1)
  }

  const handleConfirm = () => {
    if (!selectedProduct || maxStock === 0 || isSelectedExpired) return
    onAddProduct(selectedProduct, Math.min(quantity, maxStock))
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Retail Product to Bill"
      description="Select retail cosmetics, hair treatments, and beauty products with barcode & shelf stock validation."
      size="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Search & Category Filter */}
        <div className="space-y-2.5">
          <div className="relative">
            <SearchInput
              placeholder="Search product by Name, SKU, or scan Barcode (EAN)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize whitespace-nowrap transition-colors ${
                  selectedCategory === c
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface-subtle border border-border text-text-muted hover:text-text-primary'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Products List */}
        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 border border-border rounded-xl p-2 bg-surface-subtle/30">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((prod) => {
              const isSelected = selectedProduct?.id === prod.id
              const isOutOfStock = prod.currentStock === 0
              const isExpired = inventoryService.isExpired(prod.expiryDate)
              const isDisabled = isOutOfStock || isExpired

              return (
                <div
                  key={prod.id}
                  onClick={() => !isDisabled && handleSelect(prod)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed border-border bg-surface-subtle/50'
                      : isSelected
                      ? 'cursor-pointer border-primary bg-primary/5 text-text-primary shadow-xs ring-1 ring-primary/30'
                      : 'cursor-pointer border-border bg-surface text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-text-primary truncate">{prod.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5 font-mono">
                        <span className="font-bold text-primary">{prod.sku}</span>
                        {prod.barcode && <span>• EAN: {prod.barcode}</span>}
                        <span>• {prod.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <span className="font-extrabold text-sm text-text-primary tabular-nums block">
                        {formatCurrency(prod.sellingPrice)}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          isExpired
                            ? 'text-rose-600'
                            : isOutOfStock
                            ? 'text-rose-500'
                            : prod.currentStock <= prod.minimumStock
                            ? 'text-amber-500'
                            : 'text-emerald-600'
                        }`}
                      >
                        {isExpired
                          ? `Expired (${prod.expiryDate})`
                          : isOutOfStock
                          ? 'Out of stock'
                          : `${prod.currentStock} ${prod.unit}s in stock`}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-8 text-center text-xs text-text-muted">
              No products match your search or filter query.
            </div>
          )}
        </div>

        {/* Selected Product Quantity & Stock Protection */}
        {selectedProduct && (
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-text-primary truncate">{selectedProduct.name}</p>
              {isSelectedExpired ? (
                <p className="text-[11px] font-bold text-rose-600 mt-0.5 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Product batch expired on {selectedProduct.expiryDate} — cannot be sold.
                </p>
              ) : (
                <p className="text-[11px] text-text-muted mt-0.5">
                  Available shelf stock:{' '}
                  <strong
                    className={
                      maxStock <= selectedProduct.minimumStock
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }
                  >
                    {maxStock} {selectedProduct.unit}s
                  </strong>
                </p>
              )}
            </div>

            {!isSelectedExpired && maxStock > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-semibold text-text-secondary">Quantity:</span>
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-lg border border-border bg-surface flex items-center justify-center font-bold hover:bg-surface-hover disabled:opacity-40"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-sm tabular-nums">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                  disabled={quantity >= maxStock}
                  className="w-8 h-8 rounded-lg border border-border bg-surface flex items-center justify-center font-bold hover:bg-surface-hover disabled:opacity-40"
                >
                  +
                </button>

                <span className="text-[11px] text-text-muted ml-2 font-semibold">
                  = {formatCurrency(selectedProduct.sellingPrice * quantity)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedProduct || maxStock === 0 || isSelectedExpired}
            leftIcon={<Plus className="h-4 w-4" />}
            className="shadow-glow-primary/20"
          >
            Add to Bill
          </Button>
        </div>
      </div>
    </Modal>
  )
}
