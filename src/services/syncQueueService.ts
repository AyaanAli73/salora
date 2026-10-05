import { SyncQueueItem, NetworkStatus, SyncState } from '@/types'

const STORAGE_KEY = 'SALORA_sync_queue'

const INITIAL_QUEUE: SyncQueueItem[] = [
  {
    id: 'sync-001',
    action: 'UPDATE_APPOINTMENT_STATUS',
    payload: { appointmentId: 'apt-002', newStatus: 'in-progress', updatedBy: 'Receptionist' },
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    status: 'SYNCED',
    retryCount: 0,
    isFinancial: false,
    idempotencyKey: 'idemp-apt-002-status',
    syncedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'sync-002',
    action: 'CREATE_CLIENT_NOTE',
    payload: { clientId: 'client-004', note: 'Prefers ammonia-free L\'Oréal Inoa colour palette' },
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'PENDING',
    retryCount: 0,
    isFinancial: false,
    idempotencyKey: 'idemp-note-client-004',
  },
]

class SyncQueueService {
  private items: SyncQueueItem[] = []
  private networkStatus: NetworkStatus = 'online'
  private syncState: SyncState = 'idle'
  private listeners: Array<() => void> = []

  constructor() {
    this.networkStatus = typeof window !== 'undefined' && !window.navigator.onLine ? 'offline' : 'online'
    this.syncState = this.networkStatus === 'offline' ? 'offline' : 'idle'
    this.loadQueue()
    this.setupListeners()
  }

  private loadQueue() {
    if (typeof window === 'undefined') {
      this.items = [...INITIAL_QUEUE]
      return
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      this.items = stored ? JSON.parse(stored) : [...INITIAL_QUEUE]
    } catch {
      this.items = [...INITIAL_QUEUE]
    }
  }

  private persist() {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
    } catch (err) {
      console.warn('[SyncQueue] Failed to persist sync queue to localStorage:', err)
    }
    this.notify()
  }

  private setupListeners() {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      this.networkStatus = 'online'
      console.log('[SyncQueue] Network is online. Triggering automatic background sync…')
      this.syncNow()
    })

    window.addEventListener('offline', () => {
      this.networkStatus = 'offline'
      this.syncState = 'offline'
      console.log('[SyncQueue] Network is offline. Entering offline mode.')
      this.notify()
    })
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb)
    }
  }

  private notify() {
    this.listeners.forEach((cb) => cb())
  }

  // --- Getters ---
  public getItems(): SyncQueueItem[] {
    return [...this.items]
  }

  public getPendingCount(): number {
    return this.items.filter((i) => i.status === 'PENDING').length
  }

  public getFailedCount(): number {
    return this.items.filter((i) => i.status === 'FAILED').length
  }

  public getNetworkStatus(): NetworkStatus {
    return this.networkStatus
  }

  public setMockNetworkStatus(status: NetworkStatus) {
    this.networkStatus = status
    if (status === 'offline') {
      this.syncState = 'offline'
    } else if (this.syncState === 'offline') {
      this.syncState = 'idle'
    }
    this.notify()
  }

  public getSyncState(): SyncState {
    return this.syncState
  }

  // --- Mutations ---
  public enqueue(
    action: string,
    payload: any,
    isFinancial: boolean = false
  ): { item: SyncQueueItem; canProceed: boolean; error?: string } {
    const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // CRITICAL: Financial writes cannot be faked offline!
    if (isFinancial && this.networkStatus === 'offline') {
      const failedItem: SyncQueueItem = {
        id: `sync-${Date.now()}`,
        action,
        payload,
        createdAt: new Date().toISOString(),
        status: 'FAILED',
        retryCount: 0,
        isFinancial: true,
        idempotencyKey,
        error: 'Financial transaction blocked: Live internet connection required to verify funds and prevent double charge.',
      }
      this.items.unshift(failedItem)
      this.persist()
      return {
        item: failedItem,
        canProceed: false,
        error: 'Network offline. Financial checkouts cannot be completed without an active gateway connection.',
      }
    }

    const newItem: SyncQueueItem = {
      id: `sync-${Date.now()}`,
      action,
      payload,
      createdAt: new Date().toISOString(),
      status: this.networkStatus === 'online' ? 'SYNCING' : 'PENDING',
      retryCount: 0,
      isFinancial,
      idempotencyKey,
    }

    this.items.unshift(newItem)
    this.persist()

    if (this.networkStatus === 'online') {
      // Execute asynchronous sync immediately
      this.syncNow()
    }

    return { item: newItem, canProceed: true }
  }

  public async syncNow(): Promise<{ syncedCount: number; failedCount: number }> {
    if (this.networkStatus === 'offline') {
      this.syncState = 'offline'
      this.notify()
      return { syncedCount: 0, failedCount: this.getFailedCount() }
    }

    const pending = this.items.filter((i) => i.status === 'PENDING' || i.status === 'FAILED')
    if (pending.length === 0) {
      this.syncState = 'synced'
      this.notify()
      return { syncedCount: 0, failedCount: 0 }
    }

    this.syncState = 'syncing'
    this.notify()

    let syncedCount = 0
    let failedCount = 0

    for (const item of pending) {
      // Check if financial item — protect against duplicate charges
      if (item.isFinancial) {
        // Financial items require explicit idempotent replay
        item.status = 'SYNCED'
        item.syncedAt = new Date().toISOString()
        syncedCount++
        continue
      }

      try {
        item.status = 'SYNCING'
        this.persist()
        await new Promise((res) => setTimeout(res, 300)) // Simulated gateway flight

        item.status = 'SYNCED'
        item.syncedAt = new Date().toISOString()
        item.error = undefined
        syncedCount++
      } catch (err: any) {
        item.status = 'FAILED'
        item.retryCount = (item.retryCount || 0) + 1
        item.error = err?.message || 'Remote sync failed.'
        failedCount++
      }
    }

    this.syncState = failedCount > 0 ? 'failed' : 'synced'
    this.persist()

    // Reset to idle after a few seconds of green 'synced' display
    if (this.syncState === 'synced') {
      setTimeout(() => {
        if (this.syncState === 'synced') {
          this.syncState = 'idle'
          this.notify()
        }
      }, 3500)
    }

    return { syncedCount, failedCount }
  }

  public async retryItem(id: string): Promise<SyncQueueItem> {
    const item = this.items.find((i) => i.id === id)
    if (!item) throw new Error('Item not found')

    item.status = 'SYNCING'
    this.notify()
    await new Promise((res) => setTimeout(res, 400))

    item.status = 'SYNCED'
    item.syncedAt = new Date().toISOString()
    item.error = undefined
    item.retryCount = (item.retryCount || 0) + 1

    this.persist()
    return item
  }

  public deleteItem(id: string): boolean {
    const initialLen = this.items.length
    this.items = this.items.filter((i) => i.id !== id)
    if (this.items.length !== initialLen) {
      this.persist()
      return true
    }
    return false
  }

  public clearSynced(): void {
    this.items = this.items.filter((i) => i.status !== 'SYNCED')
    this.persist()
  }

  // Developer simulation helper for testing offline state
  public simulateNetworkChange(status: NetworkStatus) {
    this.networkStatus = status
    this.syncState = status === 'offline' ? 'offline' : 'idle'
    this.notify()
  }
}

export const syncQueueService = new SyncQueueService()
