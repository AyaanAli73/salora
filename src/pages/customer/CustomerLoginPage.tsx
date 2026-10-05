import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { customerAuthService } from '@/services/customerAuthService'

const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'Please enter a valid phone number or email address.'),
  password: z
    .string()
    .min(4, 'Password must be at least 4 characters long.'),
  rememberMe: z.boolean(),
})

type LoginFormValues = z.infer<typeof loginSchema>

export const CustomerLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/customer/dashboard'

  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: 'priya.sharma@example.com',
      password: 'password123',
      rememberMe: true,
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setFormError(null)
      await customerAuthService.login(data.identifier, data.password, data.rememberMe)
      setIsSuccess(true)
      setTimeout(() => {
        navigate(from, { replace: true })
      }, 600)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please verify your phone or email.'
      setFormError(msg)
    }
  }

  const handleDemoFill = () => {
    setValue('identifier', 'priya.sharma@example.com')
    setValue('password', 'password123')
    setValue('rememberMe', true)
    setFormError(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <Link
            to="/customer/dashboard"
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

        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white text-balance">
          Welcome Back to Your Beauty Space
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Book appointments, track loyalty points, and view luxury receipts
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-800">
          {/* Demo Login Quick-Fill Banner */}
          <div className="mb-6 p-3 rounded-2xl bg-violet-950/60 border border-violet-700/50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" aria-hidden="true" />
              <div className="text-left">
                <p className="text-xs font-semibold text-violet-200">Demo Customer Account</p>
                <p className="text-[11px] text-violet-400">Priya Sharma (Gold VIP Member)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-xs font-semibold text-violet-300 hover:text-white bg-violet-800/80 hover:bg-violet-700 px-2.5 py-1 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Fill Demo
            </button>
          </div>

          {/* Form Error Banner */}
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

          {/* Success Banner */}
          {isSuccess && (
            <div
              role="status"
              aria-live="polite"
              className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2.5 text-emerald-300 text-sm"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>Authentication successful! Directing to your lounge…</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Phone or Email */}
            <div>
              <label htmlFor="customer-identifier" className="block text-sm font-medium text-slate-200">
                Phone Number or Email
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="customer-identifier"
                  type="text"
                  autoComplete="username"
                  spellCheck={false}
                  placeholder="e.g. priya.sharma@example.com or 9876543210…"
                  {...register('identifier')}
                  className={`block w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus:border-violet-500 transition-colors ${
                    errors.identifier ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
              </div>
              {errors.identifier && (
                <p className="mt-1.5 text-xs text-rose-400 flex items-center space-x-1" role="alert">
                  <span>{errors.identifier.message}</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="customer-password" className="block text-sm font-medium text-slate-200">
                  Password
                </label>
                <Link
                  to="/customer/forgot-password"
                  className="text-xs font-medium text-pink-400 hover:text-pink-300 transition-colors focus-visible:ring-2 focus-visible:ring-pink-400 rounded"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="customer-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  spellCheck={false}
                  placeholder="Enter your password…"
                  {...register('password')}
                  className={`block w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus:border-violet-500 transition-colors ${
                    errors.password ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-violet-400 rounded"
                  aria-label={showPassword ? 'Hide password text' : 'Show password text'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-400" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center space-x-2.5 cursor-pointer text-sm text-slate-300">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-violet-600 focus:ring-violet-500 focus:ring-offset-slate-900"
                />
                <span>Remember me on this browser</span>
              </label>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:from-violet-500 hover:via-pink-500 hover:to-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500 shadow-lg shadow-violet-600/30 disabled:opacity-60 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In…</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Success! Entering Lounge…</span>
                </>
              ) : (
                <>
                  <span>Sign In to Customer Lounge</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Create Account Link */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-400">
              New to SALORA Luxury Salon?{' '}
              <Link
                to="/customer/register"
                className="font-semibold text-pink-400 hover:text-pink-300 transition-colors focus-visible:ring-2 focus-visible:ring-pink-400 rounded"
              >
                Create Account & Claim 200 Pts
              </Link>
            </p>
          </div>

          {/* Admin Switcher Footnote */}
          <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Salon Staff & Receptionists:</span>
            <Link to="/login" className="text-slate-400 hover:text-white underline">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
