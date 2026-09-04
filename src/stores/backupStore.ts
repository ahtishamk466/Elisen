import { create } from 'zustand'
import { DATABASE_BACKUPS, backupFileName, backupTimestamp } from '@/lib/backupFixtures'
import type { DatabaseBackup } from '@/types/backup'

interface BackupState {
  backups: DatabaseBackup[]
  /** "Create Backup" — dumps the live DB to a new timestamped .sql file. */
  createBackup: () => DatabaseBackup
  /** "Upload Backup File" — adds a .sql file from the user's machine. */
  uploadBackup: (name: string, bytes: number) => void
  removeBackup: (id: string) => void
}

export const useBackupStore = create<BackupState>((set) => ({
  backups: DATABASE_BACKUPS,

  createBackup: () => {
    const now = new Date()
    const backup: DatabaseBackup = {
      id: crypto.randomUUID(),
      name: backupFileName(now),
      // Stand-in for the real dump size until this is wired to a backend.
      bytes: 3_500_000,
      createdAt: backupTimestamp(now),
      modifiedAt: backupTimestamp(now),
    }
    set((s) => ({ backups: [backup, ...s.backups] }))
    return backup
  },

  uploadBackup: (name, bytes) => {
    const now = backupTimestamp(new Date())
    set((s) => ({
      backups: [{ id: crypto.randomUUID(), name, bytes, createdAt: now, modifiedAt: now }, ...s.backups],
    }))
  },

  removeBackup: (id) => set((s) => ({ backups: s.backups.filter((b) => b.id !== id) })),
}))
