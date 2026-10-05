import React, { useState } from 'react'
import { X, Webhook, Copy, Check, ShieldAlert, Plus, CheckSquare, Square } from 'lucide-react'
import { WebhookEndpoint } from '@/types'
import { integrationsService } from '@/services/integrationsService'

interface NewWebhookModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (endpoint: WebhookEndpoint) => void
}

const AVAILABLE_EVENTS = [
  { id: 'appointment.created', label: 'Appointment Booked', group: 'Appointments' },
  { id: 'appointment.completed', label: 'Appointment Completed', group: 'Appointments' },
  { id: 'appointment.cancelled', label: 'Appointment Cancelled', group: 'Appointments' },
  { id: 'client.created', label: 'New Client Registered', group: 'Clients' },
  { id: 'client.updated', label: 'Client Profile Updated', group: 'Clients' },
  { id: 'invoice.created', label: 'Invoice Generated', group: 'Invoices & Billing' },
  { id: 'invoice.paid', label: 'Invoice Settled / Paid', group: 'Invoices & Billing' },
  { id: 'payment.received', label: 'Payment Succeeded', group: 'Invoices & Billing' },
  { id: 'inventory.low_stock', label: 'Inventory Low Stock Alert', group: 'Inventory' },
]

export const NewWebhookModal: React.FC<NewWebhookModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'appointment.created',
    'invoice.paid',
  ])
  const [createdEndpoint, setCreatedEndpoint] = useState<WebhookEndpoint | null>(null)
  const [unmaskedSecret, setUnmaskedSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    )
  }

  const handleSelectAll = () => {
    if (selectedEvents.length === AVAILABLE_EVENTS.length) {
      setSelectedEvents([])
    } else {
      setSelectedEvents(AVAILABLE_EVENTS.map((e) => e.id))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !url.trim() || selectedEvents.length === 0) return

    const { webhook, rawSecret } = integrationsService.createWebhook({
      name: name.trim(),
      url: url.trim(),
      events: selectedEvents,
    })

    setUnmaskedSecret(rawSecret)
    setCreatedEndpoint(webhook)
  }

  const handleCopySecret = () => {
    if (unmaskedSecret) {
      navigator.clipboard.writeText(unmaskedSecret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleFinish = () => {
    if (createdEndpoint) {
      onCreated(createdEndpoint)
    }
    // Reset state
    setName('')
    setUrl('')
    setSelectedEvents(['appointment.created', 'invoice.paid'])
    setCreatedEndpoint(null)
    setUnmaskedSecret(null)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-webhook-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={createdEndpoint ? handleFinish : onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900 z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
              <Webhook className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="new-webhook-title" className="text-lg font-bold text-gray-900 dark:text-white">
                {createdEndpoint ? 'Webhook Endpoint Created' : 'Register Outgoing Webhook'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {createdEndpoint
                  ? 'Store your signing secret securely. It will never be shown again.'
                  : 'Dispatch real-time salon lifecycle events to your CRM or custom server.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={createdEndpoint ? handleFinish : onClose}
            aria-label="Close webhook modal"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Secret Reveal Step */}
        {createdEndpoint && unmaskedSecret ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <div>
                  <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">One-Time Secret Reveal</h3>
                  <p className="mt-1 leading-relaxed">
                    This webhook signing secret will <strong>never be shown again</strong> in plaintext. Use this secret to verify signatures on incoming headers using <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">HMAC-SHA256</code>.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-amber-300 bg-white p-2.5 font-mono text-xs dark:border-amber-800 dark:bg-gray-900">
                <span className="truncate text-gray-800 dark:text-gray-200 font-semibold">{unmaskedSecret}</span>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors cursor-pointer shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Secret'}</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-3.5 text-xs text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 space-y-1">
              <div><strong>Endpoint:</strong> {createdEndpoint.name}</div>
              <div className="truncate"><strong>Destination:</strong> {createdEndpoint.url}</div>
              <div><strong>Subscribed Events:</strong> {createdEndpoint.events.length} events</div>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer"
            >
              I Have Saved the Secret Securely
            </button>
          </div>
        ) : (
          /* Form Step */
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="wh-name" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Webhook Friendly Name
              </label>
              <input
                id="wh-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Zapier CRM Sync, Zoho Books ERP, Discord Notifications"
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="wh-url" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                HTTPS Payload Destination URL
              </label>
              <input
                id="wh-url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-mono text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Subscribed Event Triggers ({selectedEvents.length} selected)
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  {selectedEvents.length === AVAILABLE_EVENTS.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 rounded-xl border border-gray-100 dark:border-gray-800">
                {AVAILABLE_EVENTS.map((ev) => {
                  const isChecked = selectedEvents.includes(ev.id)
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => toggleEvent(ev.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs border transition-colors cursor-pointer ${
                        isChecked
                          ? 'border-primary/40 bg-primary/5 text-gray-900 dark:text-white dark:bg-primary/10'
                          : 'border-gray-150 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
                      )}
                      <div className="truncate">
                        <div className="font-medium truncate">{ev.label}</div>
                        <div className="text-[10px] text-gray-400 font-mono truncate">{ev.id}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || !url.trim() || selectedEvents.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Create Webhook</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
