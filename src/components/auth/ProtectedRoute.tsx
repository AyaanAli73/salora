import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { canAccessPath, ROLE_LABELS } from '@/utils/permissions'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isOnboarded, user, requiresOwnerSetup, isFirstRunChecked } = useAuthStore()
  const location = useLocation()

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

  if (requiresOwnerSetup || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // Permission access check for current user role
  if (user && !canAccessPath(user.role, location.pathname)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Card className="max-w-md p-8 flex flex-col items-center gap-4 border-amber-500/30">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <ShieldAlert className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Access Restricted</h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Your account role (<span className="font-semibold text-primary">{ROLE_LABELS[user.role]}</span>) does not have permission to view or manage this section.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.history.back()}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
