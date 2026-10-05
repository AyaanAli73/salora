import React from 'react'
import { Appointment } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { QuickAppointmentForm } from './QuickAppointmentForm'
import { Sparkles, X } from 'lucide-react'

export interface AppointmentFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newAppointment: Appointment) => void
  initialDate?: string
  initialStaffId?: string
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialStaffId,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
          onSuccess={(newAppt) => {
            onSuccess(newAppt)
            onClose()
          }}
          onCancel={onClose}
          initialDate={initialDate}
          initialStaffId={initialStaffId}
          isModal={true}
        />
      </div>
    </Modal>
  )
}
