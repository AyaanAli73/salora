import React, { useState, useEffect, useCallback } from 'react'
import { Plus, PackageCheck, Layers, Sparkles } from 'lucide-react'
import { serviceService } from '@/services/serviceService'
import { Service, ServiceCategory, ServiceFilterParams } from '@/types'
import {
  ServiceGrid,
  ServiceFilters,
  ServiceForm,
  PackageForm,
} from '@/features/services'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/useToastStore'

export const ServicesPage: React.FC = () => {
  const { addToast } = useToastStore()

  // Data state
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals & Drawers
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false)

  // Filters state
  const [filters, setFilters] = useState<ServiceFilterParams>({
    search: '',
    category: 'all',
    priceRange: 'all',
    duration: 'all',
    status: 'all',
    onlineBooking: 'all',
    sortBy: 'popularity',
    sortOrder: 'desc',
  })

  // Load services and categories from service layer
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [cats, filteredServices] = await Promise.all([
        serviceService.getCategories(),
        serviceService.getFiltered(filters),
      ])
      setCategories(cats)
      setServices(filteredServices)
    } catch (err) {
      console.error('Failed to load services:', err)
      addToast({
        title: 'Error',
        message: 'Could not load services from catalog.',
        type: 'danger',
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters, addToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Compute category counts
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat.name] = services.filter((s) => s.categoryName === cat.name).length
    return acc
  }, {} as Record<string, number>)

  // Handlers
  const handleFilterChange = (updates: Partial<ServiceFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      priceRange: 'all',
      duration: 'all',
      status: 'all',
      onlineBooking: 'all',
      sortBy: 'popularity',
      sortOrder: 'desc',
    })
  }

  // Create Service
  const handleCreateService = async (data: Partial<Service>) => {
    try {
      const created = await serviceService.create(data)
      addToast({
        title: 'Service Created',
        message: `${created.name} was added to the treatment catalog.`,
        type: 'success',
      })
      loadData()
    } catch {
      addToast({
        title: 'Creation Failed',
        message: 'Could not create new service.',
        type: 'danger',
      })
    }
  }

  // Update Service
  const handleUpdateService = async (data: Partial<Service>) => {
    if (!editingService) return
    try {
      const updated = await serviceService.update(editingService.id, data)
      addToast({
        title: 'Service Updated',
        message: `${updated.name} has been updated.`,
        type: 'success',
      })
      setEditingService(null)
      loadData()
    } catch {
      addToast({
        title: 'Update Failed',
        message: 'Could not save service changes.',
        type: 'danger',
      })
    }
  }

  // Duplicate Service
  const handleDuplicateService = async (id: string) => {
    try {
      const duplicate = await serviceService.duplicate(id)
      addToast({
        title: 'Service Duplicated',
        message: `Created duplicate copy: ${duplicate.name}.`,
        type: 'success',
      })
      loadData()
    } catch {
      addToast({
        title: 'Duplicate Failed',
        message: 'Could not duplicate service.',
        type: 'danger',
      })
    }
  }

  // Toggle Active
  const handleToggleActive = async (id: string) => {
    try {
      const updated = await serviceService.toggleActive(id)
      addToast({
        title: updated.isActive ? 'Service Activated' : 'Service Deactivated',
        message: `${updated.name} is now ${updated.isActive ? 'active' : 'inactive'}.`,
        type: 'info',
      })
      loadData()
    } catch {
      addToast({
        title: 'Status Update Failed',
        message: 'Could not change active status.',
        type: 'danger',
      })
    }
  }

  // Delete Service
  const handleDeleteService = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await serviceService.delete(id)
        addToast({
          title: 'Service Deleted',
          message: 'The service has been removed from your treatment menu.',
          type: 'info',
        })
        loadData()
      } catch {
        addToast({
          title: 'Delete Failed',
          message: 'Could not delete service.',
          type: 'danger',
        })
      }
    }
  }

  // Create Package
  const handleCreatePackage = async (data: Partial<Service>) => {
    try {
      const created = await serviceService.create(data)
      addToast({
        title: 'Package Created',
        message: `${created.name} bundle created with special pricing.`,
        type: 'success',
      })
      loadData()
    } catch {
      addToast({
        title: 'Package Creation Failed',
        message: 'Could not create package bundle.',
        type: 'danger',
      })
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-sans">
            Services
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Manage your salon services, pricing, duration and availability.
          </p>
        </div>

        {/* Top buttons: Add Service & Create Package */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsPackageModalOpen(true)}
            leftIcon={<PackageCheck className="h-4 w-4 text-accent" />}
          >
            Create Package
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddServiceOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
            className="shadow-glow-primary/40 font-semibold"
          >
            Add Service
          </Button>
        </div>
      </div>

      {/* 2. Category Navigation Tabs/Pills & Search / Filters */}
      <ServiceFilters
        filters={filters}
        categories={categories}
        categoryCounts={categoryCounts}
        totalCount={services.length}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Service Grid */}
      <ServiceGrid
        services={services}
        isLoading={isLoading}
        onEdit={(service) => setEditingService(service)}
        onDuplicate={handleDuplicateService}
        onToggleActive={handleToggleActive}
        onDelete={handleDeleteService}
        onAddService={() => setIsAddServiceOpen(true)}
        currency="INR"
      />

      {/* 4. Add Service Drawer */}
      <ServiceForm
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        onSubmit={handleCreateService}
      />

      {/* 5. Edit Service Drawer */}
      <ServiceForm
        isOpen={Boolean(editingService)}
        onClose={() => setEditingService(null)}
        onSubmit={handleUpdateService}
        initialData={editingService}
      />

      {/* 6. Create Package Drawer */}
      <PackageForm
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        existingServices={services}
        onSubmit={handleCreatePackage}
        currency="INR"
      />
    </div>
  )
}
