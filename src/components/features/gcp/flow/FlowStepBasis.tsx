import { useState } from 'react'
import { BookMarked, Plus, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/patterns/EmptyState'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { codeName, subpartParts, subsectionParts } from '@/lib/gcpDisplay'
import type { TccaProject } from '@/types/tcca'

/**
 * Step 2 — the certification basis, as one screen.
 *
 * The legacy system split this three ways: `Master Cert Basis` held the
 * aircraft and its type certificate, `Cert Basis` held the regulations
 * allocated to it, and `Master Cert Basis - Associate` linked the result to a
 * project. All three happen here, on the project already picked in step 1.
 */
export function FlowStepBasis({ project, onNext }: { project: TccaProject; onNext: () => void }) {
  const regulations = useGcpStore((s) => s.regulations)
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const bases = useGcpFlowStore((s) => s.bases)
  const projectBasis = useGcpFlowStore((s) => s.projectBasis)
  const saveBasis = useGcpFlowStore((s) => s.saveBasis)
  const linkBasis = useGcpFlowStore((s) => s.linkBasis)

  const existing = bases.find((b) => b.id === projectBasis[project.id])
  const [aircraftModel, setAircraftModel] = useState(existing?.aircraftModel ?? '')
  const [tcdsNumber, setTcdsNumber] = useState(existing?.tcdsNumber ?? '')
  const [regulationIds, setRegulationIds] = useState<string[]>(existing?.regulationIds ?? [])
  const [error, setError] = useState<string>()

  const chosen = regulationIds
    .map((id) => regulations.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => !!r)

  const save = (then?: () => void) => {
    if (!aircraftModel.trim()) { setError('Aircraft model is required.'); return }
    const id = existing?.id ?? crypto.randomUUID()
    saveBasis({ id, aircraftModel: aircraftModel.trim(), tcdsNumber: tcdsNumber.trim(), regulationIds })
    linkBasis(project.id, id)
    then?.()
  }

  return (
    <section className="grid gap-lg">
      <div className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
        <div className="grid gap-xxss">
          <h2 className="text-sm font-semibold text-text-primary">Certification basis</h2>
          <p className="text-xs text-text-muted">
            The aircraft this project changes, and the type certificate its rules are read from.
          </p>
        </div>
        <div className="grid gap-base tablet:grid-cols-2">
          <FormField label="Aircraft Model" htmlFor="flow-model" required error={error} fullWidth>
            <Input id="flow-model" value={aircraftModel} error={!!error} placeholder="e.g. CL-650"
              onChange={(e) => { setAircraftModel(e.target.value); setError(undefined) }} />
          </FormField>
          <FormField label="Type Certificate Number" htmlFor="flow-tcds" fullWidth
            help="Leave blank for a project-specific basis, which has no type certificate.">
            <Input id="flow-tcds" value={tcdsNumber} placeholder="e.g. A-054"
              onChange={(e) => setTcdsNumber(e.target.value)} />
          </FormField>
        </div>
      </div>

      <div className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
        <div className="flex flex-wrap items-end justify-between gap-base">
          <div className="grid gap-xxss">
            <h2 className="text-sm font-semibold text-text-primary">Regulations in this basis</h2>
            <p className="text-xs text-text-muted">
              Each rule carries its own amendment, title, subpart and subsection.
            </p>
          </div>
        </div>
        <FormField label="Regulations" htmlFor="flow-regs" fullWidth
          help={`${regulations.length} in the rule pool. Search by section, amendment or title.`}>
          <MultiSelect
            id="flow-regs"
            value={regulationIds}
            onChange={setRegulationIds}
            placeholder="Select regulations…"
            emptyLabel="No regulations in the pool yet."
            showChips={false}
            options={regulations.map((r) => ({
              value: r.id,
              label: `${r.section} · ${r.amdt}`,
              hint: r.title,
            }))}
          />
        </FormField>

        {chosen.length === 0 ? (
          <EmptyState
            icon={<BookMarked size={48} strokeWidth={1.5} />}
            title="No regulations in this basis yet"
            description="Pick the rules this aircraft's type certificate brings, then scope them in the next step."
          />
        ) : (
          <div className="overflow-x-auto rounded-sm border border-border-default">
            <table className="w-full border-collapse text-left" style={{ minWidth: 760 }}>
              <caption className="sr-only">Regulations in this basis</caption>
              <thead>
                <tr className="border-b border-border-default bg-neutral-50">
                  {['Section', 'Amdt', 'Title', 'Subpart', 'Subsection', ''].map((h) => (
                    <th key={h} scope="col" className="px-base py-base text-sm font-semibold text-text-secondary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chosen.map((r) => (
                  <tr key={r.id} className="border-b border-border-default last:border-b-0">
                    <td className="px-base py-base text-sm text-text-primary">{r.section}</td>
                    <td className="px-base py-base text-sm text-text-primary">{r.amdt}</td>
                    <td className="px-base py-base text-sm text-text-primary">{r.title}</td>
                    <td className="px-base py-base text-sm text-text-primary">{codeName(subpartParts(r.subpartCode, subparts))}</td>
                    <td className="px-base py-base text-sm text-text-primary">{codeName(subsectionParts(r.subsectionCode, subsections))}</td>
                    <td className="px-base py-base">
                      <Button variant="tertiary" size="sm" leadingIcon={<Trash2 size={14} />}
                        onClick={() => setRegulationIds((ids) => ids.filter((id) => id !== r.id))}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-sm">
        <Button variant="secondary" leadingIcon={<Plus size={16} />} onClick={() => save()}>Save basis</Button>
        <Button disabled={chosen.length === 0} onClick={() => save(onNext)}>
          Save &amp; scope rules
        </Button>
      </div>
    </section>
  )
}
