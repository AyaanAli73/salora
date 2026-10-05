import { StockTransfer, StockTransferItem, StockTransferStatus } from '@/types'
import { inventoryService } from './inventoryService'
import { auditLogService } from './auditLogService'

const STORAGE_KEY = 'SALORA_stock_transfers'

export const INITIAL_TRANSFERS: StockTransfer[] = [
  {
    id: 'trf-1',
    transferNumber: 'TRF-2026-001',
    sourceBranchId: 'branch-jodhpur',
    sourceBranchName: 'Salora Jodhpur',
    destinationBranchId: 'branch-jaipur',
    destinationBranchName: 'Salora Jaipur',
    items: [
      {
        productId: 'prod-1',
        productName: "L'Oréal Professionnel Serie Expert Absolut Repair Shampoo (500ml)",
        sku: 'LOR-ABS-SH500',
        quantity: 12,
        receivedQuantity: 12,
        unitCost: 850,
      },
      {
        productId: 'prod-2',
        productName: "L'Oréal Professionnel Absolut Repair Conditioner (200ml)",
        sku: 'LOR-ABS-CD200',
        quantity: 8,
        receivedQuantity: 8,
        unitCost: 650,
      },
    ],
    status: 'RECEIVED',
    notes: 'Seasonal replenishment for Jaipur lounge salon launch.',
    createdById: 'usr-1',
    createdByName: 'Ayaan (Owner)',
    approvedById: 'usr-1',
    approvedByName: 'Ayaan (Owner)',
    dispatchedById: 'usr-2',
    dispatchedByName: 'Priya Rathore',
    receivedById: 'usr-3',
    receivedByName: 'Amit Saxena',
    createdAt: '2026-09-10T10:00:00Z',
    approvedAt: '2026-09-10T11:30:00Z',
    dispatchedAt: '2026-09-11T09:00:00Z',
    receivedAt: '2026-09-12T16:00:00Z',
  },
  {
    id: 'trf-2',
    transferNumber: 'TRF-2026-002',
    sourceBranchId: 'branch-jodhpur',
    sourceBranchName: 'Salora Jodhpur',
    destinationBranchId: 'branch-bikaner',
    destinationBranchName: 'Salora Bikaner',
    items: [
      {
        productId: 'prod-4',
        productName: 'Wella Koleston Perfect Me+ 6/0 Dark Blonde (60ml)',
        sku: 'WEL-KP-60',
        quantity: 10,
        unitCost: 420,
      },
      {
        productId: 'prod-8',
        productName: 'Rica Brazilian Liposoluble Wax (800ml)',
        sku: 'RICA-BLW-800',
        quantity: 5,
        unitCost: 950,
      },
    ],
    status: 'IN_TRANSIT',
    notes: 'Dispatched via BlueDart express transit tracking #BD-882910.',
    createdById: 'usr-2',
    createdByName: 'Priya Rathore',
    approvedById: 'usr-1',
    approvedByName: 'Ayaan (Owner)',
    dispatchedById: 'usr-2',
    dispatchedByName: 'Priya Rathore',
    createdAt: '2026-09-24T14:00:00Z',
    approvedAt: '2026-09-24T15:30:00Z',
    dispatchedAt: '2026-09-25T08:30:00Z',
  },
  {
    id: 'trf-3',
    transferNumber: 'TRF-2026-003',
    sourceBranchId: 'branch-jaipur',
    sourceBranchName: 'Salora Jaipur',
    destinationBranchId: 'branch-udaipur',
    destinationBranchName: 'Salora Udaipur',
    items: [
      {
        productId: 'prod-6',
        productName: 'Dermalogica Special Cleansing Gel (250ml)',
        sku: 'DER-SCG-250',
        quantity: 4,
        unitCost: 1650,
      },
    ],
    status: 'APPROVED',
    notes: 'Approved by Jaipur Manager; awaiting courier pickup.',
    createdById: 'usr-3',
    createdByName: 'Amit Saxena',
    approvedById: 'usr-1',
    approvedByName: 'Ayaan (Owner)',
    createdAt: '2026-09-26T09:15:00Z',
    approvedAt: '2026-09-26T10:45:00Z',
  },
]

class StockTransferService {
  private transfers: StockTransfer[] = []

  constructor() {
    this.loadTransfers()
  }

  private loadTransfers(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.transfers = parsed
            return
          }
        }
      } catch (err) {
        console.error('Failed to load stock transfers:', err)
      }
    }
    this.transfers = [...INITIAL_TRANSFERS]
    this.persist()
  }

  private persist(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.transfers))
      } catch (err) {
        console.error('Failed to save stock transfers:', err)
      }
    }
  }

  public getAllTransfers(branchFilter?: string): StockTransfer[] {
    if (!branchFilter || branchFilter === 'all') {
      return [...this.transfers]
    }
    return this.transfers.filter(
      (t) => t.sourceBranchId === branchFilter || t.destinationBranchId === branchFilter
    )
  }

  public getTransferById(id: string): StockTransfer | undefined {
    return this.transfers.find((t) => t.id === id)
  }

  public createTransfer(params: {
    sourceBranchId: string
    sourceBranchName: string
    destinationBranchId: string
    destinationBranchName: string
    items: StockTransferItem[]
    notes?: string
    createdById?: string
    createdByName?: string
  }): StockTransfer {
    const nextNumber = `TRF-2026-${String(this.transfers.length + 1).padStart(3, '0')}`
    const newTransfer: StockTransfer = {
      id: `trf-${Date.now()}`,
      transferNumber: nextNumber,
      sourceBranchId: params.sourceBranchId,
      sourceBranchName: params.sourceBranchName,
      destinationBranchId: params.destinationBranchId,
      destinationBranchName: params.destinationBranchName,
      items: params.items,
      status: 'DRAFT',
      notes: params.notes,
      createdById: params.createdById || 'usr-1',
      createdByName: params.createdByName || 'Owner / Administrator',
      createdAt: new Date().toISOString(),
    }

    this.transfers.unshift(newTransfer)
    this.persist()

    auditLogService.log({
      action: 'INVENTORY_ADJUSTMENT',
      entityType: 'stock_transfer',
      entityId: newTransfer.id,
      performedBy: newTransfer.createdByName || 'Owner / Administrator',
      userRole: 'owner',
      details: `Created inter-branch transfer requisition #${newTransfer.transferNumber} from ${params.sourceBranchName} to ${params.destinationBranchName}`,
      metadata: { transferId: newTransfer.id, itemsCount: params.items.length },
    })

    return newTransfer
  }

  public approveTransfer(id: string, approverName = 'Ayaan (Owner)'): StockTransfer | null {
    const transfer = this.getTransferById(id)
    if (!transfer || transfer.status !== 'DRAFT') return null

    transfer.status = 'APPROVED'
    transfer.approvedByName = approverName
    transfer.approvedAt = new Date().toISOString()

    this.persist()

    auditLogService.log({
      action: 'INVENTORY_ADJUSTMENT',
      entityType: 'stock_transfer',
      entityId: transfer.id,
      performedBy: approverName,
      userRole: 'owner',
      details: `Approved stock transfer #${transfer.transferNumber} for dispatch`,
      metadata: { transferId: transfer.id },
    })

    return transfer
  }

  public dispatchTransfer(id: string, dispatcherName = 'Branch Dispatcher'): StockTransfer | null {
    const transfer = this.getTransferById(id)
    if (!transfer || (transfer.status !== 'APPROVED' && transfer.status !== 'DRAFT')) return null

    transfer.status = 'IN_TRANSIT'
    transfer.dispatchedByName = dispatcherName
    transfer.dispatchedAt = new Date().toISOString()

    // Decrement stock at source branch
    transfer.items.forEach((item) => {
      inventoryService.adjustBranchStock(item.productId, transfer.sourceBranchId, -item.quantity)
    })

    this.persist()

    auditLogService.log({
      action: 'INVENTORY_ADJUSTMENT',
      entityType: 'stock_transfer',
      entityId: transfer.id,
      performedBy: dispatcherName,
      userRole: 'dispatcher',
      details: `Dispatched stock transfer #${transfer.transferNumber} from ${transfer.sourceBranchName}. Stock deducted at source.`,
      metadata: { transferId: transfer.id },
    })

    return transfer
  }

  public receiveTransfer(
    id: string,
    receiverName = 'Branch Storekeeper',
    receivedQuantities?: Record<string, number>
  ): StockTransfer | null {
    const transfer = this.getTransferById(id)
    if (!transfer || transfer.status !== 'IN_TRANSIT') return null

    transfer.status = 'RECEIVED'
    transfer.receivedByName = receiverName
    transfer.receivedAt = new Date().toISOString()

    // Increment stock at destination branch
    transfer.items.forEach((item) => {
      const receivedQty =
        receivedQuantities && receivedQuantities[item.productId] !== undefined
          ? receivedQuantities[item.productId]
          : item.quantity
      item.receivedQuantity = receivedQty
      inventoryService.adjustBranchStock(item.productId, transfer.destinationBranchId, receivedQty)
    })

    this.persist()

    auditLogService.log({
      action: 'INVENTORY_ADJUSTMENT',
      entityType: 'stock_transfer',
      entityId: transfer.id,
      performedBy: receiverName,
      userRole: 'storekeeper',
      details: `Received stock transfer #${transfer.transferNumber} at ${transfer.destinationBranchName}. Destination stock updated.`,
      metadata: { transferId: transfer.id },
    })

    return transfer
  }

  public cancelTransfer(id: string, reason = 'Requisition cancelled'): StockTransfer | null {
    const transfer = this.getTransferById(id)
    if (!transfer || transfer.status === 'RECEIVED' || transfer.status === 'CANCELLED') return null

    // If it was already dispatched, rollback stock deduction at source
    if (transfer.status === 'IN_TRANSIT') {
      transfer.items.forEach((item) => {
        inventoryService.adjustBranchStock(item.productId, transfer.sourceBranchId, item.quantity)
      })
    }

    transfer.status = 'CANCELLED'
    transfer.cancelledAt = new Date().toISOString()
    transfer.cancelReason = reason

    this.persist()

    auditLogService.log({
      action: 'INVENTORY_ADJUSTMENT',
      entityType: 'stock_transfer',
      entityId: transfer.id,
      performedBy: 'Ayaan (Owner)',
      userRole: 'owner',
      details: `Cancelled stock transfer #${transfer.transferNumber}. Reason: ${reason}`,
      metadata: { transferId: transfer.id },
    })

    return transfer
  }
}

export const stockTransferService = new StockTransferService()
