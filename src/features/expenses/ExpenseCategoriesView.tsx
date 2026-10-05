import React from 'react'
import {
  Tag,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building,
  Zap,
  Droplet,
  Wifi,
  Users,
  Boxes,
  Megaphone,
  Wrench,
  Scissors,
  Laptop,
  Truck,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ExpenseCategory, Expense } from '@/types'
import { formatCurrency, formatPercent } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface ExpenseCategoriesViewProps {
  categories: ExpenseCategory[]
  expenses: Expense[]
  onAddCategory: () => void
  onEditCategory: (category: ExpenseCategory) => void
  onToggleCategory: (category: ExpenseCategory) => void
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Building: <Building className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  Droplet: <Droplet className="h-4 w-4" />,
  Wifi: <Wifi className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  Boxes: <Boxes className="h-4 w-4" />,
  Megaphone: <Megaphone className="h-4 w-4" />,
  Wrench: <Wrench className="h-4 w-4" />,
  Scissors: <Scissors className="h-4 w-4" />,
  Laptop: <Laptop className="h-4 w-4" />,
  Truck: <Truck className="h-4 w-4" />,
  Sparkles: <Sparkles className="h-4 w-4" />,
  MoreHorizontal: <MoreHorizontal className="h-4 w-4" />,
  Tag: <Tag className="h-4 w-4" />,
}

export const ExpenseCategoriesView: React.FC<ExpenseCategoriesViewProps> = ({
  categories,
  expenses,
  onAddCategory,
  onEditCategory,
  onToggleCategory,
}) => {
  const currentMonthPrefix = new Date().toISOString().substring(0, 7)
  const thisMonthExpenses = expenses.filter(
    (e) => e.date.startsWith(currentMonthPrefix) && e.status === 'PAID'
  )

  // Compute spend per category
  const categorySpendMap: Record<string, number> = {}
  thisMonthExpenses.forEach((e) => {
    categorySpendMap[e.categoryId] = (categorySpendMap[e.categoryId] || 0) + e.amount
  })

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-border">
        <div>
          <h2 className="text-base font-bold text-text-primary">
            Operating Expense Categories & Budgets
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Configure standard expenditure centers, monthly target caps, and custom salon cost codes
          </p>
        </div>
        <Button type="button" variant="primary" size="sm" onClick={onAddCategory} className="text-xs shrink-0">
          <Plus className="h-3.5 w-3.5 mr-1" />
          <span>New Custom Category</span>
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const spentThisMonth = categorySpendMap[cat.id] || 0
          const budget = cat.monthlyBudget || 0
          const pacingPct = budget > 0 ? (spentThisMonth / budget) * 100 : 0
          const isOverBudget = budget > 0 && spentThisMonth > budget

          return (
            <Card
              key={cat.id}
              className={cn(
                'border-border/80 transition-shadow hover:shadow-sm flex flex-col justify-between',
                !cat.active && 'opacity-60 bg-surface-subtle/40'
              )}
            >
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      {ICON_MAP[cat.icon] || <Tag className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-text-primary truncate">{cat.name}</h3>
                        {cat.isDefault ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-surface-subtle text-text-muted border border-border/80 uppercase">
                            Default
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                        {cat.description || 'No description provided'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditCategory(cat)}
                    aria-label={`Edit category ${cat.name}`}
                    className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors shrink-0"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Monthly Budget & Pacing */}
                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Spent this month:</span>
                    <span className="font-bold font-mono text-text-primary tabular-nums">
                      {formatCurrency(spentThisMonth)}
                    </span>
                  </div>

                  {budget > 0 ? (
                    <>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-text-muted">Monthly Cap:</span>
                        <span className="font-medium text-text-secondary font-mono">
                          {formatCurrency(budget)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-surface-subtle overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            isOverBudget ? 'bg-rose-500' : 'bg-primary'
                          )}
                          style={{ width: `${Math.min(pacingPct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className={cn('font-bold', isOverBudget ? 'text-rose-500' : 'text-text-muted')}>
                          {pacingPct.toFixed(1)}% of budget
                        </span>
                        <span className="text-text-muted font-mono">
                          {isOverBudget
                            ? `+${formatCurrency(spentThisMonth - budget)} over`
                            : `${formatCurrency(budget - spentThisMonth)} remaining`}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-text-muted italic pt-1">
                      No monthly budget target configured
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
