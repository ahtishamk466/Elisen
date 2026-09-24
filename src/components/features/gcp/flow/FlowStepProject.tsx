import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Copy, Eye, Pencil, ShieldCheck, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { StatCard } from '@/components/patterns/StatCard'
import { useTableSort } from '@/components/patterns/useTableSort'
import { useSyncedScroll } from '@/components/patterns/useSyncedScroll'
import { Truncate } from '@/components/patterns/Truncate'
import { DateText } from '@/components/patterns/DateText'
import { Alert } from '@/components/ui/Alert'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useTccaStore } from '@/stores/tccaStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { TccaProjectDrawer } from '@/components/features/tcca/TccaProjectDrawer'
import type { TccaProject } from '@/types/tcca'

type SortKey = 'number' | 'elisenProject' | 'regulation' | 'amdt' | 'regTitle' | 'discipline'
  | 'moc' | 'foc' | 'deliverable' | 'applicable' | 'affected' | 'opened' | 'status'

/* TCCA Project # and its description merged into one column, number on top
   and description underneath — client instruction, 2026-09-24, and every
   column tightened to what its own content actually needs rather than the
   old, wider guesses. Regulation/Amdt/Reg Title/Discipline/MOC/FOC/
   Deliverable #/Status all sort too (client instruction, 2026-09-24 — every
   column gets the same sort affordance, not just some) — each on the same
   `primaryRule`/`primaryItem` value its cell actually displays (see below),
   consistent with a reader sorting by what they can see, not a hidden field. */
const COLUMNS: { label: string; sort?: SortKey; style?: CSSProperties }[] = [
  { label: 'TCCA Project', sort: 'number', style: { width: 240 } },
  { label: 'Elisen Project #', sort: 'elisenProject', style: { width: 170 } },
  { label: 'Regulation', sort: 'regulation', style: { width: 140 } },
  { label: 'Amdt', sort: 'amdt', style: { width: 100 } },
  { label: 'Reg Title', sort: 'regTitle', style: { width: 200 } },
  { label: 'Discipline', sort: 'discipline', style: { width: 120 } },
  { label: 'MOC', sort: 'moc', style: { width: 90 } },
  { label: 'FOC', sort: 'foc', style: { width: 90 } },
  { label: 'Deliverable #', sort: 'deliverable', style: { width: 190 } },
  { label: 'Applicable', sort: 'applicable', style: { width: 110 } },
  { label: 'Affected', sort: 'affected', style: { width: 100 } },
  { label: 'Opened', sort: 'opened', style: { width: 120 } },
  { label: 'Status', sort: 'status', style: { width: 170 } },
  { label: 'Action', style: { width: 72 } },
]
/* Every column now has an explicit width — `table-fixed` (needed so the
   frozen header and scrolling body's columns stay pixel-aligned) collapsed
   the one column that didn't to a few px, since the others' widths already
   summed past the table's old `minWidth`. Real total, not a guess. */
const TABLE_WIDTH = COLUMNS.reduce((sum, c) => sum + (c.style?.width as number), 0)

export interface FlowStepProjectProps {
  projectId: string
  /** Always lands on step 2 — the flow moves forward one step at a time
      regardless of how far a project has already gotten; its own Back
      button is how the reader retreats. */
  onPick: (id: string) => void
  state?: 'ready' | 'loading' | 'error'
  /** Owned by `GcpFlowPage` now, not this component — the search box moved
      up into the page header, alongside the one heading the page shows for
      this step (client instruction, 2026-09-24), so this component only
      reads the query, it doesn't render the box. */
  query: string
  onQueryChange: (query: string) => void
}

/** Step 1 — the TCCA project the certification work belongs to. Everything
    after this belongs to the project picked here.

    A table, not cards: the reader is disambiguating one project out of many
    by number, its linked Elisen project and how far its GCP already is —
    exactly the columns the standalone TCCA Projects list already sorts on. */
export function FlowStepProject({ projectId, onPick, state = 'ready', query, onQueryChange }: FlowStepProjectProps) {
  const navigate = useNavigate()
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const duplicateTcca = useTccaStore((s) => s.duplicateTcca)
  const updateTcca = useTccaStore((s) => s.updateTcca)
  const removeTcca = useTccaStore((s) => s.removeTcca)
  const projects = useProjectsStore((s) => s.rows)
  const regulations = useGcpStore((s) => s.regulations)
  const planEntries = useGcpFlowStore((s) => s.planEntries)
  const items = useGcpFlowStore((s) => s.items)

  const [editingProject, setEditingProject] = useState<TccaProject | null>(null)
  const [deletingProject, setDeletingProject] = useState<TccaProject | null>(null)

  const elisenProjectLabel = (projectIds: string[]) => {
    const p = projects.find((x) => x.id === projectIds[0])
    if (!p) return projectIds.length ? '—' : 'Baseline / DAO'
    const extra = projectIds.length - 1
    return `${p.number}-${p.subNumber}${extra > 0 ? ` +${extra}` : ''}`
  }

  /* One project row can have many applicable rules and many GCP data items
     — Regulation/Amdt/Reg Title and Discipline/MOC/FOC/Deliverable # show
     the first of each (own hover title names how many more), the same
     "one row per project" shape as Applicable/Affected/Elisen Project # #,
     rather than exploding this table into one row per rule (client
     instruction, 2026-09-24 — confirmed keeping one row per project). */
  const rows = useMemo(() => tccaProjects.map((t) => {
    const entries = planEntries.filter((e) => e.projectId === t.id)
    const affected = entries.filter((e) => e.affected)
    const complete = affected.filter((e) => e.complete)
    const primaryRule = entries.length > 0 ? regulations.find((r) => r.id === entries[0].regulationId) : undefined
    const entryIds = new Set(entries.map((e) => e.id))
    const primaryItem = items.find((i) => entryIds.has(i.planEntryId))
    return { project: t, entries, affected, complete, primaryRule, primaryItem }
  }), [tccaProjects, planEntries, regulations, items])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? rows.filter((r) => `${r.project.number} ${r.project.description}`.toLowerCase().includes(q))
    : rows

  /* Same three buckets the Status badge sorts each row into below — stated
     up top the same way Projects List leads with its own health counts
     (client instruction, 2026-09-24, matching that page's stat cards). */
  const statusOf = (r: (typeof filtered)[number]) => {
    if (r.entries.length === 0) return 'not-started'
    return r.affected.length > 0 && r.complete.length === r.affected.length ? 'complete' : 'in-progress'
  }
  const stats = [
    { value: filtered.length, label: 'Projects shown' },
    { value: filtered.filter((r) => statusOf(r) === 'not-started').length, label: 'Not Started' },
    { value: filtered.filter((r) => statusOf(r) === 'in-progress').length, label: 'In Progress' },
    { value: filtered.filter((r) => statusOf(r) === 'complete').length, label: 'Complete' },
  ]

  const { sorted, sort, setSort } = useTableSort(filtered, {
    number: (r) => r.project.number,
    elisenProject: (r) => elisenProjectLabel(r.project.projectIds),
    regulation: (r) => r.primaryRule?.section,
    amdt: (r) => r.primaryRule?.amdt,
    regTitle: (r) => r.primaryRule?.title,
    discipline: (r) => r.primaryItem?.daoSpecialtyCode,
    moc: (r) => r.primaryItem?.mocCode,
    foc: (r) => r.primaryItem?.focCode,
    deliverable: (r) => r.primaryItem?.deliverableId,
    applicable: (r) => r.entries.length,
    affected: (r) => r.affected.length,
    opened: (r) => r.project.openedDate,
    status: (r) => statusOf(r),
  })

  const loading = state === 'loading'
  const { headerRef, onBodyScroll } = useSyncedScroll()

  return (
    <>
    <section className="flex min-h-0 flex-1 flex-col gap-lg">
      {/* Same stat-card row Projects List leads with — client instruction,
          2026-09-24. `shrink-0` so it never eats into the table's own
          `min-h-0 flex-1` scroll area below it. */}
      <div className="grid shrink-0 gap-lg mobile:grid-cols-2 laptop:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} value={s.value} label={s.label} loading={loading} />
        ))}
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
            action={query ? <Button variant="secondary" onClick={() => onQueryChange('')}>Clear search</Button> : undefined}
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
          {/* Frozen header, own table, full width — a scrollbar never runs
              alongside a table's header (docs/COMPONENTS.md). `headerRef` +
              `onBodyScroll` keep it in horizontal sync with the body below,
              since this table is wide enough to actually need that now. */}
          <div ref={headerRef} className="shrink-0 overflow-x-hidden overflow-y-scroll scrollbar-none">
            <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: TABLE_WIDTH }}>
              <colgroup>
                {COLUMNS.slice(0, -1).map((c) => <col key={c.label} style={c.style} />)}
                {/* Soaks up whatever's left past `TABLE_WIDTH` on a wide
                    screen instead of leaving it as dead space (client
                    instruction, 2026-09-24) — sits *before* Action, not
                    after: Action is `sticky right-0`, pinned to the
                    scrollport's own right edge regardless of where it falls
                    in source order, so a trailing spacer placed after it
                    would just overlap it. Placed before, Action's natural
                    (unstuck) position already sits flush right once the
                    spacer's taken the slack, so there's nothing to
                    reconcile. */}
                <col />
                <col style={COLUMNS[COLUMNS.length - 1].style} />
              </colgroup>
              <thead>
                <tr className="border-b border-border-default bg-neutral-50">
                  {COLUMNS.slice(0, -1).map((c) => (
                    <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                      className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">
                      {c.label}
                    </SortableTh>
                  ))}
                  <th aria-hidden className="bg-neutral-50" />
                  {/* Action stays visible while the rest of a wide row scrolls
                      underneath it (client instruction, 2026-09-24) — safe to
                      pin now that the header and body scroll in sync
                      (`useSyncedScroll`); before that fix, a sticky column
                      here would have drifted out of alignment on scroll. */}
                  <SortableTh className="sticky right-0 z-sticky whitespace-nowrap border-b border-b-neutral-300 border-l border-l-border-default bg-neutral-50 px-lg py-base text-sm font-semibold text-text-secondary">
                    {/* `shadow-sticky` goes on this overlay, not the `<th>`
                        itself — a `box-shadow` set directly on a table cell
                        never paints under `border-collapse` (verified live:
                        it computes correctly but simply doesn't render); a
                        plain positioned `<div>` isn't subject to that and
                        paints it correctly. */}
                    <span aria-hidden className="pointer-events-none absolute inset-0 shadow-sticky" />
                    {COLUMNS[COLUMNS.length - 1].label}
                  </SortableTh>
                </tr>
              </thead>
            </table>
          </div>
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-scroll scrollbar-none" onScroll={onBodyScroll}>
            <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: TABLE_WIDTH }}>
              <caption className="sr-only">TCCA projects available for certification planning</caption>
              <colgroup>
                {COLUMNS.slice(0, -1).map((c) => <col key={c.label} style={c.style} />)}
                <col />
                <col style={COLUMNS[COLUMNS.length - 1].style} />
              </colgroup>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }, (_, i) => (
                      <tr key={i} className="border-b border-border-default last:border-b-0">
                        {COLUMNS.slice(0, -1).map((c) => <td key={c.label} className="px-lg py-base"><Skeleton className="h-4 w-full" /></td>)}
                        <td aria-hidden />
                        <td className="sticky right-0 z-sticky border-l border-border-default bg-neutral-25 px-lg py-base">
                          <span aria-hidden className="pointer-events-none absolute inset-0 shadow-sticky" />
                          <Skeleton className="h-4 w-full" />
                        </td>
                      </tr>
                    ))
                  : sorted.map(({ project: t, entries, affected, complete, primaryRule, primaryItem }) => {
                      const started = entries.length > 0
                      const isCurrent = t.id === projectId
                      const moreRules = entries.length > 1 ? `+${entries.length - 1} more regulation${entries.length - 1 === 1 ? '' : 's'}` : undefined

                      const isComplete = started && affected.length > 0 && complete.length === affected.length
                      const progress: { label: string; tone: BadgeTone; actionLabel: string } = !started
                        ? { label: 'Not Started', tone: 'neutral', actionLabel: 'Start GCP' }
                        : isComplete
                        ? { label: 'Complete', tone: 'success', actionLabel: 'View GCP' }
                        : { label: 'In Progress', tone: 'warning', actionLabel: 'Continue GCP' }

                      return (
                        <tr key={t.id}
                          onClick={() => onPick(t.id)}
                          className={`group cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-neutral-50 ${isCurrent ? 'bg-accent-subtle hover:bg-accent-subtle' : ''}`}
                        >
                          <td className="px-lg py-base" style={{ maxWidth: 240 }}>
                            <div className="flex items-center gap-xs">
                              <p className="truncate text-sm text-text-primary">{t.number}</p>
                              {t.isCopy && <Badge tone="info">Copy</Badge>}
                            </div>
                            <p className="text-xs text-text-muted"><Truncate lines={1}>{t.description}</Truncate></p>
                          </td>
                          <td className="truncate px-lg py-base text-sm text-text-primary" title={elisenProjectLabel(t.projectIds)}>{elisenProjectLabel(t.projectIds)}</td>
                          <td className="truncate px-lg py-base text-sm text-text-primary" title={moreRules ? `${primaryRule?.section} · ${moreRules}` : primaryRule?.section}>{primaryRule?.section ?? '—'}</td>
                          <td className="truncate px-lg py-base text-sm text-text-primary" title={moreRules ? `${primaryRule?.amdt} · ${moreRules}` : primaryRule?.amdt}>{primaryRule?.amdt ?? '—'}</td>
                          <td className="px-lg py-base text-sm text-text-primary" title={moreRules}>
                            {primaryRule ? <Truncate lines={1}>{primaryRule.title}</Truncate> : '—'}
                          </td>
                          <td className="truncate px-lg py-base text-sm text-text-primary" title={primaryItem?.daoSpecialtyCode}>{primaryItem?.daoSpecialtyCode || '—'}</td>
                          <td className="truncate px-lg py-base text-sm text-text-primary" title={primaryItem?.mocCode}>{primaryItem?.mocCode || '—'}</td>
                          <td className="truncate px-lg py-base text-sm text-text-primary" title={primaryItem?.focCode}>{primaryItem?.focCode || '—'}</td>
                          <td className="truncate px-lg py-base text-sm text-text-primary" title={primaryItem?.deliverableId}>{primaryItem?.deliverableId || '—'}</td>
                          <td className="px-lg py-base text-sm text-text-primary">{entries.length || '—'}</td>
                          <td className="px-lg py-base text-sm text-text-primary">{affected.length || '—'}</td>
                          <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary"><DateText value={t.openedDate} /></td>
                          <td className="px-lg py-base">
                            <div className="flex flex-col items-start gap-xxss">
                              <Badge tone={progress.tone}>{progress.label}</Badge>
                              {started && affected.length > 0 && (
                                <span className="whitespace-nowrap text-xs text-text-muted">{complete.length} / {affected.length} complete</span>
                              )}
                            </div>
                          </td>
                          <td aria-hidden />
                          <td className={`sticky right-0 z-sticky whitespace-nowrap border-l border-border-default px-lg py-base transition-colors duration-fast
                            ${isCurrent ? 'bg-accent-subtle' : 'bg-neutral-25 group-hover:bg-neutral-50'}`}
                            onClick={(e) => e.stopPropagation()}>
                            <span aria-hidden className="pointer-events-none absolute inset-0 shadow-sticky" />
                            <ActionsMenu
                              ariaLabel={`Actions for ${t.number}`}
                              items={[
                                { label: progress.actionLabel, icon: <ArrowRight size={16} />, onSelect: () => onPick(t.id) },
                                { label: 'View', icon: <Eye size={16} />, onSelect: () => navigate(`/tcca-projects/${t.id}`) },
                                { label: 'Duplicate', icon: <Copy size={16} />, onSelect: () => duplicateTcca(t.id) },
                                { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setEditingProject(t) },
                                { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeletingProject(t), tone: 'danger' },
                              ]}
                            />
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

    {editingProject && (
      <TccaProjectDrawer open mode="edit" initial={editingProject} onClose={() => setEditingProject(null)}
        onSubmit={(t) => updateTcca(editingProject.id, t)} />
    )}

    <ConfirmDialog
      open={!!deletingProject}
      title="Delete this TCCA project?"
      description={deletingProject ? `"${deletingProject.number}" and its checklist and document tracking will be permanently removed.` : ''}
      confirmLabel="Delete TCCA project"
      tone="danger"
      onConfirm={() => { if (deletingProject) removeTcca(deletingProject.id); setDeletingProject(null) }}
      onCancel={() => setDeletingProject(null)}
    />
    </>
  )
}
