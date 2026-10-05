import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  PackageCheck,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building,
  BarChart3,
  Sparkles,
  ExternalLink,
  CreditCard,
  Eye,
} from 'lucide-react'
import { PurchaseOrder, PurchaseOrderStatus, PurchasePaymentStatus } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useBranchStore } from '@/store/useBranchStore'
import { useToastStore } from '@/store/useToastStore'
import { procurementService } from '@/services/procurementService'
import { CreatePurchaseOrderModal } from '@/features/procurement/CreatePurchaseOrderModal'
import { ReceiveGoodsModal } from '@/features/procurement/ReceiveGoodsModal'
import { RecordSupplierPaymentModal } from '@/features/procurement/RecordSupplierPaymentModal'
import { SuggestedReordersTable } from '@/features/procurement/SuggestedReordersTable'
import { ProcurementAnalyticsView } from '@/features/procurement/ProcurementAnalyticsView'

export const PurchasesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as any) || 'orders'
  const [activeTab, setActiveTab] = useState<'orders' | 'reorder' | 'analytics' | 'grn'>(initialTab)

  const { currentBranchId, branches } = useBranchStore()
  const { addToast } = useToastStore()

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | PurchaseOrderStatus>('ALL')

  // Modals state
  const [isNewPOOpen, setIsNewPOOpen] = useState(false)
  const [selectedForReceipt, setSelectedForReceipt] = useState<PurchaseOrder | null>(null)
  const [selectedForPayment, setSelectedForPayment] = useState<PurchaseOrder | null>(null)

  const loadData = () => {
    const list = procurementService.getAllPurchaseOrders(currentBranchId)
    setPurchaseOrders(list)
  }

  useEffect(() => {
    loadData()
  }, [currentBranchId])

  const handleTabChange = (tab: 'orders' | 'reorder' | 'analytics' | 'grn') => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  // Filtered orders
  const filteredOrders = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      (po.branchName && po.branchName.toLowerCase().includes(search.toLowerCase())) ||
      (po.invoiceNumber && po.invoiceNumber.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus = statusFilter === 'ALL' ? true : po.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Suggested Reorders
  const suggestedReorders = procurementService.getSuggestedReorders(currentBranchId)
  const analytics = procurementService.getProcurementAnalytics(currentBranchId)

  // All GRNs from orders
  const allGRNs = purchaseOrders.flatMap((po) => po.receipts || []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Status badge helper
  const renderStatusBadge = (status: PurchaseOrderStatus | 'PENDING') => {
    switch (status) {
      case 'RECEIVED':
        return <Badge variant="success" className="text-[10px] font-bold uppercase">Received</Badge>
      case 'PARTIALLY_RECEIVED':
        return <Badge variant="warning" className="text-[10px] font-bold uppercase">Partial Receipt</Badge>
      case 'SENT':
        return <Badge variant="primary" className="text-[10px] font-bold uppercase">Sent to Vendor</Badge>
      case 'DRAFT':
        return <Badge variant="default" className="text-[10px] font-semibold uppercase">Draft</Badge>
      case 'CANCELLED':
        return <Badge variant="danger" className="text-[10px] font-semibold uppercase">Cancelled</Badge>
      default:
        return <Badge variant="default" className="text-[10px] uppercase">{status}</Badge>
    }
  }

  const renderPaymentBadge = (paymentStatus: PurchasePaymentStatus) => {
    switch (paymentStatus) {
      case 'PAID':
        return <Badge variant="success" className="text-[10px] font-bold uppercase">Paid</Badge>
      case 'PARTIALLY_PAID':
        return <Badge variant="warning" className="text-[10px] font-bold uppercase">Partial Paid</Badge>
      case 'UNPAID':
        return <Badge variant="danger" className="text-[10px] font-bold uppercase">Unpaid</Badge>
      default:
        return <Badge variant="default" className="text-[10px]">{paymentStatus}</Badge>
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Purchases & Procurement
            </h1>
            <Badge variant="primary" className="text-xs font-semibold">
              {purchaseOrders.length} Orders
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Issue purchase orders, record goods receipts with partial delivery, and manage supplier disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/suppliers">
            <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs">
              <Truck className="h-4 w-4" aria-hidden="true" />
              Suppliers Directory
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewPOOpen(true)}
            className="gap-2 h-9 text-xs"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* Tabs Subnavigation */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-subtle border border-border rounded-2xl overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => handleTabChange('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'orders'
              ? 'bg-surface text-primary shadow-xs'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Purchase Orders ({purchaseOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('reorder')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'reorder'
              ? 'bg-surface text-primary shadow-xs'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Suggested Reorders ({suggestedReorders.length})</span>
          {suggestedReorders.length > 0 && (
            <span className="h-2 w-2 rounded-full bg-warning" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'analytics'
              ? 'bg-surface text-primary shadow-xs'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Procurement Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('grn')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'grn'
              ? 'bg-surface text-primary shadow-xs'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <PackageCheck className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Goods Receipts ({allGRNs.length})</span>
        </button>
      </div>

      {/* TAB 1: PURCHASE ORDERS LIST */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Search and Status Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-surface border border-border rounded-2xl shadow-soft">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search PO #, supplier, salon branch, invoice #…"
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-center">
              {(['ALL', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'DRAFT'] as const).map((st) => (
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
                  {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="border border-border rounded-2xl overflow-hidden bg-surface shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle text-text-muted font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-3">Supplier / Vendor</th>
                    <th className="py-3 px-3">Destination Branch</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Expected Delivery</th>
                    <th className="py-3 px-3 text-right">Order Total</th>
                    <th className="py-3 px-3 text-center">Receipt Status</th>
                    <th className="py-3 px-3 text-center">Payment Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-text-muted">
                        No purchase orders found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((po) => {
                      const totalOrdered = po.items.reduce((acc, i) => acc + (i.orderedQuantity ?? i.quantity), 0)
                      const totalRecv = po.items.reduce((acc, i) => acc + (i.receivedQuantity || 0), 0)
                      const progressPct = totalOrdered > 0 ? Math.round((totalRecv / totalOrdered) * 100) : 0

                      return (
                        <tr key={po.id} className="hover:bg-surface-subtle/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-text-primary">
                            <Link
                              to={`/purchases/${po.id}`}
                              className="hover:text-primary transition-colors flex items-center gap-1.5"
                            >
                              {po.poNumber}
                              <ExternalLink className="h-3 w-3 text-text-muted" aria-hidden="true" />
                            </Link>
                            <span className="block text-[10px] text-text-muted font-normal mt-0.5">
                              {po.items.length} line items
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-text-primary">
                            <Link to={`/suppliers/${po.supplierId}`} className="hover:underline">
                              {po.supplierName}
                            </Link>
                          </td>
                          <td className="py-3 px-3 font-medium text-text-secondary">
                            {po.branchName}
                          </td>
                          <td className="py-3 px-3 text-text-muted">
                            {po.orderDate}
                          </td>
                          <td className="py-3 px-3 text-text-muted">
                            {po.expectedDeliveryDate || 'Standard'}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-text-primary tabular-nums">
                            {formatCurrency(po.total)}
                            {po.outstandingAmount && po.outstandingAmount > 0 ? (
                              <span className="block text-[10px] text-danger font-semibold">
                                Due: {formatCurrency(po.outstandingAmount)}
                              </span>
                            ) : null}
                          </td>
                          <td className="py-3 px-3 text-center space-y-1">
                            {renderStatusBadge(po.status)}
                            <div className="w-20 mx-auto bg-surface-subtle rounded-full h-1.5 overflow-hidden border border-border">
                              <div
                                style={{ width: `${progressPct}%` }}
                                className={`h-full ${
                                  progressPct >= 100
                                    ? 'bg-success'
                                    : progressPct > 0
                                    ? 'bg-warning'
                                    : 'bg-transparent'
                                }`}
                              />
                            </div>
                            <span className="block text-[10px] text-text-muted font-mono">
                              {totalRecv} / {totalOrdered} Recv
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {renderPaymentBadge(po.paymentStatus)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <Link to={`/purchases/${po.id}`}>
                                <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1">
                                  <Eye className="h-3 w-3" aria-hidden="true" />
                                  View
                                </Button>
                              </Link>
                              {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => setSelectedForReceipt(po)}
                                  className="h-7 px-2.5 text-[11px] gap-1"
                                  title="Receive Goods at Salon"
                                >
                                  <PackageCheck className="h-3 w-3" aria-hidden="true" />
                                  Receive
                                </Button>
                              )}
                              {po.paymentStatus !== 'PAID' && po.status !== 'CANCELLED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedForPayment(po)}
                                  className="h-7 px-2 text-[11px] gap-1 text-success border-success/30 hover:bg-success/10"
                                  title="Record Payment"
                                >
                                  <IndianRupee className="h-3 w-3" aria-hidden="true" />
                                  Pay
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUGGESTED REORDER SYSTEM */}
      {activeTab === 'reorder' && (
        <SuggestedReordersTable reorders={suggestedReorders} onRefresh={loadData} />
      )}

      {/* TAB 3: PROCUREMENT ANALYTICS & PRICE HISTORY */}
      {activeTab === 'analytics' && (
        <ProcurementAnalyticsView analytics={analytics} branchFilter={currentBranchId} />
      )}

      {/* TAB 4: GOODS RECEIPTS LOG */}
      {activeTab === 'grn' && (
        <Card className="bg-surface shadow-soft border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-text-primary">
              Consignment Goods Receipt (GRN) History
            </CardTitle>
            <CardDescription className="text-xs text-text-muted">
              Audit log of all physical deliveries checked into branch inventory
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle text-text-muted font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">GRN Number</th>
                    <th className="py-2.5 px-3">PO Reference</th>
                    <th className="py-2.5 px-3">Delivery Date</th>
                    <th className="py-2.5 px-3">Salon Location</th>
                    <th className="py-2.5 px-3">Verified By</th>
                    <th className="py-2.5 px-3 text-center">Items Received</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allGRNs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-text-muted">
                        No goods receipts recorded yet.
                      </td>
                    </tr>
                  ) : (
                    allGRNs.map((grn) => {
                      const units = grn.items.reduce((sum, i) => sum + i.quantityReceived, 0)
                      return (
                        <tr key={grn.id} className="hover:bg-surface-subtle/50 transition-colors">
                          <td className="py-2.5 px-3 font-bold font-mono text-text-primary">
                            {grn.receiptNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-primary">
                            <Link to={`/purchases/${grn.poId}`} className="hover:underline">
                              {grn.poNumber}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 text-text-muted">
                            {grn.receivedDate}
                          </td>
                          <td className="py-2.5 px-3 text-text-secondary font-medium">
                            {grn.branchName}
                          </td>
                          <td className="py-2.5 px-3 text-text-primary font-medium">
                            {grn.receivedBy}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-success tabular-nums">
                            +{units} Units
                          </td>
                          <td className="py-2.5 px-3 text-text-muted italic">
                            {grn.notes || 'Full inspection passed.'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New PO Modal */}
      {isNewPOOpen && (
        <CreatePurchaseOrderModal
          isOpen={true}
          onClose={() => setIsNewPOOpen(false)}
          onCreated={loadData}
        />
      )}

      {/* Goods Receipt Modal */}
      {selectedForReceipt && (
        <ReceiveGoodsModal
          isOpen={true}
          onClose={() => setSelectedForReceipt(null)}
          purchaseOrder={selectedForReceipt}
          onReceived={() => {
            setSelectedForReceipt(null)
            loadData()
          }}
        />
      )}

      {/* Record Payment Modal */}
      {selectedForPayment && (
        <RecordSupplierPaymentModal
          isOpen={true}
          onClose={() => setSelectedForPayment(null)}
          purchaseOrder={selectedForPayment}
          onPaid={() => {
            setSelectedForPayment(null)
            loadData()
          }}
        />
      )}
    </div>
  )
}
