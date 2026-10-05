import React from 'react'
import {
  Sparkles,
  Bot,
  Cpu,
  Shield,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Lock,
  Zap,
  RotateCcw,
  Layers,
  Database,
  Calendar,
  Users,
  Wallet,
  Package,
} from 'lucide-react'
import { useAIStore } from '@/store/useAIStore'
import { useToastStore } from '@/store/useToastStore'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AIProviderType } from '@/types'
import { cn } from '@/utils/cn'

const PROVIDER_OPTIONS: {
  id: AIProviderType
  name: string
  modelDefault: string
  description: string
  badge: string
}[] = [
  {
    id: 'local',
    name: 'Salora Local Analytics Engine',
    modelDefault: 'salora-local-engine-v1',
    description: 'Deterministic on-device salon intelligence. Zero latency, offline-ready, 100% data privacy.',
    badge: 'Recommended',
  },
  {
    id: 'openai',
    name: 'OpenAI GPT Engine',
    modelDefault: 'gpt-4o',
    description: 'Cloud LLM reasoning via enterprise API proxy. Advanced multi-turn synthesis.',
    badge: 'Enterprise API',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    modelDefault: 'claude-3-5-sonnet',
    description: 'High-precision long-context conversational reasoning and narrative reports.',
    badge: 'Enterprise API',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    modelDefault: 'gemini-1.5-pro',
    description: 'High-throughput multimodal business intelligence engine.',
    badge: 'Enterprise API',
  },
]

export const AISettingsSection: React.FC = () => {
  const { settings, updateSettings, openDrawer } = useAIStore()
  const { addToast } = useToastStore()

  const handleToggleEnabled = (enabled: boolean) => {
    updateSettings({ enabled })
    addToast({
      title: enabled ? 'AI Assistant Enabled' : 'AI Assistant Disabled',
      message: enabled
        ? 'Salora AI assistant is now operational across dashboard and navigation.'
        : 'Salora AI assistant has been temporarily suspended.',
      type: enabled ? 'success' : 'info',
    })
  }

  const handleProviderChange = (provider: AIProviderType) => {
    const selected = PROVIDER_OPTIONS.find((p) => p.id === provider)
    updateSettings({
      provider,
      modelName: selected?.modelDefault || 'salora-local-engine-v1',
    })
    addToast({
      title: 'AI Provider Updated',
      message: `Switched inference engine to ${selected?.name}.`,
      type: 'info',
    })
  }

  const handleToggleScope = (scopeKey: keyof typeof settings.dataAccessScopes) => {
    updateSettings({
      dataAccessScopes: {
        ...settings.dataAccessScopes,
        [scopeKey]: !settings.dataAccessScopes[scopeKey],
      },
    })
    addToast({
      title: 'Data Scope Updated',
      message: `Updated data boundary for ${scopeKey}.`,
      type: 'info',
    })
  }

  const handleResetUsage = () => {
    updateSettings({ usedQueriesToday: 0 })
    addToast({
      title: 'Quota Counter Reset',
      message: 'Today\'s query usage counter has been reset to 0.',
      type: 'success',
    })
  }

  const usagePercent = Math.min(
    100,
    Math.round((settings.usedQueriesToday / (settings.dailyQueryLimit || 100)) * 100)
  )

  return (
    <div className="space-y-6">
      {/* 1. Master Enable Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Salora AI Business Assistant Core
              </CardTitle>
              <CardDescription>
                Configure conversational business intelligence, access bounds, and inference providers
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={settings.enabled ? 'success' : 'default'}>
                {settings.enabled ? 'ACTIVE & OPERATIONAL' : 'SUSPENDED'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  openDrawer("Summarize this week's salon performance.", {
                    sourcePage: 'settings_ai',
                  })
                }
                className="text-xs"
              >
                <Bot className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Test Assistant
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <label className="flex items-center justify-between p-4 rounded-xl bg-surface-subtle border border-border cursor-pointer hover:bg-surface transition-colors">
            <div>
              <span className="font-bold text-text-primary block text-sm">
                Enable AI Conversational Assistant
              </span>
              <span className="text-text-muted text-xs">
                When enabled, authorized staff can query revenue, appointments, client history, and low-stock alerts.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleToggleEnabled(e.target.checked)}
              className="w-5 h-5 rounded text-primary focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
            />
          </label>
        </CardContent>
      </Card>

      {/* 2. Provider Engine & Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            AI Provider &amp; Model Architecture
          </CardTitle>
          <CardDescription>
            Pluggable provider abstraction supporting on-premise local calculation and enterprise foundation models
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {PROVIDER_OPTIONS.map((prov) => {
              const isSelected = settings.provider === prov.id
              return (
                <div
                  key={prov.id}
                  onClick={() => handleProviderChange(prov.id)}
                  className={cn(
                    'p-4 rounded-2xl border text-left cursor-pointer transition-all relative flex flex-col justify-between gap-3',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30'
                      : 'border-border bg-surface hover:border-text-secondary/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary">{prov.name}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">
                        {prov.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                    <span className="font-mono text-text-secondary">Model: {prov.modelDefault}</span>
                    <Badge variant={isSelected ? 'primary' : 'default'} className="text-[10px]">
                      {prov.badge}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Security & Token Isolation Notice (Requirement 12) */}
          <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 text-xs">
            <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-text-primary">
                Zero Frontend Token Exposure Policy
              </span>
              <p className="text-text-muted leading-relaxed">
                External AI API keys are never exposed in browser localStorage or UI source code. Remote provider requests route through authenticated server proxies with strictly scoped credentials.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Usage Limits & Rate Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Usage Quotas &amp; Safety Controls
              </CardTitle>
              <CardDescription>
                Prevent runaway queries and regulate daily salon team usage
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetUsage}
              className="text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset Daily Count
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-text-secondary">Today's Consumption</span>
              <span className="text-text-primary tabular-nums">
                {settings.usedQueriesToday} / {settings.dailyQueryLimit} queries ({usagePercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-border overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-300 rounded-full',
                  usagePercent > 85 ? 'bg-rose-500' : usagePercent > 60 ? 'bg-amber-500' : 'bg-primary'
                )}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Daily Query Ceiling
              </label>
              <select
                value={settings.dailyQueryLimit}
                onChange={(e) => updateSettings({ dailyQueryLimit: Number(e.target.value) })}
                className="w-full text-xs font-medium rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value={50}>50 queries / day (Standard)</option>
                <option value={100}>100 queries / day (Recommended)</option>
                <option value={250}>250 queries / day (Busy Multi-Staff)</option>
                <option value={500}>500 queries / day (High Capacity)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Model Identifier
              </label>
              <input
                type="text"
                value={settings.modelName}
                onChange={(e) => updateSettings({ modelName: e.target.value })}
                className="w-full text-xs font-mono rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Data Access Scopes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Data Access Scope Boundaries
          </CardTitle>
          <CardDescription>
            Control which business domains the AI tool engine is permitted to inspect
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              key: 'financials' as const,
              label: 'Billing, Revenue & P&L',
              desc: 'Permits AI to summarize gross revenue, ticket size, and register payment methods (Owner/Admin roles only).',
              icon: Wallet,
            },
            {
              key: 'appointments' as const,
              label: 'Appointments & Schedules',
              desc: 'Permits AI to check slot density, daily bookings, cancellations, and visit statuses.',
              icon: Calendar,
            },
            {
              key: 'clients' as const,
              label: 'Client Directory & History',
              desc: 'Permits AI to look up client visit dates, loyalty tiers, and inactive customer cohorts.',
              icon: Users,
            },
            {
              key: 'staff' as const,
              label: 'Staff Roster & Performance',
              desc: 'Permits AI to view specialist appointment volume, ratings, and commission totals.',
              icon: Users,
            },
            {
              key: 'inventory' as const,
              label: 'Inventory & Stock Alerts',
              desc: 'Permits AI to retrieve products below reorder thresholds and supplier backorders.',
              icon: Package,
            },
          ].map((scope) => {
            const Icon = scope.icon
            const isChecked = settings.dataAccessScopes[scope.key]
            return (
              <label
                key={scope.key}
                className="flex items-start justify-between p-3.5 rounded-xl border border-border bg-surface hover:bg-surface-subtle transition-colors cursor-pointer gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-border flex items-center justify-center shrink-0 mt-0.5 text-text-secondary">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-text-primary block">
                      {scope.label}
                    </span>
                    <span className="text-[11px] text-text-muted leading-relaxed block mt-0.5">
                      {scope.desc}
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleScope(scope.key)}
                  className="w-4 h-4 rounded text-primary focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer shrink-0 mt-1"
                />
              </label>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
