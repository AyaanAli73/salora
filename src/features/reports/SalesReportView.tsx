import React, { useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  Receipt,
  Percent,
  RotateCcw,
  Sparkles,
  Search,
  Calendar,
  Layers,
} from 'lucide-react'
import { SalesReportData } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/formatters'

interface SalesReportViewProps {
  data: SalesReportData
}

const CATEGORY_COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#3B82F6']

export const SalesReportView: React.FC<SalesReportViewProps> = ({ data }) => {
  const [search, setSearch] = useState('')

  const filteredItems = data.items.filter(
    (item) =>
      item.billNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.clientName.toLowerCase().includes(search.toLowerCase()) ||
      item.staffName.toLowerCase().includes(search.toLowerCase()) ||
      item.paymentMethod.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* 1. Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Gross Sales</span>
            <p className="text-xl font-bold text-text-primary tabular-nums">
              {formatCurrency(data.grossSales)}
            </p>
            <span className="text-[10px] text-text-muted">Pre-discount subtotal</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-rose-500">Discounts</span>
            <p className="text-xl font-bold text-rose-500 tabular-nums">
              -{formatCurrency(data.discounts)}
            </p>
            <span className="text-[10px] text-text-muted">Coupons & waivers</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Taxes (GST)</span>
            <p className="text-xl font-bold text-text-primary tabular-nums">
              +{formatCurrency(data.taxes)}
            </p>
            <span className="text-[10px] text-text-muted">Collected for remittance</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Refunds</span>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              -{formatCurrency(data.refunds)}
            </p>
            <span className="text-[10px] text-text-muted">Returned to clients</span>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-primary">Net Sales</span>
            <p className="text-xl font-bold text-primary tabular-nums">
              {formatCurrency(data.netSales)}
            </p>
            <span className="text-[10px] text-text-muted">Actual realized revenue</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Average Bill Value</span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(data.averageBillValue)}
            </p>
            <span className="text-[10px] text-text-muted">{data.totalBillsCount} paid invoices</span>
          </CardContent>
        </Card>
      </div>

      {/* 2. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Revenue Trend (Gross vs Net)</span>
              <span className="text-[11px] font-normal text-text-muted">Daily Pacing</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64 w-full">
              {data.revenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grossGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => val.slice(5)}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      formatter={(val: any, name: any) => [
                        formatCurrency(Number(val)),
                        name === 'gross' ? 'Gross Sales' : 'Net Sales',
                      ]}
                      labelFormatter={(lbl) => `Date: ${lbl}`}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="gross"
                      stroke="#6366F1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#grossGradient)"
                      name="gross"
                    />
                    <Area
                      type="monotone"
                      dataKey="net"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#netGradient)"
                      name="net"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-text-muted">
                  No billing transactions recorded in this period.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sales by Category Pie */}
        <Card>
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold">Sales by Department</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="h-44 w-full">
              {data.salesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.salesByCategory}
                      dataKey="revenue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {data.salesByCategory.map((_, idx) => (
                        <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(v: any) => [formatCurrency(Number(v)), 'Revenue']}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-text-muted">
                  No categorical sales recorded.
                </div>
              )}
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {data.salesByCategory.map((c, i) => (
                <div key={c.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                    />
                    <span className="text-text-muted truncate">{c.category}</span>
                  </div>
                  <span className="font-semibold text-text-primary tabular-nums shrink-0">
                    {formatCurrency(c.revenue)} ({c.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Sales by Service Bar Chart */}
      <Card>
        <CardHeader className="pb-2 border-b border-border">
          <CardTitle className="text-sm font-bold">Sales by Service & Treatment</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-60 w-full">
            {data.salesByService.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.salesByService} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="serviceName"
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                    angle={-20}
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
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-muted">
                No individual service transactions found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Detailed Data Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold">Sales Ledger & Invoices</CardTitle>
            <p className="text-xs text-text-muted mt-0.5">
              Itemized billing records reflecting customer transactions
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by invoice, guest, staff…"
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
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Client</th>
                  <th className="py-2.5 px-4">Specialist</th>
                  <th className="py-2.5 px-4 text-right">Gross</th>
                  <th className="py-2.5 px-4 text-right">Discount</th>
                  <th className="py-2.5 px-4 text-right">Tax</th>
                  <th className="py-2.5 px-4 text-right">Net Amount</th>
                  <th className="py-2.5 px-4 text-center">Payment</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.slice(0, 30).map((row) => (
                  <tr key={row.billId} className="hover:bg-surface-hover/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-text-primary">
                      {row.billNumber}
                    </td>
                    <td className="py-2.5 px-4 text-text-muted tabular-nums">{row.date}</td>
                    <td className="py-2.5 px-4 font-medium text-text-primary">{row.clientName}</td>
                    <td className="py-2.5 px-4 text-text-muted">{row.staffName}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-medium">
                      {formatCurrency(row.grossAmount)}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-rose-500">
                      {row.discount > 0 ? `-${formatCurrency(row.discount)}` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-text-muted">
                      {row.tax > 0 ? `+${formatCurrency(row.tax)}` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold text-text-primary">
                      {formatCurrency(row.netAmount)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="uppercase text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-hover border border-border">
                        {row.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <Badge
                        variant={
                          row.status === 'PAID'
                            ? 'success'
                            : row.status === 'PARTIAL'
                            ? 'warning'
                            : row.status === 'REFUNDED'
                            ? 'danger'
                            : 'default'
                        }
                        size="sm"
                      >
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-xs text-text-muted">
              No matching sales records found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
