import { useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import { AccordionSection } from '@/components/patterns/AccordionSection'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { PermissionDrawer } from './PermissionDrawer'
import { useAccessStore } from '@/stores/accessStore'
import { groupByModule, moduleLabel, rolesGranting, usersReachedByPermission } from '@/lib/accessDisplay'
import type { AccessPermission } from '@/types/access'

export interface PermissionsTabProps {
  onToast: (msg: string) => void
  /** Lifted so the page can host search + CTA in the shared header row. */
  query: string
  adding: boolean
  setAdding: (v: boolean) => void
}

export function PermissionsTab({ onToast, query, adding, setAdding }: PermissionsTabProps) {
  const permissions = useAccessStore((s) => s.permissions)
  const roles = useAccessStore((s) => s.roles)
  const users = useAccessStore((s) => s.users)
  const addPermission = useAccessStore((s) => s.addPermission)
  const updatePermission = useAccessStore((s) => s.updatePermission)

  const [editing, setEditing] = useState<AccessPermission | null>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return permissions
    const q = query.toLowerCase()
    return permissions.filter((p) => `${p.id} ${p.description}`.toLowerCase().includes(q))
  }, [permissions, query])

  const grouped = groupByModule(filtered.map((p) => p.id))

  return (
    <div className="grid gap-lg">
      {grouped.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState title="No permissions match your search" description="Try a different name or description." />
        </div>
      ) : (
        grouped.map(([module, ids]) => (
          <AccordionSection key={module} title={moduleLabel(module)} meta={`${ids.length} permission${ids.length === 1 ? '' : 's'}`} defaultOpen={grouped.length === 1 || !!query.trim()}>
            <div className="grid gap-sm">
              {ids.map((id) => {
                const p = permissions.find((x) => x.id === id)!
                const usedBy = rolesGranting(id, roles).length
                const reach = usersReachedByPermission(id, users, roles).length
                return (
                  <div key={id} className="flex items-center justify-between gap-lg border-b border-border-default pb-sm last:border-b-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{p.id}</p>
                      <p className="text-xs text-text-muted">{p.description}{p.ruleId ? ' · rule-conditioned' : ''}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-sm">
                      {p.routes.length === 0
                        ? <Badge tone="warning">No routes</Badge>
                        : <Badge appearance="outline">{p.routes.length} route{p.routes.length === 1 ? '' : 's'}</Badge>}
                      <Badge appearance="outline">{usedBy} role{usedBy === 1 ? '' : 's'} · {reach} user{reach === 1 ? '' : 's'}</Badge>
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        aria-label={`Edit permission ${p.id}`}
                        className="rounded-sm p-xs text-text-secondary transition-colors duration-fast hover:bg-neutral-100 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                      >
                        <Pencil size={16} aria-hidden />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </AccordionSection>
        ))
      )}

      {adding && (
        <PermissionDrawer
          mode="create"
          onClose={() => setAdding(false)}
          onSubmit={(p) => { addPermission(p); onToast(`Permission "${p.id}" created.`) }}
        />
      )}
      {editing && (
        <PermissionDrawer
          key={editing.id}
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(p) => { updatePermission(editing.id, p); onToast(`Permission "${p.id}" updated.`) }}
        />
      )}
    </div>
  )
}
