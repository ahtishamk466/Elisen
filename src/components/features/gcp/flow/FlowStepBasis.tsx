import { useMemo, useState } from 'react'
import { BookMarked } from 'lucide-react'
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
 * A regulation qualifies once it matches whichever of the two the reader has
 * picked; picking neither is not a valid basis, so the reader has to narrow
 * by at least one before moving on.
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
  const amdtOptions = useMemo(() => [...new Set(regulations.map((r) => r.amdt))].sort(), [regulations])

  const matched = sections.length === 0 && amdts.length === 0 ? [] : regulations.filter((r) =>
    (sections.length === 0 || sections.includes(r.section)) &&
    (amdts.length === 0 || amdts.includes(r.amdt)))

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
        <h2 className="text-sm font-semibold text-text-primary">Certification basis</h2>
        <p className="text-xs text-text-muted">Pick the regulations to attach, by section and amendment.</p>
      </div>

      <div className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
        <div className="grid gap-base tablet:grid-cols-2">
          <FormField label="Regulation Section" htmlFor="flow-section" fullWidth>
            <MultiSelect
              id="flow-section"
              value={sections}
              onChange={setSections}
              placeholder="Select regulation section…"
              emptyLabel="No sections in the rule pool yet."
              showChips={false}
              options={sectionOptions.map((s) => ({ value: s, label: s }))}
            />
          </FormField>
          <FormField label="Regulation Amdt" htmlFor="flow-amdt" fullWidth>
            <MultiSelect
              id="flow-amdt"
              value={amdts}
              onChange={setAmdts}
              placeholder="Select regulation amdt…"
              emptyLabel="No amendments in the rule pool yet."
              showChips={false}
              options={amdtOptions.map((a) => ({ value: a, label: a }))}
            />
          </FormField>
        </div>
      </div>

      {matched.length === 0 ? (
        <EmptyState
          icon={<BookMarked size={48} strokeWidth={1.5} />}
          title="No regulations match yet"
          description="Pick at least a section or an amendment above to scope this basis."
        />
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25">
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
              {matched.map((r) => (
                <tr key={r.id} className="border-b border-border-default last:border-b-0">
                  <td className="px-lg py-base text-sm text-text-primary">{r.section}</td>
                  <td className="px-lg py-base text-sm text-text-primary">{r.amdt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <Button disabled={matched.length === 0} onClick={attachAndContinue}>
          Attach {matched.length || ''} regulation{matched.length === 1 ? '' : 's'} &amp; continue
        </Button>
      </div>
    </section>
  )
}
