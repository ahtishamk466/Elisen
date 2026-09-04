import { formatDate } from './formatDate'

/**
 * The seven reporting windows a person's hours can be read through.
 *
 * These are **whole calendar periods**, not rolling ones: "This Month" is the
 * 1st to the last day of the current month, not the last 30 days. A timesheet
 * is approved, invoiced and payrolled against calendar boundaries, so a rolling
 * window would produce figures that never reconcile with anything the business
 * actually settles against.
 *
 * The week runs **Monday to Sunday** — the ISO week, and the one the rest of
 * the app's date handling already assumes.
 */
export type HoursPeriod =
  | 'all' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'this-year' | 'last-year'

export const HOURS_PERIODS: { key: HoursPeriod; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'this-week', label: 'This Week' },
  { key: 'last-week', label: 'Last Week' },
  { key: 'this-month', label: 'This Month' },
  { key: 'last-month', label: 'Last Month' },
  { key: 'this-year', label: 'This Year' },
  { key: 'last-year', label: 'Last Year' },
]

const BY_KEY = new Map(HOURS_PERIODS.map((p) => [p.key, p]))

/** Anything unrecognised (a hand-edited URL, a stale bookmark) reads as All
    Time rather than throwing or silently showing nothing. */
export function toHoursPeriod(value: string | null | undefined): HoursPeriod {
  return value && BY_KEY.has(value as HoursPeriod) ? (value as HoursPeriod) : 'all'
}

export const hoursPeriodLabel = (p: HoursPeriod) => BY_KEY.get(p)?.label ?? 'All Time'

/** Inclusive at both ends, in the ISO form timesheet rows are stored in. */
export interface DateRange {
  from: string
  to: string
}

/* Local calendar fields throughout, never `toISOString()` — that converts to
   UTC, and west of Greenwich it hands back yesterday for anything logged in
   the evening. A working date is a local calendar day, not an instant. */
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Midnight on the Monday of `d`'s week. `getDay()` is Sunday-based, so it is
    rotated by 6 to make Monday day 0. */
function mondayOf(d: Date) {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  c.setDate(c.getDate() - ((c.getDay() + 6) % 7))
  return c
}

const plusDays = (d: Date, n: number) => {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  c.setDate(c.getDate() + n)
  return c
}

/**
 * The dates a period covers, or **null for All Time** — null meaning "no
 * bound", which is different from an empty range and has to stay
 * distinguishable at the call site.
 *
 * `today` is a parameter so this is testable and so a story can pin a date;
 * callers pass nothing.
 */
export function periodRange(period: HoursPeriod, today: Date = new Date()): DateRange | null {
  const y = today.getFullYear()
  const m = today.getMonth()

  switch (period) {
    case 'all':
      return null
    case 'this-week': {
      const start = mondayOf(today)
      return { from: iso(start), to: iso(plusDays(start, 6)) }
    }
    case 'last-week': {
      const start = plusDays(mondayOf(today), -7)
      return { from: iso(start), to: iso(plusDays(start, 6)) }
    }
    case 'this-month':
      // Day 0 of the next month is the last day of this one, leap years included.
      return { from: iso(new Date(y, m, 1)), to: iso(new Date(y, m + 1, 0)) }
    case 'last-month':
      return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) }
    case 'this-year':
      return { from: iso(new Date(y, 0, 1)), to: iso(new Date(y, 11, 31)) }
    case 'last-year':
      return { from: iso(new Date(y - 1, 0, 1)), to: iso(new Date(y - 1, 11, 31)) }
  }
}

/**
 * The period said in dates — "Aug 17, 2026 – Aug 23, 2026".
 *
 * Shown beside the picker because "Last Week" alone is ambiguous the moment
 * someone reads the screen on a Monday, or shares a screenshot of it.
 */
export function periodRangeLabel(period: HoursPeriod, today: Date = new Date()): string {
  const range = periodRange(period, today)
  if (!range) return 'Every entry on record'
  return `${formatDate(range.from)} – ${formatDate(range.to)}`
}

/** True when the row's working date falls inside the period. */
export function inPeriod(workingDate: string, range: DateRange | null) {
  if (!range) return true
  return workingDate >= range.from && workingDate <= range.to
}
