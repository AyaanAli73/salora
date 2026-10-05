import React, { useState, useEffect } from 'react'
import { Product, Supplier } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DEFAULT_PRODUCT_CATEGORIES, inventoryService } from '@/services/inventoryService'
import { useToastStore } from '@/store/useToastStore'
import { formatCurrency } from '@/utils/formatters'
import {
  Package,
  Barcode,
  Layers,
  IndianRupee,
  Calendar,
  Building,
  Sparkles,
  AlertCircle,
  Plus,
} from 'lucide-react'

interface AddEditProductModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Product | null
  suppliers: Supplier[]
  categories: string[]
  onSaved: (product: Product) => void
}

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  suppliers,
  categories,
  onSaved,
}) => {
  const { addToast } = useToastStore()
  const isEditing = Boolean(product)

  // Form State
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Hair Care')
  const [customCategory, setCustomCategory] = useState('')
  const [isAddingCustomCat, setIsAddingCustomCat] = useState(false)
  const [sku, setSku] = useState('')
  const [barcode, setBarcode] = useState('')
  const [unit, setUnit] = useState('Bottle')
  const [purchasePrice, setPurchasePrice] = useState<number>(500)
  const [sellingPrice, setSellingPrice] = useState<number>(850)
  const [currentStock, setCurrentStock] = useState<number>(10)
  const [minimumStock, setMinimumStock] = useState<number>(3)
  const [supplierId, setSupplierId] = useState<string>('')
  const [batchNumber, setBatchNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [active, setActive] = useState(true)

  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Populate form if editing
  useEffect(() => {
    if (product) {
      setName(product.name)
      setCategory(product.category)
      setSku(product.sku)
      setBarcode(product.barcode || '')
      setUnit(product.unit || 'Bottle')
      setPurchasePrice(product.purchasePrice)
      setSellingPrice(product.sellingPrice)
      setCurrentStock(product.currentStock)
      setMinimumStock(product.minimumStock)
      setSupplierId(product.supplierId || '')
      setBatchNumber(product.batchNumber || '')
      setExpiryDate(product.expiryDate || '')
      setActive(product.active !== undefined ? product.active : true)
    } else {
      // Default new product values
      setName('')
      setCategory('Hair Care')
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`)
      setBarcode(`890${Math.floor(1000000000 + Math.random() * 9000000000)}`)
      setUnit('Bottle')
      setPurchasePrice(500)
      setSellingPrice(850)
      setCurrentStock(10)
      setMinimumStock(3)
      setSupplierId(suppliers.length > 0 ? suppliers[0].id : '')
      setBatchNumber(`LOT-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`)
      // Default expiry 18 months from now
      const exp = new Date()
      exp.setMonth(exp.getMonth() + 18)
      setExpiryDate(exp.toISOString().split('T')[0])
      setActive(true)
    }
    setError(null)
  }, [product, suppliers, isOpen])

  const handleGenerateSku = () => {
    const prefix = name
      ? name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD')
      : 'SKU'
    setSku(`${prefix}-${Math.floor(1000 + Math.random() * 9000)}`)
  }

  const handleGenerateBarcode = () => {
    setBarcode(`890${Math.floor(1000000000 + Math.random() * 9000000000)}`)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Product name is required.')
      return
    }

    if (!sku.trim()) {
      setError('Product SKU is required for barcode and inventory tracking.')
      return
    }

    if (purchasePrice < 0 || sellingPrice < 0) {
      setError('Prices cannot be negative.')
      return
    }

    if (currentStock < 0 || minimumStock < 0) {
      setError('Stock counts cannot be negative.')
      return
    }

    setIsSaving(true)
    try {
      const selectedCat = isAddingCustomCat && customCategory.trim()
        ? customCategory.trim()
        : category

      // If new custom category, register it
      if (isAddingCustomCat && customCategory.trim()) {
        inventoryService.addCategory(customCategory.trim())
      }

      const selectedSup = suppliers.find((s) => s.id === supplierId)

      const productPayload = {
        name: name.trim(),
        category: selectedCat,
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim() || undefined,
        unit: unit.trim() || 'Unit',
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        currentStock: Number(currentStock),
        minimumStock: Number(minimumStock),
        supplierId: selectedSup?.id,
        supplierName: selectedSup?.name || 'Direct Wholesale',
        batchNumber: batchNumber.trim() || undefined,
        expiryDate: expiryDate.trim() || undefined,
        active,
        // Compatibility
        price: Number(sellingPrice),
        costPrice: Number(purchasePrice),
        stockQuantity: Number(currentStock),
        lowStockThreshold: Number(minimumStock),
        status: (Number(currentStock) <= 0 ? 'out-of-stock' : Number(currentStock) <= Number(minimumStock) ? 'low-stock' : 'in-stock') as any,
        supplier: selectedSup?.name,
      }

      let result: Product
      if (isEditing && product) {
        result = await inventoryService.update(product.id, productPayload)
        addToast({
          title: 'Product Updated',
          message: `${result.name} updated successfully.`,
          type: 'success',
        })
      } else {
        result = await inventoryService.create(productPayload)
        addToast({
          title: 'Product Created',
          message: `${result.name} added to salon catalog.`,
          type: 'success',
        })
      }

      onSaved(result)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Could not save product.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Product — ${product?.name}` : 'Add New Salon Product'}
      description="Create retail cosmetic products or professional consumable backbar treatments."
      size="lg"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Name & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="font-semibold text-text-primary">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. L'Oréal Serie Expert Absolut Repair Shampoo (500ml)"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-text-primary">Category</label>
              <button
                type="button"
                onClick={() => setIsAddingCustomCat(!isAddingCustomCat)}
                className="text-[11px] text-primary hover:underline font-semibold"
              >
                {isAddingCustomCat ? '← Select Standard' : '+ Custom Category'}
              </button>
            </div>

            {isAddingCustomCat ? (
              <Input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category name (e.g. Beard Care)"
                autoFocus
              />
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* 2. SKU, Barcode & Unit */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-text-primary">
                SKU Code <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateSku}
                className="text-[10px] text-primary hover:underline font-bold"
              >
                Generate
              </button>
            </div>
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="e.g. LOR-AR-500"
              className="font-mono uppercase font-bold"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-text-primary">Barcode / EAN</label>
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="text-[10px] text-primary hover:underline font-bold"
              >
                Generate
              </button>
            </div>
            <Input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="e.g. 8901234500012"
              className="font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-text-primary">Packaging Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
            >
              <option value="Bottle">Bottle</option>
              <option value="Tube">Tube</option>
              <option value="Jar">Jar</option>
              <option value="Tin">Tin</option>
              <option value="Pack">Pack</option>
              <option value="Box">Box</option>
              <option value="Dropper">Dropper</option>
              <option value="Pcs">Pcs</option>
              <option value="ml">ml (Milliliters)</option>
              <option value="g">g (Grams)</option>
            </select>
          </div>
        </div>

        {/* 3. Pricing & Stock Counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 p-3 rounded-2xl bg-surface-subtle border border-border">
          <div className="space-y-1">
            <label className="font-semibold text-text-secondary">Purchase Price (₹)</label>
            <Input
              type="number"
              min={0}
              step="any"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
              className="font-bold tabular-nums"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-text-primary">Selling / Retail Price (₹)</label>
            <Input
              type="number"
              min={0}
              step="any"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
              className="font-black text-primary tabular-nums"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-text-primary">Opening Stock</label>
            <Input
              type="number"
              min={0}
              value={currentStock}
              onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
              className="font-bold tabular-nums"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-text-secondary">Min Safety Threshold</label>
            <Input
              type="number"
              min={0}
              value={minimumStock}
              onChange={(e) => setMinimumStock(parseInt(e.target.value) || 0)}
              className="font-bold tabular-nums text-amber-600"
              required
            />
          </div>
        </div>

        {/* 4. Supplier, Batch & Expiry Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="space-y-1">
            <label className="font-semibold text-text-primary">Assigned Supplier</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
            >
              <option value="">-- Direct Wholesale / General --</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-text-primary">Batch Number</label>
            <Input
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g. LOT-2026-B10"
              className="font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-text-primary">Expiry Date</label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>

        {/* Margin Preview Pill */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px]">
          <span className="text-text-muted">Calculated Retail Margin:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(Math.max(0, sellingPrice - purchasePrice))} profit/unit (
            {purchasePrice > 0 ? Math.round(((sellingPrice - purchasePrice) / purchasePrice) * 100) : 0}% markup)
          </span>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSaving}
            className="shadow-glow-primary/20"
          >
            {isSaving ? 'Saving…' : isEditing ? 'Update Product' : 'Add to Inventory'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
