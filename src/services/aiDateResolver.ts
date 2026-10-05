/**
 * Salora Centralized AI Date Range Resolver
 * Translates natural language date and time expressions (English & Hindi/Hinglish)
 * into exact ISO date ranges and comparative prior periods using real system time.
 */

export interface ResolvedDateRange {
  startDate: string
  endDate: string
  label: string
  prevStartDate: string
  prevEndDate: string
  prevLabel: string
  isComparison: boolean
  daysCount: number
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

function formatReadableDate(d: Date): string {
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Resolves natural language time expressions into structured date windows.
 */
export function resolveNaturalDateRange(queryText = ''): ResolvedDateRange {
  const q = queryText.toLowerCase().trim()
  const now = new Date()

  const isComparison =
    q.includes('compare') ||
    q.includes('versus') ||
    q.includes('vs') ||
    q.includes('compared to') ||
    q.includes('growth') ||
    q.includes('difference') ||
    q.includes('kaisa raha') ||
    q.includes('change')

  // 1. Tomorrow / Kal (future schedule)
  if (q.includes('tomorrow') || (q.includes('kal') && (q.includes('schedule') || q.includes('appointment') || q.includes('aayega')))) {
    const tomorrow = addDays(now, 1)
    const tomStr = formatDateISO(tomorrow)
    const todayStr = formatDateISO(now)
    return {
      startDate: tomStr,
      endDate: tomStr,
      label: `Tomorrow (${formatReadableDate(tomorrow)})`,
      prevStartDate: todayStr,
      prevEndDate: todayStr,
      prevLabel: `Today (${formatReadableDate(now)})`,
      isComparison: false,
      daysCount: 1,
    }
  }

  // 2. Today / Aaj
  if (q.includes('today') || q.includes("today's") || q.includes('aaj')) {
    const todayStr = formatDateISO(now)
    const yestStr = formatDateISO(addDays(now, -1))
    return {
      startDate: todayStr,
      endDate: todayStr,
      label: `Today (${formatReadableDate(now)})`,
      prevStartDate: yestStr,
      prevEndDate: yestStr,
      prevLabel: `Yesterday (${formatReadableDate(addDays(now, -1))})`,
      isComparison,
      daysCount: 1,
    }
  }

  // 3. Yesterday / Kal (past)
  if (q.includes('yesterday') || q.includes('kal')) {
    const yest = addDays(now, -1)
    const yestStr = formatDateISO(yest)
    const dayBefore = addDays(now, -2)
    const dayBeforeStr = formatDateISO(dayBefore)
    return {
      startDate: yestStr,
      endDate: yestStr,
      label: `Yesterday (${formatReadableDate(yest)})`,
      prevStartDate: dayBeforeStr,
      prevEndDate: dayBeforeStr,
      prevLabel: `Day Prior (${formatReadableDate(dayBefore)})`,
      isComparison,
      daysCount: 1,
    }
  }

  // 4. This Month / Is Month / Is Mahine
  if (
    q.includes('this month') ||
    q.includes('is month') ||
    q.includes('is mahine') ||
    q.includes('current month') ||
    q.includes('iss mahine')
  ) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const curLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const prevLabel = prevMonthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    return {
      startDate: formatDateISO(monthStart),
      endDate: formatDateISO(monthEnd),
      label: curLabel,
      prevStartDate: formatDateISO(prevMonthStart),
      prevEndDate: formatDateISO(prevMonthEnd),
      prevLabel,
      isComparison: true,
      daysCount: monthEnd.getDate(),
    }
  }

  // 5. Last Month / Pichle Mahine
  if (
    q.includes('last month') ||
    q.includes('previous month') ||
    q.includes('pichle mahine') ||
    q.includes('pichhla mahina')
  ) {
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const twoMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const twoMonthsAgoEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0)

    return {
      startDate: formatDateISO(prevMonthStart),
      endDate: formatDateISO(prevMonthEnd),
      label: prevMonthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      prevStartDate: formatDateISO(twoMonthsAgoStart),
      prevEndDate: formatDateISO(twoMonthsAgoEnd),
      prevLabel: twoMonthsAgoStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      isComparison: true,
      daysCount: prevMonthEnd.getDate(),
    }
  }

  // 6. Last 90 days / 90 days / 90 din
  if (q.includes('90 days') || q.includes('90 din') || q.includes('3 months') || q.includes('teen mahine')) {
    const start90 = formatDateISO(addDays(now, -90))
    const end90 = formatDateISO(now)
    const prevStart90 = formatDateISO(addDays(now, -180))
    return {
      startDate: start90,
      endDate: end90,
      label: `Last 90 Days (${formatReadableDate(addDays(now, -90))} – ${formatReadableDate(now)})`,
      prevStartDate: prevStart90,
      prevEndDate: start90,
      prevLabel: 'Prior 90 Days',
      isComparison,
      daysCount: 90,
    }
  }

  // 7. This Week / Is Hafte
  if (q.includes('this week') || q.includes('current week') || q.includes('is hafte')) {
    const dayOfWeek = now.getDay() || 7
    const weekStart = addDays(now, -dayOfWeek + 1)
    const weekEnd = addDays(weekStart, 6)
    const prevWeekStart = addDays(weekStart, -7)
    const prevWeekEnd = addDays(weekStart, -1)

    return {
      startDate: formatDateISO(weekStart),
      endDate: formatDateISO(weekEnd),
      label: `This Week (${formatReadableDate(weekStart)} – ${formatReadableDate(weekEnd)})`,
      prevStartDate: formatDateISO(prevWeekStart),
      prevEndDate: formatDateISO(prevWeekEnd),
      prevLabel: 'Last Week',
      isComparison,
      daysCount: 7,
    }
  }

  // 8. Specific Month comparison (e.g. "August aur September compare karo")
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
  const matchedMonths = months.filter((m) => q.includes(m))
  if (matchedMonths.length >= 2) {
    const m1Idx = months.indexOf(matchedMonths[0])
    const m2Idx = months.indexOf(matchedMonths[1])
    const year = now.getFullYear()

    const d1Start = new Date(year, m1Idx, 1)
    const d1End = new Date(year, m1Idx + 1, 0)
    const d2Start = new Date(year, m2Idx, 1)
    const d2End = new Date(year, m2Idx + 1, 0)

    return {
      startDate: formatDateISO(d2Start),
      endDate: formatDateISO(d2End),
      label: d2Start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      prevStartDate: formatDateISO(d1Start),
      prevEndDate: formatDateISO(d1End),
      prevLabel: d1Start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      isComparison: true,
      daysCount: d2End.getDate(),
    }
  }

  // Default: Current Month
  const defStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const defEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const prevDefStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevDefEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  return {
    startDate: formatDateISO(defStart),
    endDate: formatDateISO(defEnd),
    label: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    prevStartDate: formatDateISO(prevDefStart),
    prevEndDate: formatDateISO(prevDefEnd),
    prevLabel: prevDefStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    isComparison,
    daysCount: defEnd.getDate(),
  }
}
