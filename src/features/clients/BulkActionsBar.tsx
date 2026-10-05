import React, { useState } from 'react'
import { MessageSquare, Tag, Download, Trash2, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

interface BulkActionsBarProps {
  selectedCount: number
  onClearSelection: () => void
  onSendMessage: () => void
  onAddTag: (tag: string) => void
  onExport: () => void
  onDelete: () => void
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onClearSelection,
  onSendMessage,
  onAddTag,
  onExport,
  onDelete,
}) => {
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [tagInput, setTagInput] = useState('')

  if (selectedCount === 0) return null

  const handleApplyTag = () => {
    if (!tagInput.trim()) return
    onAddTag(tagInput.trim())
    setTagInput('')
    setIsTagModalOpen(false)
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-2 sm:gap-3 px-4 py-3 rounded-2xl bg-text-primary text-surface shadow-2xl border border-white/10 backdrop-blur-md">
          {/* Selected Count & Dismiss */}
          <div className="flex items-center gap-2 pr-2 border-r border-white/20">
            <span className="text-xs font-bold text-white tabular-nums">
              {selectedCount} selected
            </span>
            <button
              type="button"
              onClick={onClearSelection}
              aria-label="Clear Selection"
              className="p-1 rounded-md text-text-muted hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onSendMessage}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-[background-color]"
            >
              <MessageSquare className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span className="hidden sm:inline">Send Message</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTagModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-[background-color]"
            >
              <Tag className="h-3.5 w-3.5 text-teal-300" aria-hidden="true" />
              <span className="hidden sm:inline">Add Tag</span>
            </button>

            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-[background-color]"
            >
              <Download className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-danger/20 hover:bg-danger text-danger-fg transition-[background-color]"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Delete / Archive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Tag Modal */}
      <Modal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        title="Apply Tag to Selected Clients"
        description={`Add a custom label or tag to all ${selectedCount} selected clients.`}
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Tag Name"
            placeholder="e.g. VIP, Bridal Party, Newsletter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            autoFocus
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTagModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApplyTag}
              disabled={!tagInput.trim()}
              leftIcon={<Check className="h-3.5 w-3.5" />}
            >
              Apply Tag
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
