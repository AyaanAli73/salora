import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/useAuthStore'
import { useToastStore } from '@/store/useToastStore'

const forgotSchema = z.object({
  email: z.string().min(1, 'Please enter your email address').email('Please enter a valid email address'),
})

type ForgotFormData = z.infer<typeof forgotSchema>

export const ForgotPasswordPage: React.FC = () => {
  const { sendPasswordReset } = useAuthStore()
  const { addToast } = useToastStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotFormData) => {
    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      await sendPasswordReset(data.email.trim().toLowerCase())
      setSubmittedEmail(data.email.trim())
      setIsSubmitted(true)
      addToast({
        title: 'Reset Link Sent',
        message: `Password reset instructions have been emailed to ${data.email}.`,
        type: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send reset link. Please try again.'
      setErrorMessage(msg)
      addToast({
        title: 'Reset Failed',
        message: msg,
        type: 'danger',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-surface-subtle via-background to-primary/5">
      <div className="w-full max-w-md space-y-6">
        {/* Branding header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-surface border border-border shadow-xs mx-auto p-2">
            <img
              src="/salora.png"
              alt="Salora Logo"
              className="h-9 w-9 object-contain"
              width={36}
              height={36}
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans" translate="no">
            SALORA
          </h1>
          <p className="text-xs text-text-muted max-w-xs">
            Password Recovery
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {isSubmitted ? (
            <div className="space-y-4 text-center py-2">
              <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Reset Email Dispatched</h3>
                <p className="text-xs text-text-muted mt-2 leading-relaxed text-left bg-surface-subtle p-3.5 rounded-xl border border-border">
                  We have sent a secure password reset link to <strong className="text-text-primary">{submittedEmail}</strong>.
                  Please check your email inbox and follow the instructions to create a new password.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <p className="text-xs text-text-muted leading-relaxed">
                Enter your registered business email address below. We'll send you a secure link to reset your password.
              </p>

              {errorMessage && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-medium"
                >
                  {errorMessage}
                </div>
              )}

              <Input
                label="Registered Email"
                type="email"
                placeholder="owner@your-salon.com…"
                leftIcon={<Mail className="h-4 w-4" />}
                autoComplete="email"
                spellCheck={false}
                error={errors.email?.message}
                {...register('email')}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-semibold"
                isLoading={isSubmitting}
              >
                Send Password Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </Card>

        {/* Minimal Salon Footer */}
        <p className="text-center text-[11px] text-text-muted">
          <span translate="no" className="font-semibold text-text-secondary">
            SALORA
          </span>{' '}
          · Single-Salon Management System
        </p>
      </div>
    </div>
  )
}
