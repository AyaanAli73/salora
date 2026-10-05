import React, { useState, useMemo, useEffect } from 'react'
import { Service, Staff } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { Badge } from '@/components/ui/Badge'
import { serviceService } from '@/services/serviceService'
import { staffService } from '@/services/staffService'
import { formatCurrency } from '@/utils/formatters'
import { Scissors, Clock, Plus, Check } from 'lucide-react'

interface AddServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onAddService: (service: Service, quantity: number, staffId?: string, staffName?: string) => void
  defaultStaffId?: string
}

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
  onAddService,
  defaultStaffId,
}) => {
  const [services, setServices] = useState<Service[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [staffId, setStaffId] = useState(defaultStaffId || '')

  useEffect(() => {
    if (isOpen) {
      serviceService.getAll().then((s) => {
        setServices(s || [])
        if (s && s.length > 0 && !selectedService) {
          setSelectedService(s[0])
        }
      }).catch(() => {})

      staffService.getAll().then((st) => {
        setStaffList(st || [])
        if (st && st.length > 0 && !staffId) {
          setStaffId(st[0].id)
        }
      }).catch(() => {})
    }
  }, [isOpen])

  // Categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(services.map((s) => s.categoryName)))
    return ['all', ...cats]
  }, [services])

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (selectedCategory !== 'all' && s.categoryName !== selectedCategory) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = s.name.toLowerCase().includes(q)
        const matchesCat = s.categoryName.toLowerCase().includes(q)
        if (!matchesName && !matchesCat) return false
      }
      return true
    })
  }, [services, searchQuery, selectedCategory])

  const selectedStaff = useMemo(() => {
    return staffList.find((st) => st.id === staffId) || staffList[0] || null
  }, [staffId, staffList])

  const handleConfirm = () => {
    if (!selectedService) return
    onAddService(
      selectedService,
      quantity,
      selectedStaff?.id || undefined,
      selectedStaff?.name || undefined
    )
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Salon Service"
      description="Select salon ritual to append to the customer bill."
      size="lg"
    >
      <div className="space-y-4">
        {/* Search & Category Filter */}
        <div className="space-y-2.5">
          <SearchInput
            placeholder="Search service by name or category…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface-subtle border border-border text-text-muted hover:text-text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid / List */}
        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 border border-border rounded-xl p-2 bg-surface-subtle/30">
          {filteredServices.length > 0 ? (
            filteredServices.map((srv) => {
              const isSelected = selectedService?.id === srv.id
              return (
                <div
                  key={srv.id}
                  onClick={() => setSelectedService(srv)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 text-text-primary shadow-xs ring-1 ring-primary/30'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      <Scissors className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-text-primary truncate">{srv.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-text-muted mt-0.5">
                        <span className="capitalize">{srv.categoryName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 tabular-nums">
                          <Clock className="h-3 w-3" />
                          {srv.duration} mins
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-sm text-text-primary tabular-nums">
                      {formatCurrency(srv.price)}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-8 text-center text-xs text-text-muted">
              No services match your search filter.
            </div>
          )}
        </div>

        {/* Quantity & Specialist Selection */}
        {selectedService && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-subtle border border-border text-xs">
            {/* Quantity */}
            <div className="space-y-1">
              <label className="font-semibold text-text-secondary">Quantity</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg border border-border bg-surface flex items-center justify-center font-bold hover:bg-surface-hover"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-sm tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg border border-border bg-surface flex items-center justify-center font-bold hover:bg-surface-hover"
                >
                  +
                </button>
                <span className="text-[11px] text-text-muted ml-1">
                  = {formatCurrency(selectedService.price * quantity)}
                </span>
              </div>
            </div>

            {/* Specialist Assignment */}
            <div className="space-y-1">
              <label className="font-semibold text-text-secondary">Assigned Specialist</label>
              <select
                aria-label="Assigned Specialist"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full h-8 px-2 rounded-lg bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                {staffList.length === 0 ? (
                  <option value="">No staff added yet</option>
                ) : (
                  staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedService}
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
