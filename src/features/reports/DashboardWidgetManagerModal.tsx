import React, { useState } from 'react'
import {
  X,
  LayoutDashboard,
  Check,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react'
import { DashboardWidgetConfig } from '@/types'
import { reportService } from '@/services/reportService'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToastStore } from '@/store/useToastStore'

interface DashboardWidgetManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export const DashboardWidgetManagerModal: React.FC<DashboardWidgetManagerModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
}) => {
  const { addToast } = useToastStore()
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(
    reportService.getDashboardWidgets()
  )

  if (!isOpen) return null

  const handleToggle = (id: string) => {
    const updated = reportService.toggleDashboardWidget(id)
    setWidgets(updated)
    if (onUpdate) onUpdate()
    addToast({
      title: 'Widget Updated',
      message: 'Dashboard layout preferences updated.',
      type: 'info',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl border border-border w-full max-w-xl shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-subtle">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-text-primary">Dashboard Analytics Widgets</h2>
              <p className="text-xs text-text-muted">
                Configure which report visualizations appear on your main dashboard
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface hover:bg-surface-hover/30 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary">{widget.title}</span>
                    <Badge variant="primary" size="sm" className="capitalize text-[10px]">
                      {widget.reportType}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-text-muted block capitalize">
                    {widget.chartType} chart • Grouped by {widget.dimension.replace('_', ' ')}
                  </span>
                </div>

                <Button
                  variant={widget.enabled ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => handleToggle(widget.id)}
                  className="text-xs h-7.5 px-3 flex items-center gap-1.5"
                >
                  {widget.enabled ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-text-muted" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Show</span>
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-surface-subtle border border-border text-xs text-text-muted leading-relaxed">
            <span className="font-semibold text-text-primary">Widget Tip: </span>
            You can also pin any custom report query directly to your dashboard from the <strong>Report Builder</strong> tab.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-border bg-surface-subtle">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
