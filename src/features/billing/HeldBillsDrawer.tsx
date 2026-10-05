import React from 'react'
import { HeldBill } from '@/types'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { PauseCircle, Play, Trash2, Clock, User, Layers, ArrowRight } from 'lucide-react'

interface HeldBillsDrawerProps {
  isOpen: boolean
  onClose: () => void
  heldBills: HeldBill[]
  onResumeBill: (heldId: string) => void
  onDeleteBill: (heldId: string) => void
}

export const HeldBillsDrawer: React.FC<HeldBillsDrawerProps> = ({
  isOpen,
  onClose,
  heldBills,
  onResumeBill,
  onDeleteBill,
}) => {
  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return iso
    }
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Held Bills"
      description="Paused customer checkouts waiting to be resumed or settled."
      size="md"
    >
      <div className="space-y-4">
        {heldBills.length > 0 ? (
          <div className="space-y-3">
            {heldBills.map((held) => (
              <div
                key={held.id}
                className="p-4 rounded-2xl border border-border bg-surface hover:border-primary/40 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-primary text-sm">
                        {held.clientName}
                      </span>
                      <Badge variant="warning" size="sm">
                        Held
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(held.heldAt)}
                      </span>
                      <span>•</span>
                      <span>{held.itemsCount} item(s)</span>
                      <span>•</span>
                      <span>Specialist: {held.draftBill.staffName}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-text-primary tabular-nums block">
                      {formatCurrency(held.estimatedTotal)}
                    </span>
                    <span className="text-[10px] text-text-muted">Est. Amount</span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="p-2.5 rounded-xl bg-surface-subtle border border-border/80 text-xs space-y-1">
                  {held.draftBill.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-text-secondary">
                      <span className="truncate max-w-[200px]">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="tabular-nums font-medium">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  ))}

                  {held.note && (
                    <div className="pt-1.5 mt-1 border-t border-border/60 text-[11px] text-amber-700 dark:text-amber-400 font-medium italic">
                      Note: “{held.note}”
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteBill(held.id)}
                    leftIcon={<Trash2 className="h-3.5 w-3.5 text-rose-500" />}
                    className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    Discard
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onResumeBill(held.id)
                      onClose()
                    }}
                    leftIcon={<Play className="h-3.5 w-3.5" />}
                    className="text-xs shadow-glow-primary/20"
                  >
                    Resume Checkout
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-text-muted space-y-2">
            <PauseCircle className="h-10 w-10 mx-auto text-text-muted/40" />
            <p className="text-sm font-bold text-text-primary">No Held Bills</p>
            <p className="text-xs text-text-muted max-w-xs mx-auto">
              When a guest is not ready to pay immediately, click “Save & Hold” on the POS screen to pause their checkout.
            </p>
          </div>
        )}
      </div>
    </Drawer>
  )
}
