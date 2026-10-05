import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Phone,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Gift,
  ArrowRight,
  Camera,
} from 'lucide-react'
import { customerAuthService } from '@/services/customerAuthService'
import { loyaltyService } from '@/services/loyaltyService'

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name is required (at least 2 characters).'),
    lastName: z.string().min(2, 'Last name is required (at least 2 characters).'),
    phone: z
      .string()
      .min(10, 'Please enter a valid 10-digit mobile phone number.')
      .regex(/^[0-9+\-\s()]+$/, 'Please enter a valid phone format.'),
    email: z.string().email('Please enter a valid email address.'),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['female', 'male', 'non-binary', 'prefer-not-to-say']),
    avatarUrl: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string().min(6, 'Please confirm your password.'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms & salon booking policies.' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export const CustomerRegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [referralCodeInput, setReferralCodeInput] = useState<string>(() => searchParams.get('ref') || '')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      dateOfBirth: '1998-05-20',
      gender: 'female',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      password: '',
      confirmPassword: '',
      acceptTerms: true,
    },
  })

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setFormError(null)
      const newCustomer = await customerAuthService.register({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        avatarUrl: data.avatarUrl,
        password: data.password,
        confirmPassword: data.confirmPassword,
        acceptTerms: data.acceptTerms,
      })

      // If user provided a referral code, award 200 welcome bonus & track referral
      if (referralCodeInput.trim() && newCustomer) {
        try {
          await loyaltyService.applyReferralCode({
            referrerCode: referralCodeInput.trim(),
            referredClientId: newCustomer.id,
            referredClientName: `${newCustomer.firstName} ${newCustomer.lastName}`,
            referredClientPhone: newCustomer.phone,
          })
        } catch (refErr) {
          console.warn('Failed tracking referral on registration:', refErr)
        }
      }

      setIsSuccess(true)
      setTimeout(() => {
        navigate('/customer/dashboard', { replace: true })
      }, 700)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please check your details.'
      setFormError(msg)
    }
  }

  const handleQuickPrefill = () => {
    setValue('firstName', 'Ananya')
    setValue('lastName', 'Deshmukh')
    setValue('phone', '+91 99887 76655')
    setValue('email', 'ananya.deshmukh@example.com')
    setValue('password', 'secret123')
    setValue('confirmPassword', 'secret123')
    setValue('gender', 'female')
    setValue('dateOfBirth', '1996-11-14')
    setFormError(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="flex justify-center">
          <Link
            to="/customer/login"
            className="flex items-center space-x-3 group focus-visible:ring-2 focus-visible:ring-violet-400 rounded-2xl p-1"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-xl shadow-violet-500/30 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-pink-200 bg-clip-text text-transparent">
                SALORA
              </h1>
              <p className="text-xs uppercase tracking-widest font-semibold text-pink-400">
                Customer Lounge
              </p>
            </div>
          </Link>
        </div>

        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Create Your SALORA Account
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          Unlock VIP perks, online slot reservations, and earn 200 welcome points
        </p>

        {/* Welcome Bonus Callout */}
        <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-pink-950/60 to-violet-950/60 border border-pink-500/40 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Gift className="w-5 h-5 text-pink-400 shrink-0" aria-hidden="true" />
            <div className="text-xs text-left">
              <span className="font-semibold text-pink-200">200 Welcome Points Credited</span>
              <p className="text-slate-400">Worth ₹100 instant redemption on your first visit</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickPrefill}
            className="text-xs font-semibold text-pink-300 hover:text-white bg-pink-900/60 hover:bg-pink-800/80 px-2.5 py-1 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-pink-400"
          >
            Prefill Test
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-800">
          {formError && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-rose-300 text-sm"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          {isSuccess && (
            <div
              role="status"
              aria-live="polite"
              className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2.5 text-emerald-300 text-sm"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>Account created! Redirecting to your customer dashboard…</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-first-name" className="block text-xs font-medium text-slate-300">
                  First Name *
                </label>
                <div className="mt-1 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    id="reg-first-name"
                    type="text"
                    autoComplete="given-name"
                    placeholder="e.g. Priya"
                    {...register('firstName')}
                    className={`block w-full pl-9 pr-3 py-2 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      errors.firstName ? 'border-rose-500' : 'border-slate-700'
                    }`}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-xs text-rose-400" role="alert">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reg-last-name" className="block text-xs font-medium text-slate-300">
                  Last Name *
                </label>
                <div className="mt-1 relative rounded-xl shadow-sm">
                  <input
                    id="reg-last-name"
                    type="text"
                    autoComplete="family-name"
                    placeholder="e.g. Sharma"
                    {...register('lastName')}
                    className={`block w-full px-3 py-2 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      errors.lastName ? 'border-rose-500' : 'border-slate-700'
                    }`}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-xs text-rose-400" role="alert">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-phone" className="block text-xs font-medium text-slate-300">
                  Phone Number *
                </label>
                <div className="mt-1 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    id="reg-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210…"
                    {...register('phone')}
                    className={`block w-full pl-9 pr-3 py-2 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      errors.phone ? 'border-rose-500' : 'border-slate-700'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-rose-400" role="alert">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-xs font-medium text-slate-300">
                  Email Address *
                </label>
                <div className="mt-1 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="name@example.com…"
                    {...register('email')}
                    className={`block w-full pl-9 pr-3 py-2 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      errors.email ? 'border-rose-500' : 'border-slate-700'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-400" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* DOB & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-dob" className="block text-xs font-medium text-slate-300">
                  Date of Birth
                </label>
                <div className="mt-1 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    id="reg-dob"
                    type="date"
                    {...register('dateOfBirth')}
                    className="block w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-gender" className="block text-xs font-medium text-slate-300">
                  Gender
                </label>
                <div className="mt-1">
                  <select
                    id="reg-gender"
                    {...register('gender')}
                    className="block w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-Binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-password" className="block text-xs font-medium text-slate-300">
                  Password *
                </label>
                <div className="mt-1 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    spellCheck={false}
                    placeholder="Min 6 characters…"
                    {...register('password')}
                    className={`block w-full pl-9 pr-9 py-2 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      errors.password ? 'border-rose-500' : 'border-slate-700'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-400" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reg-confirm-password" className="block text-xs font-medium text-slate-300">
                  Confirm Password *
                </label>
                <div className="mt-1 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    id="reg-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    spellCheck={false}
                    placeholder="Repeat password…"
                    {...register('confirmPassword')}
                    className={`block w-full pl-9 pr-3 py-2 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      errors.confirmPassword ? 'border-rose-500' : 'border-slate-700'
                    }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-400" role="alert">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* Friend Referral Code Field */}
            <div>
              <label htmlFor="reg-ref-code" className="block text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Friend Referral Code <span className="text-slate-500">(Optional)</span></span>
                <span className="text-[11px] text-pink-400 font-bold">+200 Welcome Bonus Points</span>
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Gift className="w-4 h-4 text-pink-400" aria-hidden="true" />
                </div>
                <input
                  id="reg-ref-code"
                  type="text"
                  placeholder="e.g. PRIYA20 or AYAAN20…"
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 uppercase font-mono font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                />
              </div>
            </div>

            {/* Terms and Policies */}
            <div className="pt-2">
              <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  {...register('acceptTerms')}
                  className="w-4 h-4 mt-0.5 rounded bg-slate-950 border-slate-700 text-violet-600 focus:ring-violet-500"
                />
                <span>
                  I agree to the{' '}
                  <span className="text-pink-400 underline">Salon Terms of Service</span> and{' '}
                  <span className="text-pink-400 underline">Cancellation & Privacy Policy</span>.
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="mt-1 text-xs text-rose-400" role="alert">
                  {errors.acceptTerms.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isSuccess}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:from-violet-500 hover:via-pink-500 hover:to-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500 shadow-lg shadow-violet-600/30 disabled:opacity-60 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Your Profile…</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Profile Created! Loading Lounge…</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link
                to="/customer/login"
                className="font-semibold text-pink-400 hover:text-pink-300 transition-colors focus-visible:ring-2 focus-visible:ring-pink-400 rounded"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
