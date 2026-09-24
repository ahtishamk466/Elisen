import { useMemo, useState, type CSSProperties } from 'react'
import { ArrowRight, Search, ShieldCheck } from 'lucide-react'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { Truncate } from '@/components/patterns/Truncate'
import { DateText } from '@/components/patterns/DateText'
import { Alert } from '@/components/ui/Alert'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useTccaStore } from '@/stores/tccaStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'

type SortKey = 'number' | 'description' | 'elisenProject' | 'applicable' | 'affected' | 'opened'

const COLUMNS: { label: string; sort?: SortKey; style?: CSSProperties }[] = [
  { label: 'TCCA Project #', sort: 'number', style: { width: 170 } },
  { label: 'Project Description', sort: 'description' },
  { label: 'Elisen Project', sort: 'elisenProject', style: { width: 130 } },
  { label: 'Applicable', sort: 'applicable', style: { width: 110 } },
  { label: 'Affected', sort: 'affected', style: { width: 100 } },
  { label: 'Status', style: { width: 170 } },
  { label: 'Opened', sort: 'opened', style: { width: 130 } },
  { label: 'Action', style: { width: 160 } },
]

export interface FlowStepProjectProps {
  projectId: string
  /** Always lands on step 2 — the flow moves forward one step at a time
      regardless of how far a project has already gotten; its own Back
      button is how the reader retreats. */
  onPick: (id: string) => void
  state?: 'ready' | 'loading' | 'error'
}

/** Step 1 — the TCCA project the certification work belongs to. Everything
    after this belongs to the project picked here.

    A table, not cards: the reader is disambiguating one project out of many
    by number, its linked Elisen project and how far its GCP already is —
    exactly the columns the standalone TCCA Projects list already sorts on. */
export function FlowStepProject({ projectId, onPick, state = 'ready' }: FlowStepProjectProps) {
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const projects = useProjectsStore((s) => s.rows)
  const planEntries = useGcpFlowStore((s) => s.planEntries)
  const [query, setQuery] = useState('')

  const elisenProjectLabel = (projectIds: string[]) => {
    const p = projects.find((x) => x.id === projectIds[0])
    if (!p) return projectIds.length ? '—' : 'Baseline / DAO'
    const extra = projectIds.length - 1
    return `${p.number}-${p.subNumber}${extra > 0 ? ` +${extra}` : ''}`
  }

  const rows = useMemo(() => tccaProjects.map((t) => {
    const entries = planEntries.filter((e) => e.projectId === t.id)
    const affected = entries.filter((e) => e.affected)
    const complete = affected.filter((e) => e.complete)
    return { project: t, entries, affected, complete }
  }), [tccaProjects, planEntries])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? rows.filter((r) => `${r.project.number} ${r.project.description}`.toLowerCase().includes(q))
    : rows

  const { sorted, sort, setSort } = useTableSort(filtered, {
    number: (r) => r.project.number,
    description: (r) => r.project.description,
    elisenProject: (r) => elisenProjectLabel(r.project.projectIds),
    applicable: (r) => r.entries.length,
    affected: (r) => r.affected.length,
    opened: (r) => r.project.openedDate,
  })

  const loading = state === 'loading'

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-lg">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-base">
        <div className="grid gap-xxss">
          <h2 className="text-sm font-semibold text-text-primary">Pick the TCCA project</h2>
          <p className="text-xs text-text-muted">Certification planning is done one Transport Canada project at a time.</p>
        </div>
        <div className="min-w-0" style={{ width: 280 }}>
          <label htmlFor="flow-project-search" className="sr-only">Search projects</label>
          <Input id="flow-project-search" size="sm" leadingIcon={<Search size={16} />} placeholder="Search by number or description..."
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {state === 'error' ? (
        <Alert title="We couldn't load TCCA projects">
          Something went wrong fetching the list. Refresh the page, and if it keeps happening, contact your administrator.
        </Alert>
      ) : !loading && filtered.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<ShieldCheck size={48} strokeWidth={1.5} />}
            title={query ? 'No projects match your search' : 'No TCCA projects yet'}
            description={query ? 'Try another project number or description.' : 'Open a TCCA project first, from Projects → TCCA Projects.'}
            action={query ? <Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button> : undefined}
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden rounded-sm border border-border-default bg-neutral-25">
          <div className="h-full overflow-auto">
            <table className="w-full border-collapse text-left" style={{ minWidth: 960 }}>
              <caption className="sr-only">TCCA projects available for certification planning</caption>
              <thead>
                <tr className="sticky top-0 border-b border-border-default bg-neutral-50">
                  {COLUMNS.map((c) => (
                    <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                      style={c.style} className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">
                      {c.label}
                    </SortableTh>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }, (_, i) => (
                      <tr key={i} className="border-b border-border-default last:border-b-0">
                        {COLUMNS.map((c) => <td key={c.label} className="px-lg py-base"><Skeleton className="h-4 w-full" /></td>)}
                      </tr>
                    ))
                  : sorted.map(({ project: t, entries, affected, complete }) => {
                      const started = entries.length > 0
                      const isCurrent = t.id === projectId

                      const isComplete = started && affected.length > 0 && complete.length === affected.length
                      const progress: { label: string; tone: BadgeTone; actionLabel: string } = !started
                        ? { label: 'Not Started', tone: 'neutral', actionLabel: 'Start GCP' }
                        : isComplete
                        ? { label: 'Complete', tone: 'success', actionLabel: 'View GCP' }
                        : { label: 'In Progress', tone: 'warning', actionLabel: 'Continue GCP' }

                      return (
                        <tr key={t.id}
                          onClick={() => onPick(t.id)}
                          className={`cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-neutral-50 ${isCurrent ? 'bg-accent-subtle hover:bg-accent-subtle' : ''}`}
                        >
                          <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{t.number}</td>
                          <td className="px-lg py-base text-sm text-text-primary" style={{ maxWidth: 280 }}>
                            <Truncate lines={1}>{t.description}</Truncate>
                          </td>
                          <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{elisenProjectLabel(t.projectIds)}</td>
                          <td className="px-lg py-base text-sm text-text-primary">{entries.length || '—'}</td>
                          <td className="px-lg py-base text-sm text-text-primary">{affected.length || '—'}</td>
                          <td className="px-lg py-base">
                            <div className="flex flex-col items-start gap-xxss">
                              <Badge tone={progress.tone}>{progress.label}</Badge>
                              {started && affected.length > 0 && (
                                <span className="whitespace-nowrap text-xs text-text-muted">{complete.length} / {affected.length} complete</span>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary"><DateText value={t.openedDate} /></td>
                          <td className="whitespace-nowrap px-lg py-base">
                            <Button variant="tertiary" size="sm" className="!text-accent hover:!text-accent-hover"
                              trailingIcon={<ArrowRight size={14} aria-hidden />}
                              onClick={(e) => { e.stopPropagation(); onPick(t.id) }}>
                              {progress.actionLabel}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
