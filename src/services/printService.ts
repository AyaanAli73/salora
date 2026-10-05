import {
  Token,
  Bill,
  PrinterSettings,
  PrintJob,
  PrintPaperSize,
  PrintTemplateType,
} from '@/types'
import { invoiceService } from './invoiceService'
import { billingService } from './billingService'

const SETTINGS_KEY = 'SALORA_printer_settings'
const QUEUE_KEY = 'SALORA_print_queue'

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  paperSize: '58mm',
  defaultInvoiceSize: 'a4',
  defaultTokenSize: '58mm',
  autoPrint: false,
  autoPrintInvoice: false,
  autoPrintToken: false,
  copies: 1,
  showLogo: true,
  showCustomerName: true,
  showStaffName: true,
  showService: true,
  showTime: true,
  showTokenNumber: true,
  showPaymentMethod: true,
  showGstTax: true,
  customFooterText: 'Thank you for choosing SALORA Luxe Salon.',
  salonGstin: '27AABCG1234F1Z8',
}

class PrintService {
  private settings: PrinterSettings
  private printJobs: PrintJob[] = []
  private simulateFailure = false

  constructor() {
    this.settings = this.loadSettings()
    this.printJobs = this.loadQueue()
  }

  private loadSettings(): PrinterSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        return { ...DEFAULT_PRINTER_SETTINGS, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.error('Failed to load printer settings:', e)
    }
    return { ...DEFAULT_PRINTER_SETTINGS }
  }

  private loadQueue(): PrintJob[] {
    try {
      const stored = localStorage.getItem(QUEUE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load print queue:', e)
    }
    return []
  }

  private saveQueue(): void {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.printJobs.slice(0, 50)))
    } catch (e) {
      console.error('Failed to save print queue:', e)
    }
  }

  public getSettings(): PrinterSettings {
    return { ...this.settings }
  }

  public saveSettings(newSettings: Partial<PrinterSettings>): PrinterSettings {
    this.settings = { ...this.settings, ...newSettings }
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings))
    } catch (e) {
      console.error('Failed to persist printer settings:', e)
    }
    return { ...this.settings }
  }

  public setSimulateFailure(fail: boolean): void {
    this.simulateFailure = fail
  }

  public getSimulateFailure(): boolean {
    return this.simulateFailure
  }

  public getQueue(): PrintJob[] {
    return [...this.printJobs]
  }

  public clearQueue(): void {
    this.printJobs = []
    this.saveQueue()
  }

  private addJob(
    type: 'invoice' | 'receipt' | 'token',
    documentId: string,
    template: PrintTemplateType,
    paperSize: PrintPaperSize,
    copies: number
  ): PrintJob {
    const job: PrintJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      documentId,
      template,
      paperSize,
      copies,
      status: 'QUEUED',
      createdAt: new Date().toISOString(),
    }
    this.printJobs.unshift(job)
    this.saveQueue()
    return job
  }

  private updateJob(
    jobId: string,
    status: 'PRINTING' | 'COMPLETED' | 'FAILED',
    error?: string
  ): void {
    const job = this.printJobs.find((j) => j.id === jobId)
    if (job) {
      job.status = status
      if (status === 'COMPLETED') job.completedAt = new Date().toISOString()
      if (error) job.error = error
      this.saveQueue()
    }
  }

  /**
   * Internal isolated hidden iframe printing engine
   */
  private printHtml(html: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') {
        resolve(true)
        return
      }

      if (this.simulateFailure) {
        setTimeout(() => resolve(false), 200)
        return
      }

      try {
        const oldIframe = document.getElementById('SALORA-print-iframe')
        if (oldIframe) {
          oldIframe.remove()
        }

        const iframe = document.createElement('iframe')
        iframe.id = 'SALORA-print-iframe'
        iframe.style.position = 'fixed'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = 'none'

        document.body.appendChild(iframe)

        const doc = iframe.contentWindow?.document
        if (!doc) {
          resolve(false)
          return
        }

        doc.open()
        doc.write(html)
        doc.close()

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus()
            iframe.contentWindow?.print()
            resolve(true)
          } catch (e) {
            console.error('Print trigger error:', e)
            resolve(false)
          } finally {
            setTimeout(() => {
              iframe.remove()
            }, 3000)
          }
        }, 250)
      } catch (e) {
        console.error('Print execution failed:', e)
        resolve(false)
      }
    })
  }

  /**
   * Generates pure black-and-white, high contrast thermal-ready HTML for tokens
   */
  public generateThermalHTML(token: Token): string {
    const s = this.settings
    const width = s.paperSize === '80mm' ? '72mm' : '48mm'
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    const dateStr = now.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Token ${token.displayNumber}</title>
        <style>
          @page {
            size: ${s.paperSize} auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: "Courier New", Courier, monospace, monospace;
            width: ${width};
            margin: 0 auto;
            padding: 8px 4px;
            color: #000;
            background: #fff;
            text-align: center;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .title {
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .subtitle {
            font-size: 9px;
            margin-top: 1px;
          }
          .token-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 6px;
          }
          .token-num {
            font-size: 34px;
            font-weight: 900;
            line-height: 1.1;
            margin: 4px 0;
            letter-spacing: -1px;
          }
          .priority-tag {
            display: inline-block;
            border: 1px solid #000;
            padding: 1px 6px;
            font-size: 9px;
            font-weight: 700;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .client-name {
            font-size: 13px;
            font-weight: 700;
            margin-top: 3px;
          }
          .service-name {
            font-size: 11px;
            font-weight: 600;
            margin-top: 2px;
          }
          .meta-info {
            font-size: 10px;
            margin-top: 4px;
          }
          .footer-note {
            font-size: 9px;
            margin-top: 6px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        ${s.showLogo ? '<div class="title">SALORA</div><div class="subtitle">Salon Management System</div>' : ''}
        <div class="divider"></div>

        ${token.priority === 'VIP' ? '<div class="priority-tag">★ VIP PRIORITY ★</div>' : ''}
        ${token.priority === 'EMERGENCY' ? '<div class="priority-tag">● EXPRESS PASS ●</div>' : ''}

        <div class="token-label">TOKEN</div>
        <div class="token-num">${token.displayNumber}</div>

        <div class="divider"></div>

        ${s.showCustomerName ? `<div class="client-name">${token.clientName}</div>` : ''}
        ${s.showService ? `<div class="service-name">${token.serviceName}</div>` : ''}

        <div class="meta-info">
          ${s.showTime ? `<div>${timeStr} • ${dateStr}</div>` : ''}
          ${s.showStaffName && token.staffName ? `<div>Staff: ${token.staffName}</div>` : ''}
          ${token.estimatedWaitMinutes ? `<div>Est. Wait: ~${token.estimatedWaitMinutes} min</div>` : ''}
        </div>

        <div class="divider"></div>
        <div class="footer-note">${s.customFooterText || 'Please wait for your turn.'}</div>
      </body>
      </html>
    `
  }

  /**
   * Prints token via hidden isolated iframe
   */
  public async printToken(token: Token): Promise<boolean> {
    const paperSize = this.settings.defaultTokenSize || '58mm'
    const template: PrintTemplateType = paperSize === '80mm' ? 'thermal_80mm' : 'thermal_58mm'
    const job = this.addJob('token', token.displayNumber, template, paperSize, 1)
    this.updateJob(job.id, 'PRINTING')

    const html = this.generateThermalHTML(token)
    const success = await this.printHtml(html)

    if (success) {
      this.updateJob(job.id, 'COMPLETED')
    } else {
      this.updateJob(job.id, 'FAILED', 'Printer connection unavailable')
    }
    return success
  }

  /**
   * Prints an invoice in A4, 80mm, or 58mm format
   */
  public async printInvoice(
    bill: Bill,
    paperSize?: PrintPaperSize,
    copiesCount?: number
  ): Promise<{ success: boolean; error?: string }> {
    const size = paperSize || this.settings.defaultInvoiceSize || 'a4'
    const copies = copiesCount || this.settings.copies || 1
    const template: PrintTemplateType =
      size === 'a4' ? 'a4' : size === '80mm' ? 'thermal_80mm' : 'thermal_58mm'

    const job = this.addJob('invoice', bill.invoiceNumber, template, size, copies)
    this.updateJob(job.id, 'PRINTING')

    let html = ''
    if (size === 'a4') {
      html = invoiceService.generateA4HTML(bill, false, this.settings)
    } else if (size === '80mm') {
      html = invoiceService.generateThermal80mmHTML(bill, false, this.settings)
    } else {
      html = invoiceService.generateThermal58mmHTML(bill, false, this.settings)
    }

    let overallSuccess = true
    for (let c = 0; c < copies; c++) {
      const res = await this.printHtml(html)
      if (!res) {
        overallSuccess = false
        break
      }
    }

    if (overallSuccess) {
      this.updateJob(job.id, 'COMPLETED')
      // Update printCount on bill
      try {
        await billingService.updateBill(bill.id, {
          printCount: (bill.printCount || 0) + 1,
          lastPrintedAt: new Date().toISOString(),
        })
      } catch (err) {
        console.warn('Could not update bill print count:', err)
      }
      return { success: true }
    } else {
      const errorMsg = 'Unable to print. Please check printer connection.'
      this.updateJob(job.id, 'FAILED', errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Reprints an invoice (marking it with duplicate copy indicators)
   */
  public async reprintInvoice(
    bill: Bill,
    paperSize?: PrintPaperSize,
    copiesCount?: number
  ): Promise<{ success: boolean; error?: string }> {
    const updatedBill = await invoiceService.recordReprint(bill)
    const size = paperSize || this.settings.defaultInvoiceSize || 'a4'
    const copies = copiesCount || this.settings.copies || 1
    const template: PrintTemplateType =
      size === 'a4' ? 'a4' : size === '80mm' ? 'thermal_80mm' : 'thermal_58mm'

    const job = this.addJob('invoice', bill.invoiceNumber, template, size, copies)
    this.updateJob(job.id, 'PRINTING')

    let html = ''
    if (size === 'a4') {
      html = invoiceService.generateA4HTML(updatedBill, true, this.settings)
    } else if (size === '80mm') {
      html = invoiceService.generateThermal80mmHTML(updatedBill, true, this.settings)
    } else {
      html = invoiceService.generateThermal58mmHTML(updatedBill, true, this.settings)
    }

    const success = await this.printHtml(html)

    if (success) {
      this.updateJob(job.id, 'COMPLETED')
      return { success: true }
    } else {
      const errorMsg = 'Unable to print. Please check printer connection.'
      this.updateJob(job.id, 'FAILED', errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Quick Print Receipt: Prints compact thermal slip
   */
  public async printReceipt(
    bill: Bill,
    paperSize: '58mm' | '80mm' = '58mm'
  ): Promise<{ success: boolean; error?: string }> {
    return this.printInvoice(bill, paperSize, 1)
  }

  /**
   * Performs a test print
   */
  public async testPrint(
    type: 'token' | 'invoice_a4' | 'invoice_80mm' | 'invoice_58mm' = 'token'
  ): Promise<{ success: boolean; error?: string }> {
    if (type === 'token') {
      const testToken: Token = {
        id: 'test-token',
        tokenNumber: 'T999',
        displayNumber: '#999',
        sequence: 999,
        appointmentId: 'test-apt',
        appointmentType: 'WALK_IN',
        clientId: 'test-cli',
        clientName: 'Priya Sharma (Sample)',
        clientPhone: '+91 98201 44521',
        serviceId: 'test-srv',
        serviceName: 'Hair Cut & Styling',
        serviceDuration: 45,
        servicePrice: 499,
        staffId: 'test-staff',
        staffName: 'Rahul Mehta',
        date: new Date().toISOString().split('T')[0],
        status: 'WAITING',
        priority: 'VIP',
        estimatedWaitMinutes: 15,
        createdAt: new Date().toISOString(),
        checkedInAt: new Date().toISOString(),
      }
      const ok = await this.printToken(testToken)
      return { success: ok }
    }

    const sampleBill: Bill = {
      id: 'test-bill',
      invoiceNumber: 'INV-SAMPLE',
      clientId: 'c1',
      clientName: 'Priya Sharma',
      clientPhone: '+91 98201 44521',
      clientEmail: 'priya.sharma@example.com',
      staffId: 'st1',
      staffName: 'Camille Dupré',
      items: [
        {
          id: 'item-1',
          type: 'service',
          name: 'Hair Cut & Styling',
          quantity: 1,
          unitPrice: 499,
          discount: 0,
          tax: 89.82,
          total: 499,
        },
        {
          id: 'item-2',
          type: 'service',
          name: 'Hair Spa & Conditioning',
          quantity: 1,
          unitPrice: 899,
          discount: 100,
          tax: 143.82,
          total: 799,
        },
      ],
      subtotal: 1398,
      discount: 100,
      taxableAmount: 1298,
      tax: 233.64,
      taxRate: 18,
      rounding: 0.36,
      roundingMode: 'nearest_1',
      grandTotal: 1532,
      paidAmount: 1532,
      dueAmount: 0,
      paymentMethod: 'upi',
      paymentStatus: 'PAID',
      status: 'completed',
      createdAt: new Date().toISOString(),
    }

    if (type === 'invoice_a4') {
      return this.printInvoice(sampleBill, 'a4')
    } else if (type === 'invoice_80mm') {
      return this.printInvoice(sampleBill, '80mm')
    } else {
      return this.printInvoice(sampleBill, '58mm')
    }
  }
}

export const printService = new PrintService()
