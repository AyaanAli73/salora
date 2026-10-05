import React from 'react'
import { Navigate } from 'react-router-dom'
import { useCustomerAuthStore } from '@/store/useCustomerAuthStore'

interface CustomerPublicRouteProps {
  children: React.ReactNode
}

export const CustomerPublicRoute: React.FC<CustomerPublicRouteProps> = ({ children }) => {
  const { isAuthenticated } = useCustomerAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/customer/dashboard" replace />
  }

  return <>{children}</>
}
