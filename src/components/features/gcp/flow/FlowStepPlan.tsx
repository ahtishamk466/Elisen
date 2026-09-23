import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { codeName, subpartParts, subsectionParts } from '@/lib/gcpDisplay'
import type { TccaProject } from '@/types/tcca'

/**
 * Step 4 — the certification plan: the rules scoped as affected, and whether
 * each one has been planned yet. Planning itself happens in step 5, which is
 * what the legacy Cert Plan Dashboard did.
 */
export function FlowStepPlan({ project, onNext }: { project: TccaProject; onNext: () => void }) {
  const regulations = useGcpStore((s) => s.regulations)
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const planEntries = useGcpFlowStore((s) => s.planEntries)
  const items = useGcpFlowStore((s) => s.items)

  const rows = planEntries
    .filter((e) => e.projectId === project.id && e.affected)
    .map((e) => ({ entry: e, rule: regulations.find((r) => r.id === e.regulationId) }))
    .filter((row): row is { entry: typeof planEntries[number]; rule: NonNullable<typeof row.rule> } => !!row.rule)

  const planned = rows.filter((row) => items.some((i) => i.planEntryId === row.entry.id)).length

  return (
    <section className="grid gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
      <div className="flex flex-wrap items-end justify-between gap-base">
        <div className="grid gap-xxss">
          <h2 className="text-sm font-semibold text-text-primary">Certification plan</h2>
          <p className="text-xs text-text-muted">The affected rules for this project, in the order they print.</p>
        </div>
        <p className="text-xs text-text-muted">{planned} of {rows.length} planned</p>
      </div>

      <div className="overflow-x-auto rounded-sm border border-border-default">
        <table className="w-full border-collapse text-left" style={{ minWidth: 860 }}>
          <caption className="sr-only">Affected rules</caption>
          <thead>
            <tr className="border-b border-border-default bg-neutral-50">
              {['Section', 'Amdt', 'Title', 'Subpart', 'Subsection', 'Planned'].map((h) => (
                <th key={h} scope="col" className="px-base py-base text-sm font-semibold text-text-secondary">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ entry, rule }) => {
              const has = items.some((i) => i.planEntryId === entry.id)
              return (
                <tr key={entry.id} className="border-b border-border-default last:border-b-0">
                  <td className="px-base py-base text-sm text-text-primary">{rule.section}</td>
                  <td className="px-base py-base text-sm text-text-primary">{rule.amdt}</td>
                  <td className="px-base py-base text-sm text-text-primary">{rule.title}</td>
                  <td className="px-base py-base text-sm text-text-primary">{codeName(subpartParts(rule.subpartCode, subparts))}</td>
                  <td className="px-base py-base text-sm text-text-primary">{codeName(subsectionParts(rule.subsectionCode, subsections))}</td>
                  <td className="px-base py-base">
                    <Badge tone={has ? 'success' : 'warning'}>{has ? 'Planned' : 'Not planned'}</Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext}>Plan compliance</Button>
      </div>
    </section>
  )
}
