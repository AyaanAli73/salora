import React from 'react'
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
  Megaphone,
  Users,
  Target,
  Percent,
  TrendingUp,
  Award,
} from 'lucide-react'
import { MarketingReportData } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/formatters'

interface MarketingReportViewProps {
  data: MarketingReportData
}

export const MarketingReportView: React.FC<MarketingReportViewProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* 1. Header Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Campaigns Run</span>
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              {data.totalCampaigns}
            </p>
            <span className="text-[10px] text-text-muted">Broadcast & triggers</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Audience Reached</span>
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              {data.totalAudienceReached.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-text-muted">SMS & WhatsApp dispatched</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-primary">Conversions</span>
            <p className="text-2xl font-bold text-primary tabular-nums">
              {data.totalConversions}
            </p>
            <span className="text-[10px] text-text-muted">Claimed appointments</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Conversion Rate
            </span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {data.avgConversionRate}%
            </p>
            <span className="text-[10px] text-text-muted">Click-to-book performance</span>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-primary">Attributed Revenue</span>
            <p className="text-2xl font-bold text-primary tabular-nums">
              {formatCurrency(data.attributedRevenue)}
            </p>
            <span className="text-[10px] text-text-muted">Direct campaign billing</span>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Estimated ROI
            </span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {data.estimatedRoi}%
            </p>
            <span className="text-[10px] text-text-muted">Return on campaign cost</span>
          </CardContent>
        </Card>
      </div>

      {/* 2. ROI & Revenue Bar Chart */}
      <Card>
        <CardHeader className="pb-2 border-b border-border">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Campaign Attributed Revenue Pacing</span>
            <span className="text-[11px] font-normal text-text-muted">Revenue by Campaign</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.campaigns} margin={{ top: 10, right: 10, left: -10, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Attributed Revenue']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="revenueGenerated" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. Detailed Campaigns Performance Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-bold">Marketing Campaign Performance</CardTitle>
          <p className="text-xs text-text-muted mt-0.5">
            Engagement tracking and revenue attribution by campaign channel
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-hover/50 text-text-muted font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">Campaign Name</th>
                  <th className="py-2.5 px-4">Channel</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Dispatched</th>
                  <th className="py-2.5 px-4 text-right">Clicks</th>
                  <th className="py-2.5 px-4 text-right">Conversions</th>
                  <th className="py-2.5 px-4 text-right">Revenue</th>
                  <th className="py-2.5 px-4 text-right">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-hover/40 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-text-primary">{c.name}</td>
                    <td className="py-2.5 px-4 text-text-muted uppercase text-[10px] font-mono">
                      {c.channel}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <Badge variant="success" size="sm" className="capitalize">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-text-muted font-medium">
                      {c.sentCount}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-text-muted">
                      {c.clickCount}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-text-primary">
                      {c.conversions}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold text-text-primary">
                      {formatCurrency(c.revenueGenerated)}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                      +{c.roi}%
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
