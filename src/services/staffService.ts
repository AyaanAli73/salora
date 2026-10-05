import { Staff, StaffStatus, StaffStatsSummary } from '@/types'
import { firestoreService, SALORA_COLLECTIONS } from './firebase/firestoreService'
import { isFirebaseConfigured } from '@/lib/firebase'

let localStaffData: Staff[] = []

export const staffService = {
  getAllSync(_branchFilter?: string): Staff[] {
    return [...localStaffData]
  },

  getAllStaff(_branchFilter?: string): Staff[] {
    return this.getAllSync(_branchFilter)
  },

  async getAll(_branchFilter?: string): Promise<Staff[]> {
    if (isFirebaseConfigured) {
      try {
        const firestoreList = await firestoreService.getAll<Staff>(SALORA_COLLECTIONS.STAFF)
        localStaffData = firestoreList
        return firestoreList
      } catch (err) {
        console.warn('[StaffService] Failed to load staff from Firestore:', err)
      }
    }
    return [...localStaffData]
  },

  async getById(id: string): Promise<Staff | undefined> {
    if (isFirebaseConfigured) {
      try {
        const doc = await firestoreService.get<Staff>(SALORA_COLLECTIONS.STAFF, id)
        if (doc) return doc
      } catch (err) {
        console.warn(`[StaffService] Failed to get staff #${id}:`, err)
      }
    }
    return localStaffData.find((s) => s.id === id)
  },

  async updateStatus(id: string, status: StaffStatus): Promise<Staff> {
    const todayStatus: Staff['todayStatus'] =
      status === 'on-leave'
        ? 'on-leave'
        : status === 'off-duty'
        ? 'off-duty'
        : status === 'busy'
        ? 'busy'
        : 'available'

    const updates: Partial<Staff> = { status, todayStatus }

    if (isFirebaseConfigured) {
      try {
        await firestoreService.update<Staff>(SALORA_COLLECTIONS.STAFF, id, updates)
      } catch (err) {
        console.warn(`[StaffService] Failed to update status in Firestore for #${id}:`, err)
      }
    }

    const index = localStaffData.findIndex((s) => s.id === id)
    if (index !== -1) {
      localStaffData[index] = { ...localStaffData[index], ...updates }
      return localStaffData[index]
    }

    const updated = (await this.getById(id)) || ({ id, ...updates } as Staff)
    return updated
  },

  async create(
    newStaff: Omit<Staff, 'id' | 'monthlyRevenue' | 'appointmentsCompleted' | 'rating' | 'reviewCount'>
  ): Promise<Staff> {
    const staffId = `staff-${Date.now()}`
    const staff: Staff = {
      ...newStaff,
      id: staffId,
      rating: 5.0,
      reviewCount: 0,
      monthlyRevenue: 0,
      appointmentsCompleted: 0,
      todayStatus:
        newStaff.status === 'on-leave'
          ? 'on-leave'
          : newStaff.status === 'off-duty'
          ? 'off-duty'
          : 'available',
      appointmentsToday: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (isFirebaseConfigured) {
      try {
        await firestoreService.set<Staff>(SALORA_COLLECTIONS.STAFF, staffId, staff)
      } catch (err) {
        console.warn('[StaffService] Failed to save staff to Firestore:', err)
      }
    }

    localStaffData.unshift(staff)
    return staff
  },

  async update(id: string, updates: Partial<Staff>): Promise<Staff> {
    if (isFirebaseConfigured) {
      try {
        await firestoreService.update<Staff>(SALORA_COLLECTIONS.STAFF, id, {
          ...updates,
          updatedAt: new Date().toISOString(),
        })
      } catch (err) {
        console.warn(`[StaffService] Failed to update staff #${id} in Firestore:`, err)
      }
    }

    const index = localStaffData.findIndex((s) => s.id === id)
    if (index !== -1) {
      localStaffData[index] = { ...localStaffData[index], ...updates, updatedAt: new Date().toISOString() }
      return localStaffData[index]
    }

    const updated = (await this.getById(id)) || ({ id, ...updates } as Staff)
    return updated
  },

  async delete(id: string): Promise<boolean> {
    if (isFirebaseConfigured) {
      try {
        await firestoreService.delete(SALORA_COLLECTIONS.STAFF, id)
      } catch (err) {
        console.warn(`[StaffService] Failed to delete staff #${id}:`, err)
      }
    }
    localStaffData = localStaffData.filter((s) => s.id !== id)
    return true
  },

  async getStatsSummary(): Promise<StaffStatsSummary> {
    const list = await this.getAll()
    const totalStaff = list.length
    const workingToday = list.filter(
      (s) =>
        s.todayStatus !== 'on-leave' &&
        s.todayStatus !== 'off-duty' &&
        s.status !== 'on-leave' &&
        s.status !== 'inactive'
    ).length
    const onLeave = list.filter(
      (s) => s.todayStatus === 'on-leave' || s.status === 'on-leave'
    ).length

    const topPerformerMember =
      [...list].sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating
        return b.monthlyRevenue - a.monthlyRevenue
      })[0]

    return {
      totalStaff,
      workingToday,
      onLeave,
      topPerformer: {
        id: topPerformerMember?.id || '',
        name: topPerformerMember?.name || 'No staff yet',
        rating: topPerformerMember?.rating || 5.0,
        monthlyRevenue: topPerformerMember?.monthlyRevenue || 0,
        role: topPerformerMember?.role || 'Staff Member',
        avatarUrl: topPerformerMember?.avatarUrl,
      },
    }
  },
}
