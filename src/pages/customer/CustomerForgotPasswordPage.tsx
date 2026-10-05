import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sparkles,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
} from 'lucide-react'
import { customerAuthService } from '@/services/customerAuthService'

const forgotSchema = z.object({
  identifier: z
    .string()
    .min(3, 'Please enter your registered phone number or email address.'),
})

type ForgotFormValues = z.infer<typeof forgotSchema>

export const CustomerForgotPasswordPage: React.FC = () => {
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      identifier: 'priya.sharma@example.com',
    },
  })

  const onSubmit = async (data: ForgotFormValues) => {
    try {
      setFormError(null)
      const res = await customerAuthService.forgotPassword(data.identifier)
      setSuccessMessage(res.message)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to request password reset.'
      setFormError(msg)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
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

        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white">
          Reset Your Access
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter your registered email address or mobile phone to receive a quick verification code
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
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

          {successMessage ? (
            <div className="space-y-4">
              <div
                role="status"
                aria-live="polite"
                className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start space-x-3"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-emerald-200">Reset Instructions Sent</p>
                  <p className="mt-1 text-xs text-emerald-300/90 leading-relaxed">{successMessage}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <span className="font-semibold text-violet-300">Demo Code:</span> Use mock verification code{' '}
                <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-amber-300">774411</span> to proceed in real integration.
              </div>

              <Link
                to="/customer/login"
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Login</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <label htmlFor="forgot-identifier" className="block text-sm font-medium text-slate-200">
                  Registered Phone or Email
                </label>
                <div className="mt-1.5 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    id="forgot-identifier"
                    type="text"
                    spellCheck={false}
                    placeholder="e.g. priya.sharma@example.com or 9876543210…"
                    {...register('identifier')}
                    className={`block w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      errors.identifier ? 'border-rose-500' : 'border-slate-700'
                    }`}
                  />
                </div>
                {errors.identifier && (
                  <p className="mt-1.5 text-xs text-rose-400" role="alert">
                    {errors.identifier.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shadow-lg shadow-violet-600/30 disabled:opacity-60 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending Instructions…</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Send Reset Code</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/customer/login"
                  className="text-xs font-medium text-slate-400 hover:text-white transition-colors inline-flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Customer Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
