import React, { useState, useEffect } from 'react'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ListOrdered,
  X,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react'
import { syncQueueService } from '@/services/syncQueueService'
import { SyncQueueItem, NetworkStatus, SyncState } from '@/types'
import { cn } from '@/utils/cn'

export const OfflineStatusBar: React.FC = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(syncQueueService.getNetworkStatus())
  const [syncState, setSyncState] = useState<SyncState>(syncQueueService.getSyncState())
  const [pendingCount, setPendingCount] = useState<number>(syncQueueService.getPendingCount())
  const [failedCount, setFailedCount] = useState<number>(syncQueueService.getFailedCount())
  const [isQueueOpen, setIsQueueOpen] = useState(false)
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>(syncQueueService.getItems())

  const refreshState = () => {
    setNetworkStatus(syncQueueService.getNetworkStatus())
    setSyncState(syncQueueService.getSyncState())
    setPendingCount(syncQueueService.getPendingCount())
    setFailedCount(syncQueueService.getFailedCount())
    setQueueItems(syncQueueService.getItems())
  }

  useEffect(() => {
    const unsub = syncQueueService.subscribe(refreshState)
    return unsub
  }, [])

  const handleManualSync = async () => {
    await syncQueueService.syncNow()
    refreshState()
  }

  const handleRetryItem = async (id: string) => {
    await syncQueueService.retryItem(id)
    refreshState()
  }

  const handleClearSynced = () => {
    syncQueueService.clearSynced()
    refreshState()
  }

  const isOffline = networkStatus === 'offline'

  return (
    <>
      {/* ─── Persistent Top Notice When Offline or Syncing ─── */}
      {isOffline ? (
        <aside
          role="status"
          aria-live="polite"
          className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-md dark:bg-amber-600"
        >
          <div className="flex items-center gap-2 truncate">
            <WifiOff className="h-4 w-4 shrink-0 animate-pulse" aria-hidden="true" />
            <span className="truncate">
              <strong>Offline Mode Active:</strong> Viewing cached appointments, clients & services. Financial checkouts require a live connection.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsQueueOpen(true)}
              className="rounded-lg bg-black/20 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-black/30 transition-colors cursor-pointer"
            >
              Queue ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => syncQueueService.simulateNetworkChange('online')}
              title="Simulate Reconnecting Online (Testing Helper)"
              className="hidden sm:inline-flex rounded-lg bg-white/20 px-2 py-1 text-[10px] text-white hover:bg-white/30 cursor-pointer"
            >
              Test Online
            </button>
          </div>
        </aside>
      ) : syncState === 'syncing' ? (
        <aside
          role="status"
          aria-live="polite"
          className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            <span>Syncing {pendingCount} pending offline operation(s) with cloud database…</span>
          </div>
        </aside>
      ) : failedCount > 0 ? (
        <aside
          role="status"
          aria-live="polite"
          className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{failedCount} offline sync item(s) failed or require attention.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsQueueOpen(true)}
            className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-bold hover:bg-white/30 cursor-pointer"
          >
            Review Queue
          </button>
        </aside>
      ) : null}

      {/* ─── Sync Queue Drawer / Modal ─── */}
      {isQueueOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="queue-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsQueueOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900 z-10 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                  <ListOrdered className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="queue-modal-title" className="text-base font-bold text-gray-900 dark:text-white">
                    Offline Sync Queue
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Network: <strong className="capitalize">{networkStatus}</strong> • State: <strong className="capitalize">{syncState}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQueueOpen(false)}
                aria-label="Close sync queue modal"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Financial Safety Notice */}
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden="true" />
              <p>
                <strong>Double-Charge Guard:</strong> Financial transactions are protected by cryptographic idempotency keys. The app will never silently duplicate payment records upon network reconnect.
              </p>
            </div>

            {/* Queue Items List */}
            <div className="mt-4 space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {queueItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  Queue is clear. All actions are fully synced with the cloud database.
                </div>
              ) : (
                queueItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-xs dark:border-gray-800 dark:bg-gray-800/50"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white font-mono text-[11px]">
                          {item.action}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                            item.status === 'SYNCED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.status === 'SYNCING'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : item.status === 'FAILED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          )}
                        >
                          {item.status}
                        </span>
                        {item.isFinancial && (
                          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            Financial
                          </span>
                        )}
                      </div>

                      {item.error ? (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                          {item.error}
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-500 font-mono truncate max-w-xs">
                          {JSON.stringify(item.payload)}
                        </p>
                      )}

                      <span className="block text-[10px] text-gray-400">
                        Idempotency Key: {item.idempotencyKey.substring(0, 16)}…
                      </span>
                    </div>

                    {item.status === 'FAILED' && (
                      <button
                        type="button"
                        onClick={() => handleRetryItem(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer shrink-0"
                      >
                        <RotateCcw className="h-3 w-3" aria-hidden="true" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Queue Actions */}
            <div className="mt-5 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={handleClearSynced}
                className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
              >
                Clear Synced
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isOffline}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sync Cloud Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
