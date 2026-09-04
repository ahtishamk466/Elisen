import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { DetailCard, DetailField } from '@/components/patterns/DetailView'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Textarea } from '@/components/ui/Textarea'
import { tasksForActivity, type Catalog } from '@/lib/catalog'
import type { Activity } from '@/types/catalog'
import { ActiveSelect } from '@/components/patterns/ActiveSelect'

export interface ActivityCatalogDrawerProps {
  mode: 'create' | 'edit' | 'view'
  catalog: Catalog
  initial?: Activity
  /** How many records already point at this activity — blocks a rename to a
      duplicate, and warns before retiring something in use. */
  usage?: { assignments: number; entries: number }
  onClose: () => void
  onSubmit: (activity: Activity, taskIds: string[]) => void
}

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/**
 * Create or edit a catalog activity, **and its task associations in the same
 * form**. The client's own system splits these into two screens (Activities,
 * then Activity Tasks with a dual list), which means creating an activity
 * always takes two trips. One drawer with a searchable multi-select does the
 * same job in one, and the associations are still editable from the Task side.
 */
export function ActivityCatalogDrawer({ mode, catalog, initial, usage, onClose, onSubmit }: ActivityCatalogDrawerProps) {
  const readOnly = mode === 'view'
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [taskRequired, setTaskRequired] = useState(initial?.taskRequired ?? false)
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false)
  const [nonProject, setNonProject] = useState(initial?.nonProject ?? false)
  const [active, setActive] = useState(initial?.active ?? true)
  const [taskIds, setTaskIds] = useState<string[]>(
    initial ? tasksForActivity(catalog, initial.id).map((t) => t.id) : [],
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const inUse = (usage?.assignments ?? 0) + (usage?.entries ?? 0)

  const submit = () => {
    const e: Record<string, string> = {}
    const trimmed = name.trim()
    if (!trimmed) e.name = 'Name is required.'
    else if (catalog.activities.some((a) => a.id !== initial?.id && a.name.toLowerCase() === trimmed.toLowerCase()))
      e.name = 'Another activity already uses this name.'
    // A required task with nothing to pick from is unfillable at Time Entry.
    if (taskRequired && taskIds.length === 0)
      e.tasks = 'Link at least one task, or turn off “Task required”.'
    // Non-project time is logged directly and never assigned, so a task list
    // would never be reachable.
    if (nonProject && taskIds.length > 0)
      e.tasks = 'Non-project activities cannot carry tasks. Remove them, or untick “Non-project time”.'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    onSubmit({
      id: initial?.id ?? (slug(trimmed) || crypto.randomUUID()),
      name: trimmed, description: description.trim(), taskRequired, isDefault, nonProject, active,
    }, nonProject ? [] : taskIds)
    onClose()
  }

  const taskOptions = catalog.tasks
    .filter((t) => t.active || taskIds.includes(t.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({ value: t.id, label: t.name, hint: t.active ? undefined : 'Inactive' }))

  return (
    <Drawer
      open
      onClose={onClose}
      title={mode === 'create' ? 'Add Activity' : mode === 'edit' ? `Edit Activity: ${initial!.name}` : initial!.name}
      footer={
        <div className="flex gap-sm">
          <Button variant="secondary" onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>
          {!readOnly && <Button onClick={submit}>{mode === 'create' ? 'Add Activity' : 'Save Changes'}</Button>}
        </div>
      }
    >
      {/* View is read-only text, never dimmed inputs — a disabled field renders
          a real value in the same grey as an empty one. */}
      {readOnly ? (
        <DetailCard title="Activity">
          <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
            <DetailField label="Name">{initial!.name}</DetailField>
            <DetailField label="Type">{initial!.nonProject ? 'Non-project time' : 'Project work'}</DetailField>
            <DetailField label="Active">{initial!.active ? 'Active' : 'Inactive'}</DetailField>
            <DetailField label="Task required">{initial!.taskRequired ? 'Yes' : 'No'}</DetailField>
            <DetailField label="Default">{initial!.isDefault ? 'Yes' : 'No'}</DetailField>
            <DetailField label="Used by">
              {inUse === 0 ? 'Not used yet' : `${usage?.assignments ?? 0} assignments, ${usage?.entries ?? 0} entries`}
            </DetailField>
          </div>
          <div className="col-span-full mt-lg">
            <DetailField label="Description">{initial!.description}</DetailField>
          </div>

          <div className="mt-2xl border-t border-border-default pt-lg">
            <h3 className="text-sm font-semibold text-text-primary">Tasks</h3>
            {initial!.nonProject ? (
              <p className="mt-sm text-sm text-text-muted">Non-project time carries no tasks.</p>
            ) : taskIds.length === 0 ? (
              <p className="mt-sm text-sm text-text-muted">No tasks linked to this activity.</p>
            ) : (
              <div className="mt-sm flex flex-wrap gap-xs">
                {tasksForActivity(catalog, initial!.id).map((t) => (
                  <span key={t.id} className="whitespace-nowrap rounded-xs bg-neutral-100 px-sm py-xxss text-xs text-text-secondary">{t.name}</span>
                ))}
              </div>
            )}
          </div>
        </DetailCard>
      ) : (
      <>
      <FormSection title="Activity" subtitle="Which discipline performs the work. Standard across every project.">
        <FormField label="Name" htmlFor="ac-name" required error={errors.name}>
          <Input id="ac-name" placeholder="e.g. Airworthiness" value={name} error={!!errors.name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })) }} />
        </FormField>
        <FormField label="Description" htmlFor="ac-desc">
          <Textarea id="ac-desc" placeholder="What this activity covers..." rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        <FormField label="Task required" htmlFor="ac-taskreq"
          help="On, Time Entry insists on a task.">
          <Checkbox id="ac-taskreq" checked={taskRequired}
            onChange={(e) => { setTaskRequired(e.target.checked); setErrors((p) => ({ ...p, tasks: '' })) }}
            label="Time Entry must name a task" />
        </FormField>
        <FormField label="Default" htmlFor="ac-default" help="Offered at the top of the activity picker.">
          <Checkbox id="ac-default" checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)} label="Show first when picking an activity" />
        </FormField>
        <FormField label="Non-project time" htmlFor="ac-nonproject"
          help="Holiday, sick leave, training — never budgeted.">
          <Checkbox id="ac-nonproject" checked={nonProject}
            onChange={(e) => { setNonProject(e.target.checked); setErrors((p) => ({ ...p, tasks: '' })) }}
            label="Not project work" />
        </FormField>
        <FormField label="Active" htmlFor="ac-active"
          help={inUse > 0 ? `Used by ${inUse} record${inUse === 1 ? '' : 's'}; they keep it.` : 'Inactive stays on old records, out of the pickers.'}>
          <ActiveSelect id="ac-active" value={active} onChange={setActive} inactiveLabel="Inactive (retired)" />
        </FormField>
      </FormSection>

      {!nonProject && (
        <FormSection title="Tasks" subtitle="The tasks Time Entry offers once this activity is chosen.">
          {errors.tasks && <Alert tone="danger" title={errors.tasks} />}
          <FormField label="Linked tasks" htmlFor="ac-tasks"
            help="A task can belong to several activities.">
            <MultiSelect id="ac-tasks" value={taskIds} options={taskOptions}
              placeholder="Search tasks..." emptyLabel="No tasks exist yet. Add them on the Tasks tab."
              onChange={(v) => { setTaskIds(v); setErrors((p) => ({ ...p, tasks: '' })) }} />
          </FormField>
        </FormSection>
      )}
      </>
      )}
    </Drawer>
  )
}
