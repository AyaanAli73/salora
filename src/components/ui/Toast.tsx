import React from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore, ToastItem } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastSingle key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

interface ToastSingleProps {
  toast: ToastItem
  onDismiss: () => void
}

const ToastSingle: React.FC<ToastSingleProps> = ({ toast, onDismiss }) => {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />,
    danger: <AlertCircle className="h-4 w-4 text-danger" aria-hidden="true" />,
    warning: <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />,
    info: <Info className="h-4 w-4 text-info" aria-hidden="true" />,
  }

  const borderAccents = {
    success: 'border-l-4 border-l-success',
    danger: 'border-l-4 border-l-danger',
    warning: 'border-l-4 border-l-warning',
    info: 'border-l-4 border-l-info',
  }

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-surface border border-border shadow-xl',
        'transition-[opacity,transform] duration-200 animate-in slide-in-from-bottom-2',
        borderAccents[toast.type]
      )}
    >
      <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-xs font-semibold text-text-primary tracking-tight truncate">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
            {toast.message}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="rounded-lg p-1 text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}
