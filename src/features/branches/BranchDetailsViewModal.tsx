import React from 'react'
import {
  X,
  Building2,
  MapPin,
  Clock,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react'
import { Branch } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface BranchDetailsViewModalProps {
  branch: Branch | null
  isOpen: boolean
  onClose: () => void
  onEdit: (branch: Branch) => void
}

export const BranchDetailsViewModal: React.FC<BranchDetailsViewModalProps> = ({
  branch,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !branch) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="branch-detail-title"
    >
      <div className="relative w-full max-w-2xl max-h-[88vh] bg-surface rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-primary/15 via-primary/5 to-surface border-b border-border flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Building2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="branch-detail-title" className="text-lg font-bold text-text-primary">
                  {branch.name}
                </h2>
                <Badge variant={branch.status === 'ACTIVE' ? 'success' : 'default'} size="sm">
                  {branch.status}
                </Badge>
                {branch.isHeadquarters && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    HQ Flagship
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5 font-mono">
                <span>Code: {branch.code}</span>
                <span>•</span>
                <span>Prefix: {branch.invoicePrefix || `INV-${branch.code}`}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close branch modal"
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-2">
              <p className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                Physical Location
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {branch.address}
                <br />
                {branch.city}, {branch.state} — {branch.pincode}
              </p>
              <p className="text-[11px] text-text-muted font-mono">
                Timezone: {branch.timezone} • Currency: {branch.currency}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-2">
              <p className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                Contact & Management
              </p>
              <p className="text-xs text-text-secondary flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-text-muted" />
                {branch.phone}
              </p>
              <p className="text-xs text-text-secondary flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-text-muted" />
                {branch.email}
              </p>
              <p className="text-xs text-text-secondary flex items-center gap-1.5">
                <User className="w-3 h-3 text-text-muted" />
                Manager: {branch.managerName || 'Assigned Supervisor'} (
                {branch.managerPhone || 'N/A'})
              </p>
            </div>
          </div>

          {/* Tax Information */}
          <div className="p-4 rounded-2xl border border-border bg-surface space-y-2.5">
            <p className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              Taxation & Regulatory Details
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-text-muted block">GSTIN</span>
                <span className="font-mono font-bold text-text-primary">
                  {branch.taxInfo?.gstin || 'Not Configured'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block">Tax Rate</span>
                <span className="font-bold text-text-primary">
                  {branch.taxInfo?.taxRate || 18}% (GST)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block">PAN</span>
                <span className="font-mono font-bold text-text-primary">
                  {branch.taxInfo?.pan || 'AAACG1234F'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block">Trade Reg</span>
                <span className="font-mono text-text-primary">
                  {branch.taxInfo?.taxRegistrationNumber || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Operating Hours Table */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              Standard Business Hours
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {branch.openingHours?.map((oh) => (
                <div
                  key={oh.day}
                  className="p-2.5 rounded-xl border border-border bg-surface-subtle text-xs"
                >
                  <span className="font-bold text-text-primary block text-[11px]">{oh.day}</span>
                  {oh.closed ? (
                    <span className="text-[11px] text-text-muted italic">Closed</span>
                  ) : (
                    <span className="text-[11px] text-text-secondary tabular-nums">
                      {oh.open} – {oh.close}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-surface-subtle/50">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose()
              onEdit(branch)
            }}
          >
            Edit Configuration
          </Button>
        </div>
      </div>
    </div>
  )
}
