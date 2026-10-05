import React, { useState } from 'react'
import { Clock, X, Sparkles, AlertCircle } from 'lucide-react'
import { StaffShift } from '@/types'
import { staffAttendanceService } from '@/services/staffAttendanceService'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/useToastStore'

interface ShiftModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  shiftToEdit?: StaffShift | null
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
]

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  shiftToEdit,
}) => {
  const { addToast } = useToastStore()
  const isEditing = Boolean(shiftToEdit)

  const [name, setName] = useState(shiftToEdit?.name || '')
  const [code, setCode] = useState(shiftToEdit?.code || '')
  const [startTime, setStartTime] = useState(shiftToEdit?.startTime || '09:00')
  const [endTime, setEndTime] = useState(shiftToEdit?.endTime || '17:00')
  const [unpaidBreakMinutes, setUnpaidBreakMinutes] = useState(shiftToEdit?.unpaidBreakMinutes ?? 60)
  const [color, setColor] = useState(shiftToEdit?.color || '#3B82F6')
  const [description, setDescription] = useState(shiftToEdit?.description || '')
  const [active, setActive] = useState(shiftToEdit?.active ?? true)

  if (!isOpen) return null

  const handleApplyPreset = (presetName: string, start: string, end: string, pCode: string, pColor: string) => {
    setName(presetName)
    setCode(pCode)
    setStartTime(start)
    setEndTime(end)
    setColor(pColor)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      addToast({ title: 'Validation Error', message: 'Shift name is required.', type: 'danger' })
      return
    }

    try {
      if (isEditing && shiftToEdit) {
        staffAttendanceService.updateShift(shiftToEdit.id, {
          name,
          code: code || name.slice(0, 3).toUpperCase(),
          startTime,
          endTime,
          unpaidBreakMinutes: Number(unpaidBreakMinutes) || 0,
          color,
          description,
          active,
        })
        addToast({
          title: 'Shift Updated',
          message: `Shift template "${name}" has been updated.`,
          type: 'success',
        })
      } else {
        staffAttendanceService.createShift({
          name,
          code: code || name.slice(0, 3).toUpperCase(),
          startTime,
          endTime,
          unpaidBreakMinutes: Number(unpaidBreakMinutes) || 0,
          color,
          description,
          active: true,
          isDefault: false,
        })
        addToast({
          title: 'Shift Created',
          message: `Shift template "${name}" created successfully.`,
          type: 'success',
        })
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save shift'
      addToast({ title: 'Error', message: msg, type: 'danger' })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shift-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: color }}
            >
              <Clock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="shift-modal-title" className="text-base font-bold text-text-primary">
                {isEditing ? 'Edit Shift Template' : 'Create New Shift'}
              </h2>
              <p className="text-xs text-text-muted">
                Define standard working hours, color badges, and break rules
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shift modal"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Quick Presets for New Shift */}
          {!isEditing && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                Quick Preset Templates
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('Morning Shift', '09:00', '17:00', 'MRN', '#3B82F6')}
                  className="p-2 rounded-xl border border-border hover:border-primary/50 text-left transition-colors bg-muted/20 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="font-bold text-xs text-text-primary block">Morning</span>
                  <span className="text-[11px] text-text-muted tabular-nums">09:00 — 17:00</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('Evening Shift', '14:00', '22:00', 'EVN', '#F59E0B')}
                  className="p-2 rounded-xl border border-border hover:border-primary/50 text-left transition-colors bg-muted/20 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="font-bold text-xs text-text-primary block">Evening</span>
                  <span className="text-[11px] text-text-muted tabular-nums">14:00 — 22:00</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('Full Day General', '10:00', '19:00', 'GEN', '#10B981')}
                  className="p-2 rounded-xl border border-border hover:border-primary/50 text-left transition-colors bg-muted/20 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="font-bold text-xs text-text-primary block">Full Day</span>
                  <span className="text-[11px] text-text-muted tabular-nums">10:00 — 19:00</span>
                </button>
              </div>
            </div>
          )}

          {/* Shift Name & Code */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label htmlFor="shift-name" className="block text-xs font-semibold text-text-primary mb-1">
                Shift Name *
              </label>
              <input
                type="text"
                id="shift-name"
                name="shiftName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Morning Shift, Peak Weekend…"
                required
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
              />
            </div>
            <div>
              <label htmlFor="shift-code" className="block text-xs font-semibold text-text-primary mb-1">
                Short Code
              </label>
              <input
                type="text"
                id="shift-code"
                name="shiftCode"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="MRN"
                maxLength={4}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm font-mono uppercase text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
              />
            </div>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="shift-start" className="block text-xs font-semibold text-text-primary mb-1">
                Start Time *
              </label>
              <input
                type="time"
                id="shift-start"
                name="shiftStart"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
              />
            </div>
            <div>
              <label htmlFor="shift-end" className="block text-xs font-semibold text-text-primary mb-1">
                End Time *
              </label>
              <input
                type="time"
                id="shift-end"
                name="shiftEnd"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
              />
            </div>
          </div>

          {/* Unpaid Break Duration & Color Picker */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="shift-break" className="block text-xs font-semibold text-text-primary mb-1">
                Unpaid Break (Minutes)
              </label>
              <input
                type="number"
                id="shift-break"
                name="shiftBreak"
                min="0"
                max="180"
                step="5"
                value={unpaidBreakMinutes}
                onChange={(e) => setUnpaidBreakMinutes(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-text-primary tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
              />
              <span className="text-[11px] text-text-muted mt-0.5 block">
                Deducted from net working time
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Badge Color
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Select color ${c}`}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? '#000' : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="shift-desc" className="block text-xs font-semibold text-text-primary mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              id="shift-desc"
              name="shiftDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Covers salon opening and morning appointments"
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex flex-col sm:flex-row gap-2.5">
            <Button
              type="submit"
              variant="primary"
              className="flex-1 justify-center py-2.5 shadow-glow-primary/20"
            >
              {isEditing ? 'Save Shift Changes' : 'Create Shift'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="sm:w-28 justify-center"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
