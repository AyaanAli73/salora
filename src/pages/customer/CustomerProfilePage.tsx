import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Lock,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Camera,
  Heart,
  Bell,
  Save,
} from 'lucide-react'
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore'
import { customerAuthService } from '@/services/customerAuthService'
import { useToastStore } from '@/store/useToastStore'

export const CustomerProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { customer, updateProfile } = useCustomerAuthStore()

  // Form local state
  const [firstName, setFirstName] = useState(customer?.firstName || '')
  const [lastName, setLastName] = useState(customer?.lastName || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [email, setEmail] = useState(customer?.email || '')
  const [dateOfBirth, setDateOfBirth] = useState(customer?.dateOfBirth || '')
  const [gender, setGender] = useState<'female' | 'male' | 'non-binary' | 'prefer-not-to-say'>(
    (customer?.gender as any) || 'female'
  )
  const [address, setAddress] = useState<string>(
    typeof customer?.address === 'string'
      ? customer.address
      : customer?.address && typeof customer.address === 'object'
      ? `${(customer.address as any).street || ''}, ${(customer.address as any).city || ''}`
      : ''
  )
  const [preferredStaffName, setPreferredStaffName] = useState(
    customer?.preferredStaffName || 'Rahul Verma'
  )

  // Communication preferences & Opt-In / Opt-Out
  const [emailPref, setEmailPref] = useState(customer?.communicationPrefs?.email ?? true)
  const [smsPref, setSmsPref] = useState(customer?.communicationPrefs?.sms ?? true)
  const [whatsappPref, setWhatsappPref] = useState(customer?.communicationPrefs?.whatsapp ?? true)
  const [transactionalOptIn, setTransactionalOptIn] = useState(
    customer?.communicationPrefs?.transactionalOptIn ?? true
  )
  const [marketingOptIn, setMarketingOptIn] = useState(
    customer?.communicationPrefs?.marketingOptIn ?? true
  )

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({
      firstName,
      lastName,
      phone,
      email,
      dateOfBirth,
      gender,
      address,
      preferredStaffName,
      communicationPrefs: {
        email: emailPref,
        sms: smsPref,
        whatsapp: whatsappPref,
        transactionalOptIn,
        marketingOptIn,
      },
    })
    setSavedSuccess(true)
    useToastStore.getState().addToast({
      title: 'Profile Updated',
      message: 'Your personal preferences and communication consent settings have been saved.',
      type: 'success',
    })
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    if (!currentPassword) {
      setPasswordError('Please provide your current password.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    await customerAuthService.changePassword(currentPassword, newPassword)
    setShowPasswordModal(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you wish to sign out of your customer account?')) {
      customerAuthService.logout()
      navigate('/customer/login')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Avatar Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-violet-950/70 to-slate-900 border border-violet-800/40 p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
          <div className="relative group">
            <img
              src={
                customer?.avatarUrl ||
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
              }
              alt={customer?.fullName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-violet-500/40 shadow-xl"
            />
            <button
              type="button"
              className="absolute bottom-0 right-0 p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 shadow-md transition-transform group-hover:scale-110"
              aria-label="Upload new profile photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{customer?.membershipTier || 'Gold'} Privilege Guest</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{customer?.fullName}</h1>
            <p className="text-xs text-slate-300 mt-0.5">{customer?.email} • {customer?.phone}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Member Since: Feb 2025 • {customer?.totalVisits || 18} Salon Visits Completed
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <Lock className="w-3.5 h-3.5 inline mr-1.5" />
            <span>Change Password</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <LogOut className="w-3.5 h-3.5 inline mr-1.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Profile changes updated successfully!</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2 pb-3 border-b border-slate-800">
            <User className="w-5 h-5 text-violet-400" />
            <span>Personal Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-first-name" className="block text-xs font-medium text-slate-300 mb-1">
                First Name
              </label>
              <input
                id="prof-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              />
            </div>

            <div>
              <label htmlFor="prof-last-name" className="block text-xs font-medium text-slate-300 mb-1">
                Last Name
              </label>
              <input
                id="prof-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              />
            </div>

            <div>
              <label htmlFor="prof-phone" className="block text-xs font-medium text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                id="prof-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              />
            </div>

            <div>
              <label htmlFor="prof-email" className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <input
                id="prof-email"
                type="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              />
            </div>

            <div>
              <label htmlFor="prof-dob" className="block text-xs font-medium text-slate-300 mb-1">
                Date of Birth
              </label>
              <input
                id="prof-dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              />
            </div>

            <div>
              <label htmlFor="prof-gender" className="block text-xs font-medium text-slate-300 mb-1">
                Gender
              </label>
              <select
                id="prof-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-Binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="prof-address" className="block text-xs font-medium text-slate-300 mb-1">
              Residential Address (for Concierge & Home Grooming Services)
            </label>
            <input
              id="prof-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. A-304, Emerald Heights, Linking Road, Bandra West, Mumbai"
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            />
          </div>
        </div>

        {/* Preferences & Stylist */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Heart className="w-5 h-5 text-pink-400" />
            <span>Salon & Aesthetic Preferences</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-preferred-stylist" className="block text-xs font-medium text-slate-300 mb-1">
                Preferred Senior Stylist
              </label>
              <select
                id="prof-preferred-stylist"
                value={preferredStaffName}
                onChange={(e) => setPreferredStaffName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <option value="Rahul Verma">Rahul Verma (Creative Hair Director)</option>
                <option value="Ananya Roy">Ananya Roy (Senior Colorist)</option>
                <option value="Meera Nair">Meera Nair (Master Aesthetician)</option>
                <option value="Vikram Singh">Vikram Singh (Senior Barber)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Favorite Services
              </label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(customer?.preferredServices || ['Hair Spa Ritual', 'Signature Scalp Detox']).map(
                  (s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 text-[11px] font-medium"
                    >
                      {s}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Communication Preferences & Compliance Opt-In / Opt-Out */}
          <div className="pt-5 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-100">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Communication & Consent Preferences</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Telecom & Anti-Spam DND Compliance
              </span>
            </div>

            {/* Primary Opt-In / Opt-Out Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Transactional Messages */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-white">
                      Transactional Messages
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      Essential
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={transactionalOptIn}
                      onChange={(e) => setTransactionalOptIn(e.target.checked)}
                      className="sr-only peer"
                      aria-label="Toggle transactional messages"
                    />
                    <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-[transform,background-color] peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Booking confirmations, appointment reminders (24h/2h before), rescheduling alerts, and digital tax invoices.
                </p>
                <div className="text-[10px] font-medium text-slate-500">
                  Status: {transactionalOptIn ? '✓ Active & Authorized' : '⚠️ Paused (Not Recommended)'}
                </div>
              </div>

              {/* Marketing & Promotional Messages */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-white">
                      Marketing & Promotional
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold">
                      Optional
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={(e) => setMarketingOptIn(e.target.checked)}
                      className="sr-only peer"
                      aria-label="Toggle marketing and promotional messages"
                    />
                    <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-[transform,background-color] peer-checked:bg-violet-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Birthday celebration offers, VIP discount vouchers, festival gifts, and seasonal salon event invitations.
                </p>
                <div className="text-[10px] font-medium text-slate-500">
                  Status: {marketingOptIn ? '✓ Opted In for Offers' : '🚫 Do Not Disturb (DND Active)'}
                </div>
              </div>
            </div>

            {/* Channels Selection */}
            <div className="pt-2">
              <span className="block text-[11px] font-semibold text-slate-400 mb-2">
                Preferred Delivery Channels:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={whatsappPref}
                    onChange={(e) => setWhatsappPref(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 bg-slate-900 border-slate-700 focus-visible:ring-2 focus-visible:ring-violet-500"
                  />
                  <div className="text-xs">
                    <span className="text-slate-200 font-medium block">WhatsApp</span>
                    <span className="text-[10px] text-slate-400">Instant rich cards</span>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={smsPref}
                    onChange={(e) => setSmsPref(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 bg-slate-900 border-slate-700 focus-visible:ring-2 focus-visible:ring-violet-500"
                  />
                  <div className="text-xs">
                    <span className="text-slate-200 font-medium block">SMS Carrier</span>
                    <span className="text-[10px] text-slate-400">Direct phone alerts</span>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={emailPref}
                    onChange={(e) => setEmailPref(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 bg-slate-900 border-slate-700 focus-visible:ring-2 focus-visible:ring-violet-500"
                  />
                  <div className="text-xs">
                    <span className="text-slate-200 font-medium block">Email Inbox</span>
                    <span className="text-[10px] text-slate-400">Invoices & vouchers</span>
                  </div>
                </label>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Notice: In compliance with telecom regulations, promotional marketing is architecturally isolated from operational booking alerts.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all hover:scale-102"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </div>
      </form>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="password-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 id="password-modal-title" className="text-lg font-bold text-white flex items-center space-x-2">
              <Lock className="w-5 h-5 text-pink-400" />
              <span>Update Account Password</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Ensure your new password contains at least 6 characters.
            </p>

            {passwordError && (
              <div
                role="alert"
                className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/30"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
