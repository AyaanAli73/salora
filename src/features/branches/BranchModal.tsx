import React, { useState, useEffect } from 'react'
import {
  X,
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  User,
  CheckCircle2,
} from 'lucide-react'
import { Branch, BranchStatus, BranchOpeningHours } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

interface BranchModalProps {
  isOpen: boolean
  onClose: () => void
  branchToEdit?: Branch | null
  onSave: (branchData: Omit<Branch, 'id' | 'createdAt'>) => void
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const DEFAULT_HOURS: BranchOpeningHours[] = DAYS_OF_WEEK.map((day) => ({
  day,
  open: day === 'Sunday' ? '10:00' : '09:00',
  close: day === 'Sunday' ? '18:00' : '20:30',
  closed: false,
}))

export const BranchModal: React.FC<BranchModalProps> = ({
  isOpen,
  onClose,
  branchToEdit,
  onSave,
}) => {
  const { addToast } = useToastStore()

  const [activeTab, setActiveTab] = useState<'basic' | 'hours' | 'tax' | 'booking'>('basic')

  // Form State
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('Jodhpur')
  const [state, setState] = useState('Rajasthan')
  const [pincode, setPincode] = useState('')
  const [managerName, setManagerName] = useState('')
  const [managerPhone, setManagerPhone] = useState('')
  const [status, setStatus] = useState<BranchStatus>('ACTIVE')
  const [isHeadquarters, setIsHeadquarters] = useState(false)
  const [invoicePrefix, setInvoicePrefix] = useState('INV-')

  // Tax Info State
  const [gstin, setGstin] = useState('')
  const [taxRate, setTaxRate] = useState(18)
  const [taxRegNumber, setTaxRegNumber] = useState('')
  const [pan, setPan] = useState('')

  // Booking Settings State
  const [allowOnlineBooking, setAllowOnlineBooking] = useState(true)
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(30)
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30)
  const [autoConfirm, setAutoConfirm] = useState(true)
  const [bufferTimeMinutes, setBufferTimeMinutes] = useState(15)

  // Operating Hours State
  const [openingHours, setOpeningHours] = useState<BranchOpeningHours[]>(DEFAULT_HOURS)

  useEffect(() => {
    if (branchToEdit) {
      setName(branchToEdit.name)
      setCode(branchToEdit.code)
      setPhone(branchToEdit.phone)
      setEmail(branchToEdit.email)
      setAddress(branchToEdit.address)
      setCity(branchToEdit.city)
      setState(branchToEdit.state)
      setPincode(branchToEdit.pincode)
      setManagerName(branchToEdit.managerName || '')
      setManagerPhone(branchToEdit.managerPhone || '')
      setStatus(branchToEdit.status)
      setIsHeadquarters(Boolean(branchToEdit.isHeadquarters))
      setInvoicePrefix(branchToEdit.invoicePrefix || `INV-${branchToEdit.code.replace('GP-', '')}`)

      setGstin(branchToEdit.taxInfo?.gstin || '')
      setTaxRate(branchToEdit.taxInfo?.taxRate || 18)
      setTaxRegNumber(branchToEdit.taxInfo?.taxRegistrationNumber || '')
      setPan(branchToEdit.taxInfo?.pan || '')

      setAllowOnlineBooking(branchToEdit.bookingSettings?.allowOnlineBooking ?? true)
      setSlotDurationMinutes(branchToEdit.bookingSettings?.slotDurationMinutes || 30)
      setAdvanceBookingDays(branchToEdit.bookingSettings?.advanceBookingDays || 30)
      setAutoConfirm(branchToEdit.bookingSettings?.autoConfirm ?? true)
      setBufferTimeMinutes(branchToEdit.bookingSettings?.bufferTimeMinutes || 15)

      setOpeningHours(branchToEdit.openingHours || DEFAULT_HOURS)
    } else {
      // Reset defaults
      setName('')
      setCode('GP-')
      setPhone('+91 ')
      setEmail('')
      setAddress('')
      setCity('Jodhpur')
      setState('Rajasthan')
      setPincode('')
      setManagerName('')
      setManagerPhone('')
      setStatus('ACTIVE')
      setIsHeadquarters(false)
      setInvoicePrefix('INV-')
      setGstin('')
      setTaxRate(18)
      setTaxRegNumber('')
      setPan('')
      setAllowOnlineBooking(true)
      setSlotDurationMinutes(30)
      setAdvanceBookingDays(30)
      setAutoConfirm(true)
      setBufferTimeMinutes(15)
      setOpeningHours(DEFAULT_HOURS)
    }
  }, [branchToEdit, isOpen])

  if (!isOpen) return null

  const handleHourChange = (
    dayIndex: number,
    field: keyof BranchOpeningHours,
    value: any
  ) => {
    setOpeningHours((prev) => {
      const updated = [...prev]
      updated[dayIndex] = { ...updated[dayIndex], [field]: value }
      return updated
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !code.trim() || !phone.trim() || !address.trim()) {
      addToast({
        title: 'Validation Error',
        message: 'Please provide branch name, code, contact phone, and address.',
        type: 'danger',
      })
      return
    }

    const payload: Omit<Branch, 'id' | 'createdAt'> = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      phone: phone.trim(),
      email: email.trim() || `${code.toLowerCase().replace(/[^a-z0-9]/g, '')}@salora.in`,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim() || '342001',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      status,
      isHeadquarters,
      invoicePrefix: invoicePrefix.trim() || `INV-${code.trim()}`,
      managerName: managerName.trim() || undefined,
      managerPhone: managerPhone.trim() || undefined,
      openingHours,
      workingDays: openingHours.filter((h) => !h.closed).map((h) => h.day),
      taxInfo: {
        gstin: gstin.trim() || undefined,
        taxRate: Number(taxRate) || 18,
        taxRegistrationNumber: taxRegNumber.trim() || undefined,
        pan: pan.trim() || undefined,
      },
      bookingSettings: {
        allowOnlineBooking,
        slotDurationMinutes: Number(slotDurationMinutes) || 30,
        advanceBookingDays: Number(advanceBookingDays) || 30,
        autoConfirm,
        bufferTimeMinutes: Number(bufferTimeMinutes) || 15,
      },
    }

    onSave(payload)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="branch-modal-title"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-surface rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-subtle/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="branch-modal-title" className="text-base font-bold text-text-primary">
                {branchToEdit ? `Configure ${branchToEdit.name}` : 'Create New Salon Branch'}
              </h2>
              <p className="text-xs text-text-muted">
                {branchToEdit
                  ? 'Update operational details, business hours, and tax settings'
                  : 'Add a new location to the Salora salon network'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-border bg-surface text-xs font-semibold text-text-muted overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={cn(
              'px-4 py-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'basic'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent hover:text-text-primary'
            )}
          >
            <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
            Basic Info & Location
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hours')}
            className={cn(
              'px-4 py-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'hours'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent hover:text-text-primary'
            )}
          >
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            Business Hours & Days
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tax')}
            className={cn(
              'px-4 py-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'tax'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent hover:text-text-primary'
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Tax & Invoicing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('booking')}
            className={cn(
              'px-4 py-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap',
              activeTab === 'booking'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent hover:text-text-primary'
            )}
          >
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            Booking Settings
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: BASIC INFO & LOCATION */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="b-name" className="block text-xs font-semibold text-text-primary mb-1">
                    Branch Name *
                  </label>
                  <Input
                    id="b-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Salora Jodhpur"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="b-code" className="block text-xs font-semibold text-text-primary mb-1">
                    Branch Code * (e.g. GP-JDH)
                  </label>
                  <Input
                    id="b-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="GP-JDH"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="b-phone" className="block text-xs font-semibold text-text-primary mb-1">
                    Branch Contact Phone *
                  </label>
                  <Input
                    id="b-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 291 264 5501"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="b-email" className="block text-xs font-semibold text-text-primary mb-1">
                    Branch Email
                  </label>
                  <Input
                    id="b-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jodhpur@salora.in"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="b-address" className="block text-xs font-semibold text-text-primary mb-1">
                  Full Street Address *
                </label>
                <Input
                  id="b-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="14, Residency Road, Sardarpura"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="b-city" className="block text-xs font-semibold text-text-primary mb-1">
                    City
                  </label>
                  <Input
                    id="b-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Jodhpur"
                  />
                </div>
                <div>
                  <label htmlFor="b-state" className="block text-xs font-semibold text-text-primary mb-1">
                    State
                  </label>
                  <Input
                    id="b-state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Rajasthan"
                  />
                </div>
                <div>
                  <label htmlFor="b-pin" className="block text-xs font-semibold text-text-primary mb-1">
                    Pincode
                  </label>
                  <Input
                    id="b-pin"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="342003"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <label htmlFor="b-mgr" className="block text-xs font-semibold text-text-primary mb-1">
                    Branch Manager Name
                  </label>
                  <Input
                    id="b-mgr"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="Priya Rathore"
                  />
                </div>
                <div>
                  <label htmlFor="b-mgr-phone" className="block text-xs font-semibold text-text-primary mb-1">
                    Manager Direct Phone
                  </label>
                  <Input
                    id="b-mgr-phone"
                    value={managerPhone}
                    onChange={(e) => setManagerPhone(e.target.value)}
                    placeholder="+91 98290 11223"
                  />
                </div>
              </div>

              {/* Status and HQ Options */}
              <div className="p-3 rounded-2xl bg-surface-subtle border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-text-primary">Branch Operational Status</p>
                  <p className="text-[11px] text-text-muted">
                    Active branches appear in customer booking and operational switchers
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    id="b-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BranchStatus)}
                    className="h-8 px-3 rounded-lg border border-border bg-surface text-xs font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUSINESS HOURS */}
          {activeTab === 'hours' && (
            <div className="space-y-3">
              <p className="text-xs text-text-muted">
                Configure opening and closing schedules per day for this location.
              </p>
              <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-surface">
                {openingHours.map((hour, idx) => (
                  <div
                    key={hour.day}
                    className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-surface-subtle/50 transition-colors"
                  >
                    <span className="w-24 font-bold text-text-primary">{hour.day}</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-text-muted">
                      <input
                        type="checkbox"
                        checked={!hour.closed}
                        onChange={(e) => handleHourChange(idx, 'closed', !e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{hour.closed ? 'Closed' : 'Open'}</span>
                    </label>

                    {!hour.closed ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={hour.open}
                          onChange={(e) => handleHourChange(idx, 'open', e.target.value)}
                          className="h-7 px-2 rounded border border-border bg-surface text-xs"
                        />
                        <span className="text-text-muted">to</span>
                        <input
                          type="time"
                          value={hour.close}
                          onChange={(e) => handleHourChange(idx, 'close', e.target.value)}
                          className="h-7 px-2 rounded border border-border bg-surface text-xs"
                        />
                      </div>
                    ) : (
                      <span className="text-[11px] text-text-muted italic">No service slots</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TAX & INVOICING */}
          {activeTab === 'tax' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="b-gstin" className="block text-xs font-semibold text-text-primary mb-1">
                    Branch GSTIN (15 Digits)
                  </label>
                  <Input
                    id="b-gstin"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="08AAACG1234F1Z1"
                  />
                </div>
                <div>
                  <label htmlFor="b-tax-rate" className="block text-xs font-semibold text-text-primary mb-1">
                    Default Tax Rate (%)
                  </label>
                  <Input
                    id="b-tax-rate"
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    placeholder="18"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="b-pan" className="block text-xs font-semibold text-text-primary mb-1">
                    Income Tax PAN
                  </label>
                  <Input
                    id="b-pan"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                    placeholder="AAACG1234F"
                  />
                </div>
                <div>
                  <label htmlFor="b-reg-num" className="block text-xs font-semibold text-text-primary mb-1">
                    Trade / Establishment Reg No.
                  </label>
                  <Input
                    id="b-reg-num"
                    value={taxRegNumber}
                    onChange={(e) => setTaxRegNumber(e.target.value)}
                    placeholder="RJ-JOD-2024-88"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="b-inv-prefix" className="block text-xs font-semibold text-text-primary mb-1">
                  Branch Invoice Prefix
                </label>
                <Input
                  id="b-inv-prefix"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="INV-JDH"
                />
                <p className="text-[11px] text-text-muted mt-1">
                  Example resulting invoice sequence: {invoicePrefix}-000142
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: BOOKING SETTINGS */}
          {activeTab === 'booking' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-surface-subtle border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-text-primary">Enable Online Customer Booking</p>
                  <p className="text-[11px] text-text-muted">
                    Allow clients to schedule appointments directly at this branch
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowOnlineBooking}
                  onChange={(e) => setAllowOnlineBooking(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="b-slot-dur" className="block text-xs font-semibold text-text-primary mb-1">
                    Slot Duration (mins)
                  </label>
                  <Input
                    id="b-slot-dur"
                    type="number"
                    value={slotDurationMinutes}
                    onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
                    min={15}
                    step={15}
                  />
                </div>
                <div>
                  <label htmlFor="b-adv-days" className="block text-xs font-semibold text-text-primary mb-1">
                    Advance Window (days)
                  </label>
                  <Input
                    id="b-adv-days"
                    type="number"
                    value={advanceBookingDays}
                    onChange={(e) => setAdvanceBookingDays(Number(e.target.value))}
                    min={1}
                  />
                </div>
                <div>
                  <label htmlFor="b-buf-mins" className="block text-xs font-semibold text-text-primary mb-1">
                    Buffer Time (mins)
                  </label>
                  <Input
                    id="b-buf-mins"
                    type="number"
                    value={bufferTimeMinutes}
                    onChange={(e) => setBufferTimeMinutes(Number(e.target.value))}
                    min={0}
                    step={5}
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-subtle border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-text-primary">Auto-Confirm Booking Requests</p>
                  <p className="text-[11px] text-text-muted">
                    Automatically confirm appointments if time slot has no conflicts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoConfirm}
                  onChange={(e) => setAutoConfirm(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {branchToEdit ? 'Save Branch Changes' : 'Create Branch Location'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
