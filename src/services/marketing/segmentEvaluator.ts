import { Client, CustomerSegment, SegmentCondition } from '@/types'

/**
 * Calculates days elapsed between a date string and reference date (default: today)
 */
export function calculateDaysSince(dateString?: string): number {
  if (!dateString) return 999
  const then = new Date(dateString).getTime()
  if (isNaN(then)) return 999
  const now = new Date().getTime()
  const diffMs = now - then
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

/**
 * Calculates client age from birthday string (YYYY-MM-DD)
 */
export function calculateClientAge(birthdateStr?: string): number {
  if (!birthdateStr) return 0
  const birth = new Date(birthdateStr)
  if (isNaN(birth.getTime())) return 0
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return Math.max(0, age)
}

/**
 * Evaluates a single condition against a Client
 */
export function evaluateCondition(client: Client, condition: SegmentCondition): boolean {
  const { field, operator, value } = condition

  let actualValue: any

  switch (field) {
    case 'lastVisitDays':
      actualValue = calculateDaysSince(client.lastVisitDate)
      break
    case 'totalVisits':
      actualValue = client.totalVisits || 0
      break
    case 'totalSpending':
      actualValue = client.totalSpent || 0
      break
    case 'age':
      actualValue = calculateClientAge(client.dateOfBirth || client.birthday)
      break
    case 'gender':
      actualValue = (client.gender || '').toLowerCase()
      break
    case 'membershipTier':
      actualValue = client.membership?.tier || client.membership?.planName || (client.isVip ? 'VIP Club' : 'None')
      break;
    case 'favoriteService':
      actualValue = (client.favoriteService || '').toLowerCase()
      break
    case 'rewardPoints':
      actualValue = client.loyaltyPoints || 0
      break
    case 'birthdayMonth': {
      const bdayStr = client.birthday || client.dateOfBirth
      if (!bdayStr) return false
      const d = new Date(bdayStr)
      actualValue = isNaN(d.getTime()) ? 0 : d.getMonth() + 1
      break
    }
    case 'appointmentCount':
      actualValue = client.totalVisits || 0
      break
    default:
      return true
  }

  // Comparison operations
  const numActual = typeof actualValue === 'number' ? actualValue : Number(actualValue)
  const numTarget = typeof value === 'number' ? value : Number(value)

  switch (operator) {
    case 'equals':
      if (typeof actualValue === 'string') {
        return actualValue.toLowerCase() === String(value).toLowerCase()
      }
      return numActual === numTarget

    case 'notEquals':
      if (typeof actualValue === 'string') {
        return actualValue.toLowerCase() !== String(value).toLowerCase()
      }
      return numActual !== numTarget

    case 'greaterThan':
      return !isNaN(numActual) && !isNaN(numTarget) && numActual > numTarget

    case 'lessThan':
      return !isNaN(numActual) && !isNaN(numTarget) && numActual < numTarget

    case 'greaterThanOrEqual':
      return !isNaN(numActual) && !isNaN(numTarget) && numActual >= numTarget

    case 'lessThanOrEqual':
      return !isNaN(numActual) && !isNaN(numTarget) && numActual <= numTarget

    case 'in':
      if (Array.isArray(value)) {
        return value.some((v) => String(v).toLowerCase() === String(actualValue).toLowerCase())
      }
      return false

    case 'contains':
      return String(actualValue).toLowerCase().includes(String(value).toLowerCase())

    default:
      return true
  }
}

/**
 * Evaluates whether a client matches an entire segment's conditions
 */
export function evaluateClientForSegment(
  client: Client,
  segment: Pick<CustomerSegment, 'combinator' | 'conditions'>
): boolean {
  if (!segment.conditions || segment.conditions.length === 0) {
    return true
  }

  if (segment.combinator === 'OR') {
    return segment.conditions.some((cond) => evaluateCondition(client, cond))
  }

  // Default AND
  return segment.conditions.every((cond) => evaluateCondition(client, cond))
}

/**
 * Filters an array of clients by segment definition
 */
export function filterClientsBySegment(
  clients: Client[],
  segment: Pick<CustomerSegment, 'combinator' | 'conditions'>
): Client[] {
  return clients.filter((client) => evaluateClientForSegment(client, segment))
}
