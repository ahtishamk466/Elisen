import type { AuditDay, AuditSeriesKey, AuditStored } from '@/types/audit'

export const AUDIT_SERIES_LABEL: Record<AuditSeriesKey, string> = {
  entries: 'Entries',
  trails: 'Trails',
  mails: 'Mails',
  javascripts: 'Javascripts',
  errors: 'Errors',
}

/** One line each, shown under the heading — the old panel labelled the five
    charts but never said what any of them counted. */
export const AUDIT_SERIES_DESCRIPTION: Record<AuditSeriesKey, string> = {
  entries: 'One per request the app served. Everything below attaches to an entry.',
  trails: 'Data changes — which record and attribute changed, and by whom.',
  mails: 'Copies of mail the app sent.',
  javascripts: 'Client-side JavaScript errors reported back by the browser.',
  errors: 'Server-side errors and exceptions.',
}

/**
 * The seven days the old panel charted, Thu 2026-08-06 → Wed 2026-08-12.
 *
 * Read off the legacy charts' bar heights: the originals are rendered in a
 * pseudo-3D style with only 0/2000/4000/6000 (Entries) and 0/2000…/10000
 * (Errors) gridlines, so these are the shapes to the nearest readable step,
 * not exact figures. Mails and Javascripts genuinely recorded nothing in the
 * window — their charts were empty.
 */
export const AUDIT_DAYS: AuditDay[] = [
  { date: '2026-08-06', counts: { entries: 820, trails: 0, mails: 0, javascripts: 0, errors: 2100 } },
  { date: '2026-08-07', counts: { entries: 1450, trails: 0, mails: 0, javascripts: 0, errors: 1500 } },
  { date: '2026-08-08', counts: { entries: 2380, trails: 0, mails: 0, javascripts: 0, errors: 2000 } },
  { date: '2026-08-09', counts: { entries: 5210, trails: 0, mails: 0, javascripts: 0, errors: 3000 } },
  { date: '2026-08-10', counts: { entries: 3140, trails: 0, mails: 0, javascripts: 0, errors: 9500 } },
  { date: '2026-08-11', counts: { entries: 260, trails: 3, mails: 0, javascripts: 0, errors: 3400 } },
  { date: '2026-08-12', counts: { entries: 180, trails: 23, mails: 0, javascripts: 0, errors: 800 } },
]

/** Retention thresholds offered on the Clean tab. */
export const AUDIT_RETENTION_DAYS = [7, 30, 90, 180, 365]

/** What's on disk beyond the charted week — the Clean tab's working set. */
export const AUDIT_STORED: Record<AuditSeriesKey, AuditStored> = {
  entries: { total: 128_430, olderThan: { 7: 115_120, 30: 92_400, 90: 51_260, 180: 18_940, 365: 0 } },
  trails: { total: 4_812, olderThan: { 7: 4_786, 30: 3_940, 90: 2_110, 180: 640, 365: 0 } },
  mails: { total: 0, olderThan: { 7: 0, 30: 0, 90: 0, 180: 0, 365: 0 } },
  javascripts: { total: 0, olderThan: { 7: 0, 30: 0, 90: 0, 180: 0, 365: 0 } },
  errors: { total: 96_240, olderThan: { 7: 89_310, 30: 70_120, 90: 38_600, 180: 12_450, 365: 0 } },
}

const NUMBER = new Intl.NumberFormat('en-CA')
export const formatCount = (n: number) => NUMBER.format(n)

/** "Thu 06 Aug" — the axis label the old charts crammed in at an angle. */
export function formatDayLabel(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString('en-CA', { weekday: 'short', day: '2-digit', month: 'short' })
}

export const seriesTotal = (key: AuditSeriesKey) =>
  AUDIT_DAYS.reduce((sum, d) => sum + d.counts[key], 0)
