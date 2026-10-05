import React, { useState } from 'react'
import {
  Building2,
  Plus,
  MapPin,
  Users,
  ShieldCheck,
  Globe,
  Store,
} from 'lucide-react'
import { Branch } from '@/types'
import { branchService } from '@/services/branchService'
import { useBranchStore } from '@/store/useBranchStore'
import { useToastStore } from '@/store/useToastStore'
import { Button } from '@/components/ui/Button'
import { BranchListView } from '@/features/branches/BranchListView'
import { BranchModal } from '@/features/branches/BranchModal'
import { BranchDetailsViewModal } from '@/features/branches/BranchDetailsViewModal'

export const BranchAdminPage: React.FC = () => {
  const { branches, refreshBranches } = useBranchStore()
  const { addToast } = useToastStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null)

  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [branchToView, setBranchToView] = useState<Branch | null>(null)

  const handleOpenAdd = () => {
    setBranchToEdit(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (branch: Branch) => {
    setBranchToEdit(branch)
    setIsModalOpen(true)
  }

  const handleOpenView = (branch: Branch) => {
    setBranchToView(branch)
    setIsViewModalOpen(true)
  }

  const handleSaveBranch = (payload: Omit<Branch, 'id' | 'createdAt'>) => {
    if (branchToEdit) {
      branchService.updateBranch(branchToEdit.id, payload)
      addToast({
        title: 'Branch Updated',
        message: `${payload.name} configuration saved successfully.`,
        type: 'success',
      })
    } else {
      const created = branchService.createBranch(payload)
      addToast({
        title: 'New Branch Created',
        message: `${created.name} added to the Salora network.`,
        type: 'success',
      })
    }
    refreshBranches()
  }

  const handleToggleStatus = (branchId: string) => {
    const updated = branchService.toggleBranchStatus(branchId)
    if (updated) {
      addToast({
        title: 'Branch Status Updated',
        message: `${updated.name} is now ${updated.status}.`,
        type: 'info',
      })
      refreshBranches()
    }
  }

  // Network Stats
  const activeCount = branches.filter((b) => b.status === 'ACTIVE').length
  const hqBranch = branches.find((b) => b.isHeadquarters) || branches[0]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
              Multi-Branch Architecture
            </span>
            <span className="text-xs text-text-muted">Settings & Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mt-1">
            Salon Branches & Locations
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Manage operational salons, branch codes, taxation GSTINs, and local business hours across Rajasthan.
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Add New Location
        </Button>
      </div>

      {/* Network Overview Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-surface shadow-xs">
          <div className="flex items-center gap-2 text-text-muted text-xs font-semibold mb-1">
            <Store className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>Total Salons</span>
          </div>
          <p className="text-2xl font-bold text-text-primary tabular-nums">{branches.length}</p>
          <span className="text-[11px] text-text-muted">Registered in network</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-surface shadow-xs">
          <div className="flex items-center gap-2 text-text-muted text-xs font-semibold mb-1">
            <Building2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            <span>Active Salons</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{activeCount}</p>
          <span className="text-[11px] text-text-muted">Accepting bookings</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-surface shadow-xs">
          <div className="flex items-center gap-2 text-text-muted text-xs font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span>HQ Flagship</span>
          </div>
          <p className="text-sm font-bold text-text-primary truncate mt-1.5">{hqBranch?.name || 'Jodhpur'}</p>
          <span className="text-[11px] text-text-muted font-mono">{hqBranch?.code}</span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-surface shadow-xs">
          <div className="flex items-center gap-2 text-text-muted text-xs font-semibold mb-1">
            <Globe className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            <span>Network Cities</span>
          </div>
          <p className="text-2xl font-bold text-text-primary tabular-nums">4</p>
          <span className="text-[11px] text-text-muted truncate">Jodhpur, Jaipur, Bikaner, Udaipur</span>
        </div>
      </div>

      {/* Main Branch Directory */}
      <BranchListView
        branches={branches}
        onAddBranch={handleOpenAdd}
        onEditBranch={handleOpenEdit}
        onViewBranch={handleOpenView}
        onToggleStatus={handleToggleStatus}
      />

      {/* Add / Edit Branch Modal */}
      <BranchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        branchToEdit={branchToEdit}
        onSave={handleSaveBranch}
      />

      {/* View Branch Details Modal */}
      <BranchDetailsViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        branch={branchToView}
        onEdit={(b) => {
          setIsViewModalOpen(false)
          handleOpenEdit(b)
        }}
      />
    </div>
  )
}
