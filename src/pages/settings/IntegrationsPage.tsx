import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Layers,
  Webhook,
  ListFilter,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Zap,
  Radio,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react'
import { IntegrationItem, IntegrationCategory, WebhookEndpoint, IntegrationLog } from '@/types'
import { integrationsService } from '@/services/integrationsService'
import { useToastStore } from '@/store/useToastStore'
import { IntegrationCard } from '@/components/integrations/IntegrationCard'
import { ConfigureIntegrationModal } from '@/components/integrations/ConfigureIntegrationModal'
import { TestIntegrationModal } from '@/components/integrations/TestIntegrationModal'
import { WebhooksView } from '@/components/integrations/WebhooksView'
import { IntegrationLogsView } from '@/components/integrations/IntegrationLogsView'
import { cn } from '@/utils/cn'

const CATEGORY_TABS: { id: IntegrationCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Services' },
  { id: 'payments', label: 'Payments' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'sms', label: 'SMS' },
  { id: 'email', label: 'Email' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'printing', label: 'Printing' },
  { id: 'storage', label: 'Storage' },
  { id: 'analytics', label: 'Analytics' },
]

export const IntegrationsPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  // Data state from service
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([])
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([])
  const [logs, setLogs] = useState<IntegrationLog[]>([])

  // UI state
  const isWebhooksRoute = location.pathname.includes('/webhooks')
  const [activeMainTab, setActiveMainTab] = useState<'catalog' | 'webhooks' | 'logs'>(
    isWebhooksRoute ? 'webhooks' : 'catalog'
  )
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [configuringItem, setConfiguringItem] = useState<IntegrationItem | null>(null)
  const [testingItem, setTestingItem] = useState<IntegrationItem | null>(null)
  const [testingMode, setTestingMode] = useState<'token' | 'invoice' | undefined>(undefined)

  const reloadData = () => {
    setIntegrations(integrationsService.getIntegrations())
    setWebhooks(integrationsService.getWebhooks())
    setLogs(integrationsService.getLogs())
  }

  useEffect(() => {
    reloadData()
  }, [])

  useEffect(() => {
    if (location.pathname.includes('/webhooks')) {
      setActiveMainTab('webhooks')
    }
  }, [location.pathname])

  const handleMainTabChange = (tab: 'catalog' | 'webhooks' | 'logs') => {
    setActiveMainTab(tab)
    if (tab === 'webhooks') {
      navigate('/settings/integrations/webhooks', { replace: true })
    } else {
      navigate('/settings/integrations', { replace: true })
    }
  }

  // --- Actions ---
  const handleConnect = (item: IntegrationItem) => {
    // Open configure modal to supply credentials & connect
    setConfiguringItem(item)
  }

  const handleConfigure = (item: IntegrationItem) => {
    setConfiguringItem(item)
  }

  const handleTest = (item: IntegrationItem, mode?: 'token' | 'invoice') => {
    setTestingItem(item)
    setTestingMode(mode)
  }

  const handleDisconnect = (item: IntegrationItem) => {
    if (window.confirm(`Are you sure you want to disconnect ${item.name}? Ongoing sync will halt.`)) {
      integrationsService.disconnectIntegration(item.id)
      reloadData()
      addToast({
        title: 'Integration Disconnected',
        message: `${item.name} has been decoupled.`,
        type: 'warning',
      })
    }
  }

  const handleSaveConfig = (id: string, config: Record<string, any>) => {
    const item = integrations.find((i) => i.id === id)
    if (item?.status === 'not_connected') {
      integrationsService.connectIntegration(id, config)
      addToast({
        title: 'Integration Connected',
        message: `${item.name} credentials verified & activated.`,
        type: 'success',
      })
    } else {
      integrationsService.updateConfig(id, config)
      addToast({
        title: 'Configuration Saved',
        message: `Settings for ${item?.name || 'integration'} updated.`,
        type: 'success',
      })
    }
    reloadData()
  }

  // Filtered integrations
  const filteredIntegrations = integrations.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Calculated stats
  const connectedCount = integrations.filter((i) => i.status === 'connected').length
  const totalCount = integrations.length
  const activeWebhooksCount = webhooks.filter((w) => w.status === 'ACTIVE').length
  const failedLogsCount = logs.filter((l) => l.status === 'FAILED' && l.isRetryable).length

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Integrations Hub
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary dark:bg-primary/20">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              SaaS Connect
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Centrally configure payment gateways, WhatsApp messaging, SMS, email providers, thermal printers, and webhooks.
          </p>
        </div>

        {/* Top Vault Pill */}
        <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3.5 py-2 shadow-xs dark:border-gray-800 dark:bg-gray-900 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-900 dark:text-white leading-tight">
              Secret Masking Active
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              KMS Isolated Vault
            </div>
          </div>
        </div>
      </div>

      {/* ─── Metric Overview Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Integrations</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {connectedCount}
            </span>
            <span className="text-xs text-gray-400">/ {totalCount} Available</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(connectedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Outgoing Webhooks</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {activeWebhooksCount}
            </span>
            <span className="text-xs text-gray-400">Live Endpoints</span>
          </div>
          <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Ingestion Gateway Ready
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Delivery Success Rate</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
              99.8%
            </span>
            <span className="text-xs text-gray-400">Last 30 Days</span>
          </div>
          <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
            Average Latency: 42ms
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Retry Queue</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={cn(
                'text-2xl font-bold',
                failedLogsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'
              )}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {failedLogsCount}
            </span>
            <span className="text-xs text-gray-400">Failed / Queued</span>
          </div>
          <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
            {failedLogsCount > 0 ? 'Actionable retries available' : 'All background jobs healthy'}
          </p>
        </div>
      </div>

      {/* ─── Main Tabs Navigation ─── */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <nav className="flex space-x-6" aria-label="Integrations sections">
          <button
            type="button"
            onClick={() => handleMainTabChange('catalog')}
            className={cn(
              'flex items-center gap-2 pb-3.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer',
              activeMainTab === 'catalog'
                ? 'border-primary text-primary dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            <Layers className="h-4 w-4" aria-hidden="true" />
            <span>All Integrations</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {integrations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleMainTabChange('webhooks')}
            className={cn(
              'flex items-center gap-2 pb-3.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer',
              activeMainTab === 'webhooks'
                ? 'border-primary text-primary dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            <Webhook className="h-4 w-4" aria-hidden="true" />
            <span>Webhooks & Inbound API</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {webhooks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleMainTabChange('logs')}
            className={cn(
              'flex items-center gap-2 pb-3.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer',
              activeMainTab === 'logs'
                ? 'border-primary text-primary dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            <ListFilter className="h-4 w-4" aria-hidden="true" />
            <span>Execution Logs</span>
            {failedLogsCount > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                {failedLogsCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* ─── Tab 1: All Integrations Catalog ─── */}
      {activeMainTab === 'catalog' && (
        <div className="space-y-6">
          {/* Category Filter Pills & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORY_TABS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                    selectedCategory === cat.id
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search integrations…"
                className="block w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredIntegrations.map((item) => (
              <IntegrationCard
                key={item.id}
                integration={item}
                onConnect={handleConnect}
                onConfigure={handleConfigure}
                onTest={handleTest}
                onDisconnect={handleDisconnect}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Tab 2: Webhooks View ─── */}
      {activeMainTab === 'webhooks' && (
        <WebhooksView webhooks={webhooks} onRefresh={reloadData} />
      )}

      {/* ─── Tab 3: Execution Logs View ─── */}
      {activeMainTab === 'logs' && (
        <IntegrationLogsView logs={logs} onRefresh={reloadData} />
      )}

      {/* ─── Modals ─── */}
      <ConfigureIntegrationModal
        isOpen={Boolean(configuringItem)}
        onClose={() => setConfiguringItem(null)}
        integration={configuringItem}
        onSave={handleSaveConfig}
      />

      <TestIntegrationModal
        isOpen={Boolean(testingItem)}
        onClose={() => {
          setTestingItem(null)
          setTestingMode(undefined)
        }}
        integration={testingItem}
        initialMode={testingMode}
        onTestComplete={reloadData}
      />
    </div>
  )
}
