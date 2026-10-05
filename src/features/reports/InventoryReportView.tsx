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
  Package,
  AlertTriangle,
  ShoppingCart,
  Boxes,
  Trash2,
  Sliders,
  DollarSign,
} from 'lucide-react'
import { InventoryReportData } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/formatters'

interface InventoryReportViewProps {
  data: InventoryReportData
}

export const InventoryReportView: React.FC<InventoryReportViewProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* 1. Inventory Summary Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-primary">Total Stock Value</span>
            <p className="text-xl font-bold text-primary tabular-nums">
              {formatCurrency(data.totalStockValue)}
            </p>
            <span className="text-[10px] text-text-muted">At purchase cost value</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">Purchases</span>
            <p className="text-xl font-bold text-text-primary tabular-nums">
              {formatCurrency(data.purchasesTotal)}
            </p>
            <span className="text-[10px] text-text-muted">Restocked inventory</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-text-muted">In-Salon Consumption</span>
            <p className="text-xl font-bold text-text-primary tabular-nums">
              {formatCurrency(data.consumptionTotal)}
            </p>
            <span className="text-[10px] text-text-muted">Used during rituals</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Retail Sales
            </span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(data.retailSalesTotal)}
            </p>
            <span className="text-[10px] text-text-muted">Client take-home retail</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Adjustments
            </span>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {formatCurrency(data.adjustmentsTotal)}
            </p>
            <span className="text-[10px] text-text-muted">Audit write-offs</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-rose-500">Expired / Waste</span>
            <p className="text-xl font-bold text-rose-500 tabular-nums">
              {formatCurrency(data.expiredWasteTotal)}
            </p>
            <span className="text-[10px] text-text-muted">Discarded chemicals</span>
          </CardContent>
        </Card>
      </div>

      {/* 2. Category Distribution Chart */}
      <Card>
        <CardHeader className="pb-2 border-b border-border">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Stock Value by Department</span>
            <span className="text-[11px] font-normal text-text-muted">Category Asset Value</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.categoryDistribution}
                margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis
                  dataKey="category"
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
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Valuation']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. Low Stock Exception Report */}
      <Card>
        <CardHeader className="pb-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <CardTitle className="text-sm font-bold">Low Stock & Reorder Alert Report</CardTitle>
          </div>
          <Badge variant="warning" size="sm">
            {data.lowStockCount} Items Below Threshold
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-hover/50 text-text-muted font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4 font-mono">SKU</th>
                  <th className="py-2.5 px-4 text-right">Current Stock</th>
                  <th className="py-2.5 px-4 text-right">Min Stock</th>
                  <th className="py-2.5 px-4 text-right">Unit Cost</th>
                  <th className="py-2.5 px-4 text-right">Retail Price</th>
                  <th className="py-2.5 px-4 text-center">Urgency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.lowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-hover/40 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-text-primary">{item.name}</td>
                    <td className="py-2.5 px-4 font-mono text-text-muted">{item.sku}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-bold text-rose-500">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-text-muted">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-text-muted">
                      {formatCurrency(item.costPrice)}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-text-primary">
                      {formatCurrency(item.retailPrice)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <Badge
                        variant={item.currentStock === 0 ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {item.currentStock === 0 ? 'Out of Stock' : 'Reorder Needed'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.lowStockItems.length === 0 && (
            <div className="p-8 text-center text-xs text-text-muted">
              All inventory items are currently above their safety stock threshold.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
