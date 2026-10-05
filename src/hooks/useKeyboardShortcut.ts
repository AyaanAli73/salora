import { useEffect } from 'react'

export function useKeyboardShortcut(
  key: string,
  callback: (e: KeyboardEvent) => void,
  options: { ctrlOrMeta?: boolean; shift?: boolean; alt?: boolean } = {}
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isTargetKey = event.key.toLowerCase() === key.toLowerCase()
      const isModifierMet =
        options.ctrlOrMeta ? event.metaKey || event.ctrlKey : true
      const isShiftMet = options.shift ? event.shiftKey : true
      const isAltMet = options.alt ? event.altKey : true

      if (isTargetKey && isModifierMet && isShiftMet && isAltMet) {
        event.preventDefault()
        callback(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, callback, options])
}
