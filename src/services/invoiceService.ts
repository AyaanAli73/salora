import { Bill, PrinterSettings } from '@/types'
import { billingService } from './billingService'
import { formatCurrency, formatDate } from '@/utils/formatters'

export interface SalonInvoiceInfo {
  name: string
  tagline: string
  address: string
  phone: string
  email: string
  website: string
  gstin: string
  terms: string[]
}

export const DEFAULT_SALON_INFO: SalonInvoiceInfo = {
  name: 'SALORA Luxe Salon & Spa',
  tagline: 'Premium Hair, Beauty & Wellness Studio',
  address: 'Suite 402, Platinum Square, Bandra West, Mumbai, MH 400050',
  phone: '+91 98201 44521',
  email: 'concierge@SALORA-salon.com',
  website: 'www.SALORA-salon.com',
  gstin: '27AABCG1234F1Z8',
  terms: [
    'Goods and services once billed are non-refundable except under salon warranty policy.',
    'Appointments rescheduled with less than 2 hours notice are subject to a 20% convenience charge.',
    'Please preserve this invoice for warranty on hair treatments and retail merchandise returns.',
    'This is a computer-generated tax invoice and requires no physical signature.',
  ],
}

class InvoiceService {
  private salonInfo: SalonInvoiceInfo = { ...DEFAULT_SALON_INFO }

  public getSalonInfo(): SalonInvoiceInfo {
    return { ...this.salonInfo }
  }

  public updateSalonInfo(updates: Partial<SalonInvoiceInfo>): void {
    this.salonInfo = { ...this.salonInfo, ...updates }
  }

  /**
   * Records a reprint event for an invoice without duplicating the bill
   */
  public async recordReprint(bill: Bill): Promise<Bill> {
    const currentCount = bill.reprintCount || 0
    const nowIso = new Date().toISOString()
    const updated = await billingService.updateBill(bill.id, {
      reprintCount: currentCount + 1,
      printCount: (bill.printCount || 1) + 1,
      lastPrintedAt: nowIso,
    })
    return updated
  }

  /**
   * Generates WhatsApp sharing URL with formatted e-receipt summary
   */
  public generateWhatsAppUrl(bill: Bill): string {
    const cleanPhone = (bill.clientPhone || '').replace(/\D/g, '')
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

    const lines = [
      `*SALORA LUXE SALON & SPA*`,
      `Tax Invoice: #${bill.invoiceNumber}`,
      `Date: ${formatDate(bill.createdAt)}`,
      `Customer: ${bill.clientName}`,
      `--------------------------------`,
      ...bill.items.map(
        (item) => `• ${item.name} (${item.quantity}x) - ₹${item.total.toLocaleString('en-IN')}`
      ),
      `--------------------------------`,
      `Subtotal: ₹${bill.subtotal.toLocaleString('en-IN')}`,
      bill.discount > 0 ? `Discount: -₹${bill.discount.toLocaleString('en-IN')}` : '',
      `GST (${bill.taxRate}%): ₹${bill.tax.toLocaleString('en-IN')}`,
      `*Grand Total: ₹${bill.grandTotal.toLocaleString('en-IN')}*`,
      `Paid: ₹${bill.paidAmount.toLocaleString('en-IN')} (${bill.paymentMethod.toUpperCase()})`,
      bill.dueAmount > 0 ? `*Due Balance: ₹${bill.dueAmount.toLocaleString('en-IN')}*` : 'Balance: Paid in full',
      `--------------------------------`,
      `Thank you for trusting SALORA! We look forward to serving you again.`,
      `Concierge: ${this.salonInfo.phone}`,
    ].filter(Boolean)

    const text = encodeURIComponent(lines.join('\n'))
    return targetPhone
      ? `https://wa.me/${targetPhone}?text=${text}`
      : `https://wa.me/?text=${text}`
  }

  /**
   * Generates mailto link for emailing tax invoice
   */
  public generateEmailUrl(bill: Bill): string {
    const recipient = bill.clientEmail || ''
    const subject = encodeURIComponent(
      `Tax Invoice #${bill.invoiceNumber} — SALORA Salon & Spa`
    )
    const bodyLines = [
      `Dear ${bill.clientName},`,
      ``,
      `Thank you for your visit to SALORA Luxe Salon & Spa today.`,
      `Please find the summary of your tax invoice #${bill.invoiceNumber} below:`,
      ``,
      `Invoice Number: ${bill.invoiceNumber}`,
      `Date: ${formatDate(bill.createdAt)}`,
      `Service Specialist: ${bill.staffName}`,
      `Payment Method: ${bill.paymentMethod.toUpperCase()}`,
      `Grand Total: ₹${bill.grandTotal.toLocaleString('en-IN')}`,
      `Amount Paid: ₹${bill.paidAmount.toLocaleString('en-IN')}`,
      bill.dueAmount > 0 ? `Outstanding Due: ₹${bill.dueAmount.toLocaleString('en-IN')}` : `Status: Fully Settled`,
      ``,
      `Itemized Summary:`,
      ...bill.items.map(
        (i) => ` - ${i.name} (Qty: ${i.quantity}) : ₹${i.total.toLocaleString('en-IN')}`
      ),
      ``,
      `Best regards,`,
      `${this.salonInfo.name}`,
      `${this.salonInfo.phone} | ${this.salonInfo.email}`,
    ]
    const body = encodeURIComponent(bodyLines.join('\n'))
    return `mailto:${recipient}?subject=${subject}&body=${body}`
  }

  /**
   * Generates pure, polished A4 Printable HTML
   */
  public generateA4HTML(
    bill: Bill,
    isReprint = false,
    settings?: Partial<PrinterSettings>
  ): string {
    const salon = this.salonInfo
    const showLogo = settings?.showLogo ?? true
    const showGst = settings?.showGstTax ?? true
    const showPaymentMethod = settings?.showPaymentMethod ?? true
    const showCustomer = settings?.showCustomerName ?? true
    const showStaff = settings?.showStaffName ?? true
    const showService = settings?.showService ?? true
    const customFooter = settings?.customFooterText || 'Thank you for choosing SALORA Luxe Salon.'

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

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${bill.invoiceNumber}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 14mm 16mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #fff;
            color: #111827;
            font-size: 12px;
            line-height: 1.5;
            padding: 10px;
          }
          .invoice-container {
            max-width: 100%;
            margin: 0 auto;
          }
          .reprint-watermark {
            display: ${isDuplicate ? 'block' : 'none'};
            border: 2px solid #ef4444;
            color: #ef4444;
            font-weight: 800;
            font-size: 11px;
            letter-spacing: 2px;
            text-transform: uppercase;
            padding: 4px 12px;
            border-radius: 6px;
            display: inline-block;
            margin-bottom: 8px;
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #7c3aed;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand-col h1 {
            font-size: 22px;
            font-weight: 900;
            color: #1e1b4b;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .brand-col .tagline {
            font-size: 11px;
            color: #6b7280;
            margin-top: 1px;
            font-weight: 600;
          }
          .brand-col .meta {
            font-size: 11px;
            color: #4b5563;
            margin-top: 6px;
            line-height: 1.4;
          }
          .invoice-meta-col {
            text-align: right;
          }
          .invoice-badge {
            font-size: 18px;
            font-weight: 900;
            font-family: monospace;
            color: #6d28d9;
          }
          .meta-line {
            font-size: 11px;
            color: #4b5563;
            margin-top: 2px;
          }
          .details-grid {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
          }
          .details-card {
            flex: 1;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px 14px;
          }
          .details-card h4 {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #6b7280;
            letter-spacing: 1px;
            margin-bottom: 4px;
          }
          .details-card .name {
            font-size: 13px;
            font-weight: 800;
            color: #111827;
          }
          .details-card p {
            font-size: 11px;
            color: #4b5563;
            margin-top: 1px;
          }
          table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          table.items-table th {
            background: #f3f4f6;
            color: #374151;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 10px;
            border-top: 1px solid #e5e7eb;
            border-bottom: 1px solid #e5e7eb;
          }
          table.items-table td {
            padding: 10px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 11.5px;
          }
          table.items-table tr:last-child td {
            border-bottom: 1px solid #e5e7eb;
          }
          .text-left { text-align: left; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .tabular { font-variant-numeric: tabular-nums; }
          .summary-split {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 24px;
          }
          .notes-block {
            flex: 1;
            font-size: 11px;
            color: #4b5563;
          }
          .notes-block h5 {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #374151;
            margin-bottom: 4px;
          }
          .summary-table {
            width: 260px;
            border-collapse: collapse;
          }
          .summary-table td {
            padding: 4px 0;
            font-size: 11.5px;
          }
          .summary-table .amount {
            text-align: right;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
          }
          .grand-total-row td {
            padding-top: 8px;
            padding-bottom: 8px;
            border-top: 2px solid #111827;
            border-bottom: 2px solid #111827;
            font-size: 15px;
            font-weight: 900;
            color: #1e1b4b;
          }
          .due-row {
            color: #dc2626;
            font-weight: 800;
          }
          .footer-section {
            border-top: 1px solid #e5e7eb;
            padding-top: 16px;
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .terms-list {
            font-size: 9.5px;
            color: #6b7280;
            max-width: 60%;
            line-height: 1.4;
          }
          .terms-list li {
            margin-bottom: 2px;
          }
          .signature-box {
            text-align: center;
            width: 170px;
          }
          .signature-line {
            border-top: 1px solid #374151;
            margin-top: 36px;
            padding-top: 4px;
            font-size: 10px;
            font-weight: 700;
            color: #374151;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          ${isDuplicate ? `<div class="reprint-watermark">● DUPLICATE COPY / REPRINT ●</div>` : ''}

          <!-- Header -->
          <div class="header-row">
            <div class="brand-col">
              ${showLogo ? `<h1>${salon.name}</h1>` : `<h1>${salon.name}</h1>`}
              <div class="tagline">${salon.tagline}</div>
              <div class="meta">
                <div>${salon.address}</div>
                <div>Phone: <strong>${salon.phone}</strong> | Email: ${salon.email}</div>
                ${showGst && salon.gstin ? `<div><strong>GSTIN:</strong> ${salon.gstin}</div>` : ''}
              </div>
            </div>

            <div class="invoice-meta-col">
              <div class="invoice-badge">${bill.invoiceNumber}</div>
              <div class="meta-line">Date: <strong>${formattedDate}</strong></div>
              <div class="meta-line">Time: <strong>${formattedTime}</strong></div>
              <div class="meta-line">Status: <strong>${bill.paymentStatus}</strong></div>
            </div>
          </div>

          <!-- Customer & Appointment Details -->
          <div class="details-grid">
            <div class="details-card">
              <h4>Billed To (Client)</h4>
              ${showCustomer ? `
                <div class="name">${bill.clientName}</div>
                <p>Phone: ${bill.clientPhone || 'Walk-In Guest'}</p>
                ${bill.clientEmail ? `<p>Email: ${bill.clientEmail}</p>` : ''}
                ${bill.clientId ? `<p>Client ID: ${bill.clientId}</p>` : ''}
              ` : '<div class="name">Customer</div>'}
            </div>

            <div class="details-card">
              <h4>Service & Staff Details</h4>
              ${showStaff ? `
                <div class="name">${bill.staffName}</div>
                <p>Specialist Commission ID: ${bill.staffId}</p>
              ` : '<div class="name">Salon Team</div>'}
              ${bill.appointmentId ? `<p>Appointment Ref: #${bill.appointmentId}</p>` : ''}
              ${bill.tokenId ? `<p>Queue Token: #${bill.tokenId}</p>` : ''}
            </div>

            <div class="details-card">
              <h4>Payment Mode</h4>
              ${showPaymentMethod ? `
                <div class="name" style="text-transform: uppercase;">${bill.paymentMethod}</div>
                <p>Payment Status: <strong>${bill.paymentStatus}</strong></p>
                <p>Tendered: ₹${bill.paidAmount.toLocaleString('en-IN')}</p>
              ` : '<div class="name">Settled</div>'}
            </div>
          </div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th class="text-left" style="width: 40px;">#</th>
                <th class="text-left">Service / Product Description</th>
                <th class="text-center" style="width: 70px;">Type</th>
                <th class="text-center" style="width: 50px;">Qty</th>
                <th class="text-right" style="width: 90px;">Rate (₹)</th>
                <th class="text-right" style="width: 80px;">Disc (₹)</th>
                <th class="text-right" style="width: 90px;">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items
                .map(
                  (item, idx) => `
                <tr>
                  <td class="text-left">${idx + 1}</td>
                  <td class="text-left">
                    <strong>${item.name}</strong>
                    ${item.duration ? `<span style="color:#6b7280; font-size:10px;"> (${item.duration} mins)</span>` : ''}
                  </td>
                  <td class="text-center" style="text-transform: capitalize; color:#6b7280; font-size:10px;">${item.type}</td>
                  <td class="text-center tabular font-semibold">${item.quantity}</td>
                  <td class="text-right tabular">₹${item.unitPrice.toLocaleString('en-IN')}</td>
                  <td class="text-right tabular">${item.discount > 0 ? `-₹${item.discount.toLocaleString('en-IN')}` : '—'}</td>
                  <td class="text-right tabular font-bold">₹${item.total.toLocaleString('en-IN')}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <!-- Summary & Totals -->
          <div class="summary-split">
            <div class="notes-block">
              <h5>Terms & Salon Notes</h5>
              <p>${customFooter}</p>
              ${bill.notes ? `<p style="margin-top:6px; font-style:italic;">Note: ${bill.notes}</p>` : ''}
            </div>

            <table class="summary-table">
              <tr>
                <td>Subtotal:</td>
                <td class="amount">₹${bill.subtotal.toLocaleString('en-IN')}</td>
              </tr>
              ${bill.discount > 0 ? `
                <tr style="color: #059669;">
                  <td>Discount ${bill.couponCode ? `(${bill.couponCode})` : ''}:</td>
                  <td class="amount">-₹${bill.discount.toLocaleString('en-IN')}</td>
                </tr>
              ` : ''}
              ${showGst ? `
                <tr>
                  <td>Taxable Value:</td>
                  <td class="amount">₹${bill.taxableAmount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td>GST (${bill.taxRate}%):</td>
                  <td class="amount">₹${bill.tax.toLocaleString('en-IN')}</td>
                </tr>
              ` : ''}
              ${bill.rounding !== 0 ? `
                <tr>
                  <td>Rounding Adj:</td>
                  <td class="amount">${bill.rounding > 0 ? '+' : ''}₹${bill.rounding.toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr class="grand-total-row">
                <td>GRAND TOTAL:</td>
                <td class="amount">₹${bill.grandTotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Amount Paid:</td>
                <td class="amount" style="color:#059669;">₹${bill.paidAmount.toLocaleString('en-IN')}</td>
              </tr>
              ${bill.dueAmount > 0 ? `
                <tr class="due-row">
                  <td>OUTSTANDING DUE:</td>
                  <td class="amount">₹${bill.dueAmount.toLocaleString('en-IN')}</td>
                </tr>
              ` : `
                <tr style="color:#059669; font-weight:700;">
                  <td>Balance Due:</td>
                  <td class="amount">₹0.00</td>
                </tr>
              `}
            </table>
          </div>

          <!-- Footer Signature & Legal -->
          <div class="footer-section">
            <ul class="terms-list">
              ${salon.terms.map((t) => `<li>• ${t}</li>`).join('')}
            </ul>

            <div class="signature-box">
              <div class="signature-line">Authorized Signatory</div>
              <div style="font-size: 9px; color: #9ca3af; margin-top: 2px;">${salon.name}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generates pure 58mm Thermal HTML matching the exact user specification
   */
  public generateThermal58mmHTML(
    bill: Bill,
    isReprint = false,
    settings?: Partial<PrinterSettings>
  ): string {
    const salon = this.salonInfo
    const showLogo = settings?.showLogo ?? true
    const showCustomer = settings?.showCustomerName ?? true
    const showStaff = settings?.showStaffName ?? true
    const showPaymentMethod = settings?.showPaymentMethod ?? true
    const showGst = settings?.showGstTax ?? true

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

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Thermal 58mm - ${bill.invoiceNumber}</title>
        <style>
          @page {
            size: 58mm auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: "Courier New", Courier, monospace, monospace;
            width: 48mm;
            margin: 0 auto;
            padding: 6px 2px;
            color: #000;
            background: #fff;
            font-size: 11px;
            line-height: 1.25;
            -webkit-print-color-adjust: exact;
          }
          .center { text-align: center; }
          .left { text-align: left; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .divider {
            border-top: 1px dashed #000;
            margin: 4px 0;
          }
          .title {
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .subtitle {
            font-size: 10px;
            text-transform: uppercase;
            margin-top: 1px;
          }
          .reprint-badge {
            font-size: 10px;
            font-weight: 900;
            border: 1px solid #000;
            display: inline-block;
            padding: 1px 4px;
            margin: 3px 0;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 4px 0;
          }
          .items-table th {
            font-size: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 2px;
          }
          .items-table td {
            font-size: 10px;
            padding: 2px 0;
            vertical-align: top;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 10.5px;
            margin: 1.5px 0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            font-weight: 900;
            margin: 3px 0;
          }
          .footer {
            font-size: 9.5px;
            text-align: center;
            margin-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="divider"></div>
        <div class="center">
          ${showLogo ? `<div class="title">SALORA</div><div class="subtitle">SALON MANAGEMENT</div>` : `<div class="title">${salon.name}</div>`}
        </div>

        ${isDuplicate ? `<div class="center"><span class="reprint-badge">*** REPRINT COPY ***</span></div>` : ''}

        <div style="margin-top: 4px;">
          <div><span class="bold">Invoice:</span> ${bill.invoiceNumber}</div>
          <div><span class="bold">Date:</span> ${formattedDate}</div>
          <div><span class="bold">Time:</span> ${formattedTime}</div>
        </div>

        ${showCustomer ? `
          <div style="margin-top: 4px;">
            <div class="bold">Customer:</div>
            <div>${bill.clientName}</div>
            ${bill.clientPhone ? `<div>${bill.clientPhone}</div>` : ''}
          </div>
        ` : ''}

        ${showStaff && bill.staffName ? `
          <div style="margin-top: 2px;">
            <div><span class="bold">Staff:</span> ${bill.staffName}</div>
          </div>
        ` : ''}

        <div class="divider"></div>

        <!-- Line items table -->
        <table class="items-table">
          <thead>
            <tr>
              <th class="left">Service/Item</th>
              <th class="center" style="width: 28px;">Qty</th>
              <th class="right" style="width: 44px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items
              .map(
                (item) => `
              <tr>
                <td class="left">${item.name}</td>
                <td class="center">${item.quantity}</td>
                <td class="right">${item.total}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="divider"></div>

        <!-- Subtotal / Discount / Tax / Rounding -->
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${bill.subtotal}</span>
        </div>
        ${bill.discount > 0 ? `
          <div class="summary-row">
            <span>Discount</span>
            <span>${bill.discount}</span>
          </div>
        ` : ''}
        ${showGst && bill.tax > 0 ? `
          <div class="summary-row">
            <span>Tax</span>
            <span>${bill.tax}</span>
          </div>
        ` : ''}
        ${bill.rounding !== 0 ? `
          <div class="summary-row">
            <span>Rounding</span>
            <span>${bill.rounding.toFixed(1)}</span>
          </div>
        ` : ''}

        <div class="divider"></div>

        <!-- TOTAL, Paid, Due -->
        <div class="total-row">
          <span>TOTAL</span>
          <span>${bill.grandTotal}</span>
        </div>
        <div class="summary-row bold">
          <span>Paid</span>
          <span>${bill.paidAmount}</span>
        </div>
        <div class="summary-row bold">
          <span>Due</span>
          <span>${bill.dueAmount}</span>
        </div>

        <div class="divider"></div>

        ${showPaymentMethod ? `
          <div style="margin: 3px 0; font-size: 10px;">
            <span class="bold">Payment:</span> ${bill.paymentMethod.toUpperCase()}
          </div>
        ` : ''}

        <div class="footer">
          <div>Thank you for visiting SALORA</div>
          ${salon.phone ? `<div>Tel: ${salon.phone}</div>` : ''}
        </div>
        <div class="divider"></div>
      </body>
      </html>
    `
  }

  /**
   * Generates dedicated 80mm Thermal HTML
   */
  public generateThermal80mmHTML(
    bill: Bill,
    isReprint = false,
    settings?: Partial<PrinterSettings>
  ): string {
    const salon = this.salonInfo
    const showLogo = settings?.showLogo ?? true
    const showCustomer = settings?.showCustomerName ?? true
    const showStaff = settings?.showStaffName ?? true
    const showPaymentMethod = settings?.showPaymentMethod ?? true
    const showGst = settings?.showGstTax ?? true

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

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Thermal 80mm - ${bill.invoiceNumber}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: "Courier New", Courier, monospace, monospace;
            width: 72mm;
            margin: 0 auto;
            padding: 8px 4px;
            color: #000;
            background: #fff;
            font-size: 11.5px;
            line-height: 1.3;
            -webkit-print-color-adjust: exact;
          }
          .center { text-align: center; }
          .left { text-align: left; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .divider {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          .title {
            font-size: 16px;
            font-weight: 900;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .subtitle {
            font-size: 11px;
            text-transform: uppercase;
            margin-top: 1px;
          }
          .reprint-badge {
            font-size: 11px;
            font-weight: 900;
            border: 1px solid #000;
            display: inline-block;
            padding: 2px 6px;
            margin: 4px 0;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 5px 0;
          }
          .items-table th {
            font-size: 11px;
            border-bottom: 1px dashed #000;
            padding-bottom: 3px;
          }
          .items-table td {
            font-size: 11px;
            padding: 2.5px 0;
            vertical-align: top;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 11.5px;
            margin: 2px 0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 900;
            margin: 4px 0;
          }
          .footer {
            font-size: 10px;
            text-align: center;
            margin-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="divider"></div>
        <div class="center">
          ${showLogo ? `<div class="title">SALORA</div><div class="subtitle">LUXE SALON & WELLNESS SPA</div>` : `<div class="title">${salon.name}</div>`}
          <div style="font-size: 9.5px; margin-top: 2px;">${salon.address}</div>
          ${showGst && salon.gstin ? `<div style="font-size: 9.5px;">GSTIN: ${salon.gstin}</div>` : ''}
        </div>

        ${isDuplicate ? `<div class="center"><span class="reprint-badge">*** REPRINT / DUPLICATE ***</span></div>` : ''}

        <div class="divider"></div>

        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <div><span class="bold">INV:</span> ${bill.invoiceNumber}</div>
          <div>${formattedDate} ${formattedTime}</div>
        </div>

        ${showCustomer ? `
          <div style="margin-top: 3px; font-size: 11px;">
            <span class="bold">Guest:</span> ${bill.clientName} ${bill.clientPhone ? `(${bill.clientPhone})` : ''}
          </div>
        ` : ''}

        ${showStaff && bill.staffName ? `
          <div style="font-size: 11px;">
            <span class="bold">Specialist:</span> ${bill.staffName}
          </div>
        ` : ''}

        <div class="divider"></div>

        <!-- Line items table -->
        <table class="items-table">
          <thead>
            <tr>
              <th class="left">Item</th>
              <th class="right" style="width: 48px;">Rate</th>
              <th class="center" style="width: 32px;">Qty</th>
              <th class="right" style="width: 54px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items
              .map(
                (item) => `
              <tr>
                <td class="left">${item.name}</td>
                <td class="right">${item.unitPrice}</td>
                <td class="center">${item.quantity}</td>
                <td class="right bold">${item.total}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="divider"></div>

        <!-- Summary -->
        <div class="summary-row">
          <span>Subtotal</span>
          <span>₹${bill.subtotal}</span>
        </div>
        ${bill.discount > 0 ? `
          <div class="summary-row">
            <span>Discount ${bill.couponCode ? `(${bill.couponCode})` : ''}</span>
            <span>-₹${bill.discount}</span>
          </div>
        ` : ''}
        ${showGst ? `
          <div class="summary-row">
            <span>GST (${bill.taxRate}%)</span>
            <span>₹${bill.tax}</span>
          </div>
        ` : ''}
        ${bill.rounding !== 0 ? `
          <div class="summary-row">
            <span>Rounding</span>
            <span>${bill.rounding > 0 ? '+' : ''}₹${bill.rounding.toFixed(2)}</span>
          </div>
        ` : ''}

        <div class="divider"></div>

        <div class="total-row">
          <span>GRAND TOTAL</span>
          <span>₹${bill.grandTotal}</span>
        </div>
        <div class="summary-row bold">
          <span>Paid (${bill.paymentMethod.toUpperCase()})</span>
          <span>₹${bill.paidAmount}</span>
        </div>
        <div class="summary-row bold" style="color: ${bill.dueAmount > 0 ? '#000' : '#000'};">
          <span>Balance Due</span>
          <span>₹${bill.dueAmount}</span>
        </div>

        <div class="divider"></div>

        <div class="footer">
          <div>Thank you for visiting SALORA Studio!</div>
          <div>For appointments: ${salon.phone}</div>
          <div style="margin-top: 2px; font-size: 8.5px;">Computer generated receipt • No signature needed</div>
        </div>
        <div class="divider"></div>
      </body>
      </html>
    `
  }

  /**
   * PDF Download Architecture: Opens print-to-PDF / triggers download of formatted HTML blob
   */
  public async downloadPDF(
    bill: Bill,
    paperSize: 'a4' | '80mm' | '58mm' = 'a4',
    settings?: Partial<PrinterSettings>
  ): Promise<void> {
    let html = ''
    if (paperSize === 'a4') {
      html = this.generateA4HTML(bill, false, settings)
    } else if (paperSize === '80mm') {
      html = this.generateThermal80mmHTML(bill, false, settings)
    } else {
      html = this.generateThermal58mmHTML(bill, false, settings)
    }

    // Create a Blob with text/html and trigger file download
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Invoice_${bill.invoiceNumber}_${paperSize.toUpperCase()}.html`
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 150)
  }
}

export const invoiceService = new InvoiceService()
