import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  IndianRupee,
  Edit2,
  Eye,
  Power,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Building2,
  ArrowUpRight,
} from 'lucide-react'
import { Supplier } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useToastStore } from '@/store/useToastStore'
import { procurementService } from '@/services/procurementService'
import { SupplierModal } from '@/features/procurement/SupplierModal'
import { CreatePurchaseOrderModal } from '@/features/procurement/CreatePurchaseOrderModal'

export const SuppliersPage: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  // Modals state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [newPOForSupplierId, setNewPOForSupplierId] = useState<string | null>(null)

  const loadSuppliers = () => {
    const list = procurementService.getAllSuppliers()
    setSuppliers(list)
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  const handleToggleStatus = (id: string, name: string) => {
    try {
      const updated = procurementService.toggleSupplierStatus(id)
      addToast({
        title: 'Status Updated',
        message: `${name} is now ${updated.status}.`,
        type: 'info',
      })
      loadSuppliers()
    } catch {
      addToast({ title: 'Error', message: 'Failed to update supplier status.', type: 'danger' })
    }
  }

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(search.toLowerCase())) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
      (s.gstNumber && s.gstNumber.toLowerCase().includes(search.toLowerCase())) ||
      (s.city && s.city.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? s.status === 'ACTIVE' || s.active !== false
        : s.status === 'INACTIVE' || s.active === false

    return matchesSearch && matchesStatus
  })

  // Summary Metrics
  const activeCount = suppliers.filter((s) => s.status === 'ACTIVE' || s.active !== false).length
  const totalPurchasesSum = suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0)
  const totalPendingPayable = suppliers.reduce((sum, s) => sum + (s.pendingAmount || 0), 0)

  return (
    <div className="space-y-6 pb-12">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Supplier Center
            </h1>
            <Badge variant="primary" className="text-xs font-semibold">
              {suppliers.length} Vendors
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Manage authorized distributors, vendor accounts, tax credentials, and outstanding payables.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/purchases">
            <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs">
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              View Purchase Orders
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingSupplier(null)
              setIsSupplierModalOpen(true)
            }}
            className="gap-2 h-9 text-xs"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface shadow-soft border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Active Suppliers</span>
              <div className="h-8 w-8 rounded-lg bg-success/10 text-success flex items-center justify-center">
                <Truck className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-text-primary tabular-nums">
              {activeCount} <span className="text-xs font-normal text-text-muted">/ {suppliers.length} Total</span>
            </div>
            <span className="text-[11px] text-text-muted mt-1 block">Active authorized procurement partners</span>
          </CardContent>
        </Card>

        <Card className="bg-surface shadow-soft border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Total Purchases</span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-text-primary tabular-nums">
              {formatCurrency(totalPurchasesSum)}
            </div>
            <span className="text-[11px] text-text-muted mt-1 block">Cumulative purchase volume across network</span>
          </CardContent>
        </Card>

        <Card className="bg-surface shadow-soft border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-text-muted">Total Accounts Payable</span>
                <span className="block text-[10px] text-danger font-medium">Pending to Suppliers</span>
              </div>
              <div className="h-8 w-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center">
                <IndianRupee className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-danger tabular-nums">
              {formatCurrency(totalPendingPayable)}
            </div>
            <span className="text-[11px] text-text-muted mt-1 block">Current unpaid vendor balances</span>
          </CardContent>
        </Card>

        <Card className="bg-surface shadow-soft border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Avg Credit Terms</span>
              <div className="h-8 w-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-text-primary tabular-nums">
              22 <span className="text-xs font-normal text-text-muted">Days Net</span>
            </div>
            <span className="text-[11px] text-text-muted mt-1 block">Standard vendor settlement window</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-surface border border-border rounded-2xl shadow-soft">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor name, code, contact, GSTIN, city…"
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <span className="text-xs font-semibold text-text-muted mr-1">Status:</span>
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="border border-border rounded-2xl overflow-hidden bg-surface shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle text-text-muted font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-3">Contact Person</th>
                <th className="py-3 px-3">Communication</th>
                <th className="py-3 px-3">Tax / GSTIN</th>
                <th className="py-3 px-3 text-right">Total Purchases</th>
                <th className="py-3 px-3 text-right">Outstanding Due</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
                    No suppliers match your current search criteria.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        to={`/suppliers/${s.id}`}
                        className="font-bold text-text-primary hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        {s.name}
                        <ArrowUpRight className="h-3 w-3 text-text-muted" aria-hidden="true" />
                      </Link>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        Code: <span className="font-semibold text-text-secondary">{s.code}</span> • {s.city || 'Mumbai'}, {s.state || 'India'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-text-primary">{s.contactPerson || 'Vendor Rep'}</div>
                      <div className="text-[11px] text-text-muted">{s.paymentTermsDays || 30}&nbsp;days credit</div>
                    </td>
                    <td className="py-3 px-3 space-y-0.5 text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-text-muted shrink-0" aria-hidden="true" />
                        <span>{s.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Mail className="h-3 w-3 text-text-muted shrink-0" aria-hidden="true" />
                        <span className="truncate max-w-[140px]">{s.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {s.gstNumber ? (
                        <span className="font-mono font-semibold text-text-primary text-[11px] block">
                          {s.gstNumber}
                        </span>
                      ) : (
                        <span className="text-text-muted text-[11px]">—</span>
                      )}
                      {s.pan && (
                        <span className="text-[10px] text-text-muted font-mono block">
                          PAN: {s.pan}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-text-primary tabular-nums">
                      {formatCurrency(s.totalPurchases || 0)}
                      <span className="block text-[10px] text-text-muted font-normal">
                        {s.ordersCount || 0} Orders
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums">
                      {(s.pendingAmount || 0) > 0 ? (
                        <span className="text-danger">{formatCurrency(s.pendingAmount || 0)}</span>
                      ) : (
                        <span className="text-success">₹0.00</span>
                      )}
                      <span className="block text-[10px] text-text-muted font-normal">
                        {(s.pendingAmount || 0) > 0 ? 'Payable Balance' : 'Settled'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {s.status === 'ACTIVE' || s.active !== false ? (
                        <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5">
                          ACTIVE
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px] font-semibold px-2 py-0.5">
                          INACTIVE
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link to={`/suppliers/${s.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs gap-1"
                            title="View Full Supplier Profile"
                          >
                            <Eye className="h-3 w-3" aria-hidden="true" />
                            View
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingSupplier(s)
                            setIsSupplierModalOpen(true)
                          }}
                          className="h-7 w-7 p-0 text-text-muted hover:text-text-primary"
                          title="Edit Profile"
                        >
                          <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setNewPOForSupplierId(s.id)}
                          className="h-7 w-7 p-0 text-text-muted hover:text-primary"
                          title="New Purchase Order"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStatus(s.id, s.name)}
                          className="h-7 w-7 p-0 text-text-muted hover:text-danger"
                          title={s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Create/Edit Modal */}
      {isSupplierModalOpen && (
        <SupplierModal
          isOpen={true}
          onClose={() => {
            setIsSupplierModalOpen(false)
            setEditingSupplier(null)
          }}
          supplier={editingSupplier}
          onSaved={loadSuppliers}
        />
      )}

      {/* New PO for specific supplier */}
      {newPOForSupplierId && (
        <CreatePurchaseOrderModal
          isOpen={true}
          onClose={() => setNewPOForSupplierId(null)}
          initialSupplierId={newPOForSupplierId}
          onCreated={() => {
            setNewPOForSupplierId(null)
            loadSuppliers()
          }}
        />
      )}
    </div>
  )
}
