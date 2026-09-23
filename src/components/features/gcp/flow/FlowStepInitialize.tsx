import { useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import type { PlanEntry } from '@/types/gcp'
import type { TccaProject } from '@/types/tcca'

/**
 * Step 3 — Initialize: every rule the basis brings, marked affected or not
 * affected by this modification. Confirming writes the certification plan, so
 * only the affected rules travel to step 4.
 */
export function FlowStepInitialize({ project, onNext }: { project: TccaProject; onNext: () => void }) {
  const regulations = useGcpStore((s) => s.regulations)
  const bases = useGcpFlowStore((s) => s.bases)
  const projectBasis = useGcpFlowStore((s) => s.projectBasis)
  const planEntries = useGcpFlowStore((s) => s.planEntries)
  const initializePlan = useGcpFlowStore((s) => s.initializePlan)

  const basis = bases.find((b) => b.id === projectBasis[project.id])
  const rules = useMemo(
    () => (basis?.regulationIds ?? []).map((id) => regulations.find((r) => r.id === id)).filter((r): r is NonNullable<typeof r> => !!r),
    [basis, regulations],
  )

  /** Re-opening the step shows the answers already given. */
  const [marks, setMarks] = useState<Record<string, boolean | undefined>>(() => {
    const seed: Record<string, boolean | undefined> = {}
    planEntries.filter((e) => e.projectId === project.id).forEach((e) => { seed[e.regulationId] = e.affected })
    return seed
  })

  const reviewed = rules.filter((r) => marks[r.id] !== undefined).length
  const affected = rules.filter((r) => marks[r.id] === true).length

  const confirm = () => {
    const entries: PlanEntry[] = rules.map((r) => {
      const existing = planEntries.find((e) => e.projectId === project.id && e.regulationId === r.id)
      return existing
        ? { ...existing, affected: marks[r.id] === true }
        : {
            id: crypto.randomUUID(),
            projectId: project.id,
            regulationId: r.id,
            affected: marks[r.id] === true,
            /* The rule's own Default Moc Text is what a project starts from. */
            methodText: r.defaultMocText,
            comments: '',
            ddsType: '',
            ddsText: '',
            complete: false,
          }
    })
    initializePlan(project.id, entries)
    onNext()
  }

  return (
    <section className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div className="grid gap-xxss">
          <h2 className="text-sm font-semibold text-text-primary">Which rules does this modification affect?</h2>
          <p className="text-xs text-text-muted">Every rule in the basis, at the amendment the basis sets.</p>
        </div>
        <p className="text-xs text-text-muted">{reviewed} of {rules.length} reviewed · {affected} affected</p>
      </div>

      <div className="overflow-x-auto rounded-sm border border-border-default">
        <table className="w-full border-collapse text-left" style={{ minWidth: 720 }}>
          <caption className="sr-only">Rules in the basis</caption>
          <thead>
            <tr className="border-b border-border-default bg-neutral-50">
              {['Section', 'Amdt', 'Title', 'Affected?'].map((h) => (
                <th key={h} scope="col" className="px-base py-base text-sm font-semibold text-text-secondary">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-b border-border-default last:border-b-0">
                <td className="px-base py-base text-sm text-text-primary">{r.section}</td>
                <td className="px-base py-base text-sm text-text-primary">{r.amdt}</td>
                <td className="px-base py-base text-sm text-text-primary">
                  {r.title}
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="ml-sm inline-flex items-center gap-xxss rounded-sm text-sm text-accent underline underline-offset-2">
                      Rule text
                      <ExternalLink size={13} aria-hidden />
                    </a>
                  )}
                </td>
                <td className="px-base py-base">
                  <span className="inline-flex overflow-hidden rounded-sm border border-border-strong">
                    {([['Yes', true], ['No', false]] as const).map(([label, value]) => (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={marks[r.id] === value}
                        onClick={() => setMarks((m) => ({ ...m, [r.id]: value }))}
                        className={`px-base py-xs text-xs transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary
                          ${marks[r.id] === value ? 'bg-accent-subtle font-semibold text-accent' : 'text-text-muted hover:text-text-primary'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button disabled={affected === 0} onClick={confirm}>
          Create plan from {affected} affected rule{affected === 1 ? '' : 's'}
        </Button>
      </div>
    </section>
  )
}
