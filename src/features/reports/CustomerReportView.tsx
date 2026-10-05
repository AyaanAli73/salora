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
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Crown,
  Repeat,
  DollarSign,
  TrendingUp,
  Info,
  Search,
} from 'lucide-react'
import { CustomerReportData } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/formatters'

interface CustomerReportViewProps {
  data: CustomerReportData
}

export const CustomerReportView: React.FC<CustomerReportViewProps> = ({ data }) => {
  const [search, setSearch] = useState('')

  const filteredClients = data.clientsList.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.status.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* 1. Client Status Top Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Total Clients</span>
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              {data.totalClients}
            </p>
            <span className="text-[10px] text-text-muted">Registered in guest directory</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-primary">New Clients</span>
            <p className="text-2xl font-bold text-primary tabular-nums">
              {data.newClients}
            </p>
            <span className="text-[10px] text-text-muted">Single or introductory visit</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Returning Clients
            </span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {data.returningClients}
            </p>
            <span className="text-[10px] text-text-muted">&gt;1 recorded appointment</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-amber-500">VIP Members</span>
            <p className="text-2xl font-bold text-amber-500 tabular-nums">
              {data.vipClients}
            </p>
            <span className="text-[10px] text-text-muted">High lifetime value patrons</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Inactive Clients</span>
            <p className="text-2xl font-bold text-text-muted tabular-nums">
              {data.inactiveClients}
            </p>
            <span className="text-[10px] text-text-muted">No visit in past 60+ days</span>
          </CardContent>
        </Card>
      </div>

      {/* 2. Calculated Customer Economics & Explicit Assumptions */}
      <Card className="bg-surface-hover/30 border-border">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>Customer Retention & Economics (Derived Analytics)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-surface border border-border">
              <span className="text-[11px] font-semibold text-text-muted block">Visit Frequency</span>
              <p className="text-xl font-bold text-text-primary tabular-nums mt-0.5">
                {data.visitFrequency} visits
              </p>
              <span className="text-[10px] text-text-muted">Average sessions per patron</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border">
              <span className="text-[11px] font-semibold text-text-muted block">Average Spend per Visit</span>
              <p className="text-xl font-bold text-text-primary tabular-nums mt-0.5">
                {formatCurrency(data.averageSpend)}
              </p>
              <span className="text-[10px] text-text-muted">Ticket size per completed visit</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border">
              <span className="text-[11px] font-semibold text-text-muted block">Repeat Rate</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                {data.repeatRate}%
              </p>
              <span className="text-[10px] text-text-muted">% of directory with &gt;1 visit</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border">
              <span className="text-[11px] font-semibold text-primary block">
                Approx. Customer Lifetime Value (CLV)
              </span>
              <p className="text-xl font-bold text-primary tabular-nums mt-0.5">
                {formatCurrency(data.clvApproximation)}
              </p>
              <span className="text-[10px] text-text-muted">Estimated 2.5-year salon lifecycle</span>
            </div>
          </div>

          {/* Explicit Assumptions Callout */}
          <div className="p-3 rounded-xl bg-surface border border-border text-xs text-text-muted flex items-start gap-2">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <strong className="text-text-primary font-semibold">Analytical Assumptions & Methodology: </strong>
              Visit frequency and average spend are computed from actual recorded billing and appointment records in SALORA. CLV is an analytical approximation model calculated as:
              <code className="text-primary font-mono text-[11px] mx-1">
                Average Spend ({formatCurrency(data.averageSpend)}) × Visit Frequency ({data.visitFrequency}) × 2.5 Year Retention Horizon
              </code>.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Cohort Acquisition & Retention Chart */}
      <Card>
        <CardHeader className="pb-2 border-b border-border">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Customer Acquisition & Retention Pacing</span>
            <span className="text-[11px] font-normal text-text-muted">Monthly Guest Growth</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.cohortData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="newClients" fill="#6366F1" name="New Guests" radius={[4, 4, 0, 0]} />
                <Bar dataKey="returningClients" fill="#10B981" name="Returning Guests" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 4. Customer Directory Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold">Client Spending & Visit Roster</CardTitle>
            <p className="text-xs text-text-muted mt-0.5">
              Live engagement profiles across all salon guests
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by name, phone, status…"
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
                  <th className="py-2.5 px-4">Guest Name</th>
                  <th className="py-2.5 px-4">Contact</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Total Visits</th>
                  <th className="py-2.5 px-4 text-right">Total Spent</th>
                  <th className="py-2.5 px-4 text-right">Avg Ticket</th>
                  <th className="py-2.5 px-4 text-right">Last Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClients.slice(0, 30).map((c) => (
                  <tr key={c.id} className="hover:bg-surface-hover/40 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-text-primary">{c.name}</td>
                    <td className="py-2.5 px-4 text-text-muted font-mono">{c.phone}</td>
                    <td className="py-2.5 px-4 text-center">
                      <Badge
                        variant={
                          c.status === 'vip'
                            ? 'accent'
                            : c.status === 'active'
                            ? 'success'
                            : c.status === 'new'
                            ? 'primary'
                            : 'default'
                        }
                        size="sm"
                        className="capitalize"
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-text-primary">
                      {c.totalVisits}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold text-text-primary">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-text-muted">
                      {formatCurrency(c.avgTicket)}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-text-muted">
                      {c.lastVisit}
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
