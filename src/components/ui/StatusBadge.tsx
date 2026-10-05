import React from 'react'
import { Badge } from './Badge'
import { STATUS_CONFIG } from '@/constants'

export interface StatusBadgeProps {
  status: string
  dot?: boolean
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, dot = true, className }) => {
  const normalizedKey = status.toLowerCase()
  const config = STATUS_CONFIG[normalizedKey] || {
    label: status.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    variant: 'default' as const,
  }

  return (
    <Badge variant={config.variant} dot={dot} className={className}>
      {config.label}
    </Badge>
  )
}
