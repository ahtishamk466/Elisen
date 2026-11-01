import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { delegationWorkspace } from '@/lib/delegationWorkspace'
import { useGcpStore } from '@/stores/gcpStore'
import type { Delegation } from '@/types/gcp'
import { DelegationDrawer } from './DelegationDrawer'
import { DelegationRulesPanel } from './DelegationRulesPanel'
import { DelegationSpecialistRail } from './DelegationSpecialistRail'

export interface GcpDelegationTabProps {
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
  query: string
}

/** Read saved delegations by specialist; grouping never changes their identity. */
export function GcpDelegationTab({ createOpen, onCreateOpenChange, query }: GcpDelegationTabProps) {
  const delegations = useGcpStore((s) => s.delegations)
  const focs = useGcpStore((s) => s.focs)
  const regulations = useGcpStore((s) => s.regulations)
  const dataStatus = useGcpStore((s) => s.dataStatus)
  const retry = useGcpStore((s) => s.ensureGcpData)
  const addDelegation = useGcpStore((s) => s.addDelegation)
  const updateDelegation = useGcpStore((s) => s.updateDelegation)
  const removeDelegation = useGcpStore((s) => s.removeDelegation)
  const [selectedCode, setSelectedCode] = useState<string>()
  const [editing, setEditing] = useState<Delegation | null>(null)
  const [toDelete, setToDelete] = useState<Delegation | null>(null)

  const specialists = useMemo(() => delegationWorkspace(delegations, focs, regulations, query),
    [delegations, focs, regulations, query])
  // Resolve against the filtered rail in this render, before any effect runs.
  const selected = specialists.find((person) => person.focCode === selectedCode)
    ?? specialists.find((person) => person.matchingRecordCount > 0) ?? specialists[0]
  useEffect(() => { setSelectedCode(selected?.focCode) }, [selected?.focCode])

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-lg laptop:flex-row">
      {specialists.length === 0 ? (
        <div role={dataStatus === 'error' ? 'alert' : dataStatus !== 'ready' ? 'status' : undefined}
          className="min-w-0 flex-1 rounded-sm border border-border-default bg-neutral-25">
          <EmptyState icon={dataStatus === 'loading' ? <Spinner size={48} /> : <ShieldCheck size={48} strokeWidth={1.5} />}
            title={dataStatus === 'error' ? 'Regulation titles could not be loaded'
              : dataStatus !== 'ready' ? 'Loading regulation titles…'
                : query ? 'No specialists or rules match your search' : 'No specialists or coverage yet'}
            description={dataStatus !== 'ready'
              ? 'Search by specialist name, FOC code or Section Root to find saved coverage while titles are unavailable.'
              : query ? 'Try another specialist name, FOC code, Section Root or regulation title.' : 'Use Add to create the first coverage record.'}
            action={dataStatus === 'error' ? <Button variant="secondary" onClick={retry}>Try Again</Button> : undefined} />
        </div>
      ) : (
        <>
          <DelegationSpecialistRail specialists={specialists} selectedCode={selected?.focCode}
            filtered={!!query.trim()} onSelect={setSelectedCode} />
          {selected && <DelegationRulesPanel key={selected.focCode} specialist={selected}
            libraryStatus={dataStatus} onRetry={retry}
            onEdit={setEditing} onRemove={setToDelete} />}
        </>
      )}

      {createOpen && (
        <DelegationDrawer mode="create"
          initial={selected ? { id: '', sectionRoot: '', focCode: selected.focCode, limitation: false, active: true } : undefined}
          onClose={() => onCreateOpenChange(false)}
          onSubmit={(delegation) => { addDelegation(delegation); setSelectedCode(delegation.focCode) }} />
      )}
      {editing && (
        <DelegationDrawer mode="edit" initial={editing} onClose={() => setEditing(null)}
          onSubmit={(delegation) => { updateDelegation(delegation.id, delegation); setSelectedCode(delegation.focCode) }} />
      )}
      {toDelete && (
        <ConfirmDialog open title={`Remove coverage for “${toDelete.sectionRoot} · ${toDelete.focCode}”?`}
          description="This specialist’s coverage for the rule will no longer be offered when planning compliance."
          confirmLabel="Remove" tone="danger"
          onConfirm={() => { removeDelegation(toDelete.id); setToDelete(null) }}
          onCancel={() => setToDelete(null)} />
      )}
    </div>
  )
}
