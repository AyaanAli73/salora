import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Paperclip,
  Maximize2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Tag,
  ExternalLink,
  Bot,
  User,
  HelpCircle,
  Info,
  Clock,
} from 'lucide-react'
import { useAIStore } from '@/store/useAIStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

export const AIAssistantDrawer: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    isDrawerOpen,
    closeDrawer,
    conversations,
    activeConversationId,
    sendMessage,
    isThinking,
    currentContext,
    setContext,
    clearCurrentConversation,
    newConversation,
  } = useAIStore()

  const [inputPrompt, setInputPrompt] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeConvo =
    conversations.find((c) => c.id === activeConversationId) || conversations[0]
  const messages = activeConvo?.messages || []

  // Auto-scroll on new messages
  useEffect(() => {
    if (isDrawerOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [messages, isDrawerOpen, isThinking])

  // Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen, closeDrawer])

  const handleSend = () => {
    if (!inputPrompt.trim() || isThinking) return
    const text = inputPrompt.trim()
    setInputPrompt('')
    sendMessage(text, user?.role || 'owner', user?.id || 'current_user')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (query: string) => {
    sendMessage(query, user?.role || 'owner', user?.id || 'current_user')
  }

  const suggestions = [
    'How did we perform this month?',
    'Which services generated the most revenue?',
    "How many clients haven't visited recently?",
    'Which memberships expire soon?',
    "Show today's pending payments.",
    "Summarize this week's salon performance.",
  ]

  if (!isDrawerOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={closeDrawer}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 border-l border-slate-200 dark:border-slate-800">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-teal-400 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Salora AI</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  Intelligence
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Your salon business assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Open Full Page */}
            <button
              onClick={() => {
                closeDrawer()
                navigate('/ai-assistant')
              }}
              title="Open Fullscreen Assistant"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* New Conversation */}
            <button
              onClick={() => newConversation(currentContext || undefined, user?.id || 'current_user')}
              title="New Conversation"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Close Drawer */}
            <button
              onClick={closeDrawer}
              title="Close"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Business Context Bar (if attached) */}
        {currentContext && (
          <div className="px-5 py-2 bg-primary/5 border-b border-primary/10 flex items-center justify-between text-xs text-primary font-medium">
            <div className="flex items-center gap-1.5 truncate">
              <Tag className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Attached Context: {currentContext.clientName ? `Client "${currentContext.clientName}"` : currentContext.sourcePage || 'Active View'}
              </span>
            </div>
            <button
              onClick={() => setContext(null)}
              className="text-[11px] text-slate-400 hover:text-rose-500 ml-2 shrink-0 underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* Conversation Message Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {messages.map((msg) => {
            const isUser = msg.role === 'user'

            return (
              <div
                key={msg.id}
                className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}
              >
                {/* Bubble Container */}
                <div
                  className={cn(
                    'max-w-[88%] rounded-2xl p-3.5 space-y-2 leading-relaxed shadow-2xs',
                    isUser
                      ? 'bg-primary text-white rounded-br-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-bl-xs border border-slate-200/80 dark:border-slate-700/60'
                  )}
                >
                  {/* Sender & Timestamp */}
                  <div className="flex items-center justify-between gap-2 text-[10px] opacity-75 mb-0.5">
                    <span className="font-semibold flex items-center gap-1">
                      {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-primary" />}
                      {isUser ? 'You' : 'Salora AI'}
                    </span>
                    <span className="font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Text Content */}
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Structured Data Card */}
                  {msg.structuredData && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-700 space-y-2 text-slate-900 dark:text-white">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{msg.structuredData.title}</span>
                        <span
                          className={cn(
                            'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
                            msg.structuredData.categoryType === 'actual'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : msg.structuredData.categoryType === 'calculated'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          )}
                        >
                          {msg.structuredData.categoryType === 'actual'
                            ? 'Actual Data'
                            : msg.structuredData.categoryType === 'calculated'
                            ? 'Calculated Metric'
                            : 'AI Suggestion'}
                        </span>
                      </div>

                      {/* Primary Value Highlight */}
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80">
                        <div className="text-xl font-bold font-mono text-primary">
                          {msg.structuredData.primaryValue}
                        </div>
                        {msg.structuredData.difference && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Variance: <span className="font-semibold text-slate-700 dark:text-slate-300">{msg.structuredData.difference}</span>
                          </div>
                        )}
                      </div>

                      {/* Breakdown Rows */}
                      {msg.structuredData.breakdown && (
                        <div className="space-y-1 pt-1 text-[11px]">
                          {msg.structuredData.breakdown.map((item, idx) => (
                            <div key={idx} className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                              <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                              <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prepared Safe Action Card */}
                  {msg.preparedAction && (
                    <div className="mt-2.5 p-3 rounded-xl bg-primary-50/50 dark:bg-primary-950/30 border border-primary/20 space-y-2 text-slate-800 dark:text-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-primary">{msg.preparedAction.title}</span>
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-primary/20 text-primary">
                          Prepared Action
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {msg.preparedAction.description}
                      </p>

                      <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[10.5px] space-y-1">
                        {Object.entries(msg.preparedAction.details).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-slate-500">{k}:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{v}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          closeDrawer()
                          navigate(msg.preparedAction!.actionRoute)
                        }}
                        className="w-full text-xs mt-1"
                      >
                        {msg.preparedAction.actionLabel}
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  )}

                  {/* Factual Provenance: Module & Date Range */}
                  {(msg.sourceModule || msg.dateRange) && (
                    <div className="pt-1.5 mt-1 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[10px] opacity-70">
                      <span className="truncate max-w-[170px]" title={msg.sourceModule}>
                        Src: {msg.sourceModule}
                      </span>
                      <span>{msg.dateRange}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Thinking / Calculating animation indicator */}
          {isThinking && (
            <div className="flex items-start gap-2">
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-spin" />
                <span className="text-xs font-medium">Querying verified ledger data…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips (if few messages) */}
        {messages.length <= 2 && (
          <div className="px-5 py-2.5 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10.5px] font-semibold text-slate-400 block mb-1.5">Suggested Questions:</span>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.slice(0, 3).map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(s)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium hover:border-primary hover:text-primary transition-all text-left truncate max-w-full"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about your salon..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking}
              className="w-full pl-3.5 pr-20 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSend}
                disabled={!inputPrompt.trim() || isThinking}
                className="h-8 px-2.5"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setContext(currentContext ? null : { sourcePage: 'general' })}
                className={cn(
                  'flex items-center gap-1 hover:text-slate-600 transition-colors',
                  currentContext && 'text-primary font-semibold'
                )}
              >
                <Paperclip className="w-3 h-3" />
                <span>{currentContext ? 'Context Attached' : 'Attach Context'}</span>
              </button>
            </div>

            <button
              onClick={() => clearCurrentConversation(user?.id || 'current_user')}
              className="flex items-center gap-1 hover:text-rose-500 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Conversation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
