import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Token } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { useQueueStore } from '@/store/useQueueStore'
import { useToastStore } from '@/store/useToastStore'
import { printService } from '@/services/printService'
import {
  CheckCircle2,
  PauseCircle,
  ArrowRightLeft,
  MoreVertical,
  Printer,
  Clock,
  Scissors,
  User,
  Star,
  Sparkles,
  Volume2,
  Receipt,
} from 'lucide-react'

interface NowServingPanelProps {
  token: Token | null
  onOpenTransfer: (token: Token) => void
  onOpenPrintPreview: (token: Token) => void
}

export const NowServingPanel: React.FC<NowServingPanelProps> = ({
  token,
  onOpenTransfer,
  onOpenPrintPreview,
}) => {
  const navigate = useNavigate()
  const { completeToken, holdToken, recallToken, cancelToken } = useQueueStore()
  const { addToast } = useToastStore()
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  if (!token) {
    return (
      <Card className="border border-border/80 bg-surface shadow-sm overflow-hidden">
        <CardContent className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-subtle border border-border mx-auto flex items-center justify-center text-text-muted">
            <Clock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              NOW SERVING
            </span>
            <p className="text-xl font-bold text-text-primary">No Active Service</p>
            <p className="text-xs text-text-muted">
              Reception desk is clear. Call the next customer from the queue below.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleComplete = async () => {
    setIsProcessing(true)
    try {
      await completeToken(token.id)
      addToast({
        title: 'Service Completed',
        message: `Token ${token.displayNumber} marked as completed.`,
        type: 'success',
      })
    } catch (err: any) {
      addToast({
        title: 'Error',
        message: err.message || 'Could not complete token.',
        type: 'danger',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleHold = async () => {
    setIsProcessing(true)
    try {
      await holdToken(token.id)
      addToast({
        title: 'Token Placed on Hold',
        message: `Token ${token.displayNumber} put on hold.`,
        type: 'info',
      })
    } catch (err: any) {
      addToast({
        title: 'Error',
        message: err.message || 'Could not hold token.',
        type: 'danger',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRecall = async () => {
    try {
      await recallToken(token.id)
      addToast({
        title: 'Customer Announced',
        message: `Re-calling Token ${token.displayNumber} to chair.`,
        type: 'info',
      })
    } catch (err: any) {
      addToast({
        title: 'Error',
        message: err.message || 'Could not recall customer.',
        type: 'danger',
      })
    }
  }

  return (
    <Card className="relative overflow-hidden border-2 border-primary/40 bg-surface shadow-md">
      {/* Decorative Gradient Glow */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent pointer-events-none" />

      <CardContent className="p-6 space-y-5">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-primary">
              NOW SERVING
            </span>
          </div>

          <div className="flex items-center gap-2">
            {token.priority === 'VIP' && (
              <Badge variant="accent" size="sm" className="flex items-center gap-1 font-bold">
                <Star className="h-3 w-3 fill-current" />
                VIP
              </Badge>
            )}
            {token.priority === 'EMERGENCY' && (
              <Badge variant="danger" size="sm" className="font-bold">
                EMERGENCY
              </Badge>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {token.status === 'IN_SERVICE' ? 'In Service' : 'Called'}
            </span>
          </div>
        </div>

        {/* Large Prominent Token Number */}
        <div className="flex items-baseline justify-between gap-4 py-1">
          <div>
            <span className="text-6xl font-black tracking-tight text-text-primary font-sans">
              {token.displayNumber}
            </span>
            <span className="text-xs text-text-muted ml-2">
              (Token {token.tokenNumber})
            </span>
          </div>

          <button
            type="button"
            onClick={handleRecall}
            title="Re-announce customer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-subtle hover:bg-surface text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
          >
            <Volume2 className="h-3.5 w-3.5 text-primary" />
            <span>Re-Call</span>
          </button>
        </div>

        {/* Customer & Treatment Details */}
        <div className="p-4 rounded-xl bg-surface-subtle/80 border border-border space-y-3">
          <div className="flex items-center gap-3">
            <Avatar name={token.clientName} src={token.clientAvatar} size="md" />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-text-primary truncate">
                {token.clientName}
              </h3>
              <p className="text-xs text-text-muted">{token.clientPhone || 'Registered Guest'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-border/60 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                <Scissors className="h-3 w-3 text-primary" />
                Treatment
              </span>
              <p className="font-semibold text-text-primary truncate mt-0.5">
                {token.serviceName}
              </p>
              <span className="text-[10px] text-text-muted">
                {token.serviceDuration} min duration
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                <User className="h-3 w-3 text-primary" />
                Assigned Specialist
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Avatar name={token.staffName} src={token.staffAvatar} size="xs" />
                <span className="font-semibold text-text-primary truncate">
                  {token.staffName}
                </span>
              </div>
            </div>
          </div>

          {token.notes && (
            <div className="p-2.5 rounded-lg bg-surface border border-border text-[11px] text-text-secondary italic">
              “{token.notes}”
            </div>
          )}
        </div>

        {/* Action Buttons: [Complete] [Hold] [Transfer] [More] */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            variant="primary"
            onClick={handleComplete}
            isLoading={isProcessing}
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
            className="flex-1 shadow-glow-primary/30"
          >
            Complete
          </Button>

          <Button
            variant="outline"
            onClick={handleHold}
            isLoading={isProcessing}
            leftIcon={<PauseCircle className="h-4 w-4 text-amber-500" />}
          >
            Hold
          </Button>

          <Button
            variant="outline"
            onClick={() => onOpenTransfer(token)}
            leftIcon={<ArrowRightLeft className="h-4 w-4" />}
          >
            Transfer
          </Button>

          {/* More menu */}
          <div className="relative">
            <button
              type="button"
              aria-label="More options for active token"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 rounded-xl border border-border hover:bg-surface-hover text-text-muted transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMoreMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMoreMenu(false)}
                />
                <div className="absolute right-0 bottom-10 w-48 rounded-xl bg-surface border border-border shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false)
                      navigate(`/sales/billing?tokenId=${token.id}`)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-primary font-bold hover:bg-primary/10 text-left"
                  >
                    <Receipt className="h-3.5 w-3.5 text-primary" />
                    Create Bill / Checkout
                  </button>

                  <div className="my-1 border-t border-border" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false)
                      printService.printToken(token)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-text-primary hover:bg-surface-hover text-left"
                  >
                    <Printer className="h-3.5 w-3.5 text-text-muted" />
                    Print Token
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false)
                      onOpenPrintPreview(token)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-text-primary hover:bg-surface-hover text-left"
                  >
                    <Printer className="h-3.5 w-3.5 text-text-muted" />
                    Preview Token Slip
                  </button>

                  <div className="my-1 border-t border-border" />

                  <button
                    type="button"
                    onClick={async () => {
                      setShowMoreMenu(false)
                      if (window.confirm(`Cancel token ${token.displayNumber}?`)) {
                        await cancelToken(token.id)
                        addToast({
                          title: 'Token Cancelled',
                          message: `Token ${token.displayNumber} cancelled.`,
                          type: 'warning',
                        })
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left"
                  >
                    Cancel Token
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
