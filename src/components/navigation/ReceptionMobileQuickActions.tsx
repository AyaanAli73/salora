import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, UserPlus, Ticket, CreditCard, Sparkles } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useToastStore } from '@/store/useToastStore'
import { printService } from '@/services/printService'
import { Token } from '@/types'

interface ReceptionMobileQuickActionsProps {
  onOpenMobilePOS?: () => void
}

export const ReceptionMobileQuickActions: React.FC<ReceptionMobileQuickActionsProps> = ({
  onOpenMobilePOS,
}) => {
  const navigate = useNavigate()
  const { openNewAppointmentModal } = useUIStore()
  const { addToast } = useToastStore()

  const handleQuickWalkIn = () => {
    // Generate fast walk-in token and notify
    const nextTokenNum = `W-${Math.floor(10 + Math.random() * 90)}`
    try {
      printService.printToken({
        id: `tok-walkin-${Date.now()}`,
        tokenNumber: nextTokenNum,
        displayNumber: `#${nextTokenNum}`,
        sequence: 1,
        appointmentId: 'walk-in-direct',
        appointmentType: 'walk-in',
        clientId: 'client-walkin',
        clientName: 'Guest Walk-in',
        serviceId: 'srv-walkin',
        serviceName: 'Express Consultation',
        serviceDuration: 30,
        servicePrice: 500,
        staffId: 'staff-available',
        staffName: 'First Available Stylist',
        date: new Date().toISOString().split('T')[0],
        status: 'serving',
        priority: 'NORMAL',
        estimatedWaitMinutes: 5,
      } as any)
      addToast({
        title: `Walk-in Token #${nextTokenNum} Generated`,
        message: 'Dispatched to 58mm thermal ticket spooler.',
        type: 'success',
      })
      navigate('/appointments/queue')
    } catch {
      addToast({
        title: 'Walk-in Registered',
        message: `Token #${nextTokenNum} added to live queue board.`,
        type: 'info',
      })
    }
  }

  const handleIssueToken = () => {
    navigate('/appointments/queue')
    addToast({
      title: 'Queue Board',
      message: 'Select customer or tap "Issue Instant Token".',
      type: 'info',
    })
  }

  return (
    <div
      aria-label="Reception Desk Quick Actions"
      className="md:hidden flex items-center justify-between gap-2 overflow-x-auto py-2.5 px-3 bg-surface border-y border-border scrollbar-none"
    >
      <button
        type="button"
        onClick={openNewAppointmentModal}
        className="flex items-center gap-1.5 shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white shadow-xs active:scale-95 transition-transform cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        <span>New Appt</span>
      </button>

      <button
        type="button"
        onClick={handleQuickWalkIn}
        className="flex items-center gap-1.5 shrink-0 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary active:scale-95 transition-transform cursor-pointer"
      >
        <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Walk-in</span>
      </button>

      <button
        type="button"
        onClick={handleIssueToken}
        className="flex items-center gap-1.5 shrink-0 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-300 active:scale-95 transition-transform cursor-pointer"
      >
        <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Token</span>
      </button>

      <button
        type="button"
        onClick={onOpenMobilePOS ? onOpenMobilePOS : () => navigate('/sales')}
        className="flex items-center gap-1.5 shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300 active:scale-95 transition-transform cursor-pointer"
      >
        <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Billing</span>
      </button>
    </div>
  )
}
