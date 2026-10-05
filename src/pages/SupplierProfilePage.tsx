import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Truck,
  Phone,
  Mail,
  MapPin,
  FileText,
  IndianRupee,
  Package,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
  Upload,
  Download,
  ExternalLink,
  Edit2,
  Plus,
  Clock,
  Landmark,
} from 'lucide-react'
import { Supplier, PurchaseOrder, Product } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToastStore } from '@/store/useToastStore'
import { procurementService } from '@/services/procurementService'
import { inventoryService } from '@/services/inventoryService'
import { SupplierModal } from '@/features/procurement/SupplierModal'
import { CreatePurchaseOrderModal } from '@/features/procurement/CreatePurchaseOrderModal'
import { UploadSupplierDocModal } from '@/features/procurement/UploadSupplierDocModal'

export const SupplierProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [suppliedProducts, setSuppliedProducts] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'orders' | 'payables' | 'documents'
  >('overview')

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPOModalOpen, setIsPOModalOpen] = useState(false)
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false)

  const loadData = () => {
    if (!id) return
    const sup = procurementService.getSupplierById(id)
    if (!sup) {
      addToast({ title: 'Not Found', message: 'Supplier profile not found.', type: 'danger' })
      navigate('/suppliers')
      return
    }

    setSupplier(sup)

    // Load POs for this supplier
    const allPOs = procurementService.getAllPurchaseOrders()
    const pos = allPOs.filter((po) => po.supplierId === id)
    setPurchaseOrders(pos)

    // Load products supplied
    const allProds = inventoryService.getAllSync()
    const prods = allProds.filter((p) => p.supplierId === id || p.supplier === sup.name)
    setSuppliedProducts(prods)
  }

  useEffect(() => {
    loadData()
  }, [id])

  if (!supplier) {
    return (
      <div className="py-12 text-center text-text-muted text-xs">
        Loading supplier profile…
      </div>
    )
  }

  const pendingPayable = supplier.pendingAmount || 0
  const totalPurchases = supplier.totalPurchases || 0
  const paidAmount = supplier.paidAmount || 0
  const productsCount = suppliedProducts.length || supplier.productCount || 0

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/suppliers">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0" title="Back to Supplier Center">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                {supplier.name}
              </h1>
              <Badge variant={supplier.status === 'ACTIVE' || supplier.active ? 'success' : 'default'} className="text-xs">
                {supplier.status || 'ACTIVE'}
              </Badge>
              {supplier.code && (
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-surface-subtle border border-border text-text-muted">
                  {supplier.code}
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Authorized salon vendor • Contact: <strong>{supplier.contactPerson || 'Vendor Rep'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadDocOpen(true)}
            className="gap-1.5 h-9 text-xs"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            Upload Document
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="gap-1.5 h-9 text-xs"
          >
            <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
            Edit Profile
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsPOModalOpen(true)}
            className="gap-2 h-9 text-xs"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface shadow-soft border-border">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-text-muted block">Total Purchases</span>
            <div className="mt-2 text-2xl font-bold text-text-primary tabular-nums">
              {formatCurrency(totalPurchases)}
            </div>
            <span className="text-[11px] text-text-muted mt-1 block">
              {purchaseOrders.length} Purchase Orders issued
            </span>
          </CardContent>
        </Card>

        <Card className="bg-surface shadow-soft border-border">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-text-muted">Pending Payable</span>
              <span className="text-[10px] text-danger font-semibold uppercase">Accounts Payable</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-danger tabular-nums">
              {formatCurrency(pendingPayable)}
            </div>
            <span className="text-[11px] text-text-muted mt-1 block">
              {pendingPayable > 0 ? 'Due under vendor credit terms' : 'Zero outstanding balance'}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-surface shadow-soft border-border">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-text-muted block">Settled / Paid Amount</span>
            <div className="mt-2 text-2xl font-bold text-success tabular-nums">
              {formatCurrency(paidAmount)}
            </div>
            <span className="text-[11px] text-text-muted mt-1 block">
              Verified electronic disbursements
            </span>
          </CardContent>
        </Card>

        <Card className="bg-surface shadow-soft border-border">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-text-muted block">Products Supplied</span>
            <div className="mt-2 text-2xl font-bold text-text-primary tabular-nums">
              {productsCount} <span className="text-xs font-normal text-text-muted">Catalog Lines</span>
            </div>
            <span className="text-[11px] text-text-muted mt-1 block">
              Active stock SKUs mapped to supplier
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-subtle border border-border rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Vendor Overview & Tax Info' },
          { id: 'products', label: `Products Supplied (${productsCount})` },
          { id: 'orders', label: `Purchase Orders (${purchaseOrders.length})` },
          { id: 'payables', label: 'Payment Ledger & Invoices' },
          { id: 'documents', label: `Documents (${supplier.documents?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-surface text-primary shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Profile */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact & Address */}
          <Card className="bg-surface shadow-soft border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-text-primary">
                Communication & Registered Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 bg-surface-subtle rounded-xl">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="block text-text-primary font-semibold">Registered Office:</strong>
                  <span className="text-text-secondary mt-0.5 block leading-relaxed">
                    {supplier.address}
                    <br />
                    {supplier.city}, {supplier.state} — {supplier.pincode}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-surface-subtle rounded-xl flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                  <div>
                    <span className="block text-[10px] text-text-muted">Telephone / Mobile</span>
                    <strong className="text-text-primary font-semibold">{supplier.phone}</strong>
                  </div>
                </div>

                <div className="p-3 bg-surface-subtle rounded-xl flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                  <div>
                    <span className="block text-[10px] text-text-muted">Orders & Supply Email</span>
                    <strong className="text-text-primary font-semibold truncate block max-w-[180px]">
                      {supplier.email}
                    </strong>
                  </div>
                </div>
              </div>

              {supplier.notes && (
                <div className="p-3 bg-surface-subtle rounded-xl">
                  <span className="block text-[10px] text-text-muted font-semibold uppercase">Procurement Notes:</span>
                  <p className="text-text-secondary mt-1 italic">{supplier.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tax Information & Banking Details */}
          <Card className="bg-surface shadow-soft border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-text-primary">
                Tax Information & Settlement Bank
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface-subtle rounded-xl">
                  <span className="text-[10px] text-text-muted block">GSTIN / Tax ID</span>
                  <strong className="text-sm font-mono font-bold text-text-primary block mt-1">
                    {supplier.gstNumber || 'Unregistered'}
                  </strong>
                </div>
                <div className="p-3 bg-surface-subtle rounded-xl">
                  <span className="text-[10px] text-text-muted block">Income Tax PAN</span>
                  <strong className="text-sm font-mono font-bold text-text-primary block mt-1">
                    {supplier.pan || 'N/A'}
                  </strong>
                </div>
              </div>

              {/* Bank Details */}
              <div className="p-3.5 bg-surface-subtle border border-border rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                  <Landmark className="h-4 w-4" aria-hidden="true" />
                  <span>Authorized Disbursement Account</span>
                </div>
                {supplier.bankDetails ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-text-muted">Bank:</span>{' '}
                      <strong className="text-text-primary">{supplier.bankDetails.bankName}</strong>
                    </div>
                    <div>
                      <span className="text-text-muted">Account #:</span>{' '}
                      <strong className="font-mono text-text-primary">{supplier.bankDetails.accountNumber}</strong>
                    </div>
                    <div>
                      <span className="text-text-muted">IFSC Code:</span>{' '}
                      <strong className="font-mono text-text-primary">{supplier.bankDetails.ifscCode}</strong>
                    </div>
                    <div>
                      <span className="text-text-muted">Credit Terms:</span>{' '}
                      <strong className="text-text-primary">{supplier.paymentTermsDays || 30} Days Net</strong>
                    </div>
                  </div>
                ) : (
                  <div className="text-text-muted text-[11px] pt-1">
                    No bank account configured. Settlements made via manual cheques or UPI.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Products Supplied */}
      {activeTab === 'products' && (
        <Card className="bg-surface shadow-soft border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-text-primary">
              Products Sourced from {supplier.name}
            </CardTitle>
            <CardDescription className="text-xs text-text-muted">
              Live inventory levels and purchase pricing for mapped items
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle text-text-muted font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Global Stock</th>
                    <th className="py-2.5 px-3 text-right">Last Purchase Price</th>
                    <th className="py-2.5 px-3 text-right">Selling Price</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {suppliedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-text-muted">
                        No catalog products currently mapped to this supplier.
                      </td>
                    </tr>
                  ) : (
                    suppliedProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-text-primary">
                          {p.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-text-muted">
                          {p.sku}
                        </td>
                        <td className="py-2.5 px-3 text-text-secondary">
                          {p.category}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold tabular-nums">
                          {p.currentStock}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-text-primary tabular-nums">
                          {formatCurrency(p.costPrice || p.purchasePrice || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-text-secondary tabular-nums">
                          {formatCurrency(p.price || p.sellingPrice || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge
                            variant={
                              p.status === 'in-stock'
                                ? 'success'
                                : p.status === 'low-stock'
                                ? 'warning'
                                : 'danger'
                            }
                            className="text-[10px] font-semibold uppercase"
                          >
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Purchase Orders */}
      {activeTab === 'orders' && (
        <Card className="bg-surface shadow-soft border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-text-primary">
                  Purchase Order History
                </CardTitle>
                <CardDescription className="text-xs text-text-muted">
                  Requisitions and delivery tracking for {supplier.name}
                </CardDescription>
              </div>
              <Button size="sm" variant="primary" onClick={() => setIsPOModalOpen(true)} className="h-8 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                New Purchase Order
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle text-text-muted font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">PO Number</th>
                    <th className="py-2.5 px-3">Salon Location</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Expected Delivery</th>
                    <th className="py-2.5 px-3 text-right">Order Amount</th>
                    <th className="py-2.5 px-3 text-center">Consignment Status</th>
                    <th className="py-2.5 px-3 text-center">Payment Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-text-muted">
                        No purchase orders recorded for this supplier.
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => (
                      <tr key={po.id} className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-text-primary">
                          <Link to={`/purchases/${po.id}`} className="hover:text-primary transition-colors flex items-center gap-1">
                            {po.poNumber}
                            <ExternalLink className="h-3 w-3 text-text-muted" aria-hidden="true" />
                          </Link>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-text-secondary">
                          {po.branchName}
                        </td>
                        <td className="py-2.5 px-3 text-text-muted">
                          {po.orderDate}
                        </td>
                        <td className="py-2.5 px-3 text-text-muted">
                          {po.expectedDeliveryDate || 'Standard'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-text-primary tabular-nums">
                          {formatCurrency(po.total)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge
                            variant={
                              po.status === 'RECEIVED'
                                ? 'success'
                                : po.status === 'PARTIALLY_RECEIVED'
                                ? 'warning'
                                : po.status === 'SENT'
                                ? 'primary'
                                : 'default'
                            }
                            className="text-[10px] font-bold uppercase"
                          >
                            {po.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge
                            variant={
                              po.paymentStatus === 'PAID'
                                ? 'success'
                                : po.paymentStatus === 'PARTIALLY_PAID'
                                ? 'warning'
                                : 'danger'
                            }
                            className="text-[10px] font-bold uppercase"
                          >
                            {po.paymentStatus}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Link to={`/purchases/${po.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Payables & Payment Ledger */}
      {activeTab === 'payables' && (
        <Card className="bg-surface shadow-soft border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-text-primary">
              Payable Ledger & Disbursement History
            </CardTitle>
            <CardDescription className="text-xs text-text-muted">
              Audit trail of payments settled directly with {supplier.name} and integrated with salon expenses.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle text-text-muted font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Payment #</th>
                    <th className="py-2.5 px-3">PO Reference</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Disbursement Method</th>
                    <th className="py-2.5 px-3">Transaction / UTR #</th>
                    <th className="py-2.5 px-3">Integrated Expense</th>
                    <th className="py-2.5 px-3 text-right">Settled Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {purchaseOrders.flatMap((po) => po.payments || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-text-muted">
                        No disbursement records found for this vendor.
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.flatMap((po) => po.payments || []).map((pay) => (
                      <tr key={pay.id} className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="py-2.5 px-3 font-bold font-mono text-text-primary">
                          {pay.paymentNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-primary">
                          {pay.poNumber}
                        </td>
                        <td className="py-2.5 px-3 text-text-muted">
                          {pay.paymentDate}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-text-secondary">
                          {pay.paymentMethod}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-text-muted">
                          {pay.referenceNumber || '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="primary" className="text-[10px] font-mono">
                            {pay.expenseId || 'EXP-AUTO'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-success tabular-nums">
                          {formatCurrency(pay.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Documents */}
      {activeTab === 'documents' && (
        <Card className="bg-surface shadow-soft border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-text-primary">
                  Stored Compliance Documents & Attachments
                </CardTitle>
                <CardDescription className="text-xs text-text-muted">
                  Purchase invoices, quotations, distributor contracts, and rate agreements.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setIsUploadDocOpen(true)} className="gap-1.5 h-8 text-xs">
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                Upload New File
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(supplier.documents && supplier.documents.length > 0) ? (
                supplier.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-surface-subtle border border-border rounded-xl flex flex-col justify-between space-y-2 hover:border-primary/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <Badge variant="default" className="text-[10px] uppercase font-bold">
                          {doc.type}
                        </Badge>
                        <span className="text-[10px] text-text-muted">{doc.fileSize}</span>
                      </div>
                      <h4 className="font-bold text-text-primary text-xs mt-2 truncate" title={doc.title}>
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-text-muted truncate mt-0.5">{doc.fileName}</p>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
                      <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        Download
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 py-12 text-center text-text-muted text-xs">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-60" aria-hidden="true" />
                  No documents attached yet. Click "Upload New File" to store vendor contracts or quotations.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Supplier Modal */}
      {isEditModalOpen && (
        <SupplierModal
          isOpen={true}
          onClose={() => setIsEditModalOpen(false)}
          supplier={supplier}
          onSaved={loadData}
        />
      )}

      {/* New PO Modal */}
      {isPOModalOpen && (
        <CreatePurchaseOrderModal
          isOpen={true}
          onClose={() => setIsPOModalOpen(false)}
          initialSupplierId={supplier.id}
          onCreated={loadData}
        />
      )}

      {/* Upload Document Modal */}
      {isUploadDocOpen && (
        <UploadSupplierDocModal
          isOpen={true}
          onClose={() => setIsUploadDocOpen(false)}
          supplierId={supplier.id}
          supplierName={supplier.name}
          onUploaded={loadData}
        />
      )}
    </div>
  )
}
