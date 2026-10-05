import {
  logEvent,
  setUserId,
  setUserProperties,
  isSupported,
  getAnalytics,
  Analytics,
} from 'firebase/analytics'
import { app, analytics } from '../firebase'

/**
 * Re-export the initialized Analytics instance (or null in unsupported environments)
 */
export { analytics }

/**
 * Get or safely initialize the Analytics instance asynchronously
 */
export const getAnalyticsSafe = async (): Promise<Analytics | null> => {
  if (analytics) return analytics
  if (typeof window === 'undefined') return null

  try {
    const supported = await isSupported()
    if (supported) {
      return getAnalytics(app)
    }
  } catch (err) {
    console.warn('[Salora Analytics] Error checking Analytics support:', err)
  }
  return null
}

/**
 * Safely log an analytics event. No-ops if Analytics is unsupported or unavailable.
 */
export const logAnalyticsEvent = async (
  eventName: string,
  eventParams?: Record<string, any>
): Promise<void> => {
  try {
    const instance = await getAnalyticsSafe()
    if (instance) {
      logEvent(instance, eventName, eventParams)
    }
  } catch (err) {
    console.warn(`[Salora Analytics] Failed to log event "${eventName}":`, err)
  }
}

/**
 * Safely assign user ID for analytics tracking.
 */
export const setAnalyticsUserId = async (id: string | null): Promise<void> => {
  try {
    const instance = await getAnalyticsSafe()
    if (instance) {
      setUserId(instance, id)
    }
  } catch (err) {
    console.warn('[Salora Analytics] Failed to set user ID:', err)
  }
}

/**
 * Safely set custom user properties.
 */
export const setAnalyticsUserProperties = async (properties: Record<string, any>): Promise<void> => {
  try {
    const instance = await getAnalyticsSafe()
    if (instance) {
      setUserProperties(instance, properties)
    }
  } catch (err) {
    console.warn('[Salora Analytics] Failed to set user properties:', err)
  }
}

export { logEvent, setUserId, setUserProperties, isSupported }
export type { Analytics }
