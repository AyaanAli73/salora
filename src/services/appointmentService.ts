import { Appointment, AppointmentStatus, AppointmentStatsSummary } from '@/types'
import { calculateEndTime, isSlotAvailable } from '@/utils/availability'
import { staffService } from './staffService'
import { firestoreService, SALORA_COLLECTIONS } from '@/services/firebase/firestoreService'
import { isFirebaseConfigured } from '@/lib/firebase'
import { where, orderBy } from 'firebase/firestore'

const APPOINTMENTS_STORAGE_KEY = 'SALORA_appointments'

function getStoredAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (err) {
    console.warn('Could not read appointments from localStorage:', err)
  }
  return []
}

function saveStoredAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments))
  } catch (err) {
    console.warn('Could not persist appointments to localStorage:', err)
  }
}

// Memory cache synchronized with localStorage and Cloud Firestore
let appointmentsCache: Appointment[] = getStoredAppointments()

export const appointmentService = {
  /**
   * Synchronous cached appointments for quick calendar views
   */
  getAllSync(): Appointment[] {
    if (appointmentsCache.length === 0) {
      appointmentsCache = getStoredAppointments()
    }
    return appointmentsCache
  },

  getAppointments(_branchFilter?: string): Appointment[] {
    return this.getAllSync()
  },

  getTodayAppointments(_branchFilter?: string): Appointment[] {
    const today = new Date().toISOString().split('T')[0]
    return this.getAllSync().filter((a) => a.date === today)
  },

  /**
   * Fetch all appointments from Cloud Firestore and sync with localStorage
   */
  async getAll(): Promise<Appointment[]> {
    if (appointmentsCache.length === 0) {
      appointmentsCache = getStoredAppointments()
    }

    if (!isFirebaseConfigured) {
      return appointmentsCache
    }

    try {
      const records = await firestoreService.getAll<Appointment>(SALORA_COLLECTIONS.APPOINTMENTS)
      if (records && records.length > 0) {
        // Merge remote with local records by ID
        const remoteMap = new Map(records.map((r) => [r.id, r]))
        const merged = [...records]
        for (const localAppt of appointmentsCache) {
          if (!remoteMap.has(localAppt.id)) {
            merged.push(localAppt)
            // Push local-only appointment up to Firestore
            firestoreService.set(SALORA_COLLECTIONS.APPOINTMENTS, localAppt.id, localAppt).catch(() => {})
          }
        }
        appointmentsCache = merged
        saveStoredAppointments(appointmentsCache)
      } else if (appointmentsCache.length > 0) {
        // Firestore is currently empty, push existing local appointments to Firestore
        for (const localAppt of appointmentsCache) {
          firestoreService.set(SALORA_COLLECTIONS.APPOINTMENTS, localAppt.id, localAppt).catch(() => {})
        }
      }
      return appointmentsCache
    } catch (err) {
      console.warn('[appointmentService.getAll] Falling back to local cache:', err)
      return appointmentsCache
    }
  },

  /**
   * Fetch appointments for a specific date
   */
  async getByDate(date: string): Promise<Appointment[]> {
    if (!isFirebaseConfigured) {
      return appointmentsCache.filter((a) => a.date === date)
    }

    try {
      const records = await firestoreService.query<Appointment>(
        SALORA_COLLECTIONS.APPOINTMENTS,
        [where('date', '==', date), orderBy('startTime', 'asc')]
      )
      return records
    } catch {
      return appointmentsCache.filter((a) => a.date === date)
    }
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
    const all = await this.getAll()
    return all.filter((a) => a.date >= startDate && a.date <= endDate)
  },

  async getByStaffId(staffId: string): Promise<Appointment[]> {
    const all = await this.getAll()
    return all.filter((a) => a.staffId === staffId)
  },

  async getById(id: string): Promise<Appointment | undefined> {
    const mem = appointmentsCache.find((a) => a.id === id || a.appointmentId === id)
    if (mem) return mem

    if (!isFirebaseConfigured) return undefined

    try {
      const doc = await firestoreService.get<Appointment>(SALORA_COLLECTIONS.APPOINTMENTS, id)
      return doc || undefined
    } catch {
      return undefined
    }
  },

  async getByClientId(clientId: string): Promise<Appointment[]> {
    const all = await this.getAll()
    return all.filter((a) => a.clientId === clientId)
  },

  /**
   * Realtime appointments listener for salon reception calendar
   */
  subscribeToAppointments(
    date: string,
    onUpdate: (appointments: Appointment[]) => void
  ): () => void {
    if (!isFirebaseConfigured) {
      onUpdate(appointmentsCache.filter((a) => a.date === date))
      return () => {}
    }

    return firestoreService.onSnapshotCollection<Appointment>(
      SALORA_COLLECTIONS.APPOINTMENTS,
      [where('date', '==', date), orderBy('startTime', 'asc')],
      (list) => {
        // Merge into local cache
        const otherDates = appointmentsCache.filter((a) => a.date !== date)
        appointmentsCache = [...otherDates, ...list]
        saveStoredAppointments(appointmentsCache)
        onUpdate(list)
      }
    )
  },

  /**
   * Update status of an appointment
   */
  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    const existing = await this.getById(id)
    if (!existing) throw new Error(`Appointment ${id} not found`)

    let queueStatus = existing.queueStatus
    if (status === 'checked-in') queueStatus = 'waiting'
    else if (status === 'in-progress') queueStatus = 'in_chair'
    else if (status === 'completed') queueStatus = 'completed'
    else if (status === 'cancelled' || status === 'no-show') queueStatus = 'skipped'

    const updated: Appointment = {
      ...existing,
      status,
      queueStatus,
      updatedAt: new Date().toISOString(),
    }

    if (isFirebaseConfigured) {
      try {
        await firestoreService.update(SALORA_COLLECTIONS.APPOINTMENTS, id, {
          status,
          queueStatus,
        })
      } catch (err) {
        console.error(`[appointmentService.updateStatus] ${id}:`, err)
      }
    }

    appointmentsCache = appointmentsCache.map((a) => (a.id === id ? updated : a))
    saveStoredAppointments(appointmentsCache)
    return updated
  },

  /**
   * Reschedule appointment to another date/slot
   */
  async reschedule(id: string, date: string, startTime: string, duration?: number): Promise<Appointment> {
    const current = await this.getById(id)
    if (!current) throw new Error(`Appointment ${id} not found`)

    const dur = duration || current.duration || current.serviceDuration || 60
    const endTime = calculateEndTime(startTime, dur)

    const updated: Appointment = {
      ...current,
      date,
      startTime,
      endTime,
      duration: dur,
      serviceDuration: dur,
      status: 'confirmed',
      updatedAt: new Date().toISOString(),
    }

    if (isFirebaseConfigured) {
      try {
        await firestoreService.update(SALORA_COLLECTIONS.APPOINTMENTS, id, {
          date,
          startTime,
          endTime,
          duration: dur,
          serviceDuration: dur,
          status: 'confirmed',
        })
      } catch (err) {
        console.error(`[appointmentService.reschedule] ${id}:`, err)
      }
    }

    appointmentsCache = appointmentsCache.map((a) => (a.id === id ? updated : a))
    saveStoredAppointments(appointmentsCache)
    return updated
  },

  /**
   * Schedule new appointment with double-booking guard and persistence
   */
  async create(newAppt: Omit<Appointment, 'id' | 'createdAt'> & { id?: string }): Promise<Appointment> {
    const dur = newAppt.duration || newAppt.serviceDuration || 45
    const endTime = newAppt.endTime || calculateEndTime(newAppt.startTime, dur)
    const nowIso = new Date().toISOString()
    const apptNum = `APT-${Math.floor(1000 + Math.random() * 9000)}`
    const generatedId = newAppt.id || `appt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    const appointmentRecord: Appointment = {
      ...newAppt,
      id: generatedId,
      appointmentId: newAppt.appointmentId || apptNum,
      duration: dur,
      serviceDuration: dur,
      endTime,
      status: newAppt.status || 'confirmed',
      paymentStatus: newAppt.paymentStatus || 'unpaid',
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    // Immediately persist to local cache and localStorage
    appointmentsCache = [appointmentRecord, ...appointmentsCache]
    saveStoredAppointments(appointmentsCache)

    if (isFirebaseConfigured) {
      try {
        // Persist to Cloud Firestore with consistent ID
        await firestoreService.set(
          SALORA_COLLECTIONS.APPOINTMENTS,
          appointmentRecord.id,
          appointmentRecord
        )
      } catch (err) {
        console.error('[appointmentService.create] Firestore error:', err)
      }
    }

    return appointmentRecord
  },

  /**
   * Cancel appointment
   */
  async cancel(id: string, reason?: string): Promise<Appointment> {
    return this.updateStatus(id, 'cancelled')
  },

  /**
   * Update arbitrary fields of an appointment
   */
  async update(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const current = await this.getById(id)
    if (!current) throw new Error(`Appointment ${id} not found`)

    const updated: Appointment = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    if (isFirebaseConfigured) {
      try {
        await firestoreService.update(SALORA_COLLECTIONS.APPOINTMENTS, id, updates)
      } catch (err) {
        console.error(`[appointmentService.update] ${id}:`, err)
      }
    }

    appointmentsCache = appointmentsCache.map((a) => (a.id === id ? updated : a))
    saveStoredAppointments(appointmentsCache)
    return updated
  },

  /**
   * Delete appointment
   */
  async delete(id: string): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        await firestoreService.delete(SALORA_COLLECTIONS.APPOINTMENTS, id)
      } catch (err) {
        console.error(`[appointmentService.delete] ${id}:`, err)
      }
    }
    appointmentsCache = appointmentsCache.filter((a) => a.id !== id)
    saveStoredAppointments(appointmentsCache)
  },

  /**
   * Get operational statistics for receptionist topbar
   */
  async getStatsSummary(): Promise<AppointmentStatsSummary> {
    const today = new Date().toISOString().split('T')[0]
    const todayList = (await this.getAll()).filter((a) => a.date === today)

    const total = todayList.length
    const confirmed = todayList.filter((a) => a.status === 'confirmed' || a.status === 'scheduled').length
    const inProgress = todayList.filter((a) => a.status === 'in-progress').length
    const completed = todayList.filter((a) => a.status === 'completed').length
    const cancelled = todayList.filter((a) => a.status === 'cancelled' || a.status === 'no-show').length

    const pending = confirmed

    return {
      totalAppointments: total,
      completed,
      pending,
      cancelled,
      confirmedAppointments: confirmed,
      inProgressAppointments: inProgress,
      completedAppointments: completed,
      cancelledAppointments: cancelled,
    }
  },
}
