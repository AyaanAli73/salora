import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/routes/AppRoutes'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
