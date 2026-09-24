import { useMemo, useState } from 'react'
import { ArrowUpRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { Truncate } from '@/components/patterns/Truncate'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { sourceLabel, subpartParts, subsectionParts } from '@/lib/gcpDisplay'
import { CodeWithName } from '../CodeWithName'
import type { PlanEntry } from '@/types/gcp'
import type { TccaProject } from '@/types/tcca'

/** Fixed pixel widths, `table-fixed` — the same reason `RegulationListPage`
    sets them: without a measured width, `Truncate` has nothing to clamp
    against and a long title just grows the column instead of wrapping. */
const COLUMNS: { label: string; width: number }[] = [
  { label: '', width: 48 },
  { label: 'Subpart', width: 150 },
  { label: 'Subsection', width: 150 },
  { label: 'Section', width: 100 },
  { label: 'Amdt', width: 80 },
  { label: 'Title', width: 260 },
  { label: 'Source', width: 110 },
  { label: 'Assigned', width: 90 },
]
const TABLE_WIDTH = COLUMNS.reduce((sum, c) => sum + c.width, 0)

/**
 * Step 3 — Scope Rules: every applicable rule for this project's aircraft,
 * marked Assigned or not by this modification. Confirming writes the
 * certification plan, so only the assigned rules travel to step 4.
 *
 * Applicable here is the whole rule pool, the same way the legacy Cert Plan
 * Initialize screen scopes from everything the aircraft's type certificate
 * carries (hundreds of rows) rather than a hand-picked handful — the basis
 * built in step 2 confirms the project has rules to scope; it doesn't narrow
 * which ones show up here.
 */
export function FlowStepInitialize({ project, onBack, onNext }: { project: TccaProject; onBack: () => void; onNext: () => void }) {
  const regulations = useGcpStore((s) => s.regulations)
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const planEntries = useGcpFlowStore((s) => s.planEntries)
  const initializePlan = useGcpFlowStore((s) => s.initializePlan)
  const [query, setQuery] = useState('')

  const rules = regulations

  const q = query.trim().toLowerCase()
  const filteredRules = useMemo(() => {
    if (!q) return rules
    return rules.filter((r) => `${r.section} ${r.amdt} ${r.title} ${r.sectionRoot}`.toLowerCase().includes(q))
  }, [rules, q])

  /** Re-opening the step shows the answers already given; a rule not yet
      reviewed reads as Not Assigned, the same as the legacy screen shows
      every one of its rows as a definite Yes or No rather than a blank. */
  const [marks, setMarks] = useState<Record<string, boolean>>(() => {
    const seed: Record<string, boolean> = {}
    planEntries.filter((e) => e.projectId === project.id).forEach((e) => { seed[e.regulationId] = e.affected })
    return seed
  })

  const affected = rules.filter((r) => marks[r.id]).length

  const allChecked = filteredRules.length > 0 && filteredRules.every((r) => marks[r.id])
  const someChecked = !allChecked && filteredRules.some((r) => marks[r.id])
  const toggleAll = (checked: boolean) => {
    setMarks((m) => {
      const next = { ...m }
      filteredRules.forEach((r) => { next[r.id] = checked })
      return next
    })
  }

  const confirm = () => {
    const entries: PlanEntry[] = rules.map((r) => {
      const existing = planEntries.find((e) => e.projectId === project.id && e.regulationId === r.id)
      return existing
        ? { ...existing, affected: !!marks[r.id] }
        : {
            id: crypto.randomUUID(),
            projectId: project.id,
            regulationId: r.id,
            affected: !!marks[r.id],
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
    <section className="flex min-h-0 flex-1 flex-col gap-lg">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-base">
        <div className="grid gap-xxss">
          <h2 className="text-sm font-semibold text-text-primary">Which rules does this modification affect?</h2>
          <p className="text-xs text-text-muted">Check the rules this modification affects, then create the plan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-base">
          <p className="whitespace-nowrap text-xs text-text-muted">Total {rules.length} applicable · {affected} assigned</p>
          <div className="min-w-0" style={{ width: 280 }}>
            <label htmlFor="scope-rules-search" className="sr-only">Search rules</label>
            <Input id="scope-rules-search" size="sm" leadingIcon={<Search size={16} />} placeholder="Search by section, amdt or title..."
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-sm border border-border-default bg-neutral-25">
        <div className="h-full overflow-auto">
        <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: TABLE_WIDTH }}>
          <caption className="sr-only">Applicable rules for {project.number}</caption>
          <thead>
            <tr className="sticky top-0 border-b border-border-default bg-neutral-50">
              {COLUMNS.map((c, i) => (
                <th key={c.label || 'select'} scope="col" style={{ width: c.width }} className="px-base py-base text-sm font-semibold text-text-secondary">
                  {i === 0 ? (
                    <Checkbox
                      aria-label="Select all rules"
                      checked={allChecked}
                      indeterminate={someChecked}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  ) : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRules.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-base py-lg text-center text-sm text-text-muted">No rules match your search.</td>
              </tr>
            ) : filteredRules.map((r) => {
              const isAssigned = !!marks[r.id]
              return (
                <tr key={r.id} className="border-b border-border-default last:border-b-0">
                  <td className="px-base py-base">
                    <Checkbox
                      aria-label={`Mark ${r.section} · ${r.amdt} as affected`}
                      checked={isAssigned}
                      onChange={(e) => setMarks((m) => ({ ...m, [r.id]: e.target.checked }))}
                    />
                  </td>
                  <td className="px-base py-base"><CodeWithName {...subpartParts(r.subpartCode, subparts)} /></td>
                  <td className="px-base py-base"><CodeWithName {...subsectionParts(r.subsectionCode, subsections)} /></td>
                  <td className="px-base py-base text-sm text-text-primary">{r.section}</td>
                  <td className="px-base py-base text-sm text-text-primary">{r.amdt}</td>
                  <td className="px-base py-base text-sm text-text-primary"><Truncate lines={2}>{r.title}</Truncate></td>
                  <td className="whitespace-nowrap px-base py-base text-sm">
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-xxss rounded-sm text-sm text-accent underline underline-offset-2 transition-colors duration-fast hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
                        {sourceLabel(r.url)}
                        <ArrowUpRight size={14} aria-hidden className="shrink-0" />
                        <span className="sr-only"> for {r.section} at {r.amdt}, opens in a new tab</span>
                      </a>
                    ) : (
                      <span className="text-text-muted">No source</span>
                    )}
                  </td>
                  <td className="px-base py-base">
                    <span
                      className={`inline-flex items-center whitespace-nowrap rounded-xs px-sm py-xxss text-xs font-medium
                        ${isAssigned ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
                    >
                      {isAssigned ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <Button disabled={affected === 0} onClick={confirm}>
          Create plan from {affected} affected rule{affected === 1 ? '' : 's'}
        </Button>
      </div>
    </section>
  )
}
