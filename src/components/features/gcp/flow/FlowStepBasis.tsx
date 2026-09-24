import { useMemo, useState } from 'react'
import { ArrowLeft, BookMarked } from 'lucide-react'
import { EmptyState } from '@/components/patterns/EmptyState'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import type { TccaProject } from '@/types/tcca'

/**
 * Step 2 — the certification basis, scoped straight from the rule pool.
 *
 * No separate Master Cert Basis identity here: the client asked to skip it
 * for this flow and pick regulations directly by Regulation Section and
 * Regulation Amdt, the same two fields the legacy Cert Basis list filters on.
 * A regulation only counts as a real, attachable match once *both* a
 * section and an amdt are picked — a section alone names a whole family of
 * regulations at different amendments, not one to attach, so it renders as
 * a pending row (Amdt: "Not selected yet") instead of quietly attaching
 * every amendment under it (client instruction, 2026-09-24; see `matched`/
 * `pendingSections`). Picking neither is not a valid basis at all, so the
 * reader has to narrow by at least a section before moving on.
 *
 * The two `MultiSelect`s cascade rather than sitting independent (client
 * instruction, 2026-09-24), one direction each way:
 * - **Section narrows Amdt's own options** — nothing picked shows every
 *   amdt in the pool, one section shows only its amdts, two shows the
 *   union of both (`handleSectionsChange`/`amdtOptions`).
 * - **Picking an Amdt first auto-fills its parent section(s)** into
 *   Section, once, only from an empty Section — the amdt already
 *   identifies which section(s) it belongs to, so the reader shouldn't
 *   have to look that up and pick it separately (`handleAmdtsChange`).
 * Both fields stay `MultiSelect`, so both are searchable (past the usual
 * 5-option threshold) and multi-pick, unchanged.
 */
export function FlowStepBasis({ project, onBack, onNext }: { project: TccaProject; onBack: () => void; onNext: () => void }) {
  const regulations = useGcpStore((s) => s.regulations)
  const bases = useGcpFlowStore((s) => s.bases)
  const projectBasis = useGcpFlowStore((s) => s.projectBasis)
  const saveBasis = useGcpFlowStore((s) => s.saveBasis)
  const linkBasis = useGcpFlowStore((s) => s.linkBasis)

  const existing = bases.find((b) => b.id === projectBasis[project.id])
  const existingRegs = existing?.regulationIds
    .map((id) => regulations.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => !!r) ?? []

  const [sections, setSections] = useState<string[]>(() => [...new Set(existingRegs.map((r) => r.section))])
  const [amdts, setAmdts] = useState<string[]>(() => [...new Set(existingRegs.map((r) => r.amdt))])

  const sectionOptions = useMemo(() => [...new Set(regulations.map((r) => r.section))].sort(), [regulations])

  /* Amdt narrows to whichever section(s) are picked — nothing picked shows
     every amendment in the pool, one section shows only its own, two shows
     the union of both. Section itself is never narrowed by Amdt (that
     would ping-pong the two fields against each other); instead picking an
     Amdt first auto-fills its parent section(s) below, once. */
  const amdtOptions = useMemo(() => {
    const pool = sections.length === 0 ? regulations : regulations.filter((r) => sections.includes(r.section))
    return [...new Set(pool.map((r) => r.amdt))].sort()
  }, [regulations, sections])

  const handleSectionsChange = (next: string[]) => {
    setSections(next)
    /* Dropping a section can strand a previously-picked amdt that only
       belonged to it — prune rather than leave an invisible selection the
       narrowed dropdown no longer offers. Clearing sections back to none
       puts every amdt back in range, so nothing to prune there. */
    if (next.length > 0) {
      const stillValid = new Set(regulations.filter((r) => next.includes(r.section)).map((r) => r.amdt))
      setAmdts((prev) => prev.filter((a) => stillValid.has(a)))
    }
  }

  const handleAmdtsChange = (next: string[]) => {
    /* Picking an amdt before touching Section: the amdt already identifies
       its own section(s), so fill Section in automatically instead of
       making the reader look it up and pick it too — "the system should
       figure it out". Only fires from an empty Section, once; after that
       both fields are the reader's own to adjust freely. */
    if (sections.length === 0 && next.length > 0) {
      const parentSections = [...new Set(regulations.filter((r) => next.includes(r.amdt)).map((r) => r.section))]
      setSections(parentSections)
    }
    setAmdts(next)
  }

  /* Nothing actually attaches until an amdt is picked — a section alone
     doesn't identify one regulation, it identifies a whole family of them
     at different amendments, so showing every one of that section's rows
     the moment it's picked (the old behavior) looked like a real basis
     before the reader had decided anything. Real, attachable matches only
     exist once both a section and an amdt are picked. */
  const matched = sections.length > 0 && amdts.length > 0
    ? regulations.filter((r) => sections.includes(r.section) && amdts.includes(r.amdt))
    : []

  /* A section picked with no amdt yet — held here separately from `matched`
     so the table can still show *something* (which section is scoped, amdt
     still pending) without counting as a real, attachable row. One row per
     selected section; picking N amdts afterward replaces these with N real
     rows (one per amdt actually attached, not a cross-product). */
  const pendingSections = amdts.length === 0 ? sections : []

  const attachAndContinue = () => {
    const id = existing?.id ?? crypto.randomUUID()
    /* No Master Cert Basis identity in this flow — the basis is implicitly
       project-specific, the same case the legacy Type Certificate Number
       field left blank for. */
    saveBasis({ id, aircraftModel: project.number, tcdsNumber: '', regulationIds: matched.map((r) => r.id) })
    linkBasis(project.id, id)
    onNext()
  }

  return (
    <section className="grid gap-lg">
      <div className="grid gap-xxss">
        <h2 className="text-base font-semibold text-text-primary">Certification basis</h2>
        <p className="text-xs text-text-muted">The regulations this project's certification basis is built from.</p>
      </div>

      {/* One card, not two stacked ones — the pickers and the table they
          scope are one continuous idea, not separate sections (client
          instruction, 2026-09-24: "container in a container" read as
          boxy). `overflow-hidden` clips the table's square header corners
          to the card's own rounded ones; the `border-t` below is the only
          seam between the two halves. */}
      <div className="flex flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
        <div className="grid gap-lg px-lg py-lg">
          {/* `tablet:items-start` — without it, a CSS grid row stretches both
              columns to match whichever is taller (one field with chips
              showing under it, the other cleared and shorter) and centers the
              shorter one inside that shared height, so the two triggers no
              longer line up (client instruction, 2026-09-24). `items-start`
              keeps both anchored to the row's top regardless of which field
              currently has chips. */}
          <div className="grid items-start gap-base tablet:grid-cols-2">
            <FormField label="Regulation Section" htmlFor="flow-section" fullWidth>
              <MultiSelect
                id="flow-section"
                value={sections}
                onChange={handleSectionsChange}
                placeholder="Select regulation section…"
                emptyLabel="No sections in the rule pool yet."
                options={sectionOptions.map((s) => ({ value: s, label: s }))}
              />
            </FormField>
            <FormField label="Regulation Amdt" htmlFor="flow-amdt" fullWidth>
              <MultiSelect
                id="flow-amdt"
                value={amdts}
                onChange={handleAmdtsChange}
                placeholder="Select regulation amdt…"
                emptyLabel="No amendments in the rule pool yet."
                options={amdtOptions.map((a) => ({ value: a, label: a }))}
              />
            </FormField>
          </div>
        </div>

        {matched.length === 0 && pendingSections.length === 0 ? (
          <div className="border-t border-border-default">
            <EmptyState
              icon={<BookMarked size={48} strokeWidth={1.5} />}
              title="No regulations match yet"
              description="Pick at least a section or an amendment above to scope this basis."
            />
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-border-default">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Regulations this basis will attach to {project.number}</caption>
              <thead>
                <tr className="border-b border-border-default bg-neutral-50">
                  {['Regulation Section', 'Regulation Amdt'].map((h) => (
                    <th key={h} scope="col" className="px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingSections.map((s) => (
                  <tr key={s} className="border-b border-border-default last:border-b-0">
                    <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{s}</td>
                    <td className="whitespace-nowrap px-lg py-base text-sm text-text-muted">Not selected yet</td>
                  </tr>
                ))}
                {matched.map((r) => (
                  <tr key={r.id} className="border-b border-border-default last:border-b-0">
                    <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{r.section}</td>
                    <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{r.amdt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="secondary" leadingIcon={<ArrowLeft size={16} />} onClick={onBack}>Back</Button>
        <Button disabled={matched.length === 0} onClick={attachAndContinue}>
          Attach {matched.length || ''} regulation{matched.length === 1 ? '' : 's'} &amp; continue
        </Button>
      </div>
    </section>
  )
}
