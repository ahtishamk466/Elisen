import { useState, type CSSProperties } from 'react'
import { BookOpen, Eye, Pencil, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { Truncate } from '@/components/patterns/Truncate'
import { useTableSort } from '@/components/patterns/useTableSort'
import { useGcpStore } from '@/stores/gcpStore'
import type { Moc } from '@/types/gcp'
import { MocDetailDrawer } from './MocDetailDrawer'
import { MocDrawer } from './MocDrawer'

type SortKey = 'code' | 'title' | 'description'

const COLUMNS: { label: string; sort: SortKey; style?: CSSProperties }[] = [
  { label: 'Code', sort: 'code', style: { width: 120 } },
  { label: 'Title', sort: 'title', style: { width: 260 } },
  { label: 'Description', sort: 'description' },
]

export interface GcpMocTabProps {
  /** The page header's "Add MOC" button controls this drawer — see
      docs/COMPONENTS.md, "Tabbed page layout". */
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
  /** The page header's search box (next to Add) also lives outside this
      panel, same reasoning. */
  query: string
}

/** Reference Lists' MOC tab — every Means of Compliance code exactly as the
    legacy `moc/index` list has it (16 rows, no personal data). */
export function GcpMocTab({ createOpen, onCreateOpenChange, query }: GcpMocTabProps) {
  const mocs = useGcpStore((s) => s.mocs)
  const addMoc = useGcpStore((s) => s.addMoc)
  const updateMoc = useGcpStore((s) => s.updateMoc)
  const removeMoc = useGcpStore((s) => s.removeMoc)

  const [viewing, setViewing] = useState<Moc | null>(null)
  const [editing, setEditing] = useState<Moc | null>(null)
  const [toDelete, setToDelete] = useState<Moc | null>(null)

  const q = query.trim().toLowerCase()
  const filtered = q
    ? mocs.filter((m) => `${m.code} ${m.title} ${m.description}`.toLowerCase().includes(q))
    : mocs

  const { sorted, sort, setSort } = useTableSort(filtered, {
    code: (m) => m.code,
    title: (m) => m.title,
    description: (m) => m.description,
  })

  return (
    <div className="grid gap-lg">
      {sorted.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<BookOpen size={48} strokeWidth={1.5} />}
            title={query ? 'No MOC codes match your search' : 'No MOC codes yet'}
            description={query ? 'Try another code, title or description.' : 'Add the first MOC code.'}
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25">
          <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">Means of Compliance codes</caption>
            <thead>
              <tr className="border-b border-border-default bg-neutral-50">
                {COLUMNS.map((c) => (
                  <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                    style={c.style} className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">
                    {c.label}
                  </SortableTh>
                ))}
                <SortableTh style={{ width: 64 }} className="px-lg py-base text-sm font-semibold text-text-secondary">Actions</SortableTh>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => (
                <tr key={m.id} className="border-b border-border-default last:border-b-0">
                  <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{m.code}</td>
                  <td className="px-lg py-base text-sm text-text-primary">
                    <Truncate lines={2}>{m.title}</Truncate>
                  </td>
                  <td className="px-lg py-base text-sm text-text-primary">
                    <Truncate lines={2}>{m.description}</Truncate>
                  </td>
                  <td className="px-lg py-base">
                    <ActionsMenu
                      ariaLabel={`Actions for MOC ${m.code}`}
                      items={[
                        { label: 'View', icon: <Eye size={16} />, onSelect: () => setViewing(m) },
                        { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setEditing(m) },
                        { label: 'Remove', icon: <Trash2 size={16} />, onSelect: () => setToDelete(m), tone: 'danger' },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {createOpen && (
        <MocDrawer
          mode="create"
          onClose={() => onCreateOpenChange(false)}
          onSubmit={(m) => addMoc(m)}
        />
      )}

      {editing && (
        <MocDrawer
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(m) => updateMoc(m.id, m)}
        />
      )}

      {viewing && (
        <MocDetailDrawer
          moc={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null) }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          open
          title={`Remove “${toDelete.code}”?`}
          description="This MOC code will no longer be offered when filing a compliance item."
          confirmLabel="Remove"
          tone="danger"
          onConfirm={() => { removeMoc(toDelete.id); setToDelete(null) }}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
