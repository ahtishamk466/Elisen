import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { activitiesForTask, type Catalog } from '@/lib/catalog'
import { taskId as slugTask } from '@/lib/catalogFixtures'
import type { Task } from '@/types/catalog'

export interface TaskDrawerProps {
  mode: 'create' | 'edit' | 'view'
  catalog: Catalog
  initial?: Task
  /** Timesheet entries naming this task — a rename leaves them behind. */
  entryCount?: number
  /** Pre-link to this activity when opened from an activity's row. */
  presetActivityId?: string
  onClose: () => void
  onSubmit: (task: Task, activityIds: string[]) => void
}

/**
 * The same activity–task associations as the Activity drawer, edited from the
 * other side: **create a task and assign it to any activities from a dropdown**.
 *
 * Both directions write the same links, so whichever way an association is made
 * it shows on both tabs — the alternative, one-way linking, leaves the Tasks tab
 * looking empty for tasks that are in fact well associated.
 */
export function TaskDrawer({ mode, catalog, initial, entryCount = 0, presetActivityId, onClose, onSubmit }: TaskDrawerProps) {
  const readOnly = mode === 'view'
  const [name, setName] = useState(initial?.name ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [activityIds, setActivityIds] = useState<string[]>(
    initial
      ? activitiesForTask(catalog, initial.id).map((a) => a.id)
      : presetActivityId ? [presetActivityId] : [],
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const renaming = !!initial && name.trim() !== initial.name

  const submit = () => {
    const e: Record<string, string> = {}
    const trimmed = name.trim()
    if (!trimmed) e.name = 'Name is required.'
    else if (catalog.tasks.some((t) => t.id !== initial?.id && t.name.toLowerCase() === trimmed.toLowerCase()))
      e.name = 'Another task already uses this name.'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    onSubmit(
      { id: initial?.id ?? (slugTask(trimmed) || crypto.randomUUID()), name: trimmed, active },
      activityIds,
    )
    onClose()
  }

  // Non-project activities are excluded: their time is logged directly, so a
  // task under one could never be reached.
  const activityOptions = catalog.activities
    .filter((a) => !a.nonProject && (a.active || activityIds.includes(a.id)))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => ({ value: a.id, label: a.name, hint: a.active ? undefined : 'Inactive' }))

  return (
    <Drawer
      open
      onClose={onClose}
      title={mode === 'create' ? 'Add Task' : mode === 'edit' ? `Edit Task: ${initial!.name}` : initial!.name}
      footer={
        <div className="flex gap-sm">
          <Button variant="secondary" onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>
          {!readOnly && <Button onClick={submit}>{mode === 'create' ? 'Add Task' : 'Save Changes'}</Button>}
        </div>
      }
    >
      <FormSection title="Task" subtitle="A step below an activity. Shared: one task can sit under several activities.">
        <FormField label="Name" htmlFor="td-name" required error={errors.name}>
          <Input id="td-name" value={name} error={!!errors.name} disabled={readOnly}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })) }} />
        </FormField>
        {/* Timesheet entries store the task by name, so a rename does not reach
            back into hours already logged. Said plainly rather than blocked —
            fixing a typo is legitimate. */}
        {renaming && entryCount > 0 && (
          <Alert tone="info" title={`${entryCount} logged ${entryCount === 1 ? 'entry names' : 'entries name'} “${initial!.name}”`}>
            Those entries keep the old name. Rename only to correct it, not to repurpose the task.
          </Alert>
        )}
        <FormField label="Active" htmlFor="td-active"
          help="Inactive tasks stay on old entries but disappear from the Time Entry picklist.">
          <Checkbox id="td-active" checked={active} disabled={readOnly}
            onChange={(e) => setActive(e.target.checked)} label="Available to pick" />
        </FormField>
      </FormSection>

      <FormSection title="Activities" subtitle="Where this task appears. Leave empty to park it until it is needed.">
        <FormField label="Linked activities" htmlFor="td-activities"
          help="Time Entry offers this task once one of these activities is chosen.">
          <MultiSelect id="td-activities" value={activityIds} options={activityOptions} disabled={readOnly}
            placeholder="Search activities..." emptyLabel="No activities exist yet."
            onChange={setActivityIds} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
