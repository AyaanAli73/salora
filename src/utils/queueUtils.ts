import { Token, TokenPriority, TokenStatus } from '@/types'

/**
 * Returns numeric priority weight for sorting
 */
export function getPriorityWeight(priority: TokenPriority): number {
  switch (priority) {
    case 'EMERGENCY':
      return 2
    case 'VIP':
      return 1
    case 'NORMAL':
    default:
      return 0
  }
}

/**
 * Formats a sequence number into standardized token formats
 * e.g. 24 -> "T024", displayNumber -> "#024"
 */
export function formatTokenNumber(seq: number): { tokenNumber: string; displayNumber: string } {
  const padded = seq.toString().padStart(3, '0')
  return {
    tokenNumber: `T${padded}`,
    displayNumber: `#${padded}`,
  }
}

/**
 * Smart Queue Sorting:
 * 1. Priority customers first (Emergency > VIP > Normal)
 * 2. Check-in time / scheduled appointment time
 */
export function sortQueueTokens(tokens: Token[]): Token[] {
  return [...tokens].sort((a, b) => {
    // 1. Compare priority
    const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
    if (priorityDiff !== 0) return priorityDiff

    // 2. Check-in timestamp (earlier first)
    const timeA = new Date(a.checkedInAt).getTime()
    const timeB = new Date(b.checkedInAt).getTime()
    return timeA - timeB
  })
}

/**
 * Validates allowed status transitions
 */
export const ALLOWED_TRANSITIONS: Record<TokenStatus, TokenStatus[]> = {
  WAITING: ['CALLED', 'HOLD', 'SKIPPED', 'CANCELLED'],
  CALLED: ['IN_SERVICE', 'WAITING', 'HOLD', 'SKIPPED', 'CANCELLED'],
  IN_SERVICE: ['COMPLETED', 'HOLD', 'CANCELLED'],
  HOLD: ['WAITING', 'CALLED', 'CANCELLED'],
  SKIPPED: ['WAITING', 'CANCELLED'],
  COMPLETED: [], // Terminal
  CANCELLED: [], // Terminal
}

export function isValidTransition(from: TokenStatus, to: TokenStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Calculates estimated wait time in minutes for a specific token
 * based on the number of active customers ahead and service durations
 */
export function calculateEstimatedWaitTime(
  token: Token,
  activeQueue: Token[],
  staffCount: number = 4
): number {
  if (token.status === 'IN_SERVICE') return 0
  if (token.status === 'CALLED') return 2

  // Get tokens ahead of this token for the same staff member or general queue
  const tokensAhead = activeQueue.filter((t) => {
    if (t.id === token.id) return false
    if (t.status === 'COMPLETED' || t.status === 'CANCELLED' || t.status === 'SKIPPED') return false

    // If same assigned specialist
    if (token.staffId && t.staffId === token.staffId) {
      if (t.status === 'IN_SERVICE') return true
      if (t.status === 'CALLED') return true
      // Priority check
      if (getPriorityWeight(t.priority) > getPriorityWeight(token.priority)) return true
      if (getPriorityWeight(t.priority) === getPriorityWeight(token.priority)) {
        return new Date(t.checkedInAt).getTime() < new Date(token.checkedInAt).getTime()
      }
      return false
    }

    // General queue
    if (!token.staffId) {
      if (getPriorityWeight(t.priority) > getPriorityWeight(token.priority)) return true
      return new Date(t.checkedInAt).getTime() < new Date(token.checkedInAt).getTime()
    }

    return false
  })

  if (tokensAhead.length === 0) {
    return 5 // Ready in ~5 mins
  }

  // Calculate sum of durations of people ahead, factored by available specialists
  const totalDurationAhead = tokensAhead.reduce((acc, t) => {
    // If currently in service, assume halfway through
    if (t.status === 'IN_SERVICE') {
      return acc + Math.round((t.serviceDuration || 30) * 0.4)
    }
    return acc + (t.serviceDuration || 30)
  }, 0)

  // If specific staff assigned, full serial duration
  if (token.staffId) {
    return Math.max(5, totalDurationAhead)
  }

  // Otherwise parallelized across available specialists
  const effectiveCapacity = Math.max(1, staffCount)
  return Math.max(5, Math.round(totalDurationAhead / effectiveCapacity))
}

/**
 * Formats wait time in minutes to friendly string
 */
export function formatWaitTime(minutes?: number): string {
  if (minutes === undefined || minutes <= 0) return 'Immediate'
  if (minutes < 60) return `~${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  return remainingMins > 0 ? `~${hours}h ${remainingMins}m` : `~${hours}h`
}

/**
 * Formats minutes waiting so far (from checkedInAt to now)
 */
export function getElapsedWaitMinutes(checkedInAt: string): number {
  const diffMs = Date.now() - new Date(checkedInAt).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60)))
}
