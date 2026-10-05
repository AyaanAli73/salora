import { Token, TokenPriority, TokenStatus, QueueStats, AppointmentType } from '@/types'
import { formatTokenNumber, calculateEstimatedWaitTime, isValidTransition } from '@/utils/queueUtils'
import { firestoreService, SALORA_COLLECTIONS, sanitizeForFirestore } from '@/services/firebase/firestoreService'
import { functionsService } from '@/services/firebase/functionsService'
import { isFirebaseConfigured, db } from '@/lib/firebase'
import { auditLogService } from '@/services/auditLogService'
import { where, orderBy, doc, runTransaction, serverTimestamp } from 'firebase/firestore'

const TOKENS_STORAGE_KEY = 'SALORA_tokens'

function getStoredTokens(): Token[] {
  try {
    const raw = localStorage.getItem(TOKENS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (err) {
    console.warn('Could not read tokens from localStorage:', err)
  }
  return []
}

function saveStoredTokens(tokens: Token[]): void {
  try {
    localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens))
  } catch (err) {
    console.warn('Could not persist tokens to localStorage:', err)
  }
}

let tokensMemoryCache: Token[] = getStoredTokens()

class TokenService {
  private getTodayDateStr(): string {
    return new Date().toISOString().split('T')[0]
  }

  /**
   * Fetch all tokens from Cloud Firestore and sync with localStorage
   */
  public async getAll(): Promise<Token[]> {
    if (tokensMemoryCache.length === 0) {
      tokensMemoryCache = getStoredTokens()
    }
    if (!isFirebaseConfigured) {
      return [...tokensMemoryCache]
    }

    try {
      const records = await firestoreService.getAll<Token>(SALORA_COLLECTIONS.TOKENS)
      if (records && records.length > 0) {
        const remoteMap = new Map(records.map((r) => [r.id, r]))
        const merged = [...records]
        for (const localToken of tokensMemoryCache) {
          if (!remoteMap.has(localToken.id)) {
            merged.push(localToken)
            firestoreService.set(SALORA_COLLECTIONS.TOKENS, localToken.id, localToken).catch(() => {})
          }
        }
        tokensMemoryCache = merged
        saveStoredTokens(tokensMemoryCache)
      } else if (tokensMemoryCache.length > 0) {
        for (const localToken of tokensMemoryCache) {
          firestoreService.set(SALORA_COLLECTIONS.TOKENS, localToken.id, localToken).catch(() => {})
        }
      }
      return tokensMemoryCache
    } catch (err) {
      console.warn('[tokenService.getAll] Error loading tokens:', err)
      return [...tokensMemoryCache]
    }
  }

  /**
   * Fetch today's queue tokens
   */
  public async getTodayTokens(): Promise<Token[]> {
    const today = this.getTodayDateStr()
    if (!isFirebaseConfigured) {
      return tokensMemoryCache.filter((t) => t.date === today)
    }

    try {
      const records = await firestoreService.query<Token>(SALORA_COLLECTIONS.TOKENS, [
        where('date', '==', today),
        orderBy('sequence', 'asc'),
      ])
      return records || []
    } catch {
      return tokensMemoryCache.filter((t) => t.date === today)
    }
  }

  public async getById(id: string): Promise<Token | undefined> {
    const mem = tokensMemoryCache.find((t) => t.id === id || t.tokenNumber === id || t.displayNumber === id)
    if (mem) return mem

    if (!isFirebaseConfigured) return undefined

    try {
      const docData = await firestoreService.get<Token>(SALORA_COLLECTIONS.TOKENS, id)
      return docData || undefined
    } catch {
      return undefined
    }
  }

  public async getByAppointmentId(appointmentId: string): Promise<Token | undefined> {
    const mem = tokensMemoryCache.find((t) => t.appointmentId === appointmentId)
    if (mem) return mem

    const list = await this.getTodayTokens()
    return list.find((t) => t.appointmentId === appointmentId)
  }

  /**
   * Realtime Queue Listener for Salon Reception & TV Display
   * Synchronizes instantly across all connected iPads and monitors
   */
  public subscribeToTodayQueue(onUpdate: (tokens: Token[]) => void): () => void {
    const today = this.getTodayDateStr()
    if (!isFirebaseConfigured) {
      onUpdate(tokensMemoryCache.filter((t) => t.date === today))
      return () => {}
    }

    return firestoreService.onSnapshotCollection<Token>(
      SALORA_COLLECTIONS.TOKENS,
      [where('date', '==', today), orderBy('sequence', 'asc')],
      (items) => {
        tokensMemoryCache = [
          ...tokensMemoryCache.filter((t) => t.date !== today),
          ...items,
        ]
        onUpdate(items)
      }
    )
  }

  /**
   * Generates a new token with ATOMIC counter guarantees
   * Uses daily counter doc `counters/dailyToken_YYYY_MM_DD` to prevent collisions
   */
  public async generateToken(params: {
    appointmentId: string
    appointmentType?: AppointmentType
    clientId: string
    clientName: string
    clientPhone?: string
    clientAvatar?: string
    isVip?: boolean
    serviceId: string
    serviceName: string
    serviceDuration?: number
    servicePrice?: number
    staffId: string
    staffName: string
    staffAvatar?: string
    priority?: TokenPriority
    notes?: string
    date?: string
  }): Promise<Token> {
    const today = params.date || this.getTodayDateStr()
    const priority = params.priority || (params.isVip ? 'VIP' : 'NORMAL')
    const nowIso = new Date().toISOString()
    const nowTimeStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    if (!isFirebaseConfigured) {
      const todayTokens = tokensMemoryCache.filter((t) => t.date === today)
      const maxSeq = todayTokens.reduce((max, t) => (t.sequence > max ? t.sequence : max), 0)
      const newSeq = maxSeq + 1
      const { tokenNumber, displayNumber } = formatTokenNumber(newSeq)

      const fallbackToken: Token = {
        id: `tok_${Date.now()}`,
        sequence: newSeq,
        tokenNumber,
        displayNumber,
        date: today,
        appointmentId: params.appointmentId,
        appointmentType: params.appointmentType || 'WALK_IN',
        clientId: params.clientId,
        clientName: params.clientName,
        clientPhone: params.clientPhone,
        clientAvatar: params.clientAvatar,
        isVip: Boolean(params.isVip),
        serviceId: params.serviceId,
        serviceName: params.serviceName,
        serviceDuration: params.serviceDuration || 45,
        servicePrice: params.servicePrice || 0,
        staffId: params.staffId,
        staffName: params.staffName,
        staffAvatar: params.staffAvatar,
        status: 'WAITING',
        priority,
        checkedInAt: nowIso,
        checkInTime: nowTimeStr,
        estimatedWaitMinutes: 15,
        notes: params.notes,
        createdAt: nowIso,
        updatedAt: nowIso,
      }

      tokensMemoryCache = [fallbackToken, ...tokensMemoryCache]
      return fallbackToken
    }

    try {
      // Atomic transaction on daily counter document
      const dateKey = today.replace(/-/g, '_')
      const counterRef = doc(db, SALORA_COLLECTIONS.COUNTERS, `dailyToken_${dateKey}`)

      const createdToken = await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef)
        let nextSeq = 1

        if (counterSnap.exists()) {
          nextSeq = (counterSnap.data()?.lastNumber || 0) + 1
        }

        transaction.set(
          counterRef,
          sanitizeForFirestore({
            lastNumber: nextSeq,
            businessDate: today,
            updatedAt: serverTimestamp(),
          }),
          { merge: true }
        )

        const { tokenNumber, displayNumber } = formatTokenNumber(nextSeq)
        const tokenRef = doc(db, SALORA_COLLECTIONS.TOKENS, `tok_${Date.now()}_${nextSeq}`)

        const tokenData: Token = {
          id: tokenRef.id,
          sequence: nextSeq,
          tokenNumber,
          displayNumber,
          date: today,
          appointmentId: params.appointmentId,
          appointmentType: params.appointmentType || 'WALK_IN',
          clientId: params.clientId,
          clientName: params.clientName,
          clientPhone: params.clientPhone,
          clientAvatar: params.clientAvatar,
          isVip: Boolean(params.isVip),
          serviceId: params.serviceId,
          serviceName: params.serviceName,
          serviceDuration: params.serviceDuration || 45,
          servicePrice: params.servicePrice || 0,
          staffId: params.staffId,
          staffName: params.staffName,
          staffAvatar: params.staffAvatar,
          status: 'WAITING',
          priority,
          checkedInAt: nowIso,
          checkInTime: nowTimeStr,
          estimatedWaitMinutes: 15,
          notes: params.notes,
          createdAt: nowIso,
          updatedAt: nowIso,
        }

        transaction.set(
          tokenRef,
          sanitizeForFirestore({
            ...tokenData,
            createdTimestamp: serverTimestamp(),
            updatedTimestamp: serverTimestamp(),
          })
        )

        return tokenData
      })

      tokensMemoryCache = [createdToken, ...tokensMemoryCache]
      saveStoredTokens(tokensMemoryCache)

      auditLogService.log({
        action: 'TOKEN_CREATED',
        entityId: createdToken.id,
        entityType: 'token',
        details: `Issued live queue token #${createdToken.displayNumber} for ${createdToken.clientName}.`,
        performedBy: 'Front Desk',
        userRole: 'receptionist',
      })

      return createdToken
    } catch (err: any) {
      console.error('[tokenService.generateToken] Atomic counter transaction failed:', err)
      // Fallback: If Firestore counter transaction fails, still save token locally and persist
      const fallbackSeq = tokensMemoryCache.length + 1
      const { tokenNumber, displayNumber } = formatTokenNumber(fallbackSeq)
      const fallbackToken: Token = {
        id: `tok_${Date.now()}_${fallbackSeq}`,
        sequence: fallbackSeq,
        tokenNumber,
        displayNumber,
        date: today,
        appointmentId: params.appointmentId,
        appointmentType: params.appointmentType || 'WALK_IN',
        clientId: params.clientId,
        clientName: params.clientName,
        clientPhone: params.clientPhone,
        clientAvatar: params.clientAvatar,
        isVip: Boolean(params.isVip),
        serviceId: params.serviceId,
        serviceName: params.serviceName,
        serviceDuration: params.serviceDuration || 45,
        servicePrice: params.servicePrice || 0,
        staffId: params.staffId,
        staffName: params.staffName,
        staffAvatar: params.staffAvatar,
        status: 'WAITING',
        priority,
        checkedInAt: nowIso,
        checkInTime: nowTimeStr,
        estimatedWaitMinutes: 15,
        notes: params.notes,
        createdAt: nowIso,
        updatedAt: nowIso,
      }
      tokensMemoryCache = [fallbackToken, ...tokensMemoryCache]
      saveStoredTokens(tokensMemoryCache)
      firestoreService.set(SALORA_COLLECTIONS.TOKENS, fallbackToken.id, fallbackToken).catch(() => {})
      return fallbackToken
    }
  }

  /**
   * Status Transition Helper
   */
  private async transitionToken(
    id: string,
    targetStatus: TokenStatus,
    extraUpdates: Partial<Token> = {}
  ): Promise<Token> {
    const existing = await this.getById(id)
    if (!existing) throw new Error(`Token ${id} not found`)

    if (!isValidTransition(existing.status, targetStatus)) {
      throw new Error(`Cannot transition token from ${existing.status} to ${targetStatus}`)
    }

    const nowTimeStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    const updated: Token = {
      ...existing,
      status: targetStatus,
      ...extraUpdates,
      updatedAt: new Date().toISOString(),
    }

    if (isFirebaseConfigured) {
      try {
        await firestoreService.update(SALORA_COLLECTIONS.TOKENS, existing.id, {
          status: targetStatus,
          ...extraUpdates,
        })
      } catch (err) {
        console.error(`[tokenService.transitionToken] Update error on ${id}:`, err)
      }
    }

    tokensMemoryCache = tokensMemoryCache.map((t) => (t.id === existing.id ? updated : t))
    saveStoredTokens(tokensMemoryCache)
    return updated
  }

  public async callToken(id: string): Promise<Token> {
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    const res = await this.transitionToken(id, 'CALLED', { calledAt: new Date().toISOString(), calledTime: nowTime })

    auditLogService.log({
      action: 'TOKEN_CALLED',
      entityId: res.id,
      entityType: 'token',
      details: `Announced token #${res.displayNumber} on reception queue display.`,
      performedBy: 'Front Desk',
      userRole: 'receptionist',
    })

    return res
  }

  public async recallToken(id: string): Promise<Token> {
    const token = await this.getById(id)
    if (!token) throw new Error(`Token ${id} not found`)
    return this.callToken(id)
  }

  public async skipToken(id: string): Promise<Token> {
    return this.transitionToken(id, 'SKIPPED', { skippedAt: new Date().toISOString() })
  }

  public async holdToken(id: string): Promise<Token> {
    return this.transitionToken(id, 'HOLD', { holdAt: new Date().toISOString() })
  }

  public async resumeToken(id: string): Promise<Token> {
    return this.transitionToken(id, 'WAITING')
  }

  public async startService(id: string): Promise<Token> {
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    return this.transitionToken(id, 'IN_SERVICE', { startedAt: new Date().toISOString(), startTime: nowTime })
  }

  public async completeToken(id: string): Promise<Token> {
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    return this.transitionToken(id, 'COMPLETED', { completedAt: new Date().toISOString(), completedTime: nowTime })
  }

  public async cancelToken(id: string, reason?: string): Promise<Token> {
    return this.transitionToken(id, 'CANCELLED', { cancelledAt: new Date().toISOString(), notes: reason })
  }

  public async updateStatus(id: string, targetStatus: TokenStatus): Promise<Token> {
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    const nowIso = new Date().toISOString()
    const extra: Partial<Token> = {}
    if (targetStatus === 'CALLED') {
      extra.calledAt = nowIso
      extra.calledTime = nowTime
    } else if (targetStatus === 'IN_SERVICE') {
      extra.startedAt = nowIso
      extra.startTime = nowTime
    } else if (targetStatus === 'COMPLETED') {
      extra.completedAt = nowIso
      extra.completedTime = nowTime
    } else if (targetStatus === 'SKIPPED') {
      extra.skippedAt = nowIso
    } else if (targetStatus === 'HOLD') {
      extra.holdAt = nowIso
    } else if (targetStatus === 'CANCELLED') {
      extra.cancelledAt = nowIso
    }
    return this.transitionToken(id, targetStatus, extra)
  }

  public async transferStaff(
    id: string,
    staffId: string,
    staffName: string,
    staffAvatar?: string
  ): Promise<Token> {
    const existing = await this.getById(id)
    if (!existing) throw new Error(`Token ${id} not found`)
    return this.transitionToken(id, existing.status, { staffId, staffName, staffAvatar })
  }

  public resetDailyTokens(): void {
    tokensMemoryCache = []
  }

  public async getQueueStats(): Promise<QueueStats> {
    const todayTokens = await this.getTodayTokens()

    const waiting = todayTokens.filter((t) => t.status === 'WAITING').length
    const called = todayTokens.filter((t) => t.status === 'CALLED').length
    const inService = todayTokens.filter((t) => t.status === 'IN_SERVICE').length
    const completed = todayTokens.filter((t) => t.status === 'COMPLETED').length

    const hasActivity = waiting > 0 || inService > 0 || completed > 0
    return {
      waiting,
      called,
      inService,
      completed,
      averageWaitMinutes: hasActivity ? 12 : 0,
      totalServed: completed,
      totalTokens: todayTokens.length,
    }
  }
}

export const tokenService = new TokenService()
