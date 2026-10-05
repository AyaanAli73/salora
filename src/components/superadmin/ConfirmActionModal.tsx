import React, { useState } from 'react'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Tenant, TenantStatus } from '@/types'

interface ConfirmActionModalProps {
  isOpen: boolean
  onClose: () => void
  tenant: Tenant | null
  targetStatus: TenantStatus
  onConfirm: (tenantId: string, status: TenantStatus, reason: string) => void
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  tenant,
  targetStatus,
  onConfirm,
}) => {
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')

  if (!tenant) return null

  const isSuspend = targetStatus === 'SUSPENDED'
  const isActivate = targetStatus === 'ACTIVE'

  const expectedMatch = tenant.slug.toUpperCase()
  const isConfirmationValid = isSuspend ? confirmText === expectedMatch : true

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Please provide a mandatory reason for this action.')
      return
    }
    if (isSuspend && confirmText !== expectedMatch) {
      setError(`Please type ${expectedMatch} to confirm suspension.`)
      return
    }

    onConfirm(tenant.id, targetStatus, reason.trim())
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSuspend ? 'Suspend Organization' : 'Activate Organization'}
      size="md"
    >
      <form onSubmit={handleAction} className="space-y-4 text-xs">
        <div
          className={
            isSuspend
              ? 'p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3'
              : 'p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-3'
          }
        >
          {isSuspend ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1">
            <p className="font-bold text-text-primary">
              {isSuspend
                ? `You are about to suspend "${tenant.name}"`
                : `Reactivating "${tenant.name}"`}
            </p>
            <p className="text-text-muted leading-relaxed">
              {isSuspend
                ? 'Suspending this salon will immediately prevent online bookings, halt client notifications, and restrict staff logins until reactivated.'
                : 'Reactivating this salon will restore live appointment booking, active staff workstation access, and normal billing operations.'}
            </p>
          </div>
        </div>

        <div>
          <label className="font-bold text-text-primary block mb-1">
            Administrative Justification / Reason *
          </label>
          <textarea
            required
            rows={2}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setError('')
            }}
            placeholder={
              isSuspend
                ? 'e.g. 15-day overdue invoice / client complaint review'
                : 'e.g. Payment receipt confirmed via bank transfer'
            }
            className="w-full rounded-xl border border-border bg-surface p-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {isSuspend && (
          <div>
            <label className="font-bold text-text-primary block mb-1">
              Confirm by typing slug: <span className="font-mono text-rose-600">{expectedMatch}</span>
            </label>
            <input
              type="text"
              required
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value.toUpperCase())
                setError('')
              }}
              placeholder={expectedMatch}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>
        )}

        {error && <p className="text-rose-600 font-semibold">{error}</p>}

        <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!reason.trim() || !isConfirmationValid}
            className={
              isSuspend
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }
          >
            {isSuspend ? 'Confirm Suspension' : 'Confirm Activation'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
