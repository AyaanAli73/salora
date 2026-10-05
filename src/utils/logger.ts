/**
 * Structured Frontend Logger
 * Supports: logger.debug(), logger.info(), logger.warn(), logger.error()
 * Automatic PII & Secret Redaction:
 * Never prints passwords, auth tokens, private API secrets, or credit card numbers.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  context?: any
}

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /apikey/i,
  /api_key/i,
  /auth/i,
  /bearer/i,
  /creditcard/i,
  /cardnumber/i,
  /cvv/i,
  /ssn/i,
  /pin/i,
]

/**
 * Deep-redacts sensitive key values in an object or primitive before logging.
 */
export function redactSensitiveData(val: any, depth: number = 0): any {
  if (depth > 6) return '[MAX_DEPTH]'
  if (val === null || val === undefined) return val
  if (typeof val === 'string') {
    // Check for bearer token pattern
    if (/bearer\s+[a-zA-Z0-9_\-\.]+/i.test(val)) {
      return val.replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
    }
    // Check for 16-digit card patterns
    if (/\b(?:\d{4}[ -]?){3}\d{4}\b/.test(val)) {
      return val.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, '****-****-****-****')
    }
    return val
  }
  if (typeof val !== 'object') return val

  if (Array.isArray(val)) {
    return val.map((item) => redactSensitiveData(item, depth + 1))
  }

  const sanitized: Record<string, any> = {}
  for (const [key, propVal] of Object.entries(val)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))
    if (isSensitive) {
      sanitized[key] = '[REDACTED]'
    } else {
      sanitized[key] = redactSensitiveData(propVal, depth + 1)
    }
  }
  return sanitized
}

class Logger {
  private buffer: LogEntry[] = []
  private maxBufferSize: number = 100

  private record(level: LogLevel, module: string, message: string, context?: any) {
    const safeContext = context !== undefined ? redactSensitiveData(context) : undefined
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      context: safeContext,
    }

    this.buffer.push(entry)
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift()
    }

    const formattedTime = new Date().toLocaleTimeString('en-US', { hour12: false })
    const prefix = `[${formattedTime}] [${module.toUpperCase()}]`

    switch (level) {
      case 'debug':
        if (import.meta.env.DEV) {
          console.debug(`${prefix} ${message}`, safeContext || '')
        }
        break
      case 'info':
        console.info(`${prefix} ${message}`, safeContext || '')
        break
      case 'warn':
        console.warn(`${prefix} ⚠️ ${message}`, safeContext || '')
        break
      case 'error':
        console.error(`${prefix} 🛑 ${message}`, safeContext || '')
        break
    }
  }

  public debug(module: string, message: string, context?: any) {
    this.record('debug', module, message, context)
  }

  public info(module: string, message: string, context?: any) {
    this.record('info', module, message, context)
  }

  public warn(module: string, message: string, context?: any) {
    this.record('warn', module, message, context)
  }

  public error(module: string, message: string, context?: any) {
    this.record('error', module, message, context)
  }

  public getRecentLogs(limit: number = 50): LogEntry[] {
    return this.buffer.slice(-limit)
  }

  public clearBuffer() {
    this.buffer = []
  }
}

export const logger = new Logger()
