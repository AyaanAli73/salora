import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Token } from '@/types'
import { getElapsedWaitMinutes, formatWaitTime } from '@/utils/queueUtils'
import { useQueueStore } from '@/store/useQueueStore'
import { useToastStore } from '@/store/useToastStore'
import { printService } from '@/services/printService'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import {
  PhoneCall,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  SkipForward,
  XCircle,
  Printer,
  Star,
  AlertCircle,
  Clock,
  MoreVertical,
  ArrowRightLeft,
  Receipt,
} from 'lucide-react'

interface QueueTableProps {
  queue: Token[]
  onOpenTransfer: (token: Token) => void
  onOpenPrintPreview: (token: Token) => void
}

export const QueueTable: React.FC<QueueTableProps> = ({
  queue,
  onOpenTransfer,
  onOpenPrintPreview,
}) => {
  const navigate = useNavigate()
  const { callToken, recallToken, startService, holdToken, resumeToken, skipToken, cancelToken } =
    useQueueStore()
  const { addToast } = useToastStore()
  const [activeMenuTokenId, setActiveMenuTokenId] = useState<string | null>(null)

  const handleCall = async (token: Token) => {
    try {
      await callToken(token.id)
      addToast({
        title: 'Customer Called',
        message: `Calling Token ${token.displayNumber} (${token.clientName}) to chair.`,
        type: 'info',
      })
    } catch (err: any) {
      addToast({
        title: 'Call Failed',
        message: err.message || 'Could not call customer.',
        type: 'danger',
      })
    }
  }

  const handleStartService = async (token: Token) => {
    try {
      await startService(token.id)
      addToast({
        title: 'Service Started',
        message: `Token ${token.displayNumber} is now in service with ${token.staffName}.`,
        type: 'success',
      })
    } catch (err: any) {
      addToast({
        title: 'Action Failed',
        message: err.message || 'Could not start service.',
        type: 'danger',
      })
    }
  }

  const handleHold = async (token: Token) => {
    try {
      await holdToken(token.id)
      addToast({
        title: 'Customer On Hold',
        message: `Token ${token.displayNumber} placed on hold.`,
        type: 'info',
      })
    } catch (err: any) {
      addToast({
        title: 'Hold Failed',
        message: err.message || 'Could not hold token.',
        type: 'danger',
      })
    }
  }

  const handleResume = async (token: Token) => {
    try {
      await resumeToken(token.id)
      addToast({
        title: 'Queue Resumed',
        message: `Token ${token.displayNumber} restored to active queue.`,
        type: 'success',
      })
    } catch (err: any) {
      addToast({
        title: 'Resume Failed',
        message: err.message || 'Could not resume token.',
        type: 'danger',
      })
    }
  }

  const handleSkip = async (token: Token) => {
    if (window.confirm(`Mark ${token.displayNumber} (${token.clientName}) as Skipped?`)) {
      try {
        await skipToken(token.id)
        addToast({
          title: 'Customer Skipped',
          message: `Token ${token.displayNumber} marked as skipped.`,
          type: 'warning',
        })
      } catch (err: any) {
        addToast({
          title: 'Skip Failed',
          message: err.message || 'Could not skip token.',
          type: 'danger',
        })
      }
    }
  }

  const handleCancel = async (token: Token) => {
    if (window.confirm(`Cancel token ${token.displayNumber}?`)) {
      try {
        await cancelToken(token.id)
        addToast({
          title: 'Token Cancelled',
          message: `Token ${token.displayNumber} has been cancelled.`,
          type: 'warning',
        })
      } catch (err: any) {
        addToast({
          title: 'Cancel Failed',
          message: err.message || 'Could not cancel token.',
          type: 'danger',
        })
      }
    }
  }

  const getStatusBadge = (status: Token['status']) => {
    switch (status) {
      case 'WAITING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Waiting
          </span>
        )
      case 'CALLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800 animate-pulse">
            <PhoneCall className="h-3 w-3" />
            Called
          </span>
        )
      case 'IN_SERVICE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            In Service
          </span>
        )
      case 'HOLD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <PauseCircle className="h-3 w-3" />
            On Hold
          </span>
        )
      case 'SKIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200">
            Skipped
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-subtle text-text-muted">
            {status}
          </span>
        )
    }
  }

  // Filter out completed and cancelled for the active queue list
  const nextInQueue = queue.filter(
    (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
  )

  return (
    <Card className="border border-border/80 bg-surface shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold text-text-primary font-sans">
            NEXT IN QUEUE
          </CardTitle>
          <p className="text-xs text-text-muted">
            Active customer sequence sorted by priority and check-in time.
          </p>
        </div>

        <Badge variant="primary" size="md" className="font-bold tabular-nums">
          {nextInQueue.length} Guests Waiting
        </Badge>
      </CardHeader>

      <CardContent className="p-0">
        {nextInQueue.length > 0 ? (
          <div className="divide-y divide-border/80">
            {nextInQueue.map((token) => {
              const elapsedWait = getElapsedWaitMinutes(token.checkedInAt)

              return (
                <div
                  key={token.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-3.5 hover:bg-surface-subtle/50 transition-colors ${
                    token.status === 'CALLED'
                      ? 'bg-sky-500/[0.04] border-l-4 border-l-sky-500'
                      : token.status === 'IN_SERVICE'
                      ? 'bg-emerald-500/[0.03] border-l-4 border-l-emerald-500'
                      : token.priority === 'VIP'
                      ? 'bg-amber-500/[0.02]'
                      : ''
                  }`}
                >
                  {/* Left: Token Number + Priority + Customer Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Big Token Badge */}
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-surface border border-border/90 shadow-sm shrink-0">
                      <span className="text-base font-black tracking-tight text-text-primary font-sans tabular-nums">
                        {token.displayNumber}
                      </span>
                      <span className="text-[9px] font-bold text-text-muted uppercase">
                        {token.appointmentType === 'WALK_IN' ? 'Walk-in' : 'Appt'}
                      </span>
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-text-primary truncate">
                          {token.clientName}
                        </span>

                        {token.priority === 'VIP' && (
                          <Badge variant="accent" size="sm" className="font-bold">
                            ⭐ VIP
                          </Badge>
                        )}

                        {token.priority === 'EMERGENCY' && (
                          <Badge variant="danger" size="sm" className="font-bold">
                            🔴 Emergency
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-text-secondary truncate">
                        {token.serviceName}
                        <span className="text-text-muted ml-1.5">
                          ({token.serviceDuration} min)
                        </span>
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-text-muted pt-0.5">
                        <span className="flex items-center gap-1 truncate">
                          Staff:{' '}
                          <strong className="text-text-secondary font-medium">
                            {token.staffName}
                          </strong>
                        </span>

                        <span className="flex items-center gap-1 tabular-nums text-amber-600 dark:text-amber-400 font-semibold">
                          <Clock className="h-3 w-3" />
                          Waiting {elapsedWait} min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Badge & Reception Actions */}
                  <div className="flex items-center gap-2 sm:self-center ml-auto sm:ml-0">
                    <div className="mr-1">{getStatusBadge(token.status)}</div>

                    {/* WAITING Actions */}
                    {token.status === 'WAITING' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleCall(token)}
                        leftIcon={<PhoneCall className="h-3.5 w-3.5" />}
                        className="shadow-glow-primary/30"
                      >
                        Call
                      </Button>
                    )}

                    {/* CALLED Actions */}
                    {token.status === 'CALLED' && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStartService(token)}
                          leftIcon={<PlayCircle className="h-3.5 w-3.5" />}
                          className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                        >
                          Start Service
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCall(token)}
                          title="Re-call"
                        >
                          Re-Call
                        </Button>
                      </div>
                    )}

                    {/* IN_SERVICE Actions */}
                    {token.status === 'IN_SERVICE' && (
                      <span className="text-xs text-emerald-600 font-bold px-2">
                        Serving at station
                      </span>
                    )}

                    {/* HOLD Actions */}
                    {token.status === 'HOLD' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResume(token)}
                        leftIcon={<RotateCcw className="h-3.5 w-3.5 text-primary" />}
                      >
                        Resume
                      </Button>
                    )}

                    {/* Quick Hold / Skip for WAITING */}
                    {token.status === 'WAITING' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleHold(token)}
                          title="Put on hold"
                          className="px-2"
                        >
                          <PauseCircle className="h-4 w-4 text-amber-500" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSkip(token)}
                          title="Skip absent guest"
                          className="px-2 text-rose-500 hover:text-rose-600"
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {/* Three-dot context menu */}
                    <div className="relative">
                      <button
                        type="button"
                        aria-label={`More options for ${token.displayNumber}`}
                        onClick={() =>
                          setActiveMenuTokenId(
                            activeMenuTokenId === token.id ? null : token.id
                          )
                        }
                        className="p-1.5 rounded-lg border border-border hover:bg-surface-hover text-text-muted transition-colors"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>

                      {activeMenuTokenId === token.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActiveMenuTokenId(null)}
                          />
                          <div className="absolute right-0 top-8 w-44 rounded-xl bg-surface border border-border shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuTokenId(null)
                                navigate(`/sales/billing?tokenId=${token.id}`)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-primary font-bold hover:bg-primary/10 text-left"
                            >
                              <Receipt className="h-3.5 w-3.5 text-primary" />
                              Create Bill / POS
                            </button>

                            <div className="my-1 border-t border-border" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuTokenId(null)
                                printService.printToken(token)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-text-primary hover:bg-surface-hover text-left"
                            >
                              <Printer className="h-3.5 w-3.5 text-text-muted" />
                              Print Token
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuTokenId(null)
                                onOpenPrintPreview(token)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-text-primary hover:bg-surface-hover text-left"
                            >
                              <Printer className="h-3.5 w-3.5 text-text-muted" />
                              Preview Slip
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuTokenId(null)
                                onOpenTransfer(token)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-text-primary hover:bg-surface-hover text-left"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5 text-text-muted" />
                              Transfer Specialist
                            </button>

                            <div className="my-1 border-t border-border" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuTokenId(null)
                                handleCancel(token)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Cancel Token
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-text-muted space-y-2">
            <Clock className="h-8 w-8 mx-auto opacity-30" />
            <p className="text-sm font-bold text-text-primary">No Customers Waiting in Queue</p>
            <p className="text-xs text-text-muted">
              Add walk-in guests or check in scheduled appointments to populate the queue.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
