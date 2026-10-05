import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Paperclip,
  Tag,
  ArrowRight,
  ShieldCheck,
  Bot,
  User,
  Sliders,
  Calendar,
  Layers,
  HelpCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
} from 'lucide-react'
import { useAIStore } from '@/store/useAIStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

export const AIAssistantPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    conversations,
    activeConversationId,
    selectConversation,
    newConversation,
    renameConversation,
    deleteConversation,
    clearCurrentConversation,
    sendMessage,
    isThinking,
    currentContext,
    setContext,
    settings,
  } = useAIStore()

  const [inputPrompt, setInputPrompt] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeConvo =
    conversations.find((c) => c.id === activeConversationId) || conversations[0]
  const messages = activeConvo?.messages || []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

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

  const startRename = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditingTitle(currentTitle)
  }

  const submitRename = (id: string) => {
    if (editingTitle.trim()) {
      renameConversation(id, editingTitle.trim(), user?.id || 'current_user')
    }
    setEditingId(null)
  }

  const suggestions = [
    'How did we perform this month?',
    'Which services generated the most revenue?',
    "How many clients haven't visited recently?",
    'Which memberships expire soon?',
    "Show today's pending payments.",
    "Summarize this week's salon performance.",
  ]

  return (
    <div className="space-y-4">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link to="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Salora AI Business Assistant</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-primary" />
            Conversational Salon Business Intelligence
          </h1>
        </div>

        <Link to="/settings">
          <Button variant="outline" size="sm" className="text-xs">
            <Sliders className="w-3.5 h-3.5 mr-1.5" />
            AI Policy Settings
          </Button>
        </Link>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 h-[calc(100vh-210px)] min-h-[580px]">
        {/* Left Column: Conversation History & Engine Scopes */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col justify-between overflow-hidden">
          {/* Header & New Chat button */}
          <div className="p-3.5 border-b border-slate-100 space-y-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => newConversation(undefined, user?.id || 'current_user')}
              className="w-full text-xs shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Business Chat
            </Button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              Saved Conversations
            </span>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.map((convo) => {
              const isActive = convo.id === activeConversationId
              const isEditing = editingId === convo.id

              return (
                <div
                  key={convo.id}
                  onClick={() => selectConversation(convo.id)}
                  className={cn(
                    'group flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center gap-2 truncate flex-1 mr-2">
                    <Sparkles className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'text-primary' : 'text-slate-400')} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitRename(convo.id)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-1.5 py-0.5 text-xs bg-white border border-slate-200 rounded"
                      />
                    ) : (
                      <span className="truncate">{convo.title}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isEditing ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          submitRename(convo.id)
                        }}
                        className="p-1 hover:text-emerald-600"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startRename(convo.id, convo.title)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-opacity"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {conversations.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteConversation(convo.id, user?.id || 'current_user')
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Engine & Query Limits Telemetry */}
          <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Model Engine:</span>
              <span className="font-mono text-primary font-bold">Deterministic v2</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Daily Queries Used:</span>
              <span className="font-mono font-bold text-slate-800">
                {settings.usedQueriesToday} / {settings.dailyQueryLimit}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${(settings.usedQueriesToday / settings.dailyQueryLimit) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Active Conversation Feed */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col justify-between overflow-hidden">
          {/* Top Chat Bar */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="font-bold text-xs text-slate-900">{activeConvo?.title || 'Salon Query'}</span>
            </div>

            <div className="flex items-center gap-3">
              {currentContext && (
                <Badge variant="default" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  Context: {currentContext.clientName ? `Client "${currentContext.clientName}"` : currentContext.sourcePage}
                </Badge>
              )}

              <button
                onClick={() => clearCurrentConversation(user?.id || 'current_user')}
                className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Chat</span>
              </button>
            </div>
          </div>

          {/* Messages Scroll View */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            {messages.map((msg) => {
              const isUser = msg.role === 'user'

              return (
                <div
                  key={msg.id}
                  className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl p-4 space-y-2.5 leading-relaxed shadow-xs',
                      isUser
                        ? 'bg-primary text-white rounded-br-xs'
                        : 'bg-slate-50 text-slate-800 rounded-bl-xs border border-slate-200/90'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
                      <span className="font-semibold flex items-center gap-1">
                        {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-primary" />}
                        {isUser ? 'You' : 'Salora AI'}
                      </span>
                      <span className="font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Structured Info Card */}
                    {msg.structuredData && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 text-slate-900">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{msg.structuredData.title}</span>
                          <span
                            className={cn(
                              'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
                              msg.structuredData.categoryType === 'actual'
                                ? 'bg-emerald-100 text-emerald-800'
                                : msg.structuredData.categoryType === 'calculated'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-amber-100 text-amber-800'
                            )}
                          >
                            {msg.structuredData.categoryType === 'actual'
                              ? 'Actual Data'
                              : msg.structuredData.categoryType === 'calculated'
                              ? 'Calculated Metric'
                              : 'AI Suggestion'}
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <div className="text-2xl font-bold font-mono text-primary">
                            {msg.structuredData.primaryValue}
                          </div>
                          {msg.structuredData.difference && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              Variance: <span className="font-semibold text-slate-800">{msg.structuredData.difference}</span>
                            </div>
                          )}
                        </div>

                        {msg.structuredData.breakdown && (
                          <div className="space-y-1 pt-1 text-xs">
                            {msg.structuredData.breakdown.map((item, idx) => (
                              <div key={idx} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                                <span className="text-slate-500">{item.label}</span>
                                <span className="font-semibold font-mono text-slate-800">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Prepared Safe Action Card */}
                    {msg.preparedAction && (
                      <div className="mt-3 p-3.5 rounded-xl bg-primary-50/60 border border-primary/20 space-y-2 text-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-primary">{msg.preparedAction.title}</span>
                          <span className="text-[9px] uppercase tracking-wider font-bold bg-white px-1.5 py-0.5 rounded border border-primary/20 text-primary">
                            Prepared Action
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {msg.preparedAction.description}
                        </p>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                          {Object.entries(msg.preparedAction.details).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                              <span className="text-slate-500">{k}:</span>
                              <span className="font-semibold text-slate-800">{v}</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(msg.preparedAction!.actionRoute)}
                          className="w-full text-xs mt-1"
                        >
                          {msg.preparedAction.actionLabel}
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    )}

                    {(msg.sourceModule || msg.dateRange) && (
                      <div className="pt-1.5 mt-1 border-t border-slate-200/50 flex items-center justify-between text-[10px] opacity-70">
                        <span>Src: {msg.sourceModule}</span>
                        <span>{msg.dateRange}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {isThinking && (
              <div className="flex items-start gap-2">
                <div className="p-3 rounded-2xl bg-slate-100 text-slate-500 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-xs font-medium">Querying verified ledger data…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">Try Asking:</span>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(s, user?.role || 'owner', user?.id || 'current_user')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-medium hover:border-primary hover:text-primary transition-all whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Ask about your salon..."
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isThinking}
                className="w-full pl-4 pr-24 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSend}
                  disabled={!inputPrompt.trim() || isThinking}
                  className="px-3"
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
