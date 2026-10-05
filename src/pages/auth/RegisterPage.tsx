import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sparkles, Mail, Lock, User, Phone, Building2, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useToastStore } from '@/store/useToastStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  salonName: z.string().min(2, 'Salon name must be at least 2 characters'),
  email: z.string().email('Please enter a valid business email address'),
  phone: z.string().min(7, 'Please enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  terms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms & salon policies' }),
  }),
})

type RegisterFormData = z.infer<typeof registerSchema>

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { registerUser, isLoading } = useAuthStore()
  const { addToast } = useToastStore()
  const [registerError, setRegisterError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      salonName: '',
      email: '',
      phone: '',
      password: '',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setRegisterError(null)
    try {
      await registerUser({
        fullName: data.fullName,
        salonName: data.salonName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: 'owner',
      })
      addToast({
        title: 'Account Created',
        message: 'Welcome to SALORA! Your salon has been created.',
        type: 'success',
      })
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create account.'
      setRegisterError(msg)
      addToast({
        title: 'Registration Error',
        message: msg,
        type: 'danger',
      })
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* Left Column: Branding Showcase */}
      <div className="lg:w-1/2 bg-[#0F0E1E] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[#1E1B38]">
        <div
          className="absolute -top-24 -left-24 w-96 h-96 bg-primary/25 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent/25 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-white/20 shadow-sm p-1.5 shrink-0">
            <img
              src="/salora.png"
              alt="Salora"
              className="h-8 w-8 object-contain"
              width={32}
              height={32}
            />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white font-sans" translate="no">
              SALORA
            </span>
            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-teal-100 border border-primary/30">
              New Salon Setup
            </span>
          </div>
        </div>

        <div className="relative z-10 my-12 lg:my-0 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-slate-200 text-xs font-semibold border border-white/10">
            <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span>Single-Salon Professional Management</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-sans leading-tight">
            Start managing your salon with effortless precision.
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Create an owner account in seconds. Powered by Firebase Authentication for complete security and fast real-time synchronization.
          </p>

          <div className="space-y-3 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>Full access to calendar scheduling, staff rosters & POS</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>Real Firebase Authentication with industry-standard encryption</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>Direct inventory tracking, reports & client billing</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-slate-500">
          Single-Salon Architecture · One Location · One Primary Owner
        </div>
      </div>

      {/* Right Column: Register Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary font-sans">
              Create Salon Account
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Register as a salon owner with your business email and password.
            </p>
          </div>

          {registerError && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-medium"
            >
              {registerError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Your Full Name"
              placeholder="e.g. Ayaan Sharma…"
              leftIcon={<User className="h-4 w-4" />}
              autoComplete="name"
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              label="Salon Business Name"
              placeholder="e.g. Salora Luxe Salon & Spa…"
              leftIcon={<Building2 className="h-4 w-4" />}
              autoComplete="organization"
              error={errors.salonName?.message}
              {...register('salonName')}
            />

            <Input
              label="Business Email Address"
              type="email"
              placeholder="owner@luxesalon.com…"
              leftIcon={<Mail className="h-4 w-4" />}
              autoComplete="email"
              spellCheck={false}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Contact Phone Number"
              type="tel"
              placeholder="+91 98200 00000…"
              leftIcon={<Phone className="h-4 w-4" />}
              autoComplete="tel"
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Input
              label="Create Password"
              type="password"
              placeholder="At least 6 characters…"
              leftIcon={<Lock className="h-4 w-4" />}
              autoComplete="new-password"
              spellCheck={false}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="pt-1">
              <label className="flex items-start gap-2.5 text-xs text-text-secondary cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 mt-0.5"
                  {...register('terms')}
                />
                <span>
                  I agree to the SALORA Master Services Agreement, Privacy Policy and Salon Data Terms.
                </span>
              </label>
              {errors.terms && (
                <p className="text-xs text-danger font-medium mt-1">
                  {errors.terms.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-glow-primary/30"
              isLoading={isLoading}
            >
              Create Account & Sign In
            </Button>
          </form>

          <div className="text-center text-xs text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
