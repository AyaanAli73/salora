import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building,
  Clock,
  Printer,
  ShieldCheck,
  Bell,
  Sparkles,
  FileText,
  Receipt,
  Copy,
  CheckCircle2,
  Globe,
  Users,
  ExternalLink,
  Zap,
  Percent,
  Sliders,
  DollarSign,
  ArrowRight,
  Shield,
  FileSpreadsheet,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useSalonStore } from '@/store/useSalonStore'
import { useThemeStore } from '@/store/useThemeStore'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToastStore } from '@/store/useToastStore'
import { printService } from '@/services/printService'
import { PrinterSettings } from '@/types'
import { AuditLogPage } from '@/pages/AuditLogPage'
import { SecuritySettingsPage } from '@/pages/SecuritySettingsPage'
import { DataExportPage } from '@/pages/DataExportPage'
import { useSettingsStore } from '@/store/useSettingsStore'

import { firestoreService, SALORA_COLLECTIONS } from '@/services/firebase/firestoreService'
import { firebaseAuthService } from '@/services/firebase/authService'
import { isFirebaseConfigured } from '@/lib/firebase'

type SettingsTab =
  | 'owner'
  | 'profile'
  | 'hours'
  | 'services'
  | 'tax'
  | 'printing'
  | 'notifications'
  | 'security'
  | 'export'

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore()
  const {
    salon,
    updateSalon,
    updateBookingSettings,
    updatePrintingSettings,
    updateNotificationSettings,
    updateTaxInformation,
  } = useSalonStore()
  const { theme, toggleTheme } = useThemeStore()
  const { addToast } = useToastStore()
  const { businessProfile, updateBusinessProfile } = useSettingsStore()

  const [activeTab, setActiveTab] = useState<SettingsTab>('owner')

  // Security sub-tab: 'security' or 'audit'
  const [securitySubTab, setSecuritySubTab] = useState<'access' | 'audit'>('access')

  // Owner Profile Form State
  const [ownerForm, setOwnerForm] = useState({
    name: user?.name || 'Ayaan Sharma',
    username: user?.username || 'owner',
    avatarUrl: user?.avatarUrl || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isSavingOwner, setIsSavingOwner] = useState(false)

  // Salon Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: salon.name || 'Salora Salon & Wellness Studio',
    tagline: salon.tagline || 'Luxury Hair, Skin & Wellness Studio',
    logo: salon.logo || '/salora.png',
    address: salon.address || '450 N Bedford Drive, Suite 200',
    city: salon.city || 'Mumbai',
    state: salon.state || 'Maharashtra',
    pincode: salon.pincode || salon.postalCode || '400050',
    phone: salon.phone || '+91 98200 12345',
    email: salon.email || 'concierge@salora.com',
    website: salon.website || 'https://salora.salon',
  })

  // Tax Information Form State
  const [taxForm, setTaxForm] = useState({
    gstin: salon.taxInformation?.gstin || '27AABCU9603R1ZM',
    panNumber: salon.taxInformation?.panNumber || 'AABCU9603R',
    taxRatePercent: salon.taxInformation?.taxRatePercent ?? 18,
    isGstRegistered: salon.taxInformation?.isGstRegistered ?? true,
    legalBusinessName: salon.taxInformation?.legalBusinessName || 'Salora Salon & Wellness Private Limited',
  })

  // Working Hours State
  const [openHoursState, setOpenHoursState] = useState(
    salon.openHours || [
      { day: 'Monday', open: '09:00', close: '20:00', closed: false },
      { day: 'Tuesday', open: '09:00', close: '20:00', closed: false },
      { day: 'Wednesday', open: '09:00', close: '20:00', closed: false },
      { day: 'Thursday', open: '09:00', close: '20:00', closed: false },
      { day: 'Friday', open: '09:00', close: '20:00', closed: false },
      { day: 'Saturday', open: '09:00', close: '21:00', closed: false },
      { day: 'Sunday', open: '10:00', close: '19:00', closed: false },
    ]
  )

  // Booking & Services Settings State
  const [bookingForm, setBookingForm] = useState(
    salon.bookingSettings || {
      onlineBookingEnabled: true,
      advanceBookingDays: 30,
      minimumNoticeHours: 2,
      cancellationWindowHours: 24,
      rescheduleWindowHours: 12,
      depositType: 'none' as const,
      depositAmount: 0,
      allowStaffSelection: true,
      allowPreferredStaff: true,
      showPricing: true,
      showServiceDuration: true,
      bufferTimeMinutes: 15,
    }
  )

  // Receipt & Printing Settings State
  const [printingForm, setPrintingForm] = useState({
    receiptHeader: salon.printingSettings?.receiptHeader || 'Salora Salon & Wellness\n450 N Bedford Drive, Bandra West, Mumbai',
    receiptFooter: salon.printingSettings?.receiptFooter || 'Thank you for choosing Salora!\nFor appointments call +91 98200 12345',
    showGstNumber: salon.printingSettings?.showGstNumber ?? true,
    paperWidth: (salon.printingSettings?.paperWidth as '58mm' | '80mm' | 'A4') || '80mm',
    autoPrintReceipts: salon.printingSettings?.autoPrintReceipts ?? false,
    tokenPrefix: salon.printingSettings?.tokenPrefix || 'GP-',
  })

  // Notifications Settings State
  const [notificationForm, setNotificationForm] = useState({
    sendAppointmentSms: salon.notificationSettings?.sendAppointmentSms ?? true,
    sendAppointmentWhatsapp: salon.notificationSettings?.sendAppointmentWhatsapp ?? true,
    sendEmailReceipts: salon.notificationSettings?.sendEmailReceipts ?? true,
    sendMarketingPromos: salon.notificationSettings?.sendMarketingPromos ?? false,
    senderId: salon.notificationSettings?.senderId || 'SALORA',
  })

  // Printer hardware settings
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(
    printService.getSettings()
  )

  // Save Handlers
  const handleSaveOwnerProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingOwner(true)
    try {
      if (ownerForm.newPassword) {
        if (ownerForm.newPassword.length < 6) {
          addToast({ title: 'Validation Error', message: 'New password must be at least 6 characters.', type: 'danger' })
          setIsSavingOwner(false)
          return
        }
        if (ownerForm.newPassword !== ownerForm.confirmPassword) {
          addToast({ title: 'Validation Error', message: 'New passwords do not match.', type: 'danger' })
          setIsSavingOwner(false)
          return
        }
        if (!ownerForm.currentPassword) {
          addToast({ title: 'Validation Error', message: 'Current password is required to change password.', type: 'danger' })
          setIsSavingOwner(false)
          return
        }
        await firebaseAuthService.changePassword(ownerForm.currentPassword, ownerForm.newPassword)
      }

      // Update owner/main in Firestore
      if (isFirebaseConfigured) {
        await firestoreService.set(SALORA_COLLECTIONS.OWNER, 'main', {
          name: ownerForm.name,
          username: ownerForm.username.toLowerCase(),
          photoUrl: ownerForm.avatarUrl,
          updatedAt: new Date().toISOString(),
        }, true)
      }

      useAuthStore.getState().updateUserProfile({
        name: ownerForm.name,
        username: ownerForm.username.toLowerCase(),
        avatarUrl: ownerForm.avatarUrl,
      })

      addToast({
        title: 'Owner Profile Saved',
        message: 'Owner credentials and display details updated successfully.',
        type: 'success',
      })

      setOwnerForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update owner profile.'
      addToast({ title: 'Update Failed', message: msg, type: 'danger' })
    } finally {
      setIsSavingOwner(false)
    }
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateSalon({
      name: profileForm.name,
      tagline: profileForm.tagline,
      logo: profileForm.logo,
      address: profileForm.address,
      city: profileForm.city,
      state: profileForm.state,
      pincode: profileForm.pincode,
      postalCode: profileForm.pincode,
      phone: profileForm.phone,
      email: profileForm.email,
      website: profileForm.website,
    })
    updateBusinessProfile({
      salonName: profileForm.name,
      tagline: profileForm.tagline,
      address: profileForm.address,
      city: profileForm.city,
      state: profileForm.state,
      pincode: profileForm.pincode,
      phone: profileForm.phone,
      email: profileForm.email,
      website: profileForm.website,
    })
    addToast({
      title: 'Salon Profile Saved',
      message: 'Salon branding, contact details, and address updated successfully.',
      type: 'success',
    })
  }

  const handleSaveHours = (e: React.FormEvent) => {
    e.preventDefault()
    updateSalon({ openHours: openHoursState })
    updateBookingSettings(bookingForm)
    addToast({
      title: 'Working Hours Saved',
      message: 'Weekly operating schedule and appointment buffer times have been updated.',
      type: 'success',
    })
  }

  const handleSaveServicesConfig = (e: React.FormEvent) => {
    e.preventDefault()
    updateBookingSettings(bookingForm)
    addToast({
      title: 'Services Configuration Saved',
      message: 'Online booking eligibility, deposit rules, and duration visibility updated.',
      type: 'success',
    })
  }

  const handleSaveTax = (e: React.FormEvent) => {
    e.preventDefault()
    updateTaxInformation(taxForm)
    updateBusinessProfile({
      gstin: taxForm.gstin,
      pan: taxForm.panNumber,
      legalEntityName: taxForm.legalBusinessName,
    })
    addToast({
      title: 'Tax & GST Updated',
      message: 'Statutory GSTIN, PAN, and tax parameters applied to all transactions.',
      type: 'success',
    })
  }

  const handleSavePrinting = (e: React.FormEvent) => {
    e.preventDefault()
    updatePrintingSettings(printingForm)
    printService.saveSettings({
      ...printerSettings,
      paperSize: printingForm.paperWidth === '58mm' ? '58mm' : '80mm',
      defaultInvoiceSize: printingForm.paperWidth === '58mm' ? '58mm' : printingForm.paperWidth === 'A4' ? 'a4' : '80mm',
      autoPrintInvoice: printingForm.autoPrintReceipts,
      customFooterText: printingForm.receiptFooter,
    })
    addToast({
      title: 'Printing Preferences Saved',
      message: 'Thermal receipt layout, header/footer text, and token prefix saved.',
      type: 'success',
    })
  }

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault()
    updateNotificationSettings(notificationForm)
    addToast({
      title: 'Notification Settings Saved',
      message: 'Customer SMS, WhatsApp, and email delivery rules updated.',
      type: 'success',
    })
  }

  const handleTestPrint = async (
    type: 'token' | 'invoice_a4' | 'invoice_80mm' | 'invoice_58mm'
  ) => {
    const res = await printService.testPrint(type)
    if (res.success) {
      addToast({
        title: 'Test Print Dispatched',
        message: `Sample ${type.replace('_', ' ').toUpperCase()} slip sent to printer.`,
        type: 'info',
      })
    } else {
      addToast({
        title: 'Print Failed',
        message: 'Unable to communicate with the selected printer.',
        type: 'danger',
      })
    }
  }

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-150">
      {/* Page Title & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
            Salon Settings
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Configure single-salon business identity, operational hours, GST parameters, receipts, and staff permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/settings/integrations"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary dark:bg-primary/20 dark:hover:bg-primary/30 px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Zap className="h-4 w-4" aria-hidden="true" />
            Integrations Hub
          </Link>
        </div>
      </div>

      {/* Simplified Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-subtle border border-border w-fit overflow-x-auto max-w-full">
        {[
          { id: 'owner', label: 'Owner Profile', icon: <ShieldCheck className="h-4 w-4" /> },
          { id: 'profile', label: 'Salon Information', icon: <Building className="h-4 w-4" /> },
          { id: 'hours', label: 'Working Hours', icon: <Clock className="h-4 w-4" /> },
          { id: 'services', label: 'Booking & Services', icon: <Sparkles className="h-4 w-4" /> },
          { id: 'tax', label: 'Tax & GST', icon: <Percent className="h-4 w-4" /> },
          { id: 'printing', label: 'Receipt & Printing', icon: <Printer className="h-4 w-4" /> },
          { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
          { id: 'security', label: 'Security & Audit', icon: <Shield className="h-4 w-4" /> },
          { id: 'export', label: 'Data Export', icon: <FileText className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as SettingsTab)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SALON PROFILE                                     */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                Salon Identity & Branding
              </CardTitle>
              <CardDescription>
                Primary business identity shown on customer receipts, booking portal, and legal invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Salon Brand Name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Salora Salon & Wellness"
                  required
                />
                <Input
                  label="Tagline / Motto"
                  value={profileForm.tagline}
                  onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                  placeholder="Luxury Hair, Skin & Wellness Studio"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Concierge Phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+91 98200 12345"
                  required
                />
                <Input
                  label="Concierge Email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="concierge@salora.com"
                  required
                />
                <Input
                  label="Public Website"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                  placeholder="https://salora.salon"
                />
              </div>

              <div>
                <Input
                  label="Logo Image URL"
                  value={profileForm.logo}
                  onChange={(e) => setProfileForm({ ...profileForm, logo: e.target.value })}
                  placeholder="/salora.png"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Physical Address & Location</CardTitle>
              <CardDescription>Salon studio location printed on customer receipts and navigation links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Street Address Line"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                placeholder="450 N Bedford Drive, Suite 200, Bandra West"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="City"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  placeholder="Mumbai"
                  required
                />
                <Input
                  label="State"
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  placeholder="Maharashtra"
                  required
                />
                <Input
                  label="Postal / PIN Code"
                  value={profileForm.pincode}
                  onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                  placeholder="400050"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="md">
              Save Salon Profile
            </Button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 2: WORKING HOURS                                     */}
      {/* ======================================================== */}
      {activeTab === 'hours' && (
        <form onSubmit={handleSaveHours} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Weekly Salon Operating Schedule
              </CardTitle>
              <CardDescription>
                Configure standard opening and closing hours for each day of the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/60">
                {openHoursState.map((slot, index) => (
                  <div
                    key={slot.day}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 w-36">
                      <span className="font-semibold text-text-primary text-sm">{slot.day}</span>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!slot.closed}
                          onChange={(e) => {
                            const updated = [...openHoursState]
                            updated[index] = { ...slot, closed: !e.target.checked }
                            setOpenHoursState(updated)
                          }}
                          className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                        />
                        <span className="font-medium text-text-secondary">
                          {slot.closed ? 'Closed' : 'Open'}
                        </span>
                      </label>

                      {!slot.closed && (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={slot.open}
                            onChange={(e) => {
                              const updated = [...openHoursState]
                              updated[index] = { ...slot, open: e.target.value }
                              setOpenHoursState(updated)
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-xs font-mono"
                          />
                          <span className="text-text-muted">to</span>
                          <input
                            type="time"
                            value={slot.close}
                            onChange={(e) => {
                              const updated = [...openHoursState]
                              updated[index] = { ...slot, close: e.target.value }
                              setOpenHoursState(updated)
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-xs font-mono"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appointment Buffer & Windows</CardTitle>
              <CardDescription>Turnaround buffer times and advance scheduling window</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Buffer Time Between Slots
                </label>
                <select
                  value={bookingForm.bufferTimeMinutes}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      bufferTimeMinutes: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-medium text-text-primary"
                >
                  <option value={0}>No buffer (0 mins)</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes (Recommended)</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Max Advance Booking
                </label>
                <select
                  value={bookingForm.advanceBookingDays}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      advanceBookingDays: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-medium text-text-primary"
                >
                  <option value={7}>7 days in advance</option>
                  <option value={14}>14 days in advance</option>
                  <option value={30}>30 days in advance</option>
                  <option value={60}>60 days in advance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Cancellation Window
                </label>
                <select
                  value={bookingForm.cancellationWindowHours}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      cancellationWindowHours: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-medium text-text-primary"
                >
                  <option value={2}>2 hours before</option>
                  <option value={6}>6 hours before</option>
                  <option value={12}>12 hours before</option>
                  <option value={24}>24 hours before</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="md">
              Save Working Hours
            </Button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SERVICES CONFIGURATION                            */}
      {/* ======================================================== */}
      {activeTab === 'services' && (
        <form onSubmit={handleSaveServicesConfig} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    Online Customer Self-Service Booking
                  </CardTitle>
                  <CardDescription>
                    Enable self-service customer appointment bookings via the customer portal and web widget
                  </CardDescription>
                </div>
                <Badge variant={bookingForm.onlineBookingEnabled ? 'success' : 'default'}>
                  {bookingForm.onlineBookingEnabled ? 'ACTIVE & ONLINE' : 'PAUSED'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <label className="flex items-center justify-between p-4 rounded-xl bg-surface-subtle border border-border cursor-pointer hover:bg-surface transition-colors">
                <div>
                  <span className="font-bold text-text-primary block text-sm">
                    Allow Online Customer Bookings
                  </span>
                  <span className="text-text-muted text-xs">
                    When enabled, clients can view real-time availability and schedule services online.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={bookingForm.onlineBookingEnabled}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      onlineBookingEnabled: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded text-primary focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
                />
              </label>

              {/* Direct Booking Link */}
              <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-text-primary block">
                      Direct Customer Booking URL
                    </span>
                    <span className="text-[11px] text-text-muted font-mono">
                      {typeof window !== 'undefined' ? `${window.location.origin}/customer/book` : '/customer/book'}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Copy className="h-3.5 w-3.5" />}
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(`${window.location.origin}/customer/book`)
                      addToast({
                        title: 'URL Copied',
                        message: 'Customer booking link copied to clipboard.',
                        type: 'info',
                      })
                    }
                  }}
                >
                  Copy URL
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Service Visibility & Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Catalog Visibility & Pricing Display</CardTitle>
              <CardDescription>Controls what information customers see when browsing treatments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-border cursor-pointer hover:bg-surface transition-colors">
                <div>
                  <span className="font-bold text-text-primary block">
                    Show Service Pricing
                  </span>
                  <span className="text-text-muted text-[11px]">
                    Display rates upfront on customer booking menu
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={bookingForm.showPricing}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      showPricing: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-primary cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-border cursor-pointer hover:bg-surface transition-colors">
                <div>
                  <span className="font-bold text-text-primary block">
                    Show Service Duration
                  </span>
                  <span className="text-text-muted text-[11px]">
                    Show estimated treatment duration badge (e.g. 60 mins)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={bookingForm.showServiceDuration}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      showServiceDuration: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-primary cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-border cursor-pointer hover:bg-surface transition-colors">
                <div>
                  <span className="font-bold text-text-primary block">
                    Allow Staff Selection
                  </span>
                  <span className="text-text-muted text-[11px]">
                    Let clients pick their preferred stylist or specialist
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={bookingForm.allowStaffSelection}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      allowStaffSelection: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-primary cursor-pointer"
                />
              </label>
            </CardContent>
          </Card>

          {/* Quick link to Services Catalog */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-text-primary text-sm">Services & Pricing Catalog</h4>
                <p className="text-xs text-text-muted">Manage haircuts, styling, spa rituals, and pricing packages</p>
              </div>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors"
            >
              <span>Manage Services</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="md">
              Save Services Configuration
            </Button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 4: TAX & GST                                         */}
      {/* ======================================================== */}
      {activeTab === 'tax' && (
        <form onSubmit={handleSaveTax} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" />
                Goods &amp; Services Tax (GST) &amp; Legal Identification
              </CardTitle>
              <CardDescription>
                Statutory tax identification and billing percentages applied on POS invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-border cursor-pointer hover:bg-surface transition-colors">
                <div>
                  <span className="font-bold text-text-primary block text-sm">
                    GST Registered Business
                  </span>
                  <span className="text-text-muted text-xs">
                    Enable GST tax calculation (CGST + SGST) on customer receipts and billing slips
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={taxForm.isGstRegistered}
                  onChange={(e) =>
                    setTaxForm({
                      ...taxForm,
                      isGstRegistered: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded text-primary cursor-pointer"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GSTIN (Goods & Services Tax Identification Number)"
                  value={taxForm.gstin}
                  onChange={(e) => setTaxForm({ ...taxForm, gstin: e.target.value.toUpperCase() })}
                  placeholder="27AABCU9603R1ZM"
                  maxLength={15}
                  required
                />
                <Input
                  label="PAN Number (Permanent Account Number)"
                  value={taxForm.panNumber}
                  onChange={(e) => setTaxForm({ ...taxForm, panNumber: e.target.value.toUpperCase() })}
                  placeholder="AABCU9603R"
                  maxLength={10}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Legal Entity / Registered Business Name"
                  value={taxForm.legalBusinessName}
                  onChange={(e) => setTaxForm({ ...taxForm, legalBusinessName: e.target.value })}
                  placeholder="Salora Salon & Wellness Private Limited"
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Default GST Rate
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="28"
                      value={taxForm.taxRatePercent}
                      onChange={(e) =>
                        setTaxForm({
                          ...taxForm,
                          taxRatePercent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary tabular-nums"
                    />
                    <span className="absolute right-3 top-2.5 text-text-muted text-xs font-bold pointer-events-none">
                      % GST (9% CGST + 9% SGST)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="md">
              Save Tax &amp; GST Settings
            </Button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 5: RECEIPT & PRINTING                                */}
      {/* ======================================================== */}
      {activeTab === 'printing' && (
        <form onSubmit={handleSavePrinting} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-4 w-4 text-primary" />
                Thermal Hardware &amp; Paper Size
              </CardTitle>
              <CardDescription>
                Select standard thermal paper formats matching reception receipt printers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: '80mm', label: '80mm Thermal (Standard)', desc: 'Full-width receipt rolls (ESC/POS 80mm)' },
                  { id: '58mm', label: '58mm Thermal (Compact)', desc: 'Pocket / Bluetooth mobile printers' },
                  { id: 'A4', label: 'A4 Document Format', desc: 'Standard laser desktop printer' },
                ].map((paper) => (
                  <label
                    key={paper.id}
                    className={`p-3.5 rounded-xl border cursor-pointer text-left transition-all ${
                      printingForm.paperWidth === paper.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-surface-subtle hover:bg-surface'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paperWidth"
                      value={paper.id}
                      checked={printingForm.paperWidth === paper.id}
                      onChange={() => setPrintingForm({ ...printingForm, paperWidth: paper.id as any })}
                      className="sr-only"
                    />
                    <span className="font-bold text-text-primary block text-xs">{paper.label}</span>
                    <span className="text-text-muted text-[11px] block mt-1">{paper.desc}</span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Queue Token Prefix"
                  value={printingForm.tokenPrefix}
                  onChange={(e) => setPrintingForm({ ...printingForm, tokenPrefix: e.target.value.toUpperCase() })}
                  placeholder="GP-"
                />
                <div className="space-y-2 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printingForm.showGstNumber}
                      onChange={(e) => setPrintingForm({ ...printingForm, showGstNumber: e.target.checked })}
                      className="w-4 h-4 rounded text-primary cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-text-primary">Print GST Number on Invoices</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printingForm.autoPrintReceipts}
                      onChange={(e) => setPrintingForm({ ...printingForm, autoPrintReceipts: e.target.checked })}
                      className="w-4 h-4 rounded text-primary cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-text-primary">Auto-print receipt upon successful POS checkout</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receipt Header &amp; Footer Text</CardTitle>
              <CardDescription>Custom message text displayed at the top and bottom of thermal customer slips</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Receipt Header</label>
                <textarea
                  rows={2}
                  value={printingForm.receiptHeader}
                  onChange={(e) => setPrintingForm({ ...printingForm, receiptHeader: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Salora Salon & Wellness&#10;450 N Bedford Drive, Bandra West, Mumbai"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Receipt Footer</label>
                <textarea
                  rows={2}
                  value={printingForm.receiptFooter}
                  onChange={(e) => setPrintingForm({ ...printingForm, receiptFooter: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Thank you for visiting Salora!&#10;For appointments call +91 98200 12345"
                />
              </div>
            </CardContent>
          </Card>

          {/* Test Prints */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Test Prints</CardTitle>
              <CardDescription>Fire test jobs to verify printer alignment, margins, and paper feed</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestPrint('token')}
                leftIcon={<Printer className="h-3.5 w-3.5 text-primary" />}
                className="text-xs"
              >
                Test Token Slip
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestPrint('invoice_58mm')}
                leftIcon={<Receipt className="h-3.5 w-3.5" />}
                className="text-xs"
              >
                Test 58mm Thermal
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestPrint('invoice_80mm')}
                leftIcon={<Receipt className="h-3.5 w-3.5 text-emerald-500" />}
                className="text-xs"
              >
                Test 80mm Thermal
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestPrint('invoice_a4')}
                leftIcon={<FileText className="h-3.5 w-3.5 text-blue-500" />}
                className="text-xs"
              >
                Test A4 Invoice
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="md">
              Save Receipt &amp; Printing Settings
            </Button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* TAB: OWNER PROFILE                                       */}
      {/* ======================================================== */}
      {activeTab === 'owner' && (
        <form onSubmit={handleSaveOwnerProfile} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Salon Owner Identity
              </CardTitle>
              <CardDescription>
                Primary business workstation credentials and display identity for Salora
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Display Name"
                  value={ownerForm.name}
                  onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
                  placeholder="e.g. Ayaan Sharma"
                  required
                />
                <Input
                  label="Login Username"
                  value={ownerForm.username}
                  onChange={(e) => setOwnerForm({ ...ownerForm, username: e.target.value.toLowerCase().trim() })}
                  placeholder="e.g. owner"
                  required
                />
              </div>

              <Input
                label="Avatar / Profile Photo URL"
                value={ownerForm.avatarUrl}
                onChange={(e) => setOwnerForm({ ...ownerForm, avatarUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Terminal Password</CardTitle>
              <CardDescription>
                Update your login password. Leave password fields blank if you do not wish to change your password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={ownerForm.currentPassword}
                onChange={(e) => setOwnerForm({ ...ownerForm, currentPassword: e.target.value })}
                placeholder="Enter current password…"
                autoComplete="current-password"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Password"
                  type="password"
                  value={ownerForm.newPassword}
                  onChange={(e) => setOwnerForm({ ...ownerForm, newPassword: e.target.value })}
                  placeholder="Minimum 6 characters…"
                  autoComplete="new-password"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={ownerForm.confirmPassword}
                  onChange={(e) => setOwnerForm({ ...ownerForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password…"
                  autoComplete="new-password"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="md" isLoading={isSavingOwner}>
              Save Owner Profile
            </Button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 7: NOTIFICATIONS                                     */}
      {/* ======================================================== */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSaveNotifications} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Customer &amp; Salon Operational Notifications
              </CardTitle>
              <CardDescription>Automated alerts delivered via SMS, WhatsApp, and email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="SMS / Sender ID"
                  value={notificationForm.senderId}
                  onChange={(e) => setNotificationForm({ ...notificationForm, senderId: e.target.value.toUpperCase() })}
                  placeholder="SALORA"
                  maxLength={6}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-border cursor-pointer hover:bg-surface transition-colors">
                  <div>
                    <span className="font-bold text-text-primary block">
                      Appointment SMS Reminders
                    </span>
                    <span className="text-text-muted text-[11px]">
                      Send automated SMS confirmation &amp; reminder 2 hours prior
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationForm.sendAppointmentSms}
                    onChange={(e) => setNotificationForm({ ...notificationForm, sendAppointmentSms: e.target.checked })}
                    className="w-4 h-4 rounded text-primary cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-border cursor-pointer hover:bg-surface transition-colors">
                  <div>
                    <span className="font-bold text-text-primary block">
                      WhatsApp Appointment &amp; Queue Alerts
                    </span>
                    <span className="text-text-muted text-[11px]">
                      Send live queue tokens and booking confirmations on WhatsApp
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationForm.sendAppointmentWhatsapp}
                    onChange={(e) => setNotificationForm({ ...notificationForm, sendAppointmentWhatsapp: e.target.checked })}
                    className="w-4 h-4 rounded text-primary cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-border cursor-pointer hover:bg-surface transition-colors">
                  <div>
                    <span className="font-bold text-text-primary block">
                      Email Invoices &amp; Receipts
                    </span>
                    <span className="text-text-muted text-[11px]">
                      Automatically email PDF receipts upon checkout completion
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationForm.sendEmailReceipts}
                    onChange={(e) => setNotificationForm({ ...notificationForm, sendEmailReceipts: e.target.checked })}
                    className="w-4 h-4 rounded text-primary cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-border cursor-pointer hover:bg-surface transition-colors">
                  <div>
                    <span className="font-bold text-text-primary block">
                      Promotional Campaigns &amp; Offers
                    </span>
                    <span className="text-text-muted text-[11px]">
                      Allow marketing broadcasts to opted-in client numbers
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationForm.sendMarketingPromos}
                    onChange={(e) => setNotificationForm({ ...notificationForm, sendMarketingPromos: e.target.checked })}
                    className="w-4 h-4 rounded text-primary cursor-pointer"
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="md">
              Save Notification Settings
            </Button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 8: SECURITY & AUDIT                                  */}
      {/* ======================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-surface-subtle border border-border w-fit">
            <button
              type="button"
              onClick={() => setSecuritySubTab('access')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                securitySubTab === 'access'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Security &amp; Access Controls
            </button>
            <button
              type="button"
              onClick={() => setSecuritySubTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                securitySubTab === 'audit'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Immutable Audit Trail
            </button>
          </div>

          {securitySubTab === 'access' ? (
            <div className="pt-2">
              <SecuritySettingsPage />
            </div>
          ) : (
            <div className="pt-2">
              <AuditLogPage />
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 9: DATA EXPORT                                       */}
      {/* ======================================================== */}
      {activeTab === 'export' && (
        <div className="pt-2">
          <DataExportPage />
        </div>
      )}
    </div>
  )
}
