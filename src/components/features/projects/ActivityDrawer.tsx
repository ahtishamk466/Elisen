import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { activityName, assignableActivities, tasksForActivity } from '@/lib/catalog'
import { useCatalogStore } from '@/stores/catalogStore'
import { PEOPLE } from '@/lib/projectFixtures'
import { useProjectLabel } from './useProjectLabel'
import type { WorkPackage, WorkPackageActivity } from '@/types/workPackage'

export interface ActivityDrawerProps {
  mode: 'create' | 'edit'
  workPackage: WorkPackage
  /** Activity ids already assigned to this package (hidden from the picker). */
  usedActivityIds: string[]
  initial?: WorkPackageActivity
  onClose: () => void
  onSubmit: (a: WorkPackageActivity) => void
}

export function ActivityDrawer({ mode, workPackage, usedActivityIds, initial, onClose, onSubmit }: ActivityDrawerProps) {
  const isEdit = mode === 'edit'
  const label = useProjectLabel(workPackage.projectId)
  const [activityId, setActivityId] = useState(initial?.activityId ?? '')
  const [responsible, setResponsible] = useState(initial?.responsible ?? '')
  const [budgetHours, setBudgetHours] = useState(initial ? String(initial.budgetHours) : '')
  const [errors, setErrors] = useState<{ activityId?: string; responsible?: string; budgetHours?: string }>({})

  const catalogActivities = useCatalogStore((s) => s.activities)
  const catalogTasks = useCatalogStore((s) => s.tasks)
  const links = useCatalogStore((s) => s.links)
  const catalog = { activities: catalogActivities, tasks: catalogTasks, links }

  /* Assignable = active project activities, defaults first. Ones already on this
     package drop out so the same activity can't be added twice. */
  const options = assignableActivities(catalogActivities)
    .filter((a) => a.id === initial?.activityId || !usedActivityIds.includes(a.id))
  const tasks = activityId ? tasksForActivity(catalog, activityId, true) : []

  const submit = () => {
    const e: typeof errors = {}
    if (!activityId) e.activityId = 'Pick an activity from the standard list.'
    if (!responsible) e.responsible = 'Responsible person is required.'
    if (budgetHours !== '' && (Number.isNaN(Number(budgetHours)) || Number(budgetHours) < 0))
      e.budgetHours = 'Enter a positive number of hours.'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      workPackageId: workPackage.id,
      activityId,
      responsible,
      budgetHours: budgetHours === '' ? 0 : Number(budgetHours),
      actualHours: initial?.actualHours ?? 0,
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={
        isEdit
          ? `Edit Activity “${activityName(catalogActivities, initial!.activityId)}”: ${workPackage.title} · ${label}`
          : `Add Activity to “${workPackage.title}”: ${label}`
      }
      footer={
        <>
          <div className="flex gap-sm">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Add Activity'}</Button>
          </div>
        </>
      }
    >
      <FormSection
        title="Activity"
        subtitle="Who performs this work. Activities come from the standard list, the package title carries the what."
      >
        {isEdit ? (
          <FormField label="Activity" htmlFor="act-name">
            <Input id="act-name" placeholder="e.g. Design Review" value={activityName(catalogActivities, initial!.activityId)} disabled />
          </FormField>
        ) : (
          <FormField label="Activity" htmlFor="act-select" required error={errors.activityId}>
            <Select id="act-select" value={activityId} error={!!errors.activityId} placeholder="Select an activity..."
              onChange={(e) => { setActivityId(e.target.value); setErrors((p) => ({ ...p, activityId: undefined })) }}>
              {options.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </FormField>
        )}
        <FormField label="Responsible" htmlFor="act-resp" required error={errors.responsible}>
          <PersonSelect id="act-resp" value={responsible} error={!!errors.responsible} people={PEOPLE}
            onChange={(v) => { setResponsible(v); setErrors((p) => ({ ...p, responsible: undefined })) }} />
        </FormField>
        <FormField label="Budget Hours" htmlFor="act-budget" error={errors.budgetHours}
          help="Per activity, rolled up on the package.">
          <Input id="act-budget" value={budgetHours} error={!!errors.budgetHours} inputMode="decimal" placeholder="0"
            onChange={(e) => { setBudgetHours(e.target.value); setErrors((p) => ({ ...p, budgetHours: undefined })) }} />
        </FormField>
        <FormField label="Tasks" htmlFor="act-tasks"
          help="Set in Reference Data → Activities & Tasks.">
          <div id="act-tasks" className="flex min-h-11 flex-wrap items-center gap-xs rounded-sm border border-border-default bg-neutral-50 px-base py-sm">
            {tasks.length === 0 ? (
              <span className="text-sm text-text-muted">{activityId ? 'No tasks associated with this activity.' : 'Pick an activity to see its tasks.'}</span>
            ) : (
              tasks.map((t) => (
                <span key={t.id} className="rounded-sm bg-neutral-100 px-sm py-xxss text-xs text-text-secondary">{t.name}</span>
              ))
            )}
          </div>
        </FormField>
      </FormSection>
    </Drawer>
  )
}
