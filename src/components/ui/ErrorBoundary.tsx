import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RotateCcw, LayoutDashboard } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  featureName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary] Error caught${this.props.featureName ? ` in ${this.props.featureName}` : ''}:`, error, errorInfo)
  }

  private handleRetry = () => {
    if (this.props.onReset) {
      this.props.onReset()
    }
    this.setState({ hasError: false, error: null })
  }

  private handleGoToDashboard = () => {
    window.location.href = '/dashboard'
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center"
        >
          <Card className="max-w-md p-8 flex flex-col items-center gap-4 border-danger/30 shadow-lg">
            <div className="h-14 w-14 rounded-2xl bg-danger-light text-danger flex items-center justify-center">
              <AlertTriangle className="h-7 w-7" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Something went wrong.
              </h2>
              <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                {this.props.featureName
                  ? `An unexpected error occurred in ${this.props.featureName}. You can retry this section or return to the main dashboard.`
                  : 'An unexpected application error occurred. You can retry this operation or return to the dashboard.'}
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-2 bg-surface-subtle rounded-lg text-[11px] text-danger font-mono truncate max-w-xs mx-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleRetry}
                leftIcon={<RotateCcw className="h-4 w-4" />}
              >
                Retry
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleGoToDashboard}
                leftIcon={<LayoutDashboard className="h-4 w-4" />}
              >
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export const FeatureErrorBoundary: React.FC<{
  featureName: string
  children: ReactNode
  fallback?: ReactNode
}> = ({ featureName, children, fallback }) => {
  return (
    <ErrorBoundary featureName={featureName} fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}
