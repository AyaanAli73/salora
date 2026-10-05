import React, { useState } from 'react'
import {
  AlertTriangle,
  ShoppingCart,
  ArrowRightLeft,
  CheckCircle2,
  Sparkles,
  TrendingDown,
  Info,
} from 'lucide-react'
import { SuggestedReorder } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CreatePurchaseOrderModal } from './CreatePurchaseOrderModal'
import { CreateStockTransferModal } from '@/features/inventory/CreateStockTransferModal'

interface SuggestedReordersTableProps {
  reorders: SuggestedReorder[]
  onRefresh: () => void
}

export const SuggestedReordersTable: React.FC<SuggestedReordersTableProps> = ({
  reorders,
  onRefresh,
}) => {
  const [selectedForPO, setSelectedForPO] = useState<{
    supplierId?: string
    branchId?: string
    items: { productId: string; quantity: number }[]
  } | null>(null)

  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferTargetBranch, setTransferTargetBranch] = useState('branch-jaipur')

  const totalEstimatedCost = reorders.reduce((sum, r) => sum + r.estimatedTotalCost, 0)
  const highUrgencyCount = reorders.filter((r) => r.urgency === 'HIGH').length

  const handleCreatePOForItem = (reorder: SuggestedReorder) => {
    setSelectedForPO({
      supplierId: reorder.supplierId,
      branchId: reorder.branchId,
      items: [{ productId: reorder.productId, quantity: reorder.suggestedQuantity }],
    })
  }

  const handleCreateBulkPO = () => {
    if (reorders.length === 0) return
    const first = reorders[0]
    setSelectedForPO({
      supplierId: first.supplierId,
      branchId: first.branchId,
      items: reorders.slice(0, 5).map((r) => ({ productId: r.productId, quantity: r.suggestedQuantity })),
    })
  }

  return (
    <div className="space-y-4">
      {/* Smart Analysis Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              Automated Reorder Recommendations
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">
              Formulated dynamically based on <strong>Current Stock</strong>, <strong>Minimum Safety Threshold</strong>, and <strong>Average Consumption Velocity</strong>.
              Orders are never placed automatically without administrative approval.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <div className="text-right">
            <span className="block text-[11px] text-text-muted">Estimated Reorder Total</span>
            <strong className="text-sm font-bold text-primary tabular-nums">
              {formatCurrency(totalEstimatedCost)}
            </strong>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={handleCreateBulkPO}
            disabled={reorders.length === 0}
            className="gap-1.5 text-xs h-9"
          >
            <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
            Issue Suggested PO
          </Button>
        </div>
      </div>

      {/* Suggested Reorder Table */}
      <div className="border border-border rounded-2xl overflow-hidden bg-surface shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle text-text-muted font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4">Product & Category</th>
                <th className="py-3 px-3">Salon Location</th>
                <th className="py-3 px-3 text-center">Current Stock</th>
                <th className="py-3 px-3 text-center">Safety Min</th>
                <th className="py-3 px-3 text-center">Avg Monthly Usage</th>
                <th className="py-3 px-3">Urgency</th>
                <th className="py-3 px-3 text-right bg-primary/5 text-primary font-bold">Suggested Reorder</th>
                <th className="py-3 px-3 text-right">Est. Unit Price</th>
                <th className="py-3 px-4 text-right">Estimated Cost</th>
                <th className="py-3 px-4 text-center">Procurement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reorders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-text-muted">
                    <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2 opacity-80" aria-hidden="true" />
                    <div className="text-sm font-semibold text-text-primary">All Stock Levels Optimal</div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      No salon products currently require replenishment based on current usage metrics.
                    </div>
                  </td>
                </tr>
              ) : (
                reorders.map((item) => (
                  <tr key={`${item.productId}-${item.branchId}`} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-primary">{item.productName}</div>
                      <div className="text-[11px] text-text-muted">
                        SKU: {item.sku} • {item.category}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-text-secondary">
                      {item.branchName}
                    </td>
                    <td className="py-3 px-3 text-center font-bold tabular-nums">
                      {item.currentStock <= 0 ? (
                        <span className="text-danger font-extrabold">0 (Out of stock)</span>
                      ) : item.currentStock <= item.minimumStock ? (
                        <span className="text-warning font-bold">{item.currentStock}</span>
                      ) : (
                        <span className="text-text-primary">{item.currentStock}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-text-muted tabular-nums">
                      {item.minimumStock}
                    </td>
                    <td className="py-3 px-3 text-center text-text-secondary font-medium tabular-nums">
                      ~{item.avgMonthlyUsage} / mo
                    </td>
                    <td className="py-3 px-3">
                      {item.urgency === 'HIGH' ? (
                        <Badge variant="danger" className="text-[10px] font-bold px-2 py-0.5 uppercase">
                          Critical Deficit
                        </Badge>
                      ) : item.urgency === 'MEDIUM' ? (
                        <Badge variant="warning" className="text-[10px] font-bold px-2 py-0.5 uppercase">
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px] font-semibold px-2 py-0.5 uppercase">
                          Replenish
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right bg-primary/5 font-extrabold text-primary tabular-nums">
                      +{item.suggestedQuantity} Units
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-text-secondary tabular-nums">
                      {formatCurrency(item.estimatedUnitCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-text-primary tabular-nums">
                      {formatCurrency(item.estimatedTotalCost)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleCreatePOForItem(item)}
                          className="h-7 text-[11px] px-2.5 gap-1"
                        >
                          <ShoppingCart className="h-3 w-3" aria-hidden="true" />
                          Order
                        </Button>
                        {item.branchId !== 'branch-jodhpur' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTransferTargetBranch(item.branchId)
                              setTransferModalOpen(true)
                            }}
                            title="Transfer from Jodhpur Central HQ"
                            className="h-7 text-[11px] px-2 gap-1 text-text-secondary"
                          >
                            <ArrowRightLeft className="h-3 w-3" aria-hidden="true" />
                            Transfer
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Modal with Prefill */}
      {selectedForPO && (
        <CreatePurchaseOrderModal
          isOpen={true}
          onClose={() => setSelectedForPO(null)}
          initialSupplierId={selectedForPO.supplierId}
          initialBranchId={selectedForPO.branchId}
          prefillItems={selectedForPO.items}
          onCreated={() => {
            setSelectedForPO(null)
            onRefresh()
          }}
        />
      )}

      {/* Inter-Branch Transfer Requisition Modal */}
      {transferModalOpen && (
        <CreateStockTransferModal
          isOpen={true}
          onClose={() => setTransferModalOpen(false)}
          onSuccess={() => {
            setTransferModalOpen(false)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}
