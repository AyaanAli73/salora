import React, { useState } from 'react'
import {
  Repeat,
  Calendar,
  Clock,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Building2,
  Tag,
  CreditCard,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RecurringExpense, ExpenseCategory } from '@/types'
import { expenseService } from '@/services/expenseService'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

interface RecurringExpensesViewProps {
  recurringExpenses: RecurringExpense[]
  categories: ExpenseCategory[]
  onAddRecurring: () => void
  onEditRecurring: (rec: RecurringExpense) => void
  onRefresh: () => void
}

export const RecurringExpensesView: React.FC<RecurringExpensesViewProps> = ({
  recurringExpenses,
  categories,
  onAddRecurring,
  onEditRecurring,
  onRefresh,
}) => {
  const { addToast } = useToastStore()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleToggle = (id: string, currentActive: boolean) => {
    expenseService.toggleRecurringExpense(id, !currentActive)
    addToast({
      title: !currentActive ? 'Recurring Plan Resumed' : 'Recurring Plan Paused',
      message: `The schedule is now ${!currentActive ? 'active' : 'paused'}.`,
      type: 'info',
    })
    onRefresh()
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove recurring schedule "${name}"? Existing generated vouchers will not be affected.`)) {
      expenseService.deleteRecurringExpense(id)
      addToast({
        title: 'Schedule Removed',
        message: `Recurring schedule "${name}" has been removed.`,
        type: 'info',
      })
      onRefresh()
    }
  }

  const handleRunAutomation = () => {
    setIsProcessing(true)
    try {
      const generated = expenseService.checkAndGenerateDueRecurring('Admin Automation')
      if (generated.length > 0) {
        addToast({
          title: 'Automation Completed',
          message: `Successfully generated ${generated.length} pending expense voucher${
            generated.length > 1 ? 's' : ''
          } due today.`,
          type: 'success',
        })
      } else {
        addToast({
          title: 'No Expenses Due',
          message: 'All active recurring schedules are up-to-date.',
          type: 'info',
        })
      }
      onRefresh()
    } catch (err: any) {
      addToast({
        title: 'Automation Failed',
        message: err.message || 'Could not process recurring expenses.',
        type: 'danger',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Hero Banner with Automated Scheduler Control */}
      <div className="p-5 rounded-2xl bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-primary/10 text-primary">
              <Repeat className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-text-primary">
              Recurring Expense Automation Engine
            </h2>
          </div>
          <p className="text-xs text-text-muted max-w-xl leading-relaxed">
            Automates the generation of periodic salon overheads (property rent, fiber internet, SaaS tools, and weekly dry cleaning).
            Background scheduler evaluates active rules and notifies front desk.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRunAutomation}
            isLoading={isProcessing}
            className="text-xs"
          >
            <Play className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            <span>Process Due Recurring</span>
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={onAddRecurring} className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Schedule Plan</span>
          </Button>
        </div>
      </div>

      {/* Recurring Schedules Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recurringExpenses.map((rec) => {
          const today = new Date().toISOString().split('T')[0]
          const isDue = rec.active && rec.nextDueDate <= today

          return (
            <Card
              key={rec.id}
              className={cn(
                'border-border/80 transition-shadow hover:shadow-sm flex flex-col justify-between',
                !rec.active && 'opacity-60 bg-surface-subtle/40',
                isDue && 'border-amber-400 dark:border-amber-600/60 shadow-amber-500/10'
              )}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                        {rec.frequency}
                      </span>
                      {rec.autoGenerate && (
                        <span className="text-[10px] font-semibold text-text-muted flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Auto-generate</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-text-primary truncate">{rec.expenseName}</h3>
                    <p className="text-xs text-text-muted truncate mt-0.5">
                      Payee: {rec.supplierName || 'General Payee'} • {rec.categoryName}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-lg font-black font-mono text-text-primary tabular-nums block">
                      {formatCurrency(rec.amount)}
                    </span>
                    <span className="text-[10px] text-text-muted">per {rec.frequency.toLowerCase()}</span>
                  </div>
                </div>

                {/* Due Date & Reference */}
                <div className="p-2.5 rounded-xl bg-surface-subtle/70 border border-border/60 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase font-bold block">Next Due Date</span>
                    <span
                      className={cn(
                        'font-mono font-bold',
                        isDue ? 'text-amber-600' : 'text-text-primary'
                      )}
                    >
                      {formatDate(rec.nextDueDate)}
                    </span>
                    {isDue && (
                      <span className="ml-1 text-[9px] font-bold text-amber-600 uppercase">
                        (Due Today)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase font-bold block">Payment Mode</span>
                    <span className="font-medium text-text-primary truncate block">
                      {rec.paymentMethod}
                    </span>
                  </div>
                </div>

                {rec.description && (
                  <p className="text-[11px] text-text-secondary line-clamp-1 italic">
                    "{rec.description}"
                  </p>
                )}

                {/* Footer Controls */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggle(rec.id, rec.active)}
                    className="flex items-center gap-1.5 text-text-muted hover:text-text-primary font-semibold"
                  >
                    {rec.active ? (
                      <>
                        <ToggleRight className="h-5 w-5 text-emerald-600" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-5 w-5 text-text-muted" />
                        <span>Paused</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditRecurring(rec)}
                      className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                      title="Edit Schedule"
                      aria-label={`Edit ${rec.expenseName}`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rec.id, rec.expenseName)}
                      className="p-1.5 rounded-lg border border-border text-rose-500 hover:text-rose-700 hover:bg-surface transition-colors"
                      title="Delete Schedule"
                      aria-label={`Delete ${rec.expenseName}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
