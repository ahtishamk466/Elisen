import { useEffect, useState } from 'react'
import { FolderKanban } from 'lucide-react'
import { EmptyState } from '@/components/patterns/EmptyState'
import { FormField } from '@/components/patterns/FormField'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { useTccaStore } from '@/stores/tccaStore'
import { levelLabel } from '@/lib/certBasisLevel'
import { CertBasisSummary } from '../CertBasisSummary'
import type { BasisDraft } from './FlowStepBasis'

/**
 * Step 2's "Start from an existing basis" mode — the legacy Master Cert
 * Basis "Associate" screen: a basis is built once for an aircraft type (e.g.
 * `B747-400_A20WE`) and linked to every later project on that type, rather
 * than rebuilt (Harris, 2026-09-09). Linking shares the basis; it isn't
 * copied. Reverses part of the 2026-09-23 "skip Master Cert Basis" decision
 * at the user's request, 2026-10-30 — the other two modes are unchanged.
 */
export function BasisReusePicker({ initialBasisId, onDraft }: {
  initialBasisId?: string
  onDraft: (draft: BasisDraft | null) => void
}) {
  const bases = useGcpFlowStore((s) => s.bases)
  const projectBasis = useGcpFlowStore((s) => s.projectBasis)
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const [basisId, setBasisId] = useState(initialBasisId ?? '')

  useEffect(() => {
    onDraft(basisId ? { kind: 'link', basisId } : null)
  }, [basisId, onDraft])

  const usedCount = (id: string) => tccaProjects.filter((t) => projectBasis[t.id] === id).length
  const selected = bases.find((b) => b.id === basisId)

  if (bases.length === 0) {
    return (
      <div className="rounded-sm border border-border-default bg-neutral-25">
        <EmptyState icon={<FolderKanban size={48} strokeWidth={1.5} />} title="No cert basis to start from yet"
          description="Build one from an amendment level first; later projects on the same aircraft can then reuse it." />
      </div>
    )
  }

  return (
    <div className="grid gap-base">
      <div className="rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
        <FormField label="Cert basis" htmlFor="reuse-basis" fullWidth
          help="Shared, not copied: a later edit to the basis applies to every project that uses it.">
          <SearchableSelect id="reuse-basis" value={basisId} onChange={setBasisId} placeholder="Select a cert basis…"
            options={bases.map((b) => ({
              value: b.id,
              label: b.aircraftModel,
              hint: `${b.regulationIds.length} rules · ${levelLabel(b)} · used by ${usedCount(b.id)}`,
            }))} />
        </FormField>
      </div>
      {selected && <CertBasisSummary basis={selected} />}
    </div>
  )
}
