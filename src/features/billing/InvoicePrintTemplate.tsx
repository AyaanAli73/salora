import React from 'react'
import { Bill, PrinterSettings, PrintPaperSize } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Sparkles, Scissors, Package } from 'lucide-react'

interface InvoicePrintTemplateProps {
  bill: Bill
  paperSize: PrintPaperSize
  settings?: Partial<PrinterSettings>
  isReprint?: boolean
}

export const InvoicePrintTemplate: React.FC<InvoicePrintTemplateProps> = ({
  bill,
  paperSize,
  settings,
  isReprint = false,
}) => {
  const showLogo = settings?.showLogo ?? true
  const showCustomer = settings?.showCustomerName ?? true
  const showStaff = settings?.showStaffName ?? true
  const showService = settings?.showService ?? true
  const showPayment = settings?.showPaymentMethod ?? true
  const showGst = settings?.showGstTax ?? true
  const customFooter = settings?.customFooterText || 'Thank you for choosing SALORA Luxe Salon.'
  const salonGstin = settings?.salonGstin || '27AABCG1234F1Z8'

  const billDate = new Date(bill.createdAt)
  const formattedDate = billDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const formattedTime = billDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  const isDuplicate = isReprint || (bill.reprintCount && bill.reprintCount > 0)

  // =========================================================================
  // 1. 58mm Thermal Preview
  // =========================================================================
  if (paperSize === '58mm') {
    return (
      <div className="mx-auto w-[240px] bg-white text-black p-3 font-mono text-[11px] leading-tight shadow-md border border-neutral-300 select-none">
        {/* Top dashed */}
        <div className="border-t border-dashed border-black my-1" />

        <div className="text-center py-0.5">
          {showLogo && (
            <div className="font-black text-sm uppercase tracking-wider">SALORA</div>
          )}
          <div className="text-[10px] font-bold uppercase tracking-tight">SALON MANAGEMENT</div>
        </div>

        {isDuplicate && (
          <div className="text-center my-1">
            <span className="border border-black px-1.5 py-0.2 text-[9px] font-black uppercase">
              *** REPRINT COPY ***
            </span>
          </div>
        )}

        <div className="space-y-0.5 mt-1.5 text-[10.5px]">
          <div>
            <span className="font-bold">Invoice:</span> {bill.invoiceNumber}
          </div>
          <div>
            <span className="font-bold">Date:</span> {formattedDate}
          </div>
          <div>
            <span className="font-bold">Time:</span> {formattedTime}
          </div>
        </div>

        {showCustomer && (
          <div className="mt-1.5 text-[10.5px]">
            <div className="font-bold">Customer:</div>
            <div>{bill.clientName}</div>
            {bill.clientPhone && <div>{bill.clientPhone}</div>}
          </div>
        )}

        {showStaff && bill.staffName && (
          <div className="mt-1 text-[10px]">
            <span className="font-bold">Staff:</span> {bill.staffName}
          </div>
        )}

        {/* Separator */}
        <div className="border-t border-dashed border-black my-1.5" />

        {/* Items Table */}
        <div className="grid grid-cols-12 text-[10px] font-bold border-b border-dashed border-black pb-1 mb-1">
          <span className="col-span-6 text-left">Service</span>
          <span className="col-span-2 text-center">Qty</span>
          <span className="col-span-4 text-right">Total</span>
        </div>

        <div className="space-y-1 text-[10px]">
          {bill.items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 items-start">
              <span className="col-span-6 truncate pr-1">{item.name}</span>
              <span className="col-span-2 text-center">{item.quantity}</span>
              <span className="col-span-4 text-right tabular-nums font-bold">
                {item.total}
              </span>
            </div>
          ))}
        </div>

        {/* Separator */}
        <div className="border-t border-dashed border-black my-1.5" />

        {/* Subtotal, Discount, Tax */}
        <div className="space-y-0.5 text-[10.5px]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="tabular-nums">{bill.subtotal}</span>
          </div>

          {bill.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span className="tabular-nums">-{bill.discount}</span>
            </div>
          )}

          {showGst && bill.tax > 0 && (
            <div className="flex justify-between">
              <span>Tax</span>
              <span className="tabular-nums">{bill.tax}</span>
            </div>
          )}

          {bill.rounding !== 0 && (
            <div className="flex justify-between">
              <span>Rounding</span>
              <span className="tabular-nums">{bill.rounding.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-black my-1.5" />

        {/* TOTAL, Paid, Due */}
        <div className="space-y-0.5 text-[11px]">
          <div className="flex justify-between font-black text-xs">
            <span>TOTAL</span>
            <span className="tabular-nums">{bill.grandTotal}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Paid</span>
            <span className="tabular-nums">{bill.paidAmount}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Due</span>
            <span className="tabular-nums">{bill.dueAmount}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-1.5" />

        {showPayment && (
          <div className="text-[10px] my-1">
            <span className="font-bold">Payment:</span> {bill.paymentMethod.toUpperCase()}
          </div>
        )}

        <div className="text-center text-[9.5px] mt-2 space-y-0.5">
          <div>Thank you for visiting SALORA</div>
          <div className="text-[8.5px] text-neutral-600">Tel: +91 98201 44521</div>
        </div>

        <div className="border-t border-dashed border-black my-1.5" />
      </div>
    )
  }

  // =========================================================================
  // 2. 80mm Thermal Preview
  // =========================================================================
  if (paperSize === '80mm') {
    return (
      <div className="mx-auto w-[320px] bg-white text-black p-4 font-mono text-xs leading-normal shadow-md border border-neutral-300 select-none">
        <div className="border-t border-dashed border-black my-1" />

        <div className="text-center py-1">
          {showLogo && (
            <div className="font-black text-base uppercase tracking-wider">SALORA</div>
          )}
          <div className="text-[11px] font-bold uppercase tracking-tight">
            LUXE SALON & WELLNESS SPA
          </div>
          <div className="text-[9.5px] text-neutral-700 mt-0.5">
            Bandra West, Mumbai • MH 400050
          </div>
          {showGst && (
            <div className="text-[9.5px] font-bold">GSTIN: {salonGstin}</div>
          )}
        </div>

        {isDuplicate && (
          <div className="text-center my-1.5">
            <span className="border border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
              *** REPRINT / DUPLICATE COPY ***
            </span>
          </div>
        )}

        <div className="border-t border-dashed border-black my-1.5" />

        <div className="flex justify-between text-[11px]">
          <div>
            <span className="font-bold">INV:</span> {bill.invoiceNumber}
          </div>
          <div className="tabular-nums">
            {formattedDate} {formattedTime}
          </div>
        </div>

        {showCustomer && (
          <div className="mt-1 text-[11px]">
            <span className="font-bold">Guest:</span> {bill.clientName}{' '}
            {bill.clientPhone && `(${bill.clientPhone})`}
          </div>
        )}

        {showStaff && bill.staffName && (
          <div className="text-[11px]">
            <span className="font-bold">Specialist:</span> {bill.staffName}
          </div>
        )}

        <div className="border-t border-dashed border-black my-1.5" />

        {/* Table */}
        <div className="grid grid-cols-12 text-[10.5px] font-bold border-b border-dashed border-black pb-1 mb-1">
          <span className="col-span-5 text-left">Item</span>
          <span className="col-span-2 text-right">Rate</span>
          <span className="col-span-2 text-center">Qty</span>
          <span className="col-span-3 text-right">Total</span>
        </div>

        <div className="space-y-1 text-[10.5px]">
          {bill.items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 items-start">
              <span className="col-span-5 truncate pr-1">{item.name}</span>
              <span className="col-span-2 text-right tabular-nums">{item.unitPrice}</span>
              <span className="col-span-2 text-center tabular-nums">{item.quantity}</span>
              <span className="col-span-3 text-right tabular-nums font-bold">
                {item.total}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black my-1.5" />

        <div className="space-y-0.5 text-[11px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="tabular-nums font-medium">₹{bill.subtotal}</span>
          </div>
          {bill.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount {bill.couponCode ? `(${bill.couponCode})` : ''}:</span>
              <span className="tabular-nums font-medium">-₹{bill.discount}</span>
            </div>
          )}
          {showGst && (
            <div className="flex justify-between">
              <span>GST ({bill.taxRate}%):</span>
              <span className="tabular-nums font-medium">₹{bill.tax}</span>
            </div>
          )}
          {bill.rounding !== 0 && (
            <div className="flex justify-between">
              <span>Rounding:</span>
              <span className="tabular-nums font-medium">
                {bill.rounding > 0 ? '+' : ''}₹{bill.rounding.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-black my-1.5" />

        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between font-black text-sm">
            <span>GRAND TOTAL:</span>
            <span className="tabular-nums">₹{bill.grandTotal}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Paid ({bill.paymentMethod.toUpperCase()}):</span>
            <span className="tabular-nums">₹{bill.paidAmount}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Balance Due:</span>
            <span className="tabular-nums">₹{bill.dueAmount}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="text-center text-[10px] space-y-0.5">
          <div className="font-bold">Thank you for visiting SALORA Studio!</div>
          <div>Concierge & Bookings: +91 98201 44521</div>
          <div className="text-[8.5px] text-neutral-600 mt-1">
            Computer generated receipt • No signature needed
          </div>
        </div>

        <div className="border-t border-dashed border-black my-1" />
      </div>
    )
  }

  // =========================================================================
  // 3. A4 Formal Tax Invoice Preview
  // =========================================================================
  return (
    <div className="mx-auto max-w-[680px] bg-white text-neutral-900 p-8 rounded-xl shadow-lg border border-neutral-200 select-none text-xs font-sans leading-relaxed">
      {isDuplicate && (
        <div className="mb-4 text-center">
          <span className="inline-block border-2 border-rose-500 text-rose-600 font-extrabold text-xs px-3 py-1 rounded-md uppercase tracking-widest">
            ● DUPLICATE COPY / REPRINT ●
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-primary/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-black text-neutral-900 tracking-tight uppercase font-sans">
              SALORA LUXE SALON & SPA
            </h2>
          </div>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Premium Hair, Beauty & Wellness Studio
          </p>
          <div className="text-[11px] text-neutral-600 mt-2 space-y-0.5">
            <p>Suite 402, Platinum Square, Bandra West, Mumbai, MH 400050</p>
            <p>Phone: <strong>+91 98201 44521</strong> | Email: concierge@SALORA-salon.com</p>
            {showGst && <p><strong>GSTIN:</strong> {salonGstin}</p>}
          </div>
        </div>

        <div className="sm:text-right space-y-1">
          <span className="font-mono font-black text-lg text-primary block">
            {bill.invoiceNumber}
          </span>
          <p className="text-neutral-600 text-[11px]">
            Date: <strong>{formattedDate}</strong>
          </p>
          <p className="text-neutral-600 text-[11px]">
            Time: <strong>{formattedTime}</strong>
          </p>
          <div className="pt-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 uppercase">
              {bill.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Customer & Staff Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5 text-xs">
        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1">
            Billed To (Client)
          </span>
          {showCustomer ? (
            <>
              <p className="font-bold text-neutral-900">{bill.clientName}</p>
              <p className="text-neutral-600 text-[11px]">{bill.clientPhone || 'Walk-In Customer'}</p>
              {bill.clientEmail && <p className="text-neutral-500 text-[10px]">{bill.clientEmail}</p>}
              {bill.clientId && <p className="text-neutral-400 text-[10px]">ID: {bill.clientId}</p>}
            </>
          ) : (
            <p className="font-bold">Customer</p>
          )}
        </div>

        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1">
            Specialist & Booking
          </span>
          {showStaff ? (
            <>
              <p className="font-bold text-neutral-900">{bill.staffName}</p>
              {bill.appointmentId && (
                <p className="text-neutral-600 text-[11px]">Appt Ref: #{bill.appointmentId}</p>
              )}
              {bill.tokenId && (
                <p className="text-neutral-600 text-[11px]">Token ID: #{bill.tokenId}</p>
              )}
            </>
          ) : (
            <p className="font-bold">Styling Team</p>
          )}
        </div>

        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1">
            Payment Mode
          </span>
          {showPayment ? (
            <>
              <p className="font-bold text-neutral-900 uppercase">{bill.paymentMethod}</p>
              <p className="text-neutral-600 text-[11px]">Paid: ₹{bill.paidAmount.toLocaleString('en-IN')}</p>
              {bill.dueAmount > 0 ? (
                <p className="text-rose-600 font-bold text-[11px]">Due: ₹{bill.dueAmount.toLocaleString('en-IN')}</p>
              ) : (
                <p className="text-emerald-600 font-medium text-[11px]">Settled in Full</p>
              )}
            </>
          ) : (
            <p className="font-bold">Settled</p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left text-xs border-collapse mb-5">
        <thead>
          <tr className="border-b border-t border-neutral-200 bg-neutral-100 text-[10.5px] font-black uppercase text-neutral-700">
            <th className="py-2 px-3">Item Description</th>
            <th className="py-2 px-2 text-center">Type</th>
            <th className="py-2 px-2 text-center">Qty</th>
            <th className="py-2 px-3 text-right">Rate</th>
            <th className="py-2 px-3 text-right">Discount</th>
            <th className="py-2 px-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {bill.items.map((item) => (
            <tr key={item.id}>
              <td className="py-2.5 px-3">
                <span className="font-bold text-neutral-900">{item.name}</span>
                {item.duration && (
                  <span className="text-neutral-400 text-[10px] ml-1">({item.duration} mins)</span>
                )}
              </td>
              <td className="py-2.5 px-2 text-center text-neutral-500 capitalize text-[10px]">
                {item.type}
              </td>
              <td className="py-2.5 px-2 text-center font-semibold tabular-nums">{item.quantity}</td>
              <td className="py-2.5 px-3 text-right tabular-nums">
                ₹{item.unitPrice.toLocaleString('en-IN')}
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums text-neutral-600">
                {item.discount > 0 ? `-₹${item.discount.toLocaleString('en-IN')}` : '—'}
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums font-bold">
                ₹{item.total.toLocaleString('en-IN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Section */}
      <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-neutral-200">
        <div className="flex-1 space-y-2 text-[11px] text-neutral-600">
          <p className="font-bold text-neutral-800 uppercase text-[10px] tracking-wider">
            Terms & Salon Policy
          </p>
          <p>{customFooter}</p>
          {bill.notes && (
            <p className="italic text-neutral-500 bg-neutral-50 p-2 rounded border border-neutral-200">
              Note: {bill.notes}
            </p>
          )}
        </div>

        <div className="w-full sm:w-64 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-neutral-600">Subtotal:</span>
            <span className="font-bold tabular-nums">₹{bill.subtotal.toLocaleString('en-IN')}</span>
          </div>

          {bill.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount {bill.couponCode ? `(${bill.couponCode})` : ''}:</span>
              <span className="font-bold tabular-nums">-₹{bill.discount.toLocaleString('en-IN')}</span>
            </div>
          )}

          {showGst && (
            <>
              <div className="flex justify-between text-neutral-600">
                <span>Taxable Amount:</span>
                <span className="tabular-nums">₹{bill.taxableAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>GST ({bill.taxRate}%):</span>
                <span className="tabular-nums font-medium">₹{bill.tax.toLocaleString('en-IN')}</span>
              </div>
            </>
          )}

          {bill.rounding !== 0 && (
            <div className="flex justify-between text-neutral-500 text-[11px]">
              <span>Rounding Adj:</span>
              <span className="tabular-nums">
                {bill.rounding > 0 ? '+' : ''}₹{bill.rounding.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between py-2 border-t-2 border-b-2 border-neutral-900 text-sm font-black text-neutral-900">
            <span>GRAND TOTAL:</span>
            <span className="tabular-nums">₹{bill.grandTotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between text-emerald-600 font-bold">
            <span>Amount Paid:</span>
            <span className="tabular-nums">₹{bill.paidAmount.toLocaleString('en-IN')}</span>
          </div>

          {bill.dueAmount > 0 ? (
            <div className="flex justify-between text-rose-600 font-extrabold">
              <span>OUTSTANDING DUE:</span>
              <span className="tabular-nums">₹{bill.dueAmount.toLocaleString('en-IN')}</span>
            </div>
          ) : (
            <div className="flex justify-between text-emerald-600 font-medium text-[11px]">
              <span>Balance Due:</span>
              <span className="tabular-nums">₹0.00</span>
            </div>
          )}
        </div>
      </div>

      {/* Signature & Legal Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-6 text-[10px] text-neutral-500">
        <ul className="space-y-0.5 max-w-sm">
          <li>• Valid for salon treatment adjustments within 48 hours of service.</li>
          <li>• Retail merchandise accepted for exchange within 7 days unopened.</li>
          <li>• Computer generated tax invoice; no physical stamp required.</li>
        </ul>

        <div className="text-center w-40">
          <div className="border-t border-neutral-700 pt-1 font-bold text-neutral-800 uppercase tracking-wider text-[10px]">
            Authorized Signatory
          </div>
          <div className="text-[9px] text-neutral-400">SALORA Luxe Salon & Spa</div>
        </div>
      </div>
    </div>
  )
}
