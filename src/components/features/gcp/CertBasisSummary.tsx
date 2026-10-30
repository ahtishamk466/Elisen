import { useMemo } from 'react'
import { FileLink } from '@/components/patterns/FileLink'
import { Stat } from '@/components/patterns/Stat'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { useTccaStore } from '@/stores/tccaStore'
import { duplicateSections, levelLabel } from '@/lib/certBasisLevel'
import type { CertBasis, Regulation } from '@/types/gcp'

/**
 * One cert basis at a glance: where it came from (TCDS, its wording, a link
 * to check it against), how it was built, how many rules it holds and which
 * TCCA projects use it — plus the one-version-per-rule check. A basis applies
 * each rule at one amendment (Harris, 2026-09-09), so a section carried at
 * two amendments is flagged, with `onKeepLatest` offering the fix where the
 * caller allows editing.
 */
export function CertBasisSummary({ basis, onKeepLatest }: { basis: CertBasis; onKeepLatest?: () => void }) {
  const regulations = useGcpStore((s) => s.regulations)
  const projectBasis = useGcpFlowStore((s) => s.projectBasis)
  const tccaProjects = useTccaStore((s) => s.tccaProjects)

  const regs = useMemo(
    () => basis.regulationIds.map((id) => regulations.find((r) => r.id === id)).filter((r): r is Regulation => !!r),
    [basis, regulations],
  )
  const dupes = useMemo(() => duplicateSections(regs), [regs])
  const usedBy = tccaProjects.filter((t) => projectBasis[t.id] === basis.id).map((t) => t.number)

  return (
    <section className="grid gap-base rounded-sm border border-border-default bg-neutral-25 px-lg py-base" aria-label={`Cert basis ${basis.aircraftModel}`}>
      <div className="flex flex-wrap items-baseline gap-sm">
        <h2 className="text-base font-semibold text-text-primary">{basis.aircraftModel}</h2>
        <span className="text-sm text-text-muted">{basis.tcdsNumber ? `TCDS ${basis.tcdsNumber}` : 'Project-specific'}</span>
        {basis.tcdsUrl && <span className="ml-auto"><FileLink url={basis.tcdsUrl} label="Open TCDS" /></span>}
      </div>

      <dl className="grid grid-cols-2 gap-base tablet:grid-cols-4">
        <Stat dl label="Rules">{regs.length}</Stat>
        <Stat dl label="Built from">{levelLabel(basis)}</Stat>
        <Stat dl label="Basis on the TCDS">{basis.basisStatement || undefined}</Stat>
        <Stat dl label="Used by">{usedBy.length > 0 ? usedBy.join(', ') : 'No projects yet'}</Stat>
      </dl>

      {dupes.length > 0 && (
        <Alert title={`${dupes.length} rule${dupes.length === 1 ? ' has' : 's have'} more than one version`}>
          {/* Phrasing content only — `Alert` renders its children inside a <p>. */}
          A basis applies each rule at one amendment.{' '}
          {dupes.slice(0, 3).map((v) => `${v[0].section}: ${v.map((r) => r.amdt).join(', ')}`).join(' · ')}
          {dupes.length > 3 ? ` · and ${dupes.length - 3} more` : ''}
          {onKeepLatest && (
            <span className="mt-sm block">
              <Button variant="secondary" size="sm" onClick={onKeepLatest}>Keep the latest version</Button>
            </span>
          )}
        </Alert>
      )}
    </section>
  )
}
