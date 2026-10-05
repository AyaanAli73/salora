import React, { useState } from 'react'
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  User,
  Power,
  Edit,
  Eye,
  CheckCircle2,
  LayoutGrid,
  List,
  Sparkles,
  Shield,
  ArrowRight,
} from 'lucide-react'
import { Branch, BranchStatus } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useBranchStore } from '@/store/useBranchStore'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

interface BranchListViewProps {
  branches: Branch[]
  onAddBranch: () => void
  onEditBranch: (branch: Branch) => void
  onViewBranch: (branch: Branch) => void
  onToggleStatus: (branchId: string) => void
}

export const BranchListView: React.FC<BranchListViewProps> = ({
  branches,
  onAddBranch,
  onEditBranch,
  onViewBranch,
  onToggleStatus,
}) => {
  const { currentBranchId, switchBranch } = useBranchStore()
  const { addToast } = useToastStore()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase()) ||
      b.managerName?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'ALL' ? true : b.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleQuickSwitch = (branch: Branch) => {
    switchBranch(branch.id)
    addToast({
      title: 'Active Workspace Changed',
      message: `Now operating in ${branch.name}.`,
      type: 'info',
    })
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-surface shadow-xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search branches by name, city, code, manager…"
              className="pl-9 h-10 text-xs"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-surface-subtle border border-border rounded-xl">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded-lg transition-colors focus-visible:outline-none',
                  statusFilter === s
                    ? 'bg-surface text-primary shadow-xs font-bold'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                {s === 'ALL' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center p-1 bg-surface-subtle border border-border rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={cn(
                'p-1.5 rounded-lg text-text-muted transition-colors',
                viewMode === 'grid' && 'bg-surface text-primary shadow-xs'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              className={cn(
                'p-1.5 rounded-lg text-text-muted transition-colors',
                viewMode === 'table' && 'bg-surface text-primary shadow-xs'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button variant="primary" size="sm" onClick={onAddBranch} leftIcon={<Plus className="w-4 h-4" />}>
            Add Branch
          </Button>
        </div>
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredBranches.map((b) => {
            const isActiveWorkspace = currentBranchId === b.id

            return (
              <div
                key={b.id}
                className={cn(
                  'group relative rounded-3xl border border-border bg-surface p-5 shadow-xs transition-all duration-200 hover:shadow-md flex flex-col justify-between',
                  isActiveWorkspace && 'border-primary ring-2 ring-primary/20 bg-gradient-to-b from-primary/5 via-surface to-surface'
                )}
              >
                <div>
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105',
                          isActiveWorkspace
                            ? 'bg-primary text-white shadow-xs'
                            : 'bg-surface-subtle text-primary border border-border'
                        )}
                      >
                        <Building2 className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                            {b.name}
                          </h3>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-subtle text-text-muted border border-border">
                            {b.code}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-text-muted" aria-hidden="true" />
                          <span>
                            {b.city}, {b.state}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={b.status === 'ACTIVE' ? 'success' : 'default'} size="sm">
                        {b.status}
                      </Badge>
                      {b.isHeadquarters && (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          HQ Flagship
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Address & Contact summary */}
                  <div className="space-y-1.5 text-xs text-text-secondary py-3 border-y border-border/80 my-3">
                    <p className="text-[11px] text-text-muted line-clamp-1">{b.address}</p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-text-muted" />
                      <span>{b.phone}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-text-muted" />
                      <span className="truncate">{b.email}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-text-muted">
                      <User className="w-3 h-3 text-text-muted" />
                      <span>Manager: {b.managerName || 'Assigned Supervisor'}</span>
                    </p>
                  </div>

                  {/* GSTIN & Sequence */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-text-muted mb-4">
                    <span>GST: {b.taxInfo?.gstin || 'Unregistered'}</span>
                    <span>Prefix: {b.invoicePrefix || `INV-${b.code}`}</span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onViewBranch(b)} title="View Details">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEditBranch(b)} title="Edit Configuration">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleStatus(b.id)}
                      title={b.status === 'ACTIVE' ? 'Deactivate Branch' : 'Activate Branch'}
                      className={cn(b.status === 'ACTIVE' ? 'text-text-muted hover:text-danger' : 'text-emerald-600')}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {isActiveWorkspace ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-primary bg-primary/10 border border-primary/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active Salon
                    </span>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleQuickSwitch(b)} rightIcon={<ArrowRight className="w-3 h-3" />}>
                      Switch To
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-3xl border border-border bg-surface shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-border text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Branch Location</th>
                  <th className="py-3.5 px-4">City / State</th>
                  <th className="py-3.5 px-4">Manager</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">GSTIN & Prefix</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBranches.map((b) => {
                  const isActiveWorkspace = currentBranchId === b.id

                  return (
                    <tr key={b.id} className={cn('hover:bg-surface-subtle/50 transition-colors', isActiveWorkspace && 'bg-primary/5')}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-surface-subtle border border-border flex items-center justify-center font-bold text-primary">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-text-primary block">{b.name}</span>
                            <span className="font-mono text-[10px] text-text-muted">{b.code}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-text-secondary">
                        {b.city}, {b.state}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        {b.managerName || 'Assigned Supervisor'}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary font-mono">{b.phone}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-text-muted">
                        <div>{b.taxInfo?.gstin || 'N/A'}</div>
                        <div className="text-[10px]">{b.invoicePrefix || `INV-${b.code}`}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={b.status === 'ACTIVE' ? 'success' : 'default'} size="sm">
                          {b.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => onViewBranch(b)} title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => onEditBranch(b)} title="Edit">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleStatus(b.id)}
                            className={cn(b.status === 'ACTIVE' ? 'text-text-muted hover:text-danger' : 'text-emerald-600')}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </Button>
                          {!isActiveWorkspace && (
                            <Button variant="outline" size="sm" onClick={() => handleQuickSwitch(b)}>
                              Switch
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
