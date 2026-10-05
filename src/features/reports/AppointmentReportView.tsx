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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  PieChart as PieIcon,
} from 'lucide-react'
import { AppointmentReportData } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/formatters'

interface AppointmentReportViewProps {
  data: AppointmentReportData
}

const CHANNEL_COLORS = ['#6366F1', '#10B981', '#F59E0B']

export const AppointmentReportView: React.FC<AppointmentReportViewProps> = ({ data }) => {
  const [search, setSearch] = useState('')

  const filteredItems = data.items.filter(
    (item) =>
      item.clientName.toLowerCase().includes(search.toLowerCase()) ||
      item.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      item.staffName.toLowerCase().includes(search.toLowerCase()) ||
      item.status.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* 1. Booking Volume & Rates KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Total Bookings</span>
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              {data.totalBookings}
            </p>
            <span className="text-[10px] text-text-muted">Total appointments</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Completed
            </span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {data.completed}
            </p>
            <span className="text-[10px] text-text-muted">Sessions serviced</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-rose-500">Cancelled</span>
            <p className="text-2xl font-bold text-rose-500 tabular-nums">
              {data.cancelled}
            </p>
            <span className="text-[10px] text-text-muted">Prior notices</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">No-Shows</span>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {data.noShow}
            </p>
            <span className="text-[10px] text-text-muted">Missed slots</span>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Completion Rate
            </span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {data.completionRate}%
            </p>
            <span className="text-[10px] text-text-muted">Operational throughput</span>
          </CardContent>
        </Card>

        <Card className="bg-rose-500/5 border-rose-500/20">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-rose-500">Cancellation Rate</span>
            <p className="text-2xl font-bold text-rose-500 tabular-nums">
              {data.cancellationRate}%
            </p>
            <span className="text-[10px] text-text-muted">Drop-off percentage</span>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              No-Show Rate
            </span>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {data.noShowRate}%
            </p>
            <span className="text-[10px] text-text-muted">Chair vacancy impact</span>
          </CardContent>
        </Card>
      </div>

      {/* 2. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Appointment Fulfillment Timeline</span>
              <span className="text-[11px] font-normal text-text-muted">Completed vs Missed</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64 w-full">
              {data.dailyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => v.slice(5)}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cancelled" name="Cancelled" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="noShow" name="No-Show" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-text-muted">
                  No appointment records in this date window.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Channel Breakdown */}
        <Card>
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold">Booking Channels</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.channelBreakdown}
                    dataKey="count"
                    nameKey="channel"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                  >
                    {data.channelBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={CHANNEL_COLORS[idx % CHANNEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {data.channelBreakdown.map((ch, idx) => (
                <div key={ch.channel} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CHANNEL_COLORS[idx % CHANNEL_COLORS.length] }}
                    />
                    <span className="text-text-muted">{ch.channel}</span>
                  </div>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {ch.count} bookings
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Detailed Appointments Ledger */}
      <Card>
        <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold">Appointment Activity Ledger</CardTitle>
            <p className="text-xs text-text-muted mt-0.5">
              Verified sessions logged across chair specialists
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by client, service, staff…"
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
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Client</th>
                  <th className="py-2.5 px-4">Service</th>
                  <th className="py-2.5 px-4">Specialist</th>
                  <th className="py-2.5 px-4 text-right">Price</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.slice(0, 30).map((a) => (
                  <tr key={a.id} className="hover:bg-surface-hover/40 transition-colors">
                    <td className="py-2.5 px-4 text-text-muted tabular-nums">{a.date}</td>
                    <td className="py-2.5 px-4 text-text-muted tabular-nums">{a.time}</td>
                    <td className="py-2.5 px-4 font-semibold text-text-primary">{a.clientName}</td>
                    <td className="py-2.5 px-4 font-medium text-text-primary">{a.serviceName}</td>
                    <td className="py-2.5 px-4 text-text-muted">{a.staffName}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold text-text-primary">
                      {formatCurrency(a.price)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <Badge
                        variant={
                          a.status === 'completed'
                            ? 'success'
                            : a.status === 'cancelled'
                            ? 'danger'
                            : a.status === 'no-show'
                            ? 'warning'
                            : 'primary'
                        }
                        size="sm"
                        className="capitalize"
                      >
                        {a.status}
                      </Badge>
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
