import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, ListChecks, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { TableTabs } from '@/components/patterns/TableTabs'
import { Truncate } from '@/components/patterns/Truncate'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { ActivityCatalogDrawer } from './ActivityCatalogDrawer'
import { TaskDrawer } from './TaskDrawer'
import { useCatalogStore } from '@/stores/catalogStore'
import { useWorkPackagesStore } from '@/stores/workPackagesStore'
import { useTimesheetStore } from '@/stores/timesheetStore'
import { activitiesForTask, isMisconfigured, tasksForActivity, type Catalog } from '@/lib/catalog'
import type { Activity, Task } from '@/types/catalog'

export type PageState = 'ready' | 'loading' | 'error'

const ACTIVITY_HEADERS = ['Activity', 'Description', 'Tasks', 'Task Required', 'Default', 'Type', 'Active', 'Actions']
const TASK_HEADERS = ['Task', 'Activities', 'Used', 'Active', 'Actions']

type Tab = 'activities' | 'tasks'

/** Yes/no as a badge — the client's list uses a tick or a cross per column. */
function YesNo({ on, yes = 'Yes', no = 'No' }: { on: boolean; yes?: string; no?: string }) {
  return <Badge tone={on ? 'success' : 'neutral'}>{on ? yes : no}</Badge>
}

/**
 * Reference Data → Activities & Tasks, as two tabs over one workspace — the
 * same shape as Aircraft / Serial Numbers, and for the same reason: you move
 * between the two constantly while setting the catalog up.
 *
 * The client's system spends three screens on this (Activities, Activity Tasks,
 * and a dual-list Create). It is really **two records and a many-to-many link**,
 * and the link is editable from either side, so an association made on an
 * activity shows on the task and the other way round.
 *
 * Activities are created here and only *selected* inside a project, which is the
 * same create-globally / link-locally rule already used for Approvals,
 * Documents, TCCA and Aircraft.
 */
export function ActivityCatalogPage({ state = 'ready' }: { state?: PageState }) {
  const activities = useCatalogStore((s) => s.activities)
  const tasks = useCatalogStore((s) => s.tasks)
  const links = useCatalogStore((s) => s.links)
  const saveActivity = useCatalogStore((s) => s.saveActivity)
  const removeActivity = useCatalogStore((s) => s.removeActivity)
  const saveTask = useCatalogStore((s) => s.saveTask)
  const removeTask = useCatalogStore((s) => s.removeTask)
  const setActivityActive = useCatalogStore((s) => s.setActivityActive)
  const setTaskActive = useCatalogStore((s) => s.setTaskActive)

  const wpActivities = useWorkPackagesStore((s) => s.activities)
  const timesheet = useTimesheetStore((s) => s.rows)

  const catalog: Catalog = useMemo(() => ({ activities, tasks, links }), [activities, tasks, links])

  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = searchParams.get('tab') === 'tasks' ? 'tasks' : 'activities'
  const setTab = (next: Tab) => {
    const p = new URLSearchParams(searchParams)
    if (next === 'activities') p.delete('tab')
    else p.set('tab', next)
    setSearchParams(p, { replace: true })
  }

  const [query, setQuery] = useState('')
  const [activityDrawer, setActivityDrawer] = useState<{ mode: 'create' | 'edit' | 'view'; activity?: Activity } | null>(null)
  const [taskDrawer, setTaskDrawer] = useState<{ mode: 'create' | 'edit' | 'view'; task?: Task; presetActivityId?: string } | null>(null)
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const loading = state === 'loading'

  /** Nothing in the catalog may be deleted out from under a record that points
      at it — the counts drive both the warning and the block. */
  const activityUsage = (id: string) => ({
    assignments: wpActivities.filter((a) => a.activityId === id).length,
    entries: timesheet.filter((t) => t.activityId === id).length,
  })
  const taskUsage = (name: string) => timesheet.filter((t) => t.task === name).length

  const q = query.toLowerCase().trim()
  const shownActivities = useMemo(() => activities.filter((a) =>
    !q || `${a.name} ${a.description}`.toLowerCase().includes(q)
      || tasksForActivity(catalog, a.id).some((t) => t.name.toLowerCase().includes(q)),
  ).sort((a, b) => a.name.localeCompare(b.name)), [activities, catalog, q])

  const shownTasks = useMemo(() => tasks.filter((t) =>
    !q || t.name.toLowerCase().includes(q)
      || activitiesForTask(catalog, t.id).some((a) => a.name.toLowerCase().includes(q)),
  ).sort((a, b) => a.name.localeCompare(b.name)), [tasks, catalog, q])

  const rowCount = tab === 'activities' ? shownActivities.length : shownTasks.length
  const { visibleCount, loadingMore, loadMore, reset: resetVisible } = useInfiniteReveal(rowCount, 25)

  /** Activities that demand a task but have none — unfillable at Time Entry. */
  const brokenCount = activities.filter((a) => isMisconfigured(catalog, a)).length

  const tabs = (
    <TableTabs
      ariaLabel="Activity catalog"
      activeKey={tab}
      onChange={(k) => { setTab(k as Tab); resetVisible() }}
      tabs={[
        { key: 'activities', label: 'Activities', count: activities.length },
        { key: 'tasks', label: 'Tasks', count: tasks.length },
      ]}
    />
  )

  /* A delete that would orphan live records is refused — but the dialog offers
     the remedy rather than dead-ending, so the button retires it instead. */
  const confirmDeleteActivity = () => {
    if (!deletingActivity) return
    const { assignments, entries } = activityUsage(deletingActivity.id)
    if (assignments + entries > 0) {
      setActivityActive(deletingActivity.id, false)
      setToast(`“${deletingActivity.name}” retired. Existing records keep it; it can no longer be picked.`)
    } else {
      removeActivity(deletingActivity.id)
      setToast(`Activity “${deletingActivity.name}” deleted.`)
    }
    setDeletingActivity(null)
  }
  const confirmDeleteTask = () => {
    if (!deletingTask) return
    if (taskUsage(deletingTask.name) > 0) {
      setTaskActive(deletingTask.id, false)
      setToast(`“${deletingTask.name}” retired. Logged hours keep it; it can no longer be picked.`)
    } else {
      removeTask(deletingTask.id)
      setToast(`Task “${deletingTask.name}” deleted.`)
    }
    setDeletingTask(null)
  }

  if (state === 'error') {
    return (
      <AppShell title="Activities & Tasks" activeItem="Reference Data" activeChild="Activities & Tasks">
        <Alert title="We couldn't load the activity catalog">
          Refresh the page, and if it keeps happening, contact your administrator.
        </Alert>
      </AppShell>
    )
  }

  const headers = tab === 'activities' ? ACTIVITY_HEADERS : TASK_HEADERS
  const blockedActivity = deletingActivity ? activityUsage(deletingActivity.id) : null
  const blockedActivityCount = blockedActivity ? blockedActivity.assignments + blockedActivity.entries : 0
  const blockedTaskCount = deletingTask ? taskUsage(deletingTask.name) : 0

  return (
    <AppShell
      title="Activities & Tasks"
      activeItem="Reference Data"
      activeChild="Activities & Tasks"
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 400 }}>
            <label htmlFor="catalog-search" className="sr-only">Search activities and tasks</label>
            <Input size="sm" id="catalog-search" value={query}
              onChange={(e) => { setQuery(e.target.value); resetVisible() }}
              placeholder={tab === 'activities' ? 'Search by activity, description or task...' : 'Search by task or activity...'}
              leadingIcon={<Search size={16} />} />
          </div>
          {tab === 'activities'
            ? <Button leadingIcon={<Plus size={16} />} onClick={() => setActivityDrawer({ mode: 'create' })}>Add Activity</Button>
            : <Button leadingIcon={<Plus size={16} />} onClick={() => setTaskDrawer({ mode: 'create' })}>Add Task</Button>}
        </>
      }
    >
      <div className="grid gap-lg">
        {toast && <Alert tone="info" title={toast} />}

        {brokenCount > 0 && (
          <Alert tone="danger" title={`${brokenCount} ${brokenCount === 1 ? 'activity requires' : 'activities require'} a task but have none linked`}>
            Time Entry cannot be completed against them. Link a task, or turn off “Task required”.
          </Alert>
        )}

        <p className="text-sm text-text-secondary">
          {tab === 'activities'
            ? 'Activities are created here and only selected inside a project. Each carries the tasks Time Entry offers once it is chosen.'
            : 'Tasks sit below activities and are shared: one task can belong to several activities. Link them from either side.'}
        </p>

        <div className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
          {tabs}
          {!loading && rowCount === 0 ? (
            <EmptyState
              icon={<ListChecks size={48} strokeWidth={1.5} />}
              title={query ? `No ${tab} match your search` : `No ${tab} yet`}
              description={query ? 'Try a different term.'
                : tab === 'activities'
                  ? 'Add the disciplines that perform work, then link the tasks each one covers.'
                  : 'Add the tasks people log time against, then link them to the activities they belong to.'}
              action={query
                ? <Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>
                : tab === 'activities'
                  ? <Button leadingIcon={<Plus size={16} />} onClick={() => setActivityDrawer({ mode: 'create' })}>Add Activity</Button>
                  : <Button leadingIcon={<Plus size={16} />} onClick={() => setTaskDrawer({ mode: 'create' })}>Add Task</Button>}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left" style={{ minWidth: tab === 'activities' ? 1180 : 900 }}>
                  <caption className="sr-only">{tab === 'activities' ? 'Catalog activities' : 'Catalog tasks'}</caption>
                  <thead>
                    <tr className="border-b border-border-default bg-neutral-50">
                      {headers.map((h) => (
                        <th key={h} scope="col" className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-secondary">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 6 }, (_, i) => (
                          <tr key={i} className="border-b border-border-default last:border-b-0">
                            {headers.map((h) => <td key={h} className="px-lg py-base"><Skeleton className="h-4 w-full" /></td>)}
                          </tr>
                        ))
                      : tab === 'activities'
                        ? shownActivities.slice(0, visibleCount).map((a) => {
                            const linked = tasksForActivity(catalog, a.id)
                            const broken = isMisconfigured(catalog, a)
                            return (
                              <tr key={a.id} onClick={() => setActivityDrawer({ mode: 'view', activity: a })}
                                className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle">
                                <td className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-primary">{a.name}</td>
                                <td className="px-lg py-base text-sm text-text-primary" style={{ maxWidth: 300 }}>
                                  <Truncate>{a.description || '—'}</Truncate>
                                </td>
                                <td className="whitespace-nowrap px-lg py-base text-sm">
                                  {a.nonProject ? <span className="text-text-muted">Not applicable</span>
                                    : linked.length === 0
                                      ? <span className={broken ? 'font-semibold text-danger' : 'text-text-muted'}>None</span>
                                      : <button type="button"
                                          onClick={(e) => { e.stopPropagation(); setQuery(a.name); setTab('tasks'); resetVisible() }}
                                          className="text-text-primary underline-offset-2 hover:text-accent hover:underline">
                                          {linked.length} task{linked.length === 1 ? '' : 's'}
                                        </button>}
                                </td>
                                <td className="whitespace-nowrap px-lg py-base"><YesNo on={a.taskRequired} /></td>
                                <td className="whitespace-nowrap px-lg py-base"><YesNo on={a.isDefault} /></td>
                                <td className="whitespace-nowrap px-lg py-base">
                                  <Badge tone={a.nonProject ? 'info' : 'neutral'}>{a.nonProject ? 'Non-project' : 'Project work'}</Badge>
                                </td>
                                <td className="whitespace-nowrap px-lg py-base"><YesNo on={a.active} yes="Active" no="Inactive" /></td>
                                <td className="px-lg py-base" onClick={(e) => e.stopPropagation()}>
                                  <ActionsMenu
                                    ariaLabel={`Actions for activity ${a.name}`}
                                    items={[
                                      { label: 'View', icon: <Eye size={16} />, onSelect: () => setActivityDrawer({ mode: 'view', activity: a }) },
                                      { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setActivityDrawer({ mode: 'edit', activity: a }) },
                                      ...(a.nonProject ? [] : [{ label: 'Add task to this activity', icon: <Plus size={16} />, onSelect: () => setTaskDrawer({ mode: 'create', presetActivityId: a.id }) }]),
                                      { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeletingActivity(a), tone: 'danger' as const },
                                    ]}
                                  />
                                </td>
                              </tr>
                            )
                          })
                        : shownTasks.slice(0, visibleCount).map((t) => {
                            const owners = activitiesForTask(catalog, t.id)
                            const used = taskUsage(t.name)
                            return (
                              <tr key={t.id} onClick={() => setTaskDrawer({ mode: 'view', task: t })}
                                className="cursor-pointer border-b border-border-default transition-colors duration-fast last:border-b-0 hover:bg-accent-subtle">
                                <td className="whitespace-nowrap px-lg py-base text-sm font-semibold text-text-primary">{t.name}</td>
                                <td className="px-lg py-base text-sm">
                                  {owners.length === 0
                                    ? <span className="text-text-muted">Not linked yet</span>
                                    : <span className="flex flex-wrap gap-xs">
                                        {owners.map((a) => (
                                          <span key={a.id} className="whitespace-nowrap rounded-sm bg-neutral-100 px-sm py-xxss text-xs text-text-secondary">{a.name}</span>
                                        ))}
                                      </span>}
                                </td>
                                <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">
                                  {used === 0 ? <span className="text-text-muted">—</span> : `${used} ${used === 1 ? 'entry' : 'entries'}`}
                                </td>
                                <td className="whitespace-nowrap px-lg py-base"><YesNo on={t.active} yes="Active" no="Inactive" /></td>
                                <td className="px-lg py-base" onClick={(e) => e.stopPropagation()}>
                                  <ActionsMenu
                                    ariaLabel={`Actions for task ${t.name}`}
                                    items={[
                                      { label: 'View', icon: <Eye size={16} />, onSelect: () => setTaskDrawer({ mode: 'view', task: t }) },
                                      { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setTaskDrawer({ mode: 'edit', task: t }) },
                                      { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeletingTask(t), tone: 'danger' as const },
                                    ]}
                                  />
                                </td>
                              </tr>
                            )
                          })}
                  </tbody>
                </table>
              </div>
              {!loading && (
                <AutoLoadFooter total={rowCount} visibleCount={visibleCount} loading={loadingMore}
                  onLoadMore={loadMore} itemLabel={tab} />
              )}
            </>
          )}
        </div>
      </div>

      {activityDrawer && (
        <ActivityCatalogDrawer
          mode={activityDrawer.mode}
          catalog={catalog}
          initial={activityDrawer.activity}
          usage={activityDrawer.activity ? activityUsage(activityDrawer.activity.id) : undefined}
          onClose={() => setActivityDrawer(null)}
          onSubmit={(a, taskIds) => {
            saveActivity(a, taskIds)
            setToast(activityDrawer.mode === 'create' ? `Activity “${a.name}” added.` : `Activity “${a.name}” saved.`)
          }}
        />
      )}

      {taskDrawer && (
        <TaskDrawer
          mode={taskDrawer.mode}
          catalog={catalog}
          initial={taskDrawer.task}
          entryCount={taskDrawer.task ? taskUsage(taskDrawer.task.name) : 0}
          presetActivityId={taskDrawer.presetActivityId}
          onClose={() => setTaskDrawer(null)}
          onSubmit={(t, activityIds) => {
            saveTask(t, activityIds)
            setToast(taskDrawer.mode === 'create' ? `Task “${t.name}” added.` : `Task “${t.name}” saved.`)
          }}
        />
      )}

      {/* Deleting something the records still point at would leave orphaned
          ids behind, so it is refused and deactivation offered instead. */}
      <ConfirmDialog
        open={!!deletingActivity}
        title={blockedActivityCount > 0 ? `“${deletingActivity?.name}” is in use` : `Delete “${deletingActivity?.name}”?`}
        description={blockedActivityCount > 0
          ? `${blockedActivity?.assignments} work-package assignment${blockedActivity?.assignments === 1 ? '' : 's'} and ${blockedActivity?.entries} timesheet ${blockedActivity?.entries === 1 ? 'entry' : 'entries'} reference this activity, so it cannot be deleted without leaving them pointing at nothing. Retiring it keeps those records intact and takes it out of every picker.`
          : 'This activity and its task associations will be removed. The tasks themselves stay. This cannot be undone.'}
        confirmLabel={blockedActivityCount > 0 ? 'Retire it instead' : 'Delete activity'}
        cancelLabel="Cancel"
        tone={blockedActivityCount > 0 ? 'primary' : 'danger'}
        onConfirm={confirmDeleteActivity}
        onCancel={() => setDeletingActivity(null)}
      />

      <ConfirmDialog
        open={!!deletingTask}
        title={blockedTaskCount > 0 ? `“${deletingTask?.name}” is in use` : `Delete “${deletingTask?.name}”?`}
        description={blockedTaskCount > 0
          ? `${blockedTaskCount} timesheet ${blockedTaskCount === 1 ? 'entry names' : 'entries name'} this task, so it cannot be deleted. Retiring it keeps those hours intact and takes it out of the Time Entry picklist.`
          : 'This task and its activity associations will be removed. The activities themselves stay. This cannot be undone.'}
        confirmLabel={blockedTaskCount > 0 ? 'Retire it instead' : 'Delete task'}
        cancelLabel="Cancel"
        tone={blockedTaskCount > 0 ? 'primary' : 'danger'}
        onConfirm={confirmDeleteTask}
        onCancel={() => setDeletingTask(null)}
      />
    </AppShell>
  )
}
