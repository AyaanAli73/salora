import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Hash,
  Search,
  Filter,
  Printer,
  XCircle,
  Eye,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Scissors,
  Calendar,
  Layers,
  Star,
  Flame,
  ArrowRight,
  Settings,
  Plus,
  Receipt,
} from 'lucide-react'
import { Token, TokenPriority, TokenStatus } from '@/types'
import { useQueueStore } from '@/store/useQueueStore'
import { useToastStore } from '@/store/useToastStore'
import { printService } from '@/services/printService'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Staff } from '@/types'
import { staffService } from '@/services/staffService'
import {
  TokenPrintTemplate,
  PrinterSettingsModal,
  FastWalkInDrawer,
} from '@/features/queue'

export const TokenHistoryPage: React.FC = () => {
  const { tokens, loadTokens, cancelToken } = useQueueStore()
  const { addToast } = useToastStore()

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStaff, setSelectedStaff] = useState('all')
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Modals & Drawers state
  const [viewingToken, setViewingToken] = useState<Token | null>(null)
  const [reprintToken, setReprintToken] = useState<Token | null>(null)
  const [cancellingToken, setCancellingToken] = useState<Token | null>(null)
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false)
  const [isWalkInDrawerOpen, setIsWalkInDrawerOpen] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    loadTokens()
    staffService.getAll().then((s) => setStaffList(s || [])).catch(() => {})
  }, [loadTokens])

  // Filtered Tokens
  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      // Date filter
      if (selectedDate && token.date !== selectedDate) {
        return false
      }

      // Search (token number, client name, client phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchNumber = token.tokenNumber.toLowerCase().includes(q) || token.displayNumber.toLowerCase().includes(q)
        const matchName = token.clientName.toLowerCase().includes(q)
        const matchPhone = (token.clientPhone || '').includes(q)
        if (!matchNumber && !matchName && !matchPhone) return false
      }

      // Staff filter
      if (selectedStaff !== 'all' && token.staffId !== selectedStaff) {
        return false
      }

      // Status filter
      if (selectedStatus !== 'all' && token.status !== selectedStatus) {
        return false
      }

      // Priority filter
      if (selectedPriority !== 'all' && token.priority !== selectedPriority) {
        return false
      }

      return true
    })
  }, [tokens, selectedDate, searchQuery, selectedStaff, selectedStatus, selectedPriority])

  // Paginated tokens
  const paginatedTokens = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredTokens.slice(start, start + pageSize)
  }, [filteredTokens, currentPage, pageSize])

  // Summary counts
  const stats = useMemo(() => {
    const todayTokens = tokens.filter((t) => !selectedDate || t.date === selectedDate)
    return {
      total: todayTokens.length,
      waiting: todayTokens.filter((t) => t.status === 'WAITING' || t.status === 'CALLED').length,
      inService: todayTokens.filter((t) => t.status === 'IN_SERVICE').length,
      completed: todayTokens.filter((t) => t.status === 'COMPLETED').length,
      skipped: todayTokens.filter((t) => t.status === 'SKIPPED' || t.status === 'CANCELLED').length,
    }
  }, [tokens, selectedDate])

  const handlePrint = (token: Token) => {
    printService.printToken(token)
    addToast({
      title: 'Token Printed',
      message: `Print command sent for Token ${token.displayNumber}.`,
      type: 'success',
    })
  }

  const handleConfirmCancel = async () => {
    if (!cancellingToken) return
    try {
      await cancelToken(cancellingToken.id)
      addToast({
        title: 'Token Cancelled',
        message: `Token ${cancellingToken.displayNumber} has been marked as cancelled.`,
        type: 'warning',
      })
      setCancellingToken(null)
    } catch {
      addToast({
        title: 'Error',
        message: 'Could not cancel token.',
        type: 'danger',
      })
    }
  }

  const getStatusBadge = (status: TokenStatus) => {
    switch (status) {
      case 'WAITING':
        return <Badge variant="warning">Waiting</Badge>
      case 'CALLED':
        return <Badge variant="info">Called</Badge>
      case 'IN_SERVICE':
        return <Badge variant="primary">In Service</Badge>
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>
      case 'HOLD':
        return <Badge variant="default">On Hold</Badge>
      case 'SKIPPED':
        return <Badge variant="danger">Skipped</Badge>
      case 'CANCELLED':
        return <Badge variant="default">Cancelled</Badge>
      default:
        return <Badge variant="default">{status}</Badge>
    }
  }

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '-'
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const calculateWait = (token: Token) => {
    if (token.startedAt && token.checkedInAt) {
      const waitMs = new Date(token.startedAt).getTime() - new Date(token.checkedInAt).getTime()
      const min = Math.max(1, Math.round(waitMs / 60000))
      return `${min} min`
    }
    if (token.status === 'COMPLETED' && token.completedAt && token.checkedInAt) {
      const durMs = new Date(token.completedAt).getTime() - new Date(token.checkedInAt).getTime()
      const min = Math.max(1, Math.round(durMs / 60000))
      return `${min} min total`
    }
    if (token.checkedInAt) {
      const waitMs = Date.now() - new Date(token.checkedInAt).getTime()
      const min = Math.max(1, Math.round(waitMs / 60000))
      return `${min} min elapsed`
    }
    return '-'
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
              Token History
            </h1>
            <Badge variant="primary" size="sm">
              Today: {selectedDate}
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Audit and reprint queue tokens issued across salon counters today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setIsPrinterSettingsOpen(true)}
            leftIcon={<Settings className="h-4 w-4" />}
          >
            Thermal Settings
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsWalkInDrawerOpen(true)}
            leftIcon={<Plus className="h-4 w-4 text-primary" />}
            className="border-primary/30"
          >
            + Add Walk-In
          </Button>

          <Link to="/appointments/queue">
            <Button
              variant="primary"
              leftIcon={<Layers className="h-4 w-4" />}
              className="shadow-glow-primary/30"
            >
              Open Live Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card hoverEffect>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Total Tokens
            </span>
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              {stats.total}
            </p>
            <p className="text-[10px] text-text-muted">Generated today</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Waiting / Called
            </span>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {stats.waiting}
            </p>
            <p className="text-[10px] text-text-muted">In reception queue</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              In Service
            </span>
            <p className="text-2xl font-bold text-primary tabular-nums">
              {stats.inService}
            </p>
            <p className="text-[10px] text-text-muted">Currently in chair</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Completed
            </span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {stats.completed}
            </p>
            <p className="text-[10px] text-text-muted">Treatments done</p>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Skipped / Cancelled
            </span>
            <p className="text-2xl font-bold text-rose-500 tabular-nums">
              {stats.skipped}
            </p>
            <p className="text-[10px] text-text-muted">No-show or dropped</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="md:col-span-2">
              <SearchInput
                placeholder="Search token #, client name, phone…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                onClear={() => setSearchQuery('')}
              />
            </div>

            {/* Specialist Filter */}
            <div>
              <select
                aria-label="Filter Specialist"
                value={selectedStaff}
                onChange={(e) => {
                  setSelectedStaff(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="all">All Specialists</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                aria-label="Filter Status"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="WAITING">Waiting</option>
                <option value="CALLED">Called</option>
                <option value="IN_SERVICE">In Service</option>
                <option value="COMPLETED">Completed</option>
                <option value="HOLD">On Hold</option>
                <option value="SKIPPED">Skipped</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                aria-label="Filter Priority"
                value={selectedPriority}
                onChange={(e) => {
                  setSelectedPriority(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                <option value="all">All Priorities</option>
                <option value="NORMAL">Normal</option>
                <option value="VIP">⭐ VIP</option>
                <option value="EMERGENCY">🔴 Emergency</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-subtle/50 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Specialist</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Called</th>
                <th className="py-3 px-4">Started</th>
                <th className="py-3 px-4">Completed</th>
                <th className="py-3 px-4">Wait Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedTokens.length > 0 ? (
                paginatedTokens.map((token) => (
                  <tr
                    key={token.id}
                    className="hover:bg-surface-hover/70 transition-colors group"
                  >
                    {/* Token */}
                    <td className="py-3 px-4 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-text-primary font-sans">
                          {token.displayNumber}
                        </span>
                        {token.priority === 'VIP' && (
                          <span
                            title="VIP Customer"
                            className="inline-flex items-center text-amber-500"
                          >
                            <Star className="h-3.5 w-3.5 fill-current" />
                          </span>
                        )}
                        {token.priority === 'EMERGENCY' && (
                          <span
                            title="Emergency Priority"
                            className="inline-flex items-center text-rose-500 animate-pulse"
                          >
                            <Flame className="h-3.5 w-3.5 fill-current" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-text-muted font-normal block">
                        {token.appointmentType === 'WALK_IN' ? 'Walk-in' : 'Booking'}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={token.clientName}
                          src={token.clientAvatar}
                          size="xs"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-text-primary truncate">
                            {token.clientName}
                          </p>
                          <p className="text-[11px] text-text-muted">
                            {token.clientPhone || 'No phone'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Service */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-text-primary truncate max-w-[130px]">
                        {token.serviceName}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {token.serviceDuration} min • ₹{token.servicePrice}
                      </p>
                    </td>

                    {/* Specialist */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Avatar
                          name={token.staffName}
                          src={token.staffAvatar}
                          size="xs"
                        />
                        <span className="text-text-primary font-medium truncate max-w-[100px]">
                          {token.staffName}
                        </span>
                      </div>
                    </td>

                    {/* Timestamps */}
                    <td className="py-3 px-4 tabular-nums text-text-secondary">
                      {formatTimestamp(token.checkedInAt)}
                    </td>
                    <td className="py-3 px-4 tabular-nums text-text-secondary">
                      {formatTimestamp(token.calledAt)}
                    </td>
                    <td className="py-3 px-4 tabular-nums text-text-secondary">
                      {formatTimestamp(token.startedAt)}
                    </td>
                    <td className="py-3 px-4 tabular-nums text-text-secondary">
                      {formatTimestamp(token.completedAt)}
                    </td>

                    {/* Wait Time */}
                    <td className="py-3 px-4 tabular-nums font-semibold text-text-secondary">
                      {calculateWait(token)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">{getStatusBadge(token.status)}</td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="View Token Details"
                          onClick={() => setViewingToken(token)}
                          className="h-7 w-7 p-0"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Reprint Token"
                          onClick={() => handlePrint(token)}
                          className="h-7 w-7 p-0 text-text-secondary hover:text-primary"
                          title="Reprint Slip"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>

                        {token.status === 'COMPLETED' && (
                          <Link to={`/sales/billing?tokenId=${token.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="Create Bill"
                              className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                              title="Create Bill / POS"
                            >
                              <Receipt className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        )}

                        {token.status !== 'COMPLETED' && token.status !== 'CANCELLED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Cancel Token"
                            onClick={() => setCancellingToken(token)}
                            className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Cancel Token"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-text-muted">
                    <Hash className="h-8 w-8 mx-auto mb-2 text-text-muted/40" />
                    <p className="text-sm font-semibold text-text-primary">
                      No Tokens Found
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      No issued tokens match the selected filters or search criteria.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredTokens.length > pageSize && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-text-muted">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredTokens.length)} of{' '}
              {filteredTokens.length} tokens
            </span>

            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredTokens.length / pageSize)}
              totalItems={filteredTokens.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* VIEW TOKEN DETAILS MODAL */}
      {viewingToken && (
        <Modal
          isOpen={Boolean(viewingToken)}
          onClose={() => setViewingToken(null)}
          title={`Token ${viewingToken.displayNumber} Details`}
          description={`Registered at ${formatTimestamp(viewingToken.checkedInAt)}`}
          size="sm"
        >
          <div className="space-y-4">
            <div className="text-center p-4 rounded-xl bg-surface-subtle border border-border">
              <span className="text-xs uppercase font-bold text-text-muted">
                Sequential Number
              </span>
              <p className="text-5xl font-black text-text-primary font-sans">
                {viewingToken.displayNumber}
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                {getStatusBadge(viewingToken.status)}
                {viewingToken.priority === 'VIP' && (
                  <Badge variant="accent">⭐ VIP</Badge>
                )}
                {viewingToken.priority === 'EMERGENCY' && (
                  <Badge variant="danger">🔴 Emergency</Badge>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-text-muted">Guest:</span>
                <span className="font-bold text-text-primary">
                  {viewingToken.clientName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-text-muted">Phone:</span>
                <span className="text-text-secondary">
                  {viewingToken.clientPhone || 'None'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-text-muted">Treatment:</span>
                <span className="font-semibold text-text-primary">
                  {viewingToken.serviceName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-text-muted">Specialist:</span>
                <span className="font-semibold text-text-primary">
                  {viewingToken.staffName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-text-muted">Check-In Time:</span>
                <span className="tabular-nums">
                  {formatTimestamp(viewingToken.checkedInAt)}
                </span>
              </div>
              {viewingToken.calledAt && (
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-text-muted">Called Time:</span>
                  <span className="tabular-nums">
                    {formatTimestamp(viewingToken.calledAt)}
                  </span>
                </div>
              )}
              {viewingToken.startedAt && (
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-text-muted">Service Started:</span>
                  <span className="tabular-nums">
                    {formatTimestamp(viewingToken.startedAt)}
                  </span>
                </div>
              )}
              {viewingToken.completedAt && (
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-text-muted">Completed:</span>
                  <span className="tabular-nums">
                    {formatTimestamp(viewingToken.completedAt)}
                  </span>
                </div>
              )}
              {viewingToken.notes && (
                <div className="pt-1">
                  <span className="text-text-muted block mb-0.5">Notes:</span>
                  <p className="p-2 rounded-lg bg-surface border border-border text-text-secondary">
                    {viewingToken.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingToken(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handlePrint(viewingToken)
                  setViewingToken(null)
                }}
                leftIcon={<Printer className="h-4 w-4" />}
              >
                Reprint Slip
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM CANCEL TOKEN DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(cancellingToken)}
        onClose={() => setCancellingToken(null)}
        onConfirm={handleConfirmCancel}
        title={`Cancel Token ${cancellingToken?.displayNumber}?`}
        message={`Are you sure you want to cancel the queue token for ${cancellingToken?.clientName}? This will drop them from the live queue.`}
        confirmText="Yes, Cancel Token"
        variant="danger"
      />

      {/* PRINTER SETTINGS MODAL */}
      <PrinterSettingsModal
        isOpen={isPrinterSettingsOpen}
        onClose={() => setIsPrinterSettingsOpen(false)}
      />

      {/* FAST WALK-IN DRAWER */}
      <FastWalkInDrawer
        isOpen={isWalkInDrawerOpen}
        onClose={() => setIsWalkInDrawerOpen(false)}
      />
    </div>
  )
}
