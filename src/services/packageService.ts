import { ServicePackage, ClientPackageWallet, PackageDashboardStats } from '@/types'
import { auditLogService } from './auditLogService'

const PACKAGES_STORAGE_KEY = 'SALORA_service_packages_v1'
const CLIENT_WALLETS_KEY = 'SALORA_client_package_wallets_v1'

// Clear mock records from localStorage if present
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(PACKAGES_STORAGE_KEY)
    if (raw && raw.includes('MOCK_')) {
      localStorage.removeItem(PACKAGES_STORAGE_KEY)
      localStorage.removeItem(CLIENT_WALLETS_KEY)
    }
  } catch {}
}

function getStoredPackages(): ServicePackage[] {
  try {
    const raw = localStorage.getItem(PACKAGES_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed to load service packages from storage:', err)
  }
  return []
}

function savePackages(packages: ServicePackage[]) {
  try {
    localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages))
  } catch (err) {
    console.warn('Failed to save service packages to storage:', err)
  }
}

function getStoredWallets(): ClientPackageWallet[] {
  try {
    const raw = localStorage.getItem(CLIENT_WALLETS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed to load client package wallets from storage:', err)
  }
  return []
}

function saveWallets(wallets: ClientPackageWallet[]) {
  try {
    localStorage.setItem(CLIENT_WALLETS_KEY, JSON.stringify(wallets))
  } catch (err) {
    console.warn('Failed to save client package wallets to storage:', err)
  }
}

export const packageService = {
  async getAllPackages(): Promise<ServicePackage[]> {
    return getStoredPackages()
  },

  async getPackageById(id: string): Promise<ServicePackage | undefined> {
    const pkgs = getStoredPackages()
    return pkgs.find((p) => p.id === id)
  },

  async createPackage(data: Omit<ServicePackage, 'id' | 'createdAt'>): Promise<ServicePackage> {
    const packages = getStoredPackages()
    const newPkg: ServicePackage = {
      ...data,
      id: `pkg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    packages.unshift(newPkg)
    savePackages(packages)

    auditLogService.log({
      action: 'PACKAGE_CREATED',
      entityType: 'service',
      entityId: newPkg.id,
      performedBy: 'Salon Manager',
      userRole: 'manager',
      details: `Created new service package: ${newPkg.name} (₹${newPkg.packagePrice} saving ₹${newPkg.savingsAmount})`,
      amount: newPkg.packagePrice,
    })

    return newPkg
  },

  async updatePackage(id: string, updates: Partial<ServicePackage>): Promise<ServicePackage> {
    const packages = getStoredPackages()
    const idx = packages.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error('Package not found')

    const updated = { ...packages[idx], ...updates }
    packages[idx] = updated
    savePackages(packages)
    return updated
  },

  async deletePackage(id: string): Promise<boolean> {
    const packages = getStoredPackages()
    const filtered = packages.filter((p) => p.id !== id)
    savePackages(filtered)
    return true
  },

  async getAllClientWallets(): Promise<ClientPackageWallet[]> {
    return getStoredWallets()
  },

  async getClientWallets(clientId: string): Promise<ClientPackageWallet[]> {
    const wallets = getStoredWallets()
    return wallets.filter((w) => w.clientId === clientId)
  },

  async purchasePackage(params: {
    clientId: string
    clientName: string
    packageId: string
    paymentMethod: string
  }): Promise<ClientPackageWallet> {
    const pkg = await this.getPackageById(params.packageId)
    if (!pkg) throw new Error('Package not found')

    const now = new Date()
    const expiry = new Date(now)
    expiry.setDate(expiry.getDate() + (pkg.validityDays || 90))

    const newWallet: ClientPackageWallet = {
      id: `cpw-${Date.now()}`,
      clientId: params.clientId,
      clientName: params.clientName,
      packageId: pkg.id,
      packageName: pkg.name,
      purchaseDate: now.toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
      status: 'active',
      pricePaid: pkg.packagePrice,
      invoiceId: `INV-${Date.now().toString().slice(-6)}`,
      createdAt: now.toISOString(),
      items: pkg.items.map((it) => ({
        serviceId: it.serviceId,
        serviceName: it.serviceName,
        totalQuantity: it.quantity,
        remainingQuantity: it.quantity,
        usedQuantity: 0,
      })),
    }

    const wallets = getStoredWallets()
    wallets.unshift(newWallet)
    saveWallets(wallets)

    auditLogService.log({
      action: 'PACKAGE_PURCHASED',
      entityType: 'payment',
      entityId: newWallet.id,
      performedBy: params.clientName,
      userRole: 'customer',
      details: `Purchased package pass: ${pkg.name} for ₹${pkg.packagePrice} via ${params.paymentMethod}.`,
      amount: pkg.packagePrice,
    })

    return newWallet
  },

  /**
   * Decreases remaining session count by 1 after successful treatment
   */
  async consumeWalletSession(walletId: string, serviceId: string): Promise<{ success: boolean; remaining: number }> {
    const wallets = getStoredWallets()
    const idx = wallets.findIndex((w) => w.id === walletId)
    if (idx === -1) return { success: false, remaining: 0 }

    const wallet = wallets[idx]
    const itemIdx = wallet.items.findIndex(
      (it) => it.serviceId === serviceId || it.serviceName.toLowerCase() === serviceId.toLowerCase()
    )
    if (itemIdx === -1) return { success: false, remaining: 0 }

    const item = wallet.items[itemIdx]
    if (item.remainingQuantity <= 0) {
      return { success: false, remaining: 0 }
    }

    const newRemaining = item.remainingQuantity - 1
    const newUsed = item.usedQuantity + 1

    const updatedItems = [...wallet.items]
    updatedItems[itemIdx] = {
      ...item,
      remainingQuantity: newRemaining,
      usedQuantity: newUsed,
    }

    // Check if whole package is exhausted
    const allExhausted = updatedItems.every((it) => it.remainingQuantity <= 0)

    wallets[idx] = {
      ...wallet,
      items: updatedItems,
      status: allExhausted ? 'exhausted' : wallet.status,
    }

    saveWallets(wallets)
    return { success: true, remaining: newRemaining }
  },

  async getDashboardStats(): Promise<PackageDashboardStats> {
    const packages = getStoredPackages()
    const wallets = getStoredWallets()

    const activePackages = packages.filter((p) => p.status === 'active').length
    const totalBundlesSold = wallets.length
    const packageRevenue = wallets.reduce((acc, w) => acc + (w.pricePaid || 0), 0)

    const sessionsRemaining = wallets.reduce((acc, w) => {
      const remainingInWallet = w.items.reduce((s, it) => s + (it.remainingQuantity || 0), 0)
      return acc + remainingInWallet
    }, 0)

    return {
      activePackages,
      totalBundlesSold,
      sessionsRemaining,
      packageRevenue,
    }
  },
}
