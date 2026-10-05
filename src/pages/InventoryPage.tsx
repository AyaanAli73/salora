import React, { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Package,
  Plus,
  ArrowLeftRight,
  ShoppingCart,
  Truck,
  Sparkles,
  LayoutDashboard,
  AlertTriangle,
} from 'lucide-react'
import {
  Product,
  StockMovement,
  Supplier,
  PurchaseOrder,
  InventoryStats,
} from '@/types'
import { inventoryService } from '@/services/inventoryService'
import { useToastStore } from '@/store/useToastStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  InventorySubNav,
  InventoryDashboardView,
  ProductsCatalogView,
  StockMovementsView,
  PurchasesView,
  SuppliersView,
  AddEditProductModal,
  StockAdjustmentModal,
  ServiceIngredientsModal,
} from '@/features/inventory'
import { InterBranchTransfersView } from '@/features/inventory/InterBranchTransfersView'

export const InventoryPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  // Data state
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalInventoryValue: 0,
    expiringCount: 0,
  })
  const [expiringList, setExpiringList] = useState<{
    product: Product
    daysRemaining: number
    status: 'expired' | 'critical' | 'warning'
  }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals state
  const [isAddEditProductOpen, setIsAddEditProductOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [isStockAdjustmentOpen, setIsStockAdjustmentOpen] = useState(false)
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null)

  const [isServiceIngredientsOpen, setIsServiceIngredientsOpen] = useState(false)

  // Load all inventory data
  const loadData = async () => {
    try {
      const [prods, sups, statsData, expData] = await Promise.all([
        inventoryService.getAll(),
        Promise.resolve(inventoryService.getSuppliers()),
        inventoryService.getInventoryStats(),
        inventoryService.getExpiringProducts(30),
      ])

      setProducts(prods)
      setSuppliers(sups)
      setMovements(inventoryService.getMovements())
      setPurchases(inventoryService.getPurchases())
      setCategories(inventoryService.getCategories())
      setStats(statsData)
      setExpiringList(expData)
    } catch (err) {
      console.error('Failed to load inventory data:', err)
      addToast({
        title: 'Inventory Sync Error',
        message: 'Could not load inventory records.',
        type: 'danger',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Derived low-stock products
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.active && p.currentStock <= p.minimumStock)
  }, [products])

  // Top selling retail products (derived from movements or default high-turnover SKUs)
  const topSellingProducts = useMemo(() => {
    const saleMovements = movements.filter((m) => m.type === 'sale')
    const salesByProd: Record<string, { product: Product; unitsSold: number; revenue: number }> = {}

    saleMovements.forEach((m) => {
      const prod = products.find((p) => p.id === m.productId)
      if (prod) {
        const units = Math.abs(m.quantity)
        if (!salesByProd[prod.id]) {
          salesByProd[prod.id] = { product: prod, unitsSold: 0, revenue: 0 }
        }
        salesByProd[prod.id].unitsSold += units
        salesByProd[prod.id].revenue += units * prod.sellingPrice
      }
    })

    const list = Object.values(salesByProd).sort((a, b) => b.unitsSold - a.unitsSold)
    if (list.length > 0) return list.slice(0, 5)

    // Fallback display top retail SKUs
    return products.slice(0, 4).map((p, idx) => ({
      product: p,
      unitsSold: 12 - idx * 2,
      revenue: (12 - idx * 2) * p.sellingPrice,
    }))
  }, [movements, products])

  // Modal Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null)
    setIsAddEditProductOpen(true)
  }

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod)
    setIsAddEditProductOpen(true)
  }

  const handleDuplicateProduct = async (prod: Product) => {
    try {
      const dup = await inventoryService.duplicate(prod.id)
      await loadData()
      addToast({
        title: 'Product Duplicated',
        message: `Created duplicate #${dup.sku} from ${prod.name}.`,
        type: 'info',
      })
    } catch {
      addToast({
        title: 'Duplicate Failed',
        message: 'Could not duplicate product.',
        type: 'danger',
      })
    }
  }

  const handleArchiveProduct = async (prod: Product) => {
    if (window.confirm(`Archive "${prod.name}"? It will no longer be available for retail sale.`)) {
      await inventoryService.archive(prod.id)
      await loadData()
      addToast({
        title: 'Product Archived',
        message: `${prod.name} has been archived.`,
        type: 'warning',
      })
    }
  }

  const handleOpenQuickAdjustment = (prod?: Product) => {
    setAdjustingProduct(prod || null)
    setIsStockAdjustmentOpen(true)
  }

  // Active view determination
  const currentPath = location.pathname
  const isProductsView = currentPath === '/inventory/products'
  const isStockView = currentPath === '/inventory/stock'
  const isPurchasesView = currentPath === '/inventory/purchases'
  const isSuppliersView = currentPath === '/inventory/suppliers'
  const isTransfersView = currentPath === '/inventory/transfers'
  const isDashboardView =
    !isProductsView && !isStockView && !isPurchasesView && !isSuppliersView && !isTransfersView

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Unified Inventory Sub-Navigation Bar */}
      <InventorySubNav
        lowStockCount={stats.lowStockCount + stats.outOfStockCount}
        expiringCount={stats.expiringCount}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
              {isDashboardView
                ? 'Inventory & Stock Management'
                : isProductsView
                ? 'Product Catalog & Stock'
                : isStockView
                ? 'Stock Movements & Adjustments'
                : isPurchasesView
                ? 'Purchases & Receiving'
                : isTransfersView
                ? 'Inter-Branch Stock Transfers'
                : 'Suppliers & Distributors'}
            </h1>
            <Badge variant="primary" size="sm">
              Live Stock
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Manage backbar salon consumables, retail hair & beauty cosmetics, purchase orders, and supplier logistics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Stock Adjustment */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenQuickAdjustment()}
            leftIcon={<ArrowLeftRight className="h-4 w-4 text-primary" />}
            className="text-xs"
          >
            Adjust Stock
          </Button>

          {/* Service Recipes */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsServiceIngredientsOpen(true)}
            leftIcon={<Sparkles className="h-4 w-4 text-teal-600" />}
            className="text-xs"
          >
            Service Recipes
          </Button>

          {/* Add Product */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddProduct}
            leftIcon={<Plus className="h-4 w-4" />}
            className="shadow-glow-primary/30 text-xs"
          >
            + Add Product
          </Button>
        </div>
      </div>

      {/* Subpage View Switcher */}
      {isDashboardView && (
        <InventoryDashboardView
          stats={stats}
          lowStockProducts={lowStockProducts}
          expiringProducts={expiringList}
          recentMovements={movements}
          topSellingProducts={topSellingProducts}
          onOpenAddProduct={handleOpenAddProduct}
          onOpenQuickAdjustment={handleOpenQuickAdjustment}
        />
      )}

      {isProductsView && (
        <ProductsCatalogView
          products={products}
          suppliers={suppliers}
          categories={categories}
          onOpenAddProduct={handleOpenAddProduct}
          onOpenEditProduct={handleOpenEditProduct}
          onOpenDuplicateProduct={handleDuplicateProduct}
          onOpenQuickAdjustment={handleOpenQuickAdjustment}
          onArchiveProduct={handleArchiveProduct}
          onOpenServiceIngredients={() => setIsServiceIngredientsOpen(true)}
        />
      )}

      {isStockView && (
        <StockMovementsView
          movements={movements}
          products={products}
          onOpenQuickAdjustment={() => handleOpenQuickAdjustment()}
        />
      )}

      {isPurchasesView && (
        <PurchasesView
          purchases={purchases}
          suppliers={suppliers}
          products={products}
          onPurchasesUpdated={loadData}
        />
      )}

      {isSuppliersView && (
        <SuppliersView
          suppliers={suppliers}
          products={products}
          purchases={purchases}
          onSuppliersUpdated={loadData}
        />
      )}

      {isTransfersView && <InterBranchTransfersView />}

      {/* GLOBAL INVENTORY MODALS */}

      {/* 1. Add / Edit Product Modal */}
      {isAddEditProductOpen && (
        <AddEditProductModal
          isOpen={isAddEditProductOpen}
          onClose={() => setIsAddEditProductOpen(false)}
          product={editingProduct}
          suppliers={suppliers}
          categories={categories}
          onSaved={loadData}
        />
      )}

      {/* 2. Stock Adjustment Modal */}
      {isStockAdjustmentOpen && (
        <StockAdjustmentModal
          isOpen={isStockAdjustmentOpen}
          onClose={() => setIsStockAdjustmentOpen(false)}
          product={adjustingProduct}
          products={products}
          onAdjusted={loadData}
        />
      )}

      {/* 3. Service Ingredients / Recipe Mapping Modal */}
      {isServiceIngredientsOpen && (
        <ServiceIngredientsModal
          isOpen={isServiceIngredientsOpen}
          onClose={() => setIsServiceIngredientsOpen(false)}
          products={products}
        />
      )}
    </div>
  )
}
