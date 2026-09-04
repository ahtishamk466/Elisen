/**
 * Audit Module — what the old Yii audit extension records. An **Entry** is
 * one served HTTP request; everything else attaches to an entry:
 * - Trails: data changes (which record/attribute changed, from what, by whom)
 * - Mails: copies of mail the app sent
 * - Javascripts: client-side JS errors reported back by the browser
 * - Errors: server-side errors and exceptions
 */
export type AuditSeriesKey = 'entries' | 'trails' | 'mails' | 'javascripts' | 'errors'

export interface AuditDay {
  /** 'YYYY-MM-DD' */
  date: string
  counts: Record<AuditSeriesKey, number>
}

/** How much is on disk per type, and how much of it is old enough to purge. */
export interface AuditStored {
  total: number
  /** Records older than N days, keyed by the retention thresholds offered. */
  olderThan: Record<number, number>
}
