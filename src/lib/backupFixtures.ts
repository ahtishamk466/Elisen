import type { DatabaseBackup } from '@/types/backup'

/**
 * Verbatim from the client's Database Maintenance screen — the same two
 * files, sizes and timestamps. Bytes are chosen so the display formatter
 * reproduces the screenshot's "2.784 kibibytes" / "3.631 mebibytes".
 */
export const DATABASE_BACKUPS: DatabaseBackup[] = [
  {
    id: 'bk-2021-02-16',
    name: 'db_backup_2021.02.16_20.56.25.sql',
    bytes: 2851,
    createdAt: '2025-11-28 06:04:16',
    modifiedAt: '2025-11-28 06:04:16',
  },
  {
    id: 'bk-2021-02-17',
    name: 'db_backup_2021.02.17_15.30.45.sql',
    bytes: 3807378,
    createdAt: '2025-11-28 06:04:16',
    modifiedAt: '2025-11-28 06:04:16',
  },
]

/** Matches the old screen's units exactly — binary, three decimals. */
export function formatBackupSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(3)} mebibytes`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(3)} kibibytes`
  return `${bytes} bytes`
}

const RELATIVE = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** The old screen's Modified Time column — "8 months ago". */
export function formatRelativeTime(timestamp: string, now = new Date()): string {
  const then = new Date(timestamp.replace(' ', 'T'))
  if (Number.isNaN(then.getTime())) return timestamp
  const diff = now.getTime() - then.getTime()
  if (diff < HOUR) return RELATIVE.format(-Math.floor(diff / MINUTE), 'minute')
  if (diff < DAY) return RELATIVE.format(-Math.floor(diff / HOUR), 'hour')

  // Calendar months, not 30-day blocks — otherwise a file from late November
  // reads as "9 months ago" in mid-August.
  const months =
    (now.getFullYear() - then.getFullYear()) * 12 +
    (now.getMonth() - then.getMonth()) -
    (now.getDate() < then.getDate() ? 1 : 0)
  if (months >= 12) return RELATIVE.format(-Math.floor(months / 12), 'year')
  if (months >= 1) return RELATIVE.format(-months, 'month')
  return RELATIVE.format(-Math.floor(diff / DAY), 'day')
}

/** Backup filenames are timestamped: db_backup_YYYY.MM.DD_HH.mm.ss.sql */
export function backupFileName(at: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `db_backup_${at.getFullYear()}.${p(at.getMonth() + 1)}.${p(at.getDate())}_${p(at.getHours())}.${p(at.getMinutes())}.${p(at.getSeconds())}.sql`
}

/** 'YYYY-MM-DD HH:mm:ss', the format both time columns are stored in. */
export function backupTimestamp(at: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${at.getFullYear()}-${p(at.getMonth() + 1)}-${p(at.getDate())} ${p(at.getHours())}:${p(at.getMinutes())}:${p(at.getSeconds())}`
}
