import React, { useState } from 'react'
import {
  Webhook,
  Plus,
  Copy,
  Check,
  Play,
  Trash2,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  Code2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Send,
} from 'lucide-react'
import { WebhookEndpoint } from '@/types'
import { integrationsService } from '@/services/integrationsService'
import { useToastStore } from '@/store/useToastStore'
import { NewWebhookModal } from './NewWebhookModal'
import { cn } from '@/utils/cn'

interface WebhooksViewProps {
  webhooks: WebhookEndpoint[]
  onRefresh: () => void
}

export const WebhooksView: React.FC<WebhooksViewProps> = ({ webhooks, onRefresh }) => {
  const { addToast } = useToastStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'node' | 'python' | 'curl'>('node')
  const [testingId, setTestingId] = useState<string | null>(null)

  const inboundUrl = 'https://api.salora.app/v1/webhooks/inbound/tenant-salora'

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleToggleStatus = (id: string) => {
    const updated = integrationsService.toggleWebhookStatus(id)
    onRefresh()
    addToast({
      title: 'Webhook Status Updated',
      message: `${updated.name} is now ${updated.status}.`,
      type: 'info',
    })
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete webhook "${name}"?`)) {
      integrationsService.deleteWebhook(id)
      onRefresh()
      addToast({
        title: 'Webhook Deleted',
        message: `Endpoint "${name}" removed.`,
        type: 'warning',
      })
    }
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    try {
      const res = await integrationsService.testWebhook(id)
      onRefresh()
      if (res.success) {
        addToast({
          title: 'Webhook Ping Delivered',
          message: `Payload successfully delivered (HTTP ${res.statusCode}, ${res.responseTime}ms)`,
          type: 'success',
        })
      } else {
        addToast({
          title: 'Webhook Ping Failed',
          message: `HTTP ${res.statusCode} delivery failure`,
          type: 'danger',
        })
      }
    } finally {
      setTestingId(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* ─── Top: Inbound Webhooks Architecture ─── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
              <ArrowDownLeft className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Incoming Webhook Ingestion Architecture
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Receive external customer leads, third-party aggregator bookings, and payment notifications directly into SALORA.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            Ingestion Gateway Active
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Endpoint URL & Headers */}
          <div className="space-y-4">
            <div>
              <label htmlFor="inbound-url-display" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Your Dedicated Inbound Webhook Endpoint
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2.5 dark:border-gray-700 dark:bg-gray-800">
                <code id="inbound-url-display" className="text-xs font-mono text-gray-800 dark:text-gray-200 truncate flex-1">
                  {inboundUrl}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy(inboundUrl, 'inbound-url')}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition-colors cursor-pointer shrink-0"
                >
                  {copiedKey === 'inbound-url' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedKey === 'inbound-url' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-3.5 text-xs dark:bg-gray-800/60 space-y-2 border border-gray-100 dark:border-gray-800">
              <span className="font-semibold text-gray-800 dark:text-gray-200 block">
                Required HTTP Headers for Ingestion:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600 dark:text-gray-400 font-mono text-[11px]">
                <div className="p-1.5 bg-white dark:bg-gray-900 rounded border border-gray-200/70 dark:border-gray-700">
                  <span className="text-primary font-bold">Content-Type:</span> application/json
                </div>
                <div className="p-1.5 bg-white dark:bg-gray-900 rounded border border-gray-200/70 dark:border-gray-700">
                  <span className="text-primary font-bold">x-salora-signature:</span> sha256=...
                </div>
                <div className="p-1.5 bg-white dark:bg-gray-900 rounded border border-gray-200/70 dark:border-gray-700 sm:col-span-2">
                  <span className="text-primary font-bold">x-salora-timestamp:</span> 1727438400000 (tolerance &lt; 300s)
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Code Verification Snippet */}
          <div className="rounded-xl border border-gray-200 bg-gray-900 text-gray-200 p-4 dark:border-gray-800 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                <span className="text-[11px] font-semibold text-gray-300">HMAC-SHA256 Signature Verification</span>
              </div>
              <div className="flex items-center gap-1">
                {(['node', 'python', 'curl'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveTab(lang)}
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors cursor-pointer',
                      activeTab === lang
                        ? 'bg-primary text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <pre className="mt-3 overflow-x-auto text-[11px] text-emerald-300 leading-relaxed max-h-36">
              {activeTab === 'node' && `const crypto = require('crypto');
function verify(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}`}
              {activeTab === 'python' && `import hmac, hashlib
def verify_salora_webhook(payload, signature, secret):
    expected = 'sha256=' + hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)`}
              {activeTab === 'curl' && `curl -X POST https://api.salora.app/v1/webhooks/inbound/tenant-salora \\
  -H "Content-Type: application/json" \\
  -H "x-salora-signature: sha256=abcdef..." \\
  -d '{"event":"booking.created","customer":{"name":"Priya"}}'`}
            </pre>
          </div>
        </div>
      </section>

      {/* ─── Bottom: Outgoing Webhook Subscriptions ─── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
              <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Outgoing Webhooks Configuration
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Trigger HTTPS event posts to external automation platforms (Zapier, Make, n8n, Custom ERPs).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Register Webhook Endpoint</span>
          </button>
        </div>

        {webhooks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
            <Webhook className="mx-auto h-8 w-8 text-gray-400" aria-hidden="true" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No Outgoing Webhooks Configured</h3>
            <p className="mt-1 text-xs text-gray-500">
              Register an endpoint to stream live appointment, invoice, and customer lifecycle events.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 transition-all hover:border-gray-300 dark:hover:border-gray-700"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                      {wh.name}
                    </h3>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border',
                        wh.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', wh.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-400')} />
                      {wh.status}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Failures: <strong className="text-gray-700 dark:text-gray-300" style={{ fontVariantNumeric: 'tabular-nums' }}>{wh.failureCount}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-gray-600 dark:text-gray-300">
                    <span className="truncate max-w-md">{wh.url}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(wh.url, `wh-url-${wh.id}`)}
                      title="Copy Endpoint URL"
                      aria-label="Copy Endpoint URL"
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                      {copiedKey === `wh-url-${wh.id}` ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {/* Events Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {wh.events.map((ev) => (
                      <span
                        key={ev}
                        className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-mono text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>

                  {/* Masked Secret Info */}
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-400">
                    <Lock className="h-3 w-3" aria-hidden="true" />
                    <span>Signing Secret:</span>
                    <code className="font-mono text-gray-600 dark:text-gray-300">{wh.signingSecret}</code>
                    <span className="text-[10px] text-gray-400">(Never exposed in plaintext)</span>
                  </div>
                </div>

                {/* Webhook Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(wh.id)}
                    aria-label={`Toggle ${wh.name} status`}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                  >
                    {wh.status === 'ACTIVE' ? (
                      <ToggleRight className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    )}
                    <span>{wh.status === 'ACTIVE' ? 'Active' : 'Paused'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTest(wh.id)}
                    disabled={testingId === wh.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>{testingId === wh.id ? 'Sending…' : 'Test Dispatch'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(wh.id, wh.name)}
                    aria-label={`Delete webhook ${wh.name}`}
                    title="Delete Webhook"
                    className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* New Webhook Modal */}
      <NewWebhookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => {
          onRefresh()
          addToast({
            title: 'Webhook Registered',
            message: 'Your new outgoing webhook endpoint is active.',
            type: 'success',
          })
        }}
      />
    </div>
  )
}
