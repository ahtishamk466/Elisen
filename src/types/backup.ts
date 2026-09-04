/**
 * Database Maintenance — the backup files on disk, as listed by the old
 * "Manage" screen. Sizes are raw bytes and rendered as kibibytes/mebibytes
 * at display time; both timestamps are stored absolute, and Modified Time
 * is shown relative ("8 months ago") the way the old screen did.
 */
export interface DatabaseBackup {
  id: string
  name: string
  bytes: number
  /** 'YYYY-MM-DD HH:mm:ss' */
  createdAt: string
  /** 'YYYY-MM-DD HH:mm:ss' */
  modifiedAt: string
}
