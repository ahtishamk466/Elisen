import { Drawer } from '@/components/patterns/Drawer'
import { DetailCard, DetailField } from '@/components/patterns/DetailView'
import { PersonCell } from '@/components/patterns/PersonCell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { activityName, tasksForActivity, type Catalog } from '@/lib/catalog'
import { HEALTH_LABEL, HEALTH_TONE, formatHours, formatPct, healthOf } from '@/lib/projectHealth'
import type { WorkPackage, WorkPackageActivity } from '@/types/workPackage'

export interface ActivityViewDrawerProps {
  activity: WorkPackageActivity
  workPackage: WorkPackage
  catalog: Catalog
  onClose: () => void
  onEdit: () => void
  onRemove: () => void
}

/**
 * One activity in full: its budget, who owns it, and **every task it carries**.
 *
 * The row can only show two task chips before it would break the two-line rule,
 * so "+N more" opens this rather than expanding the row — the table keeps its
 * shape and the full list gets somewhere it can be read properly. Edit and
 * Delete sit here too, so the row's menu and this view offer the same actions.
 */
export function ActivityViewDrawer({ activity, workPackage, catalog, onClose, onEdit, onRemove }: ActivityViewDrawerProps) {
  const health = healthOf(activity.budgetHours, activity.actualHours, workPackage.status === 'complete')
  const tasks = tasksForActivity(catalog, activity.activityId, true)
  const name = activityName(catalog.activities, activity.activityId)

  return (
    <Drawer
      open
      onClose={onClose}
      title={`${name}: ${workPackage.title}`}
      footer={
        <div className="flex w-full items-center justify-between gap-sm">
          <Button variant="tertiary" onClick={() => { onRemove(); onClose() }}>Remove activity</Button>
          <div className="flex gap-sm">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button onClick={() => { onEdit(); onClose() }}>Edit</Button>
          </div>
        </div>
      }
    >
      {/* One card, everything about the activity — the app's standard View
          layout, the same as Company and Aircraft. */}
      <DetailCard title="Activity">
        <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
          <DetailField label="Activity">{name}</DetailField>
          <DetailField label="Work package">{workPackage.title}</DetailField>
          <DetailField label="Responsible"><PersonCell name={activity.responsible} /></DetailField>
          <DetailField label="Actual / Budget" nowrap>
            {health.budget > 0 ? `${formatHours(health.actual)} / ${formatHours(health.budget)}` : `${formatHours(health.actual)} / no budget`}
          </DetailField>
          <DetailField label="Remaining" nowrap>
            {health.budget > 0 ? `${health.remaining < 0 ? '\u2212' : ''}${formatHours(Math.abs(health.remaining))}` : undefined}
          </DetailField>
          <DetailField label="Used" nowrap>{formatPct(health.progressPct)}</DetailField>
          <DetailField label="Status">
            <Badge tone={HEALTH_TONE[health.state]}>{HEALTH_LABEL[health.state]}</Badge>
          </DetailField>
        </div>

        <div className="mt-2xl border-t border-border-default pt-lg">
          <h3 className="text-sm font-semibold text-text-primary">Tasks</h3>
          {tasks.length === 0 ? (
            <p className="mt-sm text-sm text-text-muted">No tasks linked to this activity.</p>
          ) : (
            <div className="mt-sm flex flex-wrap gap-xs">
              {tasks.map((t) => (
                <span key={t.id} className="whitespace-nowrap rounded-xs bg-neutral-100 px-sm py-xxss text-xs text-text-secondary">{t.name}</span>
              ))}
            </div>
          )}
        </div>
      </DetailCard>
    </Drawer>
  )
}
