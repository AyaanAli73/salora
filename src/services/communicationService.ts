import {
  MessageTemplate,
  AutomationRule,
  CommunicationLog,
  CommunicationSettings,
  CommunicationChannel,
  MessageCategory,
  Appointment,
  Client,
  Invoice,
} from '@/types'
import {
  DEFAULT_TEMPLATES,
  DEFAULT_AUTOMATIONS,
  DEFAULT_COMMUNICATION_SETTINGS,
} from '@/data/mockCommunications'
import { providerRegistry } from './communication/providers'
import {
  interpolateTemplate,
  TemplateContext,
} from './communication/templateInterpolator'

const TEMPLATES_KEY = 'salora_message_templates_v1'
const AUTOMATIONS_KEY = 'salora_automation_rules_v1'
const LOGS_KEY = 'salora_communication_logs_v1'
const SETTINGS_KEY = 'salora_communication_settings_v1'

function getStoredTemplates(): MessageTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed reading templates from localStorage:', err)
  }
  return DEFAULT_TEMPLATES
}

function saveTemplates(templates: MessageTemplate[]): void {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
  } catch (err) {
    console.error('Failed saving templates to localStorage:', err)
  }
}

function getStoredAutomations(): AutomationRule[] {
  try {
    const raw = localStorage.getItem(AUTOMATIONS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed reading automations from localStorage:', err)
  }
  return DEFAULT_AUTOMATIONS
}

function saveAutomations(rules: AutomationRule[]): void {
  try {
    localStorage.setItem(AUTOMATIONS_KEY, JSON.stringify(rules))
  } catch (err) {
    console.error('Failed saving automations to localStorage:', err)
  }
}

// Clear mock communication logs from localStorage if present
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(LOGS_KEY)
    if (raw && (raw.includes('Priya') || raw.includes('Vikram') || raw.includes('log-'))) {
      localStorage.removeItem(LOGS_KEY)
    }
  } catch {}
}

function getStoredLogs(): CommunicationLog[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed reading logs from localStorage:', err)
  }
  return []
}

function saveLogs(logs: CommunicationLog[]): void {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
  } catch (err) {
    console.error('Failed saving logs to localStorage:', err)
  }
}

function getStoredSettings(): CommunicationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed reading settings from localStorage:', err)
  }
  return DEFAULT_COMMUNICATION_SETTINGS
}

function saveSettings(settings: CommunicationSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (err) {
    console.error('Failed saving settings to localStorage:', err)
  }
}

export const communicationService = {
  // ─── 1. TEMPLATES ───
  async getTemplates(): Promise<MessageTemplate[]> {
    await new Promise((res) => setTimeout(res, 20))
    return getStoredTemplates()
  },

  async getTemplateById(id: string): Promise<MessageTemplate | undefined> {
    const all = await this.getTemplates()
    return all.find((t) => t.id === id)
  },

  async createTemplate(
    template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MessageTemplate> {
    const all = getStoredTemplates()
    const now = new Date().toISOString()
    const newTemplate: MessageTemplate = {
      ...template,
      id: `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    }
    all.unshift(newTemplate)
    saveTemplates(all)
    return newTemplate
  },

  async updateTemplate(
    id: string,
    updates: Partial<MessageTemplate>
  ): Promise<MessageTemplate> {
    const all = getStoredTemplates()
    const idx = all.findIndex((t) => t.id === id)
    if (idx === -1) throw new Error('Template not found')

    const updated: MessageTemplate = {
      ...all[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    all[idx] = updated
    saveTemplates(all)
    return updated
  },

  async deleteTemplate(id: string): Promise<boolean> {
    const all = getStoredTemplates()
    const filtered = all.filter((t) => t.id !== id)
    saveTemplates(filtered)
    return true
  },

  // ─── 2. AUTOMATION RULES ───
  async getAutomationRules(): Promise<AutomationRule[]> {
    await new Promise((res) => setTimeout(res, 20))
    return getStoredAutomations()
  },

  async updateAutomationRule(
    id: string,
    updates: Partial<AutomationRule>
  ): Promise<AutomationRule> {
    const all = getStoredAutomations()
    const idx = all.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Automation rule not found')

    const updated: AutomationRule = { ...all[idx], ...updates }
    all[idx] = updated
    saveAutomations(all)
    return updated
  },

  async toggleAutomationRule(id: string): Promise<AutomationRule> {
    const all = getStoredAutomations()
    const idx = all.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('Automation rule not found')

    const updated: AutomationRule = { ...all[idx], isActive: !all[idx].isActive }
    all[idx] = updated
    saveAutomations(all)
    return updated
  },

  // ─── 3. DELIVERY LOGS & RETRY ENGINE ───
  async getLogs(filter?: {
    customerId?: string
    channel?: string
    status?: string
    category?: string
    search?: string
  }): Promise<CommunicationLog[]> {
    await new Promise((res) => setTimeout(res, 25))
    let logs = getStoredLogs()

    if (filter) {
      if (filter.customerId) {
        logs = logs.filter((l) => l.customerId === filter.customerId)
      }
      if (filter.channel && filter.channel !== 'ALL') {
        logs = logs.filter((l) => l.channel === filter.channel)
      }
      if (filter.status && filter.status !== 'ALL') {
        logs = logs.filter((l) => l.status === filter.status)
      }
      if (filter.category && filter.category !== 'ALL') {
        logs = logs.filter((l) => l.category === filter.category)
      }
      if (filter.search?.trim()) {
        const q = filter.search.toLowerCase()
        logs = logs.filter(
          (l) =>
            l.customerName.toLowerCase().includes(q) ||
            l.recipient.toLowerCase().includes(q) ||
            l.body.toLowerCase().includes(q) ||
            (l.templateName && l.templateName.toLowerCase().includes(q))
        )
      }
    }

    return logs.sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    )
  },

  async retryFailedMessage(logId: string): Promise<CommunicationLog> {
    const logs = getStoredLogs()
    const idx = logs.findIndex((l) => l.id === logId)
    if (idx === -1) throw new Error('Log not found')

    const log = logs[idx]
    const settings = getStoredSettings()
    const maxRetries = settings.retryPolicy.maxRetries || 3

    if (log.retryCount >= maxRetries) {
      throw new Error(
        `Maximum automated retries reached (${log.retryCount}/${maxRetries}). Stopped to prevent infinite loop.`
      )
    }

    const provider = providerRegistry.get(log.channel)
    const result = await provider.send({
      recipientId: log.customerId,
      recipientName: log.customerName,
      recipientContact: log.recipient,
      channel: log.channel,
      category: log.category,
      subject: log.subject,
      body: log.body,
      referenceId: log.referenceId,
    })

    const updated: CommunicationLog = {
      ...log,
      status: result.status,
      deliveredAt: result.deliveredAt || new Date().toISOString(),
      retryCount: log.retryCount + 1,
      error: result.error ? `Retry #${log.retryCount + 1} Error: ${result.error}` : undefined,
    }

    logs[idx] = updated
    saveLogs(logs)
    return updated
  },

  // ─── 4. DISPATCHER & OPT-IN POLICY GATEWAY ───
  async dispatch(params: {
    customerId: string
    customerName: string
    recipientContact: string
    channel: CommunicationChannel
    category: MessageCategory
    templateId?: string
    templateName?: string
    subject?: string
    body: string
    referenceId?: string
    customerOptIn?: {
      marketingOptIn?: boolean
      transactionalOptIn?: boolean
    }
  }): Promise<CommunicationLog> {
    const logs = getStoredLogs()
    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const now = new Date().toISOString()

    // 1. Opt-In / Opt-Out Strict Compliance Check (Requirement 12)
    // Transactional messages must be architecturally separate from promotional campaigns.
    if (params.category === 'MARKETING' && params.customerOptIn?.marketingOptIn === false) {
      const suppressedLog: CommunicationLog = {
        id,
        customerId: params.customerId,
        customerName: params.customerName,
        recipient: params.recipientContact,
        channel: params.channel,
        category: params.category,
        templateId: params.templateId,
        templateName: params.templateName,
        status: 'FAILED',
        subject: params.subject,
        body: params.body,
        sentAt: now,
        error: 'Suppressed: Customer opted out of promotional marketing messages (DND policy respected).',
        referenceId: params.referenceId,
        retryCount: 0,
        maxRetries: 0,
        providerName: 'Opt-Out Policy Guard',
      }
      logs.unshift(suppressedLog)
      saveLogs(logs)
      return suppressedLog
    }

    // 2. Select Provider from Provider Registry
    const provider = providerRegistry.get(params.channel)

    // 3. Transmit through Provider
    const result = await provider.send({
      recipientId: params.customerId,
      recipientName: params.customerName,
      recipientContact: params.recipientContact,
      channel: params.channel,
      category: params.category,
      subject: params.subject,
      body: params.body,
      referenceId: params.referenceId,
    })

    // 4. Record to Delivery Log
    const newLog: CommunicationLog = {
      id,
      customerId: params.customerId,
      customerName: params.customerName,
      recipient: params.recipientContact,
      channel: params.channel,
      category: params.category,
      templateId: params.templateId,
      templateName: params.templateName,
      status: result.status,
      subject: params.subject,
      body: params.body,
      sentAt: now,
      deliveredAt: result.deliveredAt,
      error: result.error,
      referenceId: params.referenceId,
      retryCount: 0,
      maxRetries: 3,
      providerName: result.providerName || provider.name,
    }

    logs.unshift(newLog)
    saveLogs(logs)
    return newLog
  },

  // ─── 5. AUTOMATED EVENT TRIGGERS (Requirements 4, 6, 7, 8, 9) ───
  async triggerBookingConfirmed(
    appointment: Partial<Appointment>,
    client?: Partial<Client>,
    salonName: string = 'SALORA Luxury Salon'
  ): Promise<CommunicationLog | null> {
    const rules = await this.getAutomationRules()
    const rule = rules.find((r) => r.trigger === 'BOOKING_CONFIRMED' && r.isActive)
    if (!rule) return null

    const template = await this.getTemplateById(rule.templateId)
    if (!template || template.status !== 'ACTIVE') return null

    const context: TemplateContext = {
      customer_name: appointment.clientName || client?.fullName || 'Valued Guest',
      service_name: appointment.serviceName || 'Salon Ritual',
      appointment_date: appointment.date || 'Today',
      appointment_time: appointment.startTime || 'Scheduled Time',
      staff_name: appointment.staffName || 'Your Stylist',
      salon_name: salonName,
    }

    const body = interpolateTemplate(template.message, context)

    return this.dispatch({
      customerId: appointment.clientId || client?.id || 'guest',
      customerName: context.customer_name as string,
      recipientContact: client?.phone || client?.email || appointment.clientPhone || '+91 98765 43210',
      channel: rule.channel,
      category: rule.category,
      templateId: template.id,
      templateName: template.name,
      body,
      referenceId: appointment.id,
      customerOptIn: client?.communicationPreferences,
    })
  },

  async triggerAppointmentReminder(
    appointment: Partial<Appointment>,
    client?: Partial<Client>,
    timingDesc: string = '24 hours before'
  ): Promise<CommunicationLog | null> {
    const rules = await this.getAutomationRules()
    const rule = rules.find((r) => r.trigger === 'APPOINTMENT_REMINDER' && r.isActive)
    if (!rule) return null

    const template = await this.getTemplateById(rule.templateId)
    if (!template || template.status !== 'ACTIVE') return null

    const context: TemplateContext = {
      customer_name: appointment.clientName || client?.fullName || 'Valued Guest',
      service_name: appointment.serviceName || 'Treatment',
      appointment_time: appointment.startTime || 'Scheduled Time',
      staff_name: appointment.staffName || 'Master Stylist',
      salon_name: 'SALORA Luxury Salon',
    }

    const body = interpolateTemplate(template.message, context)

    return this.dispatch({
      customerId: appointment.clientId || client?.id || 'guest',
      customerName: context.customer_name as string,
      recipientContact: client?.phone || appointment.clientPhone || '+91 98765 43210',
      channel: rule.channel,
      category: rule.category,
      templateId: template.id,
      templateName: template.name,
      body,
      referenceId: appointment.id,
      customerOptIn: client?.communicationPreferences,
    })
  },

  async triggerReviewRequest(
    appointment: Partial<Appointment>,
    client?: Partial<Client>
  ): Promise<CommunicationLog | null> {
    const rules = await this.getAutomationRules()
    const rule = rules.find((r) => r.trigger === 'REVIEW_REQUEST' && r.isActive)
    if (!rule) return null

    const template = await this.getTemplateById(rule.templateId)
    if (!template || template.status !== 'ACTIVE') return null

    const reviewUrl = `https://salora.app/customer/reviews/new?appointmentId=${appointment.id}`

    const context: TemplateContext = {
      customer_name: appointment.clientName || client?.fullName || 'Valued Guest',
      service_name: appointment.serviceName || 'Session',
      staff_name: appointment.staffName || 'Stylist',
      review_link: reviewUrl,
      salon_name: 'SALORA Luxury Salon',
    }

    const body = interpolateTemplate(template.message, context)

    return this.dispatch({
      customerId: appointment.clientId || client?.id || 'guest',
      customerName: context.customer_name as string,
      recipientContact: client?.phone || appointment.clientPhone || '+91 98765 43210',
      channel: rule.channel,
      category: rule.category,
      templateId: template.id,
      templateName: template.name,
      body,
      referenceId: appointment.id,
      customerOptIn: client?.communicationPreferences,
    })
  },

  async triggerBirthdayGreeting(
    client: Partial<Client>,
    offerText: string = '20% discount on all luxury rituals'
  ): Promise<CommunicationLog | null> {
    const rules = await this.getAutomationRules()
    const rule = rules.find((r) => r.trigger === 'BIRTHDAY_GREETING' && r.isActive)
    if (!rule) return null

    const template = await this.getTemplateById(rule.templateId)
    if (!template || template.status !== 'ACTIVE') return null

    const context: TemplateContext = {
      customer_name: client.fullName || 'VIP Guest',
      offer_details: offerText,
      salon_name: 'SALORA Luxury Salon',
    }

    const body = interpolateTemplate(template.message, context)

    return this.dispatch({
      customerId: client.id || 'guest',
      customerName: client.fullName || 'VIP Guest',
      recipientContact: client.phone || client.email || '+91 98765 43210',
      channel: rule.channel,
      category: 'MARKETING', // Marketing campaign
      templateId: template.id,
      templateName: template.name,
      body,
      referenceId: `bday-${client.id}`,
      customerOptIn: client.communicationPreferences,
    })
  },

  // ─── 6. SETTINGS & TEST TRANSMISSION (Requirements 13 & 14) ───
  async getSettings(): Promise<CommunicationSettings> {
    await new Promise((res) => setTimeout(res, 20))
    return getStoredSettings()
  },

  async updateSettings(
    updates: Partial<CommunicationSettings>
  ): Promise<CommunicationSettings> {
    const current = getStoredSettings()
    const updated = { ...current, ...updates }
    saveSettings(updated)
    return updated
  },

  async sendTestMessage(data: {
    channel: CommunicationChannel
    recipient: string
    customMessage?: string
    templateId?: string
  }): Promise<CommunicationLog> {
    let messageBody = data.customMessage || 'This is a test notification from Salora Salon Management.'
    let templateName = 'Custom Test Message'

    if (data.templateId) {
      const tpl = await this.getTemplateById(data.templateId)
      if (tpl) {
        templateName = tpl.name
        messageBody = interpolateTemplate(tpl.message, {
          customer_name: 'Priya Sharma (Test)',
          service_name: 'Signature Diamond Haircut',
          appointment_date: 'Tomorrow',
          appointment_time: '2:30 PM',
          staff_name: 'Rahul Verma',
          salon_name: 'SALORA Luxury Salon',
          amount: '₹2,400',
          invoice_number: 'INV-TEST-01',
          review_link: 'https://salora.app/customer/reviews/new',
        })
      }
    }

    return this.dispatch({
      customerId: 'cli-test',
      customerName: 'Test Recipient',
      recipientContact: data.recipient,
      channel: data.channel,
      category: 'TRANSACTIONAL',
      templateId: data.templateId,
      templateName,
      subject: `[TEST MESSAGE] ${templateName}`,
      body: messageBody,
      referenceId: `test-${Date.now()}`,
    })
  },
}
