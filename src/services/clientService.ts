import { Client, ClientStatsSummary, ClientStatus, ClientGender, ClientNote } from '@/types'
import { firestoreService, SALORA_COLLECTIONS } from '@/services/firebase/firestoreService'
import { isFirebaseConfigured } from '@/lib/firebase'
import { where, orderBy, limit as firestoreLimit } from 'firebase/firestore'

export interface ClientFilterParams {
  search?: string
  status?: 'all' | ClientStatus | 'returning'
  gender?: string
  sortBy?: 'latest' | 'name' | 'visits' | 'spent' | 'lastVisit'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface ClientListResult {
  clients: Client[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// In-memory cache for client retrieval
let localClientsCache: Client[] = []

// Phone normalization helper for duplicate detection across spaces/country prefixes
export const normalizePhoneNumber = (phone: string): string => {
  return (phone || '').replace(/\D/g, '').slice(-10)
}

export const clientService = {
  /**
   * Synchronous cached client retrieval for fast UI comboboxes
   */
  getAllSync(): Client[] {
    return localClientsCache
  },

  getAllClients(): Client[] {
    return this.getAllSync()
  },

  /**
   * Get all salon clients
   */
  async getAll(): Promise<Client[]> {
    if (!isFirebaseConfigured) {
      return localClientsCache
    }

    try {
      const records = await firestoreService.getAll<Client>(SALORA_COLLECTIONS.CLIENTS)
      localClientsCache = records
      return records
    } catch (err) {
      console.warn('[clientService.getAll] Error loading clients:', err)
      return localClientsCache
    }
  },

  /**
   * Search client by phone number for duplicate detection
   */
  async searchByPhone(phoneNumber: string): Promise<Client | null> {
    const cleanInput = normalizePhoneNumber(phoneNumber)
    if (!cleanInput || cleanInput.length < 7) return null

    // Check memory cache first
    const memoryMatch = localClientsCache.find((c) => {
      const cleanExisting = normalizePhoneNumber(c.phone)
      return cleanExisting === cleanInput || (cleanExisting.length >= 10 && cleanExisting.endsWith(cleanInput))
    })
    if (memoryMatch) return memoryMatch

    if (!isFirebaseConfigured) return null

    try {
      const clients = await this.getAll()
      return clients.find((c) => {
        const cleanExisting = normalizePhoneNumber(c.phone)
        return cleanExisting === cleanInput || (cleanExisting.length >= 10 && cleanExisting.endsWith(cleanInput))
      }) || null
    } catch {
      return null
    }
  },

  /**
   * Get filtered client list with pagination and search
   */
  async getFiltered(params: ClientFilterParams = {}): Promise<ClientListResult> {
    const {
      search = '',
      status = 'all',
      gender = 'all',
      sortBy = 'latest',
      sortOrder = 'desc',
      page = 1,
      pageSize = 10,
    } = params

    const allClients = await this.getAll()
    let result = [...allClients]

    // 1. Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      const cleanQ = normalizePhoneNumber(q)
      result = result.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          c.phone.includes(q) ||
          (cleanQ && normalizePhoneNumber(c.phone).includes(cleanQ)) ||
          (c.tags && c.tags.some((tag) => tag.toLowerCase().includes(q)))
      )
    }

    // 2. Status filter
    if (status !== 'all') {
      if (status === 'returning') {
        result = result.filter((c) => (c.totalVisits || 0) > 1 && c.status !== 'inactive')
      } else {
        result = result.filter((c) => c.status === status)
      }
    }

    // 3. Gender filter
    if (gender !== 'all') {
      result = result.filter((c) => c.gender === gender)
    }

    // 4. Sorting
    result.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.fullName.localeCompare(b.fullName)
          break
        case 'visits':
          comparison = (a.totalVisits || 0) - (b.totalVisits || 0)
          break
        case 'spent':
          comparison = (a.totalSpent || 0) - (b.totalSpent || 0)
          break
        case 'lastVisit':
          comparison = (a.lastVisitDate || '').localeCompare(b.lastVisitDate || '')
          break
        case 'latest':
        default:
          comparison = (a.createdAt || '').localeCompare(b.createdAt || '')
          break
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })

    const total = result.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const validPage = Math.min(Math.max(1, page), totalPages)
    const startIndex = (validPage - 1) * pageSize
    const paginated = result.slice(startIndex, startIndex + pageSize)

    return {
      clients: paginated,
      total,
      page: validPage,
      pageSize,
      totalPages,
    }
  },

  /**
   * Get single client by ID
   */
  async getById(id: string): Promise<Client | null> {
    const found = localClientsCache.find((c) => c.id === id)
    if (found) return found

    if (!isFirebaseConfigured) return null

    try {
      return await firestoreService.get<Client>(SALORA_COLLECTIONS.CLIENTS, id)
    } catch (err) {
      console.error(`[clientService.getById] ${id}:`, err)
      return null
    }
  },

  /**
   * Create a new client record (persists to Cloud Firestore)
   */
  async create(data: Partial<Client>): Promise<Client> {
    const fullName = data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Guest Client'
    const nowIso = new Date().toISOString()

    const newRecord: Client = {
      id: `client_${Date.now()}`,
      firstName: data.firstName || fullName.split(' ')[0] || '',
      lastName: data.lastName || fullName.split(' ').slice(1).join(' ') || '',
      fullName,
      phone: data.phone || '',
      email: data.email || '',
      dateOfBirth: data.dateOfBirth || data.birthday,
      birthday: data.birthday || data.dateOfBirth,
      gender: (data.gender as ClientGender) || 'other',
      status: data.status || 'new',
      vip: Boolean((data as any).vip || data.isVip),
      isVip: Boolean((data as any).vip || data.isVip),
      notes: data.notes || '',
      tags: data.tags || ['New'],
      totalVisits: data.totalVisits || 0,
      totalSpent: data.totalSpent || 0,
      avatarUrl:
        data.avatarUrl ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80`,
      address: data.address || '',
      city: (data as any).city || 'Mumbai',
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    if (isFirebaseConfigured) {
      try {
        const firestoreId = await firestoreService.add(SALORA_COLLECTIONS.CLIENTS, newRecord)
        newRecord.id = firestoreId
      } catch (err) {
        console.error('[clientService.create] Firestore error:', err)
      }
    }

    // Update local cache
    localClientsCache = [newRecord, ...localClientsCache]

    // Dispatch global event for instant reactive UI updates across open tabs
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('salora:client-created', { detail: newRecord }))
    }

    return newRecord
  },

  /**
   * Update client details in Firestore
   */
  async update(id: string, updates: Partial<Client>): Promise<Client> {
    const existing = await this.getById(id)
    if (!existing) {
      throw new Error(`Client ${id} not found.`)
    }

    const updated: Client = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    if (isFirebaseConfigured) {
      try {
        await firestoreService.update(SALORA_COLLECTIONS.CLIENTS, id, updates)
      } catch (err) {
        console.error(`[clientService.update] Firestore update error on ${id}:`, err)
      }
    }

    localClientsCache = localClientsCache.map((c) => (c.id === id ? updated : c))
    return updated
  },

  /**
   * Delete or archive client
   */
  async delete(id: string): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        await firestoreService.delete(SALORA_COLLECTIONS.CLIENTS, id)
      } catch (err) {
        console.error(`[clientService.delete] ${id}:`, err)
      }
    }
    localClientsCache = localClientsCache.filter((c) => c.id !== id)
  },

  /**
   * Summary metrics for Clients page
   */
  async getStats(): Promise<ClientStatsSummary> {
    const clients = await this.getAll()
    const totalClients = clients.length
    const vipClients = clients.filter((c) => c.vip || c.isVip || c.status === 'vip').length
    const newThisMonth = clients.filter((c) => c.status === 'new').length
    const returningClients = clients.filter((c) => (c.totalVisits || 0) > 1).length
    const churnRisk = clients.filter((c) => c.status === 'inactive').length

    return {
      totalClients,
      totalClientsChange: totalClients > 0 ? '+100%' : '0%',
      totalClientsChangePositive: true,
      newClients: newThisMonth,
      newClientsChange: newThisMonth > 0 ? '+100%' : '0%',
      newClientsChangePositive: true,
      returningClients,
      returningClientsChange: returningClients > 0 ? '+100%' : '0%',
      returningClientsChangePositive: true,
      vipClients,
      vipClientsChange: vipClients > 0 ? '+100%' : '0%',
      vipClientsChangePositive: true,
      newThisMonth,
      churnRisk,
      statusDistribution: [
        { name: 'Active', value: clients.filter((c) => c.status === 'active' || !c.status).length, color: '#10B981' },
        { name: 'VIP', value: vipClients, color: '#8B5CF6' },
        { name: 'New', value: clients.filter((c) => c.status === 'new').length, color: '#3B82F6' },
        { name: 'Inactive', value: clients.filter((c) => c.status === 'inactive').length, color: '#94A3B8' },
      ],
    }
  },

  /**
   * Recent clients companion feed
   */
  async getRecentClients(limitCount = 5): Promise<Client[]> {
    const all = await this.getAll()
    return all.slice(0, limitCount)
  },

  /**
   * Add a consultation or preference note to client
   */
  async addNote(clientId: string, noteText: string, authorName = 'Front Desk'): Promise<ClientNote> {
    const note: ClientNote = {
      id: `note_${Date.now()}`,
      authorName,
      createdAt: new Date().toISOString(),
      content: noteText,
      text: noteText,
      category: 'general',
    }
    const client = await this.getById(clientId)
    if (client) {
      const updatedNotes = [note, ...(client.clientNotes || [])]
      await this.update(clientId, { clientNotes: updatedNotes })
    }
    return note
  },

  /**
   * Bulk client CSV import
   */
  async importClients(clientsToImport: Partial<Client>[]): Promise<{ imported: number; failed: number }> {
    let imported = 0
    let failed = 0
    for (const data of clientsToImport) {
      try {
        if (!data.phone && !data.fullName && !data.firstName) {
          failed++
          continue
        }
        await this.create(data)
        imported++
      } catch {
        failed++
      }
    }
    return { imported, failed }
  },

  /**
   * CSV export of clients
   */
  exportToCsv(clientsToExport?: Client[]): string {
    const list = clientsToExport || this.getAllSync()
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Total Visits', 'Total Spent', 'Status']
    const rows = list.map((c) => [c.id, c.fullName, c.phone, c.email || '', c.totalVisits, c.totalSpent, c.status])
    return [headers.join(','), ...rows.map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(','))].join('\n')
  },

  /**
   * Bulk delete clients
   */
  async bulkDelete(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id)
    }
  },

  /**
   * Bulk tag clients
   */
  async bulkAddTag(ids: string[], tag: string): Promise<void> {
    for (const id of ids) {
      const c = await this.getById(id)
      if (c && !(c.tags || []).includes(tag)) {
        await this.update(id, { tags: [...(c.tags || []), tag] })
      }
    }
  },
}
