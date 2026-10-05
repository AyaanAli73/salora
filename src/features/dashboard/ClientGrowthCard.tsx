import React from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts'
import { Users, TrendingUp, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { ClientGrowthPoint } from '@/types'
import { cn } from '@/utils/cn'

interface ClientGrowthCardProps {
  growthData: ClientGrowthPoint[]
  className?: string
}

export const ClientGrowthCard: React.FC<ClientGrowthCardProps> = ({
  growthData,
  className,
}) => {
  const hasAnyClients = growthData.some((p) => (p.newClients || 0) > 0 || (p.returningClients || 0) > 0)

  return (
    <Card className={cn('flex flex-col justify-between', className)}>
      <div>
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Client Growth</CardTitle>
                {hasAnyClients && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-light text-success-fg">
                    <TrendingUp className="h-3 w-3" aria-hidden="true" />
                    <span>Real-time</span>
                  </span>
                )}
              </div>
              <CardDescription>New vs Returning clients over past 6 months</CardDescription>
            </div>
            <Link
              to="/clients"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View Clients</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-text-primary">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary" aria-hidden="true" />
              <span>New Guests</span>
            </span>
            <span className="flex items-center gap-1.5 text-text-primary">
              <span className="h-2.5 w-2.5 rounded-sm bg-accent" aria-hidden="true" />
              <span>Returning Loyalists</span>
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-2 min-w-0 overflow-hidden">
          <div className="h-52 sm:h-56 w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={growthData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--color-surface))',
                    borderColor: 'rgb(var(--color-border))',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(val: any, name: any) => [
                    `${val} clients`,
                    name === 'newClients' ? 'New Guests' : 'Returning Loyalists',
                  ]}
                  labelStyle={{ fontWeight: 600, color: 'rgb(var(--color-text-primary))' }}
                />
                <Bar
                  dataKey="newClients"
                  name="newClients"
                  fill="#7C3AED"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="returningClients"
                  name="returningClients"
                  fill="#EC4899"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-2 pb-3">
        <Link
          to="/clients"
          className="w-full text-center text-xs font-semibold text-text-secondary hover:text-primary transition-[color] py-1"
        >
          View Client Directory & Retention Analytics &rarr;
        </Link>
      </CardFooter>
    </Card>
  )
}
