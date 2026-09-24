import { useMemo, useState, type CSSProperties } from 'react'
import { Eye, Pencil, ShieldCheck, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { Badge } from '@/components/ui/Badge'
import { useGcpStore } from '@/stores/gcpStore'
import type { Foc } from '@/types/gcp'
import { FocDetailDrawer } from './FocDetailDrawer'
import { FocDrawer } from './FocDrawer'

type SortKey = 'code' | 'authoritySpecialist' | 'specialty' | 'isDefault'

const COLUMNS: { label: string; sort: SortKey; style?: CSSProperties }[] = [
  { label: 'Code', sort: 'code', style: { width: 200 } },
  { label: 'Authority Specialist', sort: 'authoritySpecialist' },
  { label: 'Specialty', sort: 'specialty' },
  { label: 'Default', sort: 'isDefault', style: { width: 100 } },
]

export interface GcpFocTabProps {
  /** The page header's "Add FOC" button controls this drawer — see
      docs/COMPONENTS.md, "Tabbed page layout" for why Add lives there and
      not in this panel. */
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
  /** The page header's search box (next to Add) also lives outside this
      panel now, same reasoning — see "Tabbed page layout". */
  query: string
}

/** Step 1 of the People & Authority tabs — every code that can find or
    recommend compliance, exactly as the legacy FOC list has it (63 rows),
    with the client's own placeholder names swapped in for the real ones
    (see gcpFixtures.ts and docs/DECISIONS.md). */
export function GcpFocTab({ createOpen, onCreateOpenChange, query }: GcpFocTabProps) {
  const focs = useGcpStore((s) => s.focs)
  const addFoc = useGcpStore((s) => s.addFoc)
  const updateFoc = useGcpStore((s) => s.updateFoc)
  const removeFoc = useGcpStore((s) => s.removeFoc)

  const [viewing, setViewing] = useState<Foc | null>(null)
  const [editing, setEditing] = useState<Foc | null>(null)
  const [toDelete, setToDelete] = useState<Foc | null>(null)

  const q = query.trim().toLowerCase()
  const filtered = q
    ? focs.filter((f) => `${f.code} ${f.authoritySpecialist} ${f.specialty}`.toLowerCase().includes(q))
    : focs

  const { sorted, sort, setSort } = useTableSort(filtered, {
    code: (f) => f.code,
    authoritySpecialist: (f) => f.authoritySpecialist,
    specialty: (f) => f.specialty,
    isDefault: (f) => f.isDefault,
  })

  const rows = useMemo(() => sorted, [sorted])

  return (
    <div className="grid gap-lg">
      {rows.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<ShieldCheck size={48} strokeWidth={1.5} />}
            title={query ? 'No FOC codes match your search' : 'No FOC codes yet'}
            description={query ? 'Try another code, specialist or specialty.' : 'Add the first FOC code.'}
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">FOC codes</caption>
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
              {rows.map((f) => (
                <tr key={f.id} className="border-b border-border-default last:border-b-0">
                  <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{f.code}</td>
                  <td className="px-lg py-base text-sm text-text-primary">{f.authoritySpecialist}</td>
                  <td className="px-lg py-base text-sm text-text-primary">{f.specialty || '—'}</td>
                  <td className="px-lg py-base">
                    <Badge tone={f.isDefault ? 'success' : 'neutral'}>{f.isDefault ? 'Yes' : 'No'}</Badge>
                  </td>
                  <td className="px-lg py-base">
                    <ActionsMenu
                      ariaLabel={`Actions for ${f.code}`}
                      items={[
                        { label: 'View', icon: <Eye size={16} />, onSelect: () => setViewing(f) },
                        { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setEditing(f) },
                        { label: 'Remove', icon: <Trash2 size={16} />, onSelect: () => setToDelete(f), tone: 'danger' },
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
        <FocDrawer
          mode="create"
          onClose={() => onCreateOpenChange(false)}
          onSubmit={(f) => addFoc(f)}
        />
      )}

      {editing && (
        <FocDrawer
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(f) => updateFoc(f.id, f)}
        />
      )}

      {viewing && (
        <FocDetailDrawer
          foc={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null) }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          open
          title={`Remove “${toDelete.code}”?`}
          description="This FOC code will no longer be offered when planning compliance."
          confirmLabel="Remove"
          tone="danger"
          onConfirm={() => { removeFoc(toDelete.id); setToDelete(null) }}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
