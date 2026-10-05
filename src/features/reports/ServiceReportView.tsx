import React, { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Scissors,
  Star,
  Search,
  ArrowUpDown,
  Filter,
} from 'lucide-react'
import { ServiceReportData, ServiceReportItem } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/formatters'

interface ServiceReportViewProps {
  data: ServiceReportData
}

type SortField = 'revenue' | 'bookingsCount' | 'averagePrice' | 'averageRating' | 'cancellationRate'

export const ServiceReportView: React.FC<ServiceReportViewProps> = ({ data }) => {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('revenue')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const sortedServices = [...data.services]
    .filter(
      (s) =>
        s.serviceName.toLowerCase().includes(search.toLowerCase()) ||
        s.categoryName.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const mult = sortOrder === 'desc' ? -1 : 1
      return (a[sortBy] - b[sortBy]) * mult
    })

  return (
    <div className="space-y-6">
      {/* 1. Header Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Total Services Catalogued</span>
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              {data.totalServicesTracked}
            </p>
            <span className="text-[10px] text-text-muted">Active menu treatments</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-primary">Total Service Revenue</span>
            <p className="text-2xl font-bold text-primary tabular-nums">
              {formatCurrency(data.totalServiceRevenue)}
            </p>
            <span className="text-[10px] text-text-muted">Treatment gross collections</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Active Sort Metric</span>
            <p className="text-xl font-bold text-text-primary capitalize">
              {sortBy === 'revenue'
                ? 'Gross Revenue'
                : sortBy === 'bookingsCount'
                ? 'Total Bookings'
                : sortBy === 'averageRating'
                ? 'Guest Rating'
                : sortBy === 'averagePrice'
                ? 'Menu Price'
                : 'Cancellation Rate'}
            </p>
            <span className="text-[10px] text-text-muted">Ranked strictly by quantitative values</span>
          </CardContent>
        </Card>
      </div>

      {/* 2. Metric Distribution Chart */}
      <Card>
        <CardHeader className="pb-2 border-b border-border">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Service Revenue Performance</span>
            <span className="text-[11px] font-normal text-text-muted">Visual Metric Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedServices.slice(0, 10)}
                margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis
                  dataKey="serviceName"
                  stroke="#9CA3AF"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Revenue']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. Objective Metrics Table (No subjective labels) */}
      <Card>
        <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold">Service Analytics Ledger</CardTitle>
            <p className="text-xs text-text-muted mt-0.5">
              Click headers to sort by individual quantitative performance attributes
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search services, category…"
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
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Service Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th
                    className="py-2.5 px-4 text-right cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort('bookingsCount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Bookings</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-4 text-right cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort('averagePrice')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Price</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-4 text-right cursor-pointer hover:text-text-primary"
                    onClick={() => handleSort('revenue')}
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
                    onClick={() => handleSort('cancellationRate')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Cancel Rate</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedServices.map((s, idx) => (
                  <tr key={s.serviceId} className="hover:bg-surface-hover/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-text-muted">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-semibold text-text-primary">{s.serviceName}</td>
                    <td className="py-2.5 px-4 text-text-muted">{s.categoryName}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-text-primary">
                      {s.bookingsCount}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-text-muted">
                      {formatCurrency(s.averagePrice)}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold text-text-primary">
                      {formatCurrency(s.revenue)}
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
                          s.cancellationRate > 15
                            ? 'text-rose-500 font-semibold'
                            : 'text-text-muted'
                        }
                      >
                        {s.cancellationRate}%
                      </span>
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
