import React, { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
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
  Wallet,
  CreditCard,
  QrCode,
  Building,
  Landmark,
  Scale,
  TrendingUp,
  AlertCircle,
  FileText,
  Search,
} from 'lucide-react'
import { PaymentReportData, OperatingResultReportData } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/formatters'

interface FinanceReportViewProps {
  paymentData: PaymentReportData
  operatingData: OperatingResultReportData
}

const PAYMENT_COLORS = ['#10B981', '#6366F1', '#F59E0B', '#3B82F6', '#8B5CF6']

export const FinanceReportView: React.FC<FinanceReportViewProps> = ({
  paymentData,
  operatingData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'payments' | 'profitability'>('profitability')
  const [search, setSearch] = useState('')

  const filteredTransactions = paymentData.transactions.filter(
    (t) =>
      t.billNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.clientName.toLowerCase().includes(search.toLowerCase()) ||
      t.paymentMethod.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Sub-navigation Toggle */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('profitability')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeSubTab === 'profitability'
              ? 'bg-primary text-white shadow-xs'
              : 'text-text-muted hover:text-text-primary bg-surface-hover/50'
          }`}
        >
          Operating Result & P&L Statement
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('payments')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeSubTab === 'payments'
              ? 'bg-primary text-white shadow-xs'
              : 'text-text-muted hover:text-text-primary bg-surface-hover/50'
          }`}
        >
          Payment Methods & Collections
        </button>
      </div>

      {/* Sub-view 1: Operating Result & Profitability View */}
      {activeSubTab === 'profitability' && (
        <div className="space-y-6">
          {/* Statutory Accounting Disclaimer Banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Operating Framework Clarification: </span>
              This operating result is computed on an operational cash basis:
              <strong className="mx-1">Gross Revenue - Discounts - Refunds - Operating Expenses = Operating Result</strong>.
              It tracks operating cash flow efficiency and department margins. It does not replace GAAP/IFRS audited tax statements.
            </div>
          </div>

          {/* Operating P&L Waterfall Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-text-muted">Gross Revenue</span>
                <p className="text-xl font-bold text-text-primary tabular-nums">
                  {formatCurrency(operatingData.grossRevenue)}
                </p>
                <span className="text-[10px] text-text-muted">All bill sub-totals</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-rose-500">Discounts & Offers</span>
                <p className="text-xl font-bold text-rose-500 tabular-nums">
                  -{formatCurrency(operatingData.discounts)}
                </p>
                <span className="text-[10px] text-text-muted">Loyalty & promotion costs</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Refunds</span>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  -{formatCurrency(operatingData.refunds)}
                </p>
                <span className="text-[10px] text-text-muted">Customer reversals</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-rose-600">Operating Expenses</span>
                <p className="text-xl font-bold text-rose-600 tabular-nums">
                  -{formatCurrency(operatingData.operatingExpenses)}
                </p>
                <span className="text-[10px] text-text-muted">Rent, utilities, payroll & stock</span>
              </CardContent>
            </Card>

            <Card className="bg-emerald-500/5 border-emerald-500/20 md:col-span-2 lg:col-span-2">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Operating Result
                </span>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(operatingData.operatingResult)}
                  </p>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    ({operatingData.operatingMarginPercent}% margin)
                  </span>
                </div>
                <span className="text-[10px] text-text-muted">Pre-tax cash operating surplus</span>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Pacing Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2 border-b border-border">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Monthly Operating Result Pacing</span>
                  <span className="text-[11px] font-normal text-text-muted">Revenue vs Expenses</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={operatingData.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#9CA3AF"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <RechartsTooltip
                        formatter={(val: any) => formatCurrency(Number(val))}
                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar dataKey="revenue" fill="#6366F1" name="Gross Revenue" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#F43F5E" name="Operating Expenses" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="operatingResult" fill="#10B981" name="Operating Result" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense Distribution */}
            <Card>
              <CardHeader className="pb-2 border-b border-border">
                <CardTitle className="text-sm font-bold">Operating Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {operatingData.expensesByCategory.slice(0, 6).map((c, i) => (
                  <div key={c.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted truncate">{c.category}</span>
                      <span className="font-semibold text-text-primary tabular-nums">
                        {formatCurrency(c.amount)} ({c.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-hover overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${Math.min(100, c.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Sub-view 2: Payment Methods & Collections */}
      {activeSubTab === 'payments' && (
        <div className="space-y-6">
          {/* Payment Method Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-primary">Total Collected</span>
                <p className="text-xl font-bold text-primary tabular-nums">
                  {formatCurrency(paymentData.totalCollected)}
                </p>
                <span className="text-[10px] text-text-muted">Settled collections</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-text-muted">UPI / QR</span>
                <p className="text-xl font-bold text-text-primary tabular-nums">
                  {formatCurrency(paymentData.upiTotal)}
                </p>
                <span className="text-[10px] text-text-muted">Instant mobile pay</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-text-muted">Cards</span>
                <p className="text-xl font-bold text-text-primary tabular-nums">
                  {formatCurrency(paymentData.cardTotal)}
                </p>
                <span className="text-[10px] text-text-muted">POS swipe/contactless</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-text-muted">Cash Register</span>
                <p className="text-xl font-bold text-text-primary tabular-nums">
                  {formatCurrency(paymentData.cashTotal)}
                </p>
                <span className="text-[10px] text-text-muted">Drawer cash receipts</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-text-muted">Bank Transfer</span>
                <p className="text-xl font-bold text-text-primary tabular-nums">
                  {formatCurrency(paymentData.bankTotal)}
                </p>
                <span className="text-[10px] text-text-muted">Direct NEFT/RTGS</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-semibold text-text-muted">Other / Split</span>
                <p className="text-xl font-bold text-text-primary tabular-nums">
                  {formatCurrency(paymentData.otherTotal)}
                </p>
                <span className="text-[10px] text-text-muted">Wallets & dual tenders</span>
              </CardContent>
            </Card>
          </div>

          {/* Payment Method Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2 border-b border-border">
                <CardTitle className="text-sm font-bold">Payment Tender Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData.distribution}
                        dataKey="amount"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {paymentData.distribution.map((_, idx) => (
                          <Cell key={idx} fill={PAYMENT_COLORS[idx % PAYMENT_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(v: any) => [formatCurrency(Number(v)), 'Collected']}
                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {paymentData.distribution.map((d, idx) => (
                    <div key={d.method} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PAYMENT_COLORS[idx % PAYMENT_COLORS.length] }}
                        />
                        <span className="text-text-muted">{d.label}</span>
                      </div>
                      <span className="font-semibold text-text-primary tabular-nums">
                        {formatCurrency(d.amount)} ({d.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Trend of Collections */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2 border-b border-border">
                <CardTitle className="text-sm font-bold">Daily Collections by Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 w-full">
                  {paymentData.dailyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={paymentData.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(v) => v.slice(5)}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        />
                        <RechartsTooltip
                          formatter={(v: any) => formatCurrency(Number(v))}
                          contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Bar dataKey="upi" name="UPI" fill="#10B981" stackId="a" />
                        <Bar dataKey="card" name="Card" fill="#6366F1" stackId="a" />
                        <Bar dataKey="cash" name="Cash" fill="#F59E0B" stackId="a" />
                        <Bar dataKey="bank" name="Bank" fill="#3B82F6" stackId="a" />
                        <Bar dataKey="other" name="Other" fill="#8B5CF6" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-text-muted">
                      No payment data available in this date range.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold">Payment Transactions</CardTitle>
                <p className="text-xs text-text-muted mt-0.5">
                  Itemized tender collections and payment receipts
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Filter by bill, guest, tender…"
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
                      <th className="py-2.5 px-4">Bill #</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Client</th>
                      <th className="py-2.5 px-4 text-center">Tender Method</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTransactions.slice(0, 30).map((t) => (
                      <tr key={t.id} className="hover:bg-surface-hover/40 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-medium text-text-primary">
                          {t.billNumber}
                        </td>
                        <td className="py-2.5 px-4 text-text-muted tabular-nums">{t.date}</td>
                        <td className="py-2.5 px-4 font-medium text-text-primary">{t.clientName}</td>
                        <td className="py-2.5 px-4 text-center">
                          <Badge variant="primary" size="sm" className="font-mono text-[10px]">
                            {t.paymentMethod}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums font-bold text-text-primary">
                          {formatCurrency(t.amount)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <Badge variant="success" size="sm">
                            {t.status}
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
      )}
    </div>
  )
}
