import React, { useState, useEffect } from 'react'
import { ServiceIngredient, Product, Service } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { inventoryService } from '@/services/inventoryService'
import { serviceService } from '@/services/serviceService'
import { useToastStore } from '@/store/useToastStore'
import {
  Sparkles,
  Plus,
  Trash2,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface ServiceIngredientsModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
}

export const ServiceIngredientsModal: React.FC<ServiceIngredientsModalProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  const { addToast } = useToastStore()

  const [services, setServices] = useState<Service[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [ingredients, setIngredients] = useState<
    Omit<ServiceIngredient, 'id' | 'serviceId' | 'serviceName'>[]
  >([])
  const [isSaving, setIsSaving] = useState(false)

  // Load all services
  useEffect(() => {
    serviceService.getAll().then((data) => {
      setServices(data)
      if (data.length > 0 && !selectedServiceId) {
        setSelectedServiceId(data[0].id)
      }
    })
  }, [isOpen])

  // Load ingredients for selected service
  useEffect(() => {
    if (selectedServiceId) {
      const existing = inventoryService.getServiceIngredients(selectedServiceId)
      setIngredients(
        existing.map((e) => ({
          productId: e.productId,
          productName: e.productName,
          quantity: e.quantity,
          unit: e.unit,
        }))
      )
    }
  }, [selectedServiceId])

  const selectedService = services.find((s) => s.id === selectedServiceId)

  const handleAddIngredient = () => {
    const firstProd = products[0]
    if (!firstProd) return
    setIngredients([
      ...ingredients,
      {
        productId: firstProd.id,
        productName: firstProd.name,
        quantity: 10,
        unit: 'ml',
      },
    ])
  }

  const handleUpdateIngredient = (
    index: number,
    field: 'productId' | 'quantity' | 'unit',
    val: any
  ) => {
    const updated = [...ingredients]
    const item = { ...updated[index] }

    if (field === 'productId') {
      const prod = products.find((p) => p.id === val)
      if (prod) {
        item.productId = prod.id
        item.productName = prod.name
      }
    } else if (field === 'quantity') {
      item.quantity = Math.max(1, parseFloat(val) || 1)
    } else if (field === 'unit') {
      item.unit = val
    }

    updated[index] = item
    setIngredients(updated)
  }

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!selectedService) return

    setIsSaving(true)
    try {
      inventoryService.saveServiceIngredients(
        selectedService.id,
        selectedService.name,
        ingredients
      )

      addToast({
        title: 'Consumption Recipe Saved',
        message: `${ingredients.length} product consumable(s) mapped to "${selectedService.name}".`,
        type: 'success',
      })

      onClose()
    } catch {
      addToast({
        title: 'Save Failed',
        message: 'Could not update service ingredients recipe.',
        type: 'danger',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Service Product Consumption Recipes"
      description="Map consumables and backbar product ingredients automatically deducted when salon services are completed."
      size="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Service Selector */}
        <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border space-y-1.5">
          <label className="font-semibold text-text-primary">Target Salon Service Ritual</label>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.categoryName} • {s.duration} min)
              </option>
            ))}
          </select>
        </div>

        {/* Ingredients Mapping Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-text-primary">
              Consumed Ingredients for "{selectedService?.name || 'Service'}"
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddIngredient}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              className="text-xs h-7"
            >
              + Add Ingredient
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {ingredients.length > 0 ? (
              ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-surface border border-border grid grid-cols-12 gap-2 items-center text-xs"
                >
                  <div className="col-span-6 space-y-1">
                    <label className="text-[10px] text-text-muted font-semibold">Product Consumed</label>
                    <select
                      value={ing.productId}
                      onChange={(e) => handleUpdateIngredient(idx, 'productId', e.target.value)}
                      className="w-full h-8 px-2 rounded-lg bg-surface-subtle border border-border text-xs text-text-primary focus:outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3 space-y-1">
                    <label className="text-[10px] text-text-muted font-semibold">Quantity</label>
                    <Input
                      type="number"
                      min={0.5}
                      step="any"
                      value={ing.quantity}
                      onChange={(e) => handleUpdateIngredient(idx, 'quantity', e.target.value)}
                      className="h-8 text-xs font-bold tabular-nums"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] text-text-muted font-semibold">Unit</label>
                    <select
                      value={ing.unit}
                      onChange={(e) => handleUpdateIngredient(idx, 'unit', e.target.value)}
                      className="w-full h-8 px-2 rounded-lg bg-surface-subtle border border-border text-xs text-text-primary focus:outline-none"
                    >
                      <option value="ml">ml</option>
                      <option value="g">g</option>
                      <option value="drops">drops</option>
                      <option value="pcs">pcs</option>
                      <option value="capsule">capsule</option>
                    </select>
                  </div>

                  <div className="col-span-1 flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      className="p-1 rounded-lg text-text-muted hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-text-muted border border-dashed border-border rounded-xl">
                <Sparkles className="h-6 w-6 text-text-muted mx-auto mb-1 opacity-70" />
                <p className="font-semibold text-text-primary">No ingredients mapped</p>
                <p className="text-[11px] text-text-muted">
                  Click "+ Add Ingredient" to map shampoo, spa creams, color tubes or serums consumed in this ritual.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            className="shadow-glow-primary/20"
          >
            {isSaving ? 'Saving…' : 'Save Consumption Recipe'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
