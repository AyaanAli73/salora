import React, { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  UserCheck,
  Star,
  DollarSign,
  Award,
  Clock,
  Search,
  ArrowUpDown,
} from 'lucide-react'
import { StaffReportData, StaffReportItem } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatCurrency } from '@/utils/formatters'

interface StaffReportViewProps {
  data: StaffReportData
}

type SortField = 'revenueGenerated' | 'completedServices' | 'averageRating' | 'attendanceRate' | 'commissionEarned'

export const StaffReportView: React.FC<StaffReportViewProps> = ({ data }) => {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('revenueGenerated')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const sortedStaff = [...data.staffList]
    .filter(
      (s) =>
        s.staffName.toLowerCase().includes(search.toLowerCase()) ||
        s.role.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const mult = sortOrder === 'desc' ? -1 : 1
      return (a[sortBy] - b[sortBy]) * mult
    })

  const totalRevenue = data.staffList.reduce((s, st) => s + st.revenueGenerated, 0)
  const totalCompleted = data.staffList.reduce((s, st) => s + st.completedServices, 0)
  const totalCommission = data.staffList.reduce((s, st) => s + st.commissionEarned, 0)

  return (
    <div className="space-y-6">
      {/* 1. Header Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Active Specialists</span>
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              {data.staffList.length}
            </p>
            <span className="text-[10px] text-text-muted">Staff tracked in report</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-primary">Team Generated Revenue</span>
            <p className="text-2xl font-bold text-primary tabular-nums">
              {formatCurrency(totalRevenue)}
            </p>
            <span className="text-[10px] text-text-muted">Aggregate chair sales</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Completed Treatments
            </span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {totalCompleted}
            </p>
            <span className="text-[10px] text-text-muted">Finished appointments</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-amber-500">Total Staff Commission</span>
            <p className="text-2xl font-bold text-amber-500 tabular-nums">
              {formatCurrency(totalCommission)}
            </p>
            <span className="text-[10px] text-text-muted">Performance incentives</span>
          </CardContent>
        </Card>
      </div>

      {/* 2. Side-by-Side Comparison Chart */}
      <Card>
        <CardHeader className="pb-2 border-b border-border">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Specialist Productivity Comparison</span>
            <span className="text-[11px] font-normal text-text-muted">Revenue & Completed Services</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedStaff} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="staffName" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke="#6366F1"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#10B981"
                  fontSize={11}
                  tickLine={false}
                />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="revenueGenerated"
                  fill="#6366F1"
                  name="Revenue (INR)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="completedServices"
                  fill="#10B981"
                  name="Completed Services"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. Detailed Staff Comparison Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold">Specialist Performance Matrix</CardTitle>
            <p className="text-xs text-text-muted mt-0.5">
              Click headers to reorder team comparison by specific production metrics
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by name, role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-hover/50 text-text-muted font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">Specialist</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th
                    className="py-2.5 px-4 text-right cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort('completedServices')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Services Done</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-4 text-right cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort('revenueGenerated')}
                  >
                    <div className="flex items-center justify-end gap-1 text-primary">
                      <span>Revenue</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-4 text-center cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort('averageRating')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Rating</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-4 text-right cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort('attendanceRate')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Attendance</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-4 text-right cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort('commissionEarned')}
                  >
                    <div className="flex items-center justify-end gap-1 text-emerald-600 dark:text-emerald-400">
                      <span>Commission</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedStaff.map((s) => (
                  <tr key={s.staffId} className="hover:bg-surface-hover/40 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={s.staffName} size="sm" />
                        <span className="font-semibold text-text-primary">{s.staffName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-text-muted">{s.role}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-text-primary">
                      {s.completedServices}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold text-text-primary">
                      {formatCurrency(s.revenueGenerated)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-semibold text-text-primary tabular-nums">
                          {s.averageRating.toFixed(1)}
                        </span>
                        <Star className="w-3 h-3 text-amber-500 fill-current" />
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums">
                      <span
                        className={
                          s.attendanceRate >= 90
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {s.attendanceRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(s.commissionEarned)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
