import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'

interface PublicRouteProps {
  children: React.ReactNode
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isOnboarded, requiresOwnerSetup, isFirstRunChecked } = useAuthStore()

  if (!isFirstRunChecked) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-gray-400 font-medium">Checking Salora setup…</p>
        </div>
      </div>
    )
  }

  // If initial setup is required, ALWAYS render the setup screen
  if (requiresOwnerSetup) {
    return <>{children}</>
  }

  if (isAuthenticated) {
    if (!isOnboarded) {
      return <Navigate to="/onboarding" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
