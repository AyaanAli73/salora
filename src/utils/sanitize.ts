/**
 * Input sanitization and defensive safety utilities
 * Prevents XSS, control characters, and malformed inputs from rendering unsafely.
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
}

/**
 * Escapes raw string text so it cannot be interpreted as HTML.
 */
export function escapeHtml(str: string): string {
  if (!str) return ''
  return String(str).replace(/[&<>"'/]/g, (char) => HTML_ENTITY_MAP[char] || char)
}

/**
 * Completely strips all HTML tags and script/style contents, leaving clean plaintext.
 */
export function stripHtml(str: string): string {
  if (!str) return ''
  return String(str)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
}

/**
 * Strips dangerous script schemes, javascript:, data: URIs and control characters.
 */
export function sanitizeUrl(url: string, defaultFallback: string = '#'): string {
  if (!url) return defaultFallback
  const trimmed = url.trim()
  const lower = trimmed.toLowerCase()

  // Disallow javascript: or vbscript: or data: URIs
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/html') ||
    lower.startsWith('data:application/javascript')
  ) {
    return defaultFallback
  }

  return trimmed
}

/**
 * Normalizes user-submitted notes, reviews, and customer requests:
 * - Trims whitespace
 * - Strips HTML tags
 * - Enforces character length limit
 * - Strips non-printable ASCII control characters (except newline, tab)
 */
export function sanitizeUserNotes(input: string, maxLength: number = 2000): string {
  if (!input) return ''
  // Strip control chars (except \r, \n, \t)
  const cleanChars = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  const noHtml = stripHtml(cleanChars)
  return noHtml.length > maxLength ? noHtml.slice(0, maxLength) : noHtml
}

/**
 * Cleans phone numbers to international standard digits and leading +
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return ''
  const trimmed = phone.trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  return hasPlus ? `+${digits}` : digits
}
