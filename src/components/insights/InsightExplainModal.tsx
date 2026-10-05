import React from 'react'
import { Link } from 'react-router-dom'
import {
  HelpCircle,
  Database,
  Calculator,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react'
import { BusinessInsight, InsightConfidence } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface InsightExplainModalProps {
  insight: BusinessInsight | null
  isOpen: boolean
  onClose: () => void
}

export const getConfidenceBadgeConfig = (confidence: InsightConfidence) => {
  switch (confidence) {
    case 'data_backed':
      return {
        label: 'Data-backed',
        variant: 'success' as const,
        description: 'Derived directly from verified, recorded salon database entries.',
      }
    case 'calculated':
      return {
        label: 'Calculated',
        variant: 'primary' as const,
        description: 'Derived through mathematical formulas, ratios, or comparative variance.',
      }
    case 'ai_generated':
      return {
        label: 'AI-generated',
        variant: 'accent' as const,
        description: 'Synthesized contextual narrative generated from verified business metrics.',
      }
    case 'estimated':
      return {
        label: 'Estimated',
        variant: 'warning' as const,
        description: 'Rule-based projection based on historical customer cadences (no booking certainty implied).',
      }
    default:
      return {
        label: 'Data-backed',
        variant: 'default' as const,
        description: 'Verified salon record.',
      }
  }
}

export const InsightExplainModal: React.FC<InsightExplainModalProps> = ({
  insight,
  isOpen,
  onClose,
}) => {
  if (!insight) return null

  const conf = getConfidenceBadgeConfig(insight.confidence)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Insight Transparency & Explainability"
      size="lg"
    >
      <div className="space-y-5 text-text-primary">
        {/* Header Summary */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              {insight.category} Insight
            </span>
            <span className="text-xs text-text-muted">•</span>
            <Badge variant={conf.variant} className="text-[10px]">
              {conf.label}
            </Badge>
          </div>
          <h3 className="text-base font-bold text-text-primary leading-snug">
            {insight.title}
          </h3>
          <p className="text-xs text-text-muted leading-relaxed">
            {conf.description}
          </p>
        </div>

        {/* 1. Why Am I Seeing This? */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span>Why am I seeing this?</span>
          </div>
          <p className="text-xs text-text-primary leading-relaxed p-3.5 rounded-xl bg-surface border border-border">
            {insight.explanation.why}
          </p>
        </div>

        {/* 2. Calculation Steps & Formula */}
        {insight.explanation.calculationSteps && insight.explanation.calculationSteps.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-accent" />
              <span>Calculation &amp; Verification Methodology</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2">
              <ol className="list-decimal list-inside text-xs text-text-muted space-y-1.5 leading-relaxed">
                {insight.explanation.calculationSteps.map((step, idx) => (
                  <li key={idx} className="text-text-secondary">
                    <span className="text-text-primary font-medium">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* 3. Underlying Data Sample */}
        {insight.explanation.underlyingDataSample &&
          insight.explanation.underlyingDataSample.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Underlying Metric Data Sample</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {insight.explanation.underlyingDataSample.map((sample, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-subtle border border-border flex items-center justify-between text-xs"
                  >
                    <span className="text-text-muted font-medium truncate max-w-[65%]">
                      {sample.label}
                    </span>
                    <span className="font-bold text-text-primary tabular-nums">
                      {sample.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* 4. Evaluated Scope & Datasets */}
        <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text-secondary flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Evaluated Period:
            </span>
            <span className="font-bold text-text-primary">{insight.dateRange}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text-secondary flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-primary" />
              Source Datasets:
            </span>
            <span className="font-medium text-text-primary">
              {insight.explanation.sourceDatasets.join(', ')}
            </span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          {insight.action && (
            <Link to={insight.action.path} onClick={onClose}>
              <Button variant="primary" size="sm" className="shadow-xs">
                <span>{insight.action.label}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Modal>
  )
}
