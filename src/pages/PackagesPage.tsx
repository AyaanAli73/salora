import React, { useState, useEffect } from 'react'
import {
  Package,
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  CreditCard,
  UserCheck,
  TrendingUp,
  Tag,
  Scissors,
  Trash2,
  DollarSign,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { packageService } from '@/services/packageService'
import { serviceService } from '@/services/serviceService'
import { clientService } from '@/services/clientService'
import {
  ServicePackage,
  ClientPackageWallet,
  PackageDashboardStats,
  PackageItem,
  Service,
  Client,
} from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useToastStore } from '@/store/useToastStore'

export const PackagesPage: React.FC = () => {
  const { addToast } = useToastStore()

  const [activeTab, setActiveTab] = useState<'packages' | 'wallets'>('packages')
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [wallets, setWallets] = useState<ClientPackageWallet[]>([])
  const [allServices, setAllServices] = useState<Service[]>([])
  const [allClients, setAllClients] = useState<Client[]>([])
  const [stats, setStats] = useState<PackageDashboardStats>({
    activePackages: 0,
    totalBundlesSold: 0,
    sessionsRemaining: 0,
    packageRevenue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // Create Package Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    category: 'Hair',
    normalPrice: 2499,
    packagePrice: 1999,
    validityDays: 90,
  })
  const [packageItems, setPackageItems] = useState<PackageItem[]>([
    { serviceId: 'srv-haircut-style', serviceName: 'Hair Cut & Style', quantity: 1, usageLimit: 1 },
    { serviceId: 'srv-facial-hydra', serviceName: 'Hydra-Facial Infusion', quantity: 1, usageLimit: 1 },
  ])

  // Sell Package Modal
  const [isSellModalOpen, setIsSellModalOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedPackageId, setSelectedPackageId] = useState('')
  const [sellPaymentMethod, setSellPaymentMethod] = useState('UPI / QR')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [pkgs, clWallets, dashStats, srvs, cls] = await Promise.all([
        packageService.getAllPackages(),
        packageService.getAllClientWallets(),
        packageService.getDashboardStats(),
        serviceService.getAll(),
        clientService.getAll(),
      ])
      setPackages(pkgs)
      setWallets(clWallets)
      setStats(dashStats)
      setAllServices(srvs)
      setAllClients(cls)
      if (pkgs.length > 0 && !selectedPackageId) {
        setSelectedPackageId(pkgs[0].id)
      }
    } catch (err) {
      console.error('Failed to load packages:', err)
      addToast({
        title: 'Error',
        message: 'Could not load service packages data.',
        type: 'danger',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddItemToForm = () => {
    if (allServices.length === 0) return
    const srv = allServices[0]
    setPackageItems([
      ...packageItems,
      {
        serviceId: srv.id,
        serviceName: srv.name,
        quantity: 1,
        usageLimit: 1,
      },
    ])
  }

  const handleRemoveItemFromForm = (idx: number) => {
    setPackageItems(packageItems.filter((_, i) => i !== idx))
  }

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!packageForm.name.trim() || packageItems.length === 0) {
      addToast({
        title: 'Validation Error',
        message: 'Please provide a package name and at least one service item.',
        type: 'warning',
      })
      return
    }

    try {
      const savings = Math.max(0, packageForm.normalPrice - packageForm.packagePrice)

      await packageService.createPackage({
        name: packageForm.name.trim(),
        description: packageForm.description.trim() || 'Curated treatment pass bundle',
        category: packageForm.category,
        items: packageItems,
        normalPrice: packageForm.normalPrice,
        packagePrice: packageForm.packagePrice,
        savingsAmount: savings,
        validityDays: packageForm.validityDays,
        status: 'active',
        popular: false,
      })

      setIsCreateModalOpen(false)
      loadData()
      addToast({
        title: 'Package Created',
        message: `${packageForm.name} published successfully.`,
        type: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create package'
      addToast({ title: 'Error', message: msg, type: 'danger' })
    }
  }

  const handleSellPackage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId || !selectedPackageId) return

    const client = allClients.find((c) => c.id === selectedClientId)
    if (!client) return

    try {
      await packageService.purchasePackage({
        clientId: client.id,
        clientName: client.fullName,
        packageId: selectedPackageId,
        paymentMethod: sellPaymentMethod,
      })

      setIsSellModalOpen(false)
      loadData()
      addToast({
        title: 'Package Assigned & Credited',
        message: `Package pass credited to ${client.fullName}'s wallet.`,
        type: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sell package'
      addToast({ title: 'Error', message: msg, type: 'danger' })
    }
  }

  // Filtered packages
  const filteredPackages = packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filtered wallets
  const filteredWallets = wallets.filter((w) =>
    w.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Service Packages & Treatment Passes
            </h1>
            <Badge variant="accent">Phase 3 Part 3</Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Bundle multi-session rituals, create prepaid passes, and track customer wallet balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSellModalOpen(true)}
            leftIcon={<UserCheck className="h-4 w-4 text-primary" />}
          >
            Sell Pass
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Package
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Active Packages</span>
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary tabular-nums">
              {stats.activePackages}
            </span>
            <span className="text-xs font-medium text-emerald-600">Active in catalogue</span>
          </div>
        </Card>

        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Total Passes Sold</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary tabular-nums">
              {stats.totalBundlesSold}
            </span>
            <span className="text-xs font-medium text-text-muted">Subscribers</span>
          </div>
        </Card>

        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Sessions in Wallets</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-600 tabular-nums">
              {stats.sessionsRemaining}
            </span>
            <span className="text-xs font-medium text-text-muted">Unredeemed sessions</span>
          </div>
        </Card>

        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Package Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary tabular-nums">
              {formatCurrency(stats.packageRevenue)}
            </span>
            <span className="text-xs font-medium text-text-muted">Prepaid upfront</span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('packages')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'packages'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-muted hover:text-text-primary hover:bg-surface'
            }`}
          >
            Package Catalog ({packages.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wallets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'wallets'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-muted hover:text-text-primary hover:bg-surface'
            }`}
          >
            Customer Wallets & Passes ({wallets.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" />
          <input
            type="text"
            placeholder={activeTab === 'packages' ? 'Search package…' : 'Search customer or pass…'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-surface text-xs focus:ring-1 focus:ring-primary w-48 sm:w-60"
          />
        </div>
      </div>

      {/* TAB 1: PACKAGES CATALOG (Requirement 8 & 9) */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`border transition-all duration-200 ${
                pkg.popular ? 'border-primary/50 ring-1 ring-primary/30 shadow-md' : 'border-border'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-base">{pkg.name}</CardTitle>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {pkg.category} Category
                    </span>
                  </div>
                  <Badge variant="success" size="sm">
                    SAVE {formatCurrency(pkg.savingsAmount)}
                  </Badge>
                </div>

                <div className="mt-3 flex items-baseline justify-between border-y border-border/60 py-3">
                  <div>
                    <span className="text-2xl font-black text-text-primary tabular-nums">
                      {formatCurrency(pkg.packagePrice)}
                    </span>
                    <span className="text-xs text-text-muted line-through ml-2">
                      {formatCurrency(pkg.normalPrice)}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted">Valid {pkg.validityDays} Days</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 text-xs">
                <p className="text-text-muted text-xs leading-relaxed">{pkg.description}</p>

                {/* Included Items with quantity rules (Requirement 9) */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                    Included Sessions & Treatments
                  </span>
                  <div className="space-y-1.5 bg-surface-subtle p-3 rounded-xl border border-border/60">
                    {pkg.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-semibold text-text-primary">{it.serviceName}</span>
                        </div>
                        <span className="text-xs font-bold text-primary tabular-nums">
                          × {it.quantity} {it.usageLimit === 'unlimited' ? '(Unlimited)' : 'uses'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border">
                  <span className="text-[11px] text-text-muted">
                    Total: {pkg.items.reduce((s, i) => s + i.quantity, 0)} sessions
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPackageId(pkg.id)
                      setIsSellModalOpen(true)
                    }}
                    className="text-xs"
                  >
                    Sell to Client
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 2: CUSTOMER PACKAGE WALLET (Requirement 10) */}
      {activeTab === 'wallets' && (
        <Card className="overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-border text-[11px] font-bold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="p-3.5">Client</th>
                  <th className="p-3.5">Package Pass</th>
                  <th className="p-3.5">Remaining Sessions (Wallet)</th>
                  <th className="p-3.5">Valid Until</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Pass ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredWallets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-text-muted">
                      No active package wallets found.
                    </td>
                  </tr>
                ) : (
                  filteredWallets.map((w) => (
                    <tr key={w.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-text-primary block">{w.clientName}</span>
                        <span className="text-[11px] text-text-muted">Purchased on {w.purchaseDate}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-pink-500" />
                          <span className="font-semibold text-text-primary">{w.packageName}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {/* Remaining counters per service: Hair Spa 2/3, Hair Cut 1/2 */}
                        <div className="space-y-1.5 min-w-[200px]">
                          {w.items.map((it, idx) => {
                            const percent = Math.round((it.remainingQuantity / it.totalQuantity) * 100)
                            return (
                              <div key={idx} className="space-y-0.5">
                                <div className="flex justify-between text-[11px]">
                                  <span className="font-medium text-text-primary">{it.serviceName}</span>
                                  <span className="font-bold text-primary tabular-nums">
                                    {it.remainingQuantity} / {it.totalQuantity} left
                                  </span>
                                </div>
                                <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-primary h-full rounded-full transition-all duration-300"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </td>
                      <td className="p-3.5 text-text-muted tabular-nums">
                        {w.expiryDate}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={w.status === 'active' ? 'success' : w.status === 'exhausted' ? 'default' : 'danger'}
                          size="sm"
                        >
                          {w.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right font-mono text-[11px] text-text-muted">
                        #{w.id.slice(-6).toUpperCase()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE PACKAGE MODAL (Requirement 8 & 9) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Service Package"
        description="Bundle multiple salon treatments with custom session quantities and bulk savings."
        size="lg"
      >
        <form onSubmit={handleCreatePackage} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-text-primary block">Package Name</label>
              <Input
                placeholder="e.g. Glow Makeover, Hair Care Pack…"
                value={packageForm.name}
                onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-text-primary block">Category</label>
              <select
                value={packageForm.category}
                onChange={(e) => setPackageForm({ ...packageForm, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary"
              >
                <option value="Hair">Hair Care</option>
                <option value="Makeover">Complete Makeover</option>
                <option value="Bridal">Bridal & Festive</option>
                <option value="Spa">Wellness & Spa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-text-primary block">Standard Value (₹)</label>
              <Input
                type="number"
                min="0"
                value={packageForm.normalPrice}
                onChange={(e) => setPackageForm({ ...packageForm, normalPrice: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-text-primary block">Package Price (₹)</label>
              <Input
                type="number"
                min="0"
                value={packageForm.packagePrice}
                onChange={(e) => setPackageForm({ ...packageForm, packagePrice: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-text-primary block">Validity Period (Days)</label>
              <Input
                type="number"
                min="1"
                max="730"
                value={packageForm.validityDays}
                onChange={(e) => setPackageForm({ ...packageForm, validityDays: parseInt(e.target.value) || 90 })}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-text-primary block">Description</label>
            <textarea
              rows={2}
              placeholder="Bundle description, inclusions, and client guidance…"
              value={packageForm.description}
              onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-border bg-surface text-xs text-text-primary"
            />
          </div>

          {/* Included Services Item Builder (Requirement 9) */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-primary" />
                Package Items & Quantities
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItemToForm}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Add Treatment
              </Button>
            </div>

            <div className="space-y-2">
              {packageItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-surface-subtle">
                  <div className="flex-1">
                    <select
                      value={item.serviceId}
                      onChange={(e) => {
                        const srv = allServices.find((s) => s.id === e.target.value)
                        const updated = [...packageItems]
                        updated[idx] = {
                          ...updated[idx],
                          serviceId: e.target.value,
                          serviceName: srv ? srv.name : updated[idx].serviceName,
                        }
                        setPackageItems(updated)
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-text-primary"
                    >
                      {allServices.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({formatCurrency(s.price)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={item.quantity}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 1
                        const updated = [...packageItems]
                        updated[idx] = { ...updated[idx], quantity: qty, usageLimit: qty }
                        setPackageItems(updated)
                      }}
                      className="text-center"
                      title="Number of sessions"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItemFromForm(idx)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Package
            </Button>
          </div>
        </form>
      </Modal>

      {/* SELL PACKAGE MODAL */}
      <Modal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        title="Sell Package Pass"
        description="Issue a pre-paid service package directly into a client's digital wallet."
        size="md"
      >
        <form onSubmit={handleSellPackage} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-text-primary block">Select Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary"
              required
            >
              <option value="">-- Choose Client --</option>
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-text-primary block">Select Package Bundle</label>
            <select
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary"
              required
            >
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.packagePrice)} (Save {formatCurrency(p.savingsAmount)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-text-primary block">Payment Method</label>
            <select
              value={sellPaymentMethod}
              onChange={(e) => setSellPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary"
            >
              <option value="UPI / QR">UPI / QR Code</option>
              <option value="Credit / Debit Card">Credit / Debit Card</option>
              <option value="Cash">Cash at Desk</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsSellModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Credit to Client Wallet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
