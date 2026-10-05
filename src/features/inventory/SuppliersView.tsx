import React, { useState } from 'react'
import {
  Truck,
  Plus,
  Phone,
  Mail,
  MapPin,
  FileText,
  Package,
  ShoppingCart,
  IndianRupee,
  Edit2,
  Trash2,
  AlertCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react'
import { Supplier, Product, PurchaseOrder } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Drawer } from '@/components/ui/Drawer'
import { Input } from '@/components/ui/Input'
import { useToastStore } from '@/store/useToastStore'
import { inventoryService } from '@/services/inventoryService'

interface SuppliersViewProps {
  suppliers: Supplier[]
  products: Product[]
  purchases: PurchaseOrder[]
  onSuppliersUpdated: () => void
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  products,
  purchases,
  onSuppliersUpdated,
}) => {
  const { addToast } = useToastStore()

  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Profile Drawer State
  const [profileSupplier, setProfileSupplier] = useState<Supplier | null>(null)

  const handleOpenAdd = () => {
    setEditingSupplier(null)
    setName('')
    setPhone('')
    setEmail('')
    setAddress('')
    setGstNumber('')
    setContactPerson('')
    setNotes('')
    setError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup)
    setName(sup.name)
    setPhone(sup.phone)
    setEmail(sup.email)
    setAddress(sup.address)
    setGstNumber(sup.gstNumber || '')
    setContactPerson(sup.contactPerson || '')
    setNotes(sup.notes || '')
    setError(null)
    setIsModalOpen(true)
  }

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Supplier name is required.')
      return
    }

    if (!phone.trim()) {
      setError('Contact phone number is required.')
      return
    }

    try {
      if (editingSupplier) {
        inventoryService.updateSupplier(editingSupplier.id, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          gstNumber: gstNumber.trim() || undefined,
          contactPerson: contactPerson.trim() || undefined,
          notes: notes.trim() || undefined,
        })
        addToast({
          title: 'Supplier Updated',
          message: `${name} details updated successfully.`,
          type: 'success',
        })
      } else {
        inventoryService.createSupplier({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          gstNumber: gstNumber.trim() || undefined,
          contactPerson: contactPerson.trim() || undefined,
          notes: notes.trim() || undefined,
          active: true,
        })
        addToast({
          title: 'Supplier Added',
          message: `${name} registered as vendor partner.`,
          type: 'success',
        })
      }

      setIsModalOpen(false)
      onSuppliersUpdated()
    } catch (err: any) {
      setError(err.message || 'Could not save supplier.')
    }
  }

  // Profile details for selected supplier
  const supplierProducts = profileSupplier
    ? products.filter((p) => p.supplierId === profileSupplier.id)
    : []

  const supplierPurchases = profileSupplier
    ? purchases.filter((po) => po.supplierId === profileSupplier.id)
    : []

  const totalSpentWithSupplier = supplierPurchases.reduce((sum, po) => sum + po.total, 0)

  return (
    <div className="space-y-4">
      {/* Header and Actions */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Suppliers & Wholesale Distributors</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Manage authorized manufacturer accounts, GST numbers, contact reps and purchase volumes.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            leftIcon={<Plus className="h-4 w-4" />}
            className="shadow-glow-primary/20 text-xs shrink-0"
          >
            + Add Supplier
          </Button>
        </CardContent>
      </Card>

      {/* Suppliers Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((sup) => {
          const matchedPurchases = purchases.filter((po) => po.supplierId === sup.id)
          const matchedProducts = products.filter((p) => p.supplierId === sup.id)
          const totalSpent = matchedPurchases.reduce((sum, po) => sum + po.total, 0)

          return (
            <Card key={sup.id} hoverEffect className="p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-text-primary truncate">{sup.name}</h4>
                      {sup.contactPerson && (
                        <p className="text-[11px] text-text-muted">Rep: {sup.contactPerson}</p>
                      )}
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 shrink-0">
                    Active Vendor
                  </span>
                </div>

                {/* Contact details */}
                <div className="space-y-1 text-xs text-text-secondary pt-1">
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-text-muted shrink-0" />
                    <span className="font-mono">{sup.phone}</span>
                  </p>
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 text-text-muted shrink-0" />
                    <span className="truncate">{sup.email}</span>
                  </p>
                  {sup.gstNumber && (
                    <p className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-text-muted shrink-0" />
                      <span className="font-mono text-[11px] font-bold text-primary">
                        GST: {sup.gstNumber}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Stats Footer & Actions */}
              <div className="pt-3 border-t border-border space-y-2.5">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-surface-subtle border border-border">
                    <span className="text-text-muted block text-[10px]">Catalog SKUs</span>
                    <span className="font-black text-xs text-text-primary">{matchedProducts.length} Items</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-subtle border border-border">
                    <span className="text-text-muted block text-[10px]">Total Orders</span>
                    <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalSpent)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProfileSupplier(sup)}
                    leftIcon={<Eye className="h-3.5 w-3.5" />}
                    className="text-xs h-7"
                  >
                    View Profile
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(sup)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-text-muted hover:text-text-primary" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Add / Edit Supplier Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSupplier ? `Edit Supplier — ${editingSupplier.name}` : 'Add New Supplier'}
          description="Register cosmetic vendors, distributors, and delivery partners."
          size="md"
        >
          <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-text-primary">
                Company / Supplier Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. L'Oréal India Professional"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-text-primary">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98201 12345"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-primary">Contact Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="orders@loreal-pro.in"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-text-primary">Contact Person / Rep</label>
                <Input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Rakesh Shah"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-primary">GST Identification Number</label>
                <Input
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                  placeholder="27AAACL1234F1Z5"
                  className="font-mono uppercase font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-primary">Warehouse / Business Address</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="BKC, Bandra East, Mumbai, Maharashtra 400051"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-text-primary">Account Notes & Terms</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Net-30 payment terms, free freight on orders above ₹20,000"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="shadow-glow-primary/20">
                {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Supplier Profile Drawer (Section 11 Specification) */}
      {profileSupplier && (
        <Drawer
          isOpen={Boolean(profileSupplier)}
          onClose={() => setProfileSupplier(null)}
          title={profileSupplier.name}
          description="Supplier profile, linked products catalog and purchase orders history."
          size="lg"
        >
          <div className="space-y-6 text-xs">
            {/* Contact & GST Card */}
            <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-muted">GST Identification:</span>
                <span className="font-mono font-bold text-primary">
                  {profileSupplier.gstNumber || 'Not registered'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-muted">Contact Phone:</span>
                <span className="font-mono text-text-primary">{profileSupplier.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-muted">Email Address:</span>
                <span className="text-text-primary">{profileSupplier.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-muted">Warehouse Address:</span>
                <span className="text-text-primary text-right max-w-xs">{profileSupplier.address}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border font-bold">
                <span className="text-text-primary">Total Purchases Volume:</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(totalSpentWithSupplier)}
                </span>
              </div>
            </div>

            {/* Supplied Products List */}
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span>Supplied Salon Products ({supplierProducts.length})</span>
              </h4>

              <div className="divide-y divide-border border border-border rounded-xl bg-surface overflow-hidden">
                {supplierProducts.length > 0 ? (
                  supplierProducts.map((p) => (
                    <div key={p.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-text-primary">{p.name}</p>
                        <p className="text-[11px] text-text-muted font-mono">{p.sku} • {p.category}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-text-primary block">
                          Stock: {p.currentStock} {p.unit}s
                        </span>
                        <span className="text-[10px] text-text-muted">
                          Purchase: {formatCurrency(p.purchasePrice)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-6 text-center text-text-muted text-xs">
                    No products currently assigned to this supplier.
                  </p>
                )}
              </div>
            </div>

            {/* Purchase History */}
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-emerald-600" />
                <span>Past Purchase Orders ({supplierPurchases.length})</span>
              </h4>

              <div className="divide-y divide-border border border-border rounded-xl bg-surface overflow-hidden">
                {supplierPurchases.length > 0 ? (
                  supplierPurchases.map((po) => (
                    <div key={po.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-mono font-bold text-primary">{po.purchaseNumber}</p>
                        <p className="text-[11px] text-text-muted">
                          Invoice: {po.invoiceNumber} • Date: {po.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sm text-text-primary tabular-nums block">
                          {formatCurrency(po.total)}
                        </span>
                        <Badge variant="success" size="sm">
                          {po.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-6 text-center text-text-muted text-xs">
                    No past purchase orders found for this supplier.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  )
}
