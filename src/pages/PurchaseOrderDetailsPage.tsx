import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ShoppingCart,
  Truck,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  PackageCheck,
  FileText,
  IndianRupee,
  CreditCard,
  Printer,
  Download,
  ExternalLink,
  AlertCircle,
  ShieldCheck,
  Tag,
} from 'lucide-react'
import { PurchaseOrder, PurchaseOrderStatus, PurchasePaymentStatus } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToastStore } from '@/store/useToastStore'
import { procurementService } from '@/services/procurementService'
import { printReportDocument } from '@/utils/reportExportUtils'
import { ReceiveGoodsModal } from '@/features/procurement/ReceiveGoodsModal'
import { RecordSupplierInvoiceModal } from '@/features/procurement/RecordSupplierInvoiceModal'
import { RecordSupplierPaymentModal } from '@/features/procurement/RecordSupplierPaymentModal'

export const PurchaseOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  const [po, setPo] = useState<PurchaseOrder | null>(null)

  // Modals state
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const loadPO = () => {
    if (!id) return
    const order = procurementService.getPurchaseOrderById(id)
    if (!order) {
      addToast({ title: 'Not Found', message: 'Purchase Order not found.', type: 'danger' })
      navigate('/purchases')
      return
    }
    setPo(order)
  }

  useEffect(() => {
    loadPO()
  }, [id])

  if (!po) {
    return (
      <div className="py-12 text-center text-text-muted text-xs">
        Loading purchase order details…
      </div>
    )
  }

  const totalOrderedUnits = po.items.reduce((acc, i) => acc + (i.orderedQuantity ?? i.quantity), 0)
  const totalReceivedUnits = po.items.reduce((acc, i) => acc + (i.receivedQuantity || 0), 0)
  const remainingUnits = Math.max(0, totalOrderedUnits - totalReceivedUnits)
  const fulfillmentPct = totalOrderedUnits > 0 ? Math.round((totalReceivedUnits / totalOrderedUnits) * 100) : 0

  const outstandingPayable = po.outstandingAmount !== undefined ? po.outstandingAmount : po.total - (po.paidAmount || 0)

  const handlePrint = () => {
    printReportDocument(`Purchase Order ${po.poNumber}`)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/purchases">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0" title="Back to Purchase Orders">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                {po.poNumber}
              </h1>
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
                className="text-xs font-bold uppercase"
              >
                {po.status}
              </Badge>
              <Badge
                variant={
                  po.paymentStatus === 'PAID'
                    ? 'success'
                    : po.paymentStatus === 'PARTIALLY_PAID'
                    ? 'warning'
                    : 'danger'
                }
                className="text-xs font-bold uppercase"
              >
                {po.paymentStatus}
              </Badge>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Vendor: <Link to={`/suppliers/${po.supplierId}`} className="text-primary font-semibold hover:underline">{po.supplierName}</Link> • Location: <strong>{po.branchName}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 h-9 text-xs">
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            Print PO
          </Button>

          {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsReceiveModalOpen(true)}
              className="gap-1.5 h-9 text-xs"
            >
              <PackageCheck className="h-4 w-4" aria-hidden="true" />
              Receive Goods
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsInvoiceModalOpen(true)}
            className="gap-1.5 h-9 text-xs"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            {po.invoiceDetails ? 'Edit Invoice' : 'Record Invoice'}
          </Button>

          {po.paymentStatus !== 'PAID' && po.status !== 'CANCELLED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaymentModalOpen(true)}
              className="gap-1.5 h-9 text-xs text-success border-success/30 hover:bg-success/10"
            >
              <IndianRupee className="h-3.5 w-3.5" aria-hidden="true" />
              Disburse Payment
            </Button>
          )}
        </div>
      </div>

      {/* Financial & Consignment Progress Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface shadow-soft border-border">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-text-muted block">Purchase Order Total</span>
            <div className="mt-2 text-2xl font-bold text-text-primary tabular-nums">
              {formatCurrency(po.total)}
            </div>
            <span className="text-[11px] text-text-muted mt-1 block">
              Includes {formatCurrency(po.tax)} GST
            </span>
          </CardContent>
        </Card>

        <Card className="bg-surface shadow-soft border-border">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-text-muted">Outstanding Balance</span>
              <span className="text-[10px] text-danger font-semibold uppercase">Payable</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-danger tabular-nums">
              {formatCurrency(outstandingPayable)}
            </div>
            <span className="text-[11px] text-text-muted mt-1 block">
              {outstandingPayable > 0 ? 'Awaiting vendor settlement' : 'Fully disbursed'}
            </span>
          </CardContent>
        </Card>

        <Card className="bg-surface shadow-soft border-border">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-text-muted block">Disbursed to Vendor</span>
            <div className="mt-2 text-2xl font-bold text-success tabular-nums">
              {formatCurrency(po.paidAmount || 0)}
            </div>
            <span className="text-[11px] text-text-muted mt-1 block">
              Synchronized with salon expense ledger
            </span>
          </CardContent>
        </Card>

        <Card className="bg-surface shadow-soft border-border">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-text-muted">Fulfillment Progress</span>
              <span className="text-xs font-bold text-primary">{fulfillmentPct}%</span>
            </div>
            <div className="w-full bg-surface-subtle rounded-full h-2 mt-3 overflow-hidden border border-border">
              <div
                style={{ width: `${fulfillmentPct}%` }}
                className={`h-full ${
                  fulfillmentPct >= 100
                    ? 'bg-success'
                    : fulfillmentPct > 0
                    ? 'bg-warning'
                    : 'bg-transparent'
                }`}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-text-muted">
              <span>Recv: <strong className="text-text-primary">{totalReceivedUnits}</strong></span>
              <span>Rem: <strong className={remainingUnits > 0 ? 'text-warning' : 'text-success'}>{remainingUnits}</strong></span>
              <span>Total: <strong className="text-text-primary">{totalOrderedUnits}</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partial Delivery Notice */}
      {po.status === 'PARTIALLY_RECEIVED' && (
        <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-2xl text-xs text-warning">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <strong className="block text-sm font-semibold">Partial Delivery in Progress:</strong>
            {totalReceivedUnits} of {totalOrderedUnits} units have been received and added to {po.branchName} inventory.
            Remaining {remainingUnits} units are backordered with the vendor. Click <strong>"Receive Goods"</strong> when the second shipment arrives.
          </div>
        </div>
      )}

      {/* Line Items Table */}
      <Card className="bg-surface shadow-soft border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-text-primary">
            Ordered Line Items ({po.items.length})
          </CardTitle>
          <CardDescription className="text-xs text-text-muted">
            Detailed breakdown of products, contracted purchase prices, tax rates, and delivery fulfillment
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-text-muted font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Product Description</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-2 text-center">Ordered</th>
                  <th className="py-2.5 px-2 text-center">Received</th>
                  <th className="py-2.5 px-2 text-center">Remaining</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-2 text-center">Tax %</th>
                  <th className="py-2.5 px-2 text-center">Disc %</th>
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {po.items.map((item) => {
                  const ordered = item.orderedQuantity ?? item.quantity
                  const received = item.receivedQuantity || 0
                  const remaining = Math.max(0, ordered - received)

                  return (
                    <tr key={item.productId} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-text-primary">{item.productName}</div>
                        {item.previousPurchasePrice && (
                          <span className="text-[10px] text-text-muted">
                            Prior Price: {formatCurrency(item.previousPurchasePrice)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-text-muted">
                        {item.sku}
                      </td>
                      <td className="py-3 px-2 text-center font-bold tabular-nums">
                        {ordered}
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-success tabular-nums">
                        {received}
                      </td>
                      <td className="py-3 px-2 text-center font-bold tabular-nums">
                        {remaining > 0 ? (
                          <span className="text-warning">{remaining}</span>
                        ) : (
                          <span className="text-success">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-text-secondary tabular-nums">
                        {formatCurrency(item.purchasePrice)}
                      </td>
                      <td className="py-3 px-2 text-center text-text-muted tabular-nums">
                        {item.taxRate}%
                      </td>
                      <td className="py-3 px-2 text-center text-text-muted tabular-nums">
                        {item.discountPercent || 0}%
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-text-primary tabular-nums">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end pt-4 border-t border-border mt-3">
            <div className="w-full sm:w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal (Net of Disc)</span>
                <span className="font-semibold tabular-nums">{formatCurrency(po.subtotal)}</span>
              </div>
              {po.discount && po.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Promotional Discount</span>
                  <span className="font-semibold tabular-nums">−{formatCurrency(po.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-text-secondary">
                <span>Tax Total (GST)</span>
                <span className="font-semibold tabular-nums">{formatCurrency(po.tax)}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between text-sm font-bold text-text-primary">
                <span>Grand Total</span>
                <span className="text-primary tabular-nums">{formatCurrency(po.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs / Subsections: GRN Logs, Supplier Invoices, Payment Disbursements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goods Receipts (GRN) */}
        <Card className="bg-surface shadow-soft border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-text-primary">
              Goods Receipt Notes (GRN)
            </CardTitle>
            <CardDescription className="text-xs text-text-muted">
              Physical shipment verification logs and inventory allocations
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-3">
              {(po.receipts && po.receipts.length > 0) ? (
                po.receipts.map((grn) => (
                  <div
                    key={grn.id}
                    className="p-3.5 bg-surface-subtle border border-border rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PackageCheck className="h-4 w-4 text-success" aria-hidden="true" />
                        <strong className="font-bold font-mono text-text-primary">
                          {grn.receiptNumber}
                        </strong>
                      </div>
                      <span className="text-text-muted font-medium">{grn.receivedDate}</span>
                    </div>
                    <div className="text-[11px] text-text-secondary">
                      Verified by <strong>{grn.receivedBy}</strong> at <strong>{grn.branchName}</strong>
                    </div>
                    <div className="pt-2 border-t border-border flex justify-between items-center">
                      <span className="text-[11px] text-text-muted">
                        {grn.items.length} Product Lines Received
                      </span>
                      <span className="font-bold text-success">
                        +{grn.items.reduce((acc, i) => acc + i.quantityReceived, 0)} Units to Stock
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-text-muted">
                  No goods receipts logged yet. Click "Receive Goods" when products arrive.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Supplier Invoice & Electronic Payments */}
        <div className="space-y-6">
          {/* Supplier Tax Invoice */}
          <Card className="bg-surface shadow-soft border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-text-primary">
                  Supplier Tax Invoice
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setIsInvoiceModalOpen(true)} className="h-7 text-xs">
                  {po.invoiceDetails ? 'Update Bill' : 'Record Bill'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {po.invoiceDetails ? (
                <div className="p-3.5 bg-surface-subtle border border-border rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Invoice #:</span>
                    <strong className="font-mono text-text-primary">{po.invoiceDetails.supplierInvoiceNumber}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Invoice Date:</span>
                    <span className="text-text-primary">{po.invoiceDetails.invoiceDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Billed Amount:</span>
                    <strong className="text-primary tabular-nums">{formatCurrency(po.invoiceDetails.amount)}</strong>
                  </div>
                  {po.invoiceDetails.attachmentName && (
                    <div className="pt-2 border-t border-border flex justify-between items-center">
                      <span className="text-[11px] text-text-muted truncate max-w-[180px]">
                        {po.invoiceDetails.attachmentName}
                      </span>
                      <a
                        href={po.invoiceDetails.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary text-[11px] font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" aria-hidden="true" />
                        View Bill
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-text-muted">
                  No supplier bill attached yet. Click "Record Bill" to attach invoice details.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Ledger */}
          <Card className="bg-surface shadow-soft border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-text-primary">
                  Payment Ledger & Expense Link
                </CardTitle>
                {po.paymentStatus !== 'PAID' && (
                  <Button size="sm" variant="outline" onClick={() => setIsPaymentModalOpen(true)} className="h-7 text-xs text-success">
                    Add Payment
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2.5">
                {(po.payments && po.payments.length > 0) ? (
                  po.payments.map((pay) => (
                    <div
                      key={pay.id}
                      className="p-3 bg-surface-subtle border border-border rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="font-mono text-text-primary">{pay.paymentNumber}</strong>
                          <Badge variant="primary" className="text-[10px] font-mono">
                            {pay.expenseId || 'EXP-AUTO'}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-text-muted mt-0.5">
                          {pay.paymentDate} • {pay.paymentMethod} • Ref: {pay.referenceNumber || 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <strong className="text-success font-bold tabular-nums block">
                          {formatCurrency(pay.amount)}
                        </strong>
                        <span className="text-[10px] text-text-muted">Disbursed</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-text-muted">
                    No disbursements logged yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Goods Receipt Modal */}
      {isReceiveModalOpen && (
        <ReceiveGoodsModal
          isOpen={true}
          onClose={() => setIsReceiveModalOpen(false)}
          purchaseOrder={po}
          onReceived={loadPO}
        />
      )}

      {/* Supplier Invoice Modal */}
      {isInvoiceModalOpen && (
        <RecordSupplierInvoiceModal
          isOpen={true}
          onClose={() => setIsInvoiceModalOpen(false)}
          purchaseOrder={po}
          onSaved={loadPO}
        />
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <RecordSupplierPaymentModal
          isOpen={true}
          onClose={() => setIsPaymentModalOpen(false)}
          purchaseOrder={po}
          onPaid={loadPO}
        />
      )}
    </div>
  )
}
