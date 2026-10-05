import {
  CommunicationChannel,
  CommunicationLogStatus,
  MessageCategory,
} from '@/types'
import { useCustomerNotificationStore } from '@/store/useCustomerNotificationStore'

export interface ProviderSendPayload {
  recipientId: string
  recipientName: string
  recipientContact: string // phone, email, or customer user ID
  channel: CommunicationChannel
  category: MessageCategory
  subject?: string
  body: string
  referenceId?: string
  metadata?: Record<string, any>
}

export interface ProviderDeliveryResult {
  success: boolean
  status: CommunicationLogStatus
  externalMessageId?: string
  deliveredAt?: string
  error?: string
  providerName: string
}

/**
 * Universal Provider-Agnostic Interface.
 * Any third-party carrier (Meta WhatsApp Cloud API, Twilio, SendGrid, Gupshup, Postmark, AWS SES/SNS)
 * implements this contract, ensuring Salora never hardcodes a single vendor.
 */
export interface ICommunicationProvider {
  readonly channel: CommunicationChannel
  readonly name: string
  isConfigured: () => boolean
  send: (payload: ProviderSendPayload) => Promise<ProviderDeliveryResult>
}

/**
 * 1. Native In-App Notification Provider
 * Implements real in-app push/inbox functionality right now.
 */
export class InAppProvider implements ICommunicationProvider {
  readonly channel: CommunicationChannel = 'IN_APP'
  readonly name: string = 'Native In-App Store'

  isConfigured(): boolean {
    return true
  }

  async send(payload: ProviderSendPayload): Promise<ProviderDeliveryResult> {
    try {
      const store = useCustomerNotificationStore.getState()

      let notifType: any = 'APPOINTMENT'
      if (payload.body.toLowerCase().includes('point') || payload.body.toLowerCase().includes('reward')) {
        notifType = 'REWARDS'
      } else if (payload.body.toLowerCase().includes('offer') || payload.body.toLowerCase().includes('birthday')) {
        notifType = 'OFFER'
      } else if (payload.body.toLowerCase().includes('invoice') || payload.body.toLowerCase().includes('payment')) {
        notifType = 'PAYMENT'
      } else if (payload.body.toLowerCase().includes('review') || payload.body.toLowerCase().includes('rate')) {
        notifType = 'REVIEW'
      } else if (payload.body.toLowerCase().includes('remind')) {
        notifType = 'REMINDER'
      }

      store.addNotification({
        customerId: payload.recipientId || 'cli-priya',
        type: notifType,
        title: payload.subject || 'Salon Update',
        message: payload.body,
        actionUrl:
          notifType === 'REVIEW'
            ? '/customer/reviews'
            : notifType === 'REWARDS'
            ? '/customer/rewards'
            : notifType === 'PAYMENT'
            ? '/customer/invoices'
            : '/customer/appointments',
      })

      return {
        success: true,
        status: 'DELIVERED',
        deliveredAt: new Date().toISOString(),
        externalMessageId: `inapp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        providerName: this.name,
      }
    } catch (err: any) {
      return {
        success: false,
        status: 'FAILED',
        error: err?.message || 'In-app notification delivery error',
        providerName: this.name,
      }
    }
  }
}

/**
 * 2. WhatsApp Provider (Meta Cloud API / Twilio WhatsApp / Gupshup)
 */
export class WhatsAppProvider implements ICommunicationProvider {
  readonly channel: CommunicationChannel = 'WHATSAPP'
  readonly name: string = 'Meta WhatsApp Cloud API'

  isConfigured(): boolean {
    return true
  }

  async send(payload: ProviderSendPayload): Promise<ProviderDeliveryResult> {
    // Simulate real network latency (150ms - 350ms)
    await new Promise((res) => setTimeout(res, 200))

    // Validation
    const cleanPhone = payload.recipientContact?.replace(/[^\d+]/g, '')
    if (!cleanPhone || cleanPhone.length < 8) {
      return {
        success: false,
        status: 'FAILED',
        error: 'Invalid recipient phone number. E.164 country code required.',
        providerName: this.name,
      }
    }

    return {
      success: true,
      status: 'DELIVERED',
      deliveredAt: new Date().toISOString(),
      externalMessageId: `wamid.HBgL${Date.now()}XyZ`,
      providerName: this.name,
    }
  }
}

/**
 * 3. SMS Provider (Twilio / MSG91 / AWS SNS)
 */
export class SmsProvider implements ICommunicationProvider {
  readonly channel: CommunicationChannel = 'SMS'
  readonly name: string = 'Twilio SMS Gateway'

  isConfigured(): boolean {
    return true
  }

  async send(payload: ProviderSendPayload): Promise<ProviderDeliveryResult> {
    await new Promise((res) => setTimeout(res, 180))

    const cleanPhone = payload.recipientContact?.replace(/[^\d+]/g, '')
    if (!cleanPhone || cleanPhone.length < 8) {
      return {
        success: false,
        status: 'FAILED',
        error: 'Invalid handset destination. Missing valid mobile prefix.',
        providerName: this.name,
      }
    }

    return {
      success: true,
      status: 'DELIVERED',
      deliveredAt: new Date().toISOString(),
      externalMessageId: `SM${Math.random().toString(36).substring(2, 10)}${Date.now()}`,
      providerName: this.name,
    }
  }
}

/**
 * 4. Email Provider (SendGrid / Amazon SES / Postmark)
 */
export class EmailProvider implements ICommunicationProvider {
  readonly channel: CommunicationChannel = 'EMAIL'
  readonly name: string = 'SendGrid Email Gateway'

  isConfigured(): boolean {
    return true
  }

  async send(payload: ProviderSendPayload): Promise<ProviderDeliveryResult> {
    await new Promise((res) => setTimeout(res, 220))

    if (!payload.recipientContact || !payload.recipientContact.includes('@')) {
      return {
        success: false,
        status: 'FAILED',
        error: 'Invalid recipient email address format.',
        providerName: this.name,
      }
    }

    return {
      success: true,
      status: 'DELIVERED',
      deliveredAt: new Date().toISOString(),
      externalMessageId: `sg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      providerName: this.name,
    }
  }
}

/**
 * Central Provider Registry
 */
class ProviderRegistry {
  private providers: Map<CommunicationChannel, ICommunicationProvider> = new Map()

  constructor() {
    this.register(new InAppProvider())
    this.register(new WhatsAppProvider())
    this.register(new SmsProvider())
    this.register(new EmailProvider())
  }

  register(provider: ICommunicationProvider) {
    this.providers.set(provider.channel, provider)
  }

  get(channel: CommunicationChannel): ICommunicationProvider {
    const p = this.providers.get(channel)
    if (!p) {
      // Fallback to InAppProvider
      return this.providers.get('IN_APP')!
    }
    return p
  }

  getAll(): ICommunicationProvider[] {
    return Array.from(this.providers.values())
  }
}

export const providerRegistry = new ProviderRegistry()
