import { useState, type CSSProperties } from 'react'
import { Eye, Pencil, ShieldCheck, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { Badge } from '@/components/ui/Badge'
import { useGcpStore } from '@/stores/gcpStore'
import type { Discipline } from '@/types/gcp'
import { DisciplineDetailDrawer } from './DisciplineDetailDrawer'
import { DisciplineDrawer } from './DisciplineDrawer'

type SortKey = 'daoSpecialtyCode' | 'elisenDiscipline' | 'tccaDiscipline' | 'active'

const COLUMNS: { label: string; sort: SortKey; style?: CSSProperties }[] = [
  { label: 'Dao Specialty Code', sort: 'daoSpecialtyCode', style: { width: 200 } },
  { label: 'Elisen discipline', sort: 'elisenDiscipline' },
  { label: 'TCCA discipline', sort: 'tccaDiscipline' },
  { label: 'Active', sort: 'active', style: { width: 100 } },
]

export interface GcpDisciplineTabProps {
  /** The page header's "Add Discipline" button controls this drawer — see
      docs/COMPONENTS.md, "Tabbed page layout". */
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
  /** The page header's search box (next to Add) also lives outside this
      panel now, same reasoning. */
  query: string
}

/** Step 3 of the People & Authority tabs — every DAO Specialty Code mapped
    to its Elisen and TCCA discipline names, exactly as the legacy Discipline
    list has it (23 rows). No personal data on this one, unlike FOC, so
    nothing needed anonymizing. */
export function GcpDisciplineTab({ createOpen, onCreateOpenChange, query }: GcpDisciplineTabProps) {
  const disciplines = useGcpStore((s) => s.disciplines)
  const addDiscipline = useGcpStore((s) => s.addDiscipline)
  const updateDiscipline = useGcpStore((s) => s.updateDiscipline)
  const removeDiscipline = useGcpStore((s) => s.removeDiscipline)

  const [viewing, setViewing] = useState<Discipline | null>(null)
  const [editing, setEditing] = useState<Discipline | null>(null)
  const [toDelete, setToDelete] = useState<Discipline | null>(null)

  const q = query.trim().toLowerCase()
  const filtered = q
    ? disciplines.filter((d) => `${d.daoSpecialtyCode} ${d.elisenDiscipline} ${d.tccaDiscipline}`.toLowerCase().includes(q))
    : disciplines

  const { sorted, sort, setSort } = useTableSort(filtered, {
    daoSpecialtyCode: (d) => d.daoSpecialtyCode,
    elisenDiscipline: (d) => d.elisenDiscipline,
    tccaDiscipline: (d) => d.tccaDiscipline,
    active: (d) => d.active,
  })

  return (
    <div className="grid gap-lg">
      {sorted.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<ShieldCheck size={48} strokeWidth={1.5} />}
            title={query ? 'No disciplines match your search' : 'No disciplines yet'}
            description={query ? 'Try another code or discipline name.' : 'Add the first discipline.'}
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Disciplines</caption>
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
              {sorted.map((d) => (
                <tr key={d.id} className="border-b border-border-default last:border-b-0">
                  <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{d.daoSpecialtyCode}</td>
                  <td className="px-lg py-base text-sm text-text-primary">{d.elisenDiscipline}</td>
                  <td className="px-lg py-base text-sm text-text-primary">{d.tccaDiscipline}</td>
                  <td className="px-lg py-base">
                    <Badge tone={d.active ? 'success' : 'neutral'}>{d.active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-lg py-base">
                    <ActionsMenu
                      ariaLabel={`Actions for ${d.daoSpecialtyCode}`}
                      items={[
                        { label: 'View', icon: <Eye size={16} />, onSelect: () => setViewing(d) },
                        { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setEditing(d) },
                        { label: 'Remove', icon: <Trash2 size={16} />, onSelect: () => setToDelete(d), tone: 'danger' },
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
        <DisciplineDrawer
          mode="create"
          onClose={() => onCreateOpenChange(false)}
          onSubmit={(d) => addDiscipline(d)}
        />
      )}

      {editing && (
        <DisciplineDrawer
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(d) => updateDiscipline(d.id, d)}
        />
      )}

      {viewing && (
        <DisciplineDetailDrawer
          discipline={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null) }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          open
          title={`Remove “${toDelete.daoSpecialtyCode}”?`}
          description="This discipline will no longer be offered when filing a compliance item."
          confirmLabel="Remove"
          tone="danger"
          onConfirm={() => { removeDiscipline(toDelete.id); setToDelete(null) }}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
