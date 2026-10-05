import React from 'react'
import {
  AlertTriangle,
  RotateCcw,
  PowerOff,
  ShieldAlert,
  Clock,
  Key,
  Database,
  ArrowRight,
} from 'lucide-react'
import { AutomationJobLog } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/utils/formatters'

interface JobErrorModalProps {
  job: AutomationJobLog | null
  isOpen: boolean
  onClose: () => void
  onRetry: (jobId: string) => void
  onDisableAutomation: (automationId: string) => void
  isRetrying?: boolean
}

export const JobErrorModal: React.FC<JobErrorModalProps> = ({
  job,
  isOpen,
  onClose,
  onRetry,
  onDisableAutomation,
  isRetrying = false,
}) => {
  if (!job) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Automation Job Failure Diagnostics"
      size="md"
    >
      <div className="space-y-4 text-text-primary">
        {/* Error Banner */}
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 min-w-0">
            <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400">
              Execution Error
            </h4>
            <p className="text-xs text-rose-800/90 dark:text-rose-300 font-mono leading-relaxed break-words">
              {job.error || 'Execution failed due to unhandled provider error or network timeout.'}
            </p>
          </div>
        </div>

        {/* Job Details Card */}
        <div className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Automation Rule:</span>
            <span className="font-bold text-text-primary">{job.automationName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-muted">Entity Target:</span>
            <span className="font-semibold text-text-primary">
              {job.customerName || job.entityName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-muted">Action Type:</span>
            <Badge variant="primary" className="text-[10px]">
              {job.actionType}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-muted">Retry Attempt:</span>
            <span className="font-bold text-text-primary tabular-nums">
              {job.retryCount} / {job.maxRetries}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-muted">Triggered At:</span>
            <span className="text-text-secondary tabular-nums">
              {formatDate(job.triggeredAt)}
            </span>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between font-mono text-[11px] text-text-muted truncate">
            <span className="flex items-center gap-1">
              <Key className="w-3 h-3 text-text-muted shrink-0" />
              Idempotency:
            </span>
            <span className="truncate max-w-[60%]" title={job.idempotencyKey}>
              {job.idempotencyKey}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDisableAutomation(job.automationId)}
            className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 w-full sm:w-auto"
          >
            <PowerOff className="w-3.5 h-3.5 mr-1.5" />
            Disable Automation
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onRetry(job.id)}
              disabled={isRetrying || job.retryCount >= job.maxRetries}
              className="text-xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isRetrying ? 'animate-spin' : ''}`} />
              {job.retryCount >= job.maxRetries ? 'Retry Limit Reached' : 'Retry Job Now'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
