import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  MessageSquare,
  Mail,
  Phone,
  Bell,
  Send,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Layers,
  Shield,
  Sliders,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
  Calendar,
  Gift,
  Key,
  Flame,
} from 'lucide-react'
import { communicationService } from '@/services/communicationService'
import {
  MessageTemplate,
  AutomationRule,
  CommunicationLog,
  CommunicationSettings,
  CommunicationChannel,
  MessageCategory,
} from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'
import { interpolateTemplate } from '@/services/communication/templateInterpolator'

const CHANNEL_ICONS: Record<CommunicationChannel, React.ReactNode> = {
  WHATSAPP: <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />,
  SMS: <Phone className="w-3.5 h-3.5 text-blue-500" />,
  EMAIL: <Mail className="w-3.5 h-3.5 text-purple-500" />,
  IN_APP: <Bell className="w-3.5 h-3.5 text-amber-500" />,
}

const VARIABLE_SUGGESTIONS = [
  { token: '{{customer_name}}', desc: 'Client full name' },
  { token: '{{service_name}}', desc: 'Treatment or ritual title' },
  { token: '{{appointment_date}}', desc: 'Booking date' },
  { token: '{{appointment_time}}', desc: 'Scheduled start time' },
  { token: '{{staff_name}}', desc: 'Stylist / Specialist name' },
  { token: '{{salon_name}}', desc: 'Salon business name' },
  { token: '{{invoice_number}}', desc: 'Invoice / Receipt code' },
  { token: '{{amount}}', desc: 'Total paid or due' },
  { token: '{{review_link}}', desc: 'Direct review rating link' },
  { token: '{{offer_details}}', desc: 'Promotional discount terms' },
]

export const CommunicationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as any) || 'templates'
  const { addToast } = useToastStore()

  // Tab State
  const [activeTab, setActiveTab] = useState<'templates' | 'campaigns' | 'automations' | 'history' | 'settings'>(initialTab)

  // Data State
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [automations, setAutomations] = useState<AutomationRule[]>([])
  const [logs, setLogs] = useState<CommunicationLog[]>([])
  const [settings, setSettings] = useState<CommunicationSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Filters for History Tab
  const [historySearch, setHistorySearch] = useState('')
  const [historyChannel, setHistoryChannel] = useState<'ALL' | CommunicationChannel>('ALL')
  const [historyStatus, setHistoryStatus] = useState<string>('ALL')
  const [historyCategory, setHistoryCategory] = useState<string>('ALL')

  // Modals State
  const [testModalOpen, setTestModalOpen] = useState(false)
  const [testChannel, setTestChannel] = useState<CommunicationChannel>('WHATSAPP')
  const [testRecipient, setTestRecipient] = useState('+91 98765 43210')
  const [testTemplateId, setTestTemplateId] = useState('')
  const [testCustomMessage, setTestCustomMessage] = useState('')
  const [isSendingTest, setIsSendingTest] = useState(false)

  // Template Editor Modal
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [tplName, setTplName] = useState('')
  const [tplChannel, setTplChannel] = useState<CommunicationChannel>('WHATSAPP')
  const [tplCategory, setTplCategory] = useState<MessageCategory>('TRANSACTIONAL')
  const [tplSubject, setTplSubject] = useState('')
  const [tplMessage, setTplMessage] = useState('')

  // Log Detail Modal
  const [selectedLog, setSelectedLog] = useState<CommunicationLog | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [tpls, autos, historyLogs, configSettings] = await Promise.all([
        communicationService.getTemplates(),
        communicationService.getAutomationRules(),
        communicationService.getLogs(),
        communicationService.getSettings(),
      ])

      setTemplates(tpls)
      setAutomations(autos)
      setLogs(historyLogs)
      setSettings(configSettings)
    } catch (err) {
      console.error('Failed loading communications data:', err)
      addToast({
        title: 'Error',
        message: 'Could not load communication center data.',
        type: 'danger',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleTabChange = (tab: 'templates' | 'campaigns' | 'automations' | 'history' | 'settings') => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  // ─── TEMPLATE ACTIONS ───
  const openNewTemplateModal = () => {
    setEditingTemplate(null)
    setTplName('')
    setTplChannel('WHATSAPP')
    setTplCategory('TRANSACTIONAL')
    setTplSubject('')
    setTplMessage('')
    setTemplateModalOpen(true)
  }

  const openEditTemplateModal = (tpl: MessageTemplate) => {
    setEditingTemplate(tpl)
    setTplName(tpl.name)
    setTplChannel(tpl.channel)
    setTplCategory(tpl.category)
    setTplSubject(tpl.subject || '')
    setTplMessage(tpl.message)
    setTemplateModalOpen(true)
  }

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tplName.trim() || !tplMessage.trim()) return

    try {
      if (editingTemplate) {
        const updated = await communicationService.updateTemplate(editingTemplate.id, {
          name: tplName.trim(),
          channel: tplChannel,
          category: tplCategory,
          subject: tplChannel === 'EMAIL' ? tplSubject.trim() : undefined,
          message: tplMessage.trim(),
        })
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
        addToast({ title: 'Template Updated', message: `${updated.name} saved.`, type: 'success' })
      } else {
        const created = await communicationService.createTemplate({
          name: tplName.trim(),
          channel: tplChannel,
          category: tplCategory,
          subject: tplChannel === 'EMAIL' ? tplSubject.trim() : undefined,
          message: tplMessage.trim(),
          variables: [],
          status: 'ACTIVE',
        })
        setTemplates((prev) => [created, ...prev])
        addToast({ title: 'Template Created', message: `${created.name} added to catalog.`, type: 'success' })
      }
      setTemplateModalOpen(false)
    } catch (err) {
      console.error('Failed saving template:', err)
      addToast({ title: 'Error', message: 'Could not save template.', type: 'danger' })
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Are you sure you wish to delete this template?')) return
    try {
      await communicationService.deleteTemplate(id)
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      addToast({ title: 'Template Deleted', message: 'Template removed from system.', type: 'info' })
    } catch (err) {
      addToast({ title: 'Error', message: 'Could not delete template.', type: 'danger' })
    }
  }

  // ─── AUTOMATION ACTIONS ───
  const handleToggleAutomation = async (id: string) => {
    try {
      const updated = await communicationService.toggleAutomationRule(id)
      setAutomations((prev) => prev.map((a) => (a.id === id ? updated : a)))
      addToast({
        title: updated.isActive ? 'Automation Enabled' : 'Automation Paused',
        message: `${updated.name} is now ${updated.isActive ? 'active' : 'paused'}.`,
        type: updated.isActive ? 'success' : 'warning',
      })
    } catch (err) {
      addToast({ title: 'Error', message: 'Could not toggle automation.', type: 'danger' })
    }
  }

  // ─── RETRY FAILED MESSAGE ACTION ───
  const handleRetryLog = async (logId: string) => {
    try {
      const retried = await communicationService.retryFailedMessage(logId)
      setLogs((prev) => prev.map((l) => (l.id === logId ? retried : l)))
      addToast({
        title: 'Message Retried',
        message: `Dispatched retry via ${retried.channel}. Status: ${retried.status}.`,
        type: 'success',
      })
      if (selectedLog && selectedLog.id === logId) {
        setSelectedLog(retried)
      }
    } catch (err: any) {
      console.error('Retry failed:', err)
      addToast({
        title: 'Retry Blocked',
        message: err?.message || 'Could not retry message.',
        type: 'danger',
      })
    }
  }

  // ─── TEST MESSAGE SENDER ───
  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSendingTest(true)

    try {
      const log = await communicationService.sendTestMessage({
        channel: testChannel,
        recipient: testRecipient,
        customMessage: testCustomMessage || undefined,
        templateId: testTemplateId || undefined,
      })

      const refreshedLogs = await communicationService.getLogs()
      setLogs(refreshedLogs)

      addToast({
        title: 'Test Message Dispatched!',
        message: `Transmission via ${testChannel} completed (${log.status}). Log ID #${log.id}.`,
        type: 'success',
      })
      setTestModalOpen(false)
    } catch (err) {
      console.error('Test message send error:', err)
      addToast({
        title: 'Transmission Failed',
        message: 'Unable to deliver test message.',
        type: 'danger',
      })
    } finally {
      setIsSendingTest(false)
    }
  }

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    if (historyChannel !== 'ALL' && log.channel !== historyChannel) return false
    if (historyStatus !== 'ALL' && log.status !== historyStatus) return false
    if (historyCategory !== 'ALL' && log.category !== historyCategory) return false
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase()
      const matchName = log.customerName.toLowerCase().includes(q)
      const matchRecipient = log.recipient.toLowerCase().includes(q)
      const matchBody = log.body.toLowerCase().includes(q)
      if (!matchName && !matchRecipient && !matchBody) return false
    }
    return true
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Communication Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Provider-Agnostic Engine
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Manage omnichannel customer notifications, automated booking reminders, message templates, delivery logs, and carrier settings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setTestModalOpen(true)}
            leftIcon={<Send className="w-4 h-4 text-primary" />}
          >
            Send Test
          </Button>

          <Button
            variant="primary"
            onClick={openNewTemplateModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Template
          </Button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('templates')}
          className={cn(
            'px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap',
            activeTab === 'templates'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <Layers className="w-4 h-4" />
          <span>Templates</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-surface-subtle text-text-primary">
            {templates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('automations')}
          className={cn(
            'px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap',
            activeTab === 'automations'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>Automations</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-surface-subtle text-text-primary">
            {automations.filter((a) => a.isActive).length}/{automations.length} Active
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('campaigns')}
          className={cn(
            'px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap',
            activeTab === 'campaigns'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <Flame className="w-4 h-4 text-pink-500" />
          <span>Campaigns</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={cn(
            'px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap',
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <Clock className="w-4 h-4" />
          <span>Delivery History</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-surface-subtle text-text-primary">
            {logs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('settings')}
          className={cn(
            'px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap',
            activeTab === 'settings'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <Settings className="w-4 h-4" />
          <span>Channels & Settings</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: MESSAGE TEMPLATES (Requirement 3)                  */}
      {/* ======================================================== */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-border">
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                Communication Templates Catalog
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Standardized templates with dynamic variable tokens across WhatsApp, SMS, Email, and In-App notification channels.
              </p>
            </div>

            <Button variant="primary" size="sm" onClick={openNewTemplateModal} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Create Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <Card key={tpl.id} className="border border-border flex flex-col justify-between">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary text-sm font-sans">
                          {tpl.name}
                        </span>
                        {tpl.isSystem && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                            System
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-text-secondary">
                          {CHANNEL_ICONS[tpl.channel]}
                          <span>{tpl.channel}</span>
                        </span>
                        <span>•</span>
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                            tpl.category === 'TRANSACTIONAL'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
                          )}
                        >
                          {tpl.category}
                        </span>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold',
                        tpl.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-500/10 text-slate-500'
                      )}
                    >
                      {tpl.status}
                    </span>
                  </div>

                  {tpl.subject && (
                    <div className="text-xs text-text-muted font-medium">
                      Subject: <strong className="text-text-primary">{tpl.subject}</strong>
                    </div>
                  )}

                  <div className="rounded-xl bg-surface-subtle p-3 text-xs text-text-secondary font-mono leading-relaxed border border-border/60">
                    {tpl.message}
                  </div>

                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {tpl.variables.map((v) => (
                      <span key={v} className="px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-text-muted">
                        {v}
                      </span>
                    ))}
                  </div>
                </CardContent>

                <div className="px-5 py-3 bg-surface-subtle/50 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-text-muted">
                    Updated {new Date(tpl.updatedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditTemplateModal(tpl)}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-border hover:bg-surface-subtle font-semibold text-text-primary transition-colors flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3 text-text-muted" />
                      <span>Edit</span>
                    </button>
                    {!tpl.isSystem && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="px-2 py-1 rounded-lg hover:bg-rose-500/10 text-rose-500 font-semibold transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MARKETING CAMPAIGNS                               */}
      {/* ======================================================== */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-border">
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                Promotional Campaigns & VIP Blasts
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Targeted marketing messages respecting client marketing opt-in preferences.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setTestChannel('WHATSAPP')
                setTestTemplateId('tpl-birthday-celebration-wa')
                setTestModalOpen(true)
              }}
              leftIcon={<Flame className="w-3.5 h-3.5" />}
            >
              Launch Promo Blast
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-border">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-pink-500 bg-pink-500/10 px-2.5 py-0.5 rounded-full">
                    Birthday VIP Club
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    68.4% Conversion
                  </span>
                </div>
                <h3 className="text-base font-bold text-text-primary">
                  Birthday Glamour Voucher (20% Off)
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Automated birthday celebration discount sent 7 days in advance to celebrate client birthdates.
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-text-secondary">
                  <span>Enrolled: <strong>142 VIP Guests</strong></span>
                  <Badge variant="success" size="sm">Active Automation</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    Win-Back Ritual
                  </span>
                  <span className="text-xs text-text-muted font-bold">
                    19.2% Conversion
                  </span>
                </div>
                <h3 className="text-base font-bold text-text-primary">
                  Lapsed Client Re-engagement (60+ Days)
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Automated gentle invitation offering a complimentary scalp detox add-on for clients without appointments in 60 days.
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-text-secondary">
                  <span>Target Audience: <strong>48 Guests</strong></span>
                  <Badge variant="default" size="sm">Paused</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: AUTOMATIONS (Requirements 4, 5, 6, 7, 8, 9)        */}
      {/* ======================================================== */}
      {activeTab === 'automations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-border">
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                Event-Driven Notification Automations
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Automatically dispatch omnichannel messages upon booking, arrival reminders, completed appointments, reviews, and rewards.
              </p>
            </div>

            <span className="text-xs text-text-muted font-semibold">
              {automations.filter((a) => a.isActive).length} of {automations.length} Active
            </span>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden bg-surface shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-subtle font-bold text-text-muted">
                  <th className="py-3 px-4">Automation Name</th>
                  <th className="py-3 px-3">Trigger Event</th>
                  <th className="py-3 px-3">Channel</th>
                  <th className="py-3 px-3">Timing & Delay</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {automations.map((rule) => (
                  <tr key={rule.id} className="hover:bg-surface-subtle/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-text-primary">
                      {rule.name}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-medium text-text-secondary">
                      {rule.trigger}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-text-secondary">
                        {CHANNEL_ICONS[rule.channel]}
                        <span>{rule.channel}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-text-muted">
                      {rule.timingDescription}
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                          rule.category === 'TRANSACTIONAL'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
                        )}
                      >
                        {rule.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1',
                          rule.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-500/10 text-slate-500 border border-slate-500/30'
                        )}
                      >
                        {rule.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>{rule.isActive ? 'Active' : 'Paused'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleAutomation(rule.id)}
                        className={cn(
                          'px-3 py-1 rounded-lg text-xs font-semibold transition-colors',
                          rule.isActive
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        )}
                      >
                        {rule.isActive ? 'Pause' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: DELIVERY HISTORY & AUDIT LOG (Requirements 10 & 11)*/}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3.5 rounded-2xl border border-border">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by customer name, recipient, or text…"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-surface-subtle border border-border focus:ring-2 focus:ring-primary outline-hidden text-text-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Filter logs by channel"
                value={historyChannel}
                onChange={(e) => setHistoryChannel(e.target.value as any)}
                className="text-xs rounded-xl bg-surface-subtle border border-border px-3 py-1.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden"
              >
                <option value="ALL">All Channels</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="IN_APP">In-App</option>
              </select>

              <select
                aria-label="Filter logs by status"
                value={historyStatus}
                onChange={(e) => setHistoryStatus(e.target.value)}
                className="text-xs rounded-xl bg-surface-subtle border border-border px-3 py-1.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="DELIVERED">Delivered</option>
                <option value="READ">Read</option>
                <option value="SENT">Sent</option>
                <option value="FAILED">Failed</option>
                <option value="QUEUED">Queued</option>
              </select>

              <select
                aria-label="Filter logs by category"
                value={historyCategory}
                onChange={(e) => setHistoryCategory(e.target.value)}
                className="text-xs rounded-xl bg-surface-subtle border border-border px-3 py-1.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden"
              >
                <option value="ALL">All Categories</option>
                <option value="TRANSACTIONAL">Transactional</option>
                <option value="MARKETING">Marketing</option>
              </select>
            </div>
          </div>

          {/* Delivery Table */}
          <div className="rounded-2xl border border-border overflow-hidden bg-surface shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle font-bold text-text-muted">
                    <th className="py-3 px-4">Customer & Recipient</th>
                    <th className="py-3 px-3">Channel</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-4 min-w-[280px]">Message Body</th>
                    <th className="py-3 px-3">Sent At</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-subtle/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-text-primary">{log.customerName}</div>
                          <div className="text-[11px] text-text-muted font-mono">{log.recipient}</div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 font-semibold text-text-secondary">
                            {CHANNEL_ICONS[log.channel]}
                            <span>{log.channel}</span>
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                              log.category === 'TRANSACTIONAL'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
                            )}
                          >
                            {log.category}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <p className="text-text-primary line-clamp-2 leading-relaxed">
                            {log.body}
                          </p>
                          {log.error && (
                            <span className="text-[10px] text-rose-500 font-semibold mt-0.5 block">
                              Error: {log.error}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-text-muted tabular-nums whitespace-nowrap">
                          {new Date(log.sentAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase',
                              log.status === 'READ' &&
                                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
                              log.status === 'DELIVERED' &&
                                'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30',
                              log.status === 'SENT' &&
                                'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30',
                              log.status === 'QUEUED' &&
                                'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30',
                              log.status === 'FAILED' &&
                                'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                            )}
                          >
                            {log.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedLog(log)}
                              className="px-2 py-1 rounded-lg bg-surface border border-border hover:bg-surface-subtle text-text-primary text-[11px] font-semibold transition-colors"
                            >
                              Details
                            </button>

                            {log.status === 'FAILED' && (
                              <button
                                type="button"
                                onClick={() => handleRetryLog(log.id)}
                                className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Retry ({log.retryCount}/3)</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-text-muted">
                        No communication logs found matching your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: CHANNELS & SETTINGS (Requirements 13, 14, 15)      */}
      {/* ======================================================== */}
      {activeTab === 'settings' && settings && (
        <div className="space-y-6">
          {/* Provider Configuration (Requirement 13) */}
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                Provider-Agnostic Channel Gateways
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Configure external telecom carriers without vendor lock-in. Secret credentials remain masked and secure.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* WhatsApp */}
              <Card className="border border-border">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-sm text-text-primary block font-sans">
                          WhatsApp Business API
                        </strong>
                        <span className="text-[11px] text-text-muted">
                          Meta Cloud API / Gupshup / Twilio
                        </span>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">Connected</Badge>
                  </div>

                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-border/60">
                      <span className="text-text-muted">Sender Number:</span>
                      <strong className="text-text-primary font-mono">{settings.providers.WHATSAPP.senderPhone}</strong>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-border/60">
                      <span className="text-text-muted">WABA Account ID:</span>
                      <span className="text-text-secondary font-mono">{settings.providers.WHATSAPP.senderId}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-muted">API Token / Secret:</span>
                      <span className="text-text-muted font-mono">{settings.providers.WHATSAPP.apiKeyMasked}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SMS */}
              <Card className="border border-border">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-sm text-text-primary block font-sans">
                          SMS Carrier Gateway
                        </strong>
                        <span className="text-[11px] text-text-muted">
                          Twilio / MSG91 / AWS SNS
                        </span>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">Connected</Badge>
                  </div>

                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-border/60">
                      <span className="text-text-muted">Sender ID (DLT / Alphatag):</span>
                      <strong className="text-text-primary font-mono">{settings.providers.SMS.senderId}</strong>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-border/60">
                      <span className="text-text-muted">Outbound Number:</span>
                      <span className="text-text-secondary font-mono">{settings.providers.SMS.senderPhone}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-muted">Carrier Secret:</span>
                      <span className="text-text-muted font-mono">{settings.providers.SMS.apiKeyMasked}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email */}
              <Card className="border border-border">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-sm text-text-primary block font-sans">
                          Transactional Email
                        </strong>
                        <span className="text-[11px] text-text-muted">
                          SendGrid / Postmark / Amazon SES
                        </span>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">Connected</Badge>
                  </div>

                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-border/60">
                      <span className="text-text-muted">Sender Address:</span>
                      <strong className="text-text-primary font-mono">{settings.providers.EMAIL.senderEmail}</strong>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-border/60">
                      <span className="text-text-muted">Sender Display Name:</span>
                      <span className="text-text-secondary">{settings.providers.EMAIL.senderName}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-muted">SMTP / API Key:</span>
                      <span className="text-text-muted font-mono">{settings.providers.EMAIL.apiKeyMasked}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* In-App */}
              <Card className="border border-border">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-sm text-text-primary block font-sans">
                          In-App Notification Inbox
                        </strong>
                        <span className="text-[11px] text-text-muted">
                          Native Customer Lounge Push Store
                        </span>
                      </div>
                    </div>
                    <Badge variant="primary" size="sm">Native Active</Badge>
                  </div>

                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-border/60">
                      <span className="text-text-muted">Inbox Store:</span>
                      <strong className="text-text-primary">useCustomerNotificationStore</strong>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-border/60">
                      <span className="text-text-muted">Sound / Badge:</span>
                      <span className="text-text-secondary">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-muted">Integration Mode:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Live Reactive</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Fallback Priority & Retry Policies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority order */}
            <Card className="border border-border">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-bold text-text-primary">
                  Channel Fallback Priority Order
                </h3>
                <p className="text-xs text-text-muted">
                  When primary delivery encounters network timeouts or carrier DND, fallback down the list.
                </p>

                <div className="space-y-2 pt-1">
                  {settings.channelPriority.map((ch, idx) => (
                    <div key={ch} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle border border-border text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-text-primary">
                          {CHANNEL_ICONS[ch]}
                          <span>{ch}</span>
                        </span>
                      </div>
                      <span className="text-[11px] text-text-muted">
                        {idx === 0 ? 'Primary' : `Fallback #${idx}`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Retry Policy (Requirement 15) */}
            <Card className="border border-border">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-bold text-text-primary">
                  Failed Message Retry Policy
                </h3>
                <p className="text-xs text-text-muted">
                  Guards against infinite automated retry storms while allowing manual supervisor re-attempts.
                </p>

                <div className="space-y-2.5 pt-1 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-border/60">
                    <span className="text-text-muted">Max Automated Retries:</span>
                    <strong className="text-text-primary tabular-nums">
                      {settings.retryPolicy.maxRetries} Attempts
                    </strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/60">
                    <span className="text-text-muted">Backoff Interval:</span>
                    <strong className="text-text-primary tabular-nums">
                      {settings.retryPolicy.backoffMinutes} Minutes
                    </strong>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-text-muted">Circuit Breaker:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Protected (No infinite loops)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: SEND TEST MESSAGE (Requirement 14)               */}
      {/* ======================================================== */}
      {testModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setTestModalOpen(false)}
          title="Send Test Message"
        >
          <form onSubmit={handleSendTestMessage} className="space-y-4">
            <p className="text-xs text-text-muted">
              Simulate outbound delivery across any channel to verify carrier throughput, variable interpolation, and log recording.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="test-channel-select" className="text-xs font-semibold text-text-secondary block">
                Channel:
              </label>
              <select
                id="test-channel-select"
                value={testChannel}
                onChange={(e) => setTestChannel(e.target.value as any)}
                className="w-full text-xs rounded-xl bg-surface border border-border p-2.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden"
              >
                <option value="WHATSAPP">WhatsApp Message</option>
                <option value="SMS">SMS Text Message</option>
                <option value="EMAIL">Email</option>
                <option value="IN_APP">Native In-App Notification</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="test-recipient-input" className="text-xs font-semibold text-text-secondary block">
                Recipient Contact:
              </label>
              <input
                id="test-recipient-input"
                type="text"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="+91 98765 43210 or name@example.com"
                className="w-full text-xs rounded-xl bg-surface border border-border p-2.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="test-template-select" className="text-xs font-semibold text-text-secondary block">
                Load from Existing Template (Optional):
              </label>
              <select
                id="test-template-select"
                value={testTemplateId}
                onChange={(e) => {
                  setTestTemplateId(e.target.value)
                  const t = templates.find((tpl) => tpl.id === e.target.value)
                  if (t) setTestCustomMessage(t.message)
                }}
                className="w-full text-xs rounded-xl bg-surface border border-border p-2.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden"
              >
                <option value="">Custom Message Text</option>
                {templates
                  .filter((t) => t.channel === testChannel)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="test-custom-message" className="text-xs font-semibold text-text-secondary block">
                Message Body:
              </label>
              <textarea
                id="test-custom-message"
                rows={4}
                value={testCustomMessage}
                onChange={(e) => setTestCustomMessage(e.target.value)}
                placeholder="Hi {{customer_name}}, this is a live test notification from Salora Salon Management…"
                className="w-full text-xs rounded-xl bg-surface border border-border p-3 text-text-primary focus:ring-2 focus:ring-primary outline-hidden resize-none font-mono"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTestModalOpen(false)}
                disabled={isSendingTest}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSendingTest}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Dispatch Test
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: TEMPLATE CREATOR / EDITOR (Requirement 3)       */}
      {/* ======================================================== */}
      {templateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setTemplateModalOpen(false)}
          title={editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Create Message Template'}
        >
          <form onSubmit={handleSaveTemplate} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="tpl-name-input" className="text-xs font-semibold text-text-secondary block">
                Template Name:
              </label>
              <input
                id="tpl-name-input"
                type="text"
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                placeholder="e.g. 24-Hour VIP WhatsApp Reminder"
                className="w-full text-xs rounded-xl bg-surface border border-border p-2.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="tpl-channel-select" className="text-xs font-semibold text-text-secondary block">
                  Channel:
                </label>
                <select
                  id="tpl-channel-select"
                  value={tplChannel}
                  onChange={(e) => setTplChannel(e.target.value as any)}
                  className="w-full text-xs rounded-xl bg-surface border border-border p-2.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden"
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="SMS">SMS</option>
                  <option value="EMAIL">Email</option>
                  <option value="IN_APP">In-App</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="tpl-category-select" className="text-xs font-semibold text-text-secondary block">
                  Category:
                </label>
                <select
                  id="tpl-category-select"
                  value={tplCategory}
                  onChange={(e) => setTplCategory(e.target.value as any)}
                  className="w-full text-xs rounded-xl bg-surface border border-border p-2.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden"
                >
                  <option value="TRANSACTIONAL">Transactional (Service/Billing)</option>
                  <option value="MARKETING">Marketing (Offers/Campaigns)</option>
                </select>
              </div>
            </div>

            {tplChannel === 'EMAIL' && (
              <div className="space-y-1.5">
                <label htmlFor="tpl-subject-input" className="text-xs font-semibold text-text-secondary block">
                  Email Subject Line:
                </label>
                <input
                  id="tpl-subject-input"
                  type="text"
                  value={tplSubject}
                  onChange={(e) => setTplSubject(e.target.value)}
                  placeholder="e.g. Your Upcoming Appointment at {{salon_name}}"
                  className="w-full text-xs rounded-xl bg-surface border border-border p-2.5 text-text-primary focus:ring-2 focus:ring-primary outline-hidden"
                  required
                />
              </div>
            )}

            {/* Variable insertion buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-text-muted block">
                Click to Insert Variable Tokens:
              </span>
              <div className="flex flex-wrap gap-1">
                {VARIABLE_SUGGESTIONS.map((v) => (
                  <button
                    key={v.token}
                    type="button"
                    onClick={() => setTplMessage((prev) => `${prev} ${v.token}`)}
                    className="px-2 py-0.5 rounded-md bg-surface-subtle hover:bg-primary/10 hover:text-primary text-[10px] font-mono border border-border transition-colors"
                    title={v.desc}
                  >
                    {v.token}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                <label htmlFor="tpl-message-content">Template Message Content:</label>
                <span className="text-[11px] text-text-muted font-normal">
                  {tplMessage.length} characters
                </span>
              </div>
              <textarea
                id="tpl-message-content"
                rows={5}
                value={tplMessage}
                onChange={(e) => setTplMessage(e.target.value)}
                placeholder="Hi {{customer_name}}, your appointment for {{service_name}} is confirmed for {{appointment_time}}…"
                className="w-full text-xs rounded-xl bg-surface border border-border p-3 text-text-primary focus:ring-2 focus:ring-primary outline-hidden resize-none font-mono leading-relaxed"
                required
              />
            </div>

            {/* Live Preview */}
            <div className="rounded-xl bg-surface-subtle p-3 border border-border text-xs space-y-1">
              <span className="font-bold text-text-primary block text-[11px]">
                Live Preview (Substituted Example):
              </span>
              <p className="text-text-secondary italic">
                {interpolateTemplate(tplMessage, {
                  customer_name: 'Priya Sharma',
                  service_name: 'Balayage & Gloss Ritual',
                  appointment_date: '25 Sep 2026',
                  appointment_time: '2:30 PM',
                  staff_name: 'Rahul Verma',
                  salon_name: 'SALORA Luxury Salon',
                  amount: '₹4,500',
                  invoice_number: 'INV-101',
                  review_link: 'https://salora.app/customer/reviews/new',
                }) || 'Type message above to preview…'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTemplateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Template
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: LOG DETAIL & AUDIT (Requirement 11)              */}
      {/* ======================================================== */}
      {selectedLog && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLog(null)}
          title={`Message Details #${selectedLog.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-subtle border border-border">
              <div>
                <span className="text-text-muted block text-[11px]">Recipient</span>
                <strong className="text-text-primary">{selectedLog.customerName}</strong>
                <div className="font-mono text-text-secondary">{selectedLog.recipient}</div>
              </div>

              <div>
                <span className="text-text-muted block text-[11px]">Channel & Status</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 font-semibold text-text-primary">
                    {CHANNEL_ICONS[selectedLog.channel]}
                    <span>{selectedLog.channel}</span>
                  </span>
                  <span>•</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedLog.status}
                  </span>
                </div>
              </div>
            </div>

            {selectedLog.subject && (
              <div>
                <span className="text-text-muted block text-[11px]">Subject</span>
                <p className="font-semibold text-text-primary">{selectedLog.subject}</p>
              </div>
            )}

            <div>
              <span className="text-text-muted block text-[11px]">Payload Body</span>
              <div className="p-3 rounded-xl bg-surface-subtle border border-border font-mono text-text-primary leading-relaxed whitespace-pre-wrap">
                {selectedLog.body}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] text-text-muted">
              <div>
                <span>Sent:</span> <strong className="text-text-primary">{new Date(selectedLog.sentAt).toLocaleString('en-IN')}</strong>
              </div>
              {selectedLog.deliveredAt && (
                <div>
                  <span>Delivered:</span> <strong className="text-text-primary">{new Date(selectedLog.deliveredAt).toLocaleString('en-IN')}</strong>
                </div>
              )}
              {selectedLog.providerName && (
                <div>
                  <span>Carrier:</span> <strong className="text-text-primary">{selectedLog.providerName}</strong>
                </div>
              )}
              {selectedLog.referenceId && (
                <div>
                  <span>Reference ID:</span> <strong className="text-text-primary font-mono">{selectedLog.referenceId}</strong>
                </div>
              )}
            </div>

            {selectedLog.error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 space-y-1">
                <span className="font-bold block">Delivery Error Diagnostic:</span>
                <p>{selectedLog.error}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              {selectedLog.status === 'FAILED' && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleRetryLog(selectedLog.id)}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Retry Delivery ({selectedLog.retryCount}/3)
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
