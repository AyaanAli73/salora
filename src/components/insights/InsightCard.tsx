import React from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Scissors,
  UserCheck,
  Package,
  Wallet,
  Megaphone,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react'
import { BusinessInsight, InsightCategory } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getConfidenceBadgeConfig } from './InsightExplainModal'
import { cn } from '@/utils/cn'

interface InsightCardProps {
  insight: BusinessInsight
  onExplain: (insight: BusinessInsight) => void
  className?: string
}

const getCategoryIcon = (cat: InsightCategory) => {
  switch (cat) {
    case 'customer':
      return Users
    case 'service':
      return Scissors
    case 'staff':
      return UserCheck
    case 'inventory':
      return Package
    case 'financial':
      return Wallet
    case 'marketing':
      return Megaphone
    default:
      return Sparkles
  }
}

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onExplain,
  className,
}) => {
  const Icon = getCategoryIcon(insight.category)
  const conf = getConfidenceBadgeConfig(insight.confidence)

  return (
    <Card
      className={cn(
        'p-5 transition-all duration-200 hover:shadow-md flex flex-col justify-between gap-4 border',
        insight.severity === 'alert'
          ? 'border-rose-500/40 bg-gradient-to-br from-rose-500/5 to-surface'
          : insight.severity === 'warning'
          ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-surface'
          : insight.severity === 'positive'
          ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-surface'
          : 'border-border bg-surface',
        className
      )}
    >
      <div className="space-y-3">
        {/* Top Badges & Confidence */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {insight.category}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge variant={conf.variant} className="text-[10px]">
              {conf.label}
            </Badge>
            <button
              type="button"
              onClick={() => onExplain(insight)}
              title="Why am I seeing this?"
              aria-label="Explain insight"
              className="text-text-muted hover:text-primary transition-colors p-1 rounded-lg hover:bg-surface-subtle"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title & Factual Description */}
        <div>
          <h4 className="text-sm font-bold text-text-primary leading-snug">
            {insight.title}
          </h4>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            {insight.description}
          </p>
        </div>

        {/* Supporting Metric Pill */}
        <div className="p-3 rounded-xl bg-surface-subtle border border-border flex items-center justify-between">
          <span className="text-xs font-medium text-text-secondary">
            {insight.supportingMetric.label}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-text-primary tabular-nums">
              {insight.supportingMetric.value}
            </span>
            {insight.supportingMetric.change && (
              <span
                className={cn(
                  'text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5',
                  insight.supportingMetric.trend === 'up'
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                    : insight.supportingMetric.trend === 'down'
                    ? 'text-rose-700 dark:text-rose-400 bg-rose-500/10'
                    : 'text-text-muted bg-border'
                )}
              >
                {insight.supportingMetric.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : insight.supportingMetric.trend === 'down' ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                <span>{insight.supportingMetric.change}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px]">
        <div className="flex items-center gap-1.5 text-text-muted truncate max-w-full">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{insight.dateRange}</span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => onExplain(insight)}
            className="text-primary hover:underline font-semibold"
          >
            Why am I seeing this?
          </button>

          {insight.action && (
            <Link to={insight.action.path}>
              <Button size="sm" variant="outline" className="text-xs h-7 px-2.5">
                <span>{insight.action.label}</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}
