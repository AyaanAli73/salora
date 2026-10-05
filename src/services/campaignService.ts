import {
  CustomerSegment,
  MarketingCampaign,
  MarketingDashboardStats,
  CampaignStatus,
} from '@/types'
import {
  DEFAULT_SEGMENTS,
} from '@/data/mockMarketing'
import { clientService } from './clientService'
import { filterClientsBySegment } from './marketing/segmentEvaluator'
import { communicationService } from './communicationService'

const SEGMENTS_KEY = 'salora_customer_segments_v1'
const CAMPAIGNS_KEY = 'salora_marketing_campaigns_v1'

function getStoredSegments(): CustomerSegment[] {
  try {
    const raw = localStorage.getItem(SEGMENTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed reading segments from storage:', err)
  }
  return DEFAULT_SEGMENTS
}

function saveStoredSegments(segments: CustomerSegment[]): void {
  try {
    localStorage.setItem(SEGMENTS_KEY, JSON.stringify(segments))
  } catch (err) {
    console.error('Failed saving segments:', err)
  }
}

function getStoredCampaigns(): MarketingCampaign[] {
  try {
    const raw = localStorage.getItem(CAMPAIGNS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed reading campaigns from storage:', err)
  }
  return []
}

function saveStoredCampaigns(campaigns: MarketingCampaign[]): void {
  try {
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns))
  } catch (err) {
    console.error('Failed saving campaigns:', err)
  }
}

export const campaignService = {
  // ─── 1. SEGMENTS ───
  async getSegments(): Promise<CustomerSegment[]> {
    await new Promise((res) => setTimeout(res, 20))
    const segments = getStoredSegments()

    // Dynamically refresh counts against active clients
    try {
      const allClients = await clientService.getAll()
      return segments.map((seg) => {
        const matches = filterClientsBySegment(allClients, seg)
        return {
          ...seg,
          customerCount: matches.length,
          matchingClientIds: matches.map((c) => c.id),
        }
      })
    } catch {
      return segments
    }
  },

  async getSegmentById(id: string): Promise<CustomerSegment | undefined> {
    const segments = await this.getSegments()
    return segments.find((s) => s.id === id)
  },

  async createSegment(
    data: Omit<CustomerSegment, 'id' | 'customerCount' | 'createdAt' | 'updatedAt'>
  ): Promise<CustomerSegment> {
    const all = getStoredSegments()
    const allClients = await clientService.getAll()
    const matches = filterClientsBySegment(allClients, data)

    const now = new Date().toISOString()
    const newSegment: CustomerSegment = {
      ...data,
      id: `seg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      customerCount: matches.length,
      matchingClientIds: matches.map((c) => c.id),
      createdAt: now,
      updatedAt: now,
    }

    all.push(newSegment)
    saveStoredSegments(all)
    return newSegment
  },

  async updateSegment(id: string, data: Partial<CustomerSegment>): Promise<CustomerSegment> {
    const all = getStoredSegments()
    const idx = all.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error('Segment not found')

    const allClients = await clientService.getAll()
    const updatedDraft = { ...all[idx], ...data }
    const matches = filterClientsBySegment(allClients, updatedDraft)

    const updated: CustomerSegment = {
      ...updatedDraft,
      customerCount: matches.length,
      matchingClientIds: matches.map((c) => c.id),
      updatedAt: new Date().toISOString(),
    }

    all[idx] = updated
    saveStoredSegments(all)
    return updated
  },

  async deleteSegment(id: string): Promise<boolean> {
    const all = getStoredSegments()
    const filtered = all.filter((s) => s.id !== id)
    saveStoredSegments(filtered)
    return true
  },

  async getMatchingClientsForSegment(segmentId: string) {
    const allClients = await clientService.getAll()
    const segment = (await this.getSegments()).find((s) => s.id === segmentId)
    if (!segment) return []
    return filterClientsBySegment(allClients, segment)
  },

  // ─── 2. CAMPAIGNS ───
  async getCampaigns(): Promise<MarketingCampaign[]> {
    await new Promise((res) => setTimeout(res, 30))
    return getStoredCampaigns()
  },

  async getCampaignById(id: string): Promise<MarketingCampaign | undefined> {
    const all = await this.getCampaigns()
    return all.find((c) => c.id === id)
  },

  async createCampaign(
    data: Omit<MarketingCampaign, 'id' | 'metrics' | 'createdAt' | 'updatedAt'>
  ): Promise<MarketingCampaign> {
    const all = getStoredCampaigns()
    const now = new Date().toISOString()

    const newCampaign: MarketingCampaign = {
      ...data,
      id: `camp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      metrics: {
        sent: data.status === 'RUNNING' ? data.audienceSize : 0,
        delivered: data.status === 'RUNNING' ? Math.floor(data.audienceSize * 0.95) : 0,
        read: data.status === 'RUNNING' ? Math.floor(data.audienceSize * 0.8) : 0,
        clicked: data.status === 'RUNNING' ? Math.floor(data.audienceSize * 0.5) : 0,
        redemptions: 0,
        revenue: 0,
        conversionRate: 0,
      },
      isSimulatedAnalytics: true,
      createdAt: now,
      updatedAt: now,
    }

    all.unshift(newCampaign)
    saveStoredCampaigns(all)
    return newCampaign
  },

  async updateCampaign(id: string, data: Partial<MarketingCampaign>): Promise<MarketingCampaign> {
    const all = getStoredCampaigns()
    const idx = all.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Campaign not found')

    const updated: MarketingCampaign = {
      ...all[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    }

    all[idx] = updated
    saveStoredCampaigns(all)
    return updated
  },

  async updateStatus(id: string, status: CampaignStatus): Promise<MarketingCampaign> {
    const all = getStoredCampaigns()
    const idx = all.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Campaign not found')

    const current = all[idx]
    let metrics = { ...current.metrics }

    if (status === 'RUNNING' && current.metrics.sent === 0) {
      metrics = {
        sent: current.audienceSize,
        delivered: Math.floor(current.audienceSize * 0.96),
        read: Math.floor(current.audienceSize * 0.82),
        clicked: Math.floor(current.audienceSize * 0.55),
        redemptions: Math.floor(current.audienceSize * 0.3),
        revenue: Math.floor(current.audienceSize * 0.3 * 1850),
        conversionRate: 30.0,
      }
    }

    const updated: MarketingCampaign = {
      ...current,
      status,
      metrics,
      updatedAt: new Date().toISOString(),
    }

    all[idx] = updated
    saveStoredCampaigns(all)
    return updated
  },

  async sendTestMessage(campaignId: string, testContact: string): Promise<boolean> {
    const campaign = await this.getCampaignById(campaignId)
    if (!campaign) throw new Error('Campaign not found')

    await communicationService.dispatch({
      customerId: 'cli-test-recipient',
      customerName: 'Test Recipient',
      recipientContact: testContact,
      channel: campaign.channel,
      category: 'MARKETING',
      subject: campaign.subject || `[TEST CAMPAIGN] ${campaign.name}`,
      body: campaign.message
        .replace(/\{\{customer_name\}\}/gi, 'Test Recipient')
        .replace(/\{\{salon_name\}\}/gi, 'SALORA Luxe Hair & Beauty')
        .replace(/\{\{service_name\}\}/gi, 'Signature Hair Spa')
        .replace(/\{\{offer_details\}\}/gi, campaign.offerCode || 'Special Salon Privilege'),
      referenceId: `test-${campaign.id}`,
    })

    return true
  },

  // ─── 3. DASHBOARD METRICS ───
  async getDashboardStats(): Promise<MarketingDashboardStats> {
    const campaigns = await this.getCampaigns()
    const active = campaigns.filter((c) => c.status === 'RUNNING')

    const totalSent = campaigns.reduce((acc, c) => acc + (c.metrics.sent || 0), 0)
    const totalDelivered = campaigns.reduce((acc, c) => acc + (c.metrics.delivered || 0), 0)
    const totalOpened = campaigns.reduce((acc, c) => acc + (c.metrics.read || 0), 0)
    const totalConversions = campaigns.reduce((acc, c) => acc + (c.metrics.redemptions || 0), 0)
    const totalRevenue = campaigns.reduce((acc, c) => acc + (c.metrics.revenue || 0), 0)

    const campaignPerformanceChart = campaigns.slice(0, 5).map((c) => ({
      campaignName: c.name.length > 20 ? c.name.substring(0, 20) + '…' : c.name,
      sent: c.metrics.sent,
      redemptions: c.metrics.redemptions,
      revenue: c.metrics.revenue,
    }))

    return {
      activeCampaigns: active.length,
      messagesSent: totalSent,
      delivered: totalDelivered,
      opened: totalOpened,
      conversions: totalConversions,
      revenueFromCampaigns: totalRevenue,
      campaignPerformanceChart,
      engagementChart: [],
    }
  },
}
