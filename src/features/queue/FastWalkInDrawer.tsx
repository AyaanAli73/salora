import React, { useState, useMemo } from 'react'
import { Token, TokenPriority, Client, Service, Staff } from '@/types'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SearchInput } from '@/components/ui/SearchInput'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { clientService } from '@/services/clientService'
import { serviceService } from '@/services/serviceService'
import { staffService } from '@/services/staffService'
import { useQueueStore } from '@/store/useQueueStore'
import { useToastStore } from '@/store/useToastStore'
import { printService } from '@/services/printService'
import {
  UserPlus,
  Search,
  Scissors,
  User,
  Star,
  Printer,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react'

interface FastWalkInDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (token: Token) => void
}

export const FastWalkInDrawer: React.FC<FastWalkInDrawerProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createWalkIn } = useQueueStore()
  const { addToast } = useToastStore()

  // Real database entities
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])

  // Form states
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing')
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')

  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState('any')
  const [priority, setPriority] = useState<TokenPriority>('NORMAL')
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdToken, setCreatedToken] = useState<Token | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      clientService.getAll().then((c) => setClients(c || [])).catch(() => {})
      serviceService.getAll().then((s) => {
        setServices(s || [])
        if (s && s.length > 0 && !selectedServiceId) {
          setSelectedServiceId(s[0].id)
        }
      }).catch(() => {})
      staffService.getAll().then((st) => setStaffList(st || [])).catch(() => {})
    }
  }, [isOpen])

  // Filter clients
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients.slice(0, 5)
    const q = clientSearch.toLowerCase()
    return clients.filter(
      (c) =>
        c.fullName?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q)
    )
  }, [clientSearch, clients])

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) || services[0] || null,
    [selectedServiceId, services]
  )

  const selectedStaff = useMemo(() => {
    if (selectedStaffId === 'any') {
      return { id: '', name: 'Any Available Specialist', avatarUrl: undefined }
    }
    return staffList.find((s) => s.id === selectedStaffId) || null
  }, [selectedStaffId, staffList])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const name = clientMode === 'existing' ? selectedClient?.fullName : newClientName.trim()
    const phone = clientMode === 'existing' ? selectedClient?.phone : newClientPhone.trim()

    if (!name) {
      addToast({
        title: 'Validation Error',
        message: 'Please select or enter client name.',
        type: 'danger',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const token = await createWalkIn({
        clientName: name,
        clientPhone: phone || '(Walk-in)',
        isNewClient: clientMode === 'new',
        serviceId: selectedService?.id || '',
        serviceName: selectedService?.name || '',
        serviceDuration: selectedService?.duration || 45,
        servicePrice: selectedService?.price || 120,
        staffId: selectedStaff?.id || '',
        staffName: selectedStaff?.name || 'Any Available Specialist',
        staffAvatar: selectedStaff?.avatarUrl,
        priority,
        notes: notes.trim(),
      })

      setCreatedToken(token)

      addToast({
        title: 'Walk-In Queued',
        message: `Token ${token.displayNumber} issued to ${token.clientName}.`,
        type: 'success',
      })

      // Auto-print check
      if (printService.getSettings().autoPrint) {
        printService.printToken(token)
      }

      if (onSuccess) {
        onSuccess(token)
      }
    } catch (err: any) {
      addToast({
        title: 'Walk-In Failed',
        message: err.message || 'Could not queue walk-in customer.',
        type: 'danger',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetAndClose = () => {
    setCreatedToken(null)
    setNewClientName('')
    setNewClientPhone('')
    setNotes('')
    onClose()
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={createdToken ? 'Token Issued' : 'Quick Walk-In Registration'}
      description={
        createdToken
          ? 'Guest is queued and ready to be called.'
          : 'Rapid front-desk queueing with automatic sequential token generation.'
      }
      size="md"
    >
      {!createdToken ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Quick Step Indicator */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-primary">
              <Zap className="h-4 w-4" />
              Fast Reception Flow
            </span>
            <span className="text-[11px] text-text-muted">Instant token assignment</span>
          </div>

          {/* STEP 1: Client Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                1. Customer Details
              </span>

              {/* Mode Switcher */}
              <div className="flex items-center rounded-lg bg-surface-subtle p-0.5 border border-border">
                <button
                  type="button"
                  onClick={() => setClientMode('existing')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    clientMode === 'existing'
                      ? 'bg-surface text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Existing
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode('new')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    clientMode === 'new'
                      ? 'bg-surface text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  + New Guest
                </button>
              </div>
            </div>

            {clientMode === 'existing' ? (
              <div className="space-y-2">
                <SearchInput
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  onClear={() => setClientSearch('')}
                  placeholder="Search existing client by name or phone…"
                />

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {filteredClients.map((client) => {
                    const isSelected = selectedClient?.id === client.id
                    return (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-text-primary shadow-sm ring-1 ring-primary/30'
                            : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={client.fullName} src={client.avatarUrl} size="sm" />
                          <div className="min-w-0">
                            <p className="font-bold text-text-primary truncate">
                              {client.fullName}
                            </p>
                            <p className="text-[11px] text-text-muted">{client.phone}</p>
                          </div>
                        </div>

                        {client.isVip && (
                          <Badge variant="accent" size="sm">
                            VIP
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-subtle border border-border">
                <Input
                  label="Guest Full Name"
                  placeholder="e.g. Priya Sharma"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  required
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="e.g. (310) 555-0144"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* STEP 2: Service Selection */}
          <div className="space-y-1.5 pt-2 border-t border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5 text-primary" />
              2. Select Treatment Service
            </span>

            <select
              aria-label="Select Treatment Service"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
            >
              {services.length === 0 ? (
                <option value="" disabled>No services created yet</option>
              ) : (
                services.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name} — {srv.duration} min • ₹{srv.price}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* STEP 3: Specialist Selection */}
          <div className="space-y-1.5 pt-2 border-t border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              3. Assigned Specialist
            </span>

            <select
              aria-label="Assigned Specialist"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
            >
              <option value="any">⚡ Any Available Specialist (Next free)</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.role})
                </option>
              ))}
            </select>
          </div>

          {/* STEP 4: Priority & Notes */}
          <div className="space-y-2 pt-2 border-t border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              4. Queue Priority
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('NORMAL')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                  priority === 'NORMAL'
                    ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                }`}
              >
                Normal
              </button>

              <button
                type="button"
                onClick={() => setPriority('VIP')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                  priority === 'VIP'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/20'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                }`}
              >
                <Star className="h-3 w-3 fill-current" />
                VIP
              </button>

              <button
                type="button"
                onClick={() => setPriority('EMERGENCY')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                  priority === 'EMERGENCY'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-2 ring-rose-500/20'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                }`}
              >
                Emergency
              </button>
            </div>

            <Input
              label="Front-Desk Notes (Optional)"
              placeholder="e.g. Wants dry cut only, rushed for appointment…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Real-time Summary Card */}
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-1 text-xs">
            <div className="flex justify-between text-text-muted">
              <span>Customer:</span>
              <span className="font-bold text-text-primary">
                {clientMode === 'existing' ? selectedClient?.fullName || 'Not selected' : newClientName || 'New Guest'}
              </span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Treatment:</span>
              <span className="font-semibold text-text-primary">{selectedService?.name || 'None'}</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Specialist:</span>
              <span className="font-semibold text-text-primary">{selectedStaff?.name || 'Any Available Specialist'}</span>
            </div>
            <div className="flex justify-between text-text-muted pt-1 border-t border-border">
              <span>Estimated Wait:</span>
              <span className="font-bold text-primary tabular-nums">~15 min</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleResetAndClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              className="shadow-glow-primary/30"
            >
              Check In & Generate Token
            </Button>
          </div>
        </form>
      ) : (
        /* Token Success Screen */
        <div className="space-y-6 text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Sequential Token Issued
            </span>
            <p className="text-6xl font-black text-text-primary tracking-tight font-sans">
              {createdToken.displayNumber}
            </p>
            <p className="text-sm font-bold text-text-primary">{createdToken.clientName}</p>
            <p className="text-xs text-text-muted">{createdToken.serviceName}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border inline-block mx-auto text-xs space-y-1">
            <p className="text-text-muted">
              Specialist:{' '}
              <strong className="text-text-primary">{createdToken.staffName}</strong>
            </p>
            <p className="text-text-muted">
              Estimated Wait:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                ~{createdToken.estimatedWaitMinutes || 15} min
              </strong>
            </p>
          </div>

          <div className="space-y-2 pt-2 max-w-xs mx-auto">
            <Button
              variant="primary"
              onClick={() => printService.printToken(createdToken)}
              leftIcon={<Printer className="h-4 w-4" />}
              className="w-full shadow-glow-primary/30"
            >
              Print Token Slip
            </Button>

            <Button variant="outline" onClick={handleResetAndClose} className="w-full">
              Done & Add Another Walk-In
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  )
}
