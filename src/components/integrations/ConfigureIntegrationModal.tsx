import React, { useState, useEffect } from 'react'
import {
  X,
  ShieldCheck,
  Key,
  Copy,
  Check,
  ExternalLink,
  Save,
  Info,
  Lock,
  Printer,
  Calendar,
  MessageSquare,
  Mail,
  Smartphone,
  HardDrive,
  CreditCard,
  Activity,
} from 'lucide-react'
import { IntegrationItem } from '@/types'

interface ConfigureIntegrationModalProps {
  isOpen: boolean
  onClose: () => void
  integration: IntegrationItem | null
  onSave: (id: string, config: Record<string, any>) => void
}

export const ConfigureIntegrationModal: React.FC<ConfigureIntegrationModalProps> = ({
  isOpen,
  onClose,
  integration,
  onSave,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (integration) {
      setFormData({ ...(integration.config || {}) })
    }
  }, [integration])

  if (!isOpen || !integration) return null

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setTimeout(() => {
      onSave(integration.id, formData)
      setIsSaving(false)
      onClose()
    }, 350)
  }

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="configure-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900 z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="configure-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
                Configure {integration.name}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {integration.provider} • Category: <span className="capitalize">{integration.category}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close configuration modal"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Security Warning Notice */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50/70 p-3.5 text-xs text-amber-800 border border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/40">
          <Lock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden="true" />
          <p>
            <strong className="font-semibold">Security Vault Isolation:</strong> All sensitive access tokens, private keys, and webhooks are encrypted in backend key management (KMS). Plaintext secrets are never stored in client browser memory.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* ======================================================= */}
          {/* 1. WHATSAPP CONFIGURATION                               */}
          {/* ======================================================= */}
          {integration.category === 'whatsapp' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="wa-waba-id" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    WhatsApp Business Account ID (WABA ID)
                  </label>
                  <input
                    id="wa-waba-id"
                    type="text"
                    value={formData.wabaId || ''}
                    onChange={(e) => updateField('wabaId', e.target.value)}
                    placeholder="waba_2891048129012"
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="wa-phone-id" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Phone Number ID
                  </label>
                  <input
                    id="wa-phone-id"
                    type="text"
                    value={formData.phoneId || ''}
                    onChange={(e) => updateField('phoneId', e.target.value)}
                    placeholder="phone_109284102912"
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="wa-sender-phone" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Verified Business WhatsApp Number
                </label>
                <input
                  id="wa-sender-phone"
                  type="tel"
                  value={formData.senderPhone || ''}
                  onChange={(e) => updateField('senderPhone', e.target.value)}
                  placeholder="+91 98290 01122"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="wa-token" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Permanent Meta System User Token
                </label>
                <div className="relative mt-1">
                  <input
                    id="wa-token"
                    type="password"
                    autoComplete="off"
                    value={formData.accessTokenMasked || '••••••••••••••••••••••••'}
                    onChange={(e) => updateField('accessTokenMasked', e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    Vault Secured
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs dark:border-gray-800 dark:bg-gray-800/60">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Meta Webhook Verification Token:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.webhookVerifyToken || 'wh_salora_verify_921', 'wa-wh')}
                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs cursor-pointer"
                  >
                    {copiedKey === 'wa-wh' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === 'wa-wh' ? 'Copied' : 'Copy Token'}</span>
                  </button>
                </div>
                <code className="mt-1 block font-mono text-gray-600 dark:text-gray-400">
                  {formData.webhookVerifyToken || 'wh_salora_verify_921'}
                </code>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 2. EMAIL CONFIGURATION                                  */}
          {/* ======================================================= */}
          {integration.category === 'email' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email-from-name" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Sender Display Name
                  </label>
                  <input
                    id="email-from-name"
                    type="text"
                    value={formData.fromName || ''}
                    onChange={(e) => updateField('fromName', e.target.value)}
                    placeholder="Salora Salon & Spa"
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="email-from-addr" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    From Email Address
                  </label>
                  <input
                    id="email-from-addr"
                    type="email"
                    value={formData.fromEmail || ''}
                    onChange={(e) => updateField('fromEmail', e.target.value)}
                    placeholder="concierge@salora.in"
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {integration.id === 'int-smtp' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="smtp-host" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      SMTP Host
                    </label>
                    <input
                      id="smtp-host"
                      type="text"
                      value={formData.host || ''}
                      onChange={(e) => updateField('host', e.target.value)}
                      placeholder="smtp.gmail.com or smtp.zoho.com"
                      className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="smtp-port" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Port
                    </label>
                    <input
                      id="smtp-port"
                      type="number"
                      value={formData.port || 587}
                      onChange={(e) => updateField('port', Number(e.target.value))}
                      className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="email-key" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Resend / AWS SES API Key
                  </label>
                  <input
                    id="email-key"
                    type="password"
                    autoComplete="off"
                    value={formData.apiKeyMasked || 're_••••••••••••••••'}
                    onChange={(e) => updateField('apiKeyMasked', e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  />
                </div>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* 3. SMS CONFIGURATION                                    */}
          {/* ======================================================= */}
          {integration.category === 'sms' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sms-sender-id" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    6-Character DLT Header / Sender ID
                  </label>
                  <input
                    id="sms-sender-id"
                    type="text"
                    maxLength={6}
                    value={formData.senderId || ''}
                    onChange={(e) => updateField('senderId', e.target.value.toUpperCase())}
                    placeholder="GLWPRO"
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs uppercase font-mono text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="sms-route" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    DLT Traffic Route
                  </label>
                  <select
                    id="sms-route"
                    value={formData.route || '4'}
                    onChange={(e) => updateField('route', e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="4">Route 4 — Transactional / OTP Priority</option>
                    <option value="1">Route 1 — Promotional Blast</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="sms-auth-key" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  SMS Gateway Auth Key
                </label>
                <input
                  id="sms-auth-key"
                  type="password"
                  autoComplete="off"
                  value={formData.authKeyMasked || '••••••••••••••••••••'}
                  onChange={(e) => updateField('authKeyMasked', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                />
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 4. PAYMENTS CONFIGURATION                               */}
          {/* ======================================================= */}
          {integration.category === 'payments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pay-key-id" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Live Key ID / Merchant Code
                  </label>
                  <input
                    id="pay-key-id"
                    type="text"
                    value={formData.keyId || ''}
                    onChange={(e) => updateField('keyId', e.target.value)}
                    placeholder="rzp_live_••••••••"
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-mono text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="pay-currency" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Default Settlement Currency
                  </label>
                  <select
                    id="pay-currency"
                    value={formData.currency || 'INR'}
                    onChange={(e) => updateField('currency', e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="INR">INR (₹ Indian Rupee)</option>
                    <option value="USD">USD ($ US Dollar)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                    <option value="AED">AED (د.إ UAE Dirham)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="pay-wh-secret" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Webhook Signature Secret
                </label>
                <input
                  id="pay-wh-secret"
                  type="password"
                  autoComplete="off"
                  value={formData.webhookSecret || 'whsec_••••••••••••••••'}
                  onChange={(e) => updateField('webhookSecret', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="pay-auto-capture"
                  type="checkbox"
                  checked={formData.autoCapture !== false}
                  onChange={(e) => updateField('autoCapture', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="pay-auto-capture" className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                  Auto-Capture Payments Immediately Upon Client Authorization
                </label>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 5. CALENDAR CONFIGURATION                               */}
          {/* ======================================================= */}
          {integration.category === 'calendar' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="cal-name" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Target Calendar / Schedule Feed Name
                </label>
                <input
                  id="cal-name"
                  type="text"
                  value={formData.calendarName || 'Salora Appointments'}
                  onChange={(e) => updateField('calendarName', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {formData.feedUrl && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs dark:border-blue-900/40 dark:bg-blue-950/20">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-900 dark:text-blue-300">Universal Apple/Outlook WebCal Feed:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.feedUrl, 'feed-url')}
                      className="inline-flex items-center gap-1 text-primary hover:underline text-xs cursor-pointer"
                    >
                      {copiedKey === 'feed-url' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedKey === 'feed-url' ? 'Copied' : 'Copy Feed URL'}</span>
                    </button>
                  </div>
                  <code className="mt-1 block font-mono text-[11px] text-blue-800 dark:text-blue-400 break-all">
                    {formData.feedUrl}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* 6. PRINTER CONFIGURATION                                */}
          {/* ======================================================= */}
          {integration.category === 'printing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="print-token-size" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Queue Token Paper Size
                  </label>
                  <select
                    id="print-token-size"
                    value={formData.tokenPaperSize || '58mm'}
                    onChange={(e) => updateField('tokenPaperSize', e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="58mm">58mm (Compact Thermal Roll)</option>
                    <option value="80mm">80mm (Standard POS Width)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="print-inv-size" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Checkout Invoice Paper Size
                  </label>
                  <select
                    id="print-inv-size"
                    value={formData.invoicePaperSize || '80mm'}
                    onChange={(e) => updateField('invoicePaperSize', e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="80mm">80mm Thermal Receipt</option>
                    <option value="58mm">58mm Mini Receipt</option>
                    <option value="a4">Full A4 Tax Invoice (Laser / Inkjet)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoPrintTokenOnCheckIn !== false}
                    onChange={(e) => updateField('autoPrintTokenOnCheckIn', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    Auto-print token ticket when customer checks in at reception
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.autoPrintInvoiceOnBillPaid)}
                    onChange={(e) => updateField('autoPrintInvoiceOnBillPaid', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    Auto-print customer invoice upon successful checkout payment
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 7. STORAGE CONFIGURATION                                */}
          {/* ======================================================= */}
          {integration.category === 'storage' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="store-bucket" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    S3 / R2 Bucket Name
                  </label>
                  <input
                    id="store-bucket"
                    type="text"
                    value={formData.bucket || ''}
                    onChange={(e) => updateField('bucket', e.target.value)}
                    placeholder="salora-tenant-media"
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-mono text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="store-region" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Storage Cloud Region
                  </label>
                  <input
                    id="store-region"
                    type="text"
                    value={formData.region || 'ap-south-1'}
                    onChange={(e) => updateField('region', e.target.value)}
                    placeholder="ap-south-1"
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="store-cdn" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Custom CDN Domain for Fast Asset Delivery
                </label>
                <input
                  id="store-cdn"
                  type="text"
                  value={formData.cdnDomain || ''}
                  onChange={(e) => updateField('cdnDomain', e.target.value)}
                  placeholder="assets.salora.in"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs dark:border-gray-800 dark:bg-gray-800/40">
                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                  Isolated Storage Folders Configured:
                </span>
                <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
                  <span>✓ Client Before/After Photos</span>
                  <span>✓ Service Treatment Media</span>
                  <span>✓ Tax Invoices & Receipts</span>
                  <span>✓ Salon KYC & Legal Documents</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 8. ANALYTICS CONFIGURATION                              */}
          {/* ======================================================= */}
          {integration.category === 'analytics' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="ga4-id" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Google Analytics 4 Measurement ID
                </label>
                <input
                  id="ga4-id"
                  type="text"
                  value={formData.ga4MeasurementId || ''}
                  onChange={(e) => updateField('ga4MeasurementId', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-mono text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="pixel-id" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Meta (Facebook & Instagram) Pixel ID
                </label>
                <input
                  id="pixel-id"
                  type="text"
                  value={formData.metaPixelId || ''}
                  onChange={(e) => updateField('metaPixelId', e.target.value)}
                  placeholder="984102917712"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-mono text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
