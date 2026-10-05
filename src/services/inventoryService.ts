import {
  Product,
  StockMovement,
  StockMovementType,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchasePaymentStatus,
  ServiceIngredient,
  InventoryStats,
} from '@/types'
import { auditLogService } from './auditLogService'
import { useToastStore } from '@/store/useToastStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { firestoreService, SALORA_COLLECTIONS } from '@/services/firebase/firestoreService'
import { isFirebaseConfigured } from '@/lib/firebase'

const STORAGE_KEYS = {
  PRODUCTS: 'SALORA_inventory_products',
  MOVEMENTS: 'SALORA_inventory_stock_movements',
  SUPPLIERS: 'SALORA_inventory_suppliers',
  PURCHASES: 'SALORA_inventory_purchases',
  SERVICE_INGREDIENTS: 'SALORA_inventory_service_ingredients',
  CATEGORIES: 'SALORA_inventory_custom_categories',
}

// Clean old prototype demo records from localStorage
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS)
    if (raw && (raw.includes("L'Oréal") || raw.includes('prod-1') || raw.includes('Wella'))) {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS)
      localStorage.removeItem(STORAGE_KEYS.MOVEMENTS)
      localStorage.removeItem(STORAGE_KEYS.SUPPLIERS)
      localStorage.removeItem(STORAGE_KEYS.PURCHASES)
      localStorage.removeItem(STORAGE_KEYS.SERVICE_INGREDIENTS)
    }
  } catch {}
}

export const DEFAULT_PRODUCT_CATEGORIES = [
  'Shampoo',
  'Conditioner',
  'Hair Color',
  'Hair Care',
  'Skin Care',
  'Face Care',
  'Wax',
  'Nail Care',
  'Makeup',
  'Tools',
  'Consumables',
  'Retail',
]

// Production data starts completely empty — no fake mock products
const INITIAL_SUPPLIERS: Supplier[] = []
const INITIAL_PRODUCTS: Product[] = []
const INITIAL_MOVEMENTS: StockMovement[] = []
const INITIAL_SERVICE_INGREDIENTS: ServiceIngredient[] = []
const INITIAL_PURCHASES: PurchaseOrder[] = []

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn(`Could not read storage key "${key}":`, err)
  }
  localStorage.setItem(key, JSON.stringify(defaultValue))
  return defaultValue
}

function saveStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn(`Could not save storage key "${key}":`, err)
  }
}

function normalizeProduct(p: any): Product {
  const currentStock = p.currentStock !== undefined ? Number(p.currentStock) : (p.stockQuantity !== undefined ? Number(p.stockQuantity) : 0)
  const minimumStock = p.minimumStock !== undefined ? Number(p.minimumStock) : (p.lowStockThreshold !== undefined ? Number(p.lowStockThreshold) : 5)
  const purchasePrice = p.purchasePrice !== undefined ? Number(p.purchasePrice) : (p.costPrice !== undefined ? Number(p.costPrice) : 0)
  const sellingPrice = p.sellingPrice !== undefined ? Number(p.sellingPrice) : (p.price !== undefined ? Number(p.price) : 0)

  let status: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock'
  if (currentStock <= 0) status = 'out-of-stock'
  else if (currentStock <= minimumStock) status = 'low-stock'

  return {
    ...p,
    currentStock,
    minimumStock,
    purchasePrice,
    sellingPrice,
    stockQuantity: currentStock,
    lowStockThreshold: minimumStock,
    costPrice: purchasePrice,
    price: sellingPrice,
    status,
    active: p.active !== undefined ? Boolean(p.active) : true,
    supplierName: p.supplierName || p.supplier || 'Direct Wholesale',
    supplier: p.supplier || p.supplierName || 'Direct Wholesale',
  }
}

export const inventoryService = {
  // ==========================================
  // PRODUCTS CRUD
  // ==========================================
  getAllSync(): Product[] {
    const raw = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS)
    return raw.map(normalizeProduct)
  },

  getAllProducts(_branchFilter?: string): Product[] {
    return this.getAllSync()
  },

  adjustBranchStock(productId: string, _branchId: string, delta: number): Product | null {
    const list = this.getAllSync()
    const product = list.find((p) => p.id === productId)
    if (!product) return null
    product.currentStock = Math.max(0, product.currentStock + delta)
    product.stockQuantity = product.currentStock
    return product
  },

  async getAll(): Promise<Product[]> {
    if (isFirebaseConfigured) {
      try {
        const records = await firestoreService.getAll<Product>(SALORA_COLLECTIONS.PRODUCTS)
        if (records && records.length > 0) {
          saveStored(STORAGE_KEYS.PRODUCTS, records)
          return records.map(normalizeProduct)
        }
      } catch (err) {
        console.warn('[inventoryService.getAll] Firestore fetch warning:', err)
      }
    }
    const raw = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS)
    return raw.map(normalizeProduct)
  },

  async getById(id: string): Promise<Product | null> {
    const list = await this.getAll()
    return list.find((p) => p.id === id) || null
  },

  async getByBarcode(barcode: string): Promise<Product | null> {
    if (!barcode.trim()) return null
    const list = await this.getAll()
    const clean = barcode.trim().toLowerCase()
    return list.find((p) => (p.barcode || '').toLowerCase() === clean || p.sku.toLowerCase() === clean) || null
  },

  async create(data: Omit<Product, 'id'>): Promise<Product> {
    const list = await this.getAll()
    const id = `prod-${Date.now()}`
    const normalized = normalizeProduct({
      ...data,
      id,
    })

    const updated = [normalized, ...list]
    saveStored(STORAGE_KEYS.PRODUCTS, updated)

    if (isFirebaseConfigured) {
      firestoreService.set(SALORA_COLLECTIONS.PRODUCTS, normalized.id, normalized).catch((err) => {
        console.error('[inventoryService.create] Firestore error:', err)
      })
    }

    // Record initial stock movement if openingStock > 0
    if (normalized.currentStock > 0) {
      this.recordMovement({
        productId: normalized.id,
        productName: normalized.name,
        sku: normalized.sku,
        type: 'stock_in',
        quantity: normalized.currentStock,
        reason: 'Opening stock count',
        createdBy: 'Owner',
        previousStock: 0,
        newStock: normalized.currentStock,
      })
    }

    return normalized
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const list = await this.getAll()
    const index = list.findIndex((p) => p.id === id)
    if (index === -1) throw new Error(`Product #${id} not found`)

    const current = list[index]
    const updatedProduct = normalizeProduct({
      ...current,
      ...updates,
    })

    list[index] = updatedProduct
    saveStored(STORAGE_KEYS.PRODUCTS, list)

    if (isFirebaseConfigured) {
      firestoreService.update(SALORA_COLLECTIONS.PRODUCTS, id, updates).catch((err) => {
        console.error('[inventoryService.update] Firestore error:', err)
      })
    }

    return updatedProduct
  },

  async duplicate(id: string): Promise<Product> {
    const current = await this.getById(id)
    if (!current) throw new Error(`Product #${id} not found`)

    const duplicated: Omit<Product, 'id'> = {
      ...current,
      name: `${current.name} (Copy)`,
      sku: `${current.sku}-COPY-${Math.floor(100 + Math.random() * 900)}`,
      barcode: undefined,
      currentStock: 0,
      stockQuantity: 0,
    }

    return this.create(duplicated)
  },

  async archive(id: string): Promise<Product> {
    return this.update(id, { active: false })
  },

  async restore(id: string): Promise<Product> {
    return this.update(id, { active: true })
  },

  async delete(id: string): Promise<void> {
    const list = await this.getAll()
    const filtered = list.filter((p) => p.id !== id)
    saveStored(STORAGE_KEYS.PRODUCTS, filtered)

    if (isFirebaseConfigured) {
      firestoreService.delete(SALORA_COLLECTIONS.PRODUCTS, id).catch((err) => {
        console.error('[inventoryService.delete] Firestore error:', err)
      })
    }
  },

  // ==========================================
  // STOCK MOVEMENTS & ADJUSTMENTS
  // ==========================================
  getMovements(): StockMovement[] {
    return getStored<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS)
  },

  recordMovement(params: {
    productId: string
    productName: string
    sku: string
    type: StockMovementType
    quantity: number
    reason: string
    referenceId?: string
    createdBy: string
    previousStock: number
    newStock: number
  }): StockMovement {
    const movements = this.getMovements()
    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...params,
    }

    saveStored(STORAGE_KEYS.MOVEMENTS, [movement, ...movements])

    if (isFirebaseConfigured) {
      firestoreService.set(SALORA_COLLECTIONS.INVENTORY_MOVEMENTS, movement.id, movement).catch((err) => {
        console.error('[inventoryService.recordMovement] Firestore error:', err)
      })
    }

    return movement
  },

  async adjustStock(params: {
    productId: string
    type: StockMovementType
    quantity: number
    reason: string
    referenceId?: string
    createdBy?: string
  }): Promise<{ product: Product; movement: StockMovement }> {
    const { productId, type, quantity, reason, referenceId, createdBy = 'Owner' } = params
    const product = await this.getById(productId)
    if (!product) throw new Error(`Product ${productId} not found`)

    let delta = quantity
    if (['stock_out', 'damaged', 'expired', 'returned', 'sale', 'service_consumption'].includes(type)) {
      delta = -Math.abs(quantity)
    } else if (type === 'stock_in') {
      delta = Math.abs(quantity)
    }

    const previousStock = product.currentStock
    const newStock = Math.max(0, previousStock + delta)

    const updatedProduct = await this.update(productId, {
      currentStock: newStock,
      stockQuantity: newStock,
    })

    const movement = this.recordMovement({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type,
      quantity: delta,
      reason: reason.trim(),
      referenceId,
      createdBy,
      previousStock,
      newStock,
    })

    useToastStore.getState().addToast({
      title: 'Product stock updated.',
      message: `${product.name}: ${previousStock} → ${newStock} units (${type.replace('_', ' ')}).`,
      type: 'info',
    })

    auditLogService.log({
      action: 'INVENTORY_ADJUSTMENT',
      entityType: 'inventory',
      entityId: product.id,
      performedBy: createdBy,
      userRole: 'owner',
      details: `Stock adjustment for ${product.name} (${product.sku}): ${delta > 0 ? '+' + delta : delta} units (${reason}).`,
      metadata: { previousStock, newStock, type, referenceId },
    })

    if (newStock <= updatedProduct.minimumStock) {
      const isOut = newStock === 0
      useNotificationStore.getState().addNotification({
        type: 'INVENTORY',
        title: isOut ? `Out of Stock: ${product.name}` : `Low Stock Alert: ${product.name}`,
        message: isOut
          ? `${product.name} is completely out of stock. Immediate reorder required.`
          : `${product.name} has only ${newStock} units left (below minimum of ${updatedProduct.minimumStock}).`,
        priority: isOut ? 'urgent' : 'high',
        relatedId: product.id,
        targetRole: 'owner',
        actionUrl: '/inventory/products',
      })
    }

    return { product: updatedProduct, movement }
  },

  async updateStock(id: string, delta: number): Promise<Product> {
    const product = await this.getById(id)
    if (!product) throw new Error(`Product ${id} not found`)

    const type: StockMovementType = delta >= 0 ? 'stock_in' : 'stock_out'
    const result = await this.adjustStock({
      productId: id,
      type,
      quantity: Math.abs(delta),
      reason: delta >= 0 ? 'Manual shelf increment' : 'Manual shelf decrement',
      createdBy: 'Owner',
    })
    return result.product
  },

  // ==========================================
  // AUTOMATIC DEDUCTION ON RETAIL SALE
  // ==========================================
  async deductFromSale(params: {
    productId: string
    quantity: number
    invoiceNumber: string
    cashierName?: string
  }): Promise<Product> {
    const { productId, quantity, invoiceNumber, cashierName = 'Owner' } = params
    const product = await this.getById(productId)
    if (!product) throw new Error(`Product ${productId} not found`)

    const result = await this.adjustStock({
      productId,
      type: 'sale',
      quantity,
      reason: `Retail sale checkout — #${invoiceNumber}`,
      referenceId: invoiceNumber,
      createdBy: cashierName,
    })

    return result.product
  },

  // ==========================================
  // SERVICE CONSUMPTION ARCHITECTURE
  // ==========================================
  getAllServiceIngredients(): ServiceIngredient[] {
    return getStored<ServiceIngredient[]>(STORAGE_KEYS.SERVICE_INGREDIENTS, INITIAL_SERVICE_INGREDIENTS)
  },

  getServiceIngredients(serviceId: string): ServiceIngredient[] {
    const all = this.getAllServiceIngredients()
    return all.filter((item) => item.serviceId === serviceId)
  },

  saveServiceIngredients(
    serviceId: string,
    serviceName: string,
    ingredients: Omit<ServiceIngredient, 'id' | 'serviceId' | 'serviceName'>[]
  ): ServiceIngredient[] {
    const all = this.getAllServiceIngredients().filter((item) => item.serviceId !== serviceId)
    const newItems: ServiceIngredient[] = ingredients.map((ing) => ({
      id: `si-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      serviceId,
      serviceName,
      productId: ing.productId,
      productName: ing.productName,
      quantity: ing.quantity,
      unit: ing.unit,
    }))

    const updated = [...all, ...newItems]
    saveStored(STORAGE_KEYS.SERVICE_INGREDIENTS, updated)
    return newItems
  },

  async consumeForService(
    serviceId: string,
    serviceName: string,
    referenceId: string
  ): Promise<StockMovement[]> {
    const ingredients = this.getServiceIngredients(serviceId)
    if (ingredients.length === 0) return []

    const movements: StockMovement[] = []
    for (const ing of ingredients) {
      try {
        const product = await this.getById(ing.productId)
        if (!product) continue

        const deductQty = ing.quantity >= 100 ? Math.ceil(ing.quantity / 500) : 1

        const res = await this.adjustStock({
          productId: ing.productId,
          type: 'service_consumption',
          quantity: deductQty,
          reason: `Consumed in ${serviceName} (${ing.quantity} ${ing.unit})`,
          referenceId,
          createdBy: 'Specialist',
        })
        movements.push(res.movement)
      } catch (err) {
        console.warn(`Could not consume ${ing.productName} for ${serviceName}:`, err)
      }
    }
    return movements
  },

  // ==========================================
  // SUPPLIERS
  // ==========================================
  getSuppliers(): Supplier[] {
    return getStored<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS)
  },

  getSupplierById(id: string): Supplier | null {
    const list = this.getSuppliers()
    return list.find((s) => s.id === id) || null
  },

  createSupplier(data: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
    const list = this.getSuppliers()
    const newSup: Supplier = {
      ...data,
      id: `sup-${Date.now()}`,
      createdAt: new Date().toISOString(),
      active: true,
      productCount: 0,
      totalPurchases: 0,
    }
    saveStored(STORAGE_KEYS.SUPPLIERS, [newSup, ...list])
    return newSup
  },

  updateSupplier(id: string, updates: Partial<Supplier>): Supplier {
    const list = this.getSuppliers()
    const index = list.findIndex((s) => s.id === id)
    if (index === -1) throw new Error(`Supplier #${id} not found`)
    list[index] = { ...list[index], ...updates }
    saveStored(STORAGE_KEYS.SUPPLIERS, list)
    return list[index]
  },

  deleteSupplier(id: string): void {
    const list = this.getSuppliers().filter((s) => s.id !== id)
    saveStored(STORAGE_KEYS.SUPPLIERS, list)
  },

  // ==========================================
  // PURCHASES & STOCK RECEIVING
  // ==========================================
  getPurchases(): PurchaseOrder[] {
    return getStored<PurchaseOrder[]>(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES)
  },

  async createPurchase(
    data: Omit<PurchaseOrder, 'id' | 'purchaseNumber' | 'poNumber' | 'orderDate' | 'paymentStatus'> & {
      poNumber?: string
      orderDate?: string
      paymentStatus?: PurchasePaymentStatus
    },
    autoReceive: boolean = true
  ): Promise<PurchaseOrder> {
    const purchases = this.getPurchases()
    const purchaseNumber = data.poNumber || `PO-${new Date().getFullYear()}-${String(purchases.length + 1).padStart(3, '0')}`
    const newOrder: PurchaseOrder = {
      ...data,
      id: `po-${Date.now()}`,
      purchaseNumber,
      poNumber: purchaseNumber,
      orderDate: data.orderDate || data.date || new Date().toISOString().split('T')[0],
      paymentStatus: data.paymentStatus || (autoReceive ? 'PAID' : 'UNPAID'),
      status: autoReceive ? 'RECEIVED' : 'PENDING',
      receivedAt: autoReceive ? new Date().toISOString() : undefined,
      receivedBy: autoReceive ? (data.receivedBy || 'Owner') : undefined,
    }

    saveStored(STORAGE_KEYS.PURCHASES, [newOrder, ...purchases])

    if (autoReceive) {
      for (const item of newOrder.items) {
        try {
          await this.adjustStock({
            productId: item.productId,
            type: 'stock_in',
            quantity: item.quantity,
            reason: `PO Received #${newOrder.purchaseNumber} (${newOrder.invoiceNumber})`,
            referenceId: newOrder.purchaseNumber,
            createdBy: newOrder.receivedBy || 'Owner',
          })
        } catch (err) {
          console.warn(`Could not add purchase stock for ${item.productName}:`, err)
        }
      }
    }

    return newOrder
  },

  async receivePurchase(id: string, receivedBy: string = 'Owner'): Promise<PurchaseOrder> {
    const purchases = this.getPurchases()
    const index = purchases.findIndex((p) => p.id === id)
    if (index === -1) throw new Error(`Purchase order #${id} not found`)

    const current = purchases[index]
    if (current.status === 'RECEIVED') return current

    const updatedOrder: PurchaseOrder = {
      ...current,
      status: 'RECEIVED',
      receivedAt: new Date().toISOString(),
      receivedBy,
    }

    purchases[index] = updatedOrder
    saveStored(STORAGE_KEYS.PURCHASES, purchases)

    for (const item of updatedOrder.items) {
      await this.adjustStock({
        productId: item.productId,
        type: 'stock_in',
        quantity: item.quantity,
        reason: `PO Received #${updatedOrder.purchaseNumber} (${updatedOrder.invoiceNumber})`,
        referenceId: updatedOrder.purchaseNumber,
        createdBy: receivedBy,
      })
    }

    return updatedOrder
  },

  // ==========================================
  // LOW STOCK, EXPIRY & STATS
  // ==========================================
  async getLowStock(): Promise<Product[]> {
    const list = await this.getAll()
    return list.filter((p) => p.active && p.currentStock <= p.minimumStock)
  },

  isExpired(expiryDate?: string): boolean {
    if (!expiryDate) return false
    const exp = new Date(expiryDate).getTime()
    return exp <= Date.now()
  },

  async getExpiringProducts(days: number = 30): Promise<{
    product: Product
    daysRemaining: number
    status: 'expired' | 'critical' | 'warning'
  }[]> {
    const list = await this.getAll()
    const now = Date.now()
    const results: {
      product: Product
      daysRemaining: number
      status: 'expired' | 'critical' | 'warning'
    }[] = []

    for (const p of list) {
      if (!p.expiryDate || !p.active) continue
      const expTime = new Date(p.expiryDate).getTime()
      const diffMs = expTime - now
      const daysRemaining = Math.ceil(diffMs / 86400000)

      if (daysRemaining <= 0) {
        results.push({ product: p, daysRemaining: 0, status: 'expired' })
      } else if (daysRemaining <= 7) {
        results.push({ product: p, daysRemaining, status: 'critical' })
      } else if (daysRemaining <= days) {
        results.push({ product: p, daysRemaining, status: 'warning' })
      }
    }

    return results.sort((a, b) => a.daysRemaining - b.daysRemaining)
  },

  async getInventoryStats(): Promise<InventoryStats> {
    const list = await this.getAll()
    const activeProducts = list.filter((p) => p.active)

    const totalProducts = activeProducts.length
    const lowStockCount = activeProducts.filter(
      (p) => p.currentStock > 0 && p.currentStock <= p.minimumStock
    ).length
    const outOfStockCount = activeProducts.filter((p) => p.currentStock === 0).length

    const totalInventoryValue = activeProducts.reduce(
      (sum, p) => sum + p.currentStock * p.purchasePrice,
      0
    )

    const expiring = await this.getExpiringProducts(30)
    const expiringCount = expiring.length

    return {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      expiringCount,
    }
  },

  // Custom Categories
  getCategories(): string[] {
    const stored = getStored<string[]>(STORAGE_KEYS.CATEGORIES, [])
    const set = new Set([...DEFAULT_PRODUCT_CATEGORIES, ...stored])
    return Array.from(set)
  },

  addCategory(category: string): string[] {
    if (!category.trim()) return this.getCategories()
    const stored = getStored<string[]>(STORAGE_KEYS.CATEGORIES, [])
    const clean = category.trim()
    if (!stored.includes(clean)) {
      stored.push(clean)
      saveStored(STORAGE_KEYS.CATEGORIES, stored)
    }
    return this.getCategories()
  },
}
