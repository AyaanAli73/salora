import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Layers,
  ArrowRight,
  Tv,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useQueueStore } from '@/store/useQueueStore'

export const LiveQueueWidget: React.FC = () => {
  const navigate = useNavigate()
  const { currentToken, queue, stats, loadTokens } = useQueueStore()

  useEffect(() => {
    loadTokens()
  }, [loadTokens])

  // Next in queue is the first WAITING or HOLD token that is NOT currently serving
  const nextToken = queue.find(
    (t) => (t.status === 'WAITING' || t.status === 'HOLD') && t.id !== currentToken?.id
  )

  const waitingCount = queue.filter(
    (t) => t.status === 'WAITING' || t.status === 'HOLD'
  ).length

  return (
    <Card className="border border-border/80 bg-gradient-to-br from-surface to-surface-subtle overflow-hidden relative group">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Live Queue</CardTitle>
              <CardDescription className="text-[11px]">Today's customer flow</CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge variant="primary" size="sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
              Live
            </Badge>

            <Link
              to="/queue-display"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface transition-colors"
              title="Open TV / Kiosk Display"
              aria-label="Open TV / Kiosk Display"
            >
              <Tv className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 pb-4 space-y-4">
        {/* Core Trio: Now Serving, Waiting Count, Next In Queue */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {/* 1. NOW SERVING */}
          <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col items-center justify-center min-w-0">
            <span className="text-[9px] font-black uppercase tracking-wider text-primary leading-tight">
              Now Serving
            </span>
            <p className="text-xl sm:text-2xl font-black text-text-primary tracking-tight font-sans leading-tight mt-1 tabular-nums">
              {currentToken ? currentToken.displayNumber : '#---'}
            </p>
            <span className="text-[10px] text-text-muted font-medium truncate max-w-full leading-tight mt-0.5">
              {currentToken ? currentToken.clientName : 'Ready'}
            </span>
          </div>

          {/* 2. WAITING COUNT */}
          <div className="p-2.5 rounded-xl bg-surface-subtle border border-border flex flex-col items-center justify-center min-w-0">
            <span className="text-[9px] font-black uppercase tracking-wider text-text-muted leading-tight">
              Waiting
            </span>
            <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-sans leading-tight mt-1 tabular-nums">
              {waitingCount}
            </p>
            <span className="text-[10px] text-text-muted font-medium leading-tight mt-0.5">In Lounge</span>
          </div>

          {/* 3. NEXT TOKEN */}
          <div className="p-2.5 rounded-xl bg-surface-subtle border border-border flex flex-col items-center justify-center min-w-0">
            <span className="text-[9px] font-black uppercase tracking-wider text-text-muted leading-tight">
              Next
            </span>
            <p className="text-xl sm:text-2xl font-black text-text-primary tracking-tight font-sans leading-tight mt-1 tabular-nums">
              {nextToken ? nextToken.displayNumber : '#---'}
            </p>
            <span className="text-[10px] text-text-muted font-medium truncate max-w-full leading-tight mt-0.5">
              {nextToken ? nextToken.clientName : 'Queue Clear'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          variant="primary"
          onClick={() => navigate('/appointments/queue')}
          className="w-full shadow-glow-primary/20 text-xs py-2 h-9"
          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
        >
          Open Queue
        </Button>
      </CardContent>
    </Card>
  )
}
