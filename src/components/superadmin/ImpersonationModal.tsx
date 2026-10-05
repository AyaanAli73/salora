import React, { useState } from 'react'
import {
  ShieldAlert,
  KeyRound,
  FileText,
  AlertTriangle,
  ArrowRight,
  X,
} from 'lucide-react'
import { Tenant } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface ImpersonationModalProps {
  isOpen: boolean
  onClose: () => void
  tenant: Tenant | null
  onAuthorize: (tenantId: string, reason: string, ticketNumber?: string) => void
}

export const ImpersonationModal: React.FC<ImpersonationModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onAuthorize,
}) => {
  const [ticketNumber, setTicketNumber] = useState('')
  const [reason, setReason] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [error, setError] = useState('')

  if (!tenant) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Please provide an explicit authorization reason.')
      return
    }
    if (!understood) {
      setError('You must acknowledge the audit trail notice before proceeding.')
      return
    }

    onAuthorize(tenant.id, reason.trim(), ticketNumber.trim() || undefined)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Authorize Support Impersonation"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning Banner */}
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-text-primary space-y-1">
            <p className="font-bold text-amber-900 dark:text-amber-200">
              Controlled Support Access Mode
            </p>
            <p className="text-text-muted leading-relaxed">
              You are requesting administrative impersonation into{' '}
              <strong>{tenant.name}</strong>. In compliance with multi-tenant SaaS security
              guidelines, every action performed during this session is logged to immutable audit records.
            </p>
          </div>
        </div>

        {/* Target Details */}
        <div className="p-3 rounded-xl bg-surface-subtle border border-border grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-text-muted uppercase font-bold">Target Salon:</span>
            <p className="font-bold text-text-primary truncate">{tenant.name}</p>
          </div>
          <div>
            <span className="text-[10px] text-text-muted uppercase font-bold">Tenant Slug:</span>
            <p className="font-mono text-text-primary text-[11px] truncate">{tenant.slug}</p>
          </div>
          <div>
            <span className="text-[10px] text-text-muted uppercase font-bold">Salon Owner:</span>
            <p className="text-text-secondary truncate">{tenant.ownerName} ({tenant.ownerEmail})</p>
          </div>
          <div>
            <span className="text-[10px] text-text-muted uppercase font-bold">Active Plan:</span>
            <p className="text-text-secondary capitalize">{tenant.planId} ({tenant.status})</p>
          </div>
        </div>

        {/* Support Ticket Number (Optional) */}
        <div>
          <label className="text-xs font-bold text-text-primary block mb-1">
            Support Ticket / Reference ID (Optional)
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. TICK-9281"
              value={ticketNumber}
              onChange={(e) => {
                setTicketNumber(e.target.value)
                setError('')
              }}
              className="w-full text-xs rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Explicit Reason (Required) */}
        <div>
          <label className="text-xs font-bold text-text-primary block mb-1">
            Reason for Support Access *
          </label>
          <textarea
            required
            rows={3}
            placeholder="e.g. Investigating client sync discrepancy reported by frontdesk manager"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setError('')
            }}
            className="w-full text-xs rounded-xl border border-border bg-surface p-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Audit Agreement Checkbox */}
        <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => {
              setUnderstood(e.target.checked)
              setError('')
            }}
            className="mt-0.5 rounded border-border text-primary focus:ring-primary/30"
          />
          <span className="text-text-secondary leading-tight">
            I understand that a high-visibility support banner will remain active, and this session will be recorded in the tenant&rsquo;s security audit logs.
          </span>
        </label>

        {error && (
          <p className="text-xs text-rose-600 font-semibold">{error}</p>
        )}

        <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            disabled={!reason.trim() || !understood}
          >
            Authorize & Launch Support Mode
          </Button>
        </div>
      </form>
    </Modal>
  )
}
