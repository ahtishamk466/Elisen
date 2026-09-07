import { useState } from 'react'
import { Database, DatabaseBackup as RestoreIcon, Plus, Trash2, Upload } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Truncate } from '@/components/patterns/Truncate'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { UploadBackupDrawer } from './UploadBackupDrawer'
import { useBackupStore } from '@/stores/backupStore'
import { formatBackupSize, formatRelativeTime } from '@/lib/backupFixtures'
import type { DatabaseBackup } from '@/types/backup'

type SortKey = 'name' | 'size' | 'created' | 'modified'

const COLUMNS: { label: string; sort?: SortKey }[] = [
  { label: 'Name', sort: 'name' },
  { label: 'Size', sort: 'size' },
  { label: 'Create Time', sort: 'created' },
  { label: 'Modified Time', sort: 'modified' },
  { label: 'Actions' },
]

export type PageState = 'ready' | 'loading' | 'error'

/**
 * The old "Manage" screen for database backup files. Same columns and same
 * two actions per file — Restore DB and Delete file — but as one Actions
 * menu rather than two icon-only columns, matching every other list in the
 * app. Both actions are guarded: restoring overwrites the live database.
 */
export function DatabaseBackupsPage({ state = 'ready' }: { state?: PageState }) {
  const backups = useBackupStore((s) => s.backups)
  const createBackup = useBackupStore((s) => s.createBackup)
  const uploadBackup = useBackupStore((s) => s.uploadBackup)
  const removeBackup = useBackupStore((s) => s.removeBackup)

  const { visibleCount, loadingMore, loadMore, reset: resetVisible } = useInfiniteReveal(backups.length, 25)

  /* Size and Modified sort on the raw bytes and timestamp, never on the
     formatted string — "9.8 MB" sorts before "10 KB" as text, and a relative
     time ("2 hours ago") has no order at all. */
  const { sorted, sort, setSort } = useTableSort(backups, {
    name: (b) => b.name,
    size: (b) => b.bytes,
    created: (b) => b.createdAt,
    modified: (b) => b.modifiedAt,
  }, { onSortChange: resetVisible })
  const [uploading, setUploading] = useState(false)
  const [restoring, setRestoring] = useState<DatabaseBackup | null>(null)
  const [deleting, setDeleting] = useState<DatabaseBackup | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const loading = state === 'loading'

  if (state === 'error') {
    return (
      <AppShell title="Database Management" activeItem="System" activeChild="Database Management">
        <Alert title="We couldn't load the backup files">
          Refresh the page, and if it keeps happening, contact your administrator.
        </Alert>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Database Management"
      activeItem="System"
      activeChild="Database Management"
      headerActions={
        <>
          <Button size="md" variant="secondary" leadingIcon={<Upload size={16} />} onClick={() => setUploading(true)}>
            Upload Backup File
          </Button>
          <Button
            size="md"
            leadingIcon={<Plus size={16} />}
            onClick={() => { const b = createBackup(); setToast(`Backup created: ${b.name}`) }}
          >
            Create Backup
          </Button>
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        {!loading && backups.length === 0 ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<Database size={48} strokeWidth={1.5} />}
              title="No backup files yet"
              description="Create a backup of the live database, or upload an existing .sql file."
              action={
                <Button leadingIcon={<Plus size={16} />} onClick={() => { const b = createBackup(); setToast(`Backup created: ${b.name}`) }}>
                  Create Backup
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ minWidth: 900 }}>
                <caption className="sr-only">Database backup files</caption>
                <thead>
                  <tr className="border-b border-border-default bg-neutral-50">
                    {COLUMNS.map((c) => (
                      <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                        className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{c.label}</SortableTh>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 4 }, (_, i) => (
                        <tr key={i} className="border-b border-border-default last:border-b-0">
                          {COLUMNS.map((c) => <td key={c.label} className="px-lg py-base"><Skeleton className="h-4 w-full" /></td>)}
                        </tr>
                      ))
                    : sorted.slice(0, visibleCount).map((b) => (
                        <tr key={b.id} className="border-b border-border-default last:border-b-0">
                          {/* Filenames are long but meaningful — clamp with
                              the full name on hover rather than wrapping. */}
                          <td className="px-lg py-base align-top text-sm font-semibold text-text-primary" style={{ maxWidth: 320 }}>
                            <Truncate lines={1}>{b.name}</Truncate>
                          </td>
                          <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{formatBackupSize(b.bytes)}</td>
                          <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{b.createdAt}</td>
                          <td className="whitespace-nowrap px-lg py-base align-top text-sm text-text-primary">{formatRelativeTime(b.modifiedAt)}</td>
                          <td className="px-lg py-base align-top">
                            <ActionsMenu
                              ariaLabel={`Actions for ${b.name}`}
                              items={[
                                { label: 'Restore DB', icon: <RestoreIcon size={16} />, onSelect: () => setRestoring(b) },
                                { label: 'Delete file', icon: <Trash2 size={16} />, onSelect: () => setDeleting(b), tone: 'danger' },
                              ]}
                            />
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            {!loading && (
              <AutoLoadFooter total={backups.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="items" />
            )}
          </div>
        )}
      </div>

      {uploading && (
        <UploadBackupDrawer
          onClose={() => setUploading(false)}
          onSave={(file) => { uploadBackup(file.name, file.size); setToast(`Backup file uploaded: ${file.name}`) }}
        />
      )}

      {/* Restore replaces every table in the live database — the one action
          on this screen that can't be undone from inside the app. */}
      <ConfirmDialog
        open={!!restoring}
        title="Restore the database from this backup?"
        description={
          restoring
            ? `Every table in the live database will be replaced with the contents of "${restoring.name}" (${formatBackupSize(restoring.bytes)}). Work saved since that backup was taken will be lost. Create a backup first if you need a way back.`
            : ''
        }
        confirmLabel="Restore database"
        tone="danger"
        onConfirm={() => { if (restoring) setToast(`Database restored from ${restoring.name}.`); setRestoring(null) }}
        onCancel={() => setRestoring(null)}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete this backup file?"
        description={deleting ? `"${deleting.name}" will be permanently removed from the server. This can't be undone.` : ''}
        confirmLabel="Delete file"
        tone="danger"
        onConfirm={() => { if (deleting) { removeBackup(deleting.id); setToast(`Backup file "${deleting.name}" deleted.`) } setDeleting(null) }}
        onCancel={() => setDeleting(null)}
      />
    </AppShell>
  )
}
