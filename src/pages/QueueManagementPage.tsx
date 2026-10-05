import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Clock,
  CheckCircle2,
  PhoneCall,
  Plus,
  Tv,
  Printer,
  History,
  RotateCcw,
  Sparkles,
  Sliders,
  UserCheck,
} from 'lucide-react'
import { useQueueStore } from '@/store/useQueueStore'
import { staffService } from '@/services/staffService'
import { Staff, Token } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useToastStore } from '@/store/useToastStore'
import {
  NowServingPanel,
  QueueTable,
  StaffQueueStatusWidget,
  FastWalkInDrawer,
  PrinterSettingsModal,
  TransferStaffModal,
  TokenPrintTemplate,
  CallingAnnouncementBanner,
} from '@/features/queue'

export const QueueManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToastStore()
  const {
    tokens,
    queue,
    currentToken,
    stats,
    isLoading,
    loadTokens,
    resetDailyTokens,
  } = useQueueStore()

  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('all')

  // Modals
  const [isWalkInOpen, setIsWalkInOpen] = useState(false)
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false)
  const [transferringToken, setTransferringToken] = useState<Token | null>(null)
  const [printingToken, setPrintingToken] = useState<Token | null>(null)

  useEffect(() => {
    loadTokens()
    staffService.getAll().then((data) => setStaffList(data))
  }, [loadTokens])

  // Filtered queue based on selected staff
  const filteredQueue = queue.filter((t) => {
    if (selectedStaffFilter === 'all') return true
    return t.staffId === selectedStaffFilter
  })

  const handleResetQueue = async () => {
    if (window.confirm('Reset today\'s queue sequence? This will clear active waiting tokens for today.')) {
      await resetDailyTokens()
      addToast({
        title: 'Daily Queue Reset',
        message: 'Tokens sequence has been reset.',
        type: 'info',
      })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
            Queue Management
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Manage today's customer flow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* TV Display Link */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/queue-display', '_blank')}
            leftIcon={<Tv className="h-4 w-4 text-primary" />}
            title="Open customer-facing TV display"
          >
            Display Screen
          </Button>

          {/* Tokens History */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/appointments/tokens')}
            leftIcon={<History className="h-4 w-4" />}
          >
            Token History
          </Button>

          {/* Printer Settings */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrinterSettingsOpen(true)}
            leftIcon={<Sliders className="h-4 w-4" />}
            title="Printer & Ticket Setup"
          >
            Printer Settings
          </Button>

          {/* Add Walk-in */}
          <Button
            variant="primary"
            onClick={() => setIsWalkInOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
            className="shadow-glow-primary/30"
          >
            + Add Walk-In
          </Button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Waiting */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Waiting</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {stats.waiting}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">Guests in lounge</p>
            </div>
          </CardContent>
        </Card>

        {/* Called */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Called</span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <PhoneCall className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                {stats.called}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">Moving to chairs</p>
            </div>
          </CardContent>
        </Card>

        {/* In Service */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">In Service</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {stats.inService}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">Currently at stations</p>
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card hoverEffect>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted">Completed</span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {stats.completed}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">Served today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main 3-Column Layout: [Now Serving] | [Queue Table] | [Staff Status] */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: NOW SERVING PANEL (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <NowServingPanel
            token={currentToken}
            onOpenTransfer={(token) => setTransferringToken(token)}
            onOpenPrintPreview={(token) => setPrintingToken(token)}
          />

          {/* Quick Roster Filter notice */}
          {selectedStaffFilter !== 'all' && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
              <span className="text-primary font-medium">
                Filtering by specialist queue
              </span>
              <button
                type="button"
                onClick={() => setSelectedStaffFilter('all')}
                className="text-xs font-bold text-primary hover:underline"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>

        {/* Center Column: NEXT IN QUEUE LIST (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <QueueTable
            queue={filteredQueue}
            onOpenTransfer={(token) => setTransferringToken(token)}
            onOpenPrintPreview={(token) => setPrintingToken(token)}
          />
        </div>

        {/* Right Column: AVAILABLE SPECIALISTS (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <StaffQueueStatusWidget
            staffList={staffList}
            tokens={tokens}
            selectedStaffId={selectedStaffFilter}
            onSelectStaffId={setSelectedStaffFilter}
          />
        </div>
      </div>

      {/* Modals & Drawers */}
      <FastWalkInDrawer
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
      />

      <PrinterSettingsModal
        isOpen={isPrinterSettingsOpen}
        onClose={() => setIsPrinterSettingsOpen(false)}
      />

      {transferringToken && (
        <TransferStaffModal
          isOpen={Boolean(transferringToken)}
          onClose={() => setTransferringToken(null)}
          token={transferringToken}
        />
      )}

      {printingToken && (
        <TokenPrintTemplate
          isOpen={Boolean(printingToken)}
          onClose={() => setPrintingToken(null)}
          token={printingToken}
        />
      )}

      {/* Real-time sound notification announcement banner */}
      <CallingAnnouncementBanner />
    </div>
  )
}
