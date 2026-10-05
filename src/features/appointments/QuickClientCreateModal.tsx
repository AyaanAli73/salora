import React, { useState, useEffect, useRef } from 'react'
import { Client } from '@/types'
import { clientService } from '@/services/clientService'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useToastStore } from '@/store/useToastStore'
import { formatDate } from '@/utils/formatters'
import {
  UserPlus,
  AlertTriangle,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  Sparkles,
} from 'lucide-react'

interface QuickClientCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onClientCreated: (client: Client) => void
  initialPhone?: string
  initialName?: string
}

export const QuickClientCreateModal: React.FC<QuickClientCreateModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
  initialPhone = '',
  initialName = '',
}) => {
  const { addToast } = useToastStore()
  const firstNameInputRef = useRef<HTMLInputElement>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [notes, setNotes] = useState('')
  const [isVip, setIsVip] = useState(false)

  const [existingClients, setExistingClients] = useState<Client[]>([])
  const [duplicateClient, setDuplicateClient] = useState<Client | null>(null)
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ firstName?: string; phone?: string; email?: string }>({})

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      let initFirst = ''
      let initLast = ''
      if (initialName.trim()) {
        const parts = initialName.trim().split(' ')
        initFirst = parts[0] || ''
        initLast = parts.slice(1).join(' ') || ''
      }
      setFirstName(initFirst)
      setLastName(initLast)
      setPhone(initialPhone.trim())
      setEmail('')
      setDateOfBirth('')
      setNotes('')
      setIsVip(false)
      setDuplicateClient(null)
      setShowDuplicateWarning(false)
      setErrors({})

      // Load clients for instant duplicate check
      clientService.getAll().then((data) => {
        setExistingClients(data)
      })

      // Auto focus first name
      setTimeout(() => {
        firstNameInputRef.current?.focus()
      }, 80)
    }
  }, [isOpen, initialName, initialPhone])

  // Normalizes phone string to clean numeric digits for matching
  const normalizePhone = (p: string) => p.replace(/\D/g, '')

  const checkForDuplicate = (phoneNumber: string): Client | null => {
    const cleanInput = normalizePhone(phoneNumber)
    if (!cleanInput || cleanInput.length < 7) return null

    return (
      existingClients.find((c) => {
        const cleanExisting = normalizePhone(c.phone)
        if (!cleanExisting || cleanExisting.length < 7) return false
        // Exact match or match last 10 digits
        const last10Input = cleanInput.slice(-10)
        const last10Existing = cleanExisting.slice(-10)
        return last10Input === last10Existing || cleanExisting === cleanInput
      }) || null
    )
  }

  const handleValidate = () => {
    const errs: { firstName?: string; phone?: string; email?: string } = {}
    if (!firstName.trim()) {
      errs.firstName = 'First name is required.'
    } else if (firstName.trim().length < 2) {
      errs.firstName = 'Must be at least 2 characters.'
    }

    const clean = normalizePhone(phone)
    if (!phone.trim()) {
      errs.phone = 'Phone number is required.'
    } else if (clean.length < 7) {
      errs.phone = 'Please enter a valid phone number (at least 7 digits).'
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async (forceCreate = false) => {
    if (!handleValidate()) return

    // Duplicate check before creating
    if (!forceCreate) {
      const dup = checkForDuplicate(phone)
      if (dup) {
        setDuplicateClient(dup)
        setShowDuplicateWarning(true)
        return
      }
    }

    setIsSubmitting(true)
    try {
      const created = await clientService.create({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        birthday: dateOfBirth || undefined,
        notes: notes.trim() || undefined,
        isVip,
        status: isVip ? 'vip' : 'new',
      })

      addToast({
        title: 'Client Created',
        message: `${created.fullName} has been created and selected.`,
        type: 'success',
      })

      onClientCreated(created)
      onClose()
    } catch (err: any) {
      addToast({
        title: 'Error Creating Client',
        message: err.message || 'Could not save client. Please check details.',
        type: 'danger',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUseExisting = () => {
    if (!duplicateClient) return
    addToast({
      title: 'Existing Client Selected',
      message: `${duplicateClient.fullName} has been selected for this appointment.`,
      type: 'info',
    })
    onClientCreated(duplicateClient)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-text-primary">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold">New Client Registration</h2>
            <p className="text-xs font-normal text-text-muted">
              Quickly create and attach client to this appointment
            </p>
          </div>
        </div>
      }
      size="md"
    >
      <div className="space-y-4 pt-1">
        {/* DUPLICATE DETECTION WARNING BANNER */}
        {showDuplicateWarning && duplicateClient && (
          <div
            role="alert"
            aria-live="polite"
            className="p-4 rounded-xl border border-warning/40 bg-warning/10 text-text-primary space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-warning/20 text-warning flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-text-primary">
                  An existing client with this phone number was found.
                </h3>
                <p className="text-xs text-text-secondary">
                  A client record with phone number <span className="font-mono font-medium">{phone}</span> already exists in the system.
                </p>
              </div>
            </div>

            {/* Existing Client Card */}
            <div className="p-3 rounded-lg bg-surface border border-border flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={duplicateClient.avatarUrl}
                  name={duplicateClient.fullName}
                  size="md"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-text-primary truncate">
                      {duplicateClient.fullName}
                    </p>
                    {duplicateClient.isVip && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        VIP
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted flex items-center gap-2">
                    <span className="font-mono tabular-nums">{duplicateClient.phone}</span>
                    <span>•</span>
                    <span>
                      Last Visit:{' '}
                      {duplicateClient.lastVisitDate
                        ? formatDate(duplicateClient.lastVisitDate)
                        : 'No previous visits'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons for Duplicate Resolution */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSave(true)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Create Anyway
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<UserCheck className="h-3.5 w-3.5" />}
                onClick={handleUseExisting}
                className="text-xs shadow-glow-primary/20"
              >
                Use Existing Client
              </Button>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSave(false)
          }}
          className="space-y-4"
        >
          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="quick-client-first-name"
                className="block text-xs font-semibold text-text-secondary mb-1"
              >
                First Name <span className="text-danger">*</span>
              </label>
              <input
                ref={firstNameInputRef}
                id="quick-client-first-name"
                name="firstName"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }))
                }}
                placeholder="e.g. Priya…"
                className={`w-full h-10 px-3 rounded-lg border text-sm bg-surface text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  errors.firstName ? 'border-danger focus-visible:ring-danger' : 'border-border'
                }`}
              />
              {errors.firstName && (
                <p className="text-[11px] text-danger mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="quick-client-last-name"
                className="block text-xs font-semibold text-text-secondary mb-1"
              >
                Last Name <span className="text-text-muted font-normal">(Optional)</span>
              </label>
              <input
                id="quick-client-last-name"
                name="lastName"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Sharma…"
                className="w-full h-10 px-3 rounded-lg border border-border text-sm bg-surface text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="quick-client-phone"
              className="block text-xs font-semibold text-text-secondary mb-1"
            >
              Phone Number <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
              <input
                id="quick-client-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  if (showDuplicateWarning) setShowDuplicateWarning(false)
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
                }}
                placeholder="e.g. 98200 12345…"
                className={`w-full h-10 pl-9 pr-3 rounded-lg border text-sm font-mono bg-surface text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  errors.phone ? 'border-danger focus-visible:ring-danger' : 'border-border'
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-[11px] text-danger mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Optional: Email & DOB */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="quick-client-email"
                className="block text-xs font-semibold text-text-secondary mb-1"
              >
                Email Address <span className="text-text-muted font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                <input
                  id="quick-client-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                  placeholder="e.g. priya@example.com…"
                  className={`w-full h-10 pl-9 pr-3 rounded-lg border text-sm bg-surface text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    errors.email ? 'border-danger focus-visible:ring-danger' : 'border-border'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-danger mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="quick-client-dob"
                className="block text-xs font-semibold text-text-secondary mb-1"
              >
                Date of Birth <span className="text-text-muted font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                <input
                  id="quick-client-dob"
                  name="dateOfBirth"
                  type="date"
                  autoComplete="bday"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-border text-sm bg-surface text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Quick Notes & VIP Toggle */}
          <div className="space-y-3 pt-1">
            <div>
              <label
                htmlFor="quick-client-notes"
                className="block text-xs font-semibold text-text-secondary mb-1"
              >
                Client Preferences / Notes <span className="text-text-muted font-normal">(Optional)</span>
              </label>
              <textarea
                id="quick-client-notes"
                name="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Hair type, skin allergy, beverage preference…"
                className="w-full p-2.5 rounded-lg border border-border text-xs bg-surface text-text-primary transition-colors resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isVip}
                onChange={(e) => setIsVip(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus-visible:ring-primary"
              />
              <span className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Mark as VIP Guest
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<UserPlus className="h-4 w-4" />}
              isLoading={isSubmitting}
              className="shadow-glow-primary/25 min-w-[120px]"
            >
              Create Client
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
