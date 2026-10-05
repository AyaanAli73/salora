import React, { useState } from 'react'
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
  Ticket,
  FileText,
  Clock,
  Code2,
  Terminal,
} from 'lucide-react'
import { IntegrationItem } from '@/types'
import { integrationsService } from '@/services/integrationsService'

interface TestIntegrationModalProps {
  isOpen: boolean
  onClose: () => void
  integration: IntegrationItem | null
  initialMode?: 'token' | 'invoice'
  onTestComplete?: () => void
}

export const TestIntegrationModal: React.FC<TestIntegrationModalProps> = ({
  isOpen,
  onClose,
  integration,
  initialMode,
  onTestComplete,
}) => {
  const [recipient, setRecipient] = useState('+91 98290 11223')
  const [emailTo, setEmailTo] = useState('concierge@salora.in')
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm' | 'a4'>(
    initialMode === 'invoice' ? '80mm' : '58mm'
  )
  const [testType, setTestType] = useState<'token' | 'invoice'>(initialMode || 'token')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    latencyMs: number
    payload?: string
  } | null>(null)

  if (!isOpen || !integration) return null

  const handleRunTest = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const res = await integrationsService.testIntegration(integration.id, {
        testType: integration.category === 'printing' ? testType : undefined,
        paperSize,
        recipient: integration.category === 'email' ? emailTo : recipient,
      })

      setResult({
        success: res.success,
        message: res.message,
        latencyMs: res.latencyMs,
        payload: JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            integration: integration.name,
            provider: integration.provider,
            category: integration.category,
            status: res.success ? '200 OK' : '500 ERROR',
            latency: `${res.latencyMs}ms`,
            response: res.message,
          },
          null,
          2
        ),
      })
      if (onTestComplete) onTestComplete()
    } catch (err: any) {
      setResult({
        success: false,
        message: err?.message || 'Execution error encountered.',
        latencyMs: 120,
        payload: JSON.stringify({ error: err?.message }, null, 2),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="test-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900 z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
              <Play className="h-5 w-5 fill-current" aria-hidden="true" />
            </div>
            <div>
              <h2 id="test-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
                Live Test: {integration.name}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Execute interactive payload verification and inspect real-time response latency.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close test modal"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Input Parameters based on category */}
        <div className="mt-5 space-y-4">
          {/* Printing: Token vs Invoice & Paper Size */}
          {integration.category === 'printing' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Select Print Job Simulation Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTestType('token')
                      setPaperSize('58mm')
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-medium border transition-colors cursor-pointer ${
                      testType === 'token'
                        ? 'border-primary bg-primary/5 text-primary dark:bg-primary/10'
                        : 'border-gray-200 dark:border-gray-800 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Ticket className="h-4 w-4" aria-hidden="true" />
                    <span>58mm Queue Token</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTestType('invoice')
                      setPaperSize('80mm')
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-medium border transition-colors cursor-pointer ${
                      testType === 'invoice'
                        ? 'border-primary bg-primary/5 text-primary dark:bg-primary/10'
                        : 'border-gray-200 dark:border-gray-800 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    <span>Tax Invoice Receipt</span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="test-paper-size" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Paper Form Factor
                </label>
                <select
                  id="test-paper-size"
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as any)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="58mm">58mm (Thermal Receipt Roll)</option>
                  <option value="80mm">80mm (Standard POS Thermal)</option>
                  <option value="a4">A4 (Laser / Full Sheet Document)</option>
                </select>
              </div>
            </div>
          )}

          {/* WhatsApp: Recipient */}
          {integration.category === 'whatsapp' && (
            <div>
              <label htmlFor="wa-test-num" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Recipient WhatsApp Mobile (with country code)
              </label>
              <input
                id="wa-test-num"
                type="tel"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="+91 98290 11223"
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Will dispatch an approved template message ping via Meta Cloud API.
              </p>
            </div>
          )}

          {/* Email: Recipient */}
          {integration.category === 'email' && (
            <div>
              <label htmlFor="email-test-to" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Test Destination Email Address
              </label>
              <input
                id="email-test-to"
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="manager@salora.in"
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Queues a DKIM & SPF authenticated diagnostic test envelope.
              </p>
            </div>
          )}

          {/* SMS: Recipient */}
          {integration.category === 'sms' && (
            <div>
              <label htmlFor="sms-test-to" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Mobile Number for Transactional Test OTP
              </label>
              <input
                id="sms-test-to"
                type="tel"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="+91 98290 11223"
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}

          {/* Diagnostic Action Button */}
          <button
            type="button"
            onClick={handleRunTest}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Executing Diagnostic Dispatch…</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Execute Diagnostic Test</span>
              </>
            )}
          </button>
        </div>

        {/* Live Execution Output Inspector */}
        {result && (
          <div className="mt-5 space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    200 Success
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    Failed
                  </span>
                )}
                <span className="text-xs text-gray-500 font-medium">
                  Response latency: <strong className="text-gray-700 dark:text-gray-300" style={{ fontVariantNumeric: 'tabular-nums' }}>{result.latencyMs}ms</strong>
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-gray-900 p-3.5 text-xs text-gray-200 dark:bg-black border border-gray-800 font-mono">
              <div className="flex items-center gap-1.5 text-gray-400 text-[10px] uppercase font-semibold mb-2">
                <Terminal className="h-3 w-3" aria-hidden="true" />
                <span>Response Payload Inspector</span>
              </div>
              <pre className="overflow-x-auto text-[11px] leading-relaxed text-emerald-400 dark:text-emerald-300">
                {result.payload}
              </pre>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
