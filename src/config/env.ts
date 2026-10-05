/**
 * Application Environment Configuration
 * Validates and exposes runtime environment variables with type safety and fallback defaults.
 * Supports: 'development' | 'staging' | 'production'
 */

export type AppEnvironment = 'development' | 'staging' | 'production' | 'test'

interface EnvConfig {
  env: AppEnvironment
  isProduction: boolean
  isDevelopment: boolean
  isStaging: boolean
  isTest: boolean
  appName: string
  appVersion: string
  apiBaseUrl: string
  apiTimeoutMs: number
  enableMockData: boolean
  enableDetailedLogs: boolean
  telemetryEnabled: boolean
  sentryDsn?: string
}

const metaEnv =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : (typeof process !== 'undefined' ? (process.env as any) : {}) || {}

function getEnvironment(): AppEnvironment {
  const mode = metaEnv.MODE || metaEnv.VITE_APP_ENV || metaEnv.NODE_ENV
  if (mode === 'production' || mode === 'prod') return 'production'
  if (mode === 'staging' || mode === 'stage') return 'staging'
  if (mode === 'test') return 'test'
  return 'development'
}

const currentEnv = getEnvironment()

export const config: EnvConfig = {
  env: currentEnv,
  isProduction: currentEnv === 'production',
  isDevelopment: currentEnv === 'development',
  isStaging: currentEnv === 'staging',
  isTest: currentEnv === 'test',
  appName: metaEnv.VITE_APP_NAME || 'Salora',
  appVersion: metaEnv.VITE_APP_VERSION || '2.4.0',
  apiBaseUrl: metaEnv.VITE_API_BASE_URL || '/api/v1',
  apiTimeoutMs: Number(metaEnv.VITE_API_TIMEOUT_MS) || 15000,
  enableMockData: metaEnv.VITE_ENABLE_MOCK_DATA === 'true' && currentEnv === 'development',
  enableDetailedLogs: currentEnv !== 'production' || metaEnv.VITE_DETAILED_LOGS === 'true',
  telemetryEnabled: metaEnv.VITE_TELEMETRY_ENABLED === 'true',
  sentryDsn: metaEnv.VITE_SENTRY_DSN || undefined,
}
