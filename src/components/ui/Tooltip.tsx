import React, { useState } from 'react'
import { cn } from '@/utils/cn'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const id = React.useId()

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {React.cloneElement(children as React.ReactElement<{ 'aria-describedby'?: string }>, {
        'aria-describedby': isVisible ? id : undefined,
      })}

      {isVisible && (
        <div
          id={id}
          role="tooltip"
          className={cn(
            'absolute z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-md pointer-events-none',
            'transition-opacity duration-150 animate-in fade-in',
            positionClasses[position],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
