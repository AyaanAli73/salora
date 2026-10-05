import React, { useState } from 'react'
import {
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Code2,
  X,
  FileCode,
  Terminal,
  Activity,
} from 'lucide-react'
import { IntegrationLog } from '@/types'
import { integrationsService } from '@/services/integrationsService'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

interface IntegrationLogsViewProps {
  logs: IntegrationLog[]
  onRefresh: () => void
}

export const IntegrationLogsView: React.FC<IntegrationLogsViewProps> = ({ logs, onRefresh }) => {
  const { addToast } = useToastStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL')
  const [selectedLog, setSelectedLog] = useState<IntegrationLog | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.integrationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.error && log.error.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.responsePayload && log.responsePayload.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleRetry = async (logId: string) => {
    setRetryingId(logId)
    try {
      const updatedLog = await integrationsService.retryLog(logId)
      onRefresh()
      if (updatedLog.status === 'SUCCESS') {
        addToast({
          title: 'Operation Retried Successfully',
          message: `${updatedLog.integrationName}: ${updatedLog.event} succeeded.`,
          type: 'success',
        })
      } else {
        addToast({
          title: 'Retry Failed',
          message: updatedLog.error || 'Retry attempt failed.',
          type: 'danger',
        })
      }
    } catch (err: any) {
      addToast({
        title: 'Retry Error',
        message: err?.message || 'Operation failed.',
        type: 'danger',
      })
    } finally {
      setRetryingId(null)
    }
  }

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso)
      return new Intl.DateTimeFormat('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(date)
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by event, payload, or error message…"
              className="block w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
            {(['ALL', 'SUCCESS', 'FAILED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                  statusFilter === st
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                )}
              >
                {st === 'ALL' ? 'All Logs' : st === 'SUCCESS' ? 'Successes' : 'Failures'}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Semantic Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">Integration execution and audit logs</caption>
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/75 dark:border-gray-800 dark:bg-gray-800/40 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th scope="col" className="px-4 py-3">Timestamp</th>
                <th scope="col" className="px-4 py-3">Integration</th>
                <th scope="col" className="px-4 py-3">Event / Operation</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Response / Error</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No integration logs matching the current criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS'
                  return (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      {/* Timestamp */}
                      <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatTimestamp(log.timestamp)}
                      </td>

                      {/* Integration */}
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {log.integrationName}
                      </td>

                      {/* Event */}
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-mono text-[11px] max-w-xs truncate" title={log.event}>
                        {log.event}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            {log.statusCode || 200} OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
                            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                            {log.statusCode || 500} Error
                          </span>
                        )}
                      </td>

                      {/* Response / Error */}
                      <td className="px-4 py-3 max-w-xs truncate text-gray-500 dark:text-gray-400">
                        {log.error ? (
                          <span className="text-rose-600 dark:text-rose-400 font-medium truncate block">
                            {log.error}
                          </span>
                        ) : (
                          <span className="truncate block font-mono text-[11px]">
                            {log.responsePayload || '—'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            aria-label={`View payload for log ${log.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                          >
                            <FileCode className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
                            <span>Payload</span>
                          </button>

                          {log.isRetryable && log.status === 'FAILED' && (
                            <button
                              type="button"
                              onClick={() => handleRetry(log.id)}
                              disabled={retryingId === log.id}
                              aria-label={`Retry failed operation for log ${log.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <RotateCcw className={cn('h-3.5 w-3.5', retryingId === log.id && 'animate-spin')} aria-hidden="true" />
                              <span>{retryingId === log.id ? 'Retrying…' : 'Retry'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payload Inspection Modal */}
      {selectedLog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="payload-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedLog(null)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900 z-10 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <h2 id="payload-modal-title" className="text-base font-bold text-gray-900 dark:text-white">
                    Execution Payload Inspector
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedLog.integrationName} • {formatTimestamp(selectedLog.timestamp)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                aria-label="Close payload modal"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  API Endpoint / Event Call
                </span>
                <code className="block rounded-lg bg-gray-100 dark:bg-gray-800 p-2 font-mono text-xs text-gray-800 dark:text-gray-200">
                  {selectedLog.event}
                </code>
              </div>

              {selectedLog.error && (
                <div>
                  <span className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">
                    Error Diagnostic Message
                  </span>
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                    {selectedLog.error}
                  </div>
                </div>
              )}

              <div>
                <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Response Payload JSON
                </span>
                <pre className="max-h-64 overflow-x-auto rounded-xl bg-gray-900 p-3.5 font-mono text-xs text-emerald-400 dark:bg-black leading-relaxed">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.responsePayload || '{}'), null, 2)
                    } catch {
                      return selectedLog.responsePayload || 'No payload recorded'
                    }
                  })()}
                </pre>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
