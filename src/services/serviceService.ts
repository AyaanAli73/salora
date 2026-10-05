import { Service, ServiceCategory, ServiceCategoryType, ServiceFilterParams, ServicePackageItem } from '@/types'
import { firestoreService, SALORA_COLLECTIONS } from './firebase/firestoreService'
import { isFirebaseConfigured } from '@/lib/firebase'

let servicesCache: Service[] = []

const defaultCategories: ServiceCategory[] = [
  { id: 'cat-hair', name: 'Hair', color: 'primary', iconName: 'Scissors' },
  { id: 'cat-skin', name: 'Skin', color: 'accent', iconName: 'Sparkle' },
  { id: 'cat-nail', name: 'Nails', color: 'pink-500', iconName: 'Hand' },
  { id: 'cat-spa', name: 'Spa', color: 'indigo-500', iconName: 'Heart' },
]

export const serviceService = {
  getAllSync(): Service[] {
    return [...servicesCache]
  },

  getAllServices(): Service[] {
    return this.getAllSync()
  },

  async getAll(): Promise<Service[]> {
    if (isFirebaseConfigured) {
      try {
        const firestoreList = await firestoreService.getAll<Service>(SALORA_COLLECTIONS.SERVICES)
        servicesCache = firestoreList
        return firestoreList
      } catch (err) {
        console.warn('[ServiceService] Failed to load services from Firestore:', err)
      }
    }
    return [...servicesCache]
  },

  async getServices(): Promise<Service[]> {
    return this.getAll()
  },

  async getCategories(): Promise<ServiceCategory[]> {
    return [...defaultCategories]
  },

  async getById(id: string): Promise<Service | undefined> {
    if (isFirebaseConfigured) {
      try {
        const doc = await firestoreService.get<Service>(SALORA_COLLECTIONS.SERVICES, id)
        if (doc) return doc
      } catch (err) {
        console.warn(`[ServiceService] Failed to get service #${id}:`, err)
      }
    }
    return servicesCache.find((s) => s.id === id)
  },

  async getFiltered(params: ServiceFilterParams = {}): Promise<Service[]> {
    const all = await this.getAll()
    const {
      search = '',
      category = 'all',
      priceRange = 'all',
      duration = 'all',
      status = 'all',
      onlineBooking = 'all',
      sortBy = 'popularity',
      sortOrder = 'desc',
    } = params

    let result = [...all]

    // 1. Search Query
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q) ||
          (s.categoryName || '').toLowerCase().includes(q)
      )
    }

    // 2. Category Filter
    if (category && category !== 'all') {
      result = result.filter(
        (s) =>
          (s.categoryName || '').toLowerCase() === category.toLowerCase() ||
          s.categoryId === category
      )
    }

    // 3. Price Range Filter
    if (priceRange !== 'all') {
      if (priceRange === 'under-500') {
        result = result.filter((s) => s.price < 500)
      } else if (priceRange === '500-1500') {
        result = result.filter((s) => s.price >= 500 && s.price <= 1500)
      } else if (priceRange === 'above-1500') {
        result = result.filter((s) => s.price > 1500)
      }
    }

    // 4. Duration Filter
    if (duration !== 'all') {
      if (duration === 'under-30') {
        result = result.filter((s) => s.duration < 30)
      } else if (duration === '30-60') {
        result = result.filter((s) => s.duration >= 30 && s.duration <= 60)
      } else if (duration === 'above-60') {
        result = result.filter((s) => s.duration > 60)
      }
    }

    // 5. Status Filter
    if (status !== 'all') {
      const isActive = status === 'active'
      result = result.filter((s) => s.isActive === isActive)
    }

    // 6. Online Booking Filter
    if (onlineBooking !== 'all') {
      const isOnline = onlineBooking === 'online'
      result = result.filter((s) => s.isOnlineBookingEnabled === isOnline)
    }

    // 7. Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'price':
          comparison = a.price - b.price
          break
        case 'duration':
          comparison = a.duration - b.duration
          break
        case 'latest':
          comparison = (a.createdAt || '').localeCompare(b.createdAt || '')
          break
        case 'popularity':
        default:
          comparison = (a.popularityCount || 0) - (b.popularityCount || 0)
          break
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })

    return result
  },

  async create(newService: Partial<Service>): Promise<Service> {
    const serviceId = `srv-${Date.now()}`
    const categoryName: ServiceCategoryType = (newService.categoryName as ServiceCategoryType) || 'Hair'
    const category = defaultCategories.find((c) => c.name === categoryName)

    const service: Service = {
      id: serviceId,
      name: newService.name || 'New Treatment',
      categoryId: category?.id || 'cat-hair',
      categoryName: categoryName,
      description: newService.description || '',
      duration: Number(newService.duration) || 45,
      price: Number(newService.price) || 499,
      discountPrice: newService.discountPrice ? Number(newService.discountPrice) : undefined,
      bufferTime: Number(newService.bufferTime) || 10,
      taxRate: Number(newService.taxRate) || 18,
      imageUrl:
        newService.imageUrl ||
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop&q=80',
      assignedStaffIds: newService.assignedStaffIds || [],
      isActive: newService.isActive ?? true,
      isOnlineBookingEnabled: newService.isOnlineBookingEnabled ?? true,
      requireDeposit: newService.requireDeposit ?? false,
      depositAmount: newService.depositAmount || 0,
      depositType: newService.depositType || 'fixed',
      allowWalkIns: newService.allowWalkIns ?? true,
      showOnWebsite: newService.showOnWebsite ?? true,
      commissionRate: Number(newService.commissionRate) || 40,
      isPackage: newService.isPackage ?? false,
      packageServices: newService.packageServices || [],
      consumedProducts: newService.consumedProducts || [],
      popularityCount: 0,
      totalBookings: 0,
      totalRevenue: 0,
      averageRating: 5.0,
      reviewCount: 0,
      cancellationRate: 0,
      popularityTrend: [],
      reviews: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }

    if (isFirebaseConfigured) {
      try {
        await firestoreService.set<Service>(SALORA_COLLECTIONS.SERVICES, serviceId, service)
      } catch (err) {
        console.warn('[ServiceService] Failed to create service in Firestore:', err)
      }
    }

    servicesCache.unshift(service)
    return service
  },

  async update(id: string, updates: Partial<Service>): Promise<Service> {
    const existing = await this.getById(id)
    if (!existing) throw new Error(`Service ${id} not found`)

    let categoryId = updates.categoryId || existing.categoryId
    if (updates.categoryName) {
      const cat = defaultCategories.find((c) => c.name === updates.categoryName)
      if (cat) categoryId = cat.id
    }

    const updated: Service = {
      ...existing,
      ...updates,
      categoryId,
      updatedAt: new Date().toISOString().split('T')[0],
    }

    if (isFirebaseConfigured) {
      try {
        await firestoreService.update<Service>(SALORA_COLLECTIONS.SERVICES, id, updated)
      } catch (err) {
        console.warn(`[ServiceService] Failed to update service #${id} in Firestore:`, err)
      }
    }

    const index = servicesCache.findIndex((s) => s.id === id)
    if (index !== -1) {
      servicesCache[index] = updated
    } else {
      servicesCache.unshift(updated)
    }

    return updated
  },

  async duplicate(id: string): Promise<Service> {
    const original = await this.getById(id)
    if (!original) throw new Error(`Service ${id} not found`)

    return this.create({
      ...original,
      name: `${original.name} (Copy)`,
    })
  },

  async delete(id: string): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        await firestoreService.delete(SALORA_COLLECTIONS.SERVICES, id)
      } catch (err) {
        console.warn(`[ServiceService] Failed to delete service #${id} from Firestore:`, err)
      }
    }
    servicesCache = servicesCache.filter((s) => s.id !== id)
  },

  async toggleActive(id: string): Promise<Service> {
    const s = await this.getById(id)
    if (!s) throw new Error(`Service ${id} not found`)
    return this.update(id, { isActive: !s.isActive })
  },
}
