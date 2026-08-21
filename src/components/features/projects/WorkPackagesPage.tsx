import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Package, Plus, Search } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { StatCard } from '@/components/patterns/StatCard'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { WorkPackageDetail } from './WorkPackageDetail'
import { WorkPackageDrawer } from './WorkPackageDrawer'
import { ActivityDrawer } from './ActivityDrawer'
import { ActivityViewDrawer } from './ActivityViewDrawer'
import { useWorkPackagesStore } from '@/stores/workPackagesStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { activityName } from '@/lib/catalog'
import { formatHours, rollUpActivities } from '@/lib/projectHealth'
import { WP_STATUS_LABEL, wpIndex } from '@/lib/workPackageDisplay'
import { TYPE_LABEL } from '@/lib/projectDisplay'
import type { WorkPackage, WorkPackageActivity } from '@/types/workPackage'

export type PageState = 'ready' | 'loading' | 'error'

/**
 * Every work package in the business, not just one project's — the counterpart
 * to a project's Work Packages tab, for the question "what work is open across
 * everything?".
 *
 * Master–detail rather than a wide table: a package's own figures are small
 * (a handful of facts) but its activities are a table in their own right, and a table
 * inside a table row is unreadable. The rail carries enough to choose from —
 * name, project, status, size, budget health — and the detail carries the rest.
 */
export function WorkPackagesPage({ state = 'ready' }: { state?: PageState }) {
  const workPackages = useWorkPackagesStore((s) => s.workPackages)
  const wpActivities = useWorkPackagesStore((s) => s.activities)
  const { addWp, updateWp, removeWp, addActivity, updateActivity, removeActivity } = useWorkPackagesStore()
  const projects = useProjectsStore((s) => s.rows)
  const catalogActivities = useCatalogStore((s) => s.activities)
  const catalogTasks = useCatalogStore((s) => s.tasks)
  const catalogLinks = useCatalogStore((s) => s.links)
  const catalog = useMemo(
    () => ({ activities: catalogActivities, tasks: catalogTasks, links: catalogLinks }),
    [catalogActivities, catalogTasks, catalogLinks],
  )

  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [wpDrawer, setWpDrawer] = useState<{ mode: 'create' | 'edit'; wp?: WorkPackage } | null>(null)
  const [activityDrawer, setActivityDrawer] = useState<{ mode: 'create' | 'edit'; wp: WorkPackage; activity?: WorkPackageActivity } | null>(null)
  const [viewingActivity, setViewingActivity] = useState<{ wp: WorkPackage; activity: WorkPackageActivity } | null>(null)
  const [deletingWp, setDeletingWp] = useState<WorkPackage | null>(null)
  const [removingActivity, setRemovingActivity] = useState<WorkPackageActivity | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const railRef = useRef<HTMLDivElement>(null)

  const loading = state === 'loading'
  const projectOf = (id: string) => projects.find((p) => p.id === id)
  const projectLabel = (id: string) => {
    const p = projectOf(id)
    return p ? `${p.number}-${p.subNumber}` : '—'
  }
  const activitiesOf = (id: string) => wpActivities.filter((a) => a.workPackageId === id)

  /** Search spans the package, its project and the activities inside it. */
  const shown = useMemo(() => {
    const q = query.toLowerCase().trim()
    const sorted = [...workPackages].sort((a, b) =>
      projectLabel(a.projectId).localeCompare(projectLabel(b.projectId)) || a.title.localeCompare(b.title))
    if (!q) return sorted
    return sorted.filter((w) => {
      const p = projectOf(w.projectId)
      return `${w.title} ${w.description} ${projectLabel(w.projectId)} ${p?.title ?? ''}`.toLowerCase().includes(q)
        || activitiesOf(w.id).some((a) =>
          `${activityName(catalogActivities, a.activityId)} ${a.responsible}`.toLowerCase().includes(q))
    })
  }, [workPackages, wpActivities, projects, query, catalogActivities]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Selection lives in the URL so a package is linkable; when a search filters
     the selected one away, fall back to the first hit without rewriting the URL
     from under the reader. */
  const selectedId = searchParams.get('wp')
  const selected = shown.find((w) => w.id === selectedId) ?? shown[0] ?? null
  const select = (w: WorkPackage) => {
    const p = new URLSearchParams(searchParams)
    p.set('wp', w.id)
    setSearchParams(p, { replace: true })
  }

  useEffect(() => {
    railRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selected?.id])

  const stats = useMemo(() => {
    const acts = shown.flatMap((w) => activitiesOf(w.id))
    const over = shown.filter((w) => rollUpActivities(activitiesOf(w.id), w.status === 'complete').state === 'over-budget').length
    return {
      packages: shown.length,
      activities: acts.length,
      inProgress: shown.filter((w) => w.status === 'in-progress').length,
      over,
    }
  }, [shown, wpActivities]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedActivities = selected ? activitiesOf(selected.id) : []
  const removeBlocked = removingActivity ? removingActivity.actualHours > 0 : false

  if (state === 'error') {
    return (
      <AppShell title="Work Packages" activeItem="Projects" activeChild="Work Packages">
        <Alert title="We couldn't load work packages">
          Refresh the page, and if it keeps happening, contact your administrator.
        </Alert>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Work Packages"
      description="Work packages across all projects."
      activeItem="Projects"
      activeChild="Work Packages"
      fill
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 400 }}>
            <label htmlFor="wp-search" className="sr-only">Search work packages</label>
            <Input size="sm" id="wp-search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by work package, project, activity or person..." leadingIcon={<Search size={16} />} />
          </div>
          <Button size="md" leadingIcon={<Plus size={16} />} onClick={() => setWpDrawer({ mode: 'create' })}>
            Add Work Package
          </Button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        <div className="grid shrink-0 gap-lg mobile:grid-cols-2 laptop:grid-cols-4">
          <StatCard value={stats.packages} label="Work packages shown" loading={loading} />
          <StatCard value={stats.activities} label="Activities" loading={loading} />
          <StatCard value={stats.inProgress} label="In progress" loading={loading} />
          <StatCard value={stats.over} label="Over budget" loading={loading} />
        </div>

        {loading ? (
          <div className="grid min-h-0 flex-1 gap-lg laptop:grid-cols-[328px_minmax(0,1fr)]">
            <div className="grid content-start gap-sm overflow-hidden rounded-sm border border-border-default bg-neutral-25 p-lg">
              {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
            <div className="grid content-start gap-sm overflow-hidden rounded-sm border border-border-default bg-neutral-25 p-lg">
              {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<Package size={48} strokeWidth={1.5} />}
              title={query ? 'No work packages match your search' : 'No work packages yet'}
              description={query
                ? 'Try a different package, project, activity or person.'
                : 'A work package is the scope of work inside a project. Add one to start.'}
              action={query
                ? <Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>
                : <Button leadingIcon={<Plus size={16} />} onClick={() => setWpDrawer({ mode: 'create' })}>Add Work Package</Button>}
            />
          </div>
        ) : (
          /* Rail and detail both end at the fold and scroll inside themselves,
             so the list is as long as the screen instead of a fixed 640px. */
          <div className="grid min-h-0 flex-1 gap-lg laptop:grid-cols-[328px_minmax(0,1fr)]">
            <nav aria-label="Work packages" className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
              <div className="flex shrink-0 items-center gap-base border-b border-border-default bg-neutral-50 px-lg py-base">
                <span className="w-9 shrink-0 text-xs font-semibold text-text-secondary">No.</span>
                <span className="min-w-0 flex-1 text-xs font-semibold text-text-secondary">Work package</span>
                <span className="shrink-0 text-xs font-semibold text-text-secondary">Activities</span>
              </div>
              <div ref={railRef} className="relative min-h-0 flex-1 overflow-y-auto">
                <ul>
                  {shown.map((w, i) => {
                    const acts = activitiesOf(w.id)
                    const h = rollUpActivities(acts, w.status === 'complete')
                    const isSel = w.id === selected?.id
                    return (
                      <li key={w.id} className="border-b border-border-default last:border-b-0">
                        <button
                          type="button"
                          onClick={() => select(w)}
                          aria-current={isSel ? 'true' : undefined}
                          className={`flex w-full min-w-0 items-start gap-base border-l-2 px-lg py-lg text-left transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary
                            ${isSel ? 'border-accent bg-neutral-100' : 'border-transparent hover:bg-neutral-50'}`}
                        >
                          <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-accent-subtle text-xs font-bold tabular-nums text-accent">
                            {wpIndex(i)}
                          </span>
                          {/* Three stacked lines with real space between them: what it
                              is, where it sits and how it is tracking. The percentage
                              that used to sit beside the count is gone — the same fact
                              twice, and the noisier of the two. */}
                          <span className="grid min-w-0 flex-1 gap-xs">
                            <span className="block truncate text-sm font-semibold text-text-primary">{w.title}</span>
                            {/* The hours are the point of this line, so they hold
                                their width and the project name gives way. */}
                            <span className="flex min-w-0 items-baseline gap-xs text-xs text-text-secondary">
                              <span className="min-w-0 truncate">{projectOf(w.projectId)?.title ?? projectLabel(w.projectId)}</span>
                              <span aria-hidden className="shrink-0 text-text-muted">·</span>
                              <span className="shrink-0 tabular-nums">
                                {h.budget > 0
                                  ? `${formatHours(h.actual)} / ${formatHours(h.budget)}`
                                  : `${formatHours(h.actual)} / no budget`}
                              </span>
                            </span>
                            <span className="block truncate text-xs text-text-muted">
                              {projectLabel(w.projectId)} · {WP_STATUS_LABEL[w.status]}
                            </span>
                          </span>
                          <span className="flex h-9 shrink-0 items-center">
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-border-default px-xs text-xs font-semibold tabular-nums text-text-secondary">
                              {acts.length}
                            </span>
                          </span>
                          <span className="sr-only">
                            {w.title}, project {projectOf(w.projectId)?.title ?? projectLabel(w.projectId)} {projectLabel(w.projectId)}, {acts.length} activities, {WP_STATUS_LABEL[w.status]}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </nav>

            {selected && (
              <div className="relative min-h-0 overflow-y-auto pb-xxss">
              <WorkPackageDetail
                workPackage={selected}
                projectLabel={projectLabel(selected.projectId)}
                projectTitle={projectOf(selected.projectId)?.title ?? ''}
                projectType={(() => { const p = projectOf(selected.projectId); return p ? TYPE_LABEL[p.type] : '—' })()}
                projectPriority={projectOf(selected.projectId)?.priority}
                projectOpenedDate={projectOf(selected.projectId)?.openedDate ?? ''}
                activities={selectedActivities}
                catalog={catalog}
                onEditPackage={() => setWpDrawer({ mode: 'edit', wp: selected })}
                onDeletePackage={() => setDeletingWp(selected)}
                onAddActivity={() => setActivityDrawer({ mode: 'create', wp: selected })}
                onViewActivity={(a) => setViewingActivity({ wp: selected, activity: a })}
                onEditActivity={(a) => setActivityDrawer({ mode: 'edit', wp: selected, activity: a })}
                onRemoveActivity={setRemovingActivity}
              />
              </div>
            )}
          </div>
        )}
      </div>

      {wpDrawer && (
        <WorkPackageDrawer
          key={wpDrawer.wp?.id ?? 'new'}
          mode={wpDrawer.mode}
          projectId={wpDrawer.wp?.projectId ?? selected?.projectId ?? projects[0]?.id ?? ''}
          initial={wpDrawer.wp}
          onClose={() => setWpDrawer(null)}
          onSubmit={(wp) => {
            if (wpDrawer.mode === 'edit') updateWp(wp.id, wp)
            else { addWp(wp); select(wp) }
            setToast(`Work package "${wp.title}" saved.`)
          }}
        />
      )}

      {activityDrawer && (
        <ActivityDrawer
          key={activityDrawer.activity?.id ?? 'new'}
          mode={activityDrawer.mode}
          workPackage={activityDrawer.wp}
          usedActivityIds={activitiesOf(activityDrawer.wp.id).map((a) => a.activityId)}
          initial={activityDrawer.activity}
          onClose={() => setActivityDrawer(null)}
          onSubmit={(a) => {
            if (activityDrawer.mode === 'edit') updateActivity(a.id, a)
            else addActivity(a)
            setToast('Activity saved.')
          }}
        />
      )}

      {viewingActivity && (
        <ActivityViewDrawer
          key={viewingActivity.activity.id}
          activity={viewingActivity.activity}
          workPackage={viewingActivity.wp}
          catalog={catalog}
          onClose={() => setViewingActivity(null)}
          onEdit={() => setActivityDrawer({ mode: 'edit', wp: viewingActivity.wp, activity: viewingActivity.activity })}
          onRemove={() => setRemovingActivity(viewingActivity.activity)}
        />
      )}

      <ConfirmDialog
        open={!!deletingWp}
        title={`Delete "${deletingWp?.title}"?`}
        description={deletingWp
          ? `This work package and its ${activitiesOf(deletingWp.id).length} activit${activitiesOf(deletingWp.id).length === 1 ? 'y' : 'ies'} will be removed from ${projectLabel(deletingWp.projectId)}. This cannot be undone.`
          : ''}
        confirmLabel="Delete work package"
        tone="danger"
        onConfirm={() => {
          if (deletingWp) { removeWp(deletingWp.id); setToast(`Work package "${deletingWp.title}" deleted.`) }
          setDeletingWp(null)
        }}
        onCancel={() => setDeletingWp(null)}
      />

      {/* Hours already logged against an activity make it un-removable —
          deleting it would orphan those timesheet records. */}
      <ConfirmDialog
        open={!!removingActivity}
        title={removeBlocked ? 'This activity has hours logged' : 'Remove this activity?'}
        description={removingActivity
          ? removeBlocked
            ? `${activityName(catalogActivities, removingActivity.activityId)} has ${removingActivity.actualHours}h logged in Time Entry. Removing it would orphan those records.`
            : `${activityName(catalogActivities, removingActivity.activityId)} and its budget will be removed from this package.`
          : ''}
        confirmLabel={removeBlocked ? 'Close' : 'Remove activity'}
        tone={removeBlocked ? 'primary' : 'danger'}
        onConfirm={() => {
          if (!removeBlocked && removingActivity) { removeActivity(removingActivity.id); setToast('Activity removed.') }
          setRemovingActivity(null)
        }}
        onCancel={() => setRemovingActivity(null)}
      />
    </AppShell>
  )
}
