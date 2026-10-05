import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  RefreshCw,
  Building2,
  Calendar,
  User,
  Clock,
  Laptop,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  FileSpreadsheet,
} from 'lucide-react'
import { auditLogService } from '@/services/auditLogService'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useBranchStore } from '@/store/useBranchStore'
import { useToastStore } from '@/store/useToastStore'
import { AuditLogEntry } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/utils/cn'

export const AuditLogPage: React.FC = () => {
  const { exportModule } = useSettingsStore()
  const { branches } = useBranchStore()
  const { addToast } = useToastStore()

  // State
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => auditLogService.getAll())
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [selectedModule, setSelectedModule] = useState<string>('all')
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string>('')

  // Detail Modal
  const [activeLog, setActiveLog] = useState<AuditLogEntry | null>(null)

  // Options
  const users = useMemo(() => auditLogService.getUniqueUsers(), [])
  const modules = useMemo(() => auditLogService.getUniqueModules(), [])
  const actions = useMemo(() => auditLogService.getUniqueActions(), [])

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogService.getFiltered({
      user: selectedUser,
      module: selectedModule,
      action: selectedAction,
      branch: selectedBranch,
      branchId: selectedBranch,
      dateRange: selectedDate ? { start: selectedDate, end: selectedDate } : undefined,
      search,
    })
  }, [selectedUser, selectedModule, selectedAction, selectedBranch, selectedDate, search])

  const handleRefresh = () => {
    setLogs(auditLogService.getAll())
    addToast({
      title: 'Audit Logs Refreshed',
      message: 'Latest system activity synchronized.',
      type: 'info',
    })
  }

  const handleClearFilters = () => {
    setSearch('')
    setSelectedUser('all')
    setSelectedModule('all')
    setSelectedAction('all')
    setSelectedBranch('all')
    setSelectedDate('')
  }

  // Summary Metrics
  const stats = useMemo(() => {
    const total = filteredLogs.length
    const financial = filteredLogs.filter((l) =>
      ['Billing', 'Expenses', 'Payroll', 'Purchases'].includes(l.module || '')
    ).length
    const security = filteredLogs.filter((l) =>
      ['Auth', 'Security', 'Settings'].includes(l.module || '')
    ).length
    const successCount = filteredLogs.filter((l) => (l.result || 'SUCCESS') === 'SUCCESS').length
    const successRate = total > 0 ? Math.round((successCount / total) * 100) : 100

    return { total, financial, security, successRate }
  }, [filteredLogs])

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link to="/settings" className="hover:text-primary transition-colors flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              Settings
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Audit Log & System Activity</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-primary" />
            Immutable Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Strict chronological record of all administrative, financial, and authorization operations across all branches.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => exportModule('audit')}
            className="shadow-sm"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export Audit CSV
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Filtered Events</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-1">Logged system actions</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Financial Modifications</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{stats.financial}</div>
          <div className="text-xs text-slate-500 mt-1">Invoices, payroll, refunds, POs</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Security & Auth Events</span>
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700 mt-2">{stats.security}</div>
          <div className="text-xs text-slate-500 mt-1">Logins, roles, policy updates</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Execution Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.successRate}%</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Normal execution telemetry</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by entity ID, performed user, or action notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Module Filter */}
          <div className="w-full sm:w-44">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Modules</option>
              {modules.map((m: string) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div className="w-full sm:w-44">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Users</option>
              {users.map((u: string) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div className="w-full sm:w-44">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div className="w-full sm:w-40">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {(search || selectedUser !== 'all' || selectedModule !== 'all' || selectedBranch !== 'all' || selectedDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs text-rose-600 hover:bg-rose-50"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User & Role</th>
                <th className="py-3 px-4">Action & Module</th>
                <th className="py-3 px-4">Entity Ref</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Device / IP</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ShieldAlert className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">No audit log records match the selected filters</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting the search query or date range</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry) => {
                  const isSuccess = (entry.result || 'SUCCESS') === 'SUCCESS'
                  const isBlocked = (entry.result as string) === 'BLOCKED'

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {entry.timestamp.split('T')[0]}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {entry.timestamp.split('T')[1]?.slice(0, 8) || ''}
                        </div>
                      </td>

                      {/* User & Role */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{entry.performedBy}</div>
                        <Badge
                          variant="default"
                          className="mt-0.5 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0"
                        >
                          {entry.userRole}
                        </Badge>
                      </td>

                      {/* Action & Module */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 text-xs font-mono">
                          {entry.action}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/70"></span>
                          {entry.module || entry.entityType || 'General'}
                        </div>
                      </td>

                      {/* Entity ID */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {entry.entityId}
                        </span>
                      </td>

                      {/* Branch */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{entry.branchName || 'Salora Jodhpur'}</span>
                        </div>
                      </td>

                      {/* Result */}
                      <td className="py-3.5 px-4">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            SUCCESS
                          </span>
                        ) : isBlocked ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            BLOCKED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            FAILURE
                          </span>
                        )}
                      </td>

                      {/* Device / IP */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        <div className="font-mono text-[11px] text-slate-600">
                          {entry.ipAddress || '192.168.1.10'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                          {entry.deviceInfo || 'Desktop Browser'}
                        </div>
                      </td>

                      {/* Action View */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveLog(entry)}
                          className="text-xs text-primary hover:bg-primary/5 px-2 py-1 h-auto"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail & State Diff Modal */}
      {activeLog && (
        <Modal
          isOpen={!!activeLog}
          onClose={() => setActiveLog(null)}
          title="Audit Record Inspection"
          size="lg"
        >
          <div className="space-y-5 text-sm">
            {/* Top Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase">Action</span>
                <div className="font-mono font-bold text-slate-800 text-xs mt-0.5">{activeLog.action}</div>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase">Module</span>
                <div className="font-semibold text-slate-800 text-xs mt-0.5">{activeLog.module || activeLog.entityType}</div>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase">Target Entity</span>
                <div className="font-mono text-primary font-bold text-xs mt-0.5">{activeLog.entityId}</div>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase">Result</span>
                <div className="mt-0.5">
                  <Badge variant="success" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-xs">
                    {activeLog.result || 'SUCCESS'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Operator Telemetry
                </span>
                <div className="text-slate-600">
                  <span className="text-slate-400">User:</span> {activeLog.performedBy} ({activeLog.userRole})
                </div>
                <div className="text-slate-600">
                  <span className="text-slate-400">Branch:</span> {activeLog.branchName || 'Salora Jodhpur'}
                </div>
                <div className="text-slate-600">
                  <span className="text-slate-400">Timestamp:</span> {activeLog.timestamp}
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-primary" />
                  Origin & Network
                </span>
                <div className="text-slate-600 font-mono">
                  <span className="text-slate-400 font-sans">IP Address:</span> {activeLog.ipAddress || '192.168.1.10'}
                </div>
                <div className="text-slate-600">
                  <span className="text-slate-400">Device Signature:</span> {activeLog.deviceInfo || 'Workstation / Browser'}
                </div>
              </div>
            </div>

            {/* Narrative Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-xs font-semibold text-slate-700">Narrative Description</span>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{activeLog.details}</p>
            </div>

            {/* State Diff / Before & After */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">State Mutation Diff</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Before State */}
                <div className="border border-amber-200/80 bg-amber-50/40 rounded-lg p-3">
                  <div className="text-xs font-semibold text-amber-800 mb-2 flex items-center justify-between">
                    <span>Previous State (Before)</span>
                    <Badge variant="warning" className="text-[10px] bg-white border-amber-200 text-amber-700">
                      Snapshotted
                    </Badge>
                  </div>
                  {activeLog.beforeState ? (
                    <pre className="text-[11px] font-mono bg-white p-2.5 rounded border border-amber-200 text-slate-700 overflow-x-auto max-h-48">
                      {JSON.stringify(activeLog.beforeState, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-xs text-slate-400 italic py-4 text-center">
                      No preceding state (Initial creation or non-mutating event)
                    </div>
                  )}
                </div>

                {/* After State */}
                <div className="border border-emerald-200/80 bg-emerald-50/40 rounded-lg p-3">
                  <div className="text-xs font-semibold text-emerald-800 mb-2 flex items-center justify-between">
                    <span>Committed State (After)</span>
                    <Badge variant="success" className="text-[10px] bg-white border-emerald-200 text-emerald-700">
                      Active In DB
                    </Badge>
                  </div>
                  {activeLog.afterState ? (
                    <pre className="text-[11px] font-mono bg-white p-2.5 rounded border border-emerald-200 text-slate-700 overflow-x-auto max-h-48">
                      {JSON.stringify(activeLog.afterState, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-xs text-slate-400 italic py-4 text-center">
                      No terminal state recorded
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Close action */}
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setActiveLog(null)}>
                Dismiss Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
