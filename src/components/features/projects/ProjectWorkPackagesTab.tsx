import { useState } from 'react'
import { Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { useWorkPackagesStore } from '@/stores/workPackagesStore'
import { activityName } from '@/lib/catalog'
import { useCatalogStore } from '@/stores/catalogStore'
import { WorkPackageCard } from './WorkPackageCard'
import { WorkPackageDrawer } from './WorkPackageDrawer'
import { ActivityDrawer } from './ActivityDrawer'
import { ActivityViewDrawer } from './ActivityViewDrawer'
import type { WorkPackage, WorkPackageActivity } from '@/types/workPackage'

/**
 * Project → Work Package → Activity (→ Task, via the standard associations).
 * Work packages are free text with no defaults; activities are who does the
 * work; budget is per activity with a package roll-up. Actual hours arrive
 * from Time Entry, so packages/activities with logged time can't be deleted.
 */
export function ProjectWorkPackagesTab({ projectId }: { projectId: string }) {
  const workPackages = useWorkPackagesStore((s) => s.workPackages)
  const activities = useWorkPackagesStore((s) => s.activities)
  const { addWp, updateWp, removeWp, addActivity, updateActivity, removeActivity } = useWorkPackagesStore()
  const catalogActivities = useCatalogStore((s) => s.activities)
  const catalogTasks = useCatalogStore((s) => s.tasks)
  const catalogLinks = useCatalogStore((s) => s.links)

  const [adding, setAdding] = useState(false)
  const [editingWp, setEditingWp] = useState<WorkPackage | null>(null)
  const [deletingWp, setDeletingWp] = useState<WorkPackage | null>(null)
  const [completingWp, setCompletingWp] = useState<WorkPackage | null>(null)
  const [addingActivityTo, setAddingActivityTo] = useState<WorkPackage | null>(null)
  const [editingActivity, setEditingActivity] = useState<{ wp: WorkPackage; activity: WorkPackageActivity } | null>(null)
  const [removingActivity, setRemovingActivity] = useState<WorkPackageActivity | null>(null)
  const [viewingActivity, setViewingActivity] = useState<{ wp: WorkPackage; activity: WorkPackageActivity } | null>(null)

  const list = workPackages.filter((w) => w.projectId === projectId)
  const activitiesOf = (wpId: string) => activities.filter((a) => a.workPackageId === wpId)
  const loggedHours = (wpId: string) => activitiesOf(wpId).reduce((s, a) => s + a.actualHours, 0)

  const totalActivities = list.reduce((n, wp) => n + activitiesOf(wp.id).length, 0)
  const statusCount = (status: WorkPackage['status']) => list.filter((wp) => wp.status === status).length

  const deleteBlocked = deletingWp ? loggedHours(deletingWp.id) > 0 : false
  const removeActivityBlocked = removingActivity ? removingActivity.actualHours > 0 : false

  return (
    <div className="grid gap-lg">
      {list.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<Package size={48} strokeWidth={1.5} />}
            title="No work packages yet"
            description="Break this project into its scopes of work, anything from adding a USB plug to a full seat installation, then assign activities and budget hours to each."
            action={<Button leadingIcon={<Plus size={16} />} onClick={() => setAdding(true)}>Add Work Package</Button>}
          />
        </div>
      ) : (
        <>
          {/* The project's structure at a glance. Deliberately a single short
              row, not another band of stat cards: the four budget tiles above
              already own that weight, and this answers a smaller question —
              how much is in here, and where does it stand. */}
          <div className="flex flex-wrap items-end justify-between gap-lg rounded-sm border border-border-default bg-neutral-25 px-lg py-base">
            {/* border-default is neutral-200 — each figure gets its own bay,
                so five numbers read as five stats rather than one long row. */}
            <dl className="flex flex-wrap items-stretch gap-y-base divide-x divide-border-default">
              <Stat label="Work packages" value={list.length} />
              <Stat label="Activities" value={totalActivities} />
              <Stat label="Not started" value={statusCount('not-started')} />
              <Stat label="In progress" value={statusCount('in-progress')} />
              <Stat label="Complete" value={statusCount('complete')} />
            </dl>
            <Button leadingIcon={<Plus size={16} />} onClick={() => setAdding(true)}>
              Add Work Package
            </Button>
          </div>

          {list.map((wp, i) => (
            <WorkPackageCard
              key={wp.id}
              wp={wp}
              activities={activitiesOf(wp.id)}
              defaultOpen={i === 0}
              onEdit={() => setEditingWp(wp)}
              onDelete={() => setDeletingWp(wp)}
              onToggleComplete={() => setCompletingWp(wp)}
              onAddActivity={() => setAddingActivityTo(wp)}
              onEditActivity={(a) => setEditingActivity({ wp, activity: a })}
              onRemoveActivity={setRemovingActivity}
              onViewActivity={(a) => setViewingActivity({ wp, activity: a })}
            />
          ))}
        </>
      )}

      {adding && (
        <WorkPackageDrawer mode="create" projectId={projectId} onClose={() => setAdding(false)} onSubmit={addWp} />
      )}
      {editingWp && (
        <WorkPackageDrawer mode="edit" projectId={projectId} initial={editingWp} onClose={() => setEditingWp(null)} onSubmit={(wp) => updateWp(editingWp.id, wp)} />
      )}
      {addingActivityTo && (
        <ActivityDrawer
          mode="create"
          workPackage={addingActivityTo}
          usedActivityIds={activitiesOf(addingActivityTo.id).map((a) => a.activityId)}
          onClose={() => setAddingActivityTo(null)}
          onSubmit={addActivity}
        />
      )}
      {editingActivity && (
        <ActivityDrawer
          mode="edit"
          workPackage={editingActivity.wp}
          usedActivityIds={activitiesOf(editingActivity.wp.id).map((a) => a.activityId)}
          initial={editingActivity.activity}
          onClose={() => setEditingActivity(null)}
          onSubmit={(a) => updateActivity(editingActivity.activity.id, a)}
        />
      )}

      <ConfirmDialog
        open={!!completingWp}
        title={completingWp?.status === 'complete' ? 'Reopen this work package?' : 'Mark this work package as complete?'}
        description={
          completingWp?.status === 'complete'
            ? `"${completingWp?.title}" will go back to In Progress.`
            : `"${completingWp?.title}" will be marked complete. You can reopen it later.`
        }
        confirmLabel={completingWp?.status === 'complete' ? 'Reopen' : 'Mark as complete'}
        onConfirm={() => {
          if (completingWp) updateWp(completingWp.id, { status: completingWp.status === 'complete' ? 'in-progress' : 'complete' })
          setCompletingWp(null)
        }}
        onCancel={() => setCompletingWp(null)}
      />

      <ConfirmDialog
        open={!!deletingWp}
        title={deleteBlocked ? "This work package can't be deleted" : 'Delete this work package?'}
        description={
          deleteBlocked
            ? `"${deletingWp?.title}" has ${deletingWp ? loggedHours(deletingWp.id) : 0} logged hours against its activities. Deleting it would orphan those time records, mark it complete instead.`
            : `"${deletingWp?.title}" and its activity assignments will be permanently removed. This cannot be undone.`
        }
        confirmLabel={deleteBlocked ? 'Understood' : 'Delete work package'}
        tone={deleteBlocked ? 'primary' : 'danger'}
        onConfirm={() => {
          if (!deleteBlocked && deletingWp) removeWp(deletingWp.id)
          setDeletingWp(null)
        }}
        onCancel={() => setDeletingWp(null)}
      />

      {viewingActivity && (
        <ActivityViewDrawer
          key={viewingActivity.activity.id}
          activity={viewingActivity.activity}
          workPackage={viewingActivity.wp}
          catalog={{ activities: catalogActivities, tasks: catalogTasks, links: catalogLinks }}
          onClose={() => setViewingActivity(null)}
          onEdit={() => setEditingActivity({ wp: viewingActivity.wp, activity: viewingActivity.activity })}
          onRemove={() => setRemovingActivity(viewingActivity.activity)}
        />
      )}

      <ConfirmDialog
        open={!!removingActivity}
        title={removeActivityBlocked ? "This activity can't be removed" : 'Remove this activity?'}
        description={
          removeActivityBlocked
            ? `${removingActivity ? activityName(catalogActivities, removingActivity.activityId) : ''} has ${removingActivity?.actualHours}h logged in Time Entry. Removing it would orphan those records.`
            : `${removingActivity ? activityName(catalogActivities, removingActivity.activityId) : ''} and its budget will be removed from this package.`
        }
        confirmLabel={removeActivityBlocked ? 'Understood' : 'Remove activity'}
        tone={removeActivityBlocked ? 'primary' : 'danger'}
        onConfirm={() => {
          if (!removeActivityBlocked && removingActivity) removeActivity(removingActivity.id)
          setRemovingActivity(null)
        }}
        onCancel={() => setRemovingActivity(null)}
      />
    </div>
  )
}

/** One label/value pair in the structure strip. A `<dl>` because that is what
    this is — terms and their values — and it gives screen readers the pairing
    for free. */
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-2xl first:pl-0 last:pr-0">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="text-lg font-bold text-text-primary">{value}</dd>
    </div>
  )
}
