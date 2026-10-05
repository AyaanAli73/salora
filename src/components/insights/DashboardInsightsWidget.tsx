import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { insightsService } from '@/services/insightsService'
import { BusinessInsight } from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { InsightCard } from './InsightCard'
import { InsightExplainModal } from './InsightExplainModal'

export const DashboardInsightsWidget: React.FC = () => {
  const [selectedInsight, setSelectedInsight] = useState<BusinessInsight | null>(null)
  const { allInsights } = insightsService.getAllInsights({ period: 'this_month' })

  // Select top 3 relevant insights for high impact
  const topInsights = allInsights.slice(0, 3)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text-primary">Salora Insights</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                Rule &amp; Verified Data Layer
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Verified analytical signals covering client rebooking readiness, stock velocities, and longitudinal revenue.
            </p>
          </div>
        </div>

        <Link to="/insights">
          <Button variant="outline" size="sm" className="text-xs self-start sm:self-auto">
            <span>View All Insights</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topInsights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onExplain={(ins) => setSelectedInsight(ins)}
          />
        ))}
      </div>

      {/* Explainability Transparency Modal */}
      <InsightExplainModal
        insight={selectedInsight}
        isOpen={Boolean(selectedInsight)}
        onClose={() => setSelectedInsight(null)}
      />
    </div>
  )
}
