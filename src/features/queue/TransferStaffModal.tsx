import React, { useState, useEffect } from 'react'
import { Token, Staff } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { staffService } from '@/services/staffService'
import { useQueueStore } from '@/store/useQueueStore'
import { useToastStore } from '@/store/useToastStore'
import { ArrowRightLeft, User } from 'lucide-react'

interface TransferStaffModalProps {
  isOpen: boolean
  onClose: () => void
  token: Token | null
}

export const TransferStaffModal: React.FC<TransferStaffModalProps> = ({
  isOpen,
  onClose,
  token,
}) => {
  const { transferToken } = useQueueStore()
  const { addToast } = useToastStore()
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      staffService.getAll().then((st) => {
        setStaffList(st || [])
        if (st && st.length > 0 && !selectedStaffId) {
          setSelectedStaffId(st[0].id)
        }
      }).catch(() => {})
    }
  }, [isOpen])

  if (!token) return null

  const handleTransfer = async () => {
    const staff = staffList.find((s) => s.id === selectedStaffId)
    if (!staff) return

    setIsSubmitting(true)
    try {
      await transferToken(token.id, staff.id, staff.name, staff.avatarUrl)
      addToast({
        title: 'Customer Transferred',
        message: `Token ${token.displayNumber} transferred to ${staff.name}.`,
        type: 'success',
      })
      onClose()
    } catch (err: any) {
      addToast({
        title: 'Transfer Failed',
        message: err.message || 'Could not reassign customer.',
        type: 'danger',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Customer"
      description={`Reassign Token ${token.displayNumber} (${token.clientName}) to another specialist.`}
      size="sm"
    >
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-surface-subtle border border-border text-xs space-y-1">
          <p className="text-text-muted">
            Current Specialist:{' '}
            <strong className="text-text-primary">{token.staffName || 'Unassigned'}</strong>
          </p>
          <p className="text-text-muted">
            Treatment: <strong className="text-text-primary">{token.serviceName}</strong>
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-text-secondary">
            Select New Specialist
          </label>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {staffList.length === 0 ? (
              <p className="text-xs text-text-muted p-3 text-center">No staff records found in salon database.</p>
            ) : (
              staffList.map((staff) => {
                const isSelected = selectedStaffId === staff.id
                return (
                  <div
                    key={staff.id}
                    onClick={() => setSelectedStaffId(staff.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-text-primary ring-2 ring-primary/20'
                        : 'border-border bg-surface hover:bg-surface-hover text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={staff.name} src={staff.avatarUrl} size="sm" />
                      <div>
                        <p className="font-bold text-text-primary">{staff.name}</p>
                        <p className="text-[11px] text-text-muted">{staff.role}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-text-muted capitalize">
                      {staff.todayStatus?.replace('-', ' ') || 'Available'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleTransfer}
            isLoading={isSubmitting}
            leftIcon={<ArrowRightLeft className="h-4 w-4" />}
          >
            Confirm Transfer
          </Button>
        </div>
      </div>
    </Modal>
  )
}
