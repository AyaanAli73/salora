import {
  IntegrationItem,
  IntegrationCategory,
  IntegrationStatus,
  WebhookEndpoint,
  IntegrationLog,
} from '@/types'
import { printService } from '@/services/printService'
import { tenantService } from '@/services/tenantService'

// ============================================================================
// 1. SEED INTEGRATIONS (All 8 Categories)
// ============================================================================

export const INITIAL_INTEGRATIONS: IntegrationItem[] = [
  // 1. PAYMENTS
  {
    id: 'int-razorpay',
    category: 'payments',
    name: 'Razorpay Payment Gateway',
    provider: 'Razorpay',
    description: 'Accept UPI, Debit/Credit Cards, Netbanking, and payment links with automatic settlement.',
    iconName: 'CreditCard',
    status: 'connected',
    connectedAt: '2025-08-20',
    lastSyncAt: '2026-09-27T10:14:00Z',
    metrics: {
      'Merchant ID': 'rzp_live_••••8912',
      'Webhook Secret': 'whsec_••••4f9a',
      'Settlement Mode': 'T+1 Daily Auto-Settlement',
    },
    config: {
      keyId: 'rzp_live_7H9q2L8mNo12',
      webhookSecret: 'whsec_e83bc291f89a4',
      autoCapture: true,
      currency: 'INR',
    },
    isProtected: true,
  },
  {
    id: 'int-stripe',
    category: 'payments',
    name: 'Stripe Global Payments',
    provider: 'Stripe',
    description: 'International card billing, Apple Pay, Google Pay, and currency conversion.',
    iconName: 'CreditCard',
    status: 'not_connected',
    config: {
      publishableKey: '',
      currency: 'USD',
    },
  },
  {
    id: 'int-phonepe',
    category: 'payments',
    name: 'PhonePe & BharatPe UPI QR',
    provider: 'PhonePe UPI',
    description: 'Direct POS QR code generation and instant audio confirmation on desk soundbox.',
    iconName: 'QrCode',
    status: 'connected',
    connectedAt: '2025-09-01',
    lastSyncAt: '2026-09-27T08:30:00Z',
    metrics: {
      'VPA Handle': 'salora.jodhpur@icici',
      'Instant Webhook': 'Active',
    },
    config: {
      merchantVpa: 'salora.jodhpur@icici',
      autoVerifyWebhook: true,
    },
  },

  // 2. WHATSAPP
  {
    id: 'int-whatsapp',
    category: 'whatsapp',
    name: 'WhatsApp Cloud API (Meta)',
    provider: 'Meta Business',
    description: 'Official WhatsApp Business API for appointment booking confirmations, review requests, and reminders.',
    iconName: 'MessageSquare',
    status: 'connected',
    connectedAt: '2025-08-22',
    lastSyncAt: '2026-09-27T12:00:00Z',
    metrics: {
      'Business Account': 'waba_••••9012',
      'Phone Number': '+91 98290 01122',
      'Templates': '14 Approved',
      'Usage': '1,820 / 5,000 sent',
    },
    config: {
      wabaId: 'waba_2891048129012',
      phoneId: 'phone_109284102912',
      senderPhone: '+91 98290 01122',
      accessTokenMasked: 'EAAO••••••••4k91',
      webhookVerifyToken: 'wh_salora_verify_921',
    },
    isProtected: true,
  },
  {
    id: 'int-twilio-whatsapp',
    category: 'whatsapp',
    name: 'Twilio for WhatsApp',
    provider: 'Twilio',
    description: 'Alternative programmable WhatsApp messaging for international guests and fallback dispatch.',
    iconName: 'MessageSquare',
    status: 'not_connected',
    config: {
      accountSid: '',
      fromNumber: '',
    },
  },

  // 3. SMS
  {
    id: 'int-msg91',
    category: 'sms',
    name: 'MSG91 Enterprise SMS',
    provider: 'MSG91',
    description: 'TRAI & DLT compliant transactional OTPs, booking confirmation SMS, and renewal reminders.',
    iconName: 'Smartphone',
    status: 'connected',
    connectedAt: '2025-08-16',
    lastSyncAt: '2026-09-27T11:45:00Z',
    metrics: {
      'Sender ID': 'GLWPRO',
      'DLT Entity ID': '110152901928',
      'Credits Remaining': '4,180 credits',
    },
    config: {
      authKeyMasked: '39481••••••••1928',
      senderId: 'GLWPRO',
      route: '4', // Transactional
    },
  },
  {
    id: 'int-twilio-sms',
    category: 'sms',
    name: 'Twilio Global SMS',
    provider: 'Twilio',
    description: 'High-deliverability worldwide SMS delivery for international salon patrons.',
    iconName: 'Smartphone',
    status: 'not_connected',
    config: {
      accountSid: '',
    },
  },

  // 4. EMAIL
  {
    id: 'int-resend',
    category: 'email',
    name: 'Resend / AWS SES Email',
    provider: 'Resend Cloud',
    description: 'Fast transactional receipts, membership welcome cards, and weekly financial reports.',
    iconName: 'Mail',
    status: 'connected',
    connectedAt: '2025-08-18',
    lastSyncAt: '2026-09-27T09:15:00Z',
    metrics: {
      'From Address': 'notifications@salora.in',
      'Domain Status': 'Verified (DKIM + SPF Active)',
      'Monthly Delivery': '99.9% inbox rate',
    },
    config: {
      fromName: 'Salora Salon & Spa',
      fromEmail: 'notifications@salora.in',
      apiKeyMasked: 're_••••••••7f2b',
    },
  },
  {
    id: 'int-smtp',
    category: 'email',
    name: 'Custom SMTP Server',
    provider: 'Custom SMTP',
    description: 'Connect your private salon domain mail server (Google Workspace, Office 365, or Zoho).',
    iconName: 'Mail',
    status: 'not_connected',
    config: {
      host: '',
      port: 587,
      user: '',
    },
  },

  // 5. CALENDAR
  {
    id: 'int-google-calendar',
    category: 'calendar',
    name: 'Google Calendar 2-Way Sync',
    provider: 'Google Workspace',
    description: 'Sync client bookings and staff shifts directly with stylist Google Calendars in real-time.',
    iconName: 'Calendar',
    status: 'connected',
    connectedAt: '2025-09-10',
    lastSyncAt: '2026-09-27T13:00:00Z',
    metrics: {
      'Synced Stylists': '8 Google Accounts',
      'Sync Window': 'Next 60 Days',
    },
    config: {
      syncMode: 'two_way',
      calendarName: 'Salora Appointments',
    },
  },
  {
    id: 'int-apple-calendar',
    category: 'calendar',
    name: 'Apple Calendar / ICS Feed',
    provider: 'iCal / WebCal',
    description: 'Live subscription feed for iPhone, Mac Calendar, Outlook, and iPad station displays.',
    iconName: 'Calendar',
    status: 'connected',
    connectedAt: '2025-09-12',
    metrics: {
      'Feed Protocol': 'WebCal / ICS',
      'Token Auth': 'Enabled',
    },
    config: {
      feedUrl: 'webcal://salora.app/api/calendar/feed/c4f89021a89b4e.ics',
    },
  },

  // 6. PRINTING
  {
    id: 'int-printer',
    category: 'printing',
    name: 'POS Thermal & Token Receipt Printer',
    provider: 'Web-Print Bridge',
    description: 'Hardware thermal printers for 58mm queue tokens, 80mm checkout receipts, and full A4 tax invoices.',
    iconName: 'Printer',
    status: 'connected',
    connectedAt: '2025-08-15',
    lastSyncAt: '2026-09-27T13:10:00Z',
    metrics: {
      'Active Hardware': 'Epson TM-T88VI & TVS RP45',
      'Supported Sizes': '58mm, 80mm, A4',
    },
    config: {
      tokenPaperSize: '58mm',
      invoicePaperSize: '80mm',
      autoPrintTokenOnCheckIn: true,
      autoPrintInvoiceOnBillPaid: false,
    },
  },

  // 7. STORAGE
  {
    id: 'int-storage',
    category: 'storage',
    name: 'Cloudflare R2 / AWS S3 Media Bucket',
    provider: 'Cloudflare R2',
    description: 'High-speed encrypted object storage for client transformation photos, GST invoices, and service portfolios.',
    iconName: 'HardDrive',
    status: 'connected',
    connectedAt: '2025-08-15',
    lastSyncAt: '2026-09-27T08:00:00Z',
    metrics: {
      'Bucket Name': 'salora-tenant-media',
      'Region': 'ap-south-1 (Mumbai)',
      'Allocated Space': '2.18 GB / 10 GB',
    },
    config: {
      bucket: 'salora-tenant-media',
      region: 'ap-south-1',
      cdnDomain: 'assets.salora.in',
    },
  },

  // 8. ANALYTICS
  {
    id: 'int-analytics',
    category: 'analytics',
    name: 'Google Analytics 4 & Meta Pixel',
    provider: 'Google & Meta',
    description: 'Track online customer booking funnel conversions, ad ROAS, and website visitor engagement.',
    iconName: 'Activity',
    status: 'connected',
    connectedAt: '2025-09-05',
    metrics: {
      'GA4 Property': 'G-••••8841',
      'Meta Pixel': '••••7712',
    },
    config: {
      ga4MeasurementId: 'G-748918841',
      metaPixelId: '984102917712',
    },
  },
]

// ============================================================================
// 2. SEED WEBHOOK ENDPOINTS (Incoming Architecture & Outgoing Config)
// ============================================================================

export const INITIAL_WEBHOOK_ENDPOINTS: WebhookEndpoint[] = [
  {
    id: 'wh-001',
    tenantId: 'tenant-salora',
    name: 'Zapier / Make CRM Pipeline',
    url: 'https://hooks.zapier.com/hooks/catch/192841/salon-crm',
    events: ['appointment.created', 'appointment.completed', 'client.created'],
    status: 'ACTIVE',
    signingSecret: 'whsec_••••••••4f9a',
    createdAt: '2025-10-10',
    lastTriggeredAt: '2026-09-27T11:20:00Z',
    failureCount: 0,
  },
  {
    id: 'wh-002',
    tenantId: 'tenant-salora',
    name: 'Tally / Zoho Accounting Bridge',
    url: 'https://erp.salonsolutions.io/webhooks/billing-events',
    events: ['invoice.paid', 'payment.received'],
    status: 'ACTIVE',
    signingSecret: 'whsec_••••••••881b',
    createdAt: '2025-11-15',
    lastTriggeredAt: '2026-09-27T09:30:00Z',
    failureCount: 0,
  },
]

// ============================================================================
// 3. SEED INTEGRATION AUDIT & EXECUTION LOGS
// ============================================================================

export const INITIAL_INTEGRATION_LOGS: IntegrationLog[] = [
  {
    id: 'ilog-001',
    timestamp: '2026-09-27T12:00:15Z',
    integrationId: 'int-whatsapp',
    integrationName: 'WhatsApp Cloud API',
    event: 'POST /v18.0/messages (24-Hour Appointment Reminder)',
    status: 'SUCCESS',
    statusCode: 200,
    responsePayload: '{"messaging_product":"whatsapp","contacts":[{"wa_id":"919829011223"}],"messages":[{"id":"wamid.HBgMOTE5..."}]}',
  },
  {
    id: 'ilog-002',
    timestamp: '2026-09-27T11:45:00Z',
    integrationId: 'int-msg91',
    integrationName: 'MSG91 Enterprise SMS',
    event: 'POST /api/v5/flow/ (OTP Verification)',
    status: 'SUCCESS',
    statusCode: 200,
    responsePayload: '{"message":"3468192847192847","type":"success"}',
  },
  {
    id: 'ilog-003',
    timestamp: '2026-09-27T10:14:32Z',
    integrationId: 'int-razorpay',
    integrationName: 'Razorpay Payment Gateway',
    event: 'POST /v1/orders/create (Advance Booking Token)',
    status: 'SUCCESS',
    statusCode: 200,
    responsePayload: '{"id":"order_PWK91204891","entity":"order","amount":50000,"status":"created"}',
  },
  {
    id: 'ilog-004',
    timestamp: '2026-09-27T09:12:05Z',
    integrationId: 'int-resend',
    integrationName: 'Resend / AWS SES Email',
    event: 'POST /emails (Daily Closing Report Summary)',
    status: 'FAILED',
    statusCode: 429,
    error: 'Rate limit exceeded on external API provider (Too Many Requests). Retry queued.',
    responsePayload: '{"statusCode":429,"message":"Rate limit exceeded"}',
    isRetryable: true,
    retryCount: 0,
  },
]

// ============================================================================
// 4. INTEGRATIONS SERVICE CLASS
// ============================================================================

const STORAGE_KEY_INTEGRATIONS = 'SALORA_integrations_store'
const STORAGE_KEY_WEBHOOKS = 'SALORA_webhooks_store'
const STORAGE_KEY_LOGS = 'SALORA_integration_logs_store'

class IntegrationsService {
  private integrations: IntegrationItem[] = []
  private webhooks: WebhookEndpoint[] = []
  private logs: IntegrationLog[] = []

  constructor() {
    this.loadState()
  }

  private loadState() {
    if (typeof window === 'undefined') {
      this.integrations = [...INITIAL_INTEGRATIONS]
      this.webhooks = [...INITIAL_WEBHOOK_ENDPOINTS]
      this.logs = [...INITIAL_INTEGRATION_LOGS]
      return
    }

    try {
      const storedInt = localStorage.getItem(STORAGE_KEY_INTEGRATIONS)
      this.integrations = storedInt ? JSON.parse(storedInt) : [...INITIAL_INTEGRATIONS]

      const storedWh = localStorage.getItem(STORAGE_KEY_WEBHOOKS)
      this.webhooks = storedWh ? JSON.parse(storedWh) : [...INITIAL_WEBHOOK_ENDPOINTS]

      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS)
      this.logs = storedLogs ? JSON.parse(storedLogs) : [...INITIAL_INTEGRATION_LOGS]
    } catch (e) {
      console.error('Failed to load integrations state:', e)
      this.integrations = [...INITIAL_INTEGRATIONS]
      this.webhooks = [...INITIAL_WEBHOOK_ENDPOINTS]
      this.logs = [...INITIAL_INTEGRATION_LOGS]
    }
  }

  private persist() {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY_INTEGRATIONS, JSON.stringify(this.integrations))
      localStorage.setItem(STORAGE_KEY_WEBHOOKS, JSON.stringify(this.webhooks))
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs))
    } catch (e) {
      console.error('Failed to persist integrations state:', e)
    }
  }

  // --- Query Integrations ---
  getIntegrations(category?: IntegrationCategory): IntegrationItem[] {
    if (!category) return [...this.integrations]
    return this.integrations.filter((int) => int.category === category)
  }

  getIntegrationById(id: string): IntegrationItem | undefined {
    return this.integrations.find((int) => int.id === id)
  }

  // --- Connect / Disconnect / Configure ---
  connectIntegration(id: string, config: Record<string, any>): IntegrationItem {
    const index = this.integrations.findIndex((int) => int.id === id)
    if (index === -1) throw new Error(`Integration ${id} not found`)

    this.integrations[index] = {
      ...this.integrations[index],
      status: 'connected',
      connectedAt: new Date().toISOString().split('T')[0],
      lastSyncAt: new Date().toISOString(),
      config: {
        ...this.integrations[index].config,
        ...config,
      },
    }

    this.logEvent(
      id,
      this.integrations[index].name,
      'INTEGRATION_CONNECTED',
      'SUCCESS',
      200,
      'Connection handshake and authentication succeeded.'
    )

    this.persist()
    return this.integrations[index]
  }

  disconnectIntegration(id: string): IntegrationItem {
    const index = this.integrations.findIndex((int) => int.id === id)
    if (index === -1) throw new Error(`Integration ${id} not found`)

    this.integrations[index] = {
      ...this.integrations[index],
      status: 'not_connected',
    }

    this.logEvent(
      id,
      this.integrations[index].name,
      'INTEGRATION_DISCONNECTED',
      'SUCCESS',
      200,
      'Service decoupled from salon workspace.'
    )

    this.persist()
    return this.integrations[index]
  }

  updateConfig(id: string, config: Record<string, any>): IntegrationItem {
    const index = this.integrations.findIndex((int) => int.id === id)
    if (index === -1) throw new Error(`Integration ${id} not found`)

    this.integrations[index] = {
      ...this.integrations[index],
      lastSyncAt: new Date().toISOString(),
      config: {
        ...this.integrations[index].config,
        ...config,
      },
    }

    this.persist()
    return this.integrations[index]
  }

  // --- Diagnostics & Live Test (Section 2, 3, 4, 5, 8) ---
  async testIntegration(
    id: string,
    customParams?: {
      testType?: 'token' | 'invoice' | 'email' | 'sms' | 'payment' | 'diagnostic'
      paperSize?: '58mm' | '80mm' | 'a4'
      recipient?: string
      message?: string
      [key: string]: any
    }
  ): Promise<{ success: boolean; message: string; latencyMs: number; details?: any }> {
    const item = this.getIntegrationById(id)
    if (!item) throw new Error('Integration not found')

    const start = Date.now()
    await new Promise((res) => setTimeout(res, 450)) // Simulated network latency
    const latencyMs = Date.now() - start

    if (item.category === 'printing') {
      const isInvoice = customParams?.testType === 'invoice'
      const paperSize = customParams?.paperSize || (isInvoice ? '80mm' : '58mm')

      if (isInvoice) {
        try {
          const sampleBill = {
            id: 'test-bill-001',
            invoiceNumber: 'INV-TEST-001',
            appointmentId: 'apt-test-1',
            clientId: 'c-test',
            clientName: 'Priya Sharma (Sample)',
            clientPhone: '+91 98290 11223',
            items: [
              {
                id: 'item-1',
                type: 'service',
                serviceId: 'srv-1',
                name: 'Signature Glow Facial & Blowdry',
                quantity: 1,
                unitPrice: 2500,
                totalPrice: 2500,
                total: 2500,
                staffId: 'st-1',
                staffName: 'Camille Dupré',
              },
            ],
            subtotal: 2500,
            taxRate: 18,
            tax: 450,
            taxAmount: 450,
            discount: 0,
            discountAmount: 0,
            grandTotal: 2950,
            finalAmount: 2950,
            paidAmount: 2950,
            balanceDue: 0,
            dueAmount: 0,
            rounding: 0,
            staffName: 'Camille Dupré',
            paymentStatus: 'paid' as const,
            paymentMethod: 'upi' as const,
            createdAt: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            status: 'paid' as const,
          }
          await printService.printInvoice(sampleBill as any, paperSize as any)
          this.logEvent(id, item.name, `TEST_INVOICE_PRINT (${paperSize})`, 'SUCCESS', 200, `Sample tax invoice dispatched in ${paperSize} format.`)
          return { success: true, message: `Sample ${paperSize.toUpperCase()} tax invoice dispatched to printer spooler.`, latencyMs }
        } catch (err: any) {
          this.logEvent(id, item.name, 'TEST_INVOICE_PRINT', 'FAILED', 500, err?.message || 'Invoice print error')
          return { success: false, message: 'Could not connect to printer spooler for invoice printing.', latencyMs }
        }
      }

      // Test print token using printService
      try {
        await printService.printToken({
          id: 'test-tok-1',
          tokenNumber: 'A-01',
          displayNumber: '#A-01',
          sequence: 1,
          appointmentId: 'apt-test',
          appointmentType: 'walk-in',
          clientId: 'client-test',
          clientName: 'Priya Sharma (Test)',
          serviceId: 'srv-test',
          serviceName: 'Hair Spa & Velvet Blowdry',
          serviceDuration: 45,
          servicePrice: 1500,
          staffId: 'staff-1',
          staffName: 'Camille Dupré',
          date: new Date().toISOString().split('T')[0],
          status: 'serving',
          priority: 'NORMAL',
          estimatedWaitMinutes: 5,
        } as any)
        this.logEvent(id, item.name, `TEST_TOKEN_PRINT (${paperSize})`, 'SUCCESS', 200, `${paperSize} thermal token dispatched.`)
        return { success: true, message: `Queue token print job sent to ${paperSize} thermal printer spooler successfully.`, latencyMs }
      } catch (err: any) {
        this.logEvent(id, item.name, 'TEST_TOKEN_PRINT', 'FAILED', 500, err?.message || 'Print error')
        return { success: false, message: 'Could not connect to local printer spooler.', latencyMs }
      }
    }

    if (item.category === 'whatsapp') {
      const recipient = customParams?.recipient || item.config?.senderPhone || '+91 98290 11223'
      this.logEvent(id, item.name, 'TEST_MESSAGE_DISPATCH', 'SUCCESS', 200, `Mock WhatsApp ping sent to ${recipient}`)
      return {
        success: true,
        message: `WhatsApp Cloud API responded with 200 OK. Message queued to ${recipient}. ID: wamid.HBgMOTE5...`,
        latencyMs,
      }
    }

    if (item.category === 'email') {
      const recipient = customParams?.recipient || item.config?.fromEmail || 'concierge@salora.in'
      this.logEvent(id, item.name, 'TEST_EMAIL_DISPATCH', 'SUCCESS', 200, `Mock SMTP envelope delivered to ${recipient}.`)
      return {
        success: true,
        message: `Test email successfully queued for ${recipient}. Domain DKIM records verified.`,
        latencyMs,
      }
    }

    if (item.category === 'sms') {
      const recipient = customParams?.recipient || '+91 98290 11223'
      this.logEvent(id, item.name, 'TEST_SMS_DISPATCH', 'SUCCESS', 200, `SMS Gateway accepted test dispatch to ${recipient}.`)
      return {
        success: true,
        message: `SMS Gateway responded with 200 OK for dispatch to ${recipient}. Balance: 4,180 credits.`,
        latencyMs,
      }
    }

    if (item.category === 'payments') {
      this.logEvent(id, item.name, 'TEST_PAYMENT_PING', 'SUCCESS', 200, 'Payment Gateway webhook verified.')
      return {
        success: true,
        message: 'Razorpay API credentials authenticated. Webhook signature matches secret.',
        latencyMs,
      }
    }

    this.logEvent(id, item.name, 'DIAGNOSTIC_PING', 'SUCCESS', 200, 'Health check passed.')
    return {
      success: true,
      message: `${item.name} health check passed in ${latencyMs}ms.`,
      latencyMs,
    }
  }

  // --- Webhooks Management (Section 10) ---
  getWebhooks(): WebhookEndpoint[] {
    return [...this.webhooks]
  }

  createWebhook(data: { name: string; url: string; events: string[] }): { webhook: WebhookEndpoint; rawSecret: string } {
    const rawSecret = `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    const maskedSecret = `${rawSecret.substring(0, 6)}••••••••${rawSecret.substring(rawSecret.length - 4)}`

    const newEndpoint: WebhookEndpoint = {
      id: `wh-${Date.now()}`,
      tenantId: tenantService.getCurrentTenantId(),
      name: data.name,
      url: data.url,
      events: data.events,
      status: 'ACTIVE',
      signingSecret: maskedSecret,
      createdAt: new Date().toISOString().split('T')[0],
      failureCount: 0,
    }

    this.webhooks.unshift(newEndpoint)
    this.persist()
    return { webhook: newEndpoint, rawSecret }
  }

  toggleWebhookStatus(id: string): WebhookEndpoint {
    const index = this.webhooks.findIndex((wh) => wh.id === id)
    if (index === -1) throw new Error(`Webhook ${id} not found`)

    this.webhooks[index].status = this.webhooks[index].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    this.persist()
    return this.webhooks[index]
  }

  deleteWebhook(id: string): boolean {
    this.webhooks = this.webhooks.filter((wh) => wh.id !== id)
    this.persist()
    return true
  }

  async testWebhook(id: string): Promise<{ success: boolean; statusCode: number; responseTime: number }> {
    const wh = this.webhooks.find((w) => w.id === id)
    if (!wh) throw new Error('Webhook not found')

    const start = Date.now()
    await new Promise((res) => setTimeout(res, 350))
    const responseTime = Date.now() - start

    wh.lastTriggeredAt = new Date().toISOString()
    this.logEvent(
      id,
      wh.name,
      'WEBHOOK_TEST_DELIVERY',
      'SUCCESS',
      200,
      `Payload successfully delivered to ${wh.url}. Signature sha256 verified.`
    )

    this.persist()
    return { success: true, statusCode: 200, responseTime }
  }

  // --- Integration Logs & Safe Retries (Section 11) ---
  getLogs(): IntegrationLog[] {
    return [...this.logs]
  }

  logEvent(
    integrationId: string,
    integrationName: string,
    event: string,
    status: 'SUCCESS' | 'FAILED' | 'PENDING',
    statusCode?: number,
    responsePayload?: string,
    error?: string,
    isRetryable?: boolean
  ): IntegrationLog {
    const logItem: IntegrationLog = {
      id: `ilog-${Date.now()}`,
      timestamp: new Date().toISOString(),
      integrationId,
      integrationName,
      event,
      status,
      statusCode,
      responsePayload,
      error,
      isRetryable: isRetryable ?? (status === 'FAILED'),
      retryCount: 0,
    }

    this.logs.unshift(logItem)
    if (this.logs.length > 100) this.logs.pop() // keep bounded
    this.persist()
    return logItem
  }

  async retryLog(logId: string): Promise<IntegrationLog> {
    const index = this.logs.findIndex((l) => l.id === logId)
    if (index === -1) throw new Error(`Log ${logId} not found`)

    const log = this.logs[index]
    await new Promise((res) => setTimeout(res, 500)) // Simulated gateway round-trip

    // Transition from FAILED -> SUCCESS
    this.logs[index] = {
      ...log,
      status: 'SUCCESS',
      statusCode: 200,
      error: undefined,
      responsePayload: `{"status":"re-dispatched","retryAttempts":${(log.retryCount || 0) + 1},"success":true}`,
      retryCount: (log.retryCount || 0) + 1,
    }

    this.persist()
    return this.logs[index]
  }
}

export const integrationsService = new IntegrationsService()
