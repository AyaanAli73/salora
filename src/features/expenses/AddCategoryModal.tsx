import React, { useState, useEffect } from 'react'
import { Tag, Palette, DollarSign } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ExpenseCategory } from '@/types'
import { expenseService } from '@/services/expenseService'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

interface AddCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (category: ExpenseCategory) => void
  initialCategory?: ExpenseCategory | null
}

const PRESET_COLORS = [
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#F43F5E', // Rose
  '#14B8A6', // Teal
  '#84CC16', // Lime
  '#D97706', // Orange
  '#64748B', // Slate
]

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCategory,
}) => {
  const { addToast } = useToastStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#8B5CF6')
  const [monthlyBudget, setMonthlyBudget] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setName(initialCategory.name)
        setDescription(initialCategory.description || '')
        setColor(initialCategory.color || '#8B5CF6')
        setMonthlyBudget(initialCategory.monthlyBudget ? initialCategory.monthlyBudget.toString() : '')
      } else {
        setName('')
        setDescription('')
        setColor('#8B5CF6')
        setMonthlyBudget('')
      }
      setError('')
    }
  }, [isOpen, initialCategory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Category name is required')
      return
    }

    setIsSubmitting(true)
    try {
      let savedCat: ExpenseCategory
      if (initialCategory) {
        savedCat = expenseService.updateCategory(initialCategory.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : undefined,
        })
        addToast({
          title: 'Category Updated',
          message: `Category "${savedCat.name}" has been updated.`,
          type: 'success',
        })
      } else {
        savedCat = expenseService.createCategory({
          name: name.trim(),
          description: description.trim() || undefined,
          isDefault: false,
          color,
          icon: 'Tag',
          monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : undefined,
          active: true,
        })
        addToast({
          title: 'Category Created',
          message: `Custom category "${savedCat.name}" has been created.`,
          type: 'success',
        })
      }

      onSuccess(savedCat)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save category')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialCategory ? 'Edit Category' : 'Create Custom Expense Category'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cat-name" className="block text-xs font-bold text-text-primary mb-1">
            Category Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="cat-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError('')
            }}
            placeholder="e.g., Refreshments & Coffee, Legal & Taxes, Uniforms..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
        </div>

        <div>
          <label htmlFor="cat-desc" className="block text-xs font-bold text-text-primary mb-1">
            Description
          </label>
          <input
            id="cat-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief scope of expenses under this category"
            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="cat-budget" className="block text-xs font-bold text-text-primary mb-1">
            Monthly Target Budget (₹)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-text-muted text-xs font-bold">₹</span>
            <input
              id="cat-budget"
              type="number"
              min="0"
              step="100"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              placeholder="e.g., 15000"
              className="w-full pl-8 pr-3 py-2 text-sm font-mono rounded-xl border border-border bg-surface text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <p className="text-[10px] text-text-muted mt-1">
            Enables visual budget pacing progress bars on the category dashboard.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-primary mb-2">Category Color Tag</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={cn(
                  'h-7 w-7 rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  color === c ? 'scale-110 ring-2 ring-primary ring-offset-2' : 'hover:scale-105'
                )}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {initialCategory ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
