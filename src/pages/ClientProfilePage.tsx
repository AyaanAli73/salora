import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserX } from 'lucide-react'
import { clientService } from '@/services/clientService'
import { appointmentService } from '@/services/appointmentService'
import { Client, Appointment } from '@/types'
import { ClientProfile, ClientForm } from '@/features/clients'
import { Button } from '@/components/ui/Button'
import { useToastStore } from '@/store/useToastStore'

export const ClientProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  const [client, setClient] = useState<Client | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)

  const loadClientData = async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const [clientData, clientAppts] = await Promise.all([
        clientService.getById(id),
        appointmentService.getByClientId(id),
      ])

      if (clientData) {
        setClient(clientData)
        setAppointments(clientAppts)
      } else {
        setClient(null)
      }
    } catch (err) {
      console.error('Failed to load client:', err)
      addToast({
        title: 'Error',
        message: 'Could not load client profile.',
        type: 'danger',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClientData()
  }, [id])

  const handleUpdateClient = async (updatedData: Partial<Client>) => {
    if (!id) return
    try {
      const updated = await clientService.update(id, updatedData)
      setClient(updated)
      addToast({
        title: 'Client Updated',
        message: `${updated.fullName}'s profile has been updated.`,
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Update Failed',
        message: 'Unable to update client details.',
        type: 'danger',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-8 bg-surface-subtle rounded-md w-36 animate-pulse" />
        <div className="h-44 bg-surface rounded-3xl border border-border animate-pulse p-6" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface rounded-2xl border border-border animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-surface rounded-3xl border border-border animate-pulse" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 rounded-full bg-danger-light text-danger-fg flex items-center justify-center">
          <UserX className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-text-primary">Client Not Found</h2>
          <p className="text-xs text-text-muted">
            The client record you are looking for does not exist or has been removed.
          </p>
        </div>
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate('/clients')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Return to Clients Directory
        </Button>
      </div>
    )
  }

  return (
    <div className="pb-12">
      <ClientProfile
        client={client}
        appointments={appointments}
        onEdit={() => setIsEditDrawerOpen(true)}
        onClientUpdated={(updated) => setClient(updated)}
        currency="INR"
      />

      {/* Edit Client Drawer */}
      <ClientForm
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        onSubmit={handleUpdateClient}
        initialData={client}
        asDrawer={true}
      />
    </div>
  )
}
