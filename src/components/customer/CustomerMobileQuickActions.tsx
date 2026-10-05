import React from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, CalendarCheck, Gift, Sparkles } from 'lucide-react'

export const CustomerMobileQuickActions: React.FC = () => {
  return (
    <div
      aria-label="Customer Lounge Quick Actions"
      className="lg:hidden flex items-center justify-around gap-2 px-3 py-2.5 bg-slate-900/90 border-y border-slate-800 text-xs font-semibold"
    >
      <Link
        to="/customer/book"
        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white px-3 py-2 shadow-xs active:scale-95 transition-transform"
      >
        <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Book Appointment</span>
      </Link>

      <Link
        to="/customer/appointments"
        className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 px-3 py-2 active:scale-95 transition-transform"
      >
        <CalendarCheck className="h-3.5 w-3.5 text-violet-400" aria-hidden="true" />
        <span>View Booking</span>
      </Link>

      <Link
        to="/customer/rewards"
        className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 px-3 py-2 active:scale-95 transition-transform"
      >
        <Gift className="h-3.5 w-3.5 text-pink-400" aria-hidden="true" />
        <span>View Rewards</span>
      </Link>
    </div>
  )
}
