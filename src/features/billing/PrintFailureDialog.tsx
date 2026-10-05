import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, RotateCcw, Download, X } from 'lucide-react'

interface PrintFailureDialogProps {
  isOpen: boolean
  onClose: () => void
  onRetry: () => void
  onSavePDF: () => void
  errorMessage?: string
}

export const PrintFailureDialog: React.FC<PrintFailureDialogProps> = ({
  isOpen,
  onClose,
  onRetry,
  onSavePDF,
  errorMessage = 'Unable to print. Please check printer connection.',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center py-3 space-y-4">
        {/* Warning Icon */}
        <div className="mx-auto w-14 h-14 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-text-primary">
            Printer Connection Failed
          </h3>
          <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
            {errorMessage}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-surface-subtle border border-border text-left text-xs text-text-secondary space-y-1">
          <p className="font-semibold text-text-primary">Troubleshooting Suggestions:</p>
          <ul className="list-disc list-inside text-[11px] text-text-muted space-y-0.5">
            <li>Ensure USB / network thermal printer is powered ON.</li>
            <li>Verify browser has permission to trigger print dialogs.</li>
            <li>Alternatively, download the PDF copy for digital sharing.</li>
          </ul>
        </div>

        {/* Action Buttons: Retry, Cancel, Save PDF */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto flex-1 text-xs"
          >
            Cancel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose()
              onSavePDF()
            }}
            leftIcon={<Download className="h-3.5 w-3.5" />}
            className="w-full sm:w-auto flex-1 text-xs"
          >
            Save PDF
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose()
              onRetry()
            }}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            className="w-full sm:w-auto flex-1 text-xs font-bold shadow-glow-primary/30"
          >
            Retry
          </Button>
        </div>
      </div>
    </Modal>
  )
}
