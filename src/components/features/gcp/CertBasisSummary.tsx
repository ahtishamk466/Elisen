import { useMemo, type ReactNode } from 'react'
import { FolderKanban } from 'lucide-react'
import { ChipOverflow } from '@/components/patterns/ChipOverflow'
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
 * One cert basis at a glance: its name once, where it came from (TCDS, a link
 * to check it against), how it was built, how many rules it holds and which
 * TCCA projects use it, plus the one-version-per-rule check. A basis applies
 * each rule at one amendment (Harris, 2026-09-09), so a section carried at two
 * amendments raises a warning, with `onKeepLatest` offering the fix where the
 * caller allows editing.
 *
 * Unboxed and unpadded: the Certification Basis page puts it at the top of
 * the same card as the basis's rules (one box, not a header card over a table
 * card, the 2026-09-24 complaint); step 2's reuse picker gives it a box of its
 * own. Same shape as the GCP Projects summary: header on white with an icon
 * tile, figures on an inset tinted band, so the name, the figures and the
 * rules table read as three blocks. A figure with nothing to show is left out
 * rather than printed as "—" (user request, 2026-10-30: too much to scan).
 */
export function CertBasisSummary({ basis, actions, onKeepLatest }: {
  basis: CertBasis
  /** Basis-level buttons, e.g. Edit and the Delete menu, at the header's end. */
  actions?: ReactNode
  onKeepLatest?: () => void
}) {
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
    <div>
      <header className="flex flex-wrap items-center gap-sm px-lg py-lg">
        <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-accent-subtle text-accent">
          <FolderKanban size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold text-text-primary">{basis.aircraftModel}</h2>
          <p className="truncate text-sm text-text-secondary">{basis.description || (basis.tcdsNumber ? `TCDS ${basis.tcdsNumber}` : 'Project-specific')}</p>
        </div>
        <span className="flex shrink-0 items-center gap-sm">
          {basis.tcdsUrl && <FileLink url={basis.tcdsUrl} label="Open TCDS" />}
          {actions}
        </span>
      </header>

      <div className="rounded-sm bg-neutral-100" style={{ margin: 3 }}>
        <dl className="flex flex-wrap gap-x-4xl gap-y-base px-lg py-base">
          <Stat dl label="Rules">{regs.length}</Stat>
          <Stat dl label="Built From">{levelLabel(basis)}</Stat>
          {/* Up to 16 projects share one basis (A4N_23-14): two chips, then +N more. */}
          <Stat dl label="Used By">{usedBy.length > 0 ? <ChipOverflow items={usedBy} max={2} label="projects" /> : 'No projects yet'}</Stat>
          {basis.basisStatement && <Stat dl label="Basis on the TCDS">{basis.basisStatement}</Stat>}
          {basis.sourceDocument && (
            <Stat dl label="Source Document"><FileLink url={basis.sourceDocument.url} label={basis.sourceDocument.name} /></Stat>
          )}
        </dl>
      </div>

      {dupes.length > 0 && (
        <div className="px-lg pb-base pt-sm">
          <Alert tone="warning" title={`${dupes.length} rule${dupes.length === 1 ? ' appears' : 's appear'} more than once (${dupes.map((v) => v[0].section).join(', ')})`}>
            {/* Phrasing content only — `Alert` renders its children inside a <p>. */}
            A basis applies each rule at one amendment.{' '}
            {dupes.slice(0, 3).map((v) => `${v[0].section}: ${v.map((r) => r.amdt).join(', ')}`).join(' · ')}
            {dupes.length > 3 ? ` · and ${dupes.length - 3} more` : ''}
            {onKeepLatest && (
              <span className="mt-sm block">
                <Button variant="secondary" size="sm" onClick={onKeepLatest}>Keep Latest Version</Button>
              </span>
            )}
          </Alert>
        </div>
      )}
    </div>
  )
}
