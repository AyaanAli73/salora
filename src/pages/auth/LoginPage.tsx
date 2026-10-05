import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useToastStore } from '@/store/useToastStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

// Secure Single Owner Login Schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Please enter your owner email or username')
    .transform((val) => val.trim()),
  password: z.string().min(1, 'Please enter your password'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, sendPasswordReset, isLoading } = useAuthStore()
  const { addToast } = useToastStore()

  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)

  const fromPath =
    (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  })

  const onLoginSubmit = async (data: LoginFormData) => {
    setAuthError(null)
    try {
      await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      })
      addToast({
        title: 'Welcome Back',
        message: 'Signed in successfully to Salora Salon Dashboard.',
        type: 'success',
      })
      navigate(fromPath, { replace: true })
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Invalid credentials. Please verify and try again.'
      setAuthError(msg)
      addToast({
        title: 'Authentication Failed',
        message: msg,
        type: 'danger',
      })
    }
  }

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError(null)
    const trimmed = forgotEmail.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setForgotError('Please enter a valid email address.')
      return
    }

    setForgotSubmitting(true)
    try {
      await sendPasswordReset(trimmed)
      setForgotSuccess(true)
      addToast({
        title: 'Password Reset Email Sent',
        message: `A secure password reset link has been dispatched to ${trimmed}.`,
        type: 'success',
      })
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Could not send password reset email. Please try again.'
      setForgotError(msg)
    } finally {
      setForgotSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-surface-subtle via-background to-primary/5 p-4 sm:p-6">
      <div className="w-full max-w-[420px] space-y-5">
        {/* Salon Branding Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-surface border border-border shadow-xs mx-auto p-2">
            <img
              src="/salora.png"
              alt="Salora Logo"
              className="h-10 w-10 object-contain"
              width={40}
              height={40}
            />
          </div>
          <div>
            <h1
              className="text-2xl font-black tracking-tight text-text-primary font-sans"
              translate="no"
            >
              SALORA
            </h1>
            <p className="text-xs text-text-muted font-medium mt-0.5">
              Owner Management Terminal
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Single-Salon Private Access</span>
          </div>
        </div>

        {/* Single Owner Login Card */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 sm:p-8 space-y-5">
          <div className="border-b border-border/60 pb-3">
            <h2 className="text-base font-bold text-text-primary font-sans">
              Owner Sign In
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Enter your credentials to access your salon management panel.
            </p>
          </div>

          {/* Auth Error Banner */}
          {authError && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-medium"
            >
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
            <Input
              label="Email Address or Username"
              type="text"
              placeholder="owner@your-salon.com or username…"
              leftIcon={<Mail className="h-4 w-4" />}
              autoComplete="username"
              spellCheck={false}
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password…"
                  leftIcon={<Lock className="h-4 w-4" />}
                  autoComplete="current-password"
                  spellCheck={false}
                  error={errors.password?.message}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="p-1 rounded-md text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  }
                  {...register('password')}
                />
              </div>

              <div className="flex items-center justify-between mt-2.5 text-xs">
                <label className="flex items-center gap-2 text-text-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                    {...register('rememberMe')}
                  />
                  <span>Remember on this terminal</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setForgotSuccess(false)
                    setForgotError(null)
                    setIsForgotModalOpen(true)
                  }}
                  className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold tracking-wide mt-2"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>
        </div>

        {/* Private Salon Software Notice */}
        <p className="text-center text-[11px] text-text-muted leading-relaxed">
          <span translate="no" className="font-semibold text-text-secondary">
            Salora Luxury Salon
          </span>{' '}
          · Dedicated Owner Software
        </p>
      </div>

      {/* Forgot Password Reset Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Password"
        size="sm"
      >
        <div className="p-4 space-y-4">
          {forgotSuccess ? (
            <div className="text-center py-3 space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Email Dispatched</h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  We have sent a secure password reset link to{' '}
                  <strong className="text-text-primary">{forgotEmail}</strong>. Please check your inbox.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                className="w-full mt-2"
                onClick={() => setIsForgotModalOpen(false)}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSendResetLink} className="space-y-3.5">
              <p className="text-xs text-text-muted leading-relaxed">
                Enter your registered owner email address. Firebase will send a secure password reset link to reset your password.
              </p>

              {forgotError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-2.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-medium"
                >
                  {forgotError}
                </div>
              )}

              <Input
                label="Registered Owner Email"
                type="email"
                placeholder="owner@your-salon.com…"
                leftIcon={<Mail className="h-4 w-4" />}
                autoComplete="email"
                spellCheck={false}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsForgotModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={forgotSubmitting}
                >
                  Send Reset Link
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  )
}
