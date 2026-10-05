import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import {
  TrendingUp,
  BarChart3,
  Sliders,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { DashboardWidgetConfig } from '@/types'
import { reportService } from '@/services/reportService'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/formatters'

const WIDGET_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6']

export const DashboardReportsWidgetArea: React.FC = () => {
  const navigate = useNavigate()
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>([])
  const [widgetDataMap, setWidgetDataMap] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const list = reportService.getDashboardWidgets().filter((w) => w.enabled)
    setWidgets(list)

    // Load data for each enabled widget
    const loadData = async () => {
      const dataMap: Record<string, any> = {}
      for (const w of list) {
        try {
          const res = await reportService.generateCustomReport({
            id: w.id,
            title: w.title,
            metric: w.metric,
            dimension: w.dimension,
            datePreset: 'this_month',
            startDate: '',
            endDate: '',
            chartType: w.chartType === 'kpi' ? 'bar' : w.chartType,
          })
          dataMap[w.id] = res
        } catch (err) {
          console.warn(`Error generating widget ${w.id}:`, err)
        }
      }
      setWidgetDataMap(dataMap)
      setIsLoading(false)
    }

    loadData()
  }, [])

  if (!isLoading && widgets.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Pinned Business Intelligence & Analytics
          </span>
        </div>
        <Link
          to="/reports"
          className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
        >
          <span>All Reports</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((widget) => {
          const res = widgetDataMap[widget.id]
          const isKpi = widget.chartType === 'kpi'

          return (
            <Card
              key={widget.id}
              className="hover:border-primary/40 transition-colors cursor-pointer group min-w-0 overflow-hidden"
              onClick={() => navigate(`/reports?tab=${widget.reportType}`)}
            >
              <CardHeader className="p-4 pb-2 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                    {widget.title}
                  </CardTitle>
                  <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-[10px] text-text-muted capitalize">
                  By {widget.dimension.replace('_', ' ')}
                </span>
              </CardHeader>
              <CardContent className="p-4 pt-3 space-y-2 min-w-0 overflow-hidden">
                {res ? (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-text-primary tabular-nums">
                        {widget.metric === 'revenue' || widget.metric === 'expenses'
                          ? formatCurrency(res.totalValue)
                          : res.totalValue.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-text-muted">This Month</span>
                    </div>

                    {!isKpi && res.data.length > 0 && (
                      <div className="h-20 w-full min-w-0 overflow-hidden pt-1">
                        {widget.chartType === 'area' ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={res.data.slice(0, 7)}>
                              <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#6366F1"
                                fill="#6366F1"
                                fillOpacity={0.2}
                                strokeWidth={1.5}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : widget.chartType === 'pie' ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={res.data.slice(0, 4)}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={22}
                                outerRadius={36}
                                paddingAngle={2}
                              >
                                {res.data.slice(0, 4).map((_: any, idx: number) => (
                                  <Cell key={idx} fill={WIDGET_COLORS[idx % WIDGET_COLORS.length]} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={res.data.slice(0, 5)}>
                              <Bar dataKey="value" fill="#6366F1" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-16 flex items-center justify-center text-xs text-text-muted animate-pulse">
                    Loading widget data…
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
