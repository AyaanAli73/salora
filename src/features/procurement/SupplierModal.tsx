import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Supplier, SupplierStatus } from '@/types'
import { useToastStore } from '@/store/useToastStore'
import { procurementService } from '@/services/procurementService'

interface SupplierModalProps {
  isOpen: boolean
  onClose: () => void
  supplier?: Supplier | null
  onSaved: () => void
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onSaved,
}) => {
  const { addToast } = useToastStore()
  const isEdit = Boolean(supplier)

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [pan, setPan] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [paymentTermsDays, setPaymentTermsDays] = useState(30)
  const [status, setStatus] = useState<SupplierStatus>('ACTIVE')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (supplier) {
      setName(supplier.name || '')
      setCode(supplier.code || '')
      setPhone(supplier.phone || '')
      setEmail(supplier.email || '')
      setAddress(supplier.address || '')
      setCity(supplier.city || '')
      setState(supplier.state || '')
      setPincode(supplier.pincode || '')
      setGstNumber(supplier.gstNumber || '')
      setPan(supplier.pan || '')
      setContactPerson(supplier.contactPerson || '')
      setPaymentTermsDays(supplier.paymentTermsDays || 30)
      setStatus(supplier.status || (supplier.active ? 'ACTIVE' : 'INACTIVE'))
      setBankName(supplier.bankDetails?.bankName || '')
      setAccountNumber(supplier.bankDetails?.accountNumber || '')
      setIfscCode(supplier.bankDetails?.ifscCode || '')
      setNotes(supplier.notes || '')
    } else {
      setName('')
      setCode('')
      setPhone('')
      setEmail('')
      setAddress('')
      setCity('Jodhpur')
      setState('Rajasthan')
      setPincode('')
      setGstNumber('')
      setPan('')
      setContactPerson('')
      setPaymentTermsDays(30)
      setStatus('ACTIVE')
      setBankName('')
      setAccountNumber('')
      setIfscCode('')
      setNotes('')
    }
  }, [supplier, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      addToast({ title: 'Validation Error', message: 'Supplier name is required.', type: 'danger' })
      return
    }
    if (!phone.trim()) {
      addToast({ title: 'Validation Error', message: 'Supplier phone number is required.', type: 'danger' })
      return
    }

    setIsSubmitting(true)
    try {
      if (isEdit && supplier) {
        procurementService.updateSupplier(supplier.id, {
          name,
          code: code || undefined,
          phone,
          email,
          address,
          city,
          state,
          pincode,
          gstNumber: gstNumber || undefined,
          pan: pan || undefined,
          contactPerson: contactPerson || undefined,
          paymentTermsDays: Number(paymentTermsDays) || 30,
          status,
          bankDetails: bankName
            ? {
                bankName,
                accountNumber,
                ifscCode,
              }
            : undefined,
          notes: notes || undefined,
        })
        addToast({ title: 'Supplier Updated', message: `Successfully updated ${name}.`, type: 'success' })
      } else {
        procurementService.createSupplier({
          name,
          code: code || undefined,
          phone,
          email,
          address,
          city,
          state,
          pincode,
          gstNumber: gstNumber || undefined,
          pan: pan || undefined,
          contactPerson: contactPerson || undefined,
          paymentTermsDays: Number(paymentTermsDays) || 30,
          status,
          active: status === 'ACTIVE',
          bankDetails: bankName
            ? {
                bankName,
                accountNumber,
                ifscCode,
              }
            : undefined,
          notes: notes || undefined,
        })
        addToast({ title: 'Supplier Created', message: `Added ${name} to supplier directory.`, type: 'success' })
      }

      onSaved()
      onClose()
    } catch (err: any) {
      addToast({ title: 'Error', message: err.message || 'Failed to save supplier profile.', type: 'danger' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Supplier Profile' : 'Add New Supplier'}
      description="Manage vendor contact, billing address, tax credentials, and banking information."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Core Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Supplier / Company Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. L'Oréal India Professional"
            required
          />
          <Input
            label="Supplier Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. SUP-LOR-01"
          />
        </div>

        {/* Contact Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Contact Person"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="e.g. Rakesh Shah"
          />
          <Input
            label="Phone Number *"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 98201 12345"
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="orders@supplier.in"
          />
        </div>

        {/* Address */}
        <div>
          <label htmlFor="sup-address" className="block text-xs font-semibold text-text-primary mb-1">
            Billing & Registered Address
          </label>
          <input
            id="sup-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Bandra-Kurla Complex, Bandra East"
            className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs font-medium text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Mumbai"
          />
          <Input
            label="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="e.g. Maharashtra"
          />
          <Input
            label="Pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="e.g. 400051"
          />
        </div>

        {/* Tax Information */}
        <div className="p-3 bg-surface-subtle border border-border rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            GST & Tax Credentials
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="GSTIN / Tax ID"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 27AAACL1234F1Z5"
            />
            <Input
              label="Permanent Account Number (PAN)"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              placeholder="e.g. AAACL1234F"
            />
            <div>
              <label htmlFor="sup-terms" className="block text-xs font-semibold text-text-primary mb-1">
                Credit Payment Terms (Days)
              </label>
              <input
                id="sup-terms"
                type="number"
                min="0"
                max="180"
                value={paymentTermsDays}
                onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="p-3 bg-surface-subtle border border-border rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Settlement Bank Account (For NEFT/RTGS Payments)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Bank Name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. HDFC Bank"
            />
            <Input
              label="Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="e.g. 50200012345678"
            />
            <Input
              label="IFSC Code"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
              placeholder="e.g. HDFC0000123"
            />
          </div>
        </div>

        {/* Notes & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-3">
            <label htmlFor="sup-notes" className="block text-xs font-semibold text-text-primary mb-1">
              Internal Procurement Notes
            </label>
            <input
              id="sup-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Minimum order ₹15,000 for free delivery. Tuesday dispatch cycle."
              className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs font-medium text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="sup-status" className="block text-xs font-semibold text-text-primary mb-1">
              Status
            </label>
            <select
              id="sup-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as SupplierStatus)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-xs font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Supplier'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
