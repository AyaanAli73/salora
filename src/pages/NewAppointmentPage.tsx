import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, ShieldCheck, Zap } from 'lucide-react'
import { QuickAppointmentForm } from '@/features/appointments/QuickAppointmentForm'
import { Card, CardContent } from '@/components/ui/Card'

export const NewAppointmentPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/appointments"
            className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary inline-flex items-center justify-center"
            aria-label="Back to appointments list"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Link to="/appointments" className="hover:text-primary transition-colors">
                Appointments
              </Link>
              <span>/</span>
              <span className="text-text-primary font-medium">New Booking</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary font-sans">
              Reception Fast Booking
            </h1>
          </div>
        </div>

        {/* Status / Quick Stats Pills */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
            <Zap className="h-3 w-3" />
            1-Screen Fast Desk
          </span>
          <span className="px-2.5 py-1 rounded-full font-medium bg-surface border border-border text-text-muted hidden sm:inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            Conflict Guard Active
          </span>
        </div>
      </div>

      {/* Main Form Card */}
      <Card className="border-primary/20 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-transparent p-4 sm:p-5 border-b border-border/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                Quick Appointment Scheduler
              </h2>
              <p className="text-xs text-text-muted">
                Search or create client → Pick service & stylist → Choose slot → Confirm in seconds.
              </p>
            </div>
            <p className="text-[11px] text-text-muted">
              Route: <code className="font-mono text-primary font-semibold">/appointments/new</code>
            </p>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6 lg:p-8">
          <QuickAppointmentForm
            onCancel={() => navigate('/appointments')}
            isModal={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
