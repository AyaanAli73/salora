import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore'

interface CustomerProtectedRouteProps {
  children: React.ReactNode
}

export const CustomerProtectedRoute: React.FC<CustomerProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useCustomerAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm">Loading SALORA Lounge…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/customer/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
