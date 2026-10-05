import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Scissors } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-200">
      <div className="h-16 w-16 rounded-2xl bg-primary-50 text-primary dark:bg-primary-950 dark:text-primary-300 flex items-center justify-center mb-6 shadow-glow-primary/20">
        <Scissors className="h-8 w-8 -rotate-45" aria-hidden="true" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-text-primary font-sans">
        404 — Page Not Found
      </h1>
      <p className="text-sm text-text-muted max-w-md mt-2 mb-8 leading-relaxed">
        The salon resource or dashboard section you requested does not exist or has been relocated.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  )
}
