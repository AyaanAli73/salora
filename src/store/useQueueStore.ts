import { create } from 'zustand'
import { Token, TokenPriority, TokenStatus, QueueStats, Appointment } from '@/types'
import { tokenService } from '@/services/tokenService'
import { appointmentService } from '@/services/appointmentService'
import { notificationService } from '@/services/notificationService'
import { sortQueueTokens } from '@/utils/queueUtils'

interface QueueFilters {
  search: string
  staffId: string
  status: string
  priority: string
}

interface CallingAnnouncement {
  token: Token
  timestamp: number
}

interface QueueStoreState {
  tokens: Token[]
  queue: Token[] // Active queue (WAITING, CALLED, IN_SERVICE, HOLD)
  currentToken: Token | null // Most recently called / active token
  callingAnnouncement: CallingAnnouncement | null
  stats: QueueStats
  isLoading: boolean
  error: string | null
  filters: QueueFilters

  // Filter setters
  setFilters: (filters: Partial<QueueFilters>) => void
  resetFilters: () => void

  // Actions
  loadTokens: () => Promise<void>
  checkInAppointment: (appointment: Appointment, priority?: TokenPriority) => Promise<Token>
  createWalkIn: (params: {
    clientName: string
    clientPhone?: string
    isNewClient?: boolean
    serviceId: string
    serviceName: string
    serviceDuration: number
    servicePrice: number
    staffId: string
    staffName: string
    staffAvatar?: string
    priority: TokenPriority
    notes?: string
  }) => Promise<Token>
  callToken: (tokenId: string) => Promise<Token>
  recallToken: (tokenId: string) => Promise<Token>
  startService: (tokenId: string) => Promise<Token>
  completeToken: (tokenId: string) => Promise<Token>
  holdToken: (tokenId: string) => Promise<Token>
  resumeToken: (tokenId: string) => Promise<Token>
  skipToken: (tokenId: string) => Promise<Token>
  cancelToken: (tokenId: string) => Promise<Token>
  transferToken: (tokenId: string, staffId: string, staffName: string, staffAvatar?: string) => Promise<Token>
  dismissCallingAnnouncement: () => void
  resetDailyTokens: () => Promise<void>
}

const initialFilters: QueueFilters = {
  search: '',
  staffId: 'all',
  status: 'all',
  priority: 'all',
}

export const useQueueStore = create<QueueStoreState>((set, get) => ({
  tokens: [],
  queue: [],
  currentToken: null,
  callingAnnouncement: null,
  stats: { waiting: 0, called: 0, inService: 0, completed: 0, averageWaitMinutes: 15 },
  isLoading: false,
  error: null,
  filters: initialFilters,

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }))
  },

  resetFilters: () => {
    set({ filters: initialFilters })
  },

  dismissCallingAnnouncement: () => {
    set({ callingAnnouncement: null })
  },

  loadTokens: async () => {
    set({ isLoading: true, error: null })
    try {
      const allTokens = await tokenService.getAll()
      const stats = await tokenService.getQueueStats()

      // Active queue = WAITING, CALLED, IN_SERVICE, HOLD
      const activeQueue = sortQueueTokens(
        allTokens.filter(
          (t) =>
            t.status === 'WAITING' ||
            t.status === 'CALLED' ||
            t.status === 'IN_SERVICE' ||
            t.status === 'HOLD'
        )
      )

      // Find current active serving token
      const current =
        allTokens.find((t) => t.status === 'IN_SERVICE') ||
        allTokens.find((t) => t.status === 'CALLED') ||
        null

      set({
        tokens: allTokens,
        queue: activeQueue,
        currentToken: current,
        stats,
        isLoading: false,
      })
    } catch (err: any) {
      set({ error: err.message || 'Failed to load queue tokens', isLoading: false })
    }
  },

  /**
   * Checks in a scheduled appointment customer:
   * 1. Generates sequential token
   * 2. Sets appointment status = 'checked-in'
   * 3. Sets queue status = 'waiting'
   */
  checkInAppointment: async (appointment: Appointment, priority: TokenPriority = 'NORMAL') => {
    set({ isLoading: true })
    try {
      const token = await tokenService.generateToken({
        appointmentId: appointment.id,
        appointmentType: appointment.appointmentType || 'APPOINTMENT',
        clientId: appointment.clientId,
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        clientAvatar: appointment.clientAvatar,
        isVip: appointment.priority === 'VIP' || priority === 'VIP',
        serviceId: appointment.serviceId,
        serviceName: appointment.serviceName,
        serviceDuration: appointment.duration || appointment.serviceDuration || 45,
        servicePrice: appointment.price || appointment.servicePrice || 120,
        staffId: appointment.staffId,
        staffName: appointment.staffName,
        staffAvatar: appointment.staffAvatar,
        priority: priority || appointment.priority || 'NORMAL',
        notes: appointment.notes,
        date: appointment.date,
      })

      // Update appointment status in appointmentService
      await appointmentService.update(appointment.id, {
        status: 'checked-in',
        tokenNumber: token.displayNumber,
        tokenId: token.id,
        queueStatus: 'waiting',
      })

      // Refresh store queue
      await get().loadTokens()
      return token
    } finally {
      set({ isLoading: false })
    }
  },

  /**
   * Fast Walk-in Customer creation:
   * 1. Creates an appointment with appointmentType = "WALK_IN"
   * 2. Generates sequential token
   * 3. Adds directly to queue as WAITING
   */
  createWalkIn: async (params) => {
    set({ isLoading: true })
    try {
      const now = new Date()
      const startH = now.getHours()
      const startM = Math.floor(now.getMinutes() / 15) * 15
      const startTime = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`
      const totalEndMins = startH * 60 + startM + (params.serviceDuration || 45)
      const endH = Math.floor(totalEndMins / 60) % 24
      const endM = totalEndMins % 60
      const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
      const dateStr = now.toISOString().split('T')[0]

      // Create appointment record
      const appt = await appointmentService.create({
        appointmentType: 'WALK_IN',
        clientId: `cli-walkin-${Date.now()}`,
        clientName: params.clientName,
        clientPhone: params.clientPhone || '(Walk-in)',
        serviceId: params.serviceId,
        serviceName: params.serviceName,
        serviceDuration: params.serviceDuration,
        duration: params.serviceDuration,
        servicePrice: params.servicePrice,
        price: params.servicePrice,
        tax: Math.round(params.servicePrice * 0.18 * 10) / 10,
        totalAmount: Math.round(params.servicePrice * 1.18 * 10) / 10,
        staffId: params.staffId,
        staffName: params.staffName,
        staffAvatar: params.staffAvatar,
        date: dateStr,
        startTime,
        endTime,
        status: 'checked-in',
        paymentStatus: 'unpaid',
        queueStatus: 'waiting',
        priority: params.priority,
        notes: params.notes,
      })

      // Generate token
      const token = await tokenService.generateToken({
        appointmentId: appt.id,
        appointmentType: 'WALK_IN',
        clientId: appt.clientId,
        clientName: params.clientName,
        clientPhone: params.clientPhone,
        serviceId: params.serviceId,
        serviceName: params.serviceName,
        serviceDuration: params.serviceDuration,
        servicePrice: params.servicePrice,
        staffId: params.staffId,
        staffName: params.staffName,
        staffAvatar: params.staffAvatar,
        priority: params.priority,
        notes: params.notes,
        date: dateStr,
      })

      // Sync appointment with token number
      await appointmentService.update(appt.id, {
        tokenNumber: token.displayNumber,
        tokenId: token.id,
      })

      await get().loadTokens()
      return token
    } finally {
      set({ isLoading: false })
    }
  },

  /**
   * Receptionist CALLS customer to station/chair
   */
  callToken: async (tokenId: string) => {
    const updated = await tokenService.updateStatus(tokenId, 'CALLED')

    // Update appointment status to 'called'
    if (updated.appointmentId) {
      await appointmentService.update(updated.appointmentId, {
        status: 'called',
        queueStatus: 'called',
      })
    }

    // Play chime sound
    notificationService.playTokenCall()

    // Show temporary announcement
    set({
      callingAnnouncement: { token: updated, timestamp: Date.now() },
      currentToken: updated,
    })

    await get().loadTokens()
    return updated
  },

  /**
   * Re-announces/calls customer
   */
  recallToken: async (tokenId: string) => {
    const token = await tokenService.getById(tokenId)
    if (!token) throw new Error('Token not found')

    notificationService.playTokenCall()
    set({
      callingAnnouncement: { token, timestamp: Date.now() },
      currentToken: token,
    })
    return token
  },

  /**
   * Starts service: CALLED -> IN_SERVICE
   */
  startService: async (tokenId: string) => {
    const updated = await tokenService.updateStatus(tokenId, 'IN_SERVICE')

    if (updated.appointmentId) {
      await appointmentService.update(updated.appointmentId, {
        status: 'in-progress',
        queueStatus: 'in_chair',
      })
    }

    set({ currentToken: updated })
    await get().loadTokens()
    return updated
  },

  /**
   * Completes service: IN_SERVICE -> COMPLETED
   */
  completeToken: async (tokenId: string) => {
    const updated = await tokenService.updateStatus(tokenId, 'COMPLETED')

    if (updated.appointmentId) {
      await appointmentService.update(updated.appointmentId, {
        status: 'completed',
        queueStatus: 'completed',
      })
    }

    notificationService.playSuccess()
    await get().loadTokens()
    return updated
  },

  /**
   * Holds token (client stepped out / hair color processing)
   */
  holdToken: async (tokenId: string) => {
    const updated = await tokenService.updateStatus(tokenId, 'HOLD')

    if (updated.appointmentId) {
      await appointmentService.update(updated.appointmentId, {
        queueStatus: 'hold',
      })
    }

    await get().loadTokens()
    return updated
  },

  /**
   * Resumes held token back to WAITING
   */
  resumeToken: async (tokenId: string) => {
    const updated = await tokenService.updateStatus(tokenId, 'WAITING')

    if (updated.appointmentId) {
      await appointmentService.update(updated.appointmentId, {
        status: 'checked-in',
        queueStatus: 'waiting',
      })
    }

    await get().loadTokens()
    return updated
  },

  /**
   * Skips absent token
   */
  skipToken: async (tokenId: string) => {
    const updated = await tokenService.updateStatus(tokenId, 'SKIPPED')

    if (updated.appointmentId) {
      await appointmentService.update(updated.appointmentId, {
        queueStatus: 'skipped',
      })
    }

    await get().loadTokens()
    return updated
  },

  /**
   * Cancels token
   */
  cancelToken: async (tokenId: string) => {
    const updated = await tokenService.updateStatus(tokenId, 'CANCELLED')

    if (updated.appointmentId) {
      await appointmentService.update(updated.appointmentId, {
        status: 'cancelled',
        queueStatus: 'skipped',
      })
    }

    await get().loadTokens()
    return updated
  },

  /**
   * Transfers token to a different specialist
   */
  transferToken: async (tokenId: string, staffId: string, staffName: string, staffAvatar?: string) => {
    const updated = await tokenService.transferStaff(tokenId, staffId, staffName, staffAvatar)

    if (updated.appointmentId) {
      await appointmentService.update(updated.appointmentId, {
        staffId,
        staffName,
        staffAvatar,
      })
    }

    await get().loadTokens()
    return updated
  },

  /**
   * Resets daily sequence for the day
   */
  resetDailyTokens: async () => {
    tokenService.resetDailyTokens()
    await get().loadTokens()
  },
}))
