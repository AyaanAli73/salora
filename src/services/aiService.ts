import { Role } from '@/types'
import {
  AISettings,
  AIConversation,
  AIMessage,
  AIAssistantContext,
  AIProviderType,
} from '@/types'
import { aiToolsService, ToolExecutionResult } from './aiToolsService'

const SETTINGS_KEY = 'SALORA_ai_settings'

export const INITIAL_AI_SETTINGS: AISettings = {
  enabled: true,
  provider: 'local',
  modelName: 'Salora Salon Intelligence v2.0 (Deterministic Engine)',
  dailyQueryLimit: 100,
  usedQueriesToday: 14,
  dataAccessScopes: {
    financials: true,
    appointments: true,
    clients: true,
    staff: true,
    inventory: true,
  },
}

/**
 * AI Provider Interface
 */
export interface AIProvider {
  name: AIProviderType
  displayName: string
  generateResponse(
    prompt: string,
    history: AIMessage[],
    context: AIAssistantContext | undefined,
    userRole: Role
  ): Promise<ToolExecutionResult>
}

/**
 * 1. Local Deterministic Rule & Tool Execution Provider
 * 100% Reliable, zero fabrication, strict permission adherence.
 */
class LocalProvider implements AIProvider {
  public name: AIProviderType = 'local'
  public displayName = 'Salora On-Premises Business Intelligence (Local)'

  public async generateResponse(
    prompt: string,
    history: AIMessage[],
    context: AIAssistantContext | undefined,
    userRole: Role
  ): Promise<ToolExecutionResult> {
    const q = prompt.toLowerCase().trim()

    const tools = aiToolsService as any

    // 1. Context-specific or Named client questions (e.g. "Priya ne last time kya service li thi?")
    if (context?.clientId) {
      if (
        q.includes('she') ||
        q.includes('he') ||
        q.includes('last visit') ||
        q.includes('visited') ||
        q.includes('last time') ||
        q.includes('service li') ||
        q.includes('history')
      ) {
        return tools.getClientVisitHistory({ clientId: context.clientId })
      }
    }

    // Check for "[Name] ne last time kya service li thi" or similar query
    const clientVisitPattern = /(?:([A-Za-z\s]+)\s+ne\s+last\s+time\s+kya\s+service|what\s+service\s+did\s+([A-Za-z\s]+)\s+(?:take|get)|last\s+time\s+([A-Za-z\s]+)\s+(?:visited|took))/i
    const match = prompt.match(clientVisitPattern)
    if (match) {
      const name = (match[1] || match[2] || match[3] || '').trim()
      if (name) {
        return tools.getClientVisitHistory({ clientName: name })
      }
    }

    if (q.includes('last time') || q.includes('service li thi') || q.includes('pichli baar')) {
      const words = prompt.split(/\s+/)
      const candidateName = words.find((w) => w.length > 2 && !['last', 'time', 'kya', 'service', 'thi', 'hai', 'ne', 'ko'].includes(w.toLowerCase()))
      if (candidateName) {
        return tools.getClientVisitHistory({ clientName: candidateName })
      }
    }

    // 2. Action proposal: "Inactive customers ke liye offer banao"
    if (
      q.includes('offer banao') ||
      q.includes('campaign banao') ||
      q.includes('create offer') ||
      q.includes('make offer') ||
      (q.includes('offer') && q.includes('inactive')) ||
      (q.includes('campaign') && q.includes('inactive'))
    ) {
      return tools.prepareMarketingOffer({ cohort: 'inactive 60+ days', discountPct: 15, service: 'Hair Spa' })
    }

    // 3. Inactive Customers: "Kaunse customers 90 days se nahi aaye?"
    if (
      q.includes('nahi aaye') ||
      q.includes('nahi aayi') ||
      q.includes('not visited') ||
      q.includes('havent visited') ||
      q.includes('haven\'t visited') ||
      (q.includes('inactive') && (q.includes('customer') || q.includes('client')))
    ) {
      const days = q.includes('90') ? 90 : (q.includes('60') ? 60 : (q.includes('30') ? 30 : 60))
      return tools.searchClients({ filters: { inactiveDays: days } })
    }

    // 4. "Hair Spa ki booking kitni hui?" / Specific Service Bookings
    if (
      (q.includes('booking kitni') || q.includes('kitni hui') || q.includes('kitni booking') || q.includes('how many bookings')) &&
      (q.includes('hair spa') || q.includes('spa') || q.includes('facial') || q.includes('keratin') || q.includes('haircut'))
    ) {
      const sName = q.includes('hair spa') ? 'Hair Spa' : (q.includes('facial') ? 'Facial' : (q.includes('keratin') ? 'Keratin' : 'Haircut'))
      return tools.getServicePerformance({ serviceName: sName })
    }

    // 5. "Sabse zyada kis service se revenue aaya?" / Top Revenue Service
    if (
      q.includes('sabse zyada') ||
      q.includes('most revenue') ||
      q.includes('top service') ||
      q.includes('highest revenue') ||
      q.includes('revenue aaya')
    ) {
      return tools.getServicePerformance()
    }

    // 6. "Is month expenses kitne hain?" / Expenses
    if (
      q.includes('expense') ||
      q.includes('expenses') ||
      q.includes('kharcha') ||
      q.includes('spending') ||
      q.includes('expenses kitne')
    ) {
      return tools.getExpenseSummary({ dateQuery: prompt, userRole })
    }

    // 7. "Aaj kitni sale hui?" / "August aur September compare karo" / Revenue & Sales
    if (
      q.includes('sale') ||
      q.includes('sales') ||
      q.includes('revenue') ||
      q.includes('income') ||
      q.includes('kamai') ||
      q.includes('compare') ||
      q.includes('versus') ||
      q.includes('kaisa raha')
    ) {
      return tools.getRevenueSummary({ dateQuery: prompt, userRole })
    }

    // 8. "Kal ka appointment schedule batao" / Appointments
    if (
      q.includes('appointment') ||
      q.includes('appointments') ||
      q.includes('schedule') ||
      q.includes('booking') ||
      q.includes('kal') ||
      q.includes('tomorrow')
    ) {
      return tools.getAppointmentSummary({ dateQuery: prompt })
    }

    // 9. "Kaunse products low stock hain?" / Inventory
    if (
      q.includes('low stock') ||
      q.includes('stock') ||
      q.includes('inventory') ||
      q.includes('kam hai') ||
      q.includes('reorder')
    ) {
      return tools.getLowStockProducts()
    }

    // 10. Staff & Specialists
    if (
      q.includes('staff') ||
      q.includes('stylist') ||
      q.includes('specialist') ||
      q.includes('performer') ||
      q.includes('attendance')
    ) {
      return tools.getStaffPerformance(prompt, userRole)
    }

    // 11. Memberships & Subscriptions
    if (q.includes('membership') || q.includes('subscription')) {
      return tools.getMembershipsExpiring({ days: 30 })
    }

    // 12. Fallback to unified search across salon data
    return tools.searchSalonData({ query: prompt })

    // 12. Fallback: Unknown or unsupported query
    return {
      toolName: 'unknownQuery',
      success: false,
      textSummary:
        "I don't have enough data to answer that. As your salon business assistant, I can answer questions about revenue, appointments, clients, staff productivity, low stock, memberships, unpaid balances, and prepare promotional campaigns.",
      sourceModule: 'Salora System Assistant',
      dateRange: 'Active Operating Range',
    }
  }
}

/**
 * 2. Cloud AI Providers (OpenAI, Anthropic, Google Gemini Stubs)
 * Structured for enterprise backend proxy connectivity.
 */
class OpenAIProvider implements AIProvider {
  public name: AIProviderType = 'openai'
  public displayName = 'OpenAI GPT-4o Enterprise'
  private localFallback = new LocalProvider()

  public async generateResponse(
    prompt: string,
    history: AIMessage[],
    context: AIAssistantContext | undefined,
    userRole: Role
  ): Promise<ToolExecutionResult> {
    // In frontend prototype, dispatches safely through controlled tool executor
    return this.localFallback.generateResponse(prompt, history, context, userRole)
  }
}

class AnthropicProvider implements AIProvider {
  public name: AIProviderType = 'anthropic'
  public displayName = 'Anthropic Claude 3.5 Sonnet'
  private localFallback = new LocalProvider()

  public async generateResponse(
    prompt: string,
    history: AIMessage[],
    context: AIAssistantContext | undefined,
    userRole: Role
  ): Promise<ToolExecutionResult> {
    return this.localFallback.generateResponse(prompt, history, context, userRole)
  }
}

class GoogleProvider implements AIProvider {
  public name: AIProviderType = 'google'
  public displayName = 'Google Gemini 1.5 Pro'
  private localFallback = new LocalProvider()

  public async generateResponse(
    prompt: string,
    history: AIMessage[],
    context: AIAssistantContext | undefined,
    userRole: Role
  ): Promise<ToolExecutionResult> {
    return this.localFallback.generateResponse(prompt, history, context, userRole)
  }
}

class AIService {
  private providers: Record<AIProviderType, AIProvider> = {
    local: new LocalProvider(),
    openai: new OpenAIProvider(),
    anthropic: new AnthropicProvider(),
    google: new GoogleProvider(),
  }

  // ==========================================
  // Settings Management
  // ==========================================
  public getSettings(): AISettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) return { ...INITIAL_AI_SETTINGS, ...JSON.parse(stored) }
    } catch {
      // Fallback
    }
    return INITIAL_AI_SETTINGS
  }

  public updateSettings(updates: Partial<AISettings>): AISettings {
    const current = this.getSettings()
    const updated = { ...current, ...updates }
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
    } catch {
      // Ignore
    }
    return updated
  }

  // ==========================================
  // Conversation History Management
  // ==========================================
  private getStorageKey(userId: string): string {
    return `SALORA_ai_conversations_${userId || 'current'}`
  }

  public getConversations(userId = 'current_user'): AIConversation[] {
    try {
      const stored = localStorage.getItem(this.getStorageKey(userId))
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      // Fallback
    }
    // Initial welcome conversation
    const defaultConvo: AIConversation = {
      id: 'convo-default',
      userId,
      title: 'Salon Operations Overview',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg-welcome',
          role: 'assistant',
          content:
            'Hello! I am your Salora AI business assistant. I have access to your live salon schedules, revenue ledgers, inventory stock, staff metrics, and client activity. Ask me anything about your salon performance.',
          timestamp: new Date().toISOString(),
          sourceModule: 'Salora Intelligence Engine',
          dateRange: 'Real-time',
        },
      ],
    }
    this.saveConversations([defaultConvo], userId)
    return [defaultConvo]
  }

  public saveConversations(conversations: AIConversation[], userId = 'current_user'): void {
    try {
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(conversations))
    } catch {
      // Ignore
    }
  }

  public createConversation(
    userId = 'current_user',
    title = 'New Salon Query',
    context?: AIAssistantContext
  ): AIConversation {
    const newConvo: AIConversation = {
      id: `convo-${Date.now()}`,
      userId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: context?.clientName
            ? `I am ready. I have loaded context for client "${context.clientName}". You can ask about their visit history, lifetime spend, or upcoming appointments.`
            : 'How can I assist with your salon operations today? Select a suggestion or type your question below.',
          timestamp: new Date().toISOString(),
          sourceModule: 'Salora Intelligence Engine',
          dateRange: 'Real-time',
        },
      ],
      context,
    }

    const convos = this.getConversations(userId)
    const updated = [newConvo, ...convos]
    this.saveConversations(updated, userId)
    return newConvo
  }

  public renameConversation(id: string, newTitle: string, userId = 'current_user'): void {
    const convos = this.getConversations(userId).map((c) =>
      c.id === id ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c
    )
    this.saveConversations(convos, userId)
  }

  public deleteConversation(id: string, userId = 'current_user'): void {
    const convos = this.getConversations(userId).filter((c) => c.id !== id)
    this.saveConversations(convos, userId)
  }

  public clearMessages(id: string, userId = 'current_user'): void {
    const convos = this.getConversations(userId).map((c) =>
      c.id === id
        ? {
            ...c,
            messages: [
              {
                id: `msg-${Date.now()}`,
                role: 'assistant' as const,
                content: 'Conversation history cleared. Ask me any question about your salon operations.',
                timestamp: new Date().toISOString(),
              },
            ],
            updatedAt: new Date().toISOString(),
          }
        : c
    )
    this.saveConversations(convos, userId)
  }

  // ==========================================
  // Core Dispatcher
  // ==========================================
  public async askAI(
    prompt: string,
    conversationId: string,
    context?: AIAssistantContext,
    userRole: Role = 'owner',
    userId = 'current_user'
  ): Promise<AIMessage> {
    const settings = this.getSettings()

    // 1. Check if AI is enabled
    if (!settings.enabled) {
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Salora AI assistant is currently disabled in Salon Settings.',
        timestamp: new Date().toISOString(),
        isError: true,
      }
    }

    // 2. Check query limits
    if (settings.usedQueriesToday >= settings.dailyQueryLimit) {
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Daily AI query limit reached (${settings.dailyQueryLimit} queries). Limit resets tomorrow.`,
        timestamp: new Date().toISOString(),
        isError: true,
      }
    }

    // 3. Provider selection
    const provider = this.providers[settings.provider] || this.providers.local

    // 4. Retrieve conversation history for context
    const convos = this.getConversations(userId)
    const convo = convos.find((c) => c.id === conversationId)
    const history = convo?.messages || []

    // 5. Execute through controlled tool layer
    const result = await provider.generateResponse(prompt, history, context, userRole)

    // 6. Update usage
    this.updateSettings({ usedQueriesToday: settings.usedQueriesToday + 1 })

    // 7. Auto-generate smart title for conversation if it was generic
    if (convo && convo.title === 'New Salon Query') {
      const smartTitle = prompt.length > 32 ? `${prompt.slice(0, 32)}…` : prompt
      this.renameConversation(conversationId, smartTitle, userId)
    }

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: result.textSummary,
      timestamp: new Date().toISOString(),
      structuredData: result.structuredData,
      preparedAction: result.preparedAction,
      toolsUsed: [result.toolName],
      sourceModule: result.sourceModule,
      dateRange: result.dateRange,
      isError: !result.success && !result.isRestricted,
    }
  }
}

export const aiService = new AIService()
