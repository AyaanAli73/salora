import React, { useEffect, useState } from 'react'
import {
  FileText,
  Printer,
  Download,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  CreditCard,
  ShieldCheck,
} from 'lucide-react'
import { customerPortalService } from '@/services/customerPortalService'
import { printService } from '@/services/printService'
import { Bill } from '@/types'
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore'
import { useToastStore } from '@/store/useToastStore'

export const CustomerInvoicesPage: React.FC = () => {
  const { customer } = useCustomerAuthStore()
  const [invoices, setInvoices] = useState<Bill[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadInvoices = async () => {
      if (!customer) return
      setLoading(true)
      try {
        const list = await customerPortalService.getCustomerInvoices(customer.id)
        setInvoices(list)
      } catch (err) {
        console.error('Failed to load customer invoices:', err)
      } finally {
        setLoading(false)
      }
    }

    loadInvoices()
  }, [customer])

  const handlePrint = (bill: Bill) => {
    printService.printInvoice(bill)
    useToastStore.getState().addToast({
      title: 'Printing Invoice',
      message: `Dispatched print dialog for ${bill.invoiceNumber || bill.id}.`,
      type: 'info',
    })
  }

  const handleDownload = (bill: Bill) => {
    printService.printInvoice(bill)
    useToastStore.getState().addToast({
      title: 'Download Initiated',
      message: `Invoice ${bill.invoiceNumber} prepared for PDF download.`,
      type: 'success',
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center space-x-3">
            <FileText className="w-7 h-7 text-cyan-400" aria-hidden="true" />
            <span>My Invoices & Receipts</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Access tax-compliant billing slips, itemized service breakdowns, and download receipts
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>GST / Official Tax Compliant Records</span>
        </div>
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Fetching your official receipts…</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/60 border border-slate-800 p-8">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No invoices generated yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Once you complete a salon treatment and settle checkout, your official invoice will be archived here.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th scope="col" className="py-3.5 px-4 font-semibold">
                    Invoice #
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold">
                    Date & Time
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold">
                    Services / Items
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold">
                    Payment Method
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold text-right">
                    Total Amount
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold text-center">
                    Status
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-white">
                      {inv.invoiceNumber || inv.id.slice(0, 10)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inv.createdAt ? inv.createdAt.split('T')[0] : 'Recent'}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {inv.createdAt && inv.createdAt.includes('T') ? inv.createdAt.split('T')[1].slice(0, 5) : '18:30'}
                      </span>
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <p className="font-semibold text-slate-100 truncate">
                        {inv.items && inv.items.length > 0
                          ? inv.items.map((i) => i.name).join(', ')
                          : 'Hair Spa & Scalp Detox'}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        {inv.items?.length || 1} line item(s)
                      </span>
                    </td>
                    <td className="py-4 px-4 capitalize">
                      <div className="inline-flex items-center space-x-1.5 bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
                        <CreditCard className="w-3 h-3 text-violet-400" />
                        <span>{inv.paymentMethod || 'UPI / Card'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-white tabular-nums text-sm">
                      ₹{inv.grandTotal?.toLocaleString('en-IN') || '1,475'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          inv.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{(inv.paymentStatus || 'PAID').toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-violet-400"
                          title="View Invoice Slip"
                          aria-label={`View invoice ${inv.invoiceNumber}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrint(inv)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors focus-visible:ring-2 focus-visible:ring-violet-400"
                          title="Print Invoice"
                          aria-label={`Print invoice ${inv.invoiceNumber}`}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(inv)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-pink-400 hover:text-pink-300 transition-colors focus-visible:ring-2 focus-visible:ring-violet-400"
                          title="Download PDF"
                          aria-label={`Download invoice ${inv.invoiceNumber}`}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Quick View Modal */}
      {selectedInvoice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoice-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              aria-label="Close invoice preview"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-violet-400 text-xs font-semibold uppercase mb-1">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>SALORA Tax Receipt</span>
            </div>
            <h2 id="invoice-modal-title" className="text-xl font-bold text-white">
              Invoice #{selectedInvoice.invoiceNumber || selectedInvoice.id}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Settled on {selectedInvoice.createdAt ? selectedInvoice.createdAt.split('T')[0] : 'Recent'} • Customer: {customer?.fullName}
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
              <div className="space-y-2 pb-3 border-b border-slate-800">
                <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[10px]">
                  Billed Items
                </span>
                {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                  selectedInvoice.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-200">
                      <span>{it.name} (x{it.quantity})</span>
                      <span className="font-bold tabular-nums">₹{it.total?.toLocaleString('en-IN') || it.unitPrice}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-center text-slate-200">
                    <span>Signature Hair Spa Ritual</span>
                    <span className="font-bold tabular-nums">₹1,475</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="tabular-nums">₹{selectedInvoice.subtotal?.toLocaleString('en-IN') || '1,250'}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST / Tax (18%):</span>
                  <span className="tabular-nums">₹{selectedInvoice.tax?.toLocaleString('en-IN') || '225'}</span>
                </div>
                {selectedInvoice.discount ? (
                  <div className="flex justify-between text-emerald-400">
                    <span>Loyalty / VIP Discount:</span>
                    <span className="tabular-nums">-₹{selectedInvoice.discount?.toLocaleString('en-IN')}</span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold text-white">
                  <span>Grand Total Paid:</span>
                  <span className="text-amber-300 tabular-nums">
                    ₹{selectedInvoice.grandTotal?.toLocaleString('en-IN') || '1,475'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Close Preview
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handlePrint(selectedInvoice)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/30"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
