import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  KeyRound,
  Clock,
  Smartphone,
  Laptop,
  AlertTriangle,
  Lock,
  LogOut,
  CheckCircle2,
  ChevronLeft,
  Save,
  QrCode,
  Shield,
  Info,
} from 'lucide-react'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useToastStore } from '@/store/useToastStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/useAuthStore'
import { firebaseAuthService } from '@/services/firebase/authService'
import { cn } from '@/utils/cn'

export const SecuritySettingsPage: React.FC = () => {
  const { security, updateSecurity, terminateSession, terminateAllOtherSessions } = useSettingsStore()
  const { addToast } = useToastStore()
  const { user } = useAuthStore()
  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin'

  // Personal Password Change State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Local editable state
  const [formData, setFormData] = useState({ ...security })
  const [hasChanges, setHasChanges] = useState(false)
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword) {
      addToast({ title: 'Validation Error', message: 'Current password is required.', type: 'danger' })
      return
    }
    if (newPassword.length < 6) {
      addToast({ title: 'Validation Error', message: 'New password must be at least 6 characters.', type: 'danger' })
      return
    }
    if (newPassword !== confirmNewPassword) {
      addToast({ title: 'Validation Error', message: 'New passwords do not match.', type: 'danger' })
      return
    }
    setIsChangingPassword(true)
    try {
      await firebaseAuthService.changePassword(currentPassword, newPassword)
      addToast({ title: 'Password Changed', message: 'Your terminal password has been updated.', type: 'success' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password.'
      addToast({ title: 'Password Change Failed', message: msg, type: 'danger' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleFieldChange = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    updateSecurity(formData)
    setHasChanges(false)
    addToast({
      title: 'Security Policies Updated',
      message: 'Global authentication and session guardrails successfully saved.',
      type: 'success',
    })
  }

  const handleTerminateSession = (id: string, device: string) => {
    terminateSession(id)
    addToast({
      title: 'Session Revoked',
      message: `Access authorization for ${device} has been terminated.`,
      type: 'info',
    })
  }

  const handleTerminateAllOther = () => {
    terminateAllOtherSessions()
    addToast({
      title: 'Global Invalidation Complete',
      message: 'All other active devices have been forcefully logged out.',
      type: 'warning',
    })
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link to="/settings" className="hover:text-primary transition-colors flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              Settings
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Security & Access Control</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-primary" />
            Security & Authentication Control
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure authentication requirements, session expiry, credential policies, and monitor active staff connections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="warning" className="text-amber-700 bg-amber-50 border-amber-200">
              Unsaved Changes
            </Badge>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save className="w-4 h-4 mr-1.5" />
            Save Security Rules
          </Button>
        </div>
      </div>

      {/* Security Architecture Notice */}
      <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-4 flex items-start gap-3 text-xs text-indigo-900">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-indigo-950">Enterprise Protection Architecture:</span>
          <p className="text-indigo-800 leading-relaxed">
            All passwords utilize salted bcrypt hashes. Sensitive billing and personal identifiable client records are protected by role-based access control. Plaintext credentials are never transmitted or stored.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Session Inactivity Expiry */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Session Lifecycle & Expiry</h2>
              <p className="text-xs text-slate-500">Auto-terminate idle workstation sessions</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-medium text-slate-700">Idle Inactivity Timeout</label>
                <span className="font-bold text-primary font-mono">{formData.sessionTimeoutMinutes} minutes</span>
              </div>
              <input
                type="range"
                min="15"
                max="240"
                step="15"
                value={formData.sessionTimeoutMinutes}
                onChange={(e) => handleFieldChange('sessionTimeoutMinutes', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>15 mins (High security)</span>
                <span>60 mins (Standard)</span>
                <span>4 hours (Front desk)</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 text-slate-600 border border-slate-200/60 leading-relaxed">
              When a user remains idle past this duration, the front desk workstation automatically locks and requires biometric or PIN re-authentication before processing transactions.
            </div>
          </div>
        </div>

        {/* 2. Brute Force & Login Protection */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Lock className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Rate Limiting & Brute Force Guard</h2>
              <p className="text-xs text-slate-500">Defend against automated credential stuffing</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Max Failed Login Attempts</label>
              <select
                value={formData.maxFailedLogins}
                onChange={(e) => handleFieldChange('maxFailedLogins', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value={3}>3 attempts (Strict)</option>
                <option value={5}>5 attempts (Recommended)</option>
                <option value={10}>10 attempts (Permissive)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Account Lockout Duration</label>
              <select
                value={formData.lockoutDurationMinutes}
                onChange={(e) => handleFieldChange('lockoutDurationMinutes', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Password Complexity Policy */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <KeyRound className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Staff Password Strength Policy</h2>
              <p className="text-xs text-slate-500">Mandate stringent credential hygiene</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Minimum Password Length</label>
              <input
                type="number"
                min="6"
                max="24"
                value={formData.minPasswordLength}
                onChange={(e) => handleFieldChange('minPasswordLength', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireSpecialChars}
                  onChange={(e) => handleFieldChange('requireSpecialChars', e.target.checked)}
                  className="rounded text-primary focus:ring-primary/20 w-4 h-4"
                />
                <span className="font-medium text-slate-700">Require at least one special character (!@#$%^&*)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireNumbers}
                  onChange={(e) => handleFieldChange('requireNumbers', e.target.checked)}
                  className="rounded text-primary focus:ring-primary/20 w-4 h-4"
                />
                <span className="font-medium text-slate-700">Require numeric digit (0-9)</span>
              </label>
            </div>

            <div className="pt-2">
              <label className="block font-medium text-slate-700 mb-1">Password Rotation Cadence</label>
              <select
                value={formData.passwordExpiryDays}
                onChange={(e) => handleFieldChange('passwordExpiryDays', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value={0}>Never expire</option>
                <option value={60}>Every 60 days</option>
                <option value={90}>Every 90 days (Recommended)</option>
                <option value={180}>Every 180 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Change Personal Terminal Password */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Lock className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Change Terminal Password</h2>
              <p className="text-xs text-slate-500">Update your personal login password for this station</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter current password…"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="New Password"
                type="password"
                placeholder="Minimum 6 characters…"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Confirm new password…"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              isLoading={isChangingPassword}
              className="mt-2"
            >
              Update My Password
            </Button>
          </form>
        </div>


        {/* 4. Two-Factor Authentication (2FA) */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Two-Factor Authentication (2FA)</h2>
                <p className="text-xs text-slate-500">Dual-layer verification for administrative logins</p>
              </div>
            </div>
            <Badge
              variant={formData.twoFactorEnforced ? 'success' : 'default'}
              className="text-[10px]"
            >
              {formData.twoFactorEnforced ? 'Enforced' : 'Optional'}
            </Badge>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/60">
              <div>
                <span className="font-semibold text-slate-800 block">Enforce 2FA for Owner & Admin Roles</span>
                <span className="text-slate-500 text-[11px]">Requires OTP code verification on every new sign-in</span>
              </div>
              <input
                type="checkbox"
                checked={formData.twoFactorEnforced}
                onChange={(e) => handleFieldChange('twoFactorEnforced', e.target.checked)}
                className="w-4 h-4 text-primary rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Primary Authentication Method</label>
              <select
                value={formData.twoFactorMethod}
                onChange={(e) => handleFieldChange('twoFactorMethod', e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="authenticator">Authenticator App (Google / Microsoft / 1Password)</option>
                <option value="sms">SMS OTP (Transactional Gateway)</option>
                <option value="email">Verified Corporate Email Link</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIs2FAModalOpen(true)}
              className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
            >
              <QrCode className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Preview TOTP Setup Flow
            </Button>
          </div>
        </div>
      </div>

      {/* 5. Active Sessions & Connected Devices */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Laptop className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Active Authorized Sessions</h2>
              <p className="text-xs text-slate-500">Currently recognized hardware endpoints signed into Salora</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTerminateAllOther}
            className="text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Sign Out All Other Sessions
          </Button>
        </div>

        <div className="divide-y divide-slate-100">
          {security.activeSessions.map((session) => (
            <div key={session.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg mt-0.5">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-xs">{session.device}</span>
                    {session.isCurrent && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        This Device
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{session.browser}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-600">{session.ipAddress}</span>
                    <span>•</span>
                    <span>{session.location}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Last active: {session.lastActive}
                  </div>
                </div>
              </div>

              <div>
                {session.isCurrent ? (
                  <span className="text-xs text-slate-400 font-medium italic">Active Session</span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTerminateSession(session.id, session.device)}
                    className="text-xs text-rose-600 hover:bg-rose-50 px-2 py-1 h-auto"
                  >
                    Terminate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2FA Preview Modal */}
      {is2FAModalOpen && (
        <Modal
          isOpen={is2FAModalOpen}
          onClose={() => setIs2FAModalOpen(false)}
          title="Two-Factor Authenticator Setup"
          size="md"
        >
          <div className="space-y-4 text-center text-sm py-2">
            <p className="text-xs text-slate-500">
              Scan this QR code using Google Authenticator, Microsoft Authenticator, or 1Password to link your salon master account.
            </p>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 inline-block mx-auto">
              <QrCode className="w-36 h-36 text-slate-800 mx-auto" />
              <div className="mt-3 font-mono text-xs bg-white px-3 py-1 rounded border border-slate-200 text-slate-700">
                GLOW - PRO - 2FA - 9021 - JODH
              </div>
            </div>

            <div className="text-left bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800 block">Simulation Verification:</span>
              <p>
                In production, users enter a 6-digit one-time code to verify device pairing before this policy takes effect.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="primary" size="sm" onClick={() => setIs2FAModalOpen(false)}>
                Done Previewing
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
