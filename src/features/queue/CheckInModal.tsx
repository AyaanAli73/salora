import React, { useState } from 'react'
import { Appointment, Token, TokenPriority } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { useQueueStore } from '@/store/useQueueStore'
import { useToastStore } from '@/store/useToastStore'
import { printService } from '@/services/printService'
import { TokenPrintTemplate } from './TokenPrintTemplate'
import {
  UserCheck,
  Clock,
  Scissors,
  User,
  Star,
  Printer,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface CheckInModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onSuccess?: (token: Token) => void
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}) => {
  const navigate = useNavigate()
  const { checkInAppointment } = useQueueStore()
  const { addToast } = useToastStore()

  const [priority, setPriority] = useState<TokenPriority>('NORMAL')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdToken, setCreatedToken] = useState<Token | null>(null)
  const [showPrintModal, setShowPrintModal] = useState(false)

  if (!appointment) return null

  const handleConfirmCheckIn = async () => {
    setIsSubmitting(true)
    try {
      const token = await checkInAppointment(appointment, priority)
      setCreatedToken(token)

      addToast({
        title: 'Check-In Confirmed',
        message: `Token ${token.displayNumber} generated for ${token.clientName}. Added to queue.`,
        type: 'success',
      })

      // If auto-print is enabled in settings, print automatically
      if (printService.getSettings().autoPrint) {
        printService.printToken(token)
      }

      if (onSuccess) {
        onSuccess(token)
      }
    } catch (err: any) {
      addToast({
        title: 'Check-In Failed',
        message: err.message || 'Could not check in customer.',
        type: 'danger',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseAll = () => {
    setCreatedToken(null)
    onClose()
  }

  return (
    <>
      <Modal
        isOpen={isOpen && !createdToken}
        onClose={onClose}
        title="Confirm Appointment Check-In"
        description="Verify guest arrival details to issue a sequential token and add to the queue."
        size="md"
      >
        <div className="space-y-5">
          {/* Appointment Verification Card */}
          <div className="p-4 rounded-xl border border-border bg-surface space-y-3.5">
            <div className="flex items-center gap-3">
              <Avatar
                name={appointment.clientName}
                src={appointment.clientAvatar}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-text-primary truncate">
                    {appointment.clientName}
                  </h4>
                  {appointment.priority === 'VIP' && (
                    <Badge variant="accent" size="sm">
                      VIP
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-text-muted">{appointment.clientPhone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/80 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-text-muted flex items-center gap-1 font-semibold uppercase tracking-wider">
                  <Clock className="h-3 w-3 text-primary" />
                  Appointment
                </span>
                <p className="font-bold text-text-primary tabular-nums">
                  {appointment.startTime} - {appointment.endTime}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-text-muted flex items-center gap-1 font-semibold uppercase tracking-wider">
                  <Scissors className="h-3 w-3 text-primary" />
                  Treatment
                </span>
                <p className="font-semibold text-text-primary truncate">
                  {appointment.serviceName}
                </p>
              </div>

              <div className="space-y-1 col-span-2 pt-1">
                <span className="text-[11px] text-text-muted flex items-center gap-1 font-semibold uppercase tracking-wider">
                  <User className="h-3 w-3 text-primary" />
                  Assigned Specialist
                </span>
                <p className="font-semibold text-text-primary">
                  {appointment.staffName}
                </p>
              </div>
            </div>
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text-secondary">
              Queue Priority Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('NORMAL')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                  priority === 'NORMAL'
                    ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                }`}
              >
                Normal
              </button>

              <button
                type="button"
                onClick={() => setPriority('VIP')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                  priority === 'VIP'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/20'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                }`}
              >
                <Star className="h-3 w-3 fill-current" />
                VIP
              </button>

              <button
                type="button"
                onClick={() => setPriority('EMERGENCY')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                  priority === 'EMERGENCY'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-2 ring-rose-500/20'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                }`}
              >
                <AlertCircle className="h-3 w-3" />
                Emergency
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmCheckIn}
              isLoading={isSubmitting}
              leftIcon={<UserCheck className="h-4 w-4" />}
              className="shadow-glow-primary/30"
            >
              Confirm Check-In & Generate Token
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal Showing Token Result */}
      {createdToken && (
        <Modal
          isOpen={Boolean(createdToken)}
          onClose={handleCloseAll}
          title="Customer Checked In"
          description="Token has been assigned and queued for service."
          size="sm"
        >
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Assigned Token
              </span>
              <p className="text-5xl font-black text-text-primary tracking-tight font-sans">
                {createdToken.displayNumber}
              </p>
              <p className="text-xs font-semibold text-text-secondary">
                {createdToken.clientName} • {createdToken.serviceName}
              </p>
              <p className="text-[11px] text-text-muted">
                Specialist: <strong className="text-text-primary">{createdToken.staffName}</strong> • Est. Wait: ~{createdToken.estimatedWaitMinutes || 15} min
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  printService.printToken(createdToken)
                }}
                leftIcon={<Printer className="h-4 w-4" />}
                className="w-full shadow-glow-primary/30"
              >
                Print Token Slip
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleCloseAll()
                    navigate('/appointments/queue')
                  }}
                  leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
                  className="text-xs"
                >
                  View in Queue
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCloseAll}
                  className="text-xs"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Preview Modal */}
      {showPrintModal && createdToken && (
        <TokenPrintTemplate
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          token={createdToken}
        />
      )}
    </>
  )
}
