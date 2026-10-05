import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { QuickAppointmentForm } from '@/features/appointments/QuickAppointmentForm'
import { useUIStore } from '@/store/useUIStore'
import { Sparkles } from 'lucide-react'

export const NewAppointmentModal: React.FC = () => {
  const { isNewAppointmentModalOpen, closeNewAppointmentModal } = useUIStore()

  if (!isNewAppointmentModalOpen) return null

  return (
    <Modal
      isOpen={isNewAppointmentModalOpen}
      onClose={closeNewAppointmentModal}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">New Appointment</h2>
            <p className="text-xs text-text-muted">Fast reception desk booking</p>
          </div>
        </div>
      }
      size="xl"
    >
      <div className="pt-1">
        <QuickAppointmentForm
          onSuccess={() => {
            closeNewAppointmentModal()
          }}
          onCancel={closeNewAppointmentModal}
          isModal={true}
        />
      </div>
    </Modal>
  )
}
