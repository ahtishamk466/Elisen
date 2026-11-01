import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { regulationTextBlocks, decodeRegulationEntities } from '@/lib/regulationText'
import { amendmentLabel, codeName, sourceLabel, subpartParts, subsectionParts } from '@/lib/gcpDisplay'
import { amdtOrder } from '@/lib/certBasisLevel'
import { Drawer } from '@/components/patterns/Drawer'
import { DetailCard } from '@/components/patterns/DetailView'
import { FileLink } from '@/components/patterns/FileLink'
import { Stat } from '@/components/patterns/Stat'
import { GcpChip } from './GcpChip'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useGcpStore } from '@/stores/gcpStore'
import type { Regulation } from '@/types/gcp'

export interface RegulationDetailDrawerProps {
  regulation: Regulation
  onClose: () => void
  /** Edit the version on screen, which may differ from the one opened. */
  onEdit?: (regulation: Regulation) => void
  /** The list the drawer was opened from, in its on-screen order: Previous / Next step through it. */
  sequence?: Regulation[]
  /** Ids of the basis being read, marked "In this basis". */
  basisIds?: ReadonlySet<string>
}

/* Parsed, not raw: some legacy text is only markup (`<p>&nbsp;</p>`), which is
   no text at all to a reader. */
const blocksOf = (value: string) => regulationTextBlocks(value, decodeRegulationEntities)
const hasText = (r: Regulation) => blocksOf(r.requirementText).length > 0
const newestFirst = (a: Regulation, b: Regulation) => (amdtOrder(b.amdt) ?? -1) - (amdtOrder(a.amdt) ?? -1)

/** Requirement and MOC paragraphs, a size up from body copy: these run to 10,000 characters. */
function TextBlocks({ blocks, clauses = false }: { blocks: ReturnType<typeof blocksOf>; clauses?: boolean }) {
  return <>{blocks.map((block, i) => (
    <p key={i} className={`whitespace-pre-wrap break-words ${clauses && block.indent === 'number' ? 'pl-lg' : clauses && block.indent === 'roman' ? 'pl-2xl' : ''}`}>{block.text}</p>
  ))}</>
}

/**
 * Read-only view of one regulation — every stored field, editing behind the
 * Edit action, the same split as every other View in the app. Since 2026-11-01
 * it leads with what a reader looks for: the rule's title and status, then its
 * MOC (when it has one) ahead of the requirement text. Half the library has no
 * requirement text, so **Versions** lists every amendment of the section with
 * which ones have text, and switches the drawer to any of them.
 */
export function RegulationDetailDrawer({ regulation, onClose, onEdit, sequence, basisIds }: RegulationDetailDrawerProps) {
  const regulations = useGcpStore((s) => s.regulations)
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const [r, setR] = useState(regulation)
  /* Where Previous / Next count from: the list row last stepped to, which a
     look at another version doesn't move. */
  const [anchorId, setAnchorId] = useState(regulation.id)
  useEffect(() => { setR(regulation); setAnchorId(regulation.id) }, [regulation])
  const top = useRef<HTMLDivElement>(null)
  /* Braced: newer browsers return a Promise from scrollIntoView, which React
     would take for a cleanup function. */
  useEffect(() => { top.current?.scrollIntoView({ block: 'start' }) }, [r.id])

  const versions = useMemo(() => regulations.filter((v) => v.section === r.section).sort(newestFirst), [regulations, r.section])
  const moc = useMemo(() => blocksOf(r.defaultMocText), [r.defaultMocText])
  const requirement = useMemo(() => blocksOf(r.requirementText), [r.requirementText])
  const textElsewhere = versions.filter((v) => v.id !== r.id && hasText(v)).map((v) => amendmentLabel(v.amdt))
  const at = sequence ? sequence.findIndex((x) => x.id === anchorId) : -1
  const step = (next: Regulation) => { setR(next); setAnchorId(next.id) }

  return (
    <Drawer
      open
      onClose={onClose}
      title={`${r.section} · ${amendmentLabel(r.amdt)}`}
      footer={
        <>
          {sequence && at >= 0 && sequence.length > 1 && (
            <div className="mr-auto flex items-center gap-sm">
              <Button variant="secondary" size="sm" leadingIcon={<ChevronLeft size={16} />} disabled={at === 0} onClick={() => step(sequence[at - 1])}>Previous</Button>
              <Button variant="secondary" size="sm" trailingIcon={<ChevronRight size={16} />} disabled={at === sequence.length - 1} onClick={() => step(sequence[at + 1])}>Next</Button>
              <span className="whitespace-nowrap text-xs tabular-nums text-text-muted">{at + 1} of {sequence.length}</span>
            </div>
          )}
          <Button variant="secondary" onClick={onClose}>Close</Button>
          {onEdit && <Button onClick={() => onEdit(r)}>Edit</Button>}
        </>
      }
    >
      <div className="grid gap-lg">
        <div ref={top} className="grid gap-base">
          <p className="text-lg font-semibold text-text-primary">{r.title || '—'}</p>
          <div className="flex flex-wrap items-center gap-sm text-sm">
            <Badge tone={r.active ? 'success' : 'neutral'}>{r.active ? 'Active' : 'Inactive'}</Badge>
            {basisIds?.has(r.id) && <Badge tone="info">In this basis</Badge>}
            {r.url ? <FileLink url={r.url} label={sourceLabel(r.url)} /> : <span className="text-text-muted">No source link</span>}
          </div>
          <dl className="grid grid-cols-2 gap-lg border-t border-border-default pt-base">
            <Stat dl label="Subpart">{codeName(subpartParts(r.subpartCode, subparts))}</Stat>
            <Stat dl label="Subsection">{codeName(subsectionParts(r.subsectionCode, subsections))}</Stat>
          </dl>
        </div>

        {moc.length > 0 && (
          <DetailCard title="Default Means of Compliance (MOC)">
            <div className="grid gap-base text-base leading-relaxed text-text-primary"><TextBlocks blocks={moc} /></div>
          </DetailCard>
        )}

        <DetailCard title="Requirement Text">
          {requirement.length > 0 ? (
            <div className="grid gap-lg text-base leading-relaxed text-text-primary">
              <TextBlocks blocks={requirement} clauses />
              {/<img\b/i.test(r.requirementText) && <p className="text-xs text-text-muted">The source includes images. Open the source reference to view them.</p>}
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              No requirement text recorded for this version.
              {textElsewhere.length > 0 && ` ${textElsewhere.join(', ')} ${textElsewhere.length === 1 ? 'has' : 'have'} it; see Versions below.`}
            </p>
          )}
        </DetailCard>

        {versions.length > 1 && (
          <DetailCard title={`Versions of ${r.section}`}>
            <ul>
              {versions.map((v) => {
                const showing = v.id === r.id
                return (
                  <li key={v.id} className="border-b border-border-default last:border-b-0">
                    <button type="button" disabled={showing} aria-current={showing ? 'true' : undefined} onClick={() => setR(v)}
                      className="flex w-full items-center justify-between gap-base py-sm text-left text-sm text-text-primary transition-colors duration-fast enabled:hover:text-accent disabled:cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
                      <span className="flex flex-wrap items-center gap-sm">
                        <span className="font-semibold tabular-nums">{amendmentLabel(v.amdt)}</span>
                        {showing && <Badge>Showing</Badge>}
                        {v.active && <Badge tone="success">Active</Badge>}
                        {basisIds?.has(v.id) && <Badge tone="info">In this basis</Badge>}
                      </span>
                      <span className="shrink-0 text-xs text-text-muted">{hasText(v) ? 'Has text' : 'No text'}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </DetailCard>
        )}

        <DetailCard title="Placement">
          <dl className="grid grid-cols-2 gap-lg">
            <Stat dl label="Section Root"><GcpChip value={r.sectionRoot} label="section roots" /></Stat>
            <Stat dl label="Sort">{r.sort}</Stat>
          </dl>
        </DetailCard>
      </div>
    </Drawer>
  )
}
