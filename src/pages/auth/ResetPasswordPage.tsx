import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Scissors, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { authService } from '@/services/authService'
import { useToastStore } from '@/store/useToastStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const resetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetFormData = z.infer<typeof resetSchema>

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || 'demo_token_123'
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (data: ResetFormData) => {
    setIsSubmitting(true)
    try {
      await authService.resetPassword(token, data.password)
      setIsSuccess(true)
      addToast({
        title: 'Password Updated',
        message: 'Your password has been changed successfully. You can now sign in.',
        type: 'success',
      })
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password.'
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary to-accent shadow-glow-primary/40 flex items-center justify-center text-white mb-2">
            <Scissors className="h-6 w-6 -rotate-45" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
            Set New Password
          </h1>
          <p className="text-xs text-text-muted max-w-xs">
            Choose a strong password with at least 6 characters for your SALORA account.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="h-12 w-12 rounded-full bg-success-light text-success flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-text-primary">Password Changed!</h3>
              <p className="text-xs text-text-muted">
                Redirecting you to the sign in page…
              </p>
              <Link to="/login">
                <Button variant="primary" size="sm" className="mt-2">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters…"
                leftIcon={<Lock className="h-4 w-4" />}
                autoComplete="new-password"
                spellCheck={false}
                error={errors.password?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="p-1 rounded text-text-muted hover:text-text-primary"
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

              <Input
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password…"
                leftIcon={<Lock className="h-4 w-4" />}
                autoComplete="new-password"
                spellCheck={false}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full shadow-glow-primary/30"
                isLoading={isSubmitting}
              >
                Update Password & Sign In
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs font-semibold text-text-muted hover:text-text-primary">
                  Cancel and return to login
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
