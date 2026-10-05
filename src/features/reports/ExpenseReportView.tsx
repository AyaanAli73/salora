import React, { useState } from 'react'
import {
  AreaChart,
  Area,
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
  ReceiptText,
  DollarSign,
  TrendingDown,
  CreditCard,
  Search,
} from 'lucide-react'
import { ExpenseReportData } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/formatters'

interface ExpenseReportViewProps {
  data: ExpenseReportData
}

const EXPENSE_COLORS = ['#F43F5E', '#FB923C', '#FBBF24', '#818CF8', '#A78BFA', '#2DD4BF']

export const ExpenseReportView: React.FC<ExpenseReportViewProps> = ({ data }) => {
  const [search, setSearch] = useState('')

  const filteredItems = data.items.filter(
    (e) =>
      e.expenseNumber.toLowerCase().includes(search.toLowerCase()) ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.paymentMethod.toLowerCase().includes(search.toLowerCase())
  )

  const topCategory = data.byCategory[0]?.category || 'Operations'
  const topMethod = data.byPaymentMethod[0]?.method || 'Bank'

  return (
    <div className="space-y-6">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-rose-500/5 border-rose-500/20">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-rose-500">Total Operating Expenses</span>
            <p className="text-2xl font-bold text-rose-500 tabular-nums">
              {formatCurrency(data.totalExpenses)}
            </p>
            <span className="text-[10px] text-text-muted">Settled vendor and facility costs</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Largest Expense Category</span>
            <p className="text-xl font-bold text-text-primary truncate">{topCategory}</p>
            <span className="text-[10px] text-text-muted">
              {formatCurrency(data.byCategory[0]?.amount || 0)} ({data.byCategory[0]?.percentage || 0}%)
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Primary Payment Tender</span>
            <p className="text-xl font-bold text-text-primary capitalize">{topMethod.replace('_', ' ')}</p>
            <span className="text-[10px] text-text-muted">
              {formatCurrency(data.byPaymentMethod[0]?.amount || 0)} ({data.byPaymentMethod[0]?.percentage || 0}%)
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Expense Entries</span>
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              {data.items.length}
            </p>
            <span className="text-[10px] text-text-muted">Itemized audit entries</span>
          </CardContent>
        </Card>
      </div>

      {/* 2. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Expense Burn Rate Trend</span>
              <span className="text-[11px] font-normal text-text-muted">Monthly Pacing</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64 w-full">
              {data.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#9CA3AF"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Total Expense']}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#F43F5E"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#expenseGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-text-muted">
                  No expense records in this range.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown Pie */}
        <Card>
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold">Expense by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byCategory}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                  >
                    {data.byCategory.map((_, idx) => (
                      <Cell key={idx} fill={EXPENSE_COLORS[idx % EXPENSE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(v: any) => [formatCurrency(Number(v)), 'Spent']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {data.byCategory.map((c, i) => (
                <div key={c.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }}
                    />
                    <span className="text-text-muted truncate">{c.category}</span>
                  </div>
                  <span className="font-semibold text-text-primary tabular-nums shrink-0">
                    {formatCurrency(c.amount)} ({c.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Itemized Expenses Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold">Itemized Expense Ledger</CardTitle>
            <p className="text-xs text-text-muted mt-0.5">
              Verified operational disbursements and vendor payments
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by title, voucher, category…"
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
                  <th className="py-2.5 px-4">Voucher #</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Title / Purpose</th>
                  <th className="py-2.5 px-4 text-center">Payment Method</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.slice(0, 30).map((e) => (
                  <tr key={e.id} className="hover:bg-surface-hover/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-text-primary">
                      {e.expenseNumber}
                    </td>
                    <td className="py-2.5 px-4 text-text-muted tabular-nums">{e.date}</td>
                    <td className="py-2.5 px-4 font-medium text-text-primary">{e.category}</td>
                    <td className="py-2.5 px-4 text-text-muted">{e.title}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="uppercase text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-hover border border-border">
                        {e.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold text-rose-500">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <Badge variant="success" size="sm">
                        {e.status}
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
