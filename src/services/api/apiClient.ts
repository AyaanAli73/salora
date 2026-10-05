/**
 * Central API Client Abstraction
 * Handles HTTP requests, authentication headers, request tracing, timeouts,
 * exponential backoff retry, and structured error transformation.
 */

import { config } from '@/config/env'
import { logger } from '@/utils/logger'

export interface ApiResponse<T = any> {
  data: T
  status: number
  headers: Headers
  requestId: string
}

export class ApiError extends Error {
  public status: number
  public statusText: string
  public data: any
  public requestId?: string

  constructor(status: number, statusText: string, message: string, data?: any, requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.data = data
    this.requestId = requestId
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number
  retryCount?: number
  skipAuth?: boolean
}

class ApiClient {
  private baseUrl: string
  private defaultTimeoutMs: number

  constructor() {
    this.baseUrl = config.apiBaseUrl
    this.defaultTimeoutMs = config.apiTimeoutMs
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem('SALORA_auth_session')
      if (raw) {
        const parsed = JSON.parse(raw)
        return parsed.token || null
      }
    } catch {
      return null
    }
    return null
  }

  private async executeWithRetry<T>(
    url: string,
    options: RequestOptions,
    attempt: number = 0
  ): Promise<ApiResponse<T>> {
    const maxRetries = options.retryCount ?? 2
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const headers = new Headers(options.headers || {})
    headers.set('X-Request-Id', requestId)
    headers.set('Accept', 'application/json')

    if (!options.skipAuth) {
      const token = this.getAuthToken()
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }

    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url.startsWith('/') ? url : `/${url}`}`

    try {
      logger.debug('api', `[${options.method || 'GET'}] ${fullUrl}`, { requestId })

      const response = await fetch(fullUrl, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Retry on transient 5xx or 429
      if ((response.status >= 502 || response.status === 429) && attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 500
        logger.warn('api', `Transient HTTP ${response.status}. Retrying in ${backoffMs}ms…`, { requestId, attempt })
        await new Promise((res) => setTimeout(res, backoffMs))
        return this.executeWithRetry<T>(url, options, attempt + 1)
      }

      let responseData: any = null
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
      }

      if (!response.ok) {
        throw new ApiError(
          response.status,
          response.statusText,
          responseData?.message || `HTTP ${response.status}: ${response.statusText}`,
          responseData,
          requestId
        )
      }

      return {
        data: responseData as T,
        status: response.status,
        headers: response.headers,
        requestId,
      }
    } catch (err: any) {
      clearTimeout(timeoutId)

      // Network abort / timeout
      if (err.name === 'AbortError') {
        throw new ApiError(408, 'Request Timeout', `Request timed out after ${timeoutMs}ms.`, null, requestId)
      }

      // Retry on fetch network errors
      if (attempt < maxRetries && !(err instanceof ApiError && err.status < 500 && err.status !== 429)) {
        const backoffMs = Math.pow(2, attempt) * 600
        logger.warn('api', `Network error: ${err.message}. Retrying in ${backoffMs}ms…`, { requestId, attempt })
        await new Promise((res) => setTimeout(res, backoffMs))
        return this.executeWithRetry<T>(url, options, attempt + 1)
      }

      logger.error('api', `API call failed: ${err.message}`, { requestId, error: err })
      throw err
    }
  }

  public async get<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.executeWithRetry<T>(url, { ...options, method: 'GET' })
  }

  public async post<T>(url: string, body?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.executeWithRetry<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  public async put<T>(url: string, body?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.executeWithRetry<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  public async patch<T>(url: string, body?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.executeWithRetry<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  public async delete<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.executeWithRetry<T>(url, { ...options, method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()
