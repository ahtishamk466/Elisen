import { useState } from 'react'
import { Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { useWorkPackagesStore } from '@/stores/workPackagesStore'
import { activityName } from '@/lib/activityCatalog'
import { WorkPackageCard } from './WorkPackageCard'
import { WorkPackageDrawer } from './WorkPackageDrawer'
import { ActivityDrawer } from './ActivityDrawer'
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

  const [adding, setAdding] = useState(false)
  const [editingWp, setEditingWp] = useState<WorkPackage | null>(null)
  const [deletingWp, setDeletingWp] = useState<WorkPackage | null>(null)
  const [completingWp, setCompletingWp] = useState<WorkPackage | null>(null)
  const [addingActivityTo, setAddingActivityTo] = useState<WorkPackage | null>(null)
  const [editingActivity, setEditingActivity] = useState<{ wp: WorkPackage; activity: WorkPackageActivity } | null>(null)
  const [removingActivity, setRemovingActivity] = useState<WorkPackageActivity | null>(null)

  const list = workPackages.filter((w) => w.projectId === projectId)
  const activitiesOf = (wpId: string) => activities.filter((a) => a.workPackageId === wpId)
  const loggedHours = (wpId: string) => activitiesOf(wpId).reduce((s, a) => s + a.actualHours, 0)

  const deleteBlocked = deletingWp ? loggedHours(deletingWp.id) > 0 : false
  const removeActivityBlocked = removingActivity ? removingActivity.actualHours > 0 : false

  return (
    <div className="grid gap-lg">
      {list.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<Package size={48} strokeWidth={1.5} />}
            title="No work packages yet"
            description="Break this project into its scopes of work — anything from adding a USB plug to a full seat installation — then assign activities and budget hours to each."
            action={<Button leadingIcon={<Plus size={16} />} onClick={() => setAdding(true)}>Add Work Package</Button>}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-lg">
            <p className="text-sm text-text-secondary">
              {list.length} work package{list.length === 1 ? '' : 's'} · budget is entered per activity and rolled up per package
            </p>
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
            ? `"${deletingWp?.title}" has ${deletingWp ? loggedHours(deletingWp.id) : 0} logged hours against its activities. Deleting it would orphan those time records — mark it complete instead.`
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

      <ConfirmDialog
        open={!!removingActivity}
        title={removeActivityBlocked ? "This activity can't be removed" : 'Remove this activity?'}
        description={
          removeActivityBlocked
            ? `${removingActivity ? activityName(removingActivity.activityId) : ''} has ${removingActivity?.actualHours}h logged in Time Entry. Removing it would orphan those records.`
            : `${removingActivity ? activityName(removingActivity.activityId) : ''} and its budget will be removed from this package.`
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
