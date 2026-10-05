import React, { useState } from 'react'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface CancelSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  planName: string
  nextBillingDate: string
  onConfirmCancel: (reason: string) => void
}

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  isOpen,
  onClose,
  planName,
  nextBillingDate,
  onConfirmCancel,
}) => {
  const [reason, setReason] = useState('cost')
  const [customFeedback, setCustomFeedback] = useState('')

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault()
    const fullReason = `${reason}: ${customFeedback.trim() || 'No additional comments'}`
    onConfirmCancel(fullReason)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Salon Subscription"
      size="md"
    >
      <form onSubmit={handleCancel} className="space-y-4 text-xs">
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-text-primary">
              Are you sure you want to cancel your {planName} subscription?
            </p>
            <p className="text-text-muted leading-relaxed">
              Your subscription will remain active until the end of your billing cycle on{' '}
              <strong>{nextBillingDate}</strong>. After this date, your salon will transition to read-only access. No historical client or appointment records will be deleted.
            </p>
          </div>
        </div>

        <div>
          <label className="font-bold text-text-primary block mb-1">
            Reason for cancelling *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-xs rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none"
          >
            <option value="cost">Subscription cost / pricing</option>
            <option value="missing_features">Missing salon workflow features</option>
            <option value="switching">Switching to another management software</option>
            <option value="closing_salon">Temporarily closing or relocating salon</option>
            <option value="other">Other reason</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-text-primary block mb-1">
            How can we improve? (Optional)
          </label>
          <textarea
            rows={2}
            value={customFeedback}
            onChange={(e) => setCustomFeedback(e.target.value)}
            placeholder="Share feedback on how Salora could serve your salon better..."
            className="w-full rounded-xl border border-border bg-surface p-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Keep Subscription
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            Confirm Cancellation
          </Button>
        </div>
      </form>
    </Modal>
  )
}
