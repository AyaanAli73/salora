import { create } from 'zustand'
import { Branch } from '@/types'
import { branchService } from '@/services/branchService'

const CURRENT_BRANCH_KEY = 'SALORA_current_branch_id'

interface BranchStoreState {
  branches: Branch[]
  currentBranchId: string // 'all' or branch id
  currentBranch: Branch | null
  isAllBranches: boolean
  refreshBranches: () => void
  switchBranch: (branchId: string) => void
  getAccessibleBranches: (role?: string, userBranchIds?: string[]) => Branch[]
  canAccessBranch: (targetBranchId: string, role?: string, userBranchIds?: string[]) => boolean
}

const getStoredBranchId = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CURRENT_BRANCH_KEY)
      if (stored) return stored
    } catch {
      // fallback
    }
  }
  return 'branch-jodhpur'
}

export const useBranchStore = create<BranchStoreState>((set, get) => {
  const initialBranches = branchService.getAllBranches()
  const initialBranchId = getStoredBranchId()
  const initialBranch = initialBranches.find((b) => b.id === initialBranchId) || initialBranches[0] || null

  return {
    branches: initialBranches,
    currentBranchId: initialBranchId,
    currentBranch: initialBranchId === 'all' ? null : initialBranch,
    isAllBranches: initialBranchId === 'all',

    refreshBranches: () => {
      const updated = branchService.getAllBranches()
      const currId = get().currentBranchId
      const currBranch = currId === 'all' ? null : updated.find((b) => b.id === currId) || null
      set({ branches: updated, currentBranch: currBranch })
    },

    switchBranch: (branchId: string) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(CURRENT_BRANCH_KEY, branchId)
        } catch {
          // ignore
        }
      }

      if (branchId === 'all') {
        set({
          currentBranchId: 'all',
          currentBranch: null,
          isAllBranches: true,
        })
      } else {
        const found = get().branches.find((b) => b.id === branchId) || null
        set({
          currentBranchId: branchId,
          currentBranch: found,
          isAllBranches: false,
        })
      }
    },

    getAccessibleBranches: (role = 'owner', userBranchIds = []) => {
      const allActive = get().branches.filter((b) => b.status === 'ACTIVE')
      // Owner or Admin can access all branches
      if (role === 'owner' || role === 'admin') {
        return allActive
      }
      // If user has specific branch assignments
      if (userBranchIds && userBranchIds.length > 0) {
        return allActive.filter((b) => userBranchIds.includes(b.id))
      }
      // Fallback: primary flagship branch
      return allActive.filter((b) => b.isHeadquarters || b.id === 'branch-jodhpur')
    },

    canAccessBranch: (targetBranchId: string, role = 'owner', userBranchIds = []) => {
      if (role === 'owner' || role === 'admin') return true
      if (targetBranchId === 'all') return role === 'owner' || role === 'admin'
      if (userBranchIds && userBranchIds.length > 0) {
        return userBranchIds.includes(targetBranchId)
      }
      return targetBranchId === 'branch-jodhpur'
    },
  }
})
