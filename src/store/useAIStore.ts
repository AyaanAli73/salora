import { create } from 'zustand'
import {
  AISettings,
  AIConversation,
  AIMessage,
  AIAssistantContext,
  Role,
} from '@/types'
import { aiService } from '@/services/aiService'

interface AIState {
  conversations: AIConversation[]
  activeConversationId: string
  isDrawerOpen: boolean
  isThinking: boolean
  currentContext: AIAssistantContext | null
  settings: AISettings

  // Actions
  openDrawer: (initialPrompt?: string, context?: AIAssistantContext) => void
  closeDrawer: () => void
  toggleDrawer: () => void
  setContext: (context: AIAssistantContext | null) => void
  selectConversation: (id: string) => void
  newConversation: (context?: AIAssistantContext, userId?: string) => void
  renameConversation: (id: string, newTitle: string, userId?: string) => void
  deleteConversation: (id: string, userId?: string) => void
  clearCurrentConversation: (userId?: string) => void
  sendMessage: (prompt: string, userRole?: Role, userId?: string) => Promise<void>
  updateSettings: (updates: Partial<AISettings>) => void
}

const initialConversations = aiService.getConversations('current_user')
const initialActiveId = initialConversations[0]?.id || 'convo-default'
const initialSettings = aiService.getSettings()

export const useAIStore = create<AIState>((set, get) => ({
  conversations: initialConversations,
  activeConversationId: initialActiveId,
  isDrawerOpen: false,
  isThinking: false,
  currentContext: null,
  settings: initialSettings,

  openDrawer: (initialPrompt, context) => {
    set({ isDrawerOpen: true })
    if (context) {
      set({ currentContext: context })
    }
    if (initialPrompt) {
      get().sendMessage(initialPrompt)
    }
  },

  closeDrawer: () => {
    set({ isDrawerOpen: false })
  },

  toggleDrawer: () => {
    set((state) => ({ isDrawerOpen: !state.isDrawerOpen }))
  },

  setContext: (context) => {
    set({ currentContext: context })
  },

  selectConversation: (id) => {
    set({ activeConversationId: id })
  },

  newConversation: (context, userId = 'current_user') => {
    const ctx = context || get().currentContext || undefined
    const created = aiService.createConversation(userId, 'New Salon Query', ctx)
    const convos = aiService.getConversations(userId)
    set({
      conversations: convos,
      activeConversationId: created.id,
      currentContext: ctx || null,
    })
  },

  renameConversation: (id, newTitle, userId = 'current_user') => {
    aiService.renameConversation(id, newTitle, userId)
    const convos = aiService.getConversations(userId)
    set({ conversations: convos })
  },

  deleteConversation: (id, userId = 'current_user') => {
    aiService.deleteConversation(id, userId)
    const convos = aiService.getConversations(userId)
    const nextActive = convos[0]?.id || ''
    set({
      conversations: convos,
      activeConversationId: nextActive,
    })
  },

  clearCurrentConversation: (userId = 'current_user') => {
    const { activeConversationId } = get()
    if (!activeConversationId) return
    aiService.clearMessages(activeConversationId, userId)
    const convos = aiService.getConversations(userId)
    set({ conversations: convos })
  },

  sendMessage: async (prompt, userRole = 'owner', userId = 'current_user') => {
    if (!prompt.trim() || get().isThinking) return

    const { activeConversationId, currentContext, conversations } = get()

    // 1. Append user message to active conversation immediately
    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt.trim(),
      timestamp: new Date().toISOString(),
    }

    const updatedConvos = conversations.map((c) =>
      c.id === activeConversationId
        ? { ...c, messages: [...c.messages, userMsg], updatedAt: new Date().toISOString() }
        : c
    )

    set({ conversations: updatedConvos, isThinking: true })
    aiService.saveConversations(updatedConvos, userId)

    try {
      // 2. Dispatch query to AI service
      const assistantMsg = await aiService.askAI(
        prompt,
        activeConversationId,
        currentContext || undefined,
        userRole,
        userId
      )

      // 3. Append assistant response
      const latestConvos = get().conversations.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              messages: [...c.messages, assistantMsg],
              updatedAt: new Date().toISOString(),
            }
          : c
      )

      set({ conversations: latestConvos, isThinking: false })
      aiService.saveConversations(latestConvos, userId)
    } catch {
      const errorMsg: AIMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'An unexpected error occurred while communicating with the AI service.',
        timestamp: new Date().toISOString(),
        isError: true,
      }

      const latestConvos = get().conversations.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              messages: [...c.messages, errorMsg],
              updatedAt: new Date().toISOString(),
            }
          : c
      )

      set({ conversations: latestConvos, isThinking: false })
      aiService.saveConversations(latestConvos, userId)
    }
  },

  updateSettings: (updates) => {
    const updated = aiService.updateSettings(updates)
    set({ settings: updated })
  },
}))
