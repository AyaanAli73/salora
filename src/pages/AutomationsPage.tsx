import React, { useState, useMemo } from 'react'
import {
  Zap,
  Play,
  RotateCcw,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  PowerOff,
  Power,
  Edit2,
  Trash2,
  Copy,
  Calendar,
  Layers,
  Search,
  ArrowRight,
  ShieldAlert,
  Smartphone,
  MessageSquare,
  Gift,
  HelpCircle,
} from 'lucide-react'
import {
  automationService,
  AUTOMATION_TEMPLATES,
} from '@/services/automationService'
import {
  WorkflowAutomationRule,
  AutomationJobLog,
  JobExecutionStatus,
} from '@/types'
import { useAIStore } from '@/store/useAIStore'
import { useToastStore } from '@/store/useToastStore'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AutomationBuilderModal } from '@/components/automations/AutomationBuilderModal'
import { JobErrorModal } from '@/components/automations/JobErrorModal'
import { formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export const AutomationsPage: React.FC = () => {
  const { openDrawer } = useAIStore()
  const { addToast } = useToastStore()

  // Tab State
  const [activeTab, setActiveTab] = useState<'automations' | 'templates' | 'activity' | 'failed'>('automations')

  // Data State
  const [rules, setRules] = useState<WorkflowAutomationRule[]>(() => automationService.getAllAutomations())
  const [logs, setLogs] = useState<AutomationJobLog[]>(() => automationService.getActivityLogs())

  // Filter States for Activity Log
  const [logStatusFilter, setLogStatusFilter] = useState<JobExecutionStatus | 'ALL'>('ALL')
  const [logSearch, setLogSearch] = useState('')
  const [logAutomationFilter, setLogAutomationFilter] = useState('all')

  // Modals
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<WorkflowAutomationRule | null>(null)
  const [selectedFailedJob, setSelectedFailedJob] = useState<AutomationJobLog | null>(null)
  const [isRetryingJobId, setIsRetryingJobId] = useState<string | null>(null)

  const reloadData = () => {
    setRules(automationService.getAllAutomations())
    setLogs(automationService.getActivityLogs())
  }

  // Filtered Activity Logs
  const filteredLogs = useMemo(() => {
    return automationService.getActivityLogs({
      automationId: logAutomationFilter,
      status: logStatusFilter,
      search: logSearch,
    })
  }, [logs, logAutomationFilter, logStatusFilter, logSearch])

  const failedJobs = useMemo(() => {
    return logs.filter((l) => l.status === 'FAILED')
  }, [logs])

  // Actions
  const handleToggleRule = (id: string) => {
    try {
      const updated = automationService.toggleAutomation(id)
      reloadData()
      addToast({
        title: updated.enabled ? 'Automation Enabled' : 'Automation Paused',
        message: `${updated.name} is now ${updated.enabled ? 'active' : 'paused'}.`,
        type: updated.enabled ? 'success' : 'info',
      })
    } catch {
      addToast({
        title: 'Error',
        message: 'Could not toggle automation rule.',
        type: 'danger',
      })
    }
  }

  const handleDeleteRule = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete automation "${name}"?`)) {
      automationService.deleteAutomation(id)
      reloadData()
      addToast({
        title: 'Automation Removed',
        message: `Removed ${name} from active rules.`,
        type: 'info',
      })
    }
  }

  const handleSaveRule = (data: Omit<WorkflowAutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'runCount'>) => {
    if (editingRule) {
      automationService.updateAutomation(editingRule.id, data)
      addToast({
        title: 'Automation Updated',
        message: `Saved modifications to "${data.name}".`,
        type: 'success',
      })
    } else {
      automationService.createAutomation(data)
      addToast({
        title: 'Automation Created',
        message: `New workflow "${data.name}" is now live.`,
        type: 'success',
      })
    }
    reloadData()
    setEditingRule(null)
  }

  const handleUseTemplate = (templateId: string) => {
    try {
      const created = automationService.createFromTemplate(templateId)
      reloadData()
      setActiveTab('automations')
      addToast({
        title: 'Template Activated',
        message: `Created "${created.name}" from prebuilt template.`,
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Error',
        message: 'Could not instantiate template.',
        type: 'danger',
      })
    }
  }

  const handleSimulateRun = async (rule: WorkflowAutomationRule) => {
    addToast({
      title: 'Simulating Event Trigger',
      message: `Dispatching mock ${rule.trigger} event...`,
      type: 'info',
    })

    const newJobs = await automationService.triggerEvent({
      trigger: rule.trigger,
      entityId: `demo-${Date.now()}`,
      entityType: 'appointment',
      entityName: 'Hair Styling & Keratin Treatment',
      customerName: 'Priya Sharma (VIP)',
      branchName: 'Main Flagship',
      contextData: {
        client: { id: 'c-101', isVip: true, totalSpent: 12500, daysSinceLastVisit: 62 },
        appointment: { serviceName: 'Hair Spa', time: '11:00 AM' },
        bill: { grandTotal: 2500, invoiceNumber: 'INV-2026-901' },
      },
    })

    reloadData()
    if (newJobs.length > 0) {
      addToast({
        title: 'Automation Dispatched',
        message: `Processed ${newJobs.length} automated action(s). Idempotency key verified.`,
        type: 'success',
      })
    } else {
      addToast({
        title: 'Skipped / Filtered',
        message: 'Event did not match conditions or duplicate idempotency detected.',
        type: 'warning',
      })
    }
  }

  const handleRetryJob = async (jobId: string) => {
    setIsRetryingJobId(jobId)
    try {
      await new Promise((res) => setTimeout(res, 600)) // Simulated gateway round-trip
      await automationService.retryJob(jobId)
      reloadData()
      setSelectedFailedJob(null)
      addToast({
        title: 'Job Retried Successfully',
        message: 'Automated action executed and marked completed.',
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Retry Failed',
        message: 'Job exceeded maximum retry attempts.',
        type: 'danger',
      })
    } finally {
      setIsRetryingJobId(null)
    }
  }

  const handleDisableAutomation = (automationId: string) => {
    automationService.updateAutomation(automationId, { enabled: false })
    reloadData()
    setSelectedFailedJob(null)
    addToast({
      title: 'Automation Paused',
      message: 'Suspended workflow to prevent repeated job errors.',
      type: 'warning',
    })
  }

  // Summary Metrics
  const activeCount = rules.filter((r) => r.enabled).length
  const totalRuns = rules.reduce((acc, r) => acc + r.runCount, 0)
  const queuedCount = logs.filter((l) => l.status === 'QUEUED' || l.status === 'RUNNING').length
  const failedCount = failedJobs.length

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* 1. Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
              Phase 5 Workflow Engine
            </span>
            <span className="text-xs text-text-muted">• Event → Condition → Action Architecture</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary mt-1 flex items-center gap-2.5">
            <Zap className="w-7 h-7 text-primary" />
            Salon Automations &amp; Workflows
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Event-driven triggers, conditional filtering, message dispatch, review collection, and reorder requisitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              openDrawer("Summarize this week's salon performance.", {
                sourcePage: 'automations',
              })
            }
            className="text-xs"
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-primary" />
            Ask Salora AI
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingRule(null)
              setIsBuilderOpen(true)
            }}
            className="text-xs shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Automation
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-text-muted">
            <span>Active Workflows</span>
            <Power className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-text-primary tabular-nums block">
            {activeCount}{' '}
            <span className="text-xs font-normal text-text-muted">/ {rules.length}</span>
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold block">
            Operational
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-text-muted">
            <span>Total Executions</span>
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </div>
          <span className="text-2xl font-black text-text-primary tabular-nums block">
            {totalRuns.toLocaleString()}
          </span>
          <span className="text-[11px] text-text-muted block">Lifetime trigger events</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-text-muted">
            <span>Pending / Delayed</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600 tabular-nums block">
            {queuedCount}
          </span>
          <span className="text-[11px] text-text-muted block">Queued with timer delay</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-text-muted">
            <span>Failed Jobs</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl font-black text-rose-600 tabular-nums block">
            {failedCount}
          </span>
          <span className="text-[11px] text-text-muted block">
            {failedCount > 0 ? 'Requires attention' : 'Zero errors'}
          </span>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-subtle border border-border w-fit overflow-x-auto max-w-full">
        {[
          { id: 'automations', label: 'Automations', count: rules.length },
          { id: 'templates', label: 'Templates', count: AUTOMATION_TEMPLATES.length },
          { id: 'activity', label: 'Activity Log', count: logs.length },
          { id: 'failed', label: 'Failed Jobs', count: failedCount },
        ].map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                  isActive
                    ? 'bg-white/20 text-white'
                    : tab.id === 'failed' && tab.count > 0
                    ? 'bg-rose-500/20 text-rose-600'
                    : 'bg-surface border border-border text-text-muted'
                )}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: AUTOMATIONS LIST                                   */}
      {/* ======================================================== */}
      {activeTab === 'automations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => {
              const isEnabled = rule.enabled
              return (
                <Card
                  key={rule.id}
                  className={cn(
                    'p-5 transition-all flex flex-col justify-between gap-4 border',
                    isEnabled
                      ? 'border-border bg-surface'
                      : 'border-border/60 bg-surface/50 opacity-75'
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-text-primary">
                            {rule.name}
                          </h3>
                          {rule.category && (
                            <Badge variant="default" className="text-[10px]">
                              {rule.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-1 leading-relaxed">
                          {rule.description}
                        </p>
                      </div>

                      {/* Power switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule.id)}
                        className={cn(
                          'w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 focus:outline-none focus:ring-2 focus:ring-primary/40',
                          isEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                        )}
                        title={isEnabled ? 'Click to Pause' : 'Click to Enable'}
                        aria-label={isEnabled ? `Pause automation ${rule.name}` : `Enable automation ${rule.name}`}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full bg-white transition-transform shadow-xs',
                            isEnabled ? 'translate-x-5' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </div>

                    {/* Step Visual Summary (Section 2) */}
                    <div className="p-3 rounded-xl bg-surface-subtle border border-border space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                          Trigger:
                        </span>
                        <Badge variant="primary" className="text-[10px]">
                          {rule.trigger.replace('_', ' ')}
                        </Badge>
                        <span className="text-text-muted text-[11px]">•</span>
                        <span className="text-[11px] text-text-secondary font-medium">
                          {rule.delay.value === 0 || rule.delay.unit === 'immediately'
                            ? 'Immediately'
                            : `Wait ${rule.delay.value} ${rule.delay.unit}`}
                        </span>
                      </div>

                      {rule.conditionGroup.conditions.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                          <span className="font-semibold text-text-secondary">
                            Conditions ({rule.conditionGroup.logicalOperator}):
                          </span>
                          <span className="truncate">
                            {rule.conditionGroup.conditions.map((c) => `${c.field} ${c.operator} ${c.value}`).join(', ')}
                          </span>
                        </div>
                      )}

                      <div className="pt-1.5 border-t border-border flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-text-secondary">
                          Action: {rule.actions[0]?.title || rule.actions[0]?.type}
                        </span>
                        <span className="text-text-muted tabular-nums">
                          Run {rule.runCount} times
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSimulateRun(rule)}
                      className="text-xs h-7.5 px-2.5 text-primary hover:border-primary"
                    >
                      <Play className="w-3 h-3 mr-1 fill-primary" />
                      Test Event
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingRule(rule)
                          setIsBuilderOpen(true)
                        }}
                        className="text-xs h-7.5 px-2 text-text-secondary"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id, rule.name)}
                        className="text-xs h-7.5 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        aria-label={`Delete automation ${rule.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: TEMPLATES (Section 7)                             */}
      {/* ======================================================== */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border">
            <h3 className="text-sm font-bold text-text-primary">
              Prebuilt Salon Workflow Templates
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Battle-tested event-driven sequences for review capture, appointment reminders, birthday greetings, and stock replenishment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AUTOMATION_TEMPLATES.map((tmpl) => (
              <Card key={tmpl.id} className="p-5 flex flex-col justify-between gap-4 border border-border bg-surface">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="accent" className="text-[10px]">
                      {tmpl.category}
                    </Badge>
                    <span className="text-[11px] text-text-muted">
                      {tmpl.delay.value === 0 || tmpl.delay.unit === 'immediately'
                        ? 'Immediate'
                        : `Wait ${tmpl.delay.value} ${tmpl.delay.unit}`}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-text-primary leading-snug">
                      {tmpl.name}
                    </h4>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-subtle border border-border space-y-1 text-[11px]">
                    <span className="font-bold text-text-secondary block">
                      Trigger: {tmpl.trigger.replace('_', ' ')}
                    </span>
                    <span className="text-text-muted block">
                      Action: {tmpl.actions[0]?.title}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex justify-end">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleUseTemplate(tmpl.id)}
                    className="text-xs w-full sm:w-auto"
                  >
                    <Copy className="w-3 h-3 mr-1.5" />
                    Use Template
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ACTIVITY LOG (Section 8 & 12)                     */}
      {/* ======================================================== */}
      {activeTab === 'activity' && (
        <Card className="space-y-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-text-primary">
                  Automation Activity &amp; Audit Trail
                </CardTitle>
                <CardDescription className="text-xs">
                  Inspect execution timestamps, idempotency deduplication keys, and action delivery statuses.
                </CardDescription>
              </div>
              <span className="text-xs font-bold text-text-muted">
                {filteredLogs.length} events logged
              </span>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search by customer, entity, or keyword…"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full text-xs rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <select
                  value={logStatusFilter}
                  onChange={(e) => setLogStatusFilter(e.target.value as any)}
                  className="text-xs font-semibold rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="RUNNING">RUNNING</option>
                  <option value="QUEUED">QUEUED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>

                <select
                  value={logAutomationFilter}
                  onChange={(e) => setLogAutomationFilter(e.target.value)}
                  className="text-xs font-semibold rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none cursor-pointer"
                >
                  <option value="all">All Automations</option>
                  {rules.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted">
                No automation activity logs match the selected filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-y border-border bg-surface-subtle text-text-muted font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Automation</th>
                      <th className="py-3 px-4">Triggered At</th>
                      <th className="py-3 px-4">Entity / Target</th>
                      <th className="py-3 px-4">Action Summary</th>
                      <th className="py-3 px-4">Timing</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Idempotency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-subtle/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-text-primary">
                          {log.automationName}
                        </td>
                        <td className="py-3 px-4 text-text-secondary tabular-nums whitespace-nowrap">
                          {formatDate(log.triggeredAt)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-text-primary block">
                            {log.customerName || log.entityName}
                          </span>
                          <span className="text-[10px] text-text-muted block">
                            {log.entityType}: {log.entityId}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs text-text-secondary truncate">
                          {log.actionSummary}
                        </td>
                        <td className="py-3 px-4 text-text-muted whitespace-nowrap">
                          {log.delaySummary}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              log.status === 'COMPLETED'
                                ? 'success'
                                : log.status === 'RUNNING'
                                ? 'primary'
                                : log.status === 'QUEUED'
                                ? 'warning'
                                : log.status === 'FAILED'
                                ? 'danger'
                                : 'default'
                            }
                            className="text-[10px]"
                          >
                            {log.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[10px] text-text-muted truncate max-w-[120px]" title={log.idempotencyKey}>
                          {log.idempotencyKey.slice(0, 16)}…
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ======================================================== */}
      {/* TAB 4: FAILED JOBS & RETRY (Section 10)                  */}
      {/* ======================================================== */}
      {activeTab === 'failed' && (
        <Card className="space-y-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Failed Automation Jobs &amp; Retry Diagnostics
            </CardTitle>
            <CardDescription className="text-xs">
              Diagnose delivery errors, inspect provider failure messages, retry jobs, or pause problematic automations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {failedJobs.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-text-primary">
                  All Systems Clear
                </h4>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  Zero failed automation jobs detected. All scheduled triggers and actions completed successfully.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-y border-border bg-surface-subtle text-text-muted font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Automation</th>
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4">Triggered At</th>
                      <th className="py-3 px-4">Diagnostic Error</th>
                      <th className="py-3 px-4 text-center">Retries</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {failedJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-rose-50/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-text-primary">
                          {job.automationName}
                        </td>
                        <td className="py-3 px-4 font-medium text-text-secondary">
                          {job.customerName || job.entityName}
                        </td>
                        <td className="py-3 px-4 text-text-muted tabular-nums whitespace-nowrap">
                          {formatDate(job.triggeredAt)}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-rose-700 dark:text-rose-400 max-w-xs truncate">
                          {job.error || 'Execution timeout'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold tabular-nums">
                          {job.retryCount} / {job.maxRetries}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedFailedJob(job)}
                              className="text-xs h-7.5 px-2.5"
                            >
                              View Error
                            </Button>

                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleRetryJob(job.id)}
                              disabled={isRetryingJobId === job.id}
                              className="text-xs h-7.5 px-2.5"
                            >
                              <RotateCcw className={`w-3 h-3 mr-1 ${isRetryingJobId === job.id ? 'animate-spin' : ''}`} />
                              Retry
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Visual Step Builder Modal */}
      <AutomationBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false)
          setEditingRule(null)
        }}
        onSave={handleSaveRule}
        initialRule={editingRule}
      />

      {/* Failure Diagnostic & Retry Modal */}
      <JobErrorModal
        job={selectedFailedJob}
        isOpen={Boolean(selectedFailedJob)}
        onClose={() => setSelectedFailedJob(null)}
        onRetry={handleRetryJob}
        onDisableAutomation={handleDisableAutomation}
        isRetrying={Boolean(isRetryingJobId)}
      />
    </div>
  )
}
