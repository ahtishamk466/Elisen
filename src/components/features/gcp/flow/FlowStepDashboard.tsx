import { useState } from 'react'
import { ListChecks, Plus, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/patterns/EmptyState'
import { FormField } from '@/components/patterns/FormField'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Textarea } from '@/components/ui/Textarea'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { codeName, subpartParts, subsectionParts } from '@/lib/gcpDisplay'
import type { TccaProject } from '@/types/tcca'
import { GcpItemDrawer } from './GcpItemDrawer'

/**
 * Step 5 — the dashboard: one affected rule at a time, with what will be done
 * and, per discipline, who finds compliance, how, and in which document.
 *
 * The rule list sits beside the editor so the reader can see how far through
 * the plan they are without leaving the rule they are on.
 */
export function FlowStepDashboard({ project }: { project: TccaProject }) {
  const regulations = useGcpStore((s) => s.regulations)
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const planEntries = useGcpFlowStore((s) => s.planEntries)
  const items = useGcpFlowStore((s) => s.items)
  const updatePlanEntry = useGcpFlowStore((s) => s.updatePlanEntry)
  const removeItem = useGcpFlowStore((s) => s.removeItem)

  const rows = planEntries
    .filter((e) => e.projectId === project.id && e.affected)
    .map((e) => ({ entry: e, rule: regulations.find((r) => r.id === e.regulationId)! }))
    .filter((row) => !!row.rule)

  const [activeId, setActiveId] = useState(rows[0]?.entry.id ?? '')
  const [adding, setAdding] = useState(false)
  const current = rows.find((row) => row.entry.id === activeId) ?? rows[0]
  const currentItems = current ? items.filter((i) => i.planEntryId === current.entry.id) : []

  if (!current) {
    return (
      <div className="rounded-sm border border-border-default bg-neutral-25">
        <EmptyState icon={<ListChecks size={48} strokeWidth={1.5} />}
          title="No affected rules yet"
          description="Scope the basis in step 3 first; the rules marked affected arrive here." />
      </div>
    )
  }

  return (
    <section className="grid gap-lg laptop:grid-cols-[280px_minmax(0,1fr)]">
      {/* The plan's rules, and which of them still have nothing planned. */}
      <nav aria-label="Affected rules" className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
        <div className="border-b border-border-default bg-neutral-50 px-base py-base text-xs font-semibold text-text-secondary">
          Affected rules
        </div>
        <ul className="max-h-[520px] overflow-y-auto">
          {rows.map(({ entry, rule }) => {
            const has = items.some((i) => i.planEntryId === entry.id)
            const isSel = entry.id === current.entry.id
            return (
              <li key={entry.id} className="border-b border-border-default last:border-b-0">
                <button
                  type="button"
                  onClick={() => setActiveId(entry.id)}
                  aria-current={isSel ? 'true' : undefined}
                  className={`flex w-full items-center gap-sm border-l-2 px-base py-base text-left transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary
                    ${isSel ? 'border-accent bg-neutral-100' : 'border-transparent hover:bg-neutral-50'}`}
                >
                  <span className="grid min-w-0 flex-1 gap-xxss">
                    <span className={`truncate text-sm ${isSel ? 'font-semibold' : ''} text-text-primary`}>
                      {rule.section} · {rule.amdt}
                    </span>
                    <span className="truncate text-xs text-text-muted">{rule.title}</span>
                  </span>
                  <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${has ? 'bg-success' : 'bg-border-strong'}`} />
                  <span className="sr-only">{has ? 'planned' : 'not planned'}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="grid gap-lg">
        <div className="grid gap-base rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
          <div className="flex flex-wrap items-start justify-between gap-base">
            <div className="grid gap-xxss">
              <h2 className="text-sm font-semibold text-text-primary">{current.rule.section} · {current.rule.amdt}</h2>
              <p className="text-xs text-text-muted">
                {current.rule.title} · {codeName(subpartParts(current.rule.subpartCode, subparts))} · {codeName(subsectionParts(current.rule.subsectionCode, subsections))}
              </p>
            </div>
            <Checkbox
              label="Complete"
              checked={current.entry.complete}
              onChange={(e) => updatePlanEntry(current.entry.id, { complete: e.target.checked })}
            />
          </div>

          {current.rule.requirementText && (
            <p className="whitespace-pre-wrap rounded-sm border border-border-default bg-neutral-50 px-base py-base text-sm text-text-secondary">
              {current.rule.requirementText}
            </p>
          )}

          <FormField label="Method" htmlFor="flow-method" fullWidth help="What will be done to show compliance with this rule.">
            <Textarea id="flow-method" rows={4} value={current.entry.methodText}
              placeholder="e.g. Design review will demonstrate compliance..."
              onChange={(e) => updatePlanEntry(current.entry.id, { methodText: e.target.value })} />
          </FormField>
          {current.rule.defaultMocText && current.entry.methodText !== current.rule.defaultMocText && (
            <div className="flex justify-start">
              <Button variant="secondary" size="sm"
                onClick={() => updatePlanEntry(current.entry.id, { methodText: current.rule.defaultMocText })}>
                Use default text
              </Button>
            </div>
          )}

          <FormField label="Comments" htmlFor="flow-comments" fullWidth help="Deviations, or guidance material this rule is shown against.">
            <Textarea id="flow-comments" rows={3} value={current.entry.comments}
              placeholder="Optional…"
              onChange={(e) => updatePlanEntry(current.entry.id, { comments: e.target.value })} />
          </FormField>
        </div>

        <div className="grid gap-base rounded-sm border border-border-default bg-neutral-25 px-lg py-lg">
          <div className="flex flex-wrap items-end justify-between gap-base">
            <div className="grid gap-xxss">
              <h3 className="text-sm font-semibold text-text-primary">Compliance items</h3>
              <p className="text-xs text-text-muted">One per discipline: how compliance is shown, who finds it, and where it is written.</p>
            </div>
            <Button size="sm" leadingIcon={<Plus size={14} />} onClick={() => setAdding(true)}>Add item</Button>
          </div>

          {currentItems.length === 0 ? (
            <EmptyState icon={<ListChecks size={48} strokeWidth={1.5} />}
              title="Nothing planned for this rule yet"
              description="Add an item for each discipline that has work to do against it." />
          ) : (
            <div className="overflow-x-auto rounded-sm border border-border-default">
              <table className="w-full border-collapse text-left" style={{ minWidth: 640 }}>
                <caption className="sr-only">Compliance items for {current.rule.section}</caption>
                <thead>
                  <tr className="border-b border-border-default bg-neutral-50">
                    {['Discipline', 'MOC', 'Finding by', 'Document', ''].map((h) => (
                      <th key={h} scope="col" className="px-base py-base text-sm font-semibold text-text-secondary">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((i) => (
                    <tr key={i.id} className="border-b border-border-default last:border-b-0">
                      <td className="px-base py-base text-sm text-text-primary">{i.disciplineCode || '—'}</td>
                      <td className="px-base py-base text-sm text-text-primary">{i.moc || '—'}</td>
                      <td className="px-base py-base text-sm text-text-primary">{i.focCode || '—'}</td>
                      <td className="px-base py-base text-sm text-text-primary">{i.documentId || '—'}</td>
                      <td className="px-base py-base">
                        <Button variant="tertiary" size="sm" leadingIcon={<Trash2 size={14} />} onClick={() => removeItem(i.id)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Delegation decides who may be picked as "finding by", so the
              picker stays honest about what it does not have yet. */}
          <Alert tone="info" title="Disciplines, means of compliance and delegations are not loaded yet">
            The item form reads them from People &amp; Authority and Reference Lists. Those screens are still waiting on the client's data,
            so their lists are empty and an item can be saved with the free-text values the client confirms later.
          </Alert>
        </div>
      </div>

      {adding && (
        <GcpItemDrawer
          planEntryId={current.entry.id}
          ruleLabel={`${current.rule.section} · ${current.rule.amdt}`}
          onClose={() => setAdding(false)}
        />
      )}
    </section>
  )
}
