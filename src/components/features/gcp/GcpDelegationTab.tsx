import { useState, type CSSProperties } from 'react'
import { Eye, Pencil, ShieldCheck, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { Badge } from '@/components/ui/Badge'
import { useGcpStore } from '@/stores/gcpStore'
import type { Delegation } from '@/types/gcp'
import { DelegationDetailDrawer } from './DelegationDetailDrawer'
import { DelegationDrawer } from './DelegationDrawer'

type SortKey = 'sectionRoot' | 'focCode' | 'limitation' | 'active'

const COLUMNS: { label: string; sort: SortKey; style?: CSSProperties }[] = [
  { label: 'Section Root', sort: 'sectionRoot', style: { width: 200 } },
  { label: 'FOC Code', sort: 'focCode', style: { width: 160 } },
  { label: 'Limitation', sort: 'limitation', style: { width: 130 } },
  { label: 'Active', sort: 'active', style: { width: 100 } },
]

export interface GcpDelegationTabProps {
  /** The page header's "Add Delegation" button controls this drawer — see
      docs/COMPONENTS.md, "Tabbed page layout". */
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
  /** The page header's search box (next to Add) also lives outside this
      panel now, same reasoning. */
  query: string
}

/** Step 2 of the People & Authority tabs — which Section Root a FOC Code may
    sign for, exactly as the legacy Delegation list has it (720 rows). No
    personal data on this one either, so nothing needed anonymizing. The
    table scrolls in its own bounded frame (like Scope Rules' regulation
    pool) rather than stretching the page to 720 rows tall. */
export function GcpDelegationTab({ createOpen, onCreateOpenChange, query }: GcpDelegationTabProps) {
  const delegations = useGcpStore((s) => s.delegations)
  const addDelegation = useGcpStore((s) => s.addDelegation)
  const updateDelegation = useGcpStore((s) => s.updateDelegation)
  const removeDelegation = useGcpStore((s) => s.removeDelegation)

  const [viewing, setViewing] = useState<Delegation | null>(null)
  const [editing, setEditing] = useState<Delegation | null>(null)
  const [toDelete, setToDelete] = useState<Delegation | null>(null)

  const q = query.trim().toLowerCase()
  const filtered = q
    ? delegations.filter((d) => `${d.sectionRoot} ${d.focCode}`.toLowerCase().includes(q))
    : delegations

  const { sorted, sort, setSort } = useTableSort(filtered, {
    sectionRoot: (d) => d.sectionRoot,
    focCode: (d) => d.focCode,
    limitation: (d) => d.limitation,
    active: (d) => d.active,
  })

  return (
    <div className="grid gap-lg">
      {sorted.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<ShieldCheck size={48} strokeWidth={1.5} />}
            title={query ? 'No delegations match your search' : 'No delegations yet'}
            description={query ? 'Try another section root or FOC code.' : 'Add the first delegation.'}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Delegations</caption>
              <thead>
                <tr className="sticky top-0 border-b border-border-default bg-neutral-50">
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
                    <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{d.sectionRoot}</td>
                    <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{d.focCode}</td>
                    <td className="px-lg py-base">
                      <Badge tone={d.limitation ? 'success' : 'danger'}>{d.limitation ? 'Yes' : 'No'}</Badge>
                    </td>
                    <td className="px-lg py-base">
                      <Badge tone={d.active ? 'success' : 'neutral'}>{d.active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-lg py-base">
                      <ActionsMenu
                        ariaLabel={`Actions for ${d.sectionRoot} · ${d.focCode}`}
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
        </div>
      )}

      {createOpen && (
        <DelegationDrawer
          mode="create"
          onClose={() => onCreateOpenChange(false)}
          onSubmit={(d) => addDelegation(d)}
        />
      )}

      {editing && (
        <DelegationDrawer
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(d) => updateDelegation(d.id, d)}
        />
      )}

      {viewing && (
        <DelegationDetailDrawer
          delegation={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null) }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          open
          title={`Remove “${toDelete.sectionRoot} · ${toDelete.focCode}”?`}
          description="This delegation will no longer be offered when planning compliance."
          confirmLabel="Remove"
          tone="danger"
          onConfirm={() => { removeDelegation(toDelete.id); setToDelete(null) }}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
